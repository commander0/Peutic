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
            <main className="flex-1 flex flex-col items-center justify-center relative z-10 perspective-1000">

                {/* FORTUNE TELLER HANDS & CRYSTAL BALL */}
                <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] flex items-center justify-center">

                    {/* Floating Hands (Animated) */}
                    <div className={`absolute -left-20 top-10 transition-all duration-[2000ms] ${isReading ? 'translate-x-10 translate-y-5 opacity-80' : '-translate-x-4 opacity-40'}`}>
                        {/* Left Hand Graphic/Placeholder - utilizing CSS/Icons for abstract representation if no image */}
                        <div className="w-32 h-32 bg-purple-900/20 blur-2xl rounded-full animate-float"></div>
                    </div>
                    <div className={`absolute -right-20 top-10 transition-all duration-[2000ms] ${isReading ? '-translate-x-10 translate-y-5 opacity-80' : 'translate-x-4 opacity-40'}`}>
                        {/* Right Hand Graphic/Placeholder */}
                        <div className="w-32 h-32 bg-purple-900/20 blur-2xl rounded-full animate-float-delayed"></div>
                    </div>

                    {/* THE CRYSTAL BALL */}
                    <div className={`relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-900/30 backdrop-blur-sm border border-indigo-400/20 shadow-[0_0_50px_rgba(79,70,229,0.2)] overflow-hidden transition-all duration-1000 ${isReading ? 'shadow-[0_0_100px_rgba(147,51,234,0.6)] scale-105' : ''}`}>

                        {/* Inner Smoke/Mist */}
                        <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/foggy-birds.png')] opacity-50 mix-blend-overlay transition-transform duration-[10s] ease-linear ${isReading ? 'animate-spin-slow scale-150' : ''}`}></div>

                        {/* Glint */}
                        <div className="absolute top-4 left-8 w-16 h-8 bg-white/10 rounded-full blur-xl -rotate-45"></div>

                        {/* Text Reveal inside Ball */}
                        {oracleMessage && !isReading && (
                            <div className="absolute inset-0 flex items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-1000">
                                <p className="text-xs md:text-sm text-indigo-100 font-bold leading-relaxed drop-shadow-md italic">
                                    "{oracleMessage}"
                                </p>
                            </div>
                        )}

                        {/* Loading State inside Ball */}
                        {isReading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-12 h-12 text-purple-300 animate-spin-slow opacity-80" />
                            </div>
                        )}
                    </div>

                    {/* Base/Stand */}
                    <div className="absolute -bottom-12 w-32 h-12 bg-black/50 blur-xl rounded-[100%]"></div>
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
