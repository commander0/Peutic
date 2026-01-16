
import React, { useState, useEffect } from 'react';
import { AdminService } from '../services/adminService';
import { UserService } from '../services/userService';

import { supabase } from '../services/supabaseClient';
import { UserRole } from '../types';
import { Lock, Shield, ArrowRight, KeyRound, AlertCircle, Check, Crown } from 'lucide-react';


interface AdminLoginProps {
    onLogin: (user: any) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const [showRegister, setShowRegister] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState('');

    const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
    const [lockout, setLockout] = useState(0);

    const [showReclaim, setShowReclaim] = useState(false);
    const [masterKey, setMasterKey] = useState('');

    useEffect(() => {
        // Check if admin exists to determine if we show "Initialize System"
        AdminService.hasAdmin().then(exists => {
            setHasAdmin(exists);
            // If no admin exists, default to Registration mode
            if (!exists) setShowRegister(true);
        });
        AdminService.getAdminLockoutStatus().then(setLockout);
    }, []);


    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Check fresh lockout status
        const currentLockout = await AdminService.getAdminLockoutStatus();
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
                await AdminService.recordAdminFailure();
                const newLock = await AdminService.getAdminLockoutStatus();
                if (newLock > 0) setLockout(newLock);

                if (authError.message.includes("Invalid login credentials")) {
                    throw new Error("Account not found or wrong password. If this is your first time, please use 'Create Admin Access' below.");
                }

