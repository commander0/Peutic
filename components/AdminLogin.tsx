
import React, { useState, useEffect } from 'react';
import { Database } from '../services/database';
import { Api } from '../services/api';
import { UserRole } from '../types';
import { Lock, AlertCircle, Shield, ArrowRight, PlusCircle, RefreshCw, Key } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (user: any) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Lockout State
  const [lockoutMinutes, setLockoutMinutes] = useState(Database.checkAdminLockout());
  const [showOverride, setShowOverride] = useState(false);
  const [overrideKey, setOverrideKey] = useState('');

  const [showRegister, setShowRegister] = useState(false);
  const [masterKey, setMasterKey] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState('');
  
  // Checking server state
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(false);

  useEffect(() => {
      const checkAdmin = async () => {
          try {
              const res = await Api.checkAdminExists();
              setHasAdmin(res.exists);
          } catch (e) {
              console.warn("Could not reach server to check admin status");
          } finally {
              setCheckingStatus(false);
          }
      };
      checkAdmin();

      // Check lockout status every second to update timer or auto-unlock
      const timer = setInterval(() => {
          setLockoutMinutes(Database.checkAdminLockout());
      }, 1000);

      return () => clearInterval(timer);
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Double check lockout before submitting
    const currentLockout = Database.checkAdminLockout();
    if (currentLockout > 0) {
        setLockoutMinutes(currentLockout);
        setError(`System Locked. Try again in ${currentLockout} minutes.`);
        return;
    }

    setLoading(true);
    
    try {
        const user = await Api.adminLogin(email, password);
        
        if (user && user.role === UserRole.ADMIN) {
            Database.resetAdminFailure();
            onLogin(user);
        } else {
             throw new Error("Access Denied");
        }
    } catch (err: any) {
         Database.recordAdminFailure();
         // Update lockout state immediately after failure
         setLockoutMinutes(Database.checkAdminLockout());
         setError(err.message || "Access Denied. Invalid credentials.");
    } finally {
        setLoading(false);
    }
  };

  const handleOverride = (e: React.FormEvent) => {
      e.preventDefault();
      if (overrideKey === 'PEUTIC-MASTER-2025') {
          Database.resetAdminFailure();
          setLockoutMinutes(0);
          setShowOverride(false);
          setOverrideKey('');
          setSuccessMsg("Terminal Unlocked via Master Key Override.");
      } else {
          setError("Invalid Master Key.");
      }
  };

  const validatePasswordStrength = (pwd: string): string | null => {
      if (pwd.length < 8) return "Password must be at least 8 characters long.";
      if (!/[A-Z]/.test(pwd)) return "Password must include at least one uppercase letter.";
      if (!/[a-z]/.test(pwd)) return "Password must include at least one lowercase letter.";
      if (!/[0-9]/.test(pwd)) return "Password must include at least one number.";
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Password must include at least one special character.";
      return null;
  };

  const handleRegisterAdmin = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccessMsg('');
      setLoading(true);

      if (masterKey.trim() !== 'PEUTIC-MASTER-2025') {
          setError("Invalid Master Key.");
          setLoading(false);
          return;
      }
      if (newAdminPassword !== newAdminConfirmPassword) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
      }
      
      const weakPasswordMsg = validatePasswordStrength(newAdminPassword);
      if (weakPasswordMsg) {
          setError(weakPasswordMsg);
          setLoading(false);
          return;
      }

      const resetRequested = hasAdmin && confirm("WARNING: This will RESET the database and existing admin accounts. Continue?");
      if (hasAdmin && !resetRequested) {
          setLoading(false);
          return;
      }

      try {
          const res = await Api.initAdmin({
              masterKey,
              email: newAdminEmail,
              password: newAdminPassword,
              name: 'System Admin',
              reset: hasAdmin // Reset if admin already exists
          });

          if (res.success) {
              setSuccessMsg(hasAdmin ? "System Reset Successful. New Admin Created." : "Root Admin Created Successfully.");
              setHasAdmin(true);
              Database.resetAdminFailure(); // Clear any lockouts on successful init
              setLockoutMinutes(0);
              
              setTimeout(() => {
                  setShowRegister(false);
                  setSuccessMsg('');
                  setEmail(newAdminEmail);
                  setMasterKey('');
                  setNewAdminPassword('');
                  setNewAdminConfirmPassword('');
              }, 2000);
          } else {
              throw new Error("Init failed");
          }
      } catch (err: any) {
          setError(err.message || "Failed to initialize admin.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-yellow-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                    <Shield className="w-8 h-8 text-black fill-black" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">COMMAND CENTER</h1>
                <p className="text-gray-500 font-mono text-xs mt-2 tracking-widest uppercase">Restricted Access Level 5</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl overflow-hidden relative transition-all duration-300">
                {lockoutMinutes > 0 && !showOverride ? (
                    <div className="text-center py-8">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
                        <h3 className="text-xl font-bold text-red-500">TERMINAL LOCKED</h3>
                        <p className="text-white font-mono mt-4 text-sm">Too many failed attempts.</p>
                        <p className="text-yellow-500 font-mono text-lg font-bold mt-2">Unlock in: {lockoutMinutes}m</p>
                        
                        <button 
                            onClick={() => setShowOverride(true)}
                            className="mt-8 text-xs text-gray-600 hover:text-white underline flex items-center justify-center gap-2 mx-auto transition-colors"
                        >
                            <Key className="w-3 h-3" /> Emergency Override
                        </button>
                    </div>
                ) : showOverride ? (
                    <form onSubmit={handleOverride} className="py-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="text-center mb-6">
                            <h3 className="text-white font-bold flex items-center justify-center gap-2"><Key className="w-4 h-4 text-yellow-500"/> Security Override</h3>
                            <p className="text-xs text-gray-500 mt-1">Enter Master Key to reset lockout.</p>
                        </div>
                        {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-400 text-xs rounded-lg text-center font-bold">{error}</div>}
                        <input 
                            type="password" 
                            autoFocus
                            className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none mb-4" 
                            placeholder="Master Key" 
                            value={overrideKey} 
                            onChange={e => setOverrideKey(e.target.value)} 
                        />
                        <button className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors mb-3">
                            UNLOCK TERMINAL
                        </button>
                        <button type="button" onClick={() => { setShowOverride(false); setError(''); }} className="w-full text-gray-500 hover:text-white text-xs py-2">
                            Cancel
                        </button>
                    </form>
                ) : (
                    <>
                        {error && <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-400 text-sm rounded-xl flex items-center gap-2 font-bold">{error}</div>}
                        {successMsg && <div className="mb-6 p-4 bg-green-900/30 border border-green-800 text-green-400 text-sm rounded-xl flex items-center gap-2 font-bold">{successMsg}</div>}

                        {checkingStatus ? (
                            <div className="text-center py-8">
                                <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            </div>
                        ) : showRegister ? (
                             <form onSubmit={handleRegisterAdmin} className="space-y-4 animate-in fade-in">
                                <div className="text-center mb-4">
                                    <h3 className="text-white font-bold text-lg">{hasAdmin ? "Emergency System Reset" : "Initialize Root Admin"}</h3>
                                    {hasAdmin && <p className="text-xs text-red-400 mt-1">This will wipe user data to restore access.</p>}
                                </div>
                                <input type="password" className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none" placeholder="Master Key" value={masterKey} onChange={e => setMasterKey(e.target.value)} />
                                <input type="email" required className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none" placeholder="New Admin Email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="password" required className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none" placeholder="Password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} />
                                    <input type="password" required className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none" placeholder="Confirm" value={newAdminConfirmPassword} onChange={e => setNewAdminConfirmPassword(e.target.value)} />
                                </div>
                                <div className="text-[10px] text-gray-500 leading-tight">Must contain 8+ chars, uppercase, lowercase, number, symbol.</div>
                                <button disabled={loading} className="w-full bg-yellow-500 text-black font-black py-4 rounded-xl hover:bg-yellow-400 transition-colors mt-4">
                                    {loading ? "INITIALIZING..." : (hasAdmin ? "RESET & CREATE ADMIN" : "INITIALIZE SYSTEM")}
                                </button>
                                <button type="button" onClick={() => setShowRegister(false)} className="text-gray-500 text-sm w-full text-center hover:text-white py-2">Cancel</button>
                             </form>
                        ) : (
                            <form onSubmit={handleAdminLogin} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Admin Email</label>
                                    <input type="email" required className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none transition-colors" placeholder="admin@peutic.com" value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Password</label>
                                    <input type="password" required className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none transition-colors" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2">
                                    {loading ? <span className="animate-pulse">Authenticating...</span> : <><Lock className="w-4 h-4" /> ACCESS TERMINAL</>}
                                </button>
                                
                                <button type="button" onClick={() => setShowRegister(true)} className={`w-full border border-gray-800 text-gray-500 py-3 rounded-xl text-xs font-bold hover:bg-gray-900 hover:text-white transition-colors flex items-center justify-center gap-2 mt-4 ${hasAdmin ? 'opacity-50 hover:opacity-100' : ''}`}>
                                    {hasAdmin ? <><RefreshCw className="w-3 h-3" /> System Recovery</> : <><PlusCircle className="w-3 h-3" /> INITIALIZE SYSTEM (First Run)</>}
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>
            <div className="mt-8 text-center">
                <a href="/" className="text-gray-600 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors">Return to Public Site <ArrowRight className="w-3 h-3" /></a>
            </div>
        </div>
    </div>
  );
};

export default AdminLogin;
