import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

// Logger wired in MainApp useEffect
import { UserRole, Companion } from './types';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import Auth from './components/Auth';
import VideoRoom from './components/VideoRoom';
import { VoiceRoom } from './components/VoiceRoom';
import StaticPages from './components/StaticPages';
import { UserService } from './services/userService';
import { AdminService } from './services/adminService';
import BookOfYou from './components/wisdom/BookOfYou';

import { ToastProvider } from './components/common/Toast';
import { LanguageProvider } from './components/common/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';


import { ZenErrorBoundary } from './components/ZenErrorBoundary';
import { useAuth } from './contexts/AuthContext';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './components/common/PageTransition';

const MainApp: React.FC = () => {
  const { user, isLoading: authLoading, login, logout } = useAuth(); // --- STATE ---
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [activeSession, setActiveSession] = useState<{ companion: Companion, mode: 'video' | 'voice' } | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showAuth, setShowAuth] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());
  const location = useLocation();
  const navigate = useNavigate();

  // 1. SETTINGS POLL & INIT (Safe Recursive Pattern)
  useEffect(() => {
    // WIRE UP LOGGER SAFELY (Once on mount)
    if (typeof window !== 'undefined') {
      (window as any).PersistLog = AdminService.logSystemEvent;
    }

    let isMounted = true;
    let timeoutId: any;

    const syncSettings = async () => {
      try {
        const s = await AdminService.syncGlobalSettings();
        if (isMounted && s) setMaintenanceMode(s.maintenanceMode);
      } catch (e) {
        console.error("Settings sync failed", e);
      } finally {
        if (isMounted) timeoutId = setTimeout(syncSettings, 5000); // Wait 5s AFTER finish
      }
    };

    syncSettings();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // 2. ROUTING CHECK (Admin Redirect)
  useEffect(() => {
    if (!authLoading && user?.role === UserRole.ADMIN && location.pathname === '/') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, authLoading, location.pathname, navigate]);

  // 3. PREFETCH DATA
  useEffect(() => {
    if (user) {
      UserService.getJournals(user.id);
      UserService.getUserArt(user.id);
    }
  }, [user]);

  const onLoginSubmit = async (_role: UserRole, name: string, _avatar?: string, email?: string, birthday?: string, provider: 'email' | 'google' | 'facebook' | 'x' = 'email', password?: string, isSignup: boolean = false) => {
    try {
      await login(_role, name, _avatar, email, birthday, provider, password, isSignup);
      setShowAuth(false);
      lastActivityRef.current = Date.now();
      // Navigation is handled by the useEffect above or generic AuthContext state change logic if needed, 
      // but we can force it here for non-admins if needed, though the declarative routes handle most.
      if (email?.includes('admin')) { // Simple check, real check is in useEffect
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (e) {
      throw e;
    }
  };

  const onLogout = async () => {
    setActiveSession(null);
    await logout();
    navigate('/', { replace: true });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  // MAINTENANCE MODE LOCK (Bypassed by Admins)
  if (maintenanceMode && user?.role !== UserRole.ADMIN && !location.pathname.includes('/admin')) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center text-white">
        <div className="w-20 h-20 bg-yellow-500/10 rounded-3xl flex items-center justify-center mb-6 animate-pulse">
          <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-4">SYSTEM MAINTENANCE</h1>
        <p className="text-gray-400 max-w-md mx-auto mb-8 text-sm leading-relaxed">
          PeuticOS is currently undergoing scheduled upgrades to improve system stability and performance.
          We will be back online shortly.
        </p>
        <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Expected Duration: &lt; 30 Minutes</div>

        {/* Secret Admin Entry */}
        <button onClick={() => navigate('/admin/login')} className="mt-20 opacity-0 hover:opacity-20 text-[9px] text-gray-500 uppercase tracking-widest">Admin Override</button>
      </div>
    );
  }

  return (
    <ZenErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            {activeSession && user ? (
              activeSession.mode === 'voice' ? (
                <VoiceRoom
                  companion={activeSession.companion}
                  onEndSession={() => setActiveSession(null)}
                  userName={user.name}
                  userId={user.id}
                />
              ) : (
                <VideoRoom
                  companion={activeSession.companion}
                  onEndSession={() => setActiveSession(null)}
                  userName={user.name}
                  userId={user.id}
                />
              )
            ) : (
              <>
                {showAuth && <Auth onLogin={onLoginSubmit} onCancel={() => setShowAuth(false)} initialMode={authMode} />}

                {/* ROUTES */}
                <AnimatePresence mode="wait">
                  <Routes location={location} key={location.pathname}>
                    <Route path="/" element={
                      <PageTransition>
                        {user ? (
                          user.role === UserRole.ADMIN ? <Navigate to="/admin/dashboard" replace /> : <Dashboard user={user} onLogout={onLogout} onStartSession={(c: Companion, m?: 'video' | 'voice') => setActiveSession({ companion: c, mode: m || 'video' })} />
                        ) : (
                          <LandingPage onLoginClick={(signup) => {
                            setAuthMode(signup ? 'signup' : 'login');
                            setShowAuth(true);
                          }} />
                        )}
                      </PageTransition>
                    } />

                    <Route path="/admin" element={<Navigate to="/admin/login" />} />
                    <Route path="/admin/login" element={
                      <PageTransition>
                        <AdminLogin onLogin={() => { navigate('/admin/dashboard'); }} />
                      </PageTransition>
                    } />

                    <Route path="/admin/dashboard" element={
                      <PageTransition>
                        {user && user.role === UserRole.ADMIN ? (
                          <AdminDashboard onLogout={onLogout} />
                        ) : (
                          <Navigate to="/admin/login" replace />
                        )}
                      </PageTransition>
                    } />

                    <Route path="/book-of-you" element={<PageTransition>{user ? <BookOfYou /> : <Navigate to="/" />}</PageTransition>} />
                    <Route path="/about" element={<PageTransition><StaticPages type="about" /></PageTransition>} />
                    <Route path="/press" element={<PageTransition><StaticPages type="press" /></PageTransition>} />
                    <Route path="/safety" element={<PageTransition><StaticPages type="safety" /></PageTransition>} />
                    <Route path="/crisis" element={<PageTransition><StaticPages type="crisis" /></PageTransition>} />
                    <Route path="/privacy" element={<PageTransition><StaticPages type="privacy" /></PageTransition>} />
                    <Route path="/terms" element={<PageTransition><StaticPages type="terms" /></PageTransition>} />
                    <Route path="/support" element={<PageTransition><StaticPages type="support" /></PageTransition>} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </AnimatePresence>
              </>
            )}
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ZenErrorBoundary>
  );
};

const App: React.FC = () => { return <MainApp />; };
export default App;