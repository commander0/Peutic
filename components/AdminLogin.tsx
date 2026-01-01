
import React, { useState, useEffect } from 'react';
import { Database } from '../services/database';
import { Api } from '../services/api';
import { UserRole } from '../types';
import { Lock, AlertCircle, Shield, ArrowRight, PlusCircle, RefreshCw, Key, ServerOff, Wifi, WifiOff, Terminal } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (user: any) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // System State
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [hasAdmin, setHasAdmin] = useState(false);
  const [view, setView] = useState<'login' | 'register' | 'override'>('login');
  
  // Security State
  const [lockoutMinutes, setLockoutMinutes] = useState(0);
  const [masterKey, setMasterKey] = useState('');
  
  // Registration Form
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminConfirm, setNewAdminConfirm] = useState('');

  // --- INITIALIZATION ---
  useEffect(() => {
    const checkSystem = async () => {
        try {
            const res = await Api.checkAdminExists();
            setHasAdmin(res.exists);
            setServerStatus('online');
        } catch (e) {
            console.warn("Server unreachable:", e);
            setServerStatus('offline');
            setError("Cannot connect to server. Check your network.");
        }
    };
    checkSystem();

    // Lockout Timer
    const timer = setInterval(() => {
        setLockoutMinutes(Database.checkAdminLockout());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // --- HANDLERS ---

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      
      const currentLockout = Database.checkAdminLockout();
      if (currentLockout > 0) {
          setLockoutMinutes(currentLockout);
          setError(`Terminal Locked. Wait ${currentLockout} minutes.`);
          return;
      }

      setLoading(true);

      try {
          const user = await Api.adminLogin(email, password);
          
          if (user && user.role === UserRole.ADMIN) {
              Database.resetAdminFailure();
              onLogin(user);
          } else {
              throw new Error("Access Denied: User not authorized.");
          }
      } catch (err: any) {
          const msg = err.message || "Login failed.";
          
          // INTELLIGENT LOCKOUT:
          // Only lockout on specific auth failures, not network/server crashes.
          const isAuthError = msg.toLowerCase().includes('invalid') || 
                              msg.toLowerCase().includes('password') || 
                              msg.toLowerCase().includes('credential') ||
                              msg.toLowerCase().includes('denied');

          if (isAuthError) {
              Database.recordAdminFailure();
              setLockoutMinutes(Database.checkAdminLockout());
              setError("Access Denied. Invalid credentials.");
          } else {
              // Network or Server Error - Do not lockout
              setError(`Connection Failure: ${msg}`);
          }
      } finally {
          setLoading(false);
      }
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      if (masterKey !== 'PEUTIC-MASTER-2025') {
          setError("Invalid Master Key.");
          setLoading(false);
          return;
      }

      if (newAdminPassword !== newAdminConfirm) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
      }

      if (newAdminPassword.length < 8) {
          setError("Password must be at least 8 characters.");
          setLoading(false);
          return;
      }

      try {
          const res = await Api.initAdmin({
              masterKey,
              email: newAdminEmail,
              password: newAdminPassword,
              name: 'System Admin',
              reset: hasAdmin // If admin exists, this is a reset
          });

          if (res.success) {
              setSuccessMsg("System Initialized. Redirecting...");
              setHasAdmin(true);
              Database.resetAdminFailure();
              setTimeout(() => {
                  setView('login');
                  setSuccessMsg('');
                  setEmail(newAdminEmail);
                  setMasterKey('');
              }, 2000);
          }
      } catch (err: any) {
          setError(err.message || "Initialization failed.");
      } finally {
          setLoading(false);
      }
  };

  const handleOverride = (e: React.FormEvent) => {
      e.preventDefault();
      if (masterKey === 'PEUTIC-MASTER-2025') {
          Database.resetAdminFailure();
          setLockoutMinutes(0);
          setView('login');
          setMasterKey('');
          setSuccessMsg("Security Override Accepted. Terminal Unlocked.");
      } else {
          setError("Invalid Master Key.");
      }
  };

  // --- RENDER HELPERS ---

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
        
        {/* Status Bar */}
        <div className="absolute top-6 right-6 flex items-center gap-3 bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-full px-4 py-2">
            {serverStatus === 'checking' ? (
                <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />
            ) : serverStatus === 'online' ? (
                <Wifi className="w-4 h-4 text-green-500" />
            ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-xs font-mono font-bold uppercase ${serverStatus === 'online' ? 'text-green-500' : serverStatus === 'offline' ? 'text-red-500' : 'text-yellow-500'}`}>
                {serverStatus === 'checking' ? 'SYNCING...' : serverStatus === 'online' ? 'SYSTEM ONLINE' : 'OFFLINE MODE'}
            </span>
        </div>

        <div className="w-full max-w-md z-10">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="w-20 h-20 bg-yellow-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-[0_0_40px_rgba(234,179,8,0.3)] animate-in zoom-in duration-500">
                    <Shield className="w-10 h-10 text-black fill-black" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tight mb-2">COMMAND CENTER</h1>
                <div className="flex items-center justify-center gap-2">
                    <Terminal className="w-3 h-3 text-gray-500" />
                    <p className="text-gray-500 font-mono text-xs tracking-[0.2em] uppercase">Restricted Access Level 5</p>
                </div>
            </div>

            {/* Main Card */}
            <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all duration-300">
                
                {/* Top Border Accent */}
                <div className={`absolute top-0 left-0 w-full h-1 ${lockoutMinutes > 0 ? 'bg-red-500' : 'bg-yellow-500'}`}></div>

                {/* Notifications */}
                {error && (
                    <div className="mb-6 p-4 bg-red-950/30 border border-red-900/50 text-red-400 text-xs font-bold rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                    </div>
                )}
                {successMsg && (
                    <div className="mb-6 p-4 bg-green-950/30 border border-green-900/50 text-green-400 text-xs font-bold rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <Terminal className="w-4 h-4 flex-shrink-0" /> {successMsg}
                    </div>
                )}

                {/* --- LOCKED STATE --- */}
                {lockoutMinutes > 0 && view !== 'override' ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <Lock className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-red-500 mb-2">TERMINAL LOCKED</h3>
                        <p className="text-gray-400 text-sm mb-6">Too many failed attempts.</p>
                        <div className="bg-black/50 rounded-xl p-4 border border-red-900/30 mb-8">
                            <p className="text-yellow-500 font-mono text-2xl font-bold">{lockoutMinutes}m</p>
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">Retry Timer</p>
                        </div>
                        <button 
                            onClick={() => { setView('override'); setError(''); }}
                            className="text-xs text-gray-500 hover:text-white underline flex items-center justify-center gap-2 mx-auto transition-colors"
                        >
                            <Key className="w-3 h-3" /> Emergency Override
                        </button>
                    </div>
                ) : (
                    <>
                        {/* --- LOGIN VIEW --- */}
                        {view === 'login' && (
                            <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Administrator ID</label>
                                    <input 
                                        type="email" 
                                        required 
                                        autoFocus
                                        className="w-full bg-black border border-gray-800 rounded-xl p-4 text-white placeholder-gray-700 focus:border-yellow-500 outline-none transition-all text-sm font-medium" 
                                        placeholder="admin@peutic.com" 
                                        value={email} 
                                        onChange={e => setEmail(e.target.value)} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Secure Passkey</label>
                                    <input 
                                        type="password" 
                                        required 
                                        className="w-full bg-black border border-gray-800 rounded-xl p-4 text-white placeholder-gray-700 focus:border-yellow-500 outline-none transition-all text-sm font-medium" 
                                        placeholder="••••••••••••" 
                                        value={password} 
                                        onChange={e => setPassword(e.target.value)} 
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={loading} 
                                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest hover:scale-[1.02] shadow-lg shadow-yellow-500/10"
                                >
                                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                    {loading ? "Authenticating..." : "Access Terminal"}
                                </button>

                                <button 
                                    type="button" 
                                    onClick={() => { setView('register'); setError(''); }} 
                                    className="w-full mt-4 py-2 text-xs font-bold text-gray-600 hover:text-white flex items-center justify-center gap-2 transition-colors"
                                >
                                    {hasAdmin ? <><RefreshCw className="w-3 h-3" /> System Recovery</> : <><PlusCircle className="w-3 h-3" /> Initialize System</>}
                                </button>
                            </form>
                        )}

                        {/* --- REGISTER / RESET VIEW --- */}
                        {view === 'register' && (
                            <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                <div className="text-center mb-4">
                                    <h3 className="text-white font-bold text-lg">{hasAdmin ? "System Reset" : "Initialize Admin"}</h3>
                                    <p className="text-xs text-gray-500">Master Key required for root access.</p>
                                </div>
                                <input type="password" required className="w-full bg-black border border-gray-800 rounded-xl p-3 text-white focus:border-yellow-500 outline-none text-sm" placeholder="Master Key" value={masterKey} onChange={e => setMasterKey(e.target.value)} />
                                <div className="h-px bg-gray-800 my-2"></div>
                                <input type="email" required className="w-full bg-black border border-gray-800 rounded-xl p-3 text-white focus:border-yellow-500 outline-none text-sm" placeholder="New Admin Email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} />
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="password" required className="w-full bg-black border border-gray-800 rounded-xl p-3 text-white focus:border-yellow-500 outline-none text-sm" placeholder="Password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} />
                                    <input type="password" required className="w-full bg-black border border-gray-800 rounded-xl p-3 text-white focus:border-yellow-500 outline-none text-sm" placeholder="Confirm" value={newAdminConfirm} onChange={e => setNewAdminConfirm(e.target.value)} />
                                </div>
                                <button disabled={loading} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors mt-2 text-sm uppercase tracking-wide">
                                    {loading ? "Processing..." : (hasAdmin ? "Wipe & Reset" : "Create Root Admin")}
                                </button>
                                <button type="button" onClick={() => { setView('login'); setError(''); }} className="w-full text-gray-500 hover:text-white text-xs py-2">Cancel</button>
                            </form>
                        )}

                        {/* --- OVERRIDE VIEW --- */}
                        {view === 'override' && (
                            <form onSubmit={handleOverride} className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <div className="text-center mb-4">
                                    <h3 className="text-red-500 font-bold flex items-center justify-center gap-2"><Key className="w-4 h-4"/> Security Override</h3>
                                    <p className="text-xs text-gray-500 mt-1">Enter Master Key to clear lockout.</p>
                                </div>
                                <input 
                                    type="password" 
                                    autoFocus
                                    className="w-full bg-black border border-red-900/50 rounded-xl p-4 text-white focus:border-red-500 outline-none mb-2" 
                                    placeholder="Master Key" 
                                    value={masterKey} 
                                    onChange={e => setMasterKey(e.target.value)} 
                                />
                                <button className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors">
                                    UNLOCK TERMINAL
                                </button>
                                <button type="button" onClick={() => { setView('login'); setError(''); }} className="w-full text-gray-500 hover:text-white text-xs py-2">
                                    Cancel
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
                <a href="/" className="text-gray-600 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors group">
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Public Site
                </a>
            </div>
        </div>
    </div>
  );
};

export default AdminLogin;
