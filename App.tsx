import React, { useState, useEffect, useRef, ReactNode, ErrorInfo } from 'react';
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
import { AlertTriangle, Clock, RefreshCw, Lock } from 'lucide-react';

// --- ERROR BOUNDARY (CRASH PREVENTION) ---

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Explicitly inheriting from React.Component with Generics to ensure proper 'props' and 'state' resolution in TypeScript
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  constructor(props: ErrorBoundaryProps) {
    super(props);
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

  const savedActivity = localStorage.getItem('peutic_last_activity');
  const lastActivityRef = useRef<number>(savedActivity ? parseInt(savedActivity) : Date.now());
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
      try {
        await Database.syncGlobalSettings(); // Pull from remote
        const currentSettings = Database.getSettings(); // Read updated local state
        setMaintenanceMode(currentSettings.maintenanceMode);
      } catch (e) {
        console.warn("Maintenance Polling Failed", e);
      }
    }, 10000); // Polling every 10s is sufficient and safer for rate limits

    return () => clearInterval(interval);
  }, []);

  // Session Timeout Logic
  useEffect(() => {
    const updateActivity = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      localStorage.setItem('peutic_last_activity', now.toString());
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

  // --- ONBOARDING GUARD (OAuth Completion) ---
  useEffect(() => {
    if (user && !user.onboardingCompleted && user.role !== UserRole.ADMIN && !showAuth) {
      console.log("OAuth/New User detected without onboarding. Triggering flow...");
      setAuthMode('signup');
      setShowAuth(true);
    }
  }, [user, showAuth]);

  const handleLogin = async (_role: UserRole, name: string, _avatar?: string, email?: string, _birthday?: string, provider: 'email' | 'google' | 'facebook' | 'x' = 'email', password?: string, isSignup: boolean = false): Promise<void> => {
    const userEmail = email || `${name.toLowerCase().replace(/ /g, '.')}@example.com`;
    let currentUser: User;

    try {
      // --- REAL SUPABASE AUTHENTICATION ---
      // This ensures the session persists on refresh
      if (provider === 'email' && password) {
        // Attempt Login
        try {
          if (isSignup) throw new Error("Explicit Signup Requested");
          currentUser = await Database.login(userEmail, password);
        } catch (loginError: any) {
          // If login fails, try signup (if this was a signup attempt)
          if (isSignup || loginError.message.includes('Explicit Signup Requested') || loginError.message.includes('Invalid login credentials') === false) {
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
      // Let the Auth component handle error display
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

  // Maintenance Mode Lockout (Premium UI)
  if (maintenanceMode && (!user || user.role !== UserRole.ADMIN) && !location.pathname.includes('/support') && !location.pathname.includes('/admin')) {
    return (
      <div className="min-h-screen bg-[#FFFBEB] dark:bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center transition-colors">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[20%] left-[10%] w-[40%] h-[40%] bg-yellow-400/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-orange-400/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-md w-full animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-8 transform -rotate-6">
            <Lock className="w-10 h-10 text-black" />
          </div>

          <h1 className="text-4xl font-black tracking-tighter mb-4 dark:text-white">Scheduled Sanctuary Care</h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium mb-10 leading-relaxed">
            We're currently polishing the sanctuary to ensure your sessions are as tranquil as possible. We'll be back in just a moment.
          </p>

          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-xl"
            >
              <RefreshCw className="w-4 h-4" /> Check Status
            </button>
            <button
              onClick={() => navigate('/support')}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Visit Help Center
            </button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Optimization in Progress</span>
          </div>

          {/* Hidden Admin Entry */}
          <button
            onClick={() => { setAuthMode('login'); setShowAuth(true); }}
            className="fixed bottom-4 right-4 opacity-5 hover:opacity-100 transition-opacity p-2 text-[10px] text-gray-400 font-bold"
          >
            Admin Portal
          </button>
        </div>
      </div>
    );
  }

  if (activeSessionCompanion && user) {
    return <VideoRoom companion={activeSessionCompanion} onEndSession={() => setActiveSessionCompanion(null)} userName={user.name} userId={user.id} />;
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