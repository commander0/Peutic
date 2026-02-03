import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminService } from '../services/adminService';
import { UserService } from '../services/userService';

import { supabase } from '../services/supabaseClient';
import { UserRole } from '../types';
import { Lock, Shield, ArrowRight, KeyRound, AlertCircle, Check, Crown, Megaphone, LifeBuoy } from 'lucide-react';


import { useAuth } from './auth/AuthProvider';

interface AdminLoginProps {
    onLogin: (user: any) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
    const { isAdmin, refreshProfile } = useAuth();
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    void setIsVerifying; // Silence unused warning
    const [loginStatus, setLoginStatus] = useState<string>(''); // ROBUST LOGIN STATE

    const [showRegister, setShowRegister] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState('');
    const [claimMasterKey, setClaimMasterKey] = useState('');

    const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
    const [lockout, setLockout] = useState(0);

    const [showReclaim, setShowReclaim] = useState(false);
    const [showRescue, setShowRescue] = useState(false);
    const [masterKey, setMasterKey] = useState('');
    const [settings, setSettings] = useState(AdminService.getSettings());

    useEffect(() => {
        AdminService.syncGlobalSettings().then(setSettings);
        // Check if admin exists to determine if we show "Initialize System"
        AdminService.hasAdmin().then(exists => {
            setHasAdmin(exists);
            // If no admin exists, default to Registration mode
            if (!exists) {
                setShowRegister(true);
            } else {
                setClaimMasterKey(''); // Ensure key is cleared if admin exists
            }
        });
        AdminService.getAdminLockoutStatus().then(setLockout);

        // RESCUE MODE TRIGGER
        if (searchParams.get('rescue') === 'true') {
            setShowRescue(true);
        }

        // SAFETY: Force clear loading state on mount after small delay
        const safetyTimer = setTimeout(() => {
            setLoading(false);
            setIsVerifying(false);
        }, 500);
        return () => clearTimeout(safetyTimer);
    }, [searchParams]);


    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoginStatus('Establishing Secure Connection...');
        setLoading(true);

        const currentLockout = await AdminService.getAdminLockoutStatus();
        if (currentLockout > 0) {
            setLoading(false);
            return setLockout(currentLockout);
        }

