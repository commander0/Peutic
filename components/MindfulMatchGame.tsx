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
        <div className="w-full h-full rounded-3xl overflow-hidden relative shadow-md bg-white border border-gray-100 flex flex-col">
            <div className="relative z-20 flex justify-between items-center p-4 bg-gray-50 border-b border-gray-100">
                <div className="flex gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-lg">Moves: {moves}</span>
                    {bestScore > 0 && <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-lg">Best: {bestScore}</span>}
                </div>
                <button onClick={initGame} className="p-2 hover:bg-gray-100 rounded-full transition-colors group"><RefreshCw className="w-4 h-4 text-gray-400 group-hover:rotate-180 transition-all duration-500" /></button>
            </div>

            <div className="flex-1 p-4 relative bg-[#f8fafc]">
                {won ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center animate-in zoom-in duration-300 z-30 bg-white/90 backdrop-blur-sm">
                        <Trophy className="w-16 h-16 text-yellow-400 mb-4 animate-bounce" />
                        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-widest mb-1">Matched!</h2>
                        <p className="text-xs font-bold text-gray-400 mb-6 tracking-widest uppercase">Completed in {moves} Moves</p>
                        <button onClick={initGame} className="px-8 py-3 bg-indigo-500 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-full hover:bg-indigo-600 transition-all shadow-lg">Play Again</button>
                    </div>
                ) : (
                    <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-2 md:gap-3 perspective-1000">
                        {cards.map((card, i) => {
                            const isFlipped = flipped.includes(i) || solved.includes(i);
                            const isSolved = solved.includes(i);
                            const Icon = card.icon;

                            return (
                            return (
                                <div key={i} className="relative w-full h-full group">
                                    <button
                                        onClick={() => handleCardClick(i)}
                                        className={`w-full h-full relative transition-all duration-300 transform ${isFlipped ? 'rotate-y-180' : ''} ${isSolved ? 'opacity-0' : 'hover:scale-[1.02]'}`}
                                    >
                                        {/* Card Content Logic via CSS/State is simpler here since we removed 3d preserve for cleaner look in "Reverted" state or just keep basic flipping */}
                                        <div className={`absolute inset-0 rounded-xl flex items-center justify-center shadow-sm transition-all ${isFlipped ? 'bg-white border-2 border-indigo-100' : 'bg-indigo-50 border border-indigo-100'}`}>
                                            {isFlipped ? (
                                                <Icon className="w-8 h-8 text-indigo-500" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-indigo-200/50"></div>
                                            )}
                                        </div>
                                    </button>
                                </div>
                            );
                            );
                        })}
                    </div>
                )}
            </div>
        </div >
    );
};

export default MindfulMatchGame;
