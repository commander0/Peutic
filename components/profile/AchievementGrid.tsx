import React, { useEffect, useState } from 'react';
import {
    Trophy, Lock, Zap, Footprints, Flame, Sprout, Heart, Mic, Star, Target, Shield, Book
} from 'lucide-react';
import { Achievement } from '../../types';
import { supabase } from '../../services/supabaseClient';

interface AchievementGridProps {
    userId: string;
}

const ICON_MAP: Record<string, any> = {
    'Footprints': Footprints,
    'Flame': Flame,
    'Zap': Zap,
    'Sprout': Sprout,
    'Heart': Heart,
    'Mic': Mic,
    'Star': Star,
    'Trophy': Trophy,
    'Target': Target,
    'Shield': Shield,
    'Book': Book
};

const AchievementGrid: React.FC<AchievementGridProps> = ({ userId }) => {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [userAchievements, setUserAchievements] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        try {
            // 1. Fetch all achievements
            const { data: allAchievements, error: achError } = await supabase
                .from('achievements')
                .select('*')
                .order('xp_reward', { ascending: true });

            if (achError) throw achError;

            // 2. Fetch user unlocked achievements
            const { data: unlocked, error: userError } = await supabase
                .from('user_achievements')
                .select('achievement_id')
                .eq('user_id', userId);

            if (userError) throw userError;

            setAchievements(allAchievements || []);
            setUserAchievements(new Set(unlocked?.map((ua: any) => ua.achievement_id) || []));
        } catch (error) {
            console.error("Failed to load achievements", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-gray-400 animate-pulse uppercase tracking-[0.2em] font-black text-xs">Scanning Resonance History...</div>;
    }

    const unlockedCount = userAchievements.size;
    const totalCount = achievements.length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-50 dark:bg-black/20 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Journey Progress</p>
                    <p className="text-xl font-black">{unlockedCount} / {totalCount} <span className="text-xs text-gray-500 font-bold uppercase ml-1">Unlocked</span></p>
                </div>
                <div className="w-32 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)] transition-all duration-1000" 
                        style={{ width: `${(unlockedCount / Math.max(1, totalCount)) * 100}%` }}
                    ></div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {achievements.map((ach) => {
                    const isUnlocked = userAchievements.has(ach.id);
                    const Icon = ICON_MAP[ach.icon_name] || Trophy;

                    return (
                        <div
                            key={ach.id}
                            className={`relative group p-5 rounded-3xl border transition-all duration-500 overflow-hidden ${isUnlocked
                                ? 'bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/30 shadow-xl hover:-translate-y-1'
                                : 'bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-white/5 grayscale opacity-60'
                                }`}
                        >
                            {/* UNLOCKED SHINE EFFECT */}
                            {isUnlocked && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
                            )}

                            <div className="flex flex-col items-center text-center gap-3 relative z-10">
                                <div className={`p-4 rounded-2xl ${isUnlocked ? 'bg-yellow-400 text-black shadow-lg scale-110' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                                    {isUnlocked ? <Icon className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h3 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                        {ach.title}
                                    </h3>
                                    <p className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight mb-3 line-clamp-2 min-h-[2.4em]">
                                        {ach.description}
                                    </p>
                                    <div className="flex items-center justify-center gap-1.5 px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full w-fit mx-auto">
                                        <Star className={`w-3 h-3 ${isUnlocked ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                                        <span className={`text-[9px] font-black ${isUnlocked ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500'}`}>
                                            +{ach.xp_reward} XP
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AchievementGrid;