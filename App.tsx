
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
import { Wrench, Clock } from 'lucide-react';

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

  // Restore session ASYNC
  useEffect(() => {
    const init = async () => {
        try {
            const savedUser = await Database.getUser();
            if (savedUser) setUser(savedUser);
            
            const settings = await Database.getSettings();
            setMaintenanceMode(settings.maintenanceMode);
        } catch (e) {
            console.error("Session restore failed", e);
        } finally {
            setIsRestoring(false);
        }
    };
    init();

    const interval = setInterval(async () => {
        const currentSettings = await Database.getSettings();
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
      
      if (elapsed > timeoutLimit - 60000 && elapsed < timeoutLimit) {
          setShowTimeoutWarning(true);
      }
      
      if (elapsed > timeoutLimit) {
        setShowTimeoutWarning(false);
        handleLogout();
      }
    };
    const interval = setInterval(checkTimeout, 5000);
    return () => clearInterval(interval);
  }, [user, activeSessionCompanion]);

  const handleLogin = async (role: UserRole, name: string, avatar?: string, email?: string, birthday?: string, provider: 'email' | 'google' | 'facebook' | 'x' = 'email') => {
    // Current user context isn't enough, we must check DB
    const userEmail = email || `${name.toLowerCase().replace(/ /g, '.')}@example.com`;
    
    let currentUser = await Database.getUserByEmail(userEmail);
    
    if (!currentUser) {
        // Create new
        // Check admin existence async if needed, but for now simple
        const allUsers = await Database.getAllUsers(); // Can be expensive, optimize later if scaling
        const adminExists = allUsers.some(u => u.role === UserRole.ADMIN);
        
        let finalRole = UserRole.USER;
        if (!adminExists && provider === 'email') finalRole = UserRole.ADMIN;

        currentUser = await Database.createUser(name, userEmail, provider, birthday, finalRole);
    }
    
    if (avatar && currentUser) {
        currentUser.avatar = avatar;
        await Database.updateUser(currentUser);
    }

    setUser(currentUser);
    if(currentUser) Database.saveUserSession(currentUser);
    lastActivityRef.current = Date.now();
    setShowAuth(false);
    
    if (currentUser?.role === UserRole.ADMIN) {
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

  if (activeSessionCompanion && user) {
    return <VideoRoom companion={activeSessionCompanion} onEndSession={() => setActiveSessionCompanion(null)} userName={user.name} />;
  }

  return (
    <>
      {showAuth && <Auth onLogin={handleLogin} onCancel={() => setShowAuth(false)} initialMode={authMode} />}
      
      {showTimeoutWarning && (
          <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl border border-yellow-500">
                  <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
                  </div>
                  <h3 className="text-2xl font-black mb-2 dark:text-white">Are you still there?</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">Your secure session will time out in 60 seconds.</p>
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
        
        <Route path="/admin" element={<Navigate to="/admin/login" />} />
        <Route path="/admin/login" element={<AdminLogin onLogin={(u) => { setUser(u); Database.saveUserSession(u); navigate('/admin/dashboard'); }} />} />
        <Route path="/admin/dashboard" element={
            user && user.role === UserRole.ADMIN ? (
                <AdminDashboard onLogout={handleLogout} />
            ) : (
                <Navigate to="/admin/login" />
            )
        } />

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
