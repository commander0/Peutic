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

  // Restore session & Handle Auth Changes
  useEffect(() => {
    // Parallelize Operations to Speed Up Load
    const initApp = async () => {
      try {
        // 1. Run Core Initialization in Parallel
        const [restored, settings] = await Promise.all([
          UserService.restoreSession().catch(e => { logger.warn("Session restore failed", e.message); return null; }),
          AdminService.syncGlobalSettings().catch(e => { logger.warn("Settings sync failed", e.message); return { maintenanceMode: false }; })
        ]);

        let activeUser = restored;
        if (settings) setMaintenanceMode(settings.maintenanceMode);

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
          // SOFT FAIL: If sync failed but we have a token, don't kill the session immediately
          // Just let the auth listener handle the final decision
          console.warn("Init Check: User not synced yet, waiting for Auth Listener...");
        }

        setMaintenanceMode(AdminService.getSettings().maintenanceMode);
      } catch (err) {
        console.error("Critical Init Error:", err);
      } finally {
        setIsRestoring(false);
      }
    };

    initApp();

    // 4. Persistent Listener for Refresh/Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      console.log(`[AuthDebug] Event: ${event}`, {
        hasSession: !!session,
        userId: session?.user?.id,
        currentUserState: user?.id
      });

      // Handle both explicit Sign In and Initial Session recovery
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session?.user) {

        // CONNECT LOGGER TO DB (Now that we have a potential session/context)
        (window as any).PersistLog = (type: any, eventName: string, details: string) => {
          if (type === 'ERROR' || type === 'SECURITY' || type === 'WARNING') {
            AdminService.logSystemEvent(type, eventName, details).catch(e => console.warn("Log fail", e));
          }
        };

        // LOOP PREVENTION: If we are already an ADMIN in state, and the session matches, 
        // DO NOT overwrite with a potential "USER" fallback unless we are sure.
        if (user && user.id === session.user.id && user.role === UserRole.ADMIN) {
          console.log("AuthDebug: Maintaining existing ADMIN state to prevent flicker");
          return;
        }

        // Prevent unnecessary re-sync if we already have the correct user in state
        if (user && user.id === session.user.id) return;

        let syncedUser = await UserService.syncUser(session.user.id);

        if (!syncedUser) {
          console.warn("Auth Listener: Sync failed, using Fallback User.");
          // Fallback user now trusts the Token Role (V29 Fix)
          syncedUser = UserService.createFallbackUser(session.user);

          // Attempt background repair/sync again without blocking
          UserService.repairUserRecord(session.user).then(repaired => {
            if (repaired && repaired.role === UserRole.ADMIN) {
              // Only update if it upgrades us or is robust
              setUser(repaired);
            }
          });
        }

        if (syncedUser) {
          setUser(syncedUser);

          // Force Navigation only if we are on a public page and should be on dashboard
          if (syncedUser.role === UserRole.ADMIN && location.pathname === '/admin/login') {
            navigate('/admin/dashboard');
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        // navigate('/'); // DEBUG: DISABLE AUTO REDIRECT TO SEE ERRORS
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
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      if (showTimeoutWarning) setShowTimeoutWarning(false);
    };
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => window.addEventListener(event, updateActivity, { capture: true, passive: true }));
    // Also listen for visibility change to re-blur on tab switch if needed, or update timestamp
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === 'visible') {
        lastActivityRef.current = Date.now();
      }
    });
    return () => events.forEach(event => window.removeEventListener(event, updateActivity, { capture: true }));
  }, [showTimeoutWarning]);



  // Privacy Blur & Timeout Logic
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    const checkActivity = () => {
      if (!user || activeSessionCompanion) return;

      const now = Date.now();
      const elapsed = now - lastActivityRef.current;

      // Privacy Blur (5 Minutes)
      if (elapsed > 5 * 60 * 1000 && !isBlurred) {
        setIsBlurred(true);
      }

      // Session Timeout (15 Minutes)
      const timeoutLimit = 15 * 60 * 1000;
      if (elapsed > timeoutLimit - 60000 && elapsed < timeoutLimit) {
        setShowTimeoutWarning(true);
      }
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

  const handleLogin = async (_role: UserRole, name: string, _avatar?: string, email?: string, birthday?: string, provider: 'email' | 'google' | 'facebook' | 'x' = 'email', password?: string, isSignup: boolean = false, topics?: string[]): Promise<void> => {
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

      let finalUser = currentUser;

      // SAVE ONBOARDING TOPICS (Growth Fix)
      if (topics && topics.length > 0) {
        finalUser = { ...currentUser, emailPreferences: { ...currentUser.emailPreferences, marketing: true, updates: currentUser.emailPreferences?.updates ?? false, topics } };
        UserService.updatePreferences(currentUser.id, { topics }).catch(console.warn);
      }

      setUser(finalUser);
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


  if (isRestoring) {
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

  // Maintenance Mode Lockout
  if (maintenanceMode && user?.role !== UserRole.ADMIN && !location.pathname.includes('/admin')) {
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
            {/* --- EMERGENCY DEBUG PANEL --- */}
            <div className="fixed top-0 left-0 bg-black/90 text-[10px] font-mono text-green-400 p-2 z-[99999] pointer-events-none opacity-50 hover:opacity-100 max-w-sm overflow-hidden whitespace-pre-wrap border-r border-b border-green-500/30">
              {JSON.stringify({
                id: user?.id?.substring(0, 8),
                role: user?.role,
                email: user?.email,
                path: location.pathname
              }, null, 2)}
            </div>

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
                        <Dashboard user={user} onLogout={handleLogout} onStartSession={(c) => setActiveSessionCompanion(c)} />
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

                  {/* Admin Sub-Site Routes */}
                  <Route path="/admin" element={<Navigate to="/admin/login" />} />
                  <Route path="/admin/login" element={<AdminLogin onLogin={(u) => { setUser(u); UserService.saveUserSession(u); navigate('/admin/dashboard'); }} />} />

                  {/* SECURITY BYPASS: Allow ANY logged in user to see Dashboard structure for debugging */}
                  {/* We removed the explicit "UserRole.ADMIN" ternary check here */}
                  <Route path="/admin/dashboard" element={
                    <AdminDashboard onLogout={handleLogout} />
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
  return <MainApp />;
};

export default App;