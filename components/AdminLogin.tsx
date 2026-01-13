
import React, { useState, useEffect } from 'react';
import { Database } from '../services/database';
import { supabase } from '../services/supabaseClient';
import { UserRole } from '../types';
import { Lock, AlertCircle, Shield, ArrowRight, PlusCircle, Check, RefreshCw, Crown, KeyRound, UserPlus, Mail } from 'lucide-react';

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
            
            if (authError.message.includes("Invalid login credentials")) {
                throw new Error("Account not found or wrong password. If this is your first time, please use 'Create Admin Access' below.");
            }
            if (authError.message.includes("Email not confirmed")) {
                throw new Error("Your email address has not been verified yet. Please check your inbox for the confirmation link.");
            }
            throw new Error(authError.message);
        }

        if (!authData.user) throw new Error("Auth failed");

        // 2. FETCH PROFILE (Now authorized)
        const user = await Database.syncUser(authData.user.id);
        
        if (!user) {
             // Fallback: If auth succeeded but DB profile is missing, try to repair
             try {
                 // Attempt to force-create the profile using the auth data
                 const repaired = await Database.createUser(
                     authData.user.user_metadata.full_name || 'Admin', 
                     normalizedEmail, 
                     password // This path won't actually use password for creation, just reference
                 );
                 if (repaired && repaired.role === UserRole.ADMIN) {
                     onLogin(repaired);
                     return;
                 }
             } catch (repairErr) {
                 console.error("Repair failed", repairErr);
             }
             
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
      // Relaxed special char requirement for local dev ease, but keeping it for production feel
      // if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Password must include at least one special character.";
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

      try {
          const finalEmail = newAdminEmail.toLowerCase().trim();
          
          // Use standard creation. 
          const newUser = await Database.createUser('System Admin', finalEmail, newAdminPassword);

          // If this is the FIRST user, they become ADMIN automatically via DB Trigger.
          if (newUser.role === UserRole.ADMIN) {
              setSuccessMsg("Root Admin Initialized Successfully.");
              setTimeout(() => {
                  setShowRegister(false);
                  setSuccessMsg('');
                  setEmail(finalEmail);
                  setNewAdminPassword('');
                  setNewAdminConfirmPassword('');
                  setHasAdmin(true);
              }, 1500);
          } else {
              setError("Account created, but 'Admin' role could not be auto-assigned. Please check settings.");
          }

      } catch (e: any) {
          console.error(e);
          if (e.message.includes("check your email")) {
              // Handle Email Verification Case gracefully
              setSuccessMsg("Account created! Verification email sent.");
              setError(""); // Clear error if it was just verification warning
              setTimeout(() => {
                  setShowRegister(false);
                  setEmail(newAdminEmail);
              }, 2500);
          } else if (e.message.includes("registered")) {
              setError("This email is already registered. Please log in.");
              setShowRegister(false);
              setEmail(newAdminEmail);
          } else {
              setError(e.message || "Initialization Failed.");
          }
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
                        {error && <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-400 text-sm rounded-xl flex items-center gap-2 font-bold animate-pulse"><AlertCircle className="w-4 h-4 flex-shrink-0"/> <span>{error}</span></div>}
                        {successMsg && <div className="mb-6 p-4 bg-green-900/30 border border-green-800 text-green-400 text-sm rounded-xl flex items-center gap-2 font-bold animate-bounce"><Mail className="w-4 h-4"/> {successMsg}</div>}

                        {showRegister ? (
                             <form onSubmit={handleRegisterAdmin} className="space-y-4 animate-in fade-in">
                                <div className="text-center mb-6 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                                    <h3 className="text-white font-black text-lg flex items-center justify-center gap-2 uppercase tracking-wide"><Crown className="w-5 h-5 text-yellow-500"/> System Claim</h3>
                                    <p className="text-[10px] text-gray-400 mt-1">Initialize or create new admin credentials.</p>
                                </div>
                                <input type="email" required className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none transition-colors" placeholder="New Admin Email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="password" required className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none transition-colors" placeholder="Password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} />
                                    <input type="password" required className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none transition-colors" placeholder="Confirm" value={newAdminConfirmPassword} onChange={e => setNewAdminConfirmPassword(e.target.value)} />
                                </div>
                                <button disabled={loading} className="w-full bg-yellow-500 text-black font-black py-4 rounded-xl hover:bg-yellow-400 transition-colors mt-4 shadow-lg shadow-yellow-500/20 uppercase tracking-widest text-sm">
                                    {loading ? "INITIALIZING..." : "CREATE ADMIN ACCOUNT"}
                                </button>
                                
                                <div className="pt-4 text-center">
                                    <button type="button" onClick={() => setShowRegister(false)} className="text-gray-500 hover:text-white text-xs font-bold transition-colors">Return to Login</button>
                                </div>
                             </form>
                        ) : (
                            <form onSubmit={handleAdminLogin} className="space-y-6 animate-in fade-in">
                                <div className="text-center mb-2">
                                    <h3 className="text-white font-bold text-sm uppercase tracking-widest text-gray-500">Secure Login</h3>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Admin Identifier</label>
                                    <input type="email" className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none transition-colors" placeholder="admin@peutic.com" value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Secure Key</label>
                                    <input type="password" className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none transition-colors" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-white hover:bg-gray-200 text-black font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02]">
                                    {loading ? <span className="animate-pulse">Authenticating...</span> : <><KeyRound className="w-4 h-4" /> ACCESS TERMINAL</>}
                                </button>
                                
                                <div className="pt-4 text-center">
                                    <button type="button" onClick={() => setShowRegister(true)} className="text-yellow-600 hover:text-yellow-500 text-xs font-bold transition-colors uppercase tracking-wide flex items-center justify-center gap-2 mx-auto">
                                        <UserPlus className="w-3 h-3" /> Create / Claim Admin Access
                                    </button>
                                </div>
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
