import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Check } from 'lucide-react';

export const CookieConsent = () => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('peutic_cookie_consent');
        if (!consent) {
            // Delay for UX
            setTimeout(() => setShow(true), 1500);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('peutic_cookie_consent', 'true');
        setShow(false);
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "circOut" }}
                    className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[9999] max-w-sm w-full"
                >
                    <div className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-yellow-400/30 p-6 rounded-2xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent pointer-events-none" />

                        <div className="relative flex items-start gap-4">
                            <div className="p-3 bg-yellow-400/20 rounded-xl text-yellow-600 dark:text-yellow-400">
                                <Cookie className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white mb-1">Privacy First</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                                    We use local storage to save your progress and preferences. No third-party tracking ads.
                                </p>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleAccept}
                                        className="bg-yellow-400 hover:bg-yellow-500 text-black px-5 py-2 rounded-lg text-xs font-bold transition-transform active:scale-95 flex items-center gap-2"
                                    >
                                        <Check className="w-3 h-3" /> Accept
                                    </button>
                                    <button
                                        onClick={() => setShow(false)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-semibold px-2"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
