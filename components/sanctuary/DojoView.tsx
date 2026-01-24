import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, Play, Pause, RotateCcw, Target, Flame, Trophy } from 'lucide-react';
import { User } from '../../types';
import { useToast } from '../common/Toast';
import { UserService } from '../../services/userService';

interface DojoViewProps {
    user: User;
    onClose: () => void;
}

const DojoView: React.FC<DojoViewProps> = ({ user: _user, onClose }) => {
    const { showToast } = useToast();
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'focus' | 'break'>('focus');
    const [streak, setStreak] = useState(0);
    const timerRef = useRef<number | null>(null);

    // Format time mm:ss
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
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
        if (mode === 'focus') {
            await UserService.deductBalance(0, 'Focus Session Complete'); // XP Trigger
            showToast("Focus Session Complete! (+50 XP)", "success");
            setStreak(s => s + 1);
            setMode('break');
            setTimeLeft(5 * 60);
        } else {
            showToast("Break over. Back to the Dojo.", "info");
            setMode('focus');
            setTimeLeft(25 * 60);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] bg-stone-950 text-amber-50 flex flex-col animate-in fade-in duration-700 overflow-hidden">
            {/* DOJO ATMOSPHERE */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/washi.png')] opacity-10 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-amber-950/20 to-black pointer-events-none"></div>

            {/* HEADER */}
            <header className="relative z-10 px-6 py-6 flex justify-between items-center bg-stone-900/50 backdrop-blur-md border-b border-amber-900/30">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-amber-500">
                        <X className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-[0.2em] flex items-center gap-2 text-amber-100">
                            <Zap className="w-5 h-5 text-amber-500" /> Zen Dojo
                        </h2>
                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Mastery & Focus</p>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">

                {/* TIMER CIRCLE */}
                <div className="relative mb-12 group">
                    <div className={`absolute -inset-4 rounded-full blur-3xl transition-all duration-1000 ${isActive ? 'bg-amber-500/20 scale-110' : 'bg-transparent scale-100'}`}></div>

                    <div className="w-72 h-72 md:w-96 md:h-96 rounded-full border-8 border-stone-800 flex items-center justify-center relative bg-stone-900/80 backdrop-blur-xl shadow-2xl">
                        {/* Progress Ring */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                            <circle
                                cx="50%" cy="50%" r="48%"
                                fill="none" stroke="#44403c" strokeWidth="8"
                            />
                            <circle
                                cx="50%" cy="50%" r="48%"
                                fill="none" stroke="#f59e0b" strokeWidth="8"
                                strokeDasharray="300%"
                                strokeDashoffset={`${300 * (1 - timeLeft / (mode === 'focus' ? 1500 : 300))}%`}
                                className="transition-all duration-1000 ease-linear"
                                strokeLinecap="round"
                            />
                        </svg>

                        <div className="text-center z-10">
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600 mb-4">{mode === 'focus' ? 'Focus Mode' : 'Rest & Recover'}</div>
                            <div className="text-7xl md:text-8xl font-black text-amber-50 font-mono tracking-tighter mb-6">{formatTime(timeLeft)}</div>

                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={toggleTimer}
                                    className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center transition-all hover:scale-110 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
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

                {/* STATS ROW */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                    <div className="bg-stone-900/50 p-6 rounded-2xl border border-stone-800 flex flex-col items-center">
                        <Flame className="w-6 h-6 text-orange-500 mb-2" />
                        <span className="text-2xl font-black text-white">{streak}</span>
                        <span className="text-[9px] uppercase tracking-widest text-stone-500 font-bold">Session Streak</span>
                    </div>
                    <div className="bg-stone-900/50 p-6 rounded-2xl border border-stone-800 flex flex-col items-center">
                        <Target className="w-6 h-6 text-amber-500 mb-2" />
                        <span className="text-2xl font-black text-white">{Math.floor(streak * 25)}m</span>
                        <span className="text-[9px] uppercase tracking-widest text-stone-500 font-bold">Total Focus</span>
                    </div>
                    <div className="bg-stone-900/50 p-6 rounded-2xl border border-stone-800 flex flex-col items-center cursor-pointer hover:bg-stone-800 transition-colors">
                        <Trophy className="w-6 h-6 text-yellow-500 mb-2" />
                        <span className="text-xs font-black text-white mt-1 uppercase tracking-widest">Achievements</span>
                        <span className="text-[9px] uppercase tracking-widest text-stone-500 font-bold mt-1">View Hall</span>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default DojoView;
