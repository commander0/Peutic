import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Trophy, Timer, Sparkles } from 'lucide-react';
import { User } from '../types';
import { UserService } from '../services/userService';

const CosmicIcon = ({ type, className }: { type: number, className?: string }) => {
    const icons = [
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>,
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>,
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
    ];
    return icons[type % icons.length];
};

interface MindfulMatchGameProps {
    dashboardUser: User;
}

const MindfulMatchGame: React.FC<MindfulMatchGameProps> = ({ dashboardUser }) => {
    const [cards, setCards] = useState<any[]>([]);
    const [flipped, setFlipped] = useState<number[]>([]);
    const [solved, setSolved] = useState<number[]>([]);
    const [won, setWon] = useState(false);
    const [moves, setMoves] = useState(0);

    const [time, setTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const [bestScore, setBestScore] = useState(() => dashboardUser?.gameScores?.match || 0);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        initGame();
        return () => stopTimer();
    }, []);

    useEffect(() => {
        if (isPlaying && !won) {
            timerRef.current = window.setInterval(() => setTime(t => t + 1), 1000);
        } else stopTimer();
        return () => stopTimer();
    }, [isPlaying, won]);

    const stopTimer = () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };

    const initGame = () => {
        const duplicated = [];
        for (let i = 0; i < 8; i++) {
            duplicated.push({ id: i * 2, type: i });
            duplicated.push({ id: i * 2 + 1, type: i });
        }

        setCards(duplicated.sort(() => Math.random() - 0.5).map((card, i) => ({ ...card, index: i })));
        setFlipped([]);
        setSolved([]);
        setWon(false);
        setMoves(0);
        setTime(0);
        setIsPlaying(true);
    };

    const handleCardClick = (index: number) => {
        if (flipped.length === 2 || solved.includes(index) || flipped.includes(index) || !isPlaying) return;

        const newFlipped = [...flipped, index];
        setFlipped(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            if (cards[newFlipped[0]].type === cards[newFlipped[1]].type) {
                setSolved([...solved, newFlipped[0], newFlipped[1]]);
                setFlipped([]);
            } else {
                setTimeout(() => setFlipped([]), 1000);
            }
        }
    };

    useEffect(() => {
        if (cards.length > 0 && solved.length === cards.length) {
            setWon(true);
            setIsPlaying(false);
            stopTimer();
            if (bestScore === 0 || time < bestScore) {
                setBestScore(time);
                if (dashboardUser && dashboardUser.id) {
                    UserService.updateGameScore(dashboardUser.id, 'match', time);
                }
            }
        }
    }, [solved]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 w-full h-full flex flex-col rounded-2xl p-4 border border-indigo-500/20 overflow-hidden relative shadow-inner items-center justify-center">
            <div className="absolute top-3 left-4 z-20 flex gap-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-indigo-100 border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                    <Timer className="w-3 h-3 text-indigo-300" />
                    {formatTime(time)}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-indigo-100 border border-white/10">
                    Moves: {moves}
                </div>
                {bestScore > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-amber-300 border border-amber-300/30">
                        <Trophy className="w-3 h-3" /> {formatTime(bestScore)}
                    </span>
                )}
            </div>

            <button onClick={initGame} className="absolute top-3 right-3 p-2 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full transition-colors z-20 border border-white/10 group">
                <RefreshCw className="w-4 h-4 text-indigo-300 group-hover:text-white group-hover:rotate-180 transition-all duration-500" />
            </button>

            {won ? (
                <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in text-center p-6 relative z-10">
                    <Trophy className="w-24 h-24 text-amber-400 mb-8 drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]" />
                    <h2 className="font-black text-4xl text-white mb-3">Harmony Achieved</h2>
                    <div className="flex gap-4 mb-8">
                        <div className="bg-white/5 backdrop-blur-lg px-8 py-5 rounded-2xl border border-white/10 flex flex-col items-center">
                            <p className="text-[10px] text-indigo-300 uppercase font-black mb-2">Time Flow</p>
                            <p className="text-4xl font-black text-white">{formatTime(time)}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-lg px-8 py-5 rounded-2xl border border-white/10 flex flex-col items-center">
                            <p className="text-[10px] text-indigo-300 uppercase font-black mb-2">Actions</p>
                            <p className="text-4xl font-black text-white">{moves}</p>
                        </div>
                    </div>
                    <button onClick={initGame} className="bg-white text-indigo-950 px-10 py-4 rounded-full font-black text-sm uppercase flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Go Again
                    </button>
                </div>
            ) : (
                <div className="w-full h-full max-w-3xl aspect-[4/3] grid grid-cols-4 grid-rows-4 gap-2 sm:gap-4 p-2 relative z-10 mt-10">
                    {cards.map((card, i) => {
                        const isFlipped = flipped.includes(i);
                        const isMatched = solved.includes(i);
                        const isVisible = isFlipped || isMatched;

                        let cardInnerClasses = 'bg-slate-800/80 border border-white/5 shadow-lg';
                        let iconColor = 'text-indigo-400/50';

                        if (isVisible) {
                            cardInnerClasses = 'bg-indigo-900/40 border border-indigo-400/50 shadow-[0_0_20px_rgba(99,102,241,0.3)] rotate-y-180';
                            iconColor = 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]';
                        }
                        if (isMatched) {
                            cardInnerClasses = 'bg-amber-500/20 border border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.3)] rotate-y-180 scale-95 opacity-60';
                            iconColor = 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]';
                        }

                        return (
                            <div key={i} className="perspective-1000 w-full h-full">
                                <button
                                    onClick={() => handleCardClick(i)}
                                    className={`w-full h-full rounded-2xl flex items-center justify-center transition-all duration-500 transform-style-3d overflow-hidden ${cardInnerClasses} relative group`}
                                >
                                    {isVisible ? (
                                        <CosmicIcon type={card.type} className={`w-8 h-8 md:w-14 md:h-14 ${iconColor}`} />
                                    ) : (
                                        <div className="w-3 h-3 md:w-4 md:h-4 bg-indigo-500/50 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] group-hover:scale-150 transition-transform"></div>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MindfulMatchGame;