                // --- SELF-HEALING: EMAIL NOT CONFIRMED ---
                if (authError.message.includes("Email not confirmed")) {
                    setIsVerifying(true);
                    // Attempt backend force verification
                    const verified = await AdminService.forceVerifyEmail(normalizedEmail);
                    if (verified) {
                        setIsVerifying(false);
                        // Retry Login Immediately
                        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                            email: normalizedEmail,
                            password: password
                        });
                        if (retryError || !retryData.user) {
                            throw new Error("Auto-verification succeeded, but login still failed. Please try again.");
                        }
                        // Success fall-through
                        authData.user = retryData.user;
                    } else {
                        setIsVerifying(false);
                        throw new Error("Your email address has not been verified yet. Please check your inbox for the confirmation link.");
                    }
                } else {
                    throw new Error(authError.message);
                }
            }

            if (!authData?.user) throw new Error("Auth failed");

            // 2. FETCH PROFILE (Now authorized)
            const user = await UserService.syncUser(authData.user.id);

            if (!user) {
                // Fallback: If auth succeeded but DB profile is missing, try to repair
                try {
                    const repaired = await UserService.createUser(
                        authData.user.user_metadata.full_name || 'Admin',
                        normalizedEmail,
                        password
                    );
                    if (repaired && repaired.role === UserRole.ADMIN) {
                        onLogin(repaired);
                        return;
                    }
                    throw new Error("Account exists but does not have Admin privileges.");
                } catch (repairErr: any) {
                    console.error("Repair failed", repairErr);
                    throw repairErr;
                }
            }

            if (user.role === UserRole.ADMIN) {
                AdminService.resetAdminFailure();
                onLogin(user);
            } else {
                await AdminService.recordAdminFailure();
                setError("Access Denied. This account is not an Administrator.");
                await UserService.logout();
            }

        } catch (e: any) {
            console.error(e);
            setError(e.message || "Connection Error.");
        } finally {
            setLoading(false);
            setIsVerifying(false);
        }
    };

    const validatePasswordStrength = (pwd: string): string | null => {
        if (pwd.length < 8) return "Password must be at least 8 characters long.";
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

            // Use NEW Server-Side Creation Bypass
            const newUser = await AdminService.createRootAdmin(finalEmail, newAdminPassword);


            if (newUser && newUser.role === UserRole.ADMIN) {
                setSuccessMsg("Root Admin Initialized Successfully.");
                setTimeout(() => {
                    onLogin(newUser); // Auto Login
                }, 1500);
            } else {
                throw new Error("Account created, but admin role assignment failed.");
            }

        } catch (e: any) {
            console.error(e);
            setError(e.message || "Initialization Failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleReclaimSystem = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const isValid = AdminService.verifyMasterKey(masterKey);

        if (!isValid) {
            setError("Invalid Master Key. Reclamation failed.");
            setLoading(false);
            return;
        }

        try {
            await AdminService.resetAdminStatus(masterKey);

            setSuccessMsg("System Ownership Reset. You may now initialize a new Root Admin.");
            setHasAdmin(false);
            setShowRegister(true);
            setShowReclaim(false);
        } catch (e: any) {
            setError(e.message || "Reclamation error.");
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
                            {error && <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-400 text-sm rounded-xl flex items-center gap-2 font-bold animate-pulse"><AlertCircle className="w-4 h-4 flex-shrink-0" /> <span>{error}</span></div>}
                            {successMsg && <div className="mb-6 p-4 bg-green-900/30 border border-green-800 text-green-400 text-sm rounded-xl flex items-center gap-2 font-bold animate-bounce"><Check className="w-4 h-4" /> {successMsg}</div>}

                            {showReclaim ? (
                                <form onSubmit={handleReclaimSystem} className="space-y-4 animate-in fade-in">
                                    <div className="text-center mb-6 p-4 bg-red-500/10 rounded-xl border border-red-500/30">
                                        <h3 className="text-white font-black text-lg flex items-center justify-center gap-2 uppercase tracking-wide"><Shield className="w-5 h-5 text-red-500" /> Reclaim Terminal</h3>
                                        <p className="text-[10px] text-gray-400 mt-1 text-red-400">Authorization Required: Master Key Level.</p>
                                    </div>
                                    <div className="relative">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="password"
                                            required
                                            className="w-full bg-black border border-gray-700 rounded-xl p-4 pl-12 text-white focus:border-red-500 outline-none transition-colors"
                                            placeholder="Enter Master Security Key"
                                            value={masterKey}
                                            onChange={e => setMasterKey(e.target.value)}
                                        />
                                    </div>
                                    <button disabled={loading} className="w-full bg-red-600 text-white font-black py-4 rounded-xl hover:bg-red-500 transition-colors mt-4 shadow-lg shadow-red-900/20 uppercase tracking-widest text-sm">
                                        {loading ? "VERIFYING..." : "RESET SYSTEM OWNERSHIP"}
                                    </button>

                                    <div className="pt-4 text-center">
                                        <button type="button" onClick={() => setShowReclaim(false)} className="text-gray-500 hover:text-white text-xs font-bold transition-colors">Abort Reclamation</button>
                                    </div>
                                </form>
                            ) : showRegister ? (
                                <form onSubmit={handleRegisterAdmin} className="space-y-4 animate-in fade-in">
                                    <div className="text-center mb-6 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                                        <h3 className="text-white font-black text-lg flex items-center justify-center gap-2 uppercase tracking-wide"><Crown className="w-5 h-5 text-yellow-500" /> System Claim</h3>
                                        <p className="text-[10px] text-gray-400 mt-1">Initialize Root Admin Credentials.</p>
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
                                    <button type="submit" disabled={loading || isVerifying} className="w-full bg-white hover:bg-gray-200 text-black font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02]">
                                        {loading ? <span className="animate-pulse">{isVerifying ? "Verifying Access..." : "Authenticating..."}</span> : <><KeyRound className="w-4 h-4" /> ACCESS TERMINAL</>}
                                    </button>

                                    {hasAdmin && (
                                        <div className="pt-6 border-t border-gray-800/50 text-center">
                                            <button
                                                type="button"
                                                onClick={() => setShowReclaim(true)}
                                                className="text-gray-600 hover:text-red-500 text-[10px] font-bold transition-all uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"
                                            >
                                                <Lock className="w-3 h-3" /> System Lost? Reclaim via Master Key
                                            </button>
                                        </div>
                                    )}
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
