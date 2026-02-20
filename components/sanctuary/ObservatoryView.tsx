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
    const [isProcessing, setIsProcessing] = useState(false);

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
        if (isProcessing || isReading) return;
        setIsProcessing(true);
        const COST = 1;
        if (user.balance < COST) {
            showToast(`The spirits require an offering of ${COST} minutes.`, "error");
            setIsProcessing(false);
            return;
        }

        if (await UserService.deductBalance(COST, 'Consulted the Oracle')) {
            setIsReading(true);
            setIsProcessing(false);
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
                    "Release the anchor of the past; the tide is rising in your favor. The old stories you tell yourself are expired scripts. Write a new scene today, one where you are the hero.\n\n✨ Cosmic Insight: Jupiter's influence brings luck to those who take bold risks today.",
                    "The confusion you feel is simply the dust settling from a recent shift. Do not rush to clarity. Let the sediment fall, and the water will become clear on its own.\n\n✨ Cosmic Insight: A sudden insight will come to you in a moment of silence.",
                    "You are being called to step into a larger version of yourself. The fear you feel is just excitement without breath. Breathe into it.\n\n✨ Cosmic Insight: Your voice has power today. Speak your truth.",
                    "A cycle is ending, completing a lesson you have been learning for months. Do not mourn the end; celebrate the graduation. You are ready for the next level.\n\n✨ Cosmic Insight: New beginnings are often disguised as painful endings.",
                    "Your sensitivity is not a weakness, but a finely tuned instrument. Use it to navigate the emotional currents around you, but do not let them drown you.\n\n✨ Cosmic Insight: Protect your energy field today; not everyone deserves access.",
                    "The answer you seek is not in the noise of the world, but in the silence of your own heart. Solitude is your sanctuary right now.\n\n✨ Cosmic Insight: A dream tonight will hold a key symbol. Pay attention.",
                    "You are planting seeds in winter. It looks like nothing is happening, but the roots are growing deep. Trust the timing of your life.\n\n✨ Cosmic Insight: Spring is coming sooner than you think.",
                    "Do not fear the void. It is the womb of creation. When you feel empty, know that you are simply making space for something better to enter.\n\n✨ Cosmic Insight: A creative breakthrough is imminent.",
                    "Your past mistakes were not failures, but course corrections. You needed to go that way to know it wasn't the way. Forgive yourself and move forward.\n\n✨ Cosmic Insight: The path is clearer now than it has ever been.",
                    "Balance is not a static state, but a constant adjustment. Like a tightrope walker, you must keep moving to stay upright. Embrace the wobble.\n\n✨ Cosmic Insight: Harmony is found in motion."
                ];
                const msg = insights[Math.floor(Math.random() * insights.length)];

                setOracleMessage(msg);
                setIsReading(false);
                playMysticSound('reveal');
            }, 3000);
        } else {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] bg-black text-indigo-50 flex flex-col animate-in fade-in duration-1000 overflow-hidden font-serif selection:bg-purple-500 selection:text-white">
            {/* 1. CINEMATIC BACKGROUND */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_#000000_80%)]"></div>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2094&auto=format&fit=crop')] bg-cover bg-center opacity-30 animate-pulse-slow mix-blend-screen"></div>
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
                                <div className="absolute inset-0 flex items-center justify-center p-8 md:p-12 text-center z-30 bg-black/40 backdrop-blur-[1px] overflow-y-auto rounded-full">
                                    <div className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-100 via-white to-purple-200 font-serif leading-relaxed drop-shadow-sm italic">
                                        <Typewriter text={`"${oracleMessage}"`} speed={30} />
                                    </div>
                                </div>
                            )}

                            {/* B6. Loading/Channeling State */}
                            {isReading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
                                    <Sparkles className="w-16 h-16 text-indigo-200 animate-spin-slow opacity-90 drop-shadow-[0_0_25px_rgba(255,255,255,0.8)]" />
                                    <span className="mt-4 text-[10px] uppercase tracking-[0.3em] text-indigo-200/60 animate-pulse">Divining...</span>
                                </div>
                            )}
                        </div>

                        {/* B7. Surface Reflections (Gloss) */}
                        <div className="absolute top-8 left-12 w-32 h-16 bg-gradient-to-b from-white/20 to-transparent rounded-[100%] blur-md -rotate-45 pointer-events-none z-30 mix-blend-overlay"></div>
                    </div>

                    {/* C. BASE/STAND */}
                    <div className="w-40 h-12 bg-gradient-to-b from-stone-900 via-black to-transparent rounded-[100%] relative -mt-6 z-10 flex items-center justify-center shadow-2xl">
                        <div className="w-24 h-1 bg-indigo-500/50 blur-[4px] absolute top-0 animate-pulse"></div>
                    </div>

                    {/* D. INTERACTION BUTTON */}
                    <div className="mt-16 relative z-40 transition-all duration-500">
                        {!isReading && !oracleMessage && (
                            <button
                                onClick={divineInsight}
                                disabled={isProcessing}
                                className={`group relative px-10 py-4 bg-transparent overflow-hidden transition-all ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className="absolute inset-0 border border-indigo-500/30 group-hover:border-indigo-400 rounded-full transition-colors"></div>
                                <div className="absolute inset-0 bg-indigo-500/10 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-full"></div>
                                <span className="relative flex items-center gap-3 font-black text-sm uppercase tracking-[0.3em] text-indigo-300 group-hover:text-white transition-colors">
                                    <Eye className="w-4 h-4" /> {isProcessing ? 'Channeling...' : 'Consult Fate'} <span className="opacity-50">(-1m)</span>
                                </span>
                            </button>
                        )}

                        {oracleMessage && !isReading && (
                            <button
                                onClick={() => setOracleMessage(null)}
                                className="text-indigo-500/50 hover:text-indigo-300 text-xs uppercase tracking-[0.2em] transition-colors animate-pulse hover:animate-none"
                            >
                                Clear Vision
                            </button>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
};

// Simple Typewriter Component
const Typewriter = ({ text, speed = 40 }: { text: string, speed?: number }) => {
    const [displayed, setDisplayed] = useState('');

    useEffect(() => {
        setDisplayed('');
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayed((prev) => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(timer);
            }
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed]);

    return <span className="animate-in fade-in duration-300">{displayed}</span>;
};

export default ObservatoryView;
