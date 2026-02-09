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
import BookOfYou from './components/wisdom/BookOfYou';

import { ToastProvider } from './components/common/Toast';
import { LanguageProvider } from './components/common/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';


import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary';
import { useAuth } from './contexts/AuthContext';

const MainApp: React.FC = () => {
  const { user, isLoading: authLoading, login, logout } = useAuth();

  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [activeSessionCompanion, setActiveSessionCompanion] = useState<Companion | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  // const [showTimeoutWarning, setShowTimeoutWarning] = useState(false); 

  const lastActivityRef = useRef<number>(Date.now());
  const location = useLocation();
  const navigate = useNavigate();

  // 1. SETTINGS POLL & INIT
  useEffect(() => {
    const initSettings = async () => {
      try {
        const settings = await AdminService.syncGlobalSettings().catch(() => ({ maintenanceMode: false }));
        if (settings) setMaintenanceMode(settings.maintenanceMode);
      } catch (e) { console.error("Settings init failed", e); }
    };
    initSettings();

    const interval = setInterval(async () => {
      await AdminService.syncGlobalSettings();
      setMaintenanceMode(AdminService.getSettings().maintenanceMode);
    }, 5000);
    return () => clearInterval(interval);
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
    setActiveSessionCompanion(null);
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
    <GlobalErrorBoundary>
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
                {showAuth && <Auth onLogin={onLoginSubmit} onCancel={() => setShowAuth(false)} initialMode={authMode} />}

                {/* ROUTES */}
                <Routes>
                  <Route path="/" element={
                    user ? (
                      user.role === UserRole.ADMIN ? <Navigate to="/admin/dashboard" replace /> : <Dashboard user={user} onLogout={onLogout} onStartSession={(c) => setActiveSessionCompanion(c)} />
                    ) : (
                      <LandingPage onLoginClick={(signup) => {
                        setAuthMode(signup ? 'signup' : 'login');
                        setShowAuth(true);
                      }} />
                    )
                  } />

                  <Route path="/admin" element={<Navigate to="/admin/login" />} />
                  <Route path="/admin/login" element={<AdminLogin onLogin={() => {
                    // AdminLogin component likely interacts with local state, 
                    // but we need it to use our Context login if possible, or just trigger a refresh.
                    // Actually, current AdminLogin implementation does its own auth call and returns user.
                    // We should ideally refactor AdminLogin to use useAuth, but for now let's just sync state.
                    // If AdminLogin calls onLogin(user), we assume session is set.
                    // We can trigger a profile refresh or just rely on the AuthListener in Context to pick it up.
                    navigate('/admin/dashboard');
                  }} />} />

                  <Route path="/admin/dashboard" element={
                    user && user.role === UserRole.ADMIN ? (
                      <AdminDashboard onLogout={onLogout} />
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
    </GlobalErrorBoundary>
  );
};

const App: React.FC = () => { return <MainApp />; };
export default App;