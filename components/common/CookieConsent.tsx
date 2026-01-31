import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, ShieldCheck, Check } from 'lucide-react';

export const CookieConsent = () => {
    const [cookieConsent, setCookieConsent] = useState(true);
    const [privacyConsent, setPrivacyConsent] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const cConsent = localStorage.getItem('peutic_cookie_consent');
        const pConsent = localStorage.getItem('peutic_privacy_consent');

        // Only show if not accepted
        if (!cConsent) setCookieConsent(false);
        if (!pConsent) setPrivacyConsent(false);

        setMounted(true);
    }, []);

    const acceptCookie = () => {
        localStorage.setItem('peutic_cookie_consent', 'true');
        setCookieConsent(true);
    };

    const acceptPrivacy = () => {
        localStorage.setItem('peutic_privacy_consent', 'true');
        setPrivacyConsent(true);
    };

    if (!mounted || (cookieConsent && privacyConsent)) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-[9999] flex flex-row gap-4 items-stretch justify-center pointer-events-none">
            <AnimatePresence mode='popLayout'>
                {!cookieConsent && (
                    <ConsentCard
                        key="cookie-card"
                        icon={Cookie}
                        title="Cookies"
                        description="We use cookies to ensure experienced."
                        onAccept={acceptCookie}
                    />
                )}
                {!privacyConsent && (
                    <ConsentCard
                        key="privacy-card"
                        icon={ShieldCheck}
                        title="Privacy"
                        description="Your data is yours. We prioritize it."
                        onAccept={acceptPrivacy}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const ConsentCard = ({ icon: Icon, title, description, onAccept }: any) => (
    <motion.div
        layout
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        className="pointer-events-auto flex-1 bg-white/95 dark:bg-black/95 backdrop-blur-xl border border-yellow-400/30 shadow-2xl rounded-2xl p-5 relative overflow-hidden group min-w-0"
    >
        {/* Unified Yellow Glow */}
        <div className="absolute inset-0 opacity-5 bg-yellow-400 pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4 h-full">
            <div className="p-3 rounded-xl bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 shrink-0">
                <Icon className="w-5 h-5" />
            </div>

            <div className="flex flex-col flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-0.5 truncate">{title}</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-2 md:line-clamp-1">
                    {description}
                </p>
            </div>

            <button
                onClick={onAccept}
                className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg text-xs font-bold transition-transform active:scale-95 flex items-center gap-1.5 shrink-0 whitespace-nowrap mt-2 md:mt-0"
            >
                <Check className="w-3 h-3" /> Accept
            </button>
        </div>
    </motion.div>
);
