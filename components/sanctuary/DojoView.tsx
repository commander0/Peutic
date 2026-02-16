import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, Play, Pause, RotateCcw, Target, Flame, Trophy, Wind, BookOpen, Volume2, VolumeX } from 'lucide-react';
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
    const [timerMode, setTimerMode] = useState<'focus' | 'break' | 'candle'>('focus');
    const [streak, setStreak] = useState(0);
    const [totalFocus, setTotalFocus] = useState(0);
    const [breathMode, setBreathMode] = useState<'none' | '4-7-8' | 'box'>('none');
    const [koan, setKoan] = useState<string | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(false);
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

    // Initial Load
    useEffect(() => {
        const loadHistory = async () => {
            const history = await SanctuaryService.getFocusHistory(user.id);
            // Simple streak logic: number of sessions today (mocked by history count for now)
            setStreak(history.length);
            const minutes = history.reduce((acc, curr) => acc + (curr.durationSeconds / 60), 0);
            setTotalFocus(Math.floor(minutes));
        };
        loadHistory();
        bellRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1126/1126-preview.mp3'); // Tibertan Bowl
    }, [user.id]);

    // Format time mm:ss
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => {
        if (!isActive && soundEnabled && bellRef.current) bellRef.current.play().catch(() => { });
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(timerMode === 'focus' || timerMode === 'candle' ? 25 * 60 : 5 * 60);
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
        if (soundEnabled && bellRef.current) bellRef.current.play().catch(() => { });

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
            setTimerMode('focus');
            setTimeLeft(25 * 60);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] bg-stone-950 text-amber-50 flex flex-col animate-in fade-in duration-700 overflow-hidden font-sans">
            {/* DOJO ATMOSPHERE */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/washi.png')] opacity-10 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-stone-900 via-stone-950 to-black pointer-events-none"></div>

            {/* HEADER */}
            <header className="relative z-10 px-6 py-6 flex justify-between items-center bg-stone-900/50 backdrop-blur-md border-b border-amber-900/20">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-amber-500/80 hover:text-amber-400">
                        <X className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-[0.2em] flex items-center gap-2 text-amber-100">
                            <Zap className="w-5 h-5 text-amber-500" /> Zen Dojo
                        </h2>
                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Mastery & Focus</p>
                    </div>
                </div>
                <div className="flex bg-stone-900 rounded-lg p-1 border border-stone-800">
                    <button onClick={() => { setTimerMode('focus'); resetTimer(); }} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${timerMode === 'focus' ? 'bg-amber-500 text-stone-950' : 'text-stone-500 hover:text-stone-300'}`}>Timer</button>
                    <button onClick={() => { setTimerMode('candle'); resetTimer(); }} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${timerMode === 'candle' ? 'bg-amber-500 text-stone-950' : 'text-stone-500 hover:text-stone-300'}`}>Candle</button>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">

                {/* VISUALIZER */}
                <div className="relative mb-12 group">
                    <div className={`absolute -inset-4 rounded-full blur-3xl transition-all duration-1000 ${isActive ? 'bg-amber-500/10 scale-110' : 'bg-transparent scale-100'}`}></div>

                    <div className="w-72 h-72 md:w-96 md:h-96 rounded-full border border-stone-800 flex items-center justify-center relative bg-stone-900/30 backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.5)]">

                        {timerMode === 'candle' ? (
                            <div className="flex flex-col items-center animate-in fade-in duration-1000 scale-125 md:scale-150 relative">
                                {/* Ambient Warmth Glow */}
                                <div className={`absolute -top-20 -left-20 right-0 bottom-0 bg-orange-500/5 rounded-full blur-[100px] transition-all duration-3000 ${isActive ? 'opacity-100 scale-110' : 'opacity-20 scale-90'}`}></div>

                                {/* Candle Complex */}
                                <div className="relative group">
                                    {/* Flame Container */}
                                    <div className={`relative w-8 h-32 -mt-16 origin-bottom transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                                        {/* Outer Orange/Red Glow */}
                                        <div className="absolute inset-0 bg-orange-500/40 blur-2xl rounded-full animate-pulse-slow"></div>

                                        {/* Main Flame Shape */}
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-4 h-14 bg-gradient-to-t from-orange-600 via-yellow-400 to-white rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] shadow-[0_0_20px_rgba(255,165,0,0.6)] animate-flicker transform-gpu">
                                            {/* Blue Core */}
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-blue-600/80 rounded-full blur-[1px]"></div>
                                        </div>

                                        {/* Sparkles/Embers */}
                                        {isActive && (
                                            <>
                                                <div className="absolute top-0 left-1/2 w-0.5 h-0.5 bg-yellow-100 shadow-[0_0_5px_white] animate-ember-fly-1"></div>
                                                <div className="absolute top-4 left-1/2 w-0.5 h-0.5 bg-orange-100 shadow-[0_0_5px_white] animate-ember-fly-2"></div>
                                            </>
                                        )}
                                    </div>

                                    {/* Candle Body - Realistic Wax */}
                                    <div className="w-24 h-32 bg-gradient-to-r from-stone-800 via-stone-700 to-stone-800 rounded-lg relative overflow-hidden shadow-2xl border-t border-stone-600/50">
                                        {/* Wax Pool Top */}
                                        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-stone-600 to-stone-800 rounded-[100%] blur-[2px] opacity-80"></div>
                                        <div className="absolute inset-x-4 top-2 h-4 bg-yellow-900/40 rounded-[100%] blur-sm opacity-60 animate-pulse"></div>

                                        {/* Drips */}
                                        <div className="absolute top-4 left-4 w-2 h-12 bg-stone-700/60 rounded-full blur-[1px] shadow-sm"></div>
                                        <div className="absolute top-6 right-6 w-1.5 h-8 bg-stone-700/60 rounded-full blur-[1px] shadow-sm"></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                                <circle cx="50%" cy="50%" r="48%" fill="none" stroke="#292524" strokeWidth="2" />
                                <circle
                                    cx="50%" cy="50%" r="48%"
                                    fill="none" stroke="#d97706" strokeWidth="2"
                                    strokeDasharray="300%"
                                    strokeDashoffset={`${300 * (1 - timeLeft / (timerMode === 'focus' ? 1500 : 300))}%`}
                                    className="transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(217,119,6,0.5)]"
                                    strokeLinecap="round"
                                />
                            </svg>
                        )}

                        <div className={`text-center z-10 ${timerMode === 'candle' ? 'absolute bottom-10' : ''}`}>
                            {timerMode !== 'candle' && <div className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-700 mb-4">{timerMode === 'focus' ? 'Focus Mode' : 'Rest & Recover'}</div>}
                            <div className={`font-black text-amber-50 font-mono tracking-tighter mb-6 ${timerMode === 'candle' ? 'text-4xl opacity-50' : 'text-7xl md:text-8xl'}`}>{formatTime(timeLeft)}</div>

                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={toggleTimer}
                                    className="w-16 h-16 rounded-full bg-amber-600 hover:bg-amber-500 text-stone-950 flex items-center justify-center transition-all hover:scale-110 shadow-[0_0_30px_rgba(217,119,6,0.3)]"
                                >
                                    {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                                </button>
                                <button
                                    onClick={resetTimer}
                                    className="w-12 h-12 rounded-full border border-stone-700 text-stone-500 hover:text-amber-500 hover:border-amber-500 flex items-center justify-center transition-all"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                    <button
                        onClick={() => setBreathMode(breathMode === 'none' ? '4-7-8' : (breathMode === '4-7-8' ? 'box' : 'none'))}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${breathMode !== 'none' ? 'bg-amber-900/30 text-amber-400 border border-amber-500/20 shadow-lg' : 'bg-stone-900/50 text-stone-500 border border-stone-800 hover:text-stone-300'}`}
                    >
                        <Wind className="w-4 h-4" />
                        {breathMode === 'none' ? 'Breathing: Off' : `Breathing: ${breathMode}`}
                    </button>

                    <button
                        onClick={nextKoan}
                        className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all bg-stone-900/50 text-stone-400 border border-stone-800 hover:text-amber-200 hover:border-amber-500/30"
                    >
                        <BookOpen className="w-4 h-4" />
                        Seek Wisdom
                    </button>

                    <button
                        onClick={() => {
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
                        <span className="text-[8px] uppercase tracking-widest text-stone-600 font-bold">Wisdom</span>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default DojoView;
