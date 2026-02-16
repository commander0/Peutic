import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Eye } from 'lucide-react';
import { User } from '../../types';
import { useToast } from '../common/Toast';
import { UserService } from '../../services/userService';

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
            freqs.forEach((f) => {
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
                    "The universe whispers that your resilience is your greatest shield. A challenge that currently looms large is merely a shadow cast by a smaller object; shift your perspective and the darkness will recede.\n\n✨ Cosmic Insight: The stars align in your sector of creativity. Now is the time to build, not destroy.",
                    "A door you thought closed is merely waiting for a different key. Patience is not passive waiting, but active preparation. Clean your house, both literally and metaphorically, for a guest is coming.\n\n✨ Cosmic Insight: Energy flows where intention goes. Focus on what you want to grow.",
                    "Your energy affects those around you more than you realize; shine bright. You have been playing small to make others comfortable, but your dimness serves no one. Ignite your inner sun.\n\n✨ Cosmic Insight: A chance encounter will reveal a hidden truth about your path.",
                    "The path ahead is foggy, but your intuition is a lantern that never fails. Trust the quiet voice beneath the noise of anxiety. It knows the way home even when the map is lost.\n\n✨ Cosmic Insight: The moon phase suggests a time of release. Let go of what is heavy.",
                    "What you seek is already seeking you. Be still and let it find you. The frantic chasing has only pushed your desire further away. Become the magnet, not the hunter.\n\n✨ Cosmic Insight: Abundance is a frequency, not a destination. Tune in.",
                    "Release the anchor of the past; the tide is rising in your favor. The old stories you tell yourself are expired scripts. Write a new scene today, one where you are the hero.\n\n✨ Cosmic Insight: Jupiter's influence brings luck to those who take bold risks today."
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

                        {/* B2. The Glass Sphere (Ultra-Realistic) */}
                        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,_rgba(255,255,255,0.1)_0%,_rgba(79,70,229,0.05)_20%,_rgba(0,0,0,0.9)_90%)] shadow-[inset_0_0_80px_rgba(0,0,0,0.9),inset_10px_10px_20px_rgba(255,255,255,0.05),0_0_50px_rgba(79,70,229,0.2)] border border-indigo-500/10 backdrop-blur-[1px] overflow-hidden z-20">

                            {/* B3. Internal Mist (Dynamic Volumetric) */}
                            <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/foggy-birds.png')] mix-blend-color-dodge transition-transform duration-[20s] ease-linear ${isReading ? 'animate-[spin_4s_linear_infinite] scale-150 opacity-80' : 'animate-[spin_30s_linear_infinite] scale-125 opacity-20'}`}></div>

                            {/* B3.1. Nebula Clouds */}
                            <div className={`absolute inset-0 bg-gradient-to-tr from-indigo-900/0 via-purple-500/10 to-indigo-900/0 mix-blend-overlay ${isReading ? 'animate-pulse' : ''}`}></div>

                            {/* B4. Core Energy */}
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-indigo-500 rounded-full blur-[50px] mix-blend-screen transition-all duration-500 ${isReading ? 'scale-150 opacity-80' : 'scale-100 opacity-30 animate-pulse-slow'}`}></div>

                            {/* B5. TEXT REVEAL (The Insight) */}
                            {oracleMessage && !isReading && (
                                <div className="absolute inset-0 flex items-center justify-center p-6 md:p-10 text-center z-30 animate-in fade-in zoom-in duration-1000 bg-black/50 backdrop-blur-[2px] overflow-y-auto">
                                    <p className="text-sm md:text-xl text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-200 to-indigo-400 font-serif leading-relaxed drop-shadow-sm italic whitespace-pre-wrap">
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
