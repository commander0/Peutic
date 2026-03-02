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
import BookOfYou from './components/wisdom/BookOfYou';

import { useSettingsPoller } from './hooks/useSettingsPoller';
import { MaintenanceGuard } from './components/MaintenanceGuard';

import { ToastProvider } from './components/common/Toast';
import { LanguageProvider } from './components/common/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';


import { ZenErrorBoundary } from './components/ZenErrorBoundary';
import { useAuth } from './contexts/AuthContext';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './components/common/PageTransition';

const MainApp: React.FC = () => {
  const { user, isLoading: authLoading, login, logout } = useAuth(); // --- STATE ---
  const { maintenanceMode } = useSettingsPoller();
  const [activeSession, setActiveSession] = useState<{ companion: Companion, mode: 'video' | 'voice' } | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showAuth, setShowAuth] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());
  const location = useLocation();
  const navigate = useNavigate();


  // 2. ROUTING CHECK (Admin Redirect)
  useEffect(() => {
    if (!authLoading && user?.role === UserRole.ADMIN && location.pathname === '/') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, authLoading, location.pathname, navigate]);

  // 3. SAFE PREFETCH DATA
  useEffect(() => {
    if (user) {
      const prefetch = async () => {
        try {
          await Promise.all([
            UserService.getJournals(user.id),
            UserService.getUserArt(user.id)
          ]);
        } catch (e) {
          console.warn("Non-critical background data prefetch failed gracefully", e);
        }
      };
      prefetch();
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


  return (
    <ZenErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <MaintenanceGuard isActive={maintenanceMode} isAdmin={user?.role === UserRole.ADMIN} isAdminRoute={location.pathname.includes('/admin')}>
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
            </MaintenanceGuard>
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ZenErrorBoundary>
  );
};

const App: React.FC = () => { return <MainApp />; };
export default App;