import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../types';
import { AlertCircle, Check, Loader2, Megaphone, ArrowRight, Mail, Lock } from 'lucide-react';
import { useLanguage } from './common/LanguageContext';
import { AdminService } from '../services/adminService';
import { supabase } from '../services/supabaseClient';
import { NameValidator } from '../services/nameValidator';
import { BackgroundVideo } from './common/BackgroundVideo';
// @ts-ignore
import { motion, AnimatePresence } from 'framer-motion';

interface AuthProps {
    onLogin: (role: UserRole, name: string, avatar?: string, email?: string, birthday?: string, provider?: 'email' | 'google' | 'facebook' | 'x', password?: string, isSignup?: boolean, topics?: string[]) => Promise<void>;
    onCancel: () => void;
    initialMode?: 'login' | 'signup';
}

const Auth: React.FC<AuthProps> = ({ onLogin, onCancel, initialMode = 'login' }) => {
    const { t } = useLanguage();
    const [mode, setMode] = useState<'login' | 'signup' | 'onboarding'>(initialMode);
    const isMounted = useRef(true);
    const [settings, setSettings] = useState(AdminService.getSettings());

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthday, setBirthday] = useState('');

    const [loading, setLoading] = useState(false);
    const [rateLimited, setRateLimited] = useState(false);
    const retryTimeout = useRef<number | null>(null);
    const [error, setError] = useState('');
    const [toast, setToast] = useState<string | null>(null);

    // Onboarding State
    const [onboardingStep, setOnboardingStep] = useState(0);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

    useEffect(() => {
        AdminService.syncGlobalSettings().then(s => {
            if (isMounted.current) setSettings(s);
        });
        setMode(initialMode === 'signup' ? 'signup' : 'login');
        return () => { isMounted.current = false; };
    }, [initialMode]);

    // --- HANDLERS ---

    const handleSocialLogin = async (provider: 'google' | 'facebook' | 'twitter') => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: { redirectTo: window.location.origin }
            });
            if (error) throw error;
        } catch (e: any) {
            if (isMounted.current) {
                setError(e.message || `${provider} Sign-In failed.`);
                setLoading(false);
            }
        }
    };

    const SocialButtons = () => (
        <div className="grid grid-cols-1 gap-3 mb-6">
            <button type="button" onClick={() => handleSocialLogin('google')} className="w-full h-12 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-900 bg-white dark:bg-black shadow-sm transition-transform hover:scale-[1.02] gap-3 font-medium text-sm">
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M23.52 12.29C23.52 11.43 23.45 10.61 23.31 9.82H12V14.46H18.46C18.18 15.92 17.32 17.16 16.03 18.02V20.99H19.91C22.18 18.9 23.52 15.83 23.52 12.29Z" fill="#4285F4" /><path d="M12 24C15.24 24 17.96 22.93 19.91 20.99L16.03 18.02C14.95 18.74 13.58 19.17 12 19.17C8.87 19.17 6.22 17.06 5.27 14.2H1.26V17.31C3.24 21.25 7.31 24 12 24Z" fill="#34A853" /><path d="M5.27 14.2C5.03 13.33 4.9 12.42 4.9 11.5C4.9 10.58 5.03 9.67 5.27 8.8V5.69H1.26C0.46 7.29 0 9.1 0 11.5C0 13.9 0.46 15.71 1.26 17.31L5.27 14.2Z" fill="#FBBC05" /><path d="M12 3.83C13.76 3.83 15.35 4.44 16.59 5.62L20 2.21C17.96 0.31 15.24 0 12 0C7.31 0 3.24 2.75 1.26 6.69L5.27 9.8C6.22 6.94 8.87 3.83 12 3.83Z" fill="#EA4335" /></svg>
                Continue with Google
            </button>
            <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => handleSocialLogin('facebook')} className="w-full h-12 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-900 bg-white dark:bg-black shadow-sm transition-transform hover:scale-[1.02] gap-2 font-medium text-sm">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#1877F2]"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.791 1.657-2.791 3.914v3.218h4.62l-.588 3.667h-4.032v7.98H9.101Z" /></svg>
                    Facebook
                </button>
                <button type="button" onClick={() => handleSocialLogin('twitter')} className="w-full h-12 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-900 bg-white dark:bg-black shadow-sm transition-transform hover:scale-[1.02] gap-2 font-medium text-sm">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-black dark:text-white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    X (Twitter)
                </button>
            </div>
        </div>
    );

    const validatePasswordStrength = (pwd: string): string | null => {
        if (pwd.length < 8) return "Password must be at least 8 characters long.";
        if (!/[A-Z]/.test(pwd)) return "Password must include at least one uppercase letter.";
        if (!/[a-z]/.test(pwd)) return "Password must include at least one lowercase letter.";
        if (!/[0-9]/.test(pwd)) return "Password must include at least one number.";
        return null;
    };

    const validateAge = (dateStr: string): boolean => {
        const today = new Date();
        const birthDate = new Date(dateStr);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age >= 18;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading || rateLimited) return;

        // RATE LIMIT CHECK (Client Side)
        const lastAttempt = parseInt(localStorage.getItem('auth_last_attempt') || '0');
        const attempts = parseInt(localStorage.getItem('auth_attempts') || '0');
        const now = Date.now();

        if (now - lastAttempt < 1000) return; // 1s cool-down

        if (attempts > 5 && now - lastAttempt < 60000) {
            setError("Too many attempts. Please wait 1 minute.");
            setRateLimited(true);
            retryTimeout.current = window.setTimeout(() => {
                setRateLimited(false);
                setError('');
                localStorage.setItem('auth_attempts', '0');
            }, 60000);
            return;
        }

        localStorage.setItem('auth_last_attempt', now.toString());
        localStorage.setItem('auth_attempts', (attempts + 1).toString());

        setError('');
        setLoading(true);

        try {
            if (mode === 'login') {
                await onLogin(UserRole.USER, '', undefined, email, undefined, 'email', password, false);
            } else if (mode === 'signup') {
                // Validation
                const nameCheck = NameValidator.validate(firstName, lastName);
                if (!nameCheck.valid) throw new Error(nameCheck.error || "Invalid name provided.");
                if (!validateAge(birthday)) throw new Error("You must be at least 18 years old.");
                if (password !== confirmPassword) throw new Error("Passwords do not match.");

                const weakMsg = validatePasswordStrength(password);
                if (weakMsg) throw new Error(weakMsg);

                // Success -> Move to Onboarding
                setMode('onboarding');
                setLoading(false);
            }
        } catch (e: any) {
            if (isMounted.current) {
                setError(e.message || "Action failed.");
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

            // Onboarding Metadata could be saved here (topics)

            await onLogin(UserRole.USER, formattedName, undefined, email, birthday, 'email', password, true, selectedTopics);

            if (isMounted.current) {
                setLoading(false);
                onCancel();
            }
        } catch (e: any) {
            console.error(e);
            if (isMounted.current) {
                if (e.message?.includes("email")) {
                    setToast("Account created! Check your email.");
                    setTimeout(() => onCancel(), 2000);
                } else {
                    setError(e.message || "Setup failed.");
                }
                setLoading(false);
            }
        }
    };

    // --- RENDER HELPERS ---
    // SocialButtons is defined above in handlers block


    return (
        <div className="fixed inset-0 bg-[#FFFBEB] dark:bg-black z-[100] flex flex-col md:flex-row overflow-hidden">

            {/* Banner */}
            {settings.broadcastMessage && (
                <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black py-2 px-4 shadow-lg z-[120] flex justify-center items-center gap-2">
                    <Megaphone className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">{settings.broadcastMessage}</span>
                </div>
            )}

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
                        className="fixed top-0 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full shadow-2xl z-[130] flex items-center gap-2">
                        <Check className="w-4 h-4" /> {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ARTWORK / HERO COLUMN (Hidden on Mobile) */}
            {/* ARTWORK / HERO COLUMN (Hidden on Mobile) */}
            <div className="hidden md:block w-1/2 h-full relative overflow-hidden">
                <BackgroundVideo
                    src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
                    poster="https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg"
                    className="absolute inset-0 w-full h-full object-cover object-center opacity-80"
                />
                <div className="absolute inset-0 bg-yellow-400/20 mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                <div className="absolute bottom-20 left-12 right-12 text-white z-10">
                    <AnimatePresence mode="wait">
                        <motion.div key={mode === 'login' ? 'text-login' : 'text-signup'} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}>
                            <h1 className="text-5xl font-black mb-4 tracking-tight leading-tight text-white">
                                {mode === 'login' ? "Welcome back to your sanctuary." : "Begin your journey to mindfulness."}
                            </h1>
                            <p className="text-xl text-yellow-100 max-w-lg font-bold">
                                {mode === 'login'
                                    ? "Resume your progress, connect with your companion, and find your center."
                                    : "Join thousands of others discovering peace, clarity, and growth every day."}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* FORM COLUMN */}
            <div className="w-full md:w-1/2 h-full bg-[#FFFCF2] dark:bg-black text-black dark:text-white flex flex-col relative overflow-y-auto">
                <button onClick={onCancel} className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors z-50">
                    <span className="sr-only">Close</span>
                    <ArrowRight className="w-6 h-6 rotate-180 text-gray-400 hover:text-black dark:hover:text-white" />
                </button>

                <div className="flex-1 flex flex-col justify-center px-8 md:px-24 py-12">
                    <div className="max-w-md w-full mx-auto">

                        {/* Onboarding Overlay */}
                        {mode === 'onboarding' ? (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                {onboardingStep === 0 && (
                                    <div className="space-y-8">
                                        <div>
                                            <h2 className="text-4xl font-black mb-4">Nice to meet you, {firstName}.</h2>
                                            <p className="text-gray-500 text-lg">Let's tailor your experience. What brings you here primarily?</p>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {["Anxiety", "Sleep", "Focus", "Self-Discovery", "Grief", "Confidence"].map(topic => (
                                                <button key={topic}
                                                    onClick={() => setSelectedTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic])}
                                                    className={`px-6 py-3 rounded-full font-bold border transition-all ${selectedTopics.includes(topic) ? 'bg-black text-white dark:bg-white dark:text-black' : 'border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white'}`}
                                                >
                                                    {topic}
                                                </button>
                                            ))}
                                        </div>
                                        <button onClick={() => setOnboardingStep(1)} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-xl">Continue</button>
                                    </div>
                                )}
                                {onboardingStep === 1 && (
                                    <div className="space-y-8 text-center">
                                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                                        </div>
                                        <h2 className="text-3xl font-black">{t('auth_all_set')}</h2>
                                        <p className="text-gray-500">{t('auth_ready_desc')}</p>
                                        <button onClick={finishOnboarding} disabled={loading} className="w-full bg-[#FACC15] text-black py-4 rounded-xl font-black text-lg hover:scale-105 transition-transform shadow-xl flex items-center justify-center gap-2">
                                            {loading ? <Loader2 className="animate-spin" /> : t('auth_enter_dash')}
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            /* MAIN AUTH FORM */
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={mode}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <h2 className="text-3xl font-bold mb-2">{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
                                    <p className="text-gray-500 mb-8">{mode === 'login' ? 'Welcome back.' : 'Start your free trial today.'}</p>

                                    {error && (
                                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-sm font-medium flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" /> {error}
                                        </div>
                                    )}

                                    <SocialButtons />

                                    <div className="relative my-8">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800"></div></div>
                                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#FAFAFA] dark:bg-black px-2 text-gray-400">Or continue with email</span></div>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {mode === 'signup' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <input type="text" placeholder="First Name" className="w-full p-4 bg-white/80 dark:bg-gray-900 border border-yellow-200/50 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#FACC15] focus:border-[#FACC15] outline-none transition-all dark:text-white" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                                                <input type="text" placeholder="Last Name" className="w-full p-4 bg-white/80 dark:bg-gray-900 border border-yellow-200/50 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#FACC15] focus:border-[#FACC15] outline-none transition-all dark:text-white" value={lastName} onChange={e => setLastName(e.target.value)} required />
                                            </div>
                                        )}

                                        {mode === 'signup' && (
                                            <div className="relative">
                                                <input type="date" className="w-full p-4 bg-white/80 dark:bg-gray-900 border border-yellow-200/50 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#FACC15] focus:border-[#FACC15] outline-none transition-all dark:text-white" value={birthday} onChange={e => setBirthday(e.target.value)} required />
                                                <label className="absolute -top-2 left-3 bg-[#FFFCF2] dark:bg-black px-1 text-xs text-gray-400 font-bold">Date of Birth</label>
                                            </div>
                                        )}

                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input type="email" placeholder="Email Address" className="w-full p-4 pl-12 bg-white/80 dark:bg-gray-900 border border-yellow-200/50 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#FACC15] focus:border-[#FACC15] outline-none transition-all dark:text-white" value={email} onChange={e => setEmail(e.target.value)} required />
                                        </div>

                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input type="password" placeholder="Password" className="w-full p-4 pl-12 bg-white/80 dark:bg-gray-900 border border-yellow-200/50 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#FACC15] focus:border-[#FACC15] outline-none transition-all dark:text-white" value={password} onChange={e => setPassword(e.target.value)} required />
                                        </div>

                                        {mode === 'signup' && (
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input type="password" placeholder="Confirm Password" className="w-full p-4 pl-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none transition-all dark:text-white" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                                                <p className="text-[10px] text-gray-400 mt-1 px-2">Must be 8+ chars with uppercase, lowercase, & number.</p>
                                            </div>
                                        )}

                                        <button type="submit" disabled={loading} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2">
                                            {loading ? <Loader2 className="animate-spin" /> : (mode === 'login' ? "Sign In" : "Start Journey")}
                                        </button>
                                    </form>

                                    <div className="mt-8 text-center text-sm">
                                        {mode === 'login' ? (
                                            <>Don't have an account? <button onClick={() => setMode('signup')} className="font-bold underline ml-1 hover:text-gray-600">Join Free</button></>
                                        ) : (
                                            <>Already have an account? <button onClick={() => setMode('login')} className="font-bold underline ml-1 hover:text-gray-600">Sign In</button></>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
