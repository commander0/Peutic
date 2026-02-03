import { supabase } from './supabaseClient';
import { GardenState } from '../types';

export class GardenService {

    static async getGarden(userId: string): Promise<GardenState | null> {
        const { data, error } = await supabase
            .from('garden_log')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error("Error fetching garden:", error);
        }

        if (!data) {
            return await this.initializeGarden(userId);
        }

        return {
            userId: data.user_id,
            level: data.level,
            currentPlantType: data.current_plant_type as any,
            waterLevel: data.water_level || 50,
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
            water_level: 50,
            streak_current: 0,
            streak_best: 0
        };

        const { error } = await supabase.from('garden_log').insert(initialState);

        if (error) {
            console.error("Failed to initialize garden:", error);
        }

        return {
            userId,
            level: 1,
            currentPlantType: 'Lotus',
            waterLevel: 50,
            lastWateredAt: initialState.last_watered_at,
            streakCurrent: 0,
            streakBest: 0
        };
    }

    static async waterPlant(userId: string, intensity: number = 1): Promise<GardenState | null> {
        const current = await this.getGarden(userId);
        if (!current) return null;

        const now = new Date();
        const lastWatered = new Date(current.lastWateredAt);

        // precise diff in hours
        const hoursSnap = Math.abs(now.getTime() - lastWatered.getTime()) / 36e5;

        // If watered less than 1 hour ago, ignore (unless high intensity)
        if (hoursSnap < 1 && intensity === 1) {
            return current;
        }

        let newStreak = current.streakCurrent;
        let newLevel = current.level;

        // Intensity Scale Rewards: 1m=+1, 2m=+2, 3m=+3
        newStreak += (intensity);

        // Evolution Logic
        const effectiveStreak = newStreak + (current.streakBest * 0.1);

        if (effectiveStreak >= 3 && newLevel < 2) newLevel = 2; // Sprout
        if (effectiveStreak >= 10 && newLevel < 3) newLevel = 3; // Sapling
        if (effectiveStreak >= 25 && newLevel < 4) newLevel = 4; // Budding
        if (effectiveStreak >= 50 && newLevel < 5) newLevel = 5; // Bloom

        const updates = {
            last_watered_at: now.toISOString(),
            streak_current: newStreak,
            level: newLevel,
            water_level: Math.min(100, (current.waterLevel || 50) + 10 * intensity),
            streak_best: Math.max(current.streakBest, newStreak)
        };

        const { error } = await supabase
            .from('garden_log')
            .update(updates)
            .eq('user_id', userId);

        if (error) {
            console.error("Watering failed", error);
            throw error;
        }

        // Log it (fire and forget)
        supabase.from('audit_logs').insert({
            user_id: userId,
            action: 'garden_water',
            details: { intensity, newStreak }
        }).then();

        return {
            ...current,
            lastWateredAt: updates.last_watered_at,
            streakCurrent: updates.streak_current,
            streakBest: updates.streak_best,
            level: updates.level,
            waterLevel: updates.water_level
        };
    }

    static async clipPlant(userId: string): Promise<{ success: boolean; reward?: string; prize?: number; message?: string }> {
        try {
            // TODO: Implement Server-Side Cooldown via Gateway/DB
            // For now, we allow the action but removed the local storage limit which was not global.
            // Ideally, we would check a 'last_clipped_at' column in the DB.

            // 2. Generate Reward
            const quotes = [
                "Growth takes time.",
                "Pruning the unnecessary encourages the essential.",
                "Your roots are stronger than you know.",
                "Bloom where you are planted.",
                "Peace is a practice.",
                "The garden does not hurry, yet everything is accomplished.",
                "Nature does not hurry, yet everything is accomplished.",
                "Simplicity is the ultimate sophistication."
            ];
            const quote = quotes[Math.floor(Math.random() * quotes.length)];
            const prize = Math.floor(Math.random() * 5) + 5; // 5-10 coins

            // 3. Update Balance handled by UI/UserService

            return { success: true, reward: quote, prize, message: "Clipped!" };
        } catch (e) {
            console.error("Clip failed", e);
            return { success: false, message: "Failed to clip." };
        }
    }
}
