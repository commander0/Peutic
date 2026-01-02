
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
import { Database } from './services/database';
import { Wrench, AlertTriangle, Clock } from 'lucide-react';

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
    const savedUser = Database.getUser();
    if (savedUser) setUser(savedUser);
    
    const settings = Database.getSettings();
    setMaintenanceMode(settings.maintenanceMode);

    const interval = setInterval(() => {
        const currentSettings = Database.getSettings();
        setMaintenanceMode(currentSettings.maintenanceMode);
    }, 2000);

    setIsRestoring(false);
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

  const handleLogin = (role: UserRole, name: string, avatar?: string, email?: string, birthday?: string, provider: 'email' | 'google' | 'facebook' | 'x' = 'email') => {
    let currentUser = Database.getUser();
    const userEmail = email || `${name.toLowerCase().replace(/ /g, '.')}@example.com`;
    
    if (!currentUser || currentUser.email !== userEmail) {
        const allUsers = Database.getAllUsers();
        const existing = allUsers.find(u => u.email === userEmail);
        
        if (existing) {
            currentUser = existing;
            if (avatar) { currentUser.avatar = avatar; Database.updateUser(currentUser); }
        } else {
            // STRICT ADMIN CREATION LOGIC
            const adminExists = Database.hasAdmin();
            let finalRole = UserRole.USER;
            if (!adminExists && provider === 'email') {
                finalRole = UserRole.ADMIN;
            } else if (provider !== 'email') {
                finalRole = UserRole.USER;
            }

            currentUser = Database.createUser(name, userEmail, provider, birthday, finalRole);
            if (avatar) { currentUser.avatar = avatar; Database.updateUser(currentUser); }
        }
    }
    
    currentUser = Database.checkAndIncrementStreak(currentUser);

    setUser(currentUser);
    Database.saveUserSession(currentUser);
    lastActivityRef.current = Date.now();
    setShowAuth(false);
    
    if (currentUser.role === UserRole.ADMIN) {
        navigate('/admin/dashboard');
    } else {
        navigate('/');
    }
  };

  const handleLogout = () => {
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
    <>
      {showAuth && <Auth onLogin={handleLogin} onCancel={() => setShowAuth(false)} initialMode={authMode} />}
      
      {/* TIMEOUT WARNING MODAL */}
      {showTimeoutWarning && (
          <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl border border-yellow-500">
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
            user && user.role === UserRole.USER ? (
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
    </>
  );
};

const App: React.FC = () => {
  return <MainApp />;
};

export default App;
