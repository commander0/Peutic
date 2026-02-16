import React, { useState, useEffect } from 'react';
import { X, Moon, Star, Sparkles, User as UserIcon, Calendar, Zap, Wind } from 'lucide-react';
import { User } from '../../types';
import { useToast } from '../common/Toast';
import { UserService } from '../../services/userService';
import { SanctuaryService, DreamLog } from '../../services/SanctuaryService';

interface ObservatoryViewProps {
    user: User;
    onClose: () => void;
}

const ObservatoryView: React.FC<ObservatoryViewProps> = ({ user, onClose }) => {
    const { showToast } = useToast();
    const [oracleMessage, setOracleMessage] = useState<string | null>(null);
    const [isReading, setIsReading] = useState(false);
    const [showHands, setShowHands] = useState(false);

    const divineInsight = async () => {
        const COST = 5;
        if (user.balance < COST) {
            showToast(`The spirits require an offering of ${COST} minutes.`, "error");
            return;
        }

        const success = await UserService.deductBalance(COST, 'Consulted the Oracle');
        if (!success) return;

        setIsReading(true);
        setShowHands(true);
        setOracleMessage(null);

        // Simulation of a ritual
        setTimeout(() => {
            const hour = new Date().getHours();
            const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const currentDay = dayNames[new Date().getDay()];

            // Generate "Deep" Personalized Insight
            // In a real app, this could use an LLM. Here we use a template system based on user stats.
            const intros = [
                "The mist clears to reveal a path only you can walk.",
                "I see a vibrant energy surrounding your recent endeavors.",
                "The shadows whisper of a turning point approaching swiftly.",
                "Your aura vibrates with the frequency of change."
            ];

            const middles = [
                user.streak > 3
                    ? "Your consistency has forged a steel backbone for your spirit, yet you must remember to bend like the willow."
                    : "The energies are scattered. Focus is your key to unlocking the next gate.",
                user.balance > 50
                    ? "Abundance follows you, but be wary of hoarding time—spend it to grow."
                    : "Resourcefulness is born from scarcity; you are learning a valuable lesson in economy.",
                `On this ${currentDay}, the alignment suggests a need for deep introspection regarding a recent choice.`
            ];

            const outros = [
                "Trust the silence between your thoughts.",
                "The answer you seek is already within your breath.",
                "Walk forward, for the universe supports your next step.",
                "Be the calm in the center of the storm."
            ];

            const combined = `${intros[Math.floor(Math.random() * intros.length)]} ${middles[Math.floor(Math.random() * middles.length)]} ${outros[Math.floor(Math.random() * outros.length)]}`;

            setOracleMessage(combined);
            setIsReading(false);
            // Hands stay for a bit then fade
        }, 4000);
    };

    return (
        <div className="fixed inset-0 z-[120] bg-black text-indigo-50 flex flex-col animate-in fade-in duration-1000 overflow-hidden font-serif selection:bg-purple-900 selection:text-white">
            {/* MYSTIC BACKGROUND */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none animate-pulse-slow"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 via-black to-black pointer-events-none"></div>

            {/* HEADER */}
            <header className="relative z-10 px-8 py-6 flex justify-between items-center bg-transparent">
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors group">
                    <X className="w-6 h-6 text-indigo-300 group-hover:text-white transition-colors" />
                </button>
            </header>

            {/* MAIN STAGE */}
            <main className="flex-1 flex flex-col items-center justify-center relative z-10 perspective-[1000px] w-full">

                {/* FORTUNE TELLER SCENE */}
                <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">

                    {/* Table Glow */}
                    <div className="absolute bottom-0 w-3/4 h-24 bg-purple-900/40 blur-[60px] rounded-full animate-pulse-slow"></div>

                    {/* Floating Hands (Enhanced) */}
                    <div className={`absolute -left-4 md:-left-20 top-1/3 transition-all duration-[2000ms] ease-out ${isReading ? 'translate-x-12 translate-y-8 opacity-60' : '-translate-x-12 opacity-0'}`}>
                        <div className="w-24 h-48 bg-gradient-to-b from-indigo-500/10 to-transparent blur-xl rounded-full rotate-12"></div>
                    </div>
                    <div className={`absolute -right-4 md:-right-20 top-1/3 transition-all duration-[2000ms] ease-out ${isReading ? '-translate-x-12 translate-y-8 opacity-60' : 'translate-x-12 opacity-0'}`}>
                        <div className="w-24 h-48 bg-gradient-to-b from-indigo-500/10 to-transparent blur-xl rounded-full -rotate-12"></div>
                    </div>

                    {/* THE CRYSTAL BALL - HIGH FIDELITY */}
                    {/* Container for centering and hover effects */}
                    <div className={`group relative w-64 h-64 md:w-80 md:h-80 transition-all duration-1000 ${isReading ? 'scale-110' : 'hover:scale-105'}`}>

                        {/* 1. Base Shadow */}
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-12 bg-black/60 blur-xl rounded-[100%]"></div>

                        {/* 2. The Orb Body (Glass) */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-900/40 to-black border border-indigo-400/20 shadow-[inset_0_0_80px_rgba(0,0,0,0.8),0_0_40px_rgba(79,70,229,0.3)] backdrop-blur-[2px] overflow-hidden z-20">

                            {/* Inner Mist (Animated) */}
                            <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/foggy-birds.png')] opacity-40 mix-blend-color-dodge transition-transform duration-[20s] linear ${isReading ? 'animate-[spin_4s_linear_infinite] scale-150' : 'animate-[spin_20s_linear_infinite] scale-110'}`}></div>

                            {/* Deep Space Layer */}
                            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 to-transparent opacity-50 mix-blend-overlay"></div>

                            {/* Core Glow (Pulse) */}
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-400/30 rounded-full blur-[40px] mix-blend-screen transition-all duration-1000 ${isReading ? 'scale-150 opacity-100' : 'scale-100 opacity-50 animate-pulse-slow'}`}></div>

                            {/* Text Reveal Area */}
                            {oracleMessage && !isReading && (
                                <div className="absolute inset-0 flex items-center justify-center p-8 text-center z-30 animate-in fade-in zoom-in duration-1000 bg-black/40 backdrop-blur-sm">
                                    <p className="text-sm md:text-lg text-indigo-50 font-serif leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] italic">
                                        "{oracleMessage}"
                                    </p>
                                </div>
                            )}

                            {/* Loading Sparkles */}
                            {isReading && (
                                <div className="absolute inset-0 flex items-center justify-center z-30">
                                    <Sparkles className="w-16 h-16 text-indigo-200 animate-spin-slow opacity-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                                </div>
                            )}
                        </div>

                        {/* 3. Surface Reflections (Gloss) */}
                        <div className="absolute top-4 left-8 w-24 h-12 bg-gradient-to-b from-white/20 to-transparent rounded-full blur-md -rotate-45 pointer-events-none z-30"></div>
                        <div className="absolute bottom-6 right-10 w-16 h-8 bg-gradient-to-t from-indigo-300/10 to-transparent rounded-full blur-md -rotate-45 pointer-events-none z-30"></div>

                        {/* 4. Magic Aura (Outer Glow) */}
                        <div className={`absolute -inset-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 blur-2xl transition-opacity duration-1000 -z-10 ${isReading ? 'opacity-40 animate-pulse-fast' : 'group-hover:opacity-20'}`}></div>
                    </div>

                    {/* Base Stand (Ornate) */}
                    <div className="absolute -bottom-16 w-40 h-20 bg-gradient-to-b from-stone-900 to-black rounded-t-[50px] border-t border-white/10 flex items-center justify-center shadow-xl z-10">
                        <div className="w-32 h-1 bg-indigo-500/30 blur-[2px] mt-2"></div>
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="mt-12 text-center space-y-6">
                    {!isReading && !oracleMessage && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-indigo-200 mb-2">The Oracle Awaits</h2>
                            <p className="text-indigo-400/60 text-xs font-serif italic mb-8">Offer 5 minutes of your time to glimpse the threads of fate.</p>

                            <button
                                onClick={divineInsight}
                                className="group relative px-8 py-4 bg-transparent border border-indigo-500/30 hover:bg-indigo-900/10 text-indigo-300 font-black uppercase tracking-[0.3em] text-xs transition-all hover:shadow-[0_0_30px_rgba(79,70,229,0.2)] hover:border-indigo-400"
                            >
                                <span className="flex items-center gap-3 group-hover:gap-4 transition-all">
                                    <Sparkles className="w-4 h-4" /> Consult Fate <span className="text-indigo-500">(-5m)</span>
                                </span>
                            </button>
                        </div>
                    )}

                    {oracleMessage && !isReading && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <button
                                onClick={() => setOracleMessage(null)}
                                className="text-indigo-500/50 hover:text-indigo-300 text-[10px] uppercase tracking-widest transition-colors"
                            >
                                Clear Vision
                            </button>
                        </div>
                    )}

                    {isReading && (
                        <p className="text-indigo-400/60 text-xs uppercase tracking-[0.3em] animate-pulse">Divining...</p>
                    )}
                </div>

            </main>
        </div>
    );
};

export default ObservatoryView;
