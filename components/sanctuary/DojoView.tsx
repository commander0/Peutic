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
        <div className="fixed inset-0 h-[100dvh] z-[120] bg-stone-950 text-stone-100 flex flex-col font-serif animate-in fade-in duration-700 overflow-hidden">
            {/* Audio Elements bound to DOM for Autoplay Bypass */}
            <audio ref={windChimeRef} src="https://cdn.freesound.org/previews/411/411088_5121236-lq.mp3" loop preload="auto" />

            {/* Ambient Dust Motes */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="absolute w-1 h-1 bg-amber-100/30 rounded-full blur-[1px] animate-[sway-drop_15s_linear_infinite]"
                        style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s` }} />
                ))}
            </div>

            {/* Header */}
            <header className="relative z-30 px-6 py-5 flex justify-between items-center bg-gradient-to-b from-stone-950 to-transparent">
                <div className="flex items-center gap-3">
                    <Wind className="w-5 h-5 text-stone-400" />
                    <span className="text-lg tracking-widest uppercase text-stone-300">Zen Dojo</span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowShop(true)} className="px-3 py-1.5 bg-stone-800 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-stone-700 transition-all text-stone-300 shadow-lg">
                        Decorate
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-stone-400 hover:text-white shadow-lg bg-stone-900/50">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative z-20 pb-12 md:pb-8 w-full max-w-5xl mx-auto px-4">
                
                {/* --- THE VINTAGE ZEN WINDOW --- */}
                <div className="relative w-full max-w-3xl aspect-[4/3] md:aspect-[16/9] border-t-[14px] border-b-[24px] border-x-[16px] md:border-t-[18px] md:border-b-[32px] md:border-x-[20px] border-[#1e1511] rounded-sm shadow-[0_40px_80px_rgba(0,0,0,0.8)] bg-[#030614] overflow-hidden shrink-0 flex flex-col justify-end ring-1 ring-black/50">
                    
                    {/* The Background Sky & Mountains */}
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-[#1e293b] to-slate-900 z-0"></div>
                    
                    {/* Minimalist Mountains outline inside window */}
                    <div className="absolute bottom-0 w-[120%] h-48 bg-[#0a0f1b] blur-[1px] rounded-t-[100%] -ml-[10%] opacity-90 z-0"></div>
                    <div className="absolute bottom-[-10px] w-[80%] h-32 bg-[#05070d] blur-[0.5px] rounded-t-[100%] ml-[20%] z-0"></div>
                    
                    {/* Weather Rain simulation layer inside window */}
                    <div className="absolute inset-0 opacity-40 z-10 pointer-events-none mix-blend-screen overflow-hidden">
                        <div className="w-full h-[200%] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-[sway-drop_4s_linear_infinite]"></div>
                    </div>

                    {/* Window Shoji Panes */}
                    <div className="absolute inset-x-0 top-1/2 h-2 bg-[#1e1511] z-20 shadow-[0_4px_10px_rgba(0,0,0,0.5)]"></div>
                    <div className="absolute inset-y-0 left-1/3 w-2 bg-[#1e1511] z-20 shadow-[4px_0_10px_rgba(0,0,0,0.5)]"></div>
                    <div className="absolute inset-y-0 left-2/3 w-2 bg-[#1e1511] z-20 shadow-[4px_0_10px_rgba(0,0,0,0.5)]"></div>

                    {/* Relaxing Dojo Pet - Floating near window sill */}
                    {luminaPet && <RelaxingDojoPet pet={luminaPet} />}
                    
                    {/* Decor items dynamically positioned inside window / sill */}
                    <div className="absolute inset-0 pointer-events-none z-30">
                        {localUser.unlockedDecor?.map(itemId => {
                            const itemData = SANCTUARY_ITEMS.find(i => i.id === itemId);
                            if (!itemData) return null;
                            const getPositionClass = (id: string) => {
                                switch (id) {
                                    case 'lantern': return 'top-[-5px] left-[10%] text-5xl md:text-6xl opacity-90 animate-[sway_6s_ease-in-out_infinite] drop-shadow-xl saturate-150';
                                    case 'scroll': return 'top-4 left-1/2 -translate-x-1/2 text-[4rem] md:text-[5rem] opacity-30 drop-shadow-xl saturate-50 -z-10 mix-blend-color-dodge';
                                    case 'bonsai': return 'bottom-[-5px] right-[5%] text-[5rem] md:text-[7rem] drop-shadow-[0_15px_15px_rgba(0,0,0,0.9)] pointer-events-auto hover:scale-105 transition-transform origin-bottom';
                                    case 'incense': return 'bottom-[2%] right-[25%] md:right-[30%] text-[3.5rem] md:text-[4.5rem] animate-[sway_4s_ease-in-out_infinite] drop-shadow-xl pointer-events-auto saturate-150 origin-bottom';
                                    case 'singing_bowl': return 'bottom-[1%] left-[8%] md:left-[12%] text-[3rem] md:text-[4rem] drop-shadow-xl pointer-events-auto cursor-pointer active:scale-90 hover:scale-110 transition-transform origin-bottom';
                                    case 'stones': return 'bottom-[-2%] left-[25%] text-[2.5rem] md:text-[3.5rem] drop-shadow-md origin-bottom';
                                    default: return 'hidden';
                                }
                            };
                            return (
                                <div key={itemId} onClick={itemId === 'singing_bowl' ? () => { playBellSound(); setBowlRipple(true); setTimeout(() => setBowlRipple(false), 2000); } : undefined} className={`absolute flex items-end justify-center ${getPositionClass(itemId)}`}>
                                    {itemData.icon}
                                    {itemId === 'singing_bowl' && bowlRipple && <div className="absolute -inset-10 bg-amber-500/40 rounded-full blur-2xl scale-[2] animate-[ping_2s_ease-out_forwards] pointer-events-none" />}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* --- Lower Controls Layer --- */}
                <div className="w-full max-w-3xl mt-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 px-2">
                    
                    {/* Left Settings Panel */}
                    <div className="flex flex-col gap-5 text-center md:text-left flex-1">
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 drop-shadow-md">Duration</span>
                            <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                {[5, 10, 15, 20, 25].map(m => (
                                    <button key={m} onClick={() => setTime(m)} disabled={isActive} className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest border transition-all ${timeLeft === m * 60 && !isActive ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-stone-900 border-stone-800 hover:bg-stone-800 text-stone-400 disabled:opacity-30'}`}>
                                        {m}M
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 relative z-50">
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 drop-shadow-md">Bell Interval</span>
                            <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                {[0, 120, 600].map((sec) => (
                                    <button
                                        key={sec}
                                        onClick={() => setBellInterval(sec)}
                                        className={`px-3 py-1.5 rounded-full text-[9px] font-bold tracking-widest border transition-all ${bellInterval === sec ? 'bg-stone-800 text-stone-200 border-stone-600 shadow-md' : 'bg-transparent text-stone-500 border-stone-800/80 hover:bg-stone-800'}`}
                                    >
                                        {sec === 0 ? 'START/END ONLY' : sec === 120 ? '2 MIN CHIME' : '10 MIN CHIME'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Center Meditation Timer */}
                    <div className="flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform active:scale-95 px-4 shrink-0" onClick={toggleTimer}>
                        <div className="relative group">
                            {isActive && <div className="absolute inset-0 bg-amber-500/10 blur-3xl rounded-full scale-150 animate-pulse pointer-events-none"></div>}
                            <div className={`text-6xl md:text-[5rem] font-light tracking-wider font-variant-numeric tabular-nums drop-shadow-2xl transition-colors duration-1000 ${isActive ? 'text-amber-100 drop-shadow-[0_0_30px_rgba(245,158,11,0.6)]' : 'text-stone-300'}`}>
                                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                            </div>
                        </div>
                        <div className={`mt-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-amber-400 animate-pulse' : 'text-stone-500'}`}>
                            {isActive ? (timerMode === 'break' ? 'Resting...' : 'Meditating...') : 'Tap to Start'}
                        </div>
                    </div>

                    {/* Right Koan Panel */}
                    <div className="w-full md:w-64 bg-stone-900/60 border border-stone-800/80 p-5 rounded-2xl flex flex-col gap-3 shadow-xl backdrop-blur-md flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[9px] font-bold text-stone-500 tracking-widest uppercase flex items-center gap-2">
                                <BookOpen className="w-3 h-3 text-stone-400" /> Wisdom
                            </h3>
                            <button onClick={(e) => { e.stopPropagation(); setSoundEnabled(!soundEnabled); }} className={`p-1 rounded-full transition-colors ${soundEnabled ? 'text-amber-400 hover:text-amber-300' : 'text-stone-600 hover:text-stone-500'}`}>
                                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-xs md:text-sm font-serif italic text-stone-300 leading-relaxed min-h-[60px] flex items-center">
                            {koan ? `"${koan}"` : "Silence speaks volumes when the mind is still."}
                        </p>
                        <button onClick={(e) => { e.stopPropagation(); nextKoan(); }} className="self-end text-[9px] uppercase tracking-widest font-bold text-amber-600 hover:text-amber-500 transition-colors mt-2">
                            Next Koan &rarr;
                        </button>
                    </div>

                </div>

                {/* Footer Stats Row aligned with the bottom */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-12 w-full z-10 opacity-60 hover:opacity-100 transition-opacity duration-500 pointer-events-none hidden md:flex">
                    <div className="flex flex-col items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500 mb-0.5 drop-shadow-md" />
                        <span className="text-xs font-black text-stone-300 tabular-nums">{streak}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Target className="w-3 h-3 text-amber-500 mb-0.5 drop-shadow-md" />
                        <span className="text-xs font-black text-stone-300 tabular-nums">{totalFocus}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Trophy className="w-3 h-3 text-yellow-500 mb-0.5 drop-shadow-md" />
                        <span className="text-xs font-black text-stone-300 tabular-nums">Lvl {Math.floor(totalFocus / 60) + 1}</span>
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
