import React, { useEffect, useState } from 'react';
import {
    Trophy, Lock, Zap, Footprints, Flame, Sprout, Heart, Mic, Star
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
    'Trophy': Trophy
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
        return <div className="p-8 text-center text-gray-400 animate-pulse">Scanning Bio-Data...</div>;
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {achievements.map((ach) => {
                const isUnlocked = userAchievements.has(ach.id);
                const Icon = ICON_MAP[ach.icon_name] || Trophy;

                return (
                    <div
                        key={ach.id}
                        onClick={() => alert(`Benchmark: ${ach.title}\n${ach.description}\nValue: +${ach.xp_reward} XP`)}
                        className={`relative group p-4 rounded-2xl border transition-all duration-500 overflow-hidden cursor-pointer ${isUnlocked
                            ? 'bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)] hover:shadow-[0_0_25px_rgba(234,179,8,0.2)] hover:-translate-y-1'
                            : 'bg-gray-900/40 border-white/5 grayscale opacity-50 hover:opacity-70'
                            }`}
                    >
                        {/* UNLOCKED SHINE EFFECT */}
                        {isUnlocked && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
                        )}

                        <div className="flex items-start gap-3 relative z-10">
                            <div className={`p-3 rounded-full ${isUnlocked ? 'bg-yellow-500/20 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'bg-gray-800 text-gray-600'}`}>
                                {isUnlocked ? <Icon className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                            </div>
                            <div>
                                <h3 className={`text-xs font-black uppercase tracking-wider mb-1 ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                                    {ach.title}
                                </h3>
                                <div className="h-0.5 w-8 bg-gray-700 my-2 rounded-full overflow-hidden">
                                    <div className={`h-full ${isUnlocked ? 'bg-yellow-500' : 'bg-transparent'} w-full`}></div>
                                </div>
                                <p className="text-[10px] text-gray-400 leading-tight mb-2 min-h-[2.5em] line-clamp-2">
                                    {ach.description}
                                </p>
                                <div className="flex items-center gap-1">
                                    <Star className={`w-3 h-3 ${isUnlocked ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`} />
                                    <span className={`text-[9px] font-bold ${isUnlocked ? 'text-yellow-400' : 'text-gray-600'}`}>
                                        +{ach.xp_reward} XP
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AchievementGrid;
