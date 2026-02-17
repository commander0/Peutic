import React, { useEffect, useState } from 'react';
import { Trophy, Lock, Star, Zap, Heart, BookOpen, Crown, MapPin, Activity } from 'lucide-react';
import { Achievement } from '../../types';
import { supabase } from '../../services/supabaseClient';

interface AchievementGridProps {
    userId: string;
}

const AchievementGrid: React.FC<AchievementGridProps> = ({ userId }) => {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [userAchievements, setUserAchievements] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        try {
            // 1. Fetch all available achievements
            const { data: allAch, error: achError } = await supabase
                .from('achievements')
                .select('*')
                .order('xp_reward', { ascending: true }); // Simple order by XP

            if (achError) throw achError;

            // 2. Fetch user's unlocked achievements
            const { data: userAch, error: userAchError } = await supabase
                .from('user_achievements')
                .select('achievement_id, unlocked_at')
                .eq('user_id', userId);

            if (userAchError) throw userAchError;

            setAchievements(allAch || []);

            // Create a Set of unlocked IDs for O(1) lookup
            const unlockedSet = new Set<string>((userAch || []).map((ua: any) => ua.achievement_id));
            setUserAchievements(unlockedSet);

        } catch (e) {
            console.error("Failed to load achievements", e);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (iconName: string, isUnlocked: boolean) => {
        const props = { className: `w-6 h-6 ${isUnlocked ? 'text-yellow-900' : 'text-gray-500'}` };
        switch (iconName) {
            case 'Star': return <Star {...props} />;
            case 'Zap': return <Zap {...props} />;
            case 'Heart': return <Heart {...props} />;
            case 'BookOpen': return <BookOpen {...props} />;
            case 'Crown': return <Crown {...props} />;
            case 'MapPin': return <MapPin {...props} />;
            case 'Activity': return <Activity {...props} />;
            default: return <Trophy {...props} />;
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl"></div>
                ))}
            </div>
        );
    }

    if (achievements.length === 0) {
        return <div className="text-center text-gray-400 py-10">No achievements found in the system.</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {achievements.map((ach) => {
                const isUnlocked = userAchievements.has(ach.id);

                return (
                    <div
                        key={ach.id}
                        className={`relative p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 ${isUnlocked
                            ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border-yellow-200 dark:border-yellow-700/30 shadow-sm'
                            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 grayscale opacity-80'
                            }`}
                    >
                        {/* Icon Container */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-inner ${isUnlocked
                            ? 'bg-yellow-400 border-yellow-300'
                            : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                            }`}>
                            {isUnlocked ? getIcon(ach.icon, true) : <Lock className="w-5 h-5 text-gray-400" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className={`text-sm font-bold truncate ${isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                    {ach.title}
                                </h4>
                                {isUnlocked && (
                                    <span className="text-[10px] font-black bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-1.5 py-0.5 rounded">
                                        +{ach.xp_reward} XP
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 leading-tight">
                                {ach.description}
                            </p>
                        </div>

                        {/* Shine Effect if unlocked */}
                        {isUnlocked && (
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default AchievementGrid;
