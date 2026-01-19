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


import { Wrench, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { ToastProvider } from './components/common/Toast';
import { LanguageProvider } from './components/common/LanguageContext';


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
  const [isRestoring, setIsRestoring] = useState(!UserService.getCachedUser());
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());
  const location = useLocation();
  const navigate = useNavigate();

  // Restore session & Handle Auth Changes
  useEffect(() => {
    // Parallelize Operations to Speed Up Load
    const initApp = async () => {
      // 1. Run Core Initialization in Parallel
      const [restored, settings] = await Promise.all([
        UserService.restoreSession(),
        AdminService.syncGlobalSettings()
      ]);

      let activeUser = restored;
      setMaintenanceMode(settings.maintenanceMode);

      // 2. Recovery Logic
      if (!activeUser) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.warn("Using Session Fallback for faster load / recovery");
          activeUser = UserService.createFallbackUser(session.user);
          UserService.repairUserRecord(session.user);
        }
      }

      // 3. Update UI State
      if (activeUser) {
        setUser(activeUser);

        // PREFETCH DASHBOARD DATA (Non-blocking)
        AdminService.getCompanions();
        UserService.getJournals(activeUser.id);
        UserService.getUserArt(activeUser.id);
        UserService.getVoiceJournals(activeUser.id);
        UserService.getWeeklyProgress(activeUser.id);

        if (activeUser.role === UserRole.ADMIN && location.pathname === '/') {
          navigate('/admin/dashboard');
        }
      } else {
        UserService.clearCache();
        setUser(null);
      }

      setMaintenanceMode(AdminService.getSettings().maintenanceMode);
      setIsRestoring(false);
    };

    initApp();

    // 4. Persistent Listener for Refresh/Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      // Handle both explicit Sign In and Initial Session recovery
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        // Prevent unnecessary re-sync if we already have the correct user
        if (!user || user.id !== session.user.id) {
          let syncedUser = await UserService.syncUser(session.user.id);

          if (!syncedUser) {
            console.warn("User Sync Failed - Using Fallback & Attempting Repair");
            syncedUser = UserService.createFallbackUser(session.user);

            // Attempt background repair
            UserService.repairUserRecord(session.user).then(repaired => {
              if (repaired) setUser(repaired);
            });
          }

          if (syncedUser) {
            // AVATAR ROTATION LOGIC: Change user icon if not locked
            if (!syncedUser.avatarLocked) {
              const seed = Math.random().toString(36).substring(7);
              syncedUser.avatar = `https://api.dicebear.com/7.x/lorelei/svg?seed=${seed}&backgroundColor=FCD34D`;
            }
            setUser(syncedUser);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Poll Settings separate from Auth logic
  useEffect(() => {
    const interval = setInterval(async () => {
      await AdminService.syncGlobalSettings();
      setMaintenanceMode(AdminService.getSettings().maintenanceMode);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Session Timeout Logic (In-Memory Only)

  // Session Timeout Logic (In-Memory Only)
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      if (showTimeoutWarning) setShowTimeoutWarning(false);
    };
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => window.addEventListener(event, updateActivity, { capture: true, passive: true }));
    return () => events.forEach(event => window.removeEventListener(event, updateActivity, { capture: true }));
  }, [showTimeoutWarning]);



  useEffect(() => {
    const checkTimeout = () => {
      if (!user || activeSessionCompanion) return;
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      const timeoutLimit = 15 * 60 * 1000; // 15 mins for everyone

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

  const handleLogin = async (_role: UserRole, name: string, _avatar?: string, email?: string, birthday?: string, provider: 'email' | 'google' | 'facebook' | 'x' = 'email', password?: string, isSignup: boolean = false): Promise<void> => {
    const userEmail = email || `${name.toLowerCase().replace(/ /g, '.')}@example.com`;
    let currentUser: User;

    try {
      // --- REAL SUPABASE AUTHENTICATION ---
      // This ensures the session persists on refresh
      if (provider === 'email' && password) {
        // Attempt Login
        try {
          if (isSignup) throw new Error("Explicit Signup Requested");
          currentUser = await UserService.login(userEmail, password);
        } catch (loginError: any) {

          // If login fails, try signup (if this was a signup attempt)
          if (isSignup || loginError.message.includes('Explicit Signup Requested') || loginError.message.includes('Invalid login credentials') === false) {
            // Try creating user with birthday
            currentUser = await UserService.createUser(name, userEmail, password, provider, birthday);
          } else {
            throw loginError;
          }
        }
      } else if (provider !== 'email') {
        // Social Login handling
        currentUser = await UserService.createUser(name, userEmail, 'social-login-placeholder', provider, birthday);
      } else {
        throw new Error("Password required for email login");
      }

      currentUser = UserService.checkAndIncrementStreak(currentUser);

      setUser(currentUser);
      lastActivityRef.current = Date.now();
      setShowAuth(false);

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
    const userId = user?.id;

    // 1. Instant UI cleanup (Synchronous)
    setUser(null);
    setActiveSessionCompanion(null);
    UserService.clearCache();

    // 2. Navigation (Synchronous)
    navigate('/', { replace: true });

    // 3. Background Cleanup (Async)
    if (userId) UserService.endSession(userId);
    await UserService.logout();
  };


  if (isRestoring) return <div className="min-h-screen flex items-center justify-center bg-[#FFFBEB]"><div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div></div>;

  // Maintenance Mode Lockout
  if (maintenanceMode && (!user || user.role !== UserRole.ADMIN) && !location.pathname.includes('/admin')) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-6 text-center">
        <Wrench className="w-16 h-16 text-yellow-500 mb-6 animate-pulse" />
        <h1 className="text-4xl font-bold mb-4">System Maintenance</h1>
        <p className="text-gray-400">We'll be back shortly.</p>
        <button onClick={() => { setAuthMode('login'); setShowAuth(true); navigate('/admin/login'); }} className="mt-8 opacity-0 hover:opacity-100 text-xs">Admin Entry</button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
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
                <Route path="/admin/login" element={<AdminLogin onLogin={(u) => { setUser(u); UserService.saveUserSession(u); navigate('/admin/dashboard'); }} />} />

                <Route path="/admin/dashboard" element={
                  user && user.role === UserRole.ADMIN ? (
                    <AdminDashboard onLogout={handleLogout} />
                  ) : (
                    <Navigate to="/admin/login" />
                  )
                } />

                {/* Protected Book of You Route */}
                <Route path="/book-of-you" element={user ? <BookOfYou /> : <Navigate to="/" />} />

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
            </>
          )}
        </ToastProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};


const App: React.FC = () => {
  return <MainApp />;
};

export default App;