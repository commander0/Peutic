
import React, { useState, useEffect } from 'react';
import { AdminService } from '../services/adminService';
import { UserService } from '../services/userService';

import { supabase } from '../services/supabaseClient';
import { UserRole } from '../types';
import { Lock, Shield, ArrowRight, KeyRound, AlertCircle, Check, Crown, Megaphone } from 'lucide-react';


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
    const [claimMasterKey, setClaimMasterKey] = useState('');

    const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
    const [lockout, setLockout] = useState(0);

    const [showReclaim, setShowReclaim] = useState(false);
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
    }, []);


    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const currentLockout = await AdminService.getAdminLockoutStatus();
        if (currentLockout > 0) return setLockout(currentLockout);

        setLoading(true);

        try {
            const normalizedEmail = email.toLowerCase().trim();

            // 1. STRICT AUTH
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password: password
            });

            if (authError) {
                await AdminService.recordAdminFailure();
                if (authError.message.includes("Email not confirmed")) {
                    // Try auto-verify if possible (Admin feature)
                    const verified = await AdminService.forceVerifyEmail(normalizedEmail);
                    if (!verified) throw new Error("Email not confirmed.");
                } else {
                    throw new Error("Invalid credentials.");
                }
            }

            if (!authData.user) throw new Error("Authentication failed.");

            // 2. DATABASE ROLE CHECK (Single Source of Truth)
            // We verify against the public.users table via UserService, not stale Auth Metadata
            const user = await UserService.syncUser(authData.user.id);

            if (!user || user.role !== UserRole.ADMIN) {
                await supabase.auth.signOut();
                await AdminService.recordAdminFailure();
                throw new Error("ACCESS DENIED: Not an Administrator.");
            }

            // 3. SUCCESS - Reset Failures & Proceed
            AdminService.resetAdminFailure();
            onLogin(user);

        } catch (e: any) {
            console.error("Admin Login Error:", e);
            setError(e.message || "Login failed.");
            await AdminService.recordAdminFailure();
        } finally {
            setLoading(false);
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
