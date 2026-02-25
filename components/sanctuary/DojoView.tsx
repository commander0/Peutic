import React, { useState, useEffect, useRef } from 'react';
import { X, Flame, Target, Trophy, Wind, BookOpen, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { User } from '../../types';
import { useToast } from '../common/Toast';
import { UserService } from '../../services/userService';
import { SanctuaryService } from '../../services/SanctuaryService';
import { GardenService } from '../../services/gardenService';
import { PetService } from '../../services/petService';
import SanctuaryShop, { SANCTUARY_ITEMS } from './SanctuaryShop';

interface DojoViewProps {
    user: User;
    onClose: () => void;
    onUpdate?: () => void;
}

const DojoView: React.FC<DojoViewProps> = ({ user, onClose, onUpdate }) => {
    const { showToast } = useToast();
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins
    const [selectedMins, setSelectedMins] = useState(25);
    const [isActive, setIsActive] = useState(false);
    const [timerMode, setTimerMode] = useState<'focus' | 'break' | 'candle'>('candle');
    const [streak, setStreak] = useState(0);
    const [totalFocus, setTotalFocus] = useState(0);
    const [koan, setKoan] = useState<string | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showShop, setShowShop] = useState(false);
    const [localUser, setLocalUser] = useState<User>(user);
    const [luminaLevel, setLuminaLevel] = useState(1);
    const timerRef = useRef<number | null>(null);
    const windChimeRef = useRef<HTMLAudioElement | null>(null);

    // Sync remote updates
    useEffect(() => {
        setLocalUser(prev => ({ ...prev, ...user, unlockedDecor: user.unlockedDecor || prev.unlockedDecor }));
    }, [user]);

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
    const audioNodesRef = useRef<{
        bells: { intervalId: any; audio?: HTMLAudioElement } | null;
    }>({ bells: null });

    const [bellInterval, setBellInterval] = useState<number>(0); // 0 = start/end only, >0 = every X seconds

    // Initial Load
    useEffect(() => {
        const loadHistory = async () => {
            const history = await SanctuaryService.getFocusHistory(user.id);
            setStreak(history.length);
            const minutes = history.reduce((acc, curr) => acc + (curr.durationSeconds / 60), 0);
            setTotalFocus(Math.floor(minutes));

            // Link to Lumina Gamification
            const pet = await PetService.getPet(user.id);
            if (pet) {
                setLuminaLevel(pet.level);
            }
        };
        loadHistory();

        return () => {
            stopAudio();
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

    // Procedural Bell Generation (Tibetan Bowl)
    const playBellSound = () => {
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
            gain.gain.linearRampToValueAtTime(vol, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

            osc.start(now);
            osc.stop(now + dur);
        };

        // Create a rich, resonant chord
        const baseFreq = 160;
        cast(baseFreq, 0, 8, 0.4);       // Fundamental
        cast(baseFreq * 1.5, 0.05, 7, 0.2); // Fifth
        cast(baseFreq * 2, 0.1, 6, 0.1);    // Octave
        cast(baseFreq * 2.5, 0.15, 5, 0.05); // Major 10th
    };

    // Advanced Gamification Sounds
    const playAscendantChime = () => {
        if (!soundEnabled) return;
        const ctx = initAudio();
        const cast = (freq: number, delay: number, dur: number, type: OscillatorType) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            osc.type = type;
            osc.connect(gain);
            gain.connect(ctx.destination);
            const now = ctx.currentTime + delay;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
            osc.start(now);
            osc.stop(now + dur);
        };
        cast(528, 0, 4, 'sine'); // Solfeggio 528Hz DNA Repair
        cast(852, 0.2, 5, 'triangle');
        cast(1056, 0.5, 3, 'sine');
    };

    const playCelestialVoid = () => {
        if (!soundEnabled) return;
        const ctx = initAudio();
        const cast = (freq: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            osc.type = 'sine';
            osc.connect(gain);
            gain.connect(ctx.destination);
            const now = ctx.currentTime;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.3, now + 4); // Slow attack
            gain.gain.linearRampToValueAtTime(0, now + 12); // Slow release
            osc.start(now);
            osc.stop(now + 12);
        };
        cast(136.1); // OM Frequency
        cast(136.1 * 1.01); // Binaural beat effect
    };

    // Choose which sound to play
    const triggerAmbientSound = () => {
        if (luminaLevel >= 50 && bellInterval === 300) {
            playCelestialVoid();
        } else if (luminaLevel >= 30 && bellInterval === 120) {
            playAscendantChime();
        } else {
            playBellSound();
        }
    };

    const stopAudio = () => {
        // Stop Interval Bells
        if (audioNodesRef.current.bells) {
            clearInterval(audioNodesRef.current.bells.intervalId);
            if (audioNodesRef.current.bells.audio) {
                audioNodesRef.current.bells.audio.pause();
                audioNodesRef.current.bells.audio.currentTime = 0;
            }
            audioNodesRef.current.bells = null;
        }
    };

    // Rotating Wisdom Quotes
    useEffect(() => {
        let koanInterval: any;
        if (isActive) {
            // Pick an initial one if empty
            if (!koan) setKoan(KOANS[Math.floor(Math.random() * KOANS.length)]);

            koanInterval = setInterval(() => {
                setKoan(null); // Fade out
                setTimeout(() => {
                    // Fade in new quote
                    setKoan(KOANS[Math.floor(Math.random() * KOANS.length)]);
                }, 1000); // Wait 1 second while completely faded out
            }, 12000); // 12 seconds per quote
        } else {
            setKoan(null);
        }
        return () => clearInterval(koanInterval);
    }, [isActive]);

    // Toggle logic for Timer Audio Additions
    useEffect(() => {
        if (isActive) {
            if (soundEnabled) triggerAmbientSound(); // Start Sound

            if (timerMode === 'candle') {
                if (soundEnabled && windChimeRef.current) {
                    windChimeRef.current.volume = 0.2;
                    windChimeRef.current.play().catch(e => console.error("Chime error:", e));
                }

                const bellId = window.setInterval(() => {
                    if (soundEnabled) triggerAmbientSound();
                }, 45000); // Strike bowl every 45s

                audioNodesRef.current.bells = { intervalId: bellId };
            }
            // Loop sounds if requested
            else if (bellInterval > 0) {
                const id = window.setInterval(() => {
                    if (soundEnabled) triggerAmbientSound();
                }, bellInterval * 1000);
                audioNodesRef.current.bells = { intervalId: id };
            }
        } else {
            stopAudio();
            if (windChimeRef.current) {
                windChimeRef.current.pause();
                windChimeRef.current.currentTime = 0;
            }
        }

        // CRITICAL PATCH: Memory cleanup to prevent overlapping audio oscillators
        return () => {
            stopAudio();
            if (windChimeRef.current) windChimeRef.current.pause();
        };
    }, [isActive, bellInterval, soundEnabled]);

    const toggleTimer = () => {
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
        } else if (timeLeft === 0 && isActive) {
            // Timer Finished - Added isActive check to prevent infinite loop
            handleComplete();
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isActive, timeLeft]);

    const handleComplete = async () => {
        setIsActive(false);
        stopAudio();
        triggerAmbientSound();

        if (timerMode === 'focus' || timerMode === 'candle') {
            const success = await SanctuaryService.saveFocusSession(user.id, selectedMins * 60, 'FOCUS');
            if (success) {
                // Link directly to Inner Garden gamification
                await GardenService.addFocusMinutes(user.id, selectedMins);
                await UserService.deductBalance(0, 'Focus Session Complete'); // XP Trigger
                showToast(`Focus Session Recorded! +${selectedMins} Garden Mins (+50 XP)`, "success");
                setStreak((s: number) => s + 1);
                setTotalFocus((t: number) => t + selectedMins);
            } else {
                showToast("Failed to save session", "error");
            }

            setTimerMode('break');
            setTimeLeft(5 * 60);
        } else {
            showToast("Break over. Back to the Dojo.", "info");
            setTimerMode('candle');
            setTimeLeft(selectedMins * 60);
            setIsActive(false);
            triggerAmbientSound(); // End bell
        }
    };

    const setTime = (mins: number) => {
        if (!isActive) {
            setTimeLeft(mins * 60);
            setSelectedMins(mins);
        }
    };

    return (
        <div className="fixed inset-0 h-[100dvh] z-[120] bg-stone-900 text-stone-100 flex flex-col font-serif animate-in fade-in duration-700 overflow-hidden">
            {/* Audio Elements bound to DOM for Autoplay Bypass */}
            <audio ref={windChimeRef} src="https://cdn.freesound.org/previews/411/411088_5121236-lq.mp3" loop preload="auto" />

            {/* Real Zen Dojo Background (Unsplash) - Deepened Atmosphere */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-luminosity"></div>

            {/* Parallax / Dynamic Lighting Layers */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-stone-950/90 to-stone-900/60 mix-blend-multiply"></div>

            {/* Ambient Sunbeams / Dust Motes */}
            <div className="absolute top-0 left-1/4 w-1/2 h-[150%] bg-gradient-to-b from-amber-100/10 via-amber-600/5 to-transparent origin-top -skew-x-[25deg] pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-amber-100/40 rounded-full blur-[1px] animate-[sway-drop_15s_linear_infinite]"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            opacity: Math.random() * 0.5 + 0.1
                        }}
                    />
                ))}
            </div>

            {/* Header */}
            <header className="relative z-20 px-8 py-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Wind className="w-6 h-6 text-stone-400" />
                    <span className="text-xl tracking-widest uppercase opacity-80">Zen Dojo</span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowShop(true)} className="px-4 py-2 bg-amber-500/10 text-amber-200 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-amber-500/20 transition-all flex items-center gap-2">
                        Decorate
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {/* --- VISUAL DECORATIONS --- */}
            {/* Placed at z-10 so it's under main interactive layer but OVER all background masks */}
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                {localUser.unlockedDecor?.map(itemId => {
                    const itemData = SANCTUARY_ITEMS.find(i => i.id === itemId);
                    if (!itemData) return null;

                    // Absolute positioning map for items relative to the full screen
                    const getPositionClass = (id: string) => {
                        switch (id) {
                            case 'incense': return 'bottom-[15%] left-[20%] md:left-[25%] text-5xl md:text-7xl opacity-100 animate-[sway_4s_ease-in-out_infinite] drop-shadow-2xl';
                            case 'bonsai': return 'bottom-[20%] right-[15%] md:right-[20%] text-7xl md:text-8xl opacity-100 drop-shadow-2xl';
                            case 'lantern': return 'top-[15%] left-[15%] md:left-[20%] text-6xl md:text-7xl opacity-100 animate-pulse-slow drop-shadow-[0_0_25px_rgba(24cd,211,153,0.8)]';
                            case 'stones': return 'bottom-[10%] left-[45%] md:left-[40%] text-4xl md:text-5xl opacity-100 drop-shadow-xl';
                            case 'scroll': return 'top-[20%] right-[20%] md:right-[25%] text-6xl md:text-7xl opacity-100 drop-shadow-xl';
                            case 'singing_bowl': return 'bottom-[12%] left-[35%] md:left-[28%] text-5xl md:text-6xl opacity-100 drop-shadow-2xl';
                            default: return 'hidden';
                        }
                    };

                    return (
                        <div key={itemId} className={`absolute ${getPositionClass(itemId)}`}>
                            {itemData.icon}
                        </div>
                    );
                })}
            </div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-start overflow-y-auto custom-scrollbar w-full max-w-md mx-auto p-4 md:p-6 relative z-20 pt-4 md:pt-8" style={{ maxHeight: 'calc(100dvh - 80px)' }}>

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
                    <div className={`w-64 h-64 md:w-80 md:h-80 rounded-full border border-white/10 flex flex-col items-center justify-center relative bg-white/5 backdrop-blur-3xl shadow-premium transition-all duration-1000 shrink-0 ${isActive ? 'scale-105 border-amber-500/30 animate-ethereal-breathe shadow-[0_0_40px_rgba(245,158,11,0.2)]' : ''}`}>

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

                {/* KOAN DISPLAY - MOVED UP FOR VISIBILITY */}
                {koan && (
                    <div className="mb-8 w-full max-w-lg p-8 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] text-center animate-in zoom-in duration-500 shadow-premium relative z-20">
                        <p className="text-xl md:text-2xl font-serif italic text-amber-200/90 leading-relaxed drop-shadow-md">"{koan}"</p>
                        <button onClick={() => setKoan(null)} className="text-[10px] text-stone-500 hover:text-stone-300 mt-4 uppercase tracking-widest font-bold">Dismiss</button>
                    </div>
                )}

                {/* CONTROLS */}
                <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                    <button
                        onClick={(e) => { e.stopPropagation(); nextKoan(); }}
                        className="px-6 py-3 rounded-[2rem] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all bg-white/5 text-amber-500 border border-white/10 hover:bg-white/10 hover:text-amber-200 shadow-glass backdrop-blur-md"
                    >
                        <BookOpen className="w-4 h-4" />
                        Seek Wisdom
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSoundEnabled(!soundEnabled);
                            if (!soundEnabled && windChimeRef.current && timerMode === 'candle' && isActive) {
                                windChimeRef.current.play().catch(() => { });
                            }
                        }}
                        className={`p-3 rounded-full transition-all border backdrop-blur-md ${soundEnabled ? 'bg-amber-500/10 text-amber-400 border-amber-500/40 shadow-glass' : 'bg-white/5 text-stone-400 border-white/10 hover:bg-white/10 hover:text-white shadow-glass-dark'}`}
                    >
                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <span className="text-[9px] uppercase tracking-widest text-stone-600 font-bold">{soundEnabled ? 'Bells On' : 'Silent'}</span>
                </div>

                {/* --- NEW SOUNDSCAPE CONTROLS --- */}
                <div className="bg-black/40 rounded-[2rem] p-8 backdrop-blur-3xl border border-white/10 w-full max-w-lg mb-12 shadow-premium relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

                    <h3 className="text-lg font-serif text-amber-200/80 mb-6 flex items-center justify-center gap-3 tracking-widest uppercase text-sm">
                        <Volume2 className="w-5 h-5 text-amber-500" />
                        Acoustic Atmosphere
                        <VolumeX className="w-5 h-5 text-amber-500/30" />
                    </h3>

                    <div className="flex flex-col items-center gap-6 relative z-10 w-full">
                        <div className="w-full">
                            <label className="text-[10px] uppercase font-black tracking-widest text-stone-500 mb-3 block text-center">Singing Bowl Interval</label>
                            <div className="grid grid-cols-3 gap-3 w-full mb-4">
                                {[0, 60, 300].map((sec) => (
                                    <button
                                        key={sec}
                                        onClick={(e) => { e.stopPropagation(); setBellInterval(sec); }}
                                        className={`px-2 py-3 rounded-xl text-xs font-bold tracking-wider text-center transition-all ${bellInterval === sec
                                            ? 'bg-amber-500/20 text-amber-200 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                            : 'hover:bg-white/5 text-stone-500 border border-white/5'
                                            }`}
                                    >
                                        {sec === 0 ? 'START/END' : sec === 60 ? '1 MIN' : '5 MIN'}
                                    </button>
                                ))}
                            </div>

                            {(luminaLevel >= 30 || luminaLevel >= 50) && (
                                <>
                                    <div className="w-full h-px bg-stone-800/50 my-4"></div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-emerald-500/70 mb-3 block text-center flex items-center justify-center gap-2">
                                        <Sparkles className="w-3 h-3" /> Lumina Unlocks
                                    </label>
                                    <div className="grid grid-cols-2 gap-3 w-full">
                                        {luminaLevel >= 30 && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setBellInterval(120); }} // 2 mins special
                                                className={`px-2 py-3 rounded-xl text-xs font-bold tracking-wider text-center transition-all ${bellInterval === 120
                                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                                    : 'bg-emerald-900/10 text-emerald-600/60 border border-emerald-900/30 hover:border-emerald-700/50'
                                                    }`}
                                            >
                                                ASCENDANT CHIMES
                                            </button>
                                        )}
                                        {luminaLevel >= 50 && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setBellInterval(300); }} // Overrides 5 min logic dynamically
                                                className={`px-2 py-3 rounded-xl text-xs font-bold tracking-wider text-center transition-all ${bellInterval === 300 && luminaLevel >= 50
                                                    ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.2)]'
                                                    : 'bg-fuchsia-900/10 text-fuchsia-600/60 border border-fuchsia-900/30 hover:border-fuchsia-700/50'
                                                    }`}
                                            >
                                                CELESTIAL VOID
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

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

            {/* SHOP MODAL */}
            {showShop && (
                <SanctuaryShop
                    user={localUser}
                    onClose={() => setShowShop(false)}
                    onPurchaseUpdate={(u) => { setLocalUser(u); onUpdate?.(); }}
                />
            )}
        </div>
    );
};

export default DojoView;
