
import React, { useState, useEffect } from 'react';
import { Database } from '../services/database';
import { supabase } from '../services/supabaseClient';
import { UserRole } from '../types';
import { Lock, AlertCircle, Shield, ArrowRight, PlusCircle, Check, RefreshCw, Crown } from 'lucide-react';

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
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState('');

  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [lockout, setLockout] = useState(0);

  useEffect(() => {
      // Check if admin exists to determine if we show "Initialize System"
      Database.hasAdmin().then(exists => {
          setHasAdmin(exists);
          // If no admin exists, default to Registration mode
          if (!exists) setShowRegister(true);
      });
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

        // 1. AUTHENTICATE FIRST (Required for RLS)
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: password
        });

        if (authError) {
            await Database.recordAdminFailure();
            const newLock = await Database.checkAdminLockout();
            if (newLock > 0) setLockout(newLock);
            throw new Error("Invalid Credentials");
        }

        if (!authData.user) throw new Error("Auth failed");

        // 2. FETCH PROFILE (Now authorized)
        const user = await Database.syncUser(authData.user.id);
        
        if (!user) {
             setError("Profile sync error. Please try again.");
             setLoading(false);
             return;
        }

        if (user.role === UserRole.ADMIN) {
            Database.resetAdminFailure();
            onLogin(user);
        } else {
             await Database.recordAdminFailure();
             setError("Access Denied. This account is not an Administrator.");
             await supabase.auth.signOut();
        }
    } catch (e: any) {
        console.error(e);
        setError(e.message || "Connection Error.");
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

      if (hasAdmin) {
          setError("System already initialized. Additional admins cannot be created via this terminal.");
          return;
      }

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

      try {
          const finalEmail = newAdminEmail.toLowerCase().trim();
          
          // Use standard creation. The Database Trigger will handle role assignment.
          // IF table is empty, trigger sets ADMIN.
          // IF table has users, trigger sets USER.
          const newUser = await Database.createUser('System Admin', finalEmail, newAdminPassword);

          if (newUser.role === UserRole.ADMIN) {
              setSuccessMsg("Root Admin Initialized Successfully.");
              setTimeout(() => {
                  setShowRegister(false);
                  setSuccessMsg('');
                  setEmail(finalEmail);
                  setNewAdminPassword('');
                  setNewAdminConfirmPassword('');
                  setHasAdmin(true);
              }, 2000);
          } else {
              // This happens if someone else claimed it first
              throw new Error("Initialization Failed: System already has an owner.");
          }

      } catch (e: any) {
          console.error(e);
          setError(e.message || "Initialization Failed.");
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

                        {showRegister && !hasAdmin ? (
                             <form onSubmit={handleRegisterAdmin} className="space-y-4">
                                <div className="text-center mb-4">
                                    <h3 className="text-white font-bold text-lg flex items-center justify-center gap-2"><Crown className="w-5 h-5 text-yellow-500"/> Initialize Root Admin</h3>
                                    <p className="text-xs text-gray-500">No admins detected. Claim system ownership.</p>
                                </div>
                                <input type="email" required className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none transition-colors" placeholder="Admin Email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="password" required className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none transition-colors" placeholder="Password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} />
                                    <input type="password" required className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none transition-colors" placeholder="Confirm" value={newAdminConfirmPassword} onChange={e => setNewAdminConfirmPassword(e.target.value)} />
                                </div>
                                <button disabled={loading} className="w-full bg-yellow-500 text-black font-black py-4 rounded-xl hover:bg-yellow-400 transition-colors mt-4 shadow-lg shadow-yellow-500/20">
                                    {loading ? "INITIALIZING..." : "CLAIM SYSTEM"}
                                </button>
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
                                <button type="submit" disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20">
                                    {loading ? <span className="animate-pulse">Authenticating...</span> : <><Lock className="w-4 h-4" /> ACCESS TERMINAL</>}
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
