import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Crown } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { User } from '../../types';

export const ArcadeLeaderboard: React.FC = () => {
    const [leaders, setLeaders] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'cloud' | 'match' | 'slicer'>('cloud');

    useEffect(() => {
        fetchLeaders();
    }, []);

    const fetchLeaders = async () => {
        setLoading(true);
        // Fetch all users with game scores. Limit to 50 for performance realistic bounds.
        const { data, error } = await supabase
            .from('users')
            .select('id, name, avatar, game_scores')
            .not('game_scores', 'is', null)
            .limit(50);

        if (!error && data) {
            setLeaders(data as User[]);
        }
        setLoading(false);
    };

    const getSortedLeaders = () => {
        return [...leaders].filter(u => u.gameScores?.[activeTab] !== undefined)
            .sort((a, b) => {
                const scoreA = a.gameScores?.[activeTab] || 0;
                const scoreB = b.gameScores?.[activeTab] || 0;
                // Match is time-based, lower is better. Slicer/Cloud are points, higher is better.
                if (activeTab === 'match') return scoreA === 0 ? 1 : scoreB === 0 ? -1 : scoreA - scoreB;
                return scoreB - scoreA;
            }).slice(0, 10);
    };

    const sortedLeaders = getSortedLeaders();

    return (
        <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-gray-100 dark:border-white/5 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                    <Trophy className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-widest">Global Ranks</h3>
            </div>

            <div className="flex gap-2 mb-6 bg-gray-100/50 dark:bg-white/5 p-1 rounded-2xl">
                <button
                    onClick={() => setActiveTab('cloud')}
                    className={`flex-1 text-xs font-bold uppercase tracking-wider py-2 rounded-xl transition-all ${activeTab === 'cloud' ? 'bg-white dark:bg-white/10 text-sky-500 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                    Cloud
                </button>
                <button
                    onClick={() => setActiveTab('match')}
                    className={`flex-1 text-xs font-bold uppercase tracking-wider py-2 rounded-xl transition-all ${activeTab === 'match' ? 'bg-white dark:bg-white/10 text-violet-500 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                    Match
                </button>
                <button
                    onClick={() => setActiveTab('slicer')}
                    className={`flex-1 text-xs font-bold uppercase tracking-wider py-2 rounded-xl transition-all ${activeTab === 'slicer' ? 'bg-white dark:bg-white/10 text-red-500 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                    Slicer
                </button>
            </div>

            {loading ? (
                <div className="text-center text-gray-400 py-8 text-sm">Loading ranks...</div>
            ) : sortedLeaders.length === 0 ? (
                <div className="text-center text-gray-400 py-8 text-sm">No scores yet.</div>
            ) : (
                <div className="space-y-3">
                    {sortedLeaders.map((u, i) => (
                        <div key={u.id} className="flex items-center gap-4 p-3 rounded-2xl bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-colors">
                            <div className="w-8 text-center font-black text-gray-300 dark:text-gray-600 text-lg">
                                {i === 0 ? <Crown className="w-5 h-5 mx-auto text-yellow-400 drop-shadow-md" /> :
                                    i === 1 ? <Medal className="w-5 h-5 mx-auto text-gray-300 drop-shadow-md" /> :
                                        i === 2 ? <Medal className="w-5 h-5 mx-auto text-orange-400 drop-shadow-md" /> :
                                            <span className="opacity-50">#{i + 1}</span>}
                            </div>

                            <img src={u.avatar || "https://api.dicebear.com/9.x/notionists/svg?seed=" + u.name} alt={u.name} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" />

                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate">{u.name}</h4>
                            </div>

                            <div className="text-right">
                                <div className="font-black text-gray-800 dark:text-white">
                                    {activeTab === 'match' ? u.gameScores?.match + 's' : u.gameScores?.[activeTab]?.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
