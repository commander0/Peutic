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

    // Audio Refs for Sound Synthesis
    const audioCtxRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        // Init Audio Context on Mount
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return () => {
            audioCtxRef.current?.close();
        };
    }, []);

    const playMysticSound = (type: 'start' | 'reveal') => {
        if (!audioCtxRef.current) return;
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'start') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 2);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 1);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);
            osc.start();
            osc.stop(ctx.currentTime + 3);
        } else {
            // Chord for reveal
            const freqs = [440, 554, 659]; // A major
            freqs.forEach((f, i) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g);
                g.connect(ctx.destination);
                o.type = 'triangle';
                o.frequency.value = f;
                g.gain.setValueAtTime(0, ctx.currentTime);
                g.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4);
                o.start();
                o.stop(ctx.currentTime + 4);
            });
        }
    };

    const divineInsight = async () => {
        const COST = 5;
        if (user.balance < COST) {
            showToast(`The spirits require an offering of ${COST} minutes.`, "error");
            return;
        }

        if (await UserService.deductBalance(COST, 'Consulted the Oracle')) {
            setIsReading(true);
            setOracleMessage(null);
            playMysticSound('start');

            // Cinematic Delay
            setTimeout(() => {
                const insights = [
                    "The universe whispers that your resilience is your greatest shield.",
                    "A door you thought closed is merely waiting for a different key.",
                    "Your energy affects those around you more than you realize; shine bright.",
                    "The path ahead is foggy, but your intuition is a lantern that never fails.",
                    "What you seek is already seeking you. Be still and let it find you.",
                    "Release the anchor of the past; the tide is rising in your favor."
                ];
                const msg = insights[Math.floor(Math.random() * insights.length)];

                setOracleMessage(msg);
                setIsReading(false);
                playMysticSound('reveal');
            }, 3000);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] bg-black text-indigo-50 flex flex-col animate-in fade-in duration-1000 overflow-hidden font-serif selection:bg-purple-500 selection:text-white">
            {/* 1. CINEMATIC BACKGROUND */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_#000000_80%)]"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse-slow"></div>

            {/* 2. HEADER */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 z-50 p-4 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/5 group"
            >
                <X className="w-6 h-6 text-indigo-300 group-hover:text-white transition-colors" />
            </button>

            {/* 3. MAIN STAGE */}
            <main className="flex-1 flex flex-col items-center justify-center relative z-10 perspective-[1200px] w-full h-full">

                {/* THE FORTUNE TELLER'S TABLE */}
                <div className="relative flex flex-col items-center justify-center">

                    {/* A. FLOATING HANDS (Enhanced Silhouette) */}
                    <div className={`absolute -left-20 md:-left-32 top-1/4 w-32 h-48 bg-gradient-to-t from-purple-900/0 via-purple-900/40 to-indigo-500/10 blur-xl rounded-full rotate-12 transition-all duration-1000 ${isReading ? 'translate-x-12 opacity-80' : 'opacity-20'}`}></div>
                    <div className={`absolute -right-20 md:-right-32 top-1/4 w-32 h-48 bg-gradient-to-t from-purple-900/0 via-purple-900/40 to-indigo-500/10 blur-xl rounded-full -rotate-12 transition-all duration-1000 ${isReading ? '-translate-x-12 opacity-80' : 'opacity-20'}`}></div>

                    {/* B. THE CRYSTAL BALL (High Fidelity) */}
                    <div className={`relative group w-72 h-72 md:w-96 md:h-96 rounded-full transition-all duration-[2000ms] ${isReading ? 'scale-110' : 'hover:scale-105'}`}>

                        {/* B1. Outer Glow (Aura) */}
                        <div className={`absolute -inset-10 bg-indigo-600/20 rounded-full blur-3xl transition-opacity duration-1000 ${isReading ? 'opacity-100 animate-pulse-fast' : 'opacity-30'}`}></div>

                        {/* B2. The Glass Sphere */}
                        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,_rgba(255,255,255,0.1)_0%,_rgba(79,70,229,0.1)_20%,_rgba(0,0,0,0.8)_80%)] shadow-[inset_0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(79,70,229,0.3)] border border-indigo-500/20 backdrop-blur-sm overflow-hidden z-20">

                            {/* B3. Internal Mist (Dynamic) */}
                            <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/foggy-birds.png')] opacity-30 mix-blend-color-dodge transition-transform duration-[10s] ease-linear ${isReading ? 'animate-[spin_3s_linear_infinite] scale-150 opacity-60' : 'animate-[spin_20s_linear_infinite] scale-110'}`}></div>

                            {/* B4. Core Energy */}
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-indigo-500 rounded-full blur-[50px] mix-blend-screen transition-all duration-500 ${isReading ? 'scale-150 opacity-80' : 'scale-100 opacity-30 animate-pulse-slow'}`}></div>

                            {/* B5. TEXT REVEAL (The Insight) */}
                            {oracleMessage && !isReading && (
                                <div className="absolute inset-0 flex items-center justify-center p-10 text-center z-30 animate-in fade-in zoom-in duration-1000 bg-black/50 backdrop-blur-[2px]">
                                    <p className="text-lg md:text-2xl text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-200 to-indigo-400 font-serif leading-relaxed drop-shadow-sm italic">
                                        "{oracleMessage}"
                                    </p>
                                </div>
                            )}

                            {/* B6. Loading/Channeling State */}
                            {isReading && (
                                <div className="absolute inset-0 flex items-center justify-center z-30">
                                    <Sparkles className="w-20 h-20 text-indigo-100 animate-spin-slow opacity-90 drop-shadow-[0_0_25px_rgba(255,255,255,1)]" />
                                </div>
                            )}
                        </div>

                        {/* B7. Surface Reflections (Gloss) - Static for realism */}
                        <div className="absolute top-8 left-12 w-32 h-16 bg-gradient-to-b from-white/10 to-transparent rounded-[100%] blur-md -rotate-45 pointer-events-none z-30"></div>

                    </div>

                    {/* C. BASE/STAND */}
                    <div className="w-48 h-16 bg-gradient-to-b from-stone-900 via-black to-transparent rounded-[100%] relative -mt-8 z-10 flex items-center justify-center">
                        <div className="w-32 h-1 bg-indigo-500/50 blur-[4px] absolute top-0"></div>
                    </div>

                    {/* D. INTERACTION BUTTON */}
                    <div className="mt-16 relative z-40">
                        {!isReading && !oracleMessage && (
                            <button
                                onClick={divineInsight}
                                className="group relative px-10 py-4 bg-transparent border border-indigo-500/30 overflow-hidden transition-all hover:border-indigo-400"
                            >
                                <div className="absolute inset-0 bg-indigo-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                <span className="relative flex items-center gap-3 font-black text-sm uppercase tracking-[0.3em] text-indigo-300 group-hover:text-white transition-colors">
                                    <Eye className="w-4 h-4" /> Consult Fate <span className="opacity-50">(-5m)</span>
                                </span>
                            </button>
                        )}

                        {oracleMessage && !isReading && (
                            <button
                                onClick={() => setOracleMessage(null)}
                                className="text-indigo-500/50 hover:text-indigo-300 text-xs uppercase tracking-[0.2em] transition-colors animate-pulse"
                            >
                                Clear Vision
                            </button>
                        )}

                        {isReading && (
                            <p className="text-indigo-400/60 text-xs uppercase tracking-[0.5em] animate-pulse">Channeling...</p>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
};

export default ObservatoryView;
