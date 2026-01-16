
import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../types';
import { Facebook, AlertCircle, Send, Heart, Check, Loader2, Server } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { NameValidator } from '../services/nameValidator';



interface AuthProps {
    onLogin: (role: UserRole, name: string, avatar?: string, email?: string, birthday?: string, provider?: 'email' | 'google' | 'facebook' | 'x', password?: string, isSignup?: boolean) => Promise<void>;
    onCancel: () => void;
    initialMode?: 'login' | 'signup';
}


const Auth: React.FC<AuthProps> = ({ onLogin, onCancel, initialMode = 'login' }) => {
    const [isLogin, setIsLogin] = useState(initialMode === 'login');
    const isMounted = useRef(true);

    useEffect(() => {
        setIsLogin(initialMode === 'login');
        return () => { isMounted.current = false; };
    }, [initialMode]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthday, setBirthday] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState<string | null>(null);

    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState(0);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

    const handleGoogleClick = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                }
            });
            if (error) throw error;
        } catch (e: any) {
            if (isMounted.current) {
                setError(e.message || "Google Sign-In failed.");
                setLoading(false);
            }
        }
    };

    const handleFacebookLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'facebook',
                options: {
                    redirectTo: window.location.origin,
                }
            });
            if (error) throw error;
        } catch (e: any) {
            if (isMounted.current) {
                setError(e.message || "Facebook Sign-In failed.");
                setLoading(false);
            }
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

    const validateAge = (dateStr: string): boolean => {
        const today = new Date();
        const birthDate = new Date(dateStr);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age >= 18;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                // DIRECT LOGIN: No pre-check. Supabase Auth handles invalid credentials securely.
                await onLogin(UserRole.USER, '', undefined, email, undefined, 'email', password, false);
            } else {
                // 1. Name Validation
                const nameCheck = NameValidator.validate(firstName, lastName);
                if (!nameCheck.valid) {
                    setError(nameCheck.error || "Invalid name provided.");
                    setLoading(false);
                    return;
                }

                if (!validateAge(birthday)) {

                    setError("You must be at least 18 years old to create an account.");
                    setLoading(false);
                    return;
                }
                if (password !== confirmPassword) {
                    setError("Passwords do not match.");
                    setLoading(false);
                    return;
                }
                const weakPasswordMsg = validatePasswordStrength(password);
                if (weakPasswordMsg) {
                    setError(weakPasswordMsg);
                    setLoading(false);
                    return;
                }
                // Proceed to onboarding before final creation
                setShowOnboarding(true);
                setLoading(false); // CRITICAL: Reset loading so "Enter Dashboard" button is clickable
            }
        } catch (e: any) {
            if (isMounted.current) {
                setError(e.message || "Connection failed. Please check internet.");
                setLoading(false);
            }
        }
    };

    const finishOnboarding = async () => {
        if (loading) return;
        setLoading(true);
        setError('');

        try {
            const fullName = `${firstName.trim()} ${lastName.trim()}`;
            const formattedName = fullName.length > 1 ? (fullName.charAt(0).toUpperCase() + fullName.slice(1)) : "Buddy";

            console.log("Finishing onboarding for:", formattedName);

            // SAFETY: Force timeout after 15 seconds to unblock UI if network/DB hangs
            const loginPromise = onLogin(UserRole.USER, formattedName, undefined, email, birthday, 'email', password, true);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Setup taking too long. Please refresh and try logging in.")), 15000));

            await Promise.race([loginPromise, timeoutPromise]);

            // SUCCESS PATH: Force cleanup explicitly
            if (isMounted.current) {
                setLoading(false);
                onCancel(); // Force close the modal
            }

        } catch (e: any) {
            console.error(e);
            if (isMounted.current) {
                // If message is just a notification (like 'check email'), don't treat as fatal error for UI
                if (e.message && (e.message.includes("check your email") || e.message.includes("not confirmed"))) {
                    setToast("Account created! Check your email to confirm.");
                    setLoading(false);
                    setTimeout(() => {
                        if (isMounted.current) onCancel();
                    }, 1500);
                } else {
                    setError(e.message || "Account creation failed. Please try again.");
                    setLoading(false);
                }
            }
        }
    };

    if (showOnboarding) {
        return (
            <div className="fixed inset-0 bg-[#FFFBEB] dark:bg-black z-[100] flex flex-col md:flex-row animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="hidden md:block w-1/2 bg-[#FACC15] dark:bg-yellow-600 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Heart className="w-64 h-64 text-black opacity-10 animate-pulse" />
                    </div>
                </div>
                <div className="w-full md:w-1/2 h-full overflow-y-auto flex flex-col bg-[#FFFBEB] dark:bg-black text-black dark:text-white relative">
                    <div className="flex-1 flex flex-col justify-end md:justify-center p-6 md:p-20 pb-12 md:pb-20 min-h-full">
                        <div className="max-w-md w-full mx-auto">
                            {onboardingStep === 0 && (
                                <div className="animate-in slide-in-from-bottom-5 fade-in duration-500 space-y-6">
                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Welcome, {firstName || 'Buddy'}.</h2>
                                        <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl font-medium leading-relaxed">Let's tailor your sanctuary.</p>
                                    </div>
                                    <button onClick={() => setOnboardingStep(1)} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 md:py-5 rounded-2xl font-black hover:scale-[1.02] transition-transform text-base md:text-lg shadow-xl">Begin Setup</button>
                                </div>
                            )}
                            {onboardingStep === 1 && (
                                <div className="animate-in slide-in-from-bottom-5 fade-in duration-500 space-y-6">
                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Privacy First</h2>
                                        <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl font-medium leading-relaxed">Your sessions are 100% encrypted. No one listens but you.</p>
                                    </div>
                                    <button onClick={() => setOnboardingStep(2)} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 md:py-5 rounded-2xl font-black hover:scale-[1.02] transition-transform text-base md:text-lg shadow-xl">I Understand</button>
                                </div>
                            )}
                            {onboardingStep === 2 && (
                                <div className="animate-in slide-in-from-bottom-5 fade-in duration-500 space-y-6">
                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Focus Areas</h2>
                                        <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg mb-6">Select what's on your mind.</p>
                                        <div className="flex flex-wrap gap-2 md:gap-3 mb-8">
                                            {["Anxiety", "Stress", "Career", "Relationships", "Grief", "Sleep", "Confidence"].map(t => (
                                                <button key={t} onClick={() => {
                                                    if (selectedTopics.includes(t)) setSelectedTopics(selectedTopics.filter(topic => topic !== t));
                                                    else if (selectedTopics.length < 5) setSelectedTopics([...selectedTopics, t]);
                                                }} className={`px-4 py-2.5 md:px-5 md:py-3 text-sm md:text-base border rounded-full font-bold transition-all ${selectedTopics.includes(t) ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white'}`}>{t}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <button onClick={() => setOnboardingStep(3)} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 md:py-5 rounded-2xl font-black hover:scale-[1.02] transition-transform text-base md:text-lg shadow-xl">Finalize Profile</button>
                                </div>
                            )}
                            {onboardingStep === 3 && (
                                <div className="text-center animate-in zoom-in duration-500 space-y-8">
                                    <div className="w-20 h-20 md:w-24 md:h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto shadow-lg">
                                        <Check className="w-10 h-10 md:w-12 md:h-12 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">All Set!</h2>
                                        <p className="text-gray-500">Your safe space is ready.</p>
                                    </div>
                                    {error && (
                                        <div className="p-4 bg-red-50 text-red-600 rounded-xl font-bold text-sm flex flex-col gap-2 border border-red-200 text-left">
                                            <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Error: {error}</div>
                                            {error.includes("deploy") && (
                                                <div className="text-xs font-mono bg-red-100 p-2 rounded text-red-800 break-all">
                                                    npm run backend:deploy
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <button
                                        onClick={finishOnboarding}
                                        disabled={loading}
                                        className={`w-full bg-[#FACC15] text-black py-4 md:py-5 rounded-2xl font-black shadow-[0_20px_40px_-15px_rgba(250,204,21,0.5)] hover:bg-[#EAB308] hover:scale-105 transition-all text-base md:text-lg uppercase tracking-widest flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating Space...</> : "Enter Dashboard"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#FFFBEB] dark:bg-black z-[100] flex flex-col md:flex-row transition-colors">
            {toast && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-full shadow-2xl z-[110] flex items-center gap-2 animate-in slide-in-from-top-5 fade-in">
                    <Send className="w-4 h-4" /> {toast}
                </div>
            )}

            {/* Left Side */}
            <div className="hidden md:block w-1/2 bg-black relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1000&auto=format&fit=crop" alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                <div className="absolute bottom-20 left-10 text-white max-w-md p-8">
                    <h2 className="text-4xl font-bold mb-4">{isLogin ? 'Welcome back, Buddy.' : 'Your journey starts here.'}</h2>
                    <p className="text-gray-300">Secure, private, and always here for you.</p>
                </div>
            </div>

            {/* Right Side */}
            <div className="w-full md:w-1/2 p-6 md:p-20 flex flex-col justify-center relative bg-[#FFFBEB] dark:bg-black text-black dark:text-white overflow-y-auto h-full">
                <button onClick={onCancel} className="absolute top-4 right-4 md:top-8 md:right-8 text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white font-bold z-[101]">Back</button>

                <div className="max-w-md w-full mx-auto pt-10 md:pt-0">
                    <div className="animate-in slide-in-from-left-10 fade-in duration-300">
                        <h2 className="text-2xl md:text-3xl font-bold mb-2">{isLogin ? 'Member Login' : 'Create Account'}</h2>
                        <p className="text-gray-500 mb-6 md:mb-8 text-sm md:text-base">{isLogin ? 'Access your private sanctuary.' : 'Join 1M+ users finding clarity.'}</p>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 text-sm rounded-xl flex flex-col gap-2">
                                <div className="flex items-center gap-2 font-bold"><AlertCircle className="w-4 h-4" /> Error</div>
                                <p>{error}</p>
                                {error.includes("deploy") && (
                                    <div className="mt-2 text-xs font-mono bg-black/10 dark:bg-white/10 p-2 rounded text-black dark:text-white flex items-center justify-between">
                                        npm run backend:deploy
                                        <Server className="w-3 h-3 opacity-50" />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
                            <button type="button" onClick={handleGoogleClick} className={`w-full h-12 md:h-14 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-gray-900 bg-white dark:bg-black shadow-sm transition-transform hover:scale-105 relative overflow-hidden`} title="Sign in with Google">
                                <svg width="24" height="24" viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6"><path d="M23.52 12.29C23.52 11.43 23.45 10.61 23.31 9.82H12V14.46H18.46C18.18 15.92 17.32 17.16 16.03 18.02V20.99H19.91C22.18 18.9 23.52 15.83 23.52 12.29Z" fill="#4285F4" /><path d="M12 24C15.24 24 17.96 22.93 19.91 20.99L16.03 18.02C14.95 18.74 13.58 19.17 12 19.17C8.87 19.17 6.22 17.06 5.27 14.2H1.26V17.31C3.24 21.25 7.31 24 12 24Z" fill="#34A853" /><path d="M5.27 14.2C5.03 13.33 4.9 12.42 4.9 11.5C4.9 10.58 5.03 9.67 5.27 8.8V5.69H1.26C0.46 7.29 0 9.1 0 11.5C0 13.9 0.46 15.71 1.26 17.31L5.27 14.2Z" fill="#FBBC05" /><path d="M12 3.83C13.76 3.83 15.35 4.44 16.59 5.62L20 2.21C17.96 0.31 15.24 0 12 0C7.31 0 3.24 2.75 1.26 6.69L5.27 9.8C6.22 6.94 8.87 3.83 12 3.83Z" fill="#EA4335" /></svg>
                            </button>
                            <button type="button" onClick={handleFacebookLogin} className="w-full h-12 md:h-14 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-white dark:bg-black shadow-sm transition-transform hover:scale-105" title="Sign in with Facebook">
                                <Facebook className="w-5 h-5 md:w-6 md:h-6 text-[#1877F2]" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                            {!isLogin && (
                                <>
                                    <div className="grid grid-cols-2 gap-3 md:gap-4 animate-in slide-in-from-bottom-2 fade-in">
                                        <input type="text" required className="w-full p-3 rounded-xl border border-yellow-200 dark:border-gray-800 bg-yellow-50 dark:bg-gray-900 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all text-sm md:text-base dark:text-white" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                                        <input type="text" required className="w-full p-3 rounded-xl border border-yellow-200 dark:border-gray-800 bg-yellow-50 dark:bg-gray-900 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all text-sm md:text-base dark:text-white" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Date of Birth</label>
                                        <input type="date" required className="w-full p-3 rounded-xl border border-yellow-200 dark:border-gray-800 bg-yellow-50 dark:bg-gray-900 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all animate-in slide-in-from-bottom-3 fade-in text-sm md:text-base dark:text-white" value={birthday} onChange={e => setBirthday(e.target.value)} />
                                    </div>
                                </>
                            )}
                            <input type="email" required className="w-full p-3 rounded-xl border border-yellow-200 dark:border-gray-800 bg-yellow-50 dark:bg-gray-900 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all text-sm md:text-base dark:text-white" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
                            <input type="password" required className="w-full p-3 rounded-xl border border-yellow-200 dark:border-gray-800 bg-yellow-50 dark:bg-gray-900 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all text-sm md:text-base dark:text-white" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                            {!isLogin && (
                                <>
                                    <input type="password" required className="w-full p-3 rounded-xl border border-yellow-200 dark:border-gray-800 bg-yellow-50 dark:bg-gray-900 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all animate-in slide-in-from-bottom-4 fade-in text-sm md:text-base dark:text-white" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 px-1 leading-tight">Password must be 8+ chars with uppercase, lowercase, number, & symbol.</p>
                                </>
                            )}

                            <button type="submit" disabled={loading} className="w-full bg-black dark:bg-white text-white dark:text-black py-3 md:py-4 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all flex justify-center gap-2 shadow-xl text-sm md:text-base">
                                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : (isLogin ? 'Sign In' : 'Create Account')}
                            </button>
                        </form>

                        <div className="mt-6 flex justify-between text-sm font-bold">
                            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">{isLogin ? "Create account" : "Sign in"}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
