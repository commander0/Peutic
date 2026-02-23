import React, { useState, useEffect, useRef } from 'react';
import { Sun, Heart, Music, Zap, Star, Anchor, Feather, Cloud, RefreshCw, Trophy, Timer } from 'lucide-react';
import { User } from '../types';
import { UserService } from '../services/userService';

interface MindfulMatchGameProps {
    dashboardUser: User;
}

const MindfulMatchGame: React.FC<MindfulMatchGameProps> = ({ dashboardUser }) => {
    const [cards, setCards] = useState<any[]>([]);
    const [flipped, setFlipped] = useState<number[]>([]);
    const [solved, setSolved] = useState<number[]>([]);
    const [won, setWon] = useState(false);
    const [moves, setMoves] = useState(0);
    const [combo, setCombo] = useState(0);
    const [memorizing, setMemorizing] = useState(false);

    const [time, setTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Best score (Lowest Time)
    const [bestScore, setBestScore] = useState(() => {
        return dashboardUser?.gameScores?.match || 0;
    });

    const timerRef = useRef<number | null>(null);

    const ICONS = [Sun, Heart, Music, Zap, Star, Anchor, Feather, Cloud];

    useEffect(() => {
        initGame();
        return () => stopTimer();
    }, []);

    useEffect(() => {
        if (isPlaying && !won) {
            timerRef.current = window.setInterval(() => {
                setTime(t => t + 1);
            }, 1000);
        } else {
            stopTimer();
        }
        return () => stopTimer();
    }, [isPlaying, won]);

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const initGame = () => {
        const duplicated = [...ICONS, ...ICONS];
        const shuffled = duplicated.sort(() => Math.random() - 0.5).map((icon, i) => ({ id: i, icon }));
        setCards(shuffled);
        setFlipped([]);
        setSolved([]);
        setWon(false);
        setMoves(0);
        setCombo(0);
        setTime(0);

        setIsPlaying(false);
        setMemorizing(true);

        setTimeout(() => {
            setMemorizing(false);
            setIsPlaying(true);
        }, 2000);
    };

    const handleCardClick = (index: number) => {
        if (flipped.length === 2 || solved.includes(index) || flipped.includes(index) || !isPlaying) return;

        const newFlipped = [...flipped, index];
        setFlipped(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(m => m + 1);

            const card1 = cards[newFlipped[0]];
            const card2 = cards[newFlipped[1]];

            if (card1.icon === card2.icon) {
                setSolved([...solved, newFlipped[0], newFlipped[1]]);
                setFlipped([]);
                setCombo(c => {
                    if (c >= 1) {
                        setTime(t => Math.max(0, t - 2)); // 2 second combo bonus!
                    }
                    return c + 1;
                });
            } else {
                setCombo(0);
                setTimeout(() => setFlipped([]), 1000);
            }
        }
    };

    useEffect(() => {
        if (cards.length > 0 && solved.length === cards.length) {
            setWon(true);
            setIsPlaying(false);
            stopTimer();

            // Save if it's the first score OR better (lower) than best
            if (bestScore === 0 || time < bestScore) {
                setBestScore(time);
                if (dashboardUser && dashboardUser.id) {
                    // Updating score with TIME (seconds)
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
        <div className="bg-gradient-to-br from-yellow-50/50 to-white dark:from-gray-800 dark:to-gray-900 w-full h-full flex flex-col rounded-2xl p-4 border border-yellow-100 dark:border-gray-700 overflow-hidden relative shadow-inner items-center justify-center">

            {/* Header / HUD */}
            <div className="absolute top-3 left-4 z-20 flex gap-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold bg-white/50 dark:bg-black/50 px-2.5 py-1 rounded-full text-gray-500 border border-gray-100 dark:border-gray-700">
                    <Timer className="w-3 h-3" />
                    {formatTime(time)}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold bg-white/50 dark:bg-black/50 px-2.5 py-1 rounded-full text-gray-500 border border-gray-100 dark:border-gray-700">
                    Moves: {moves}
                </div>
                {combo > 1 && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold bg-yellow-400 text-yellow-900 px-2.5 py-1 rounded-full border border-yellow-500 animate-pulse drop-shadow-sm">
                        Combo x{combo}!
                    </div>
                )}
                {bestScore > 0 && (
                    <span className="text-[10px] font-bold bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded-full text-yellow-700 dark:text-yellow-500 border border-yellow-200/50 dark:border-yellow-900/50">
                        Best: {formatTime(bestScore)}
                    </span>
                )}
            </div>

            <button onClick={initGame} className="absolute top-3 right-3 p-2 hover:bg-yellow-100 dark:hover:bg-gray-700 rounded-full transition-colors z-20">
                <RefreshCw className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </button>

            {won ? (
                <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in text-center p-6">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-20 animate-pulse"></div>
                        <Trophy className="w-20 h-20 text-yellow-500 relative z-10 animate-bounce" />
                    </div>

                    <h2 className="font-black text-3xl text-yellow-900 dark:text-white mb-2 tracking-tight">Match Complete!</h2>

                    <div className="flex gap-4">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 px-6 py-4 rounded-xl mb-8 border border-yellow-100 dark:border-yellow-900/30 flex flex-col items-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-1">Time</p>
                            <p className="text-3xl font-black text-yellow-600 dark:text-yellow-400 font-variant-numeric tabular-nums">{formatTime(time)}</p>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 px-6 py-4 rounded-xl mb-8 border border-yellow-100 dark:border-yellow-900/30 flex flex-col items-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-1">Moves</p>
                            <p className="text-3xl font-black text-yellow-600 dark:text-yellow-400 font-variant-numeric tabular-nums">{moves}</p>
                        </div>
                    </div>

                    <button
                        onClick={initGame}
                        className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-3 rounded-full font-bold text-sm hover:scale-105 hover:shadow-lg transition-all"
                    >
                        Play Again
                    </button>
                </div>
            ) : (
                <div className="w-full h-full max-w-2xl aspect-square grid grid-cols-4 grid-rows-4 gap-2 sm:gap-3 p-1 relative">
                    {memorizing && (
                        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                            <div className="bg-white/80 dark:bg-black/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-2xl animate-pulse">
                                <span className="font-black text-xl tracking-widest text-[#d4b886] uppercase">Memorize!</span>
                            </div>
                        </div>
                    )}
                    {cards.map((card, i) => {
                        const isFlipped = flipped.includes(i);
                        const isMatched = solved.includes(i);
                        const isVisible = isFlipped || isMatched || memorizing;
                        const Icon = card.icon;

                        let cardClasses = 'bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700'; // Default hidden
                        if (isFlipped && !isMatched) cardClasses = 'bg-white dark:bg-gray-700 border-2 border-yellow-400 rotate-y-180';
                        if (isMatched) cardClasses = 'bg-green-50 dark:bg-green-900/30 border-2 border-green-400 dark:border-green-500 rotate-y-180 scale-95 opacity-80';

                        return (
                            <div key={i} className="perspective-1000 w-full h-full">
                                <button
                                    onClick={() => handleCardClick(i)}
                                    className={`w-full h-full rounded-xl flex items-center justify-center transition-all duration-500 transform-style-3d shadow-sm ${cardClasses}`}
                                >
                                    {isVisible ? (
                                        <Icon className={`w-6 h-6 md:w-10 md:h-10 ${isMatched ? 'text-green-500' : 'text-yellow-500'} animate-in zoom-in`} />
                                    ) : (
                                        <div className="w-2 h-2 bg-gray-700/50 rounded-full"></div>
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
