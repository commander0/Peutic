import React, { useState, useEffect, useRef } from 'react';
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
import { logger } from './services/logger';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import BookOfYou from './components/wisdom/BookOfYou';


import { Wrench, Clock, ShieldCheck } from 'lucide-react';
import { ToastProvider } from './components/common/Toast';
import { LanguageProvider } from './components/common/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/common/Footer';
import { CookieConsent } from './components/common/CookieConsent';

// Helper to hide footer on secure dashboard routes if needed
const FooterWrapper = () => {
  const location = useLocation();
  // We want footer on Landing Page (/) if NOT logged in... logic is in App main return.
  // If we are logged in, / is Dashboard. 
  // Actually, Dashboard probably has its own layout. 
  // Let's rely on Dashboard having its own layout or just show Footer at bottom.
  // BUT Dashboard is usually 100vh h-screen.
  // Safety check:
  if (location.pathname === '/' || location.pathname === '/book-of-you' || location.pathname.includes('/admin')) return null;
  return <Footer />;
};




const MainApp: React.FC = () => {
  const { user, loading, isAdmin } = useAuth(); // NEW: Use Central Auth
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [activeSessionCompanion, setActiveSessionCompanion] = useState<Companion | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());
  const location = useLocation();
  const navigate = useNavigate();

  // 1. App Initialization (Settings Only)
  useEffect(() => {
    // Sync Global Settings independently of Auth
    AdminService.syncGlobalSettings().then(settings => {
      setMaintenanceMode(settings.maintenanceMode);
    });

    const interval = setInterval(async () => {
      await AdminService.syncGlobalSettings();
      setMaintenanceMode(AdminService.getSettings().maintenanceMode);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 2. Session Timeout Logic (Preserved)
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      if (showTimeoutWarning) setShowTimeoutWarning(false);
    };
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => window.addEventListener(event, updateActivity, { capture: true, passive: true }));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === 'visible') lastActivityRef.current = Date.now();
    });
    return () => events.forEach(event => window.removeEventListener(event, updateActivity, { capture: true }));
  }, [showTimeoutWarning]);

  // 3. Privacy Blur & Timeout Logic (Preserved)
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    const checkActivity = () => {
      if (!user || activeSessionCompanion) return;
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;

      // Privacy Blur (5 Minutes)
      if (elapsed > 5 * 60 * 1000 && !isBlurred) setIsBlurred(true);

      // Session Timeout (15 Minutes)
      const timeoutLimit = 15 * 60 * 1000;
      if (elapsed > timeoutLimit - 60000 && elapsed < timeoutLimit) setShowTimeoutWarning(true);
      if (elapsed > timeoutLimit) {
        setShowTimeoutWarning(false);
        handleLogout();
      }
    };
    const interval = setInterval(checkActivity, 1000);
    return () => clearInterval(interval);
  }, [user, activeSessionCompanion, isBlurred]);

  const handleResumeActivity = () => {
    lastActivityRef.current = Date.now();
    setIsBlurred(false);
    setShowTimeoutWarning(false);
  };

  // 4. Unified Login Handler
  // Note: This function allows the LandingPage/Auth UI to trigger a login flow.
  // The actual state update happens via the AuthProvider's listener automatically.
  const handleLogin = async (_role: UserRole, name: string, _avatar?: string, email?: string, birthday?: string, provider: 'email' | 'google' | 'facebook' | 'x' = 'email', password?: string, isSignup: boolean = false, topics?: string[]): Promise<void> => {
    const userEmail = email || `${name.toLowerCase().replace(/ /g, '.')}@example.com`;

    try {
      if (provider === 'email' && password) {
        try {
          if (isSignup) throw new Error("Explicit Signup Requested");
          await UserService.login(userEmail, password);
        } catch (loginError: any) {
          if (isSignup || loginError.message.includes('Explicit Signup Requested') || !loginError.message.includes('Invalid login credentials')) {
            const newUser = await UserService.createUser(name, userEmail, password, provider, birthday);
            // Handle Onboarding topics
            if (topics && topics.length > 0) {
              await UserService.updatePreferences(newUser.id, { topics });
            }
          } else {
            throw loginError;
          }
        }
      } else if (provider !== 'email') {
        await UserService.createUser(name, userEmail, 'social-login-placeholder', provider, birthday);
      }

      setShowAuth(false);
      // Navigation is handled by the AuthProvider state change or the component rendering 
      // We can optionally force it if needed, but let's trust the state first.

    } catch (e: any) {
      console.error("Login Failed", e);
      throw e;
    }
  };

  const handleLogout = async () => {
    setActiveSessionCompanion(null);
    UserService.clearCache();
    await UserService.logout();
    navigate('/', { replace: true });
  };

  // 5. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-yellow-500 animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 animate-pulse">Establishing Secure Connection</p>
      </div>
    );
  }

  // 6. Maintenance Mode
  if (maintenanceMode && !isAdmin && !location.pathname.includes('/admin')) {
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


                {/* PRIVACY BLUR OVERLAY */}
                {isBlurred && (
                  <div
                    onClick={handleResumeActivity}
                    className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-2xl flex flex-col items-center justify-center text-white cursor-pointer transition-all duration-700 animate-in fade-in"
                  >
                    <div className="bg-black/20 p-8 rounded-full border border-white/10 mb-6 shadow-2xl">
                      <ShieldCheck className="w-16 h-16 opacity-80 animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight mb-2">Session Secure</h2>
                    <p className="text-white/60 text-sm uppercase tracking-widest font-mono">Tap to Resume</p>
                  </div>
                )}

                {/* TIMEOUT WARNING MODAL */}
                {showTimeoutWarning && !isBlurred && (
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
                    <div className="relative">
                      {/* Force Dashboard for testing if user exists, else Landing */}
                      {user ? (
                        isAdmin ? <Navigate to="/admin/dashboard" /> : <Dashboard user={user} onLogout={handleLogout} onStartSession={(c) => setActiveSessionCompanion(c)} />
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
                      )}
                    </div>
                  } />

                  {/* Admin Routes - PROTECTED BY AUTH PROVIDER CHECK + ROUTE GUARD */}
                  <Route path="/admin" element={<Navigate to="/admin/login" />} />
                  <Route path="/admin/login" element={
                    // If already admin, go to dashboard
                    isAdmin ? <Navigate to="/admin/dashboard" /> : <AdminLogin onLogin={() => navigate('/admin/dashboard')} />
                  } />

                  <Route path="/admin/dashboard" element={
                    user && isAdmin ? (
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

                <CookieConsent />
                {!activeSessionCompanion && <FooterWrapper />}

              </>
            )}
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};


const App: React.FC = () => {
  // Wrap MainApp with AuthProvider
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
};

export default App;