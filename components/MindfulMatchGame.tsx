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
        <div className="bg-gradient-to-br from-yellow-50/50 to-white dark:from-gray-800 dark:to-gray-900 w-full h-full flex flex-col rounded-2xl p-4 border border-yellow-100 dark:border-gray-700 overflow-hidden relative shadow-inner items-center justify-center">
            <div className="absolute top-3 left-4 z-20 flex gap-2">
                <span className="text-[10px] font-bold bg-white/50 dark:bg-black/50 px-2 py-1 rounded-full text-gray-500">Moves: {moves}</span>
                {bestScore > 0 && <span className="text-[10px] font-bold bg-yellow-100 dark:bg-yellow-900/50 px-2 py-1 rounded-full text-yellow-700 dark:text-yellow-500">Best: {bestScore}</span>}
            </div>
            <button onClick={initGame} className="absolute top-3 right-3 p-2 hover:bg-yellow-100 dark:hover:bg-gray-700 rounded-full transition-colors z-20"><RefreshCw className="w-4 h-4 text-yellow-600 dark:text-yellow-400" /></button>
            {won ? (
                <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in">
                    <Trophy className="w-16 h-16 text-yellow-500 mb-4 animate-bounce" />
                    <p className="font-black text-2xl text-yellow-900 dark:text-white">Zen Master!</p>
                    <p className="text-sm text-gray-500 mb-6">Completed in {moves} moves</p>
                    <button onClick={initGame} className="bg-black dark:bg-white dark:text-black text-white px-8 py-3 rounded-full font-bold text-sm hover:scale-105 transition-transform">Replay</button>
                </div>
            ) : (
                <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-px p-0.5">
                    {cards.map((card, i) => {
                        const isVisible = flipped.includes(i) || solved.includes(i);
                        const Icon = card.icon;
                        return (
                            <div key={i} className="perspective-1000 w-full h-full">
                                <button
                                    onClick={() => handleCardClick(i)}
                                    className={`w-full h-full rounded-xl flex items-center justify-center transition-all duration-500 transform-style-3d ${isVisible ? 'bg-white dark:bg-gray-700 border-2 border-yellow-400 shadow-lg rotate-y-180' : 'bg-gray-900 dark:bg-gray-800 shadow-md'}`}
                                >
                                    {isVisible ? <Icon className="w-5 h-5 md:w-8 md:h-8 text-yellow-500 animate-in zoom-in" /> : <div className="w-2 h-2 bg-gray-700 rounded-full"></div>}
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
