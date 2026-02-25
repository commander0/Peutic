import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Trophy, Timer, Snowflake, Sparkles } from 'lucide-react';
import { User } from '../types';
import { UserService } from '../services/userService';
import ArcadeAudio from '../services/arcadeAudio';

// --- Thematic Icons Set (Cosmic / Zen) ---
const CosmicIcon = ({ type, className }: { type: number, className?: string }) => {
    const icons = [
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>, // Sun
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>, // Moon
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>, // Star
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>, // Planet/Rings
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>, // Globe/Nexus
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>, // Infinity/Flow
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>, // Energy
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg> // Smile/Zen
    ];
    return icons[type % icons.length];
};

// --- Game Logic ---
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

    // VFX States
    const [particles, setParticles] = useState<any[]>([]);
    const [floatTexts, setFloatTexts] = useState<any[]>([]);

    const [bestScore, setBestScore] = useState(() => {
        return dashboardUser?.gameScores?.match || 0;
    });

    const timerRef = useRef<number | null>(null);

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
        // Create 8 pairs = 16 cards total
        const duplicated = [];
        for (let i = 0; i < 8; i++) {
            duplicated.push({ id: i * 2, type: i });
            duplicated.push({ id: i * 2 + 1, type: i });
        }

        // Shuffle & Apply Frozen status randomly (20% chance to freeze a pair)
        const pairStatus: Record<number, boolean> = {};
        for (let i = 0; i < 8; i++) pairStatus[i] = Math.random() < 0.2;

        const shuffled = duplicated.sort(() => Math.random() - 0.5).map((card, i) => ({
            ...card,
            index: i,
            isFrozen: pairStatus[card.type],
            thawLevel: pairStatus[card.type] ? 1 : 0
        }));

        setCards(shuffled);
        setFlipped([]);
        setSolved([]);
        setWon(false);
        setMoves(0);
        setCombo(0);
        setTime(0);
        setParticles([]);
        setFloatTexts([]);

        setIsPlaying(false);
        setMemorizing(true);

        setTimeout(() => {
            setMemorizing(false);
            setIsPlaying(true);
        }, 2000);
    };

    const handleCardClick = (index: number) => {
        if (flipped.length === 2 || solved.includes(index) || flipped.includes(index) || !isPlaying) return;

        const clickedCard = cards[index];

        // Mechanics: Thaw Frozen cards
        if (clickedCard.thawLevel > 0) {
            // Unfreeze visually and play a sound conceptually
            const newCards = [...cards];
            newCards[index] = { ...clickedCard, thawLevel: clickedCard.thawLevel - 1 };
            setCards(newCards);

            // Spawn some ice shatter particles
            spawnParticles(index, '#bae6fd', 3);
            ArcadeAudio.playSlice(); // Play sound for thawing
            return;
        }

        const newFlipped = [...flipped, index];
        setFlipped(newFlipped);
        ArcadeAudio.playJump(); // Play sound for flipping a card

        if (newFlipped.length === 2) {
            setMoves(m => m + 1);

            const card1 = cards[newFlipped[0]];
            const card2 = cards[newFlipped[1]];

            if (card1.type === card2.type) {
                setSolved([...solved, newFlipped[0], newFlipped[1]]);
                setFlipped([]);
                ArcadeAudio.playMatch(); // Play sound for a match

                // Burst Particles on Success
                spawnParticles(newFlipped[0], '#fbbf24', 8);
                spawnParticles(newFlipped[1], '#fbbf24', 8);

                setCombo(c => {
                    const newCombo = c + 1;
                    if (newCombo > 1) {
                        const timeBonus = newCombo * 2;
                        setTime(t => Math.max(0, t - timeBonus));
                        spawnFloatingText(`-${timeBonus}s`, newFlipped[1]);
                    }
                    return newCombo;
                });
            } else {
                setCombo(0);
                setTimeout(() => setFlipped([]), 1000); // 1s memorize window on fail
            }
        }
    };

    const spawnParticles = (cardIndex: number, color: string, count: number) => {
        const newParticles = [];
        for (let i = 0; i < count; i++) {
            newParticles.push({
                id: Math.random(),
                cardIndex,
                color,
                angle: Math.random() * Math.PI * 2,
                speed: 2 + Math.random() * 3,
            });
        }
        setParticles(prev => [...prev, ...newParticles]);
        setTimeout(() => {
            setParticles(prev => prev.filter(p => !newParticles.find(n => n.id === p.id)));
        }, 800);
    };

    const spawnFloatingText = (text: string, cardIndex: number) => {
        const id = Math.random();
        setFloatTexts(prev => [...prev, { id, text, cardIndex }]);
        setTimeout(() => {
            setFloatTexts(prev => prev.filter(f => f.id !== id));
        }, 1500);
    };

    useEffect(() => {
        if (cards.length > 0 && solved.length === cards.length) {
            setWon(true);
            setIsPlaying(false);
            stopTimer();
            ArcadeAudio.playCollect(); // Play win sound

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

            {/* Header / HUD */}
            <div className="absolute top-3 left-4 z-20 flex gap-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-indigo-100 border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                    <Timer className="w-3 h-3 text-indigo-300" />
                    {formatTime(time)}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-indigo-100 border border-white/10">
                    Moves: {moves}
                </div>
                {combo > 1 && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1.5 rounded-full border border-amber-300/50 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.6)]">
                        Combo x{combo}!
                    </div>
                )}
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
                    <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full"></div>
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-amber-400 blur-2xl opacity-30 animate-pulse"></div>
                        <Trophy className="w-24 h-24 text-amber-400 relative z-10 animate-bounce drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]" />
                    </div>

                    <h2 className="font-black text-4xl text-white mb-3 tracking-tight drop-shadow-lg">Harmony Achieved</h2>

                    <div className="flex gap-4 mb-8">
                        <div className="bg-white/5 backdrop-blur-lg px-8 py-5 rounded-2xl border border-white/10 flex flex-col items-center shadow-2xl">
                            <p className="text-[10px] text-indigo-300 uppercase tracking-[0.2em] font-black mb-2">Time Flow</p>
                            <p className="text-4xl font-black text-white font-variant-numeric tabular-nums drop-shadow-md">{formatTime(time)}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-lg px-8 py-5 rounded-2xl border border-white/10 flex flex-col items-center shadow-2xl">
                            <p className="text-[10px] text-indigo-300 uppercase tracking-[0.2em] font-black mb-2">Actions</p>
                            <p className="text-4xl font-black text-white font-variant-numeric tabular-nums drop-shadow-md">{moves}</p>
                        </div>
                    </div>

                    <button
                        onClick={initGame}
                        className="bg-white text-indigo-950 px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all flex items-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" /> Re-enter the Void
                    </button>
                </div>
            ) : (
                <div className="w-full h-full max-w-3xl aspect-[4/3] grid grid-cols-4 grid-rows-4 gap-2 sm:gap-4 p-2 relative z-10 mt-10">
                    {memorizing && (
                        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                            <div className="bg-indigo-900/80 backdrop-blur-md px-8 py-4 rounded-full shadow-[0_0_50px_rgba(99,102,241,0.5)] border border-indigo-400/30 animate-pulse">
                                <span className="font-black text-2xl tracking-[0.3em] text-indigo-200 uppercase">Focus</span>
                            </div>
                        </div>
                    )}

                    {/* Render Floating Texts */}
                    {floatTexts.map(f => {
                        const row = Math.floor(f.cardIndex / 4);
                        const col = f.cardIndex % 4;
                        return (
                            <div
                                key={f.id}
                                className="absolute pointer-events-none z-50 text-amber-300 font-black text-xl md:text-2xl drop-shadow-[0_0_10px_rgba(245,158,11,1)] animate-[floatUp_1.5s_ease-out_forwards]"
                                style={{
                                    left: `${(col * 25) + 12}%`,
                                    top: `${(row * 25) + 2}%`
                                }}
                            >
                                {f.text}
                            </div>
                        )
                    })}

                    {/* Render Particles */}
                    {particles.map(p => {
                        const row = Math.floor(p.cardIndex / 4);
                        const col = p.cardIndex % 4;
                        return (
                            <div
                                key={p.id}
                                className="absolute rounded-full pointer-events-none z-40 animate-[fadeScale_0.8s_ease-out_forwards]"
                                style={{
                                    width: '8px', height: '8px',
                                    backgroundColor: p.color,
                                    left: `calc(${(col * 25) + 12.5}% + ${Math.cos(p.angle) * p.speed * 10}px)`,
                                    top: `calc(${(row * 25) + 12.5}% + ${Math.sin(p.angle) * p.speed * 10}px)`,
                                    boxShadow: `0 0 10px ${p.color}`
                                }}
                            />
                        )
                    })}

                    {cards.map((card, i) => {
                        const isFlipped = flipped.includes(i);
                        const isMatched = solved.includes(i);
                        const isVisible = isFlipped || isMatched || memorizing;

                        // Dynamic rendering variables
                        let cardInnerClasses = 'bg-slate-800/80 backdrop-blur-sm border border-white/5 shadow-lg';
                        let iconColor = 'text-indigo-400/50';

                        if (isVisible) {
                            cardInnerClasses = 'bg-indigo-900/40 backdrop-blur-md border border-indigo-400/50 shadow-[0_0_20px_rgba(99,102,241,0.3)] rotate-y-180';
                            iconColor = 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]';
                        }
                        if (isMatched) {
                            cardInnerClasses = 'bg-amber-500/20 backdrop-blur-md border border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.3)] rotate-y-180 scale-95 opacity-60';
                            iconColor = 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]';
                        }
                        if (card.thawLevel > 0) {
                            // Ice layer styling
                            cardInnerClasses = 'bg-sky-900/60 backdrop-blur-sm border-2 border-sky-300/60 shadow-[inset_0_0_20px_rgba(125,211,252,0.4)]';
                        }

                        return (
                            <div key={i} className="perspective-1000 w-full h-full">
                                <button
                                    onClick={() => handleCardClick(i)}
                                    className={`w-full h-full rounded-2xl flex items-center justify-center transition-all duration-500 transform-style-3d overflow-hidden ${cardInnerClasses} relative group`}
                                >
                                    {/* Intricate Back Pattern */}
                                    {!isVisible && card.thawLevel === 0 && (
                                        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden flex items-center justify-center">
                                            <div className="w-[150%] h-[150%] border-4 border-dashed border-indigo-300 rounded-full animate-[spin_30s_linear_infinite]" />
                                            <div className="absolute w-[80%] h-[80%] border-2 border-indigo-300 rounded-lg rotate-45" />
                                        </div>
                                    )}

                                    {isVisible ? (
                                        <CosmicIcon type={card.type} className={`w-8 h-8 md:w-14 md:h-14 ${iconColor} transition-all duration-300 group-hover:scale-110`} />
                                    ) : (
                                        card.thawLevel > 0 ? (
                                            <Snowflake className="w-6 h-6 md:w-10 md:h-10 text-sky-200 animate-[spin_10s_linear_infinite]" />
                                        ) : (
                                            <div className="w-3 h-3 md:w-4 md:h-4 bg-indigo-500/50 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] group-hover:scale-150 transition-transform"></div>
                                        )
                                    )}

                                    {/* Ice visual overlay */}
                                    {card.thawLevel > 0 && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
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
