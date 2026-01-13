
import React, { Component, useState, useEffect, useRef, ReactNode, ErrorInfo } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { User, UserRole, Companion } from './types';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import Auth from './components/Auth';
import VideoRoom from './components/VideoRoom';
import StaticPages from './components/StaticPages';
import { Database } from './services/database';
import { Wrench, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

// --- ERROR BOUNDARY (CRASH PREVENTION) ---

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Explicitly inheriting from Component with Generics to ensure proper 'props' and 'state' resolution in TypeScript
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Critical Application Error:", error, errorInfo);
    Database.logSystemEvent('ERROR', 'App Crash', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-white">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mb-6" />
          <h1 className="text-3xl font-black mb-4">Something went wrong.</h1>
          <p className="text-gray-400 mb-8 max-w-md">Our systems detected an unexpected issue. We have logged this report and notified our engineering team.</p>
          <button 
            onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }} 
            className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [activeSessionCompanion, setActiveSessionCompanion] = useState<Companion | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  
  const lastActivityRef = useRef<number>(Date.now());
  const location = useLocation();
  const navigate = useNavigate();

  // Restore session
  useEffect(() => {
    const init = async () => {
        const restored = await Database.restoreSession();
        if (restored) {
            setUser(restored);
            // If admin is at root, redirect
            if (restored.role === UserRole.ADMIN && location.pathname === '/') {
                navigate('/admin/dashboard');
            }
        }
        
        await Database.syncGlobalSettings();
        const settings = Database.getSettings();
        setMaintenanceMode(settings.maintenanceMode);
        
        setIsRestoring(false);
    };
    init();

    // Active Polling for Remote Settings (Maintenance/Sale Mode)
    const interval = setInterval(async () => {
        await Database.syncGlobalSettings(); // Pull from remote
        const currentSettings = Database.getSettings(); // Read updated local state
        setMaintenanceMode(currentSettings.maintenanceMode);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Session Timeout Logic
  useEffect(() => {
    const updateActivity = () => { 
        lastActivityRef.current = Date.now(); 
        if (showTimeoutWarning) setShowTimeoutWarning(false);
    };
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, updateActivity));
    return () => events.forEach(event => document.removeEventListener(event, updateActivity));
  }, [showTimeoutWarning]);

  useEffect(() => {
    const checkTimeout = () => {
      if (!user || activeSessionCompanion) return;
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      const timeoutLimit = user.role === UserRole.ADMIN ? 24 * 60 * 60 * 1000 : 15 * 60 * 1000;
      
      // Warn 1 minute before
      if (elapsed > timeoutLimit - 60000 && elapsed < timeoutLimit) {
          setShowTimeoutWarning(true);
      }
      
      if (elapsed > timeoutLimit) {
        setShowTimeoutWarning(false);
        handleLogout();
      }
    };
    const interval = setInterval(checkTimeout, 5000); // Check more frequently
    return () => clearInterval(interval);
  }, [user, activeSessionCompanion]);

  const handleLogin = async (role: UserRole, name: string, avatar?: string, email?: string, birthday?: string, provider: 'email' | 'google' | 'facebook' | 'x' = 'email', password?: string): Promise<void> => {
    const userEmail = email || `${name.toLowerCase().replace(/ /g, '.')}@example.com`;
    let currentUser: User;

    try {
        // --- REAL SUPABASE AUTHENTICATION ---
        // This ensures the session persists on refresh
        if (provider === 'email' && password) {
            // Attempt Login
            try {
                currentUser = await Database.login(userEmail, password);
            } catch (loginError: any) {
                // If login fails, try signup (if this was a signup attempt)
                if (authMode === 'signup' || loginError.message.includes('Invalid login credentials') === false) {
                     // Try creating user
                     currentUser = await Database.createUser(name, userEmail, password, provider);
                } else {
                    throw loginError;
                }
            }
        } else if (provider !== 'email') {
            // Social Login handling
            currentUser = await Database.createUser(name, userEmail, 'social-login-placeholder', provider);
        } else {
            throw new Error("Password required for email login");
        }
        
        currentUser = Database.checkAndIncrementStreak(currentUser);

        setUser(currentUser);
        Database.saveUserSession(currentUser);
        lastActivityRef.current = Date.now();
        setShowAuth(false);
        
        // Intelligent Redirect
        if (currentUser.role === UserRole.ADMIN) {
            navigate('/admin/dashboard');
        } else {
            navigate('/');
        }

    } catch (e: any) {
        console.error("Login Failed", e);
        const msg = e.message || "Please check your internet connection.";
        alert(`Login failed: ${msg}`);
        throw e;
    }
  };

  const handleLogout = async () => {
    await Database.logout();
    Database.clearSession();
    setUser(null);
    setActiveSessionCompanion(null);
    navigate('/');
  };

  if (isRestoring) return <div className="min-h-screen flex items-center justify-center bg-[#FFFBEB]"><div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div></div>;

  // Maintenance Mode Lockout
  if (maintenanceMode && (!user || user.role !== UserRole.ADMIN) && !location.pathname.includes('/support') && !location.pathname.includes('/admin')) {
      return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-6 text-center">
            <Wrench className="w-16 h-16 text-yellow-500 mb-6 animate-pulse" />
            <h1 className="text-4xl font-bold mb-4">System Maintenance</h1>
            <p className="text-gray-400">We'll be back shortly.</p>
            <button onClick={() => { setAuthMode('login'); setShowAuth(true); }} className="mt-8 opacity-0 hover:opacity-100 text-xs">Admin Entry</button>
        </div>
      );
  }

  if (activeSessionCompanion && user) {
    return <VideoRoom companion={activeSessionCompanion} onEndSession={() => setActiveSessionCompanion(null)} userName={user.name} />;
  }

  return (
    <ErrorBoundary>
      {showAuth && <Auth onLogin={handleLogin} onCancel={() => setShowAuth(false)} initialMode={authMode} />}
      
      {/* TIMEOUT WARNING MODAL */}
      {showTimeoutWarning && (
          <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl max-sm w-full text-center shadow-2xl border border-yellow-500">
                  <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
                  </div>
                  <h3 className="text-2xl font-black mb-2 dark:text-white">Are you still there?</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">Your secure session will time out in 60 seconds to protect your privacy.</p>
                  <button 
                      onClick={() => { lastActivityRef.current = Date.now(); setShowTimeoutWarning(false); }}
                      className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:scale-105 transition-transform"
                  >
                      I'm still here
                  </button>
              </div>
          </div>
      )}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
            user ? (
                user.role === UserRole.ADMIN ? <Navigate to="/admin/dashboard" /> : <Dashboard user={user} onLogout={handleLogout} onStartSession={(c) => setActiveSessionCompanion(c)} />
            ) : (
                <LandingPage onLoginClick={(signup) => { 
                    const requestedMode = signup ? 'signup' : 'login';
                    if (showAuth && authMode === requestedMode) {
                        setShowAuth(false);
                    } else {
                        setAuthMode(requestedMode);
                        setShowAuth(true);
                    }
                }} />
            )
        } />
        
        {/* Admin Sub-Site Routes */}
        <Route path="/admin" element={<Navigate to="/admin/login" />} />
        <Route path="/admin/login" element={<AdminLogin onLogin={(u) => { setUser(u); Database.saveUserSession(u); navigate('/admin/dashboard'); }} />} />
        <Route path="/admin/dashboard" element={
            user && user.role === UserRole.ADMIN ? (
                <AdminDashboard onLogout={handleLogout} />
            ) : (
                <Navigate to="/admin/login" />
            )
        } />

        {/* Static Pages */}
        <Route path="/about" element={<StaticPages type="about" />} />
        <Route path="/press" element={<StaticPages type="press" />} />
        <Route path="/safety" element={<StaticPages type="safety" />} />
        <Route path="/crisis" element={<StaticPages type="crisis" />} />
        
        <Route path="/privacy" element={<StaticPages type="privacy" />} />
        <Route path="/terms" element={<StaticPages type="terms" />} />
        <Route path="/support" element={<StaticPages type="support" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ErrorBoundary>
  );
};

const App: React.FC = () => {
  return <MainApp />;
};

export default App;
