import { supabase } from './supabaseClient';
import { GardenState } from '../types';

export class GardenService {

    static async getGarden(userId: string): Promise<GardenState | null> {
        const { data, error } = await supabase
            .from('user_garden')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error("Error fetching garden:", error);
            return null;
        }

        if (!data) {
            return await this.initializeGarden(userId);
        }

        return {
            userId: data.user_id,
            level: data.level,
            currentPlantType: data.current_plant_type as any,
            lastWateredAt: data.last_watered_at,
            streakCurrent: data.streak_current,
            streakBest: data.streak_best
        };
    }

    static async initializeGarden(userId: string): Promise<GardenState> {
        const initialState = {
            user_id: userId,
            level: 1, // Seed
            current_plant_type: 'Lotus',
            last_watered_at: new Date().toISOString(),
            streak_current: 0,
            streak_best: 0
        };

        const { error } = await supabase.from('user_garden').insert(initialState);

        if (error) {
            console.error("Failed to initialize garden:", error);
            throw error;
        }

        return {
            userId,
            level: 1,
            currentPlantType: 'Lotus',
            lastWateredAt: initialState.last_watered_at,
            streakCurrent: 0,
            streakBest: 0
        };
    }

    static async waterPlant(userId: string, intensity: number = 1): Promise<GardenState | null> {
        // Logic:
        // 1. Fetch current state
        // 2. Check if already watered today (prevent farming)
        // 3. Increment streak if yesterday was watered, else reset
        // 4. Level up if streak hits milestones (3, 7, 14, 30 days)

        const current = await this.getGarden(userId);
        if (!current) return null;

        const now = new Date();
        const lastWatered = new Date(current.lastWateredAt);

        // precise diff in hours
        const hoursSnap = Math.abs(now.getTime() - lastWatered.getTime()) / 36e5;

        // If watered less than 1 hour ago, ignore (or just update time but no streak)
        // Except for high intensity - allowed to boost streak slightly more
        if (hoursSnap < 1 && intensity === 1) {
            return current;
        }

        let newStreak = current.streakCurrent;
        let newLevel = current.level;

        // Intensity Scale Rewards
        // 1m = +1 streak
        // 2m = +2 streak
        // 3m = +3 streak (Turbo Growth)
        newStreak += (intensity);

        // Evolution Logic (Accelerated with Intensity)
        const effectiveStreak = newStreak + (current.streakBest * 0.1); // Small bonus for historical best

        if (effectiveStreak >= 3 && newLevel < 2) newLevel = 2; // Sprout
        if (effectiveStreak >= 10 && newLevel < 3) newLevel = 3; // Sapling
        if (effectiveStreak >= 25 && newLevel < 4) newLevel = 4; // Budding
        if (effectiveStreak >= 50 && newLevel < 5) newLevel = 5; // Bloom

        const updates = {
            last_watered_at: now.toISOString(),
            streak_current: newStreak,
            level: newLevel,
            streak_best: Math.max(current.streakBest, newStreak)
        };

        const { error } = await supabase
            .from('user_garden')
            .update(updates)
            .eq('user_id', userId);

        if (error) throw error;

        // Log it
        await supabase.from('garden_log').insert({
            user_id: userId,
            event_type: 'WATER',
            note: `Watered with intensity ${intensity}. New Streak: ${newStreak}`
        });

        return {
            ...current, ...{
                lastWateredAt: updates.last_watered_at,
                streakCurrent: updates.streak_current,
                streakBest: updates.streak_best,
                level: updates.level
            }
        };
    }
}
