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
import { UserService } from './services/userService';
import { AdminService } from './services/adminService';
import { supabase } from './services/supabaseClient';
import BookOfYou from './components/wisdom/BookOfYou';


import { Wrench, AlertTriangle, Clock, RefreshCw, ShieldCheck } from 'lucide-react';
import { ToastProvider } from './components/common/Toast';
import { LanguageProvider } from './components/common/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';


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
    AdminService.logSystemEvent('ERROR', 'App Crash', error.message);
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
  const [user, setUser] = useState<User | null>(UserService.getCachedUser());
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [activeSessionCompanion, setActiveSessionCompanion] = useState<Companion | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());
  const location = useLocation();
  const navigate = useNavigate();

  // 1. INITIALIZATION & SESSION RESTORE
  useEffect(() => {
    const initApp = async () => {
      try {
        // Parallel sync
        const [restoredUser, settings] = await Promise.all([
          UserService.restoreSession().catch(() => null),
          AdminService.syncGlobalSettings().catch(() => ({ maintenanceMode: false }))
        ]);

        if (settings) setMaintenanceMode(settings.maintenanceMode);

        if (restoredUser) {
          setUser(restoredUser);

          // Prefetch in background
          UserService.getJournals(restoredUser.id);
          UserService.getUserArt(restoredUser.id);

          // ROUTING CHECK: If Admin on root, go to Dashboard
          if (restoredUser.role === UserRole.ADMIN && location.pathname === '/') {
            navigate('/admin/dashboard', { replace: true });
          }
        }
      } catch (e) {
        console.error("Init failed", e);
      } finally {
        setIsRestoring(false);
      }
    };
    initApp();

    // 2. AUTH LISTENER (Simple & clean)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        // Only re-sync if ID mismatch or no user state
        if (!UserService.getUser() || UserService.getUser()?.id !== session.user.id) {
          const synced = await UserService.syncUser(session.user.id);
          if (synced) {
            setUser(synced);
            UserService.saveUserSession(synced);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        UserService.clearCache();
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Run once on mount

  // 3. SETTINGS POLL
  useEffect(() => {
    const interval = setInterval(async () => {
      await AdminService.syncGlobalSettings();
      setMaintenanceMode(AdminService.getSettings().maintenanceMode);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // ... (Timeout/Blur logic remains same, hidden for brevity) ...

  const handleLogin = async (_role: UserRole, name: string, _avatar?: string, email?: string, birthday?: string, provider: 'email' | 'google' | 'facebook' | 'x' = 'email', password?: string, isSignup: boolean = false): Promise<void> => {
    try {
      let currentUser: User;
      const userEmail = email || `${name.toLowerCase().replace(/ /g, '.')}@example.com`;

      if (provider === 'email' && password) {
        try {
          if (isSignup) throw new Error("Signup");
          currentUser = await UserService.login(userEmail, password);
        } catch (e: any) {
          if (isSignup || e.message.includes('Signup') || !e.message.includes('Invalid')) {
            currentUser = await UserService.createUser(name, userEmail, password, provider, birthday);
          } else throw e;
        }
      } else {
        currentUser = await UserService.createUser(name, userEmail, 'social-pw', provider, birthday);
      }

      // STATE UPDATE
      setUser(currentUser);
      UserService.saveUserSession(currentUser);
      setShowAuth(false);
      lastActivityRef.current = Date.now();

      // ROUTING
      if (currentUser.role === UserRole.ADMIN) {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }

    } catch (e: any) {
      console.error("Login Error", e);
      throw e;
    }
  };


  const handleLogout = async () => {
    setUser(null);
    setActiveSessionCompanion(null);
    UserService.clearCache();
    navigate('/', { replace: true });
    await UserService.logout();
  };

  if (isRestoring) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            {activeSessionCompanion && user ? (
              <VideoRoom
                companion={activeSessionCompanion}
                onEndSession={() => setActiveSessionCompanion(null)}
                userName={user.name}
                userId={user.id}
              />
            ) : (
              <>
                {showAuth && <Auth onLogin={handleLogin} onCancel={() => setShowAuth(false)} initialMode={authMode} />}

                {/* ROUTES */}
                <Routes>
                  <Route path="/" element={
                    user ? (
                      user.role === UserRole.ADMIN ? <Navigate to="/admin/dashboard" replace /> : <Dashboard user={user} onLogout={handleLogout} onStartSession={(c) => setActiveSessionCompanion(c)} />
                    ) : (
                      <LandingPage onLoginClick={(signup) => {
                        setAuthMode(signup ? 'signup' : 'login');
                        setShowAuth(true);
                      }} />
                    )
                  } />

                  <Route path="/admin" element={<Navigate to="/admin/login" />} />
                  <Route path="/admin/login" element={<AdminLogin onLogin={(u) => { setUser(u); navigate('/admin/dashboard'); }} />} />

                  <Route path="/admin/dashboard" element={
                    user && user.role === UserRole.ADMIN ? (
                      <AdminDashboard onLogout={handleLogout} />
                    ) : (
                      <Navigate to="/admin/login" replace />
                    )
                  } />

                  <Route path="/book-of-you" element={user ? <BookOfYou /> : <Navigate to="/" />} />
                  <Route path="/about" element={<StaticPages type="about" />} />
                  <Route path="/press" element={<StaticPages type="press" />} />
                  <Route path="/safety" element={<StaticPages type="safety" />} />
                  <Route path="/crisis" element={<StaticPages type="crisis" />} />
                  <Route path="/privacy" element={<StaticPages type="privacy" />} />
                  <Route path="/terms" element={<StaticPages type="terms" />} />
                  <Route path="/support" element={<StaticPages type="support" />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </>
            )}
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

const App: React.FC = () => { return <MainApp />; };
export default App;