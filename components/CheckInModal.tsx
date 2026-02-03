import React, { useState } from 'react';
import { X, Sun, Cloud, CloudRain, Zap, Battery } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
}

const moods = [
    { id: 'great', label: 'Great', icon: Sun, color: 'text-yellow-400' },
    { id: 'ok', label: 'Okay', icon: Cloud, color: 'text-blue-300' },
    { id: 'low', label: 'Low', icon: CloudRain, color: 'text-indigo-400' },
    { id: 'tired', label: 'Tired', icon: Battery, color: 'text-gray-400' },
    { id: 'anxious', label: 'Anxious', icon: Zap, color: 'text-orange-400' },
];

export const CheckInModal: React.FC<CheckInModalProps> = ({ isOpen, onClose, userName }) => {
    const [selectedMood, setSelectedMood] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSelect = (id: string) => {
        setSelectedMood(id);
        // Auto-close after short delay for smoothness
        setTimeout(() => {
            onClose();
        }, 800);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="w-full max-w-lg bg-gray-900/90 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                >
                    {/* Ambient Background Glow */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />

                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>

                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-200 to-blue-400 mb-2">
                            Welcome back, {userName}.
                        </h2>
                        <p className="text-gray-400 text-lg">How are you feeling right now?</p>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                        {moods.map((m) => {
                            const Icon = m.icon;
                            const isSelected = selectedMood === m.id;

                            return (
                                <button
                                    key={m.id}
                                    onClick={() => handleSelect(m.id)}
                                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-300 group
                    ${isSelected ? 'bg-white/10 scale-110 ring-1 ring-white/20' : 'hover:bg-white/5 hover:scale-105'}
                  `}
                                >
                                    <div className={`p-3 rounded-full bg-black/40 ${m.color} group-hover:bg-black/60 transition-colors`}>
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
                                        {m.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {selectedMood && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 text-center text-cyan-300 font-medium"
                        >
                            Noted. Let's make today count.
                        </motion.div>
                    )}

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
