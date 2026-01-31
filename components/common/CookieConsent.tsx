import { useState, useEffect } from 'react';
// @ts-ignore
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
        <div className="fixed bottom-6 md:bottom-8 left-4 right-4 z-[9999] flex flex-row gap-4 items-stretch justify-center pointer-events-none">
            <AnimatePresence mode='popLayout'>
                {!cookieConsent && (
                    <ConsentCard
                        key="cookie-card"
                        icon={Cookie}
                        description="SECURE CONNECTIVITY ACTIVE. WE USE COOKIES TO ENSURE LOW-LATENCY VIDEO AND REAL-TIME CONNECTION STABILITY."
                        onAccept={acceptCookie}
                    />
                )}
                {!privacyConsent && (
                    <ConsentCard
                        key="privacy-card"
                        icon={ShieldCheck}
                        description="YOUR DATA IS ENCRYPTED AND PRIVATE. WE NEVER SELL YOUR PERSONAL INFORMATION TO THIRD PARTIES."
                        onAccept={acceptPrivacy}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const ConsentCard = ({ icon: Icon, description, onAccept }: any) => (
    <motion.div
        layout
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        className="pointer-events-auto flex-1 bg-[#FFFBEB] dark:bg-gray-900 text-black dark:text-white p-3 md:p-4 rounded-2xl md:rounded-[1.5rem] border-2 border-yellow-400 shadow-2xl relative overflow-hidden group min-w-0"
    >
        <div className="relative flex flex-col md:flex-row items-center gap-3 h-full text-center md:text-left">
            <div className="shrink-0 text-yellow-600">
                <Icon className="w-6 h-6 md:w-8 md:h-8" />
            </div>

            <div className="flex flex-col flex-1 min-w-0 justify-center">
                <h4 className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider leading-tight">
                    {description}
                </h4>
            </div>

            <div className="shrink-0 mt-2 md:mt-0">
                <button
                    onClick={onAccept}
                    className="flex-1 bg-[#FACC15] hover:bg-yellow-300 text-black text-[10px] font-black py-2 rounded-lg uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
                >
                    <Check className="w-3 h-3" /> ACCEPT
                </button>
            </div>
        </div>
    </motion.div>
);
