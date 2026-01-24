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
        <div className="w-full h-full rounded-3xl overflow-hidden relative shadow-2xl bg-[#0F172A] border border-white/10 flex flex-col">
            {/* Ambient Lighting */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-indigo-500/10 to-transparent opacity-50 pointer-events-none"></div>

            <div className="relative z-20 flex justify-between items-center p-4 bg-white/5 backdrop-blur-md border-b border-white/5">
                <div className="flex gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]">Moves: {moves}</span>
                    {bestScore > 0 && <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]">Best: {bestScore}</span>}
                </div>
                <button onClick={initGame} className="p-2 hover:bg-white/10 rounded-full transition-colors group"><RefreshCw className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:rotate-180 transition-all duration-500" /></button>
            </div>

            <div className="flex-1 p-4 relative">
                {won ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center animate-in zoom-in duration-500 z-30 bg-black/60 backdrop-blur-lg">
                        <div className="relative">
                            <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-20 animate-pulse"></div>
                            <Trophy className="w-24 h-24 text-yellow-400 mb-6 drop-shadow-[0_0_25px_rgba(250,204,21,0.6)] animate-bounce" />
                        </div>
                        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 uppercase tracking-widest mb-2 drop-shadow-lg">Divine Focus</h2>
                        <p className="text-sm font-bold text-gray-400 mb-8 tracking-widest uppercase">Patterns Harmonized in {moves} Moves</p>
                        <button onClick={initGame} className="px-10 py-4 bg-white text-black font-black text-sm uppercase tracking-[0.2em] rounded-full hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all">Reincarnate</button>
                    </div>
                ) : (
                    <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-2 md:gap-3 perspective-1000">
                        {cards.map((card, i) => {
                            const isFlipped = flipped.includes(i) || solved.includes(i);
                            const isSolved = solved.includes(i);
                            const Icon = card.icon;

                            return (
                                <div key={i} className="relative w-full h-full group preserve-3d" style={{ perspective: '1000px' }}>
                                    <button
                                        onClick={() => handleCardClick(i)}
                                        className={`w-full h-full relative transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''} ${isSolved ? 'opacity-50 blur-[1px] scale-95' : 'hover:scale-[1.02]'}`}
                                    >
                                        {/* Card Back */}
                                        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl border border-white/10 shadow-lg flex items-center justify-center overflow-hidden">
                                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] hover:opacity-30 transition-opacity"></div>
                                            <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 group-hover:border-indigo-400/50 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all"></div>
                                        </div>

                                        {/* Card Front */}
                                        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                                            {isSolved && <div className="absolute inset-0 bg-green-500/20 shadow-[inset_0_0_20px_rgba(34,197,94,0.4)] animate-pulse"></div>}
                                            <Icon className={`w-8 h-8 md:w-10 md:h-10 ${isSolved ? 'text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'text-indigo-300 drop-shadow-[0_0_15px_rgba(165,180,252,0.6)]'} transition-all`} />
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MindfulMatchGame;