        try {
            const normalizedEmail = email.toLowerCase().trim();
            if (!normalizedEmail || !password) throw new Error("Missing email or password.");

            // 1. AUTHENTICATE
            setLoginStatus('Verifying Credentials...');
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password: password
            });

            if (authError) {
                await AdminService.recordAdminFailure();
                throw new Error(authError.message || "Invalid credentials.");
            }

            if (!authData.user) throw new Error("Authentication failed.");

            // 2. VERIFY & HEAL
            setLoginStatus('Synchronizing Access Permissions...');

            // Explicitly sync the user profile from the database
            let user = await UserService.syncUser(authData.user.id);

            // If the user row is missing or not ADMIN, try to self-heal
            if (!user || user.role !== UserRole.ADMIN) {
                setLoginStatus('Detected Permissions Mismatch. Attempting Auto-Repair...');

                // Try RPC Repair
                // @ts-ignore
                const { error: rpcError } = await supabase.rpc('force_fix_admin_role');
                if (rpcError) console.warn("Auto-Repair RPC warning:", rpcError);

                // Also try manual metadata update if possible (though RLS might block)
                await supabase.auth.updateUser({ data: { role: 'ADMIN' } });

                // Sync again
                user = await UserService.syncUser(authData.user.id);
            }

            // 3. FINAL VALIDATION
            if (user?.role !== UserRole.ADMIN) {
                // Last ditch: Trust metadata if DB failed but Auth succeeded
                const metadataRole = authData.user.app_metadata?.role || authData.user.user_metadata?.role;
                if (metadataRole === 'ADMIN') {
                    console.warn("Allowed Access via Metadata Override despite DB mismatch");
                } else {
                    await supabase.auth.signOut();
                    throw new Error("Access Denied: You do not have Administrator privileges.");
                }
            }

            // 4. SUCCESS
            setLoginStatus('Access Granted. Updating System State...');
            AdminService.resetAdminFailure();

            // CRITICAL: Force global state update so App.tsx sees the new role
            await refreshProfile();

            // Give React context a moment to propagate
            setLoginStatus('Redirecting to Command Center...');

            // Small delay to ensure state settles
            setTimeout(() => {
                onLogin(null);
            }, 800);

        } catch (e: any) {
            console.error("Admin Login Error:", e);
            setError(e.message || "Login failed.");
            await AdminService.recordAdminFailure();
            // Don't stop loading if we redirect? well actually if error we must stop
            setLoading(false);
        } finally {
            // If error, loading is false. If success, keep loading true until redirect unmounts component
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
            const newUser = await AdminService.createRootAdmin(finalEmail, newAdminPassword, claimMasterKey.trim());


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

    const handleRescueLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Verify Master Key Locally First
            if (!AdminService.verifyMasterKey(masterKey)) {
                throw new Error("Invalid Master Key.");
            }

            // 2. Try Automated Rescue
            try {
                const user = await AdminService.createRootAdmin(email, password, masterKey);
                if (user && user.role === UserRole.ADMIN) {
                    setSuccessMsg("EMERGENCY ACCESS GRANTED. WELCOME BACK, COMMANDER.");
                    setTimeout(() => { onLogin(user); }, 1000);
                    return;
                }
            } catch (authError: any) {
                // If Auth fails (e.g. Rate Limit), we must fallback to Manual SQL
                console.error("Auth/Rescue Failed:", authError);
                if (authError.message?.toLowerCase().includes('rate limit') || authError.message?.toLowerCase().includes('security') || authError.message?.includes('429')) {
                    throw new Error("RATE_LIMIT");
                }
                throw authError; // Rethrow other errors
            }

        } catch (e: any) {
            if (e.message === "RATE_LIMIT" || e.message?.toLowerCase().includes('rate limit')) {
                setError(`
                    SECURITY LOCKOUT DETECTED (Rate Limit).
                    To bypass, run this SQL in your Supabase Editor:
                    UPDATE auth.users SET raw_app_meta_data = '{"role":"ADMIN"}' WHERE email = '${email}';
                    UPDATE public.users SET role = 'ADMIN' WHERE email = '${email}';
                `);
            } else {
                setError(e.message || "Rescue Failed.");
            }
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
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">

            {/* PUBLIC BROADCAST BANNER */}
            {settings.broadcastMessage && (
                <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black py-2 px-4 shadow-lg z-[110] overflow-hidden group">
                    <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-[-20deg]"></div>
                    <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
                        <Megaphone className="w-3.5 h-3.5 animate-bounce" />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-center">{settings.broadcastMessage}</span>
                    </div>
                </div>
            )}

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
                            {error && (
                                <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-400 text-sm rounded-xl flex items-start gap-2 font-bold animate-pulse text-left">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span className="whitespace-pre-line font-mono text-xs">{error}</span>
                                </div>
                            )}
                            {successMsg && <div className="mb-6 p-4 bg-green-900/30 border border-green-800 text-green-400 text-sm rounded-xl flex items-center gap-2 font-bold animate-bounce"><Check className="w-4 h-4" /> {successMsg}</div>}

                            {showRescue ? (
                                <form onSubmit={handleRescueLogin} className="space-y-4 animate-in fade-in">
                                    <div className="text-center mb-6 p-4 bg-orange-500/10 rounded-xl border border-orange-500/30">
                                        <h3 className="text-white font-black text-lg flex items-center justify-center gap-2 uppercase tracking-wide"><LifeBuoy className="w-5 h-5 text-orange-500" /> RESCUE MODE</h3>
                                        <p className="text-[10px] text-gray-400 mt-1 text-orange-400">Force Admin Access via Master Key Override.</p>
                                    </div>

                                    <div>
                                        <input
                                            type="email"
                                            required
                                            className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-colors"
                                            placeholder="Your Email Address"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                        />
                                    </div>

                                    <div className="relative">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                                        <input
                                            type="password"
                                            required
                                            className="w-full bg-black border border-gray-700 rounded-xl p-4 pl-12 text-white focus:border-orange-500 outline-none transition-colors"
                                            placeholder="MASTER SECURITY KEY"
                                            value={masterKey}
                                            onChange={e => setMasterKey(e.target.value)}
                                        />
                                    </div>

                                    <div className="relative">
                                        <input
                                            type="password"
                                            className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-colors"
                                            placeholder="New Password (Optional if Login)"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                        />
                                    </div>

                                    <button disabled={loading} className="w-full bg-orange-600 text-white font-black py-4 rounded-xl hover:bg-orange-500 transition-colors mt-4 shadow-lg shadow-orange-900/20 uppercase tracking-widest text-sm">
                                        {loading ? "OVERRIDING..." : "FORCE ADMIN ACCESS"}
                                    </button>

                                    <div className="pt-4 text-center">
                                        <button type="button" onClick={() => setError(`
                                            MANUAL OVERRIDE INSTRUCTIONS:
                                            1. Go to Supabase SQL Editor
                                            2. Run this command:
                                            UPDATE auth.users SET raw_app_meta_data = '{"role":"ADMIN"}' WHERE email = '${email || 'your_email'}';
                                            UPDATE public.users SET role = 'ADMIN' WHERE email = '${email || 'your_email'}';
                                         `)} className="text-orange-500 hover:text-orange-400 text-[10px] font-bold uppercase tracking-widest mb-4 block">
                                            Issues? View Manual Override Code
                                        </button>
                                        <button type="button" onClick={() => setShowRescue(false)} className="text-gray-500 hover:text-white text-xs font-bold transition-colors">Return to Standard Login</button>
                                    </div>
                                </form>
                            ) : showReclaim ? (
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

                                    <div className="relative mb-4">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
                                        <input
                                            type="password"
                                            required
                                            className="w-full bg-black border border-yellow-500/30 rounded-xl p-4 pl-12 text-white focus:border-yellow-500 outline-none transition-colors"
                                            placeholder="MASTER SECURITY KEY"
                                            value={claimMasterKey}
                                            onChange={e => setClaimMasterKey(e.target.value)}
                                        />
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
                                    <div className="relative">
                                        <button type="submit" disabled={loading} className="w-full bg-white hover:bg-gray-200 text-black font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed">
                                            {loading ? <span className="animate-pulse flex items-center gap-2 text-[10px] uppercase tracking-widest">{loginStatus || "Authenticating..."}</span> : <><KeyRound className="w-4 h-4" /> ACCESS TERMINAL</>}
                                        </button>

                                        {/* Emergency Unlock - ABSOLUTE POSITIONED OUTSIDE BUTTON */}
                                        {/* Emergency Unlock - VISIBLE AFTER DELAY OR ALWAYS IF STUCK */}
                                        {loading && (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.preventDefault(); setLoading(false); setLoginStatus(''); }}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-500 transition-colors z-20 hover:scale-110 cursor-pointer animate-in fade-in duration-1000"
                                                title="Force Reset Button State"
                                            >
                                                <Shield className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-4 text-center">
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const { error } = await supabase.rpc('force_fix_admin_role');
                                                if (error) alert("Repair Failed: " + error.message);
                                                else alert("Account Repaired! Please Refresh and Login.");
                                            }}
                                            className="text-yellow-600 hover:text-yellow-500 text-[10px] font-bold uppercase tracking-widest border-b border-yellow-600/30 pb-0.5"
                                        >
                                            Stuck? Click Here to Repair Permissions
                                        </button>
                                    </div>

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
