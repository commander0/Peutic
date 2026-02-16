import React, { useState, useEffect, useRef } from 'react';
import { X, Flame, Target, Trophy, Wind, BookOpen, Volume2, VolumeX } from 'lucide-react';
import { User } from '../../types';
import { useToast } from '../common/Toast';
import { UserService } from '../../services/userService';
import { SanctuaryService } from '../../services/SanctuaryService';

interface DojoViewProps {
    user: User;
    onClose: () => void;
}

const DojoView: React.FC<DojoViewProps> = ({ user, onClose }) => {
    const { showToast } = useToast();
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins
    const [isActive, setIsActive] = useState(false);
    const [timerMode, setTimerMode] = useState<'focus' | 'break' | 'candle'>('candle');
    const [streak, setStreak] = useState(0);
    const [totalFocus, setTotalFocus] = useState(0);
    const [breathMode, setBreathMode] = useState<'none' | '4-7-8' | 'box'>('none');
    const [koan, setKoan] = useState<string | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const timerRef = useRef<number | null>(null);
    const bellRef = useRef<HTMLAudioElement | null>(null);

    const KOANS = [
        "What is the sound of one hand clapping?",
        "If you meet the Buddha on the road, kill him.",
        "The foot feels the foot when it feels the ground.",
        "When you do nothing, you do everything.",
        "The obstacle is the path.",
        "Before enlightenment, chop wood, carry water. After enlightenment, chop wood, carry water.",
        "Does a dog have Buddha nature?",
        "Empty your cup so that it may be filled."
    ];

    // Audio Context Ref
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Ambience Ref
    const ambienceRef = useRef<{ node: AudioBufferSourceNode, gain: GainNode } | null>(null);

    // Initial Load - Init AudioContext on interaction
    useEffect(() => {
        const loadHistory = async () => {
            const history = await SanctuaryService.getFocusHistory(user.id);
            setStreak(history.length);
            const minutes = history.reduce((acc, curr) => acc + (curr.durationSeconds / 60), 0);
            setTotalFocus(Math.floor(minutes));
        };
        loadHistory();

        return () => {
            stopAmbience();
            if (audioCtxRef.current) audioCtxRef.current.close();
        };
    }, [user.id]);

    const initAudio = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    };

    const playBell = () => {
        if (!soundEnabled) return;
        const ctx = initAudio();

        const cast = (freq: number, delay: number, dur: number, vol: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            osc.type = 'sine';
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime + delay;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(vol, now + 0.05); // Faster attack
            gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

            osc.start(now);
            osc.stop(now + dur);
        };

        // Louder Tibetan Bowl Chord (User Request: "bells need to be heard")
        cast(160, 0, 8, 0.6); // Fundamental (Boosted)
        cast(480, 0.05, 6, 0.3); // Harmonic 3rd
        cast(800, 0.1, 5, 0.15); // Harmonic 5th
    };

    const playAmbience = () => {
        if (!soundEnabled) return;
        const ctx = initAudio();

        // Brown Noise Buffer
        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (0 + (0.02 * white)) / 1.02; // Simple approx
            data[i] *= 3.5; // Gain up
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        // Lowpass Filter for "Hum/Womb" effect
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 120;

        const gain = ctx.createGain();
        gain.gain.value = 0.08; // Slightly louder hum

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();

        ambienceRef.current = { node: noise, gain };
    };

    const stopAmbience = () => {
        if (ambienceRef.current) {
            ambienceRef.current.gain.gain.setTargetAtTime(0, audioCtxRef.current?.currentTime || 0, 0.5);
            setTimeout(() => {
                ambienceRef.current?.node.stop();
                ambienceRef.current = null;
            }, 1000);
        }
    };

    const toggleTimer = () => {
        if (!isActive) {
            playBell();
            playAmbience();
        } else {
            stopAmbience();
        }
        setIsActive(!isActive);
    };

    const nextKoan = () => {
        const random = KOANS[Math.floor(Math.random() * KOANS.length)];
        setKoan(random);
    };

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = window.setTimeout(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            // Timer Finished
            handleComplete();
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isActive, timeLeft]);

    const handleComplete = async () => {
        setIsActive(false);
        playBell();
        stopAmbience();

        if (timerMode === 'focus' || timerMode === 'candle') {
            const success = await SanctuaryService.saveFocusSession(user.id, 25 * 60, 'FOCUS');
            if (success) {
                await UserService.deductBalance(0, 'Focus Session Complete'); // XP Trigger
                showToast("Focus Session Recorded! (+50 XP)", "success");
                setStreak(s => s + 1);
                setTotalFocus(t => t + 25);
            } else {
                showToast("Failed to save session", "error");
            }

            setTimerMode('break');
            setTimeLeft(5 * 60);
        } else {
            showToast("Break over. Back to the Dojo.", "info");
            setIsActive(false);
            playBell(); // End bell
        }
    };

    const setTime = (mins: number) => {
        if (!isActive) setTimeLeft(mins * 60);
    };

    return (
        <div className="fixed inset-0 z-[120] bg-stone-900 text-stone-100 flex flex-col font-serif animate-in fade-in duration-700 overflow-hidden">
            {/* Real Zen Dojo Background (Unsplash) */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/80 to-stone-900/30"></div>

            {/* Header */}
            <header className="relative z-10 px-8 py-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Wind className="w-6 h-6 text-stone-400" />
                    <span className="text-xl tracking-widest uppercase opacity-80">Zen Dojo</span>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">

                {/* Time Selection (Restored - Small) */}
                {!isActive && (
                    <div className="flex gap-4 mb-8 highlight-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {[5, 10, 15, 20, 25].map(m => (
                            <button
                                key={m}
                                onClick={() => setTime(m)}
                                className={`px-5 py-2 rounded-full text-xs font-bold tracking-widest border transition-all ${timeLeft === m * 60 ? 'bg-amber-500/20 border-amber-500/50 text-amber-200' : 'bg-white/5 border-white/10 hover:bg-white/10 text-stone-400'}`}
                            >
                                {m}M
                            </button>
                        ))}
                    </div>
                )}

                {/* Digital Timer Preview (Small) & Candle Visualizer */}
                <div className="relative mb-12 group cursor-pointer flex flex-col items-center" onClick={toggleTimer}>

                    {/* Timer Text */}
                    <div className="mb-4 text-4xl font-light text-stone-300 tracking-widest font-variant-numeric tabular-nums opacity-80">
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>

                    {/* The Circle Frame (Candle Container) */}
                    <div className={`w-72 h-72 md:w-96 md:h-96 rounded-full border border-stone-800 flex flex-col items-center justify-center relative bg-stone-900/30 backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-1000 ${isActive ? 'scale-105 border-orange-900/40' : ''}`}>

                        {timerMode === 'candle' ? (
                            <div className="flex flex-col items-center justify-center animate-in fade-in duration-1000 scale-125 md:scale-150 relative -mt-8">
                                {/* Ambient Warmth Glow */}
                                <div className={`absolute -top-20 -left-20 right-0 bottom-0 bg-orange-500/5 rounded-full blur-[100px] transition-all duration-3000 ${isActive ? 'opacity-100 scale-110' : 'opacity-20 scale-90'}`}></div>

                                {/* Candle Complex */}
                                <div className="relative group flex flex-col items-center">
                                    {/* Flame Container */}
                                    <div className={`absolute -top-14 left-1/2 -translate-x-1/2 w-8 h-32 origin-bottom transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                                        {/* Outer Orange/Red Glow */}
                                        <div className="absolute inset-0 bg-orange-500/30 blur-2xl rounded-full animate-pulse-slow"></div>

                                        {/* Main Flame Shape */}
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-14 bg-gradient-to-t from-orange-600 via-yellow-400 to-white rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] shadow-[0_0_20px_rgba(255,165,0,0.6)] animate-flicker transform-gpu">
                                            {/* Blue Core */}
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-blue-600/80 rounded-full blur-[1px]"></div>
                                        </div>

                                        {/* Sparkles/Embers */}
                                        {isActive && (
                                            <>
                                                <div className="absolute bottom-2 left-1/2 w-0.5 h-0.5 bg-yellow-100 shadow-[0_0_5px_white] animate-ember-fly-1"></div>
                                                <div className="absolute bottom-4 left-1/2 w-0.5 h-0.5 bg-orange-100 shadow-[0_0_5px_white] animate-ember-fly-2"></div>
                                            </>
                                        )}
                                    </div>

                                    {/* Candle Body */}
                                    <div className="w-24 h-32 bg-gradient-to-r from-stone-800 via-stone-700 to-stone-800 rounded-lg relative overflow-hidden shadow-2xl border-t border-stone-600/50 mt-16">
                                        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-stone-600 to-stone-800 rounded-[100%] blur-[0.5px] opacity-90"></div>
                                        <div className="absolute inset-x-4 top-2 h-4 bg-yellow-900/20 rounded-[100%] blur-sm opacity-60 animate-pulse-slow"></div>
                                        <div className="absolute top-4 left-4 w-2 h-12 bg-stone-700/60 rounded-full blur-[1px] shadow-sm"></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center space-y-4 animate-in fade-in">
                                <span className="block text-6xl">{isActive ? "Inhale" : "Ready"}</span>
                                <p className="text-stone-500 text-sm tracking-widest uppercase">Tap to {isActive ? "Stop" : "Begin"}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                    <button
                        onClick={(e) => { e.stopPropagation(); setBreathMode(breathMode === 'none' ? '4-7-8' : (breathMode === '4-7-8' ? 'box' : 'none')); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${breathMode !== 'none' ? 'bg-amber-900/30 text-amber-400 border border-amber-500/20 shadow-lg' : 'bg-stone-900/50 text-stone-500 border border-stone-800 hover:text-stone-300'}`}
                    >
                        <Wind className="w-4 h-4" />
                        {breathMode === 'none' ? 'Breathing: Off' : `Breathing: ${breathMode}`}
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); nextKoan(); }}
                        className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all bg-stone-900/50 text-stone-400 border border-stone-800 hover:text-amber-200 hover:border-amber-500/30"
                    >
                        <BookOpen className="w-4 h-4" />
                        Seek Wisdom
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSoundEnabled(!soundEnabled);
                            if (!soundEnabled && bellRef.current) bellRef.current.play().catch(() => { });
                        }}
                        className={`p-2 rounded-full transition-all border ${soundEnabled ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-stone-900/50 text-stone-600 border-stone-800 hover:text-stone-400'}`}
                    >
                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <span className="text-[9px] uppercase tracking-widest text-stone-600 font-bold">{soundEnabled ? 'Bells On' : 'Silent'}</span>
                </div>

                {/* KOAN DISPLAY */}
                {koan && (
                    <div className="mb-8 max-w-md text-center animate-in fade-in slide-in-from-bottom-4">
                        <p className="text-xl font-serif italic text-amber-100/90 leading-relaxed drop-shadow-lg">"{koan}"</p>
                        <button onClick={() => setKoan(null)} className="text-[9px] text-stone-500 hover:text-stone-300 mt-2 uppercase tracking-widest font-bold">Dismiss</button>
                    </div>
                )}

                {/* BREATHING VISUALIZER OVERLAY */}
                {breathMode !== 'none' && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0">
                        <div className={`rounded-full border border-amber-500/10 transition-all duration-[4000ms] ease-in-out ${isActive ? 'w-[600px] h-[600px] opacity-10' : 'w-20 h-20 opacity-0'}`}></div>
                        <div className={`absolute rounded-full bg-amber-500/5 transition-all duration-[4000ms] ease-in-out ${isActive ? 'w-[500px] h-[500px]' : 'w-10 h-10'}`}></div>
                    </div>
                )}

                {/* STATS ROW */}
                <div className="grid grid-cols-3 gap-4 w-full max-w-2xl border-t border-stone-800/50 pt-6">
                    <div className="flex flex-col items-center">
                        <Flame className="w-5 h-5 text-orange-600 mb-1" />
                        <span className="text-xl font-black text-stone-300">{streak}</span>
                        <span className="text-[8px] uppercase tracking-widest text-stone-600 font-bold">Streak</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <Target className="w-5 h-5 text-amber-600 mb-1" />
                        <span className="text-xl font-black text-stone-300">{totalFocus}m</span>
                        <span className="text-[8px] uppercase tracking-widest text-stone-600 font-bold">Total Focus</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <Trophy className="w-5 h-5 text-yellow-600 mb-1" />
                        <span className="text-xl font-black text-stone-300">Level {Math.floor(totalFocus / 60) + 1}</span>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default DojoView;
