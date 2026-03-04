import React, { useState, useEffect, useRef } from 'react';
import { X, Flame, Target, Trophy, Wind, BookOpen, Volume2, VolumeX } from 'lucide-react';
import { User } from '../../types';
import { useToast } from '../common/Toast';
import { UserService } from '../../services/userService';
import { SanctuaryService } from '../../services/SanctuaryService';
import { GardenService } from '../../services/gardenService';
import { PetService } from '../../services/petService';
import SanctuaryShop, { SANCTUARY_ITEMS } from './SanctuaryShop';
import PetCanvas from '../pocket/PetCanvas';

const RelaxingDojoPet = React.memo(({ pet }: { pet: any }) => {
    const [enlightened, setEnlightened] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.4) {
                setEnlightened(true);
                setTimeout(() => setEnlightened(false), 15000);
            }
        }, 40000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`absolute bottom-8 right-8 md:bottom-12 md:right-16 w-40 h-40 md:w-56 md:h-56 z-[45] transition-all duration-[4000ms] pointer-events-none drop-shadow-2xl ${enlightened ? 'animate-float opacity-100 -translate-y-8' : 'opacity-85 translate-y-0'}`}>
            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-4 rounded-[100%] transition-all duration-[2000ms] ${enlightened ? 'bg-amber-400/50 blur-xl scale-150' : 'bg-black/60 blur-sm'}`} />
            <div className={`absolute inset-0 transition-opacity duration-2000 ${enlightened ? 'opacity-100 mix-blend-screen bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.2),transparent_70%)]' : 'opacity-0'}`} />
            <PetCanvas pet={pet} width={200} height={200} emotion={enlightened ? 'thinker' : 'sleeping'} trick={enlightened ? 'magic' : undefined} />
        </div>
    );
});

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
    const [luminaPet, setLuminaPet] = useState<any>(null);
    const [luminaLevel, setLuminaLevel] = useState(1);
    const [bowlRipple, setBowlRipple] = useState(false);
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

            // Link to Gamification
            const pet = await PetService.getPet(user.id);
            if (pet) {
                setLuminaPet(pet);
                setLuminaLevel(pet.level);
            }

            // Removed Weather processing for Dojo as it's now an indoor living room
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
            const result = await SanctuaryService.saveFocusSession(user.id, selectedMins * 60, 'FOCUS');
            if (result.success) {
                if (!result.atomic) {
                    // FALLBACK: Link directly to Inner Garden gamification if RPC unavailable
                    await GardenService.addFocusMinutes(user.id, selectedMins);
                    await UserService.deductBalance(0, 'Focus Session Complete'); // XP Trigger
                }
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

            {/* Living Room Background Structure */}
            <div className="absolute inset-0 bg-stone-900 pointer-events-none z-0">
                {/* Wall */}
                <div className="absolute inset-x-0 top-0 h-[55%] bg-stone-800 bg-gradient-to-b from-stone-900 to-stone-800 border-b-8 border-stone-950/50 shadow-2xl">
                    {localUser.unlockedDecor?.includes('digital_dojo') ? (
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2048&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-screen transition-all"></div>
                    ) : (
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/clean-textile.png')] opacity-20"></div>
                    )}
                    {/* Soft wall lighting */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(251,191,36,0.1),transparent_60%)]"></div>
                </div>

                {/* Floor */}
                <div className="absolute inset-x-0 bottom-0 h-[45%] bg-stone-900 bg-gradient-to-t from-black to-stone-800">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-30 mix-blend-multiply border-t border-white/5"></div>

                    {/* Rug */}
                    <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[90%] md:w-[600px] h-[40%] bg-stone-800 rounded-[100%] border-[4px] border-stone-700/50 shadow-[0_20px_50px_rgba(0,0,0,0.8)] opacity-90 transform shrink-0">
                        {/* Table */}
                        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[70%] h-[40%] bg-stone-950 rounded-[100%] border-t-2 border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.9)]"></div>
                    </div>
                </div>
            </div>

            {/* Ambient Dust Motes */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="absolute w-1 h-1 bg-amber-100/30 rounded-full blur-[1px] animate-[sway-drop_15s_linear_infinite]"
                        style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s` }} />
                ))}
            </div>

            {/* Relaxing Dojo Pet - Sitting on the rug */}
            {luminaPet && <RelaxingDojoPet pet={luminaPet} />}

            {/* --- VISUAL DECORATIONS --- */}
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                {localUser.unlockedDecor?.map(itemId => {
                    const itemData = SANCTUARY_ITEMS.find(i => i.id === itemId);
                    if (!itemData) return null;

                    const getPositionClass = (id: string) => {
                        switch (id) {
                            case 'scroll': return 'top-8 left-1/2 -translate-x-1/2 md:top-12 text-[5rem] md:text-[7rem] opacity-90 drop-shadow-2xl z-0'; // Hanging on center wall
                            case 'lantern': return 'top-0 left-4 md:left-24 text-[4rem] md:text-[6rem] opacity-100 animate-[sway_6s_ease-in-out_infinite] drop-shadow-lg z-0'; // Hanging from ceiling
                            case 'bonsai': return 'bottom-[25%] left-[2%] md:bottom-[20%] md:left-[15%] text-[5rem] md:text-[7rem] drop-shadow-[0_20px_20px_rgba(0,0,0,0.9)] z-10 hover:scale-105 transition-transform'; // Floor left
                            case 'incense': return 'bottom-[25%] right-[2%] md:bottom-[20%] md:right-[15%] text-[4rem] md:text-[6rem] opacity-100 animate-[sway_4s_ease-in-out_infinite] drop-shadow-[0_20px_20px_rgba(0,0,0,0.9)] z-10'; // Floor right
                            case 'singing_bowl': return 'bottom-[12%] right-[15%] md:bottom-[15%] md:right-[25%] text-[3rem] md:text-[4.5rem] drop-shadow-[0_15px_15px_rgba(0,0,0,0.9)] pointer-events-auto cursor-pointer z-30 transition-transform active:scale-90 hover:scale-110'; // Rug right
                            case 'stones': return 'bottom-[10%] left-[15%] md:bottom-[12%] md:left-[25%] text-[2.5rem] md:text-[4rem] drop-shadow-[0_15px_15px_rgba(0,0,0,0.9)] z-20 hover:scale-105 transition-transform'; // Rug left
                            default: return 'hidden';
                        }
                    };

                    const handleBowlClick = () => {
                        if (itemId !== 'singing_bowl') return;
                        playBellSound();
                        setBowlRipple(true);
                        setTimeout(() => setBowlRipple(false), 2000);
                    };

                    return (
                        <div key={itemId} onClick={itemId === 'singing_bowl' ? handleBowlClick : undefined} className={`absolute ${getPositionClass(itemId)}`}>
                            {itemData.icon}
                            {itemId === 'singing_bowl' && bowlRipple && (
                                <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-xl scale-150 animate-[ping_2s_ease-out_forwards] pointer-events-none"></div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Header */}
            <header className="relative z-30 px-6 py-5 flex justify-between items-center bg-gradient-to-b from-stone-950 to-transparent">
                <div className="flex items-center gap-3">
                    <Wind className="w-5 h-5 text-stone-400" />
                    <span className="text-lg tracking-widest uppercase text-stone-300">Zen Dojo</span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowShop(true)} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all text-stone-300">
                        Decorate
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-stone-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Cozy Interactive Area */}
            <main className="flex-1 flex flex-col items-center justify-[flex-end] md:justify-end relative z-20 pb-12 md:pb-24 w-full max-w-5xl mx-auto px-4 mt-[35vh] md:mt-[45vh]">

                <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-8 md:gap-16 w-full">

                    {/* Left Settings Panel (Audio / Setup) */}
                    <div className="hidden md:flex flex-col gap-6 items-end text-right">
                        <div className="bg-stone-900/80 border border-white/5 p-6 rounded-3xl w-64 backdrop-blur-xl shadow-2xl">
                            <h3 className="text-[10px] font-bold text-amber-500/80 tracking-widest uppercase mb-4 flex items-center justify-end gap-2">
                                Acoustic Setup <Volume2 className="w-3 h-3 text-stone-500" />
                            </h3>
                            <div className="flex flex-col gap-2">
                                {[0, 120, 600].map((sec) => (
                                    <button
                                        key={sec}
                                        onClick={(e) => { e.stopPropagation(); setBellInterval(sec); }}
                                        className={`py-2.5 px-3 rounded-xl text-[10px] font-bold tracking-widest transition-all text-right ${bellInterval === sec ? 'bg-amber-500/20 text-amber-300 border border-amber-500/20' : 'text-stone-500 hover:bg-white/5 border border-transparent'}`}
                                    >
                                        {sec === 0 ? 'START/END ONLY' : sec === 120 ? '2 MIN CHIME' : '10 MIN CHIME'}
                                    </button>
                                ))}
                                {(luminaLevel >= 30) && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setBellInterval(240); }}
                                        className={`mt-2 py-2 px-3 rounded-xl text-[10px] font-bold tracking-widest transition-all text-right ${bellInterval === 240 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' : 'text-emerald-500/40 hover:bg-white/5 border border-transparent'}`}
                                    >
                                        ASCENDANT CHIMES
                                    </button>
                                )}
                            </div>
                        </div>

                        {!isActive && (
                            <div className="flex flex-col gap-2 w-64 bg-stone-900/80 p-4 border border-white/5 rounded-2xl backdrop-blur-xl">
                                <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest text-right mb-2">Duration</span>
                                <div className="flex flex-wrap justify-end gap-2">
                                    {[5, 10, 15, 20, 25].map(m => (
                                        <button key={m} onClick={(e) => { e.stopPropagation(); setTime(m); }} className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest border transition-all ${timeLeft === m * 60 ? 'bg-amber-500/20 border-amber-500/50 text-amber-200' : 'bg-black/40 border-white/5 hover:bg-white/10 text-stone-400'}`}>
                                            {m}M
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Center: The Minimalist Candle */}
                    <div className="relative group cursor-pointer flex flex-col items-center" onClick={toggleTimer}>
                        <div className="mb-6 text-5xl font-light text-stone-300 tracking-widest font-variant-numeric tabular-nums opacity-90 drop-shadow-2xl">
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </div>

                        <div className={`w-56 h-56 md:w-72 md:h-72 rounded-full flex flex-col items-center justify-center relative transition-all duration-1000 shrink-0 ${isActive ? 'scale-105 shadow-[0_0_120px_rgba(245,158,11,0.1)]' : 'opacity-80'}`}>
                            {timerMode === 'candle' ? (
                                <div className="absolute inset-0 flex items-center justify-center -mt-8 scale-[1.15]">
                                    <div className={`absolute -top-10 -left-10 right-0 bottom-0 bg-orange-500/5 rounded-full blur-[80px] transition-all duration-3000 ${isActive ? 'opacity-100 scale-110' : 'opacity-0 scale-90'}`}></div>
                                    <div className="relative group flex flex-col items-center">
                                        <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-6 h-28 origin-bottom transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                                            <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full animate-pulse-slow"></div>
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3.5 h-12 bg-gradient-to-t from-orange-600 via-yellow-400 to-white rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] animate-flicker transform-gpu shadow-sm">
                                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-blue-600/90 rounded-full blur-[1px]"></div>
                                            </div>
                                        </div>
                                        <div className="w-16 h-20 md:w-20 md:h-24 bg-gradient-to-r from-stone-800 via-stone-700 to-stone-800 rounded-lg relative overflow-hidden shadow-2xl border-t border-stone-600/50 mt-16">
                                            <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-stone-600 to-stone-800 rounded-[100%] blur-[0.5px]"></div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-2 animate-in fade-in">
                                    <span className="block text-4xl md:text-5xl opacity-90">{isActive ? "Inhale" : "Ready"}</span>
                                    <p className="text-amber-500/70 text-[10px] md:text-xs tracking-widest uppercase font-bold">Tap to {isActive ? "Stop" : "Begin"}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Koan & Mobile Control overrides */}
                    <div className="w-full md:w-64 flex flex-col gap-4 items-center md:items-start z-20 order-first md:order-last mb-8 md:mb-0">
                        <div className="bg-stone-900/80 border border-white/5 p-4 md:p-6 rounded-3xl backdrop-blur-xl w-full text-center md:text-left shadow-2xl">
                            <h3 className="text-[10px] font-bold text-stone-500 tracking-widest uppercase mb-3 flex items-center justify-center md:justify-start gap-2">
                                <BookOpen className="w-3 h-3 text-stone-400" /> Wisdom
                            </h3>
                            <p className="text-xs md:text-sm font-serif italic text-amber-100/90 leading-relaxed min-h-[100px] flex items-center justify-center md:justify-start">
                                {koan ? `"${koan}"` : "Silence speaks volumes when the mind is still."}
                            </p>
                            <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-4">
                                <button onClick={(e) => { e.stopPropagation(); setSoundEnabled(!soundEnabled); }} className={`p-1.5 rounded-full ${soundEnabled ? 'text-amber-400' : 'text-stone-500'}`}>
                                    {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); nextKoan(); }} className="text-[9px] uppercase tracking-widest font-bold text-amber-500 hover:text-amber-300 transition-colors">
                                    Next Koan &rarr;
                                </button>
                            </div>
                        </div>

                        {/* Mobile Specific Setting Dupes */}
                        {!isActive && (
                            <div className="md:hidden flex flex-wrap justify-center gap-2 mt-4 animate-in fade-in">
                                {[5, 10, 15, 20, 25].map(m => (
                                    <button key={m} onClick={(e) => { e.stopPropagation(); setTime(m); }} className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest border transition-all ${timeLeft === m * 60 ? 'bg-amber-500/20 border-amber-500/50 text-amber-200' : 'bg-black/40 border-white/10 hover:bg-white/10 text-stone-400'}`}>
                                        {m}M
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="md:hidden flex items-center justify-center mt-2 glass-panel bg-stone-900/60 p-2 rounded-full w-full max-w-[200px]">
                            <select className="bg-transparent text-[10px] uppercase font-bold text-stone-300 outline-none cursor-pointer w-full text-center" value={bellInterval} onChange={(e) => setBellInterval(Number(e.target.value))}>
                                <option value={0} className="bg-stone-900">Start/End</option>
                                <option value={120} className="bg-stone-900">2 Min Chime</option>
                                <option value={600} className="bg-stone-900">10 Min Chime</option>
                            </select>
                        </div>
                    </div>
                </div>

            </main>

            {/* Stats Footer - Simplified & Cozy */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-12 md:gap-24 w-full z-10 opacity-40 hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="flex flex-col items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-500 mb-0.5" />
                    <span className="text-xs font-black text-stone-300 tabular-nums">{streak}</span>
                    <span className="text-[7px] uppercase tracking-widest text-stone-500 font-bold">Streak</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <Target className="w-3 h-3 text-amber-500 mb-0.5" />
                    <span className="text-xs font-black text-stone-300 tabular-nums">{totalFocus}</span>
                    <span className="text-[7px] uppercase tracking-widest text-stone-500 font-bold">Total Mins</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <Trophy className="w-3 h-3 text-yellow-500 mb-0.5" />
                    <span className="text-xs font-black text-stone-300 tabular-nums">Lvl {Math.floor(totalFocus / 60) + 1}</span>
                    <span className="text-[7px] uppercase tracking-widest text-stone-500 font-bold">Rank</span>
                </div>
            </div>

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
