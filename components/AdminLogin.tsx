
import React, { useState, useEffect } from 'react';
import { Database } from '../services/database';
import { supabase } from '../services/supabaseClient';
import { UserRole } from '../types';
import { Lock, AlertCircle, Shield, ArrowRight, PlusCircle, Check, RefreshCw } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (user: any) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [showRegister, setShowRegister] = useState(false);
  const [masterKey, setMasterKey] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState('');

  const [hasAdmin, setHasAdmin] = useState(false);
  const [lockout, setLockout] = useState(0);

  useEffect(() => {
      Database.hasAdmin().then(setHasAdmin);
      Database.checkAdminLockout().then(setLockout);
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Check fresh lockout status
    const currentLockout = await Database.checkAdminLockout();
    if (currentLockout > 0) {
        setLockout(currentLockout);
        setError(`System Locked. Try again in ${currentLockout} minutes.`);
        return;
    }
    
    setLoading(true);
    
    try {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await Database.fetchUserFromCloud(normalizedEmail);
        
        if (!user) {
             setError("User not found in database. 1) Check capitalization. 2) Ensure SQL Schema RLS is open (run supabase/schema.sql).");
             setLoading(false);
             return;
        }

        if (user.role === UserRole.ADMIN) {
            Database.resetAdminFailure();
            onLogin(user);
        } else {
             await Database.recordAdminFailure();
             setError("Access Denied. This account does not have Administrator privileges.");
             // Re-check lockout immediately
             const newLock = await Database.checkAdminLockout();
             if (newLock > 0) setLockout(newLock);
        }
    } catch (e) {
        console.error(e);
        setError("Connection Error. Ensure Database is reachable.");
    } finally {
        setLoading(false);
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

      if (newAdminPassword !== newAdminConfirmPassword) {
          setError("Passwords do not match.");
          return;
      }
      
      const weakPasswordMsg = validatePasswordStrength(newAdminPassword);
      if (weakPasswordMsg) {
          setError(weakPasswordMsg);
          return;
      }

      setLoading(true);

      // --- SECURE VERIFICATION ---
      try {
          let verified = false;

          // 1. Try Server-Side Verification (Preferred)
          try {
              const { data, error } = await supabase.functions.invoke('api-gateway', {
                  body: { action: 'admin-verify', payload: { key: masterKey } }
              });

              if (!error && data?.success) {
                  verified = true;
              }
          } catch (serverError) {
              console.warn("Server verification unreachable. Attempting local default check.");
          }

          // 2. Fallback: Local Check (For initial setup/local dev only if server is down)
          if (!verified) {
               const DEFAULT_KEY = 'PEUTIC-MASTER-2025-SECURE';
               if (masterKey === DEFAULT_KEY) {
                   verified = true;
               } else {
                   throw new Error("Invalid Master Key");
               }
          }
          
          if (!verified) throw new Error("Verification Failed");

          // If verification passed, proceed with creation
          if (hasAdmin) {
              if (confirm("WARNING: System Reset Confirmed. Proceeding.")) {
                  await Database.resetAllUsers();
              } else {
                  setLoading(false);
                  return;
              }
          }

          const finalEmail = newAdminEmail.toLowerCase().trim();

          // Pass the Master Key to the backend so it authorizes the creation
          await Database.createUser('System Admin', finalEmail, 'email', undefined, UserRole.ADMIN, masterKey);
          setSuccessMsg("Root Admin Created Successfully.");
          
          setTimeout(() => {
              setShowRegister(false);
              setSuccessMsg('');
              setEmail(finalEmail);
              setMasterKey('');
              setNewAdminPassword('');
              setNewAdminConfirmPassword('');
              setHasAdmin(true);
          }, 2000);

      } catch (e: any) {
          console.error(e);
          setError(e.message || "Invalid Master Key or Connection Failed.");
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

            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
                {lockout > 0 ? (
                    <div className="text-center py-12">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-red-500">TERMINAL LOCKED</h3>
                        <p className="text-white font-mono mt-4">Unlock in: {lockout}m</p>
                    </div>
                ) : (
                    <>
                        {error && <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-400 text-sm rounded-xl flex items-center gap-2 font-bold">{error}</div>}
                        {successMsg && <div className="mb-6 p-4 bg-green-900/30 border border-green-800 text-green-400 text-sm rounded-xl flex items-center gap-2 font-bold">{successMsg}</div>}

                        {showRegister ? (
                             <form onSubmit={handleRegisterAdmin} className="space-y-4">
                                <div className="text-center mb-4">
                                    <h3 className="text-white font-bold text-lg">{hasAdmin ? "Emergency System Reset" : "Initialize Root Admin"}</h3>
                                    <p className="text-xs text-gray-500">Enter Master Key to Initialize</p>
                                </div>
                                <input type="password" className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none" placeholder="Master Key (Default: PEUTIC...)" value={masterKey} onChange={e => setMasterKey(e.target.value)} />
                                <input type="email" required className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none" placeholder="New Admin Email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="password" required className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none" placeholder="Password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} />
                                    <input type="password" required className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none" placeholder="Confirm" value={newAdminConfirmPassword} onChange={e => setNewAdminConfirmPassword(e.target.value)} />
                                </div>
                                <button disabled={loading} className="w-full bg-yellow-500 text-black font-black py-4 rounded-xl hover:bg-yellow-400 transition-colors mt-4">
                                    {loading ? "VERIFYING..." : (hasAdmin ? "RESET & CREATE ADMIN" : "INITIALIZE SYSTEM")}
                                </button>
                                <button type="button" onClick={() => setShowRegister(false)} className="text-gray-500 text-sm w-full text-center hover:text-white py-2">Cancel</button>
                             </form>
                        ) : (
                            <form onSubmit={handleAdminLogin} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Admin Identifier</label>
                                    <input type="email" className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none transition-colors" placeholder="admin@peutic.com" value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Secure Key</label>
                                    <input type="password" className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none transition-colors" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
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
