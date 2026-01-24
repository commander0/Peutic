import React, { useState, useEffect } from 'react';
import { Sun, Heart, Music, Zap, Star, Anchor, Feather, Cloud, RefreshCw, Trophy } from 'lucide-react';
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
    const [bestScore, setBestScore] = useState(() => {
        return dashboardUser?.gameScores?.match || 0;
    });

    const ICONS = [Sun, Heart, Music, Zap, Star, Anchor, Feather, Cloud];

    useEffect(() => {
        initGame();
    }, []);

    const initGame = () => {
        const duplicated = [...ICONS, ...ICONS];
        const shuffled = duplicated.sort(() => Math.random() - 0.5).map((icon, i) => ({ id: i, icon }));
        setCards(shuffled);
        setFlipped([]);
        setSolved([]);
        setWon(false);
        setMoves(0);
    };

    const handleCardClick = (index: number) => {
        if (flipped.length === 2 || solved.includes(index) || flipped.includes(index)) return;
        const newFlipped = [...flipped, index];
        setFlipped(newFlipped);
        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            const card1 = cards[newFlipped[0]];
            const card2 = cards[newFlipped[1]];
            if (card1.icon === card2.icon) {
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
            if (bestScore === 0 || moves < bestScore) {
                setBestScore(moves);
                if (dashboardUser && dashboardUser.id) {
                    UserService.updateGameScore(dashboardUser.id, 'match', moves);
                }
            }
        }
    }, [solved]);

    return (
        <div className="w-full h-full rounded-3xl overflow-hidden relative shadow-2xl bg-slate-950 border border-indigo-500/20 flex flex-col">
            <div className="relative z-20 flex justify-between items-center p-4 bg-black/40 backdrop-blur-md border-b border-white/5">
                <div className="flex gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">Moves: {moves}</span>
                    {bestScore > 0 && <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20">Best: {bestScore}</span>}
                </div>
                <button onClick={initGame} className="p-2 hover:bg-white/5 rounded-full transition-colors group"><RefreshCw className="w-4 h-4 text-gray-400 group-hover:rotate-180 transition-all duration-500" /></button>
            </div>

            <div className="flex-1 p-4 relative bg-black/20">
                {won ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center animate-in zoom-in duration-300 z-30 bg-slate-950/90 backdrop-blur-md">
                        <Trophy className="w-16 h-16 text-yellow-400 mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-1">Matched!</h2>
                        <p className="text-xs font-bold text-indigo-400 mb-6 tracking-widest uppercase">Completed in {moves} Moves</p>
                        <button onClick={initGame} className="px-8 py-3 bg-indigo-600 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-full hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)]">Play Again</button>
                    </div>
                ) : (
                    <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-2 md:gap-3 perspective-1000">
                        {cards.map((card, i) => {
                            const isFlipped = flipped.includes(i) || solved.includes(i);
                            const isSolved = solved.includes(i);
                            const Icon = card.icon;

                            return (
                                <div key={i} className="relative w-full h-full group">
                                    <button
                                        onClick={() => handleCardClick(i)}
                                        className={`w-full h-full relative transition-all duration-300 transform ${isFlipped ? 'rotate-y-180' : ''} ${isSolved ? 'opacity-0 scale-90' : 'hover:scale-[1.02]'}`}
                                    >
                                        <div className={`absolute inset-0 rounded-xl flex items-center justify-center shadow-lg transition-all ${isFlipped ? 'bg-slate-900 border-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-slate-900/50 border border-white/10 hover:border-indigo-500/50'}`}>
                                            {isFlipped ? (
                                                <Icon className="w-8 h-8 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.6)]" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30"></div>
                                            )}
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div >
    );
};

export default MindfulMatchGame;
