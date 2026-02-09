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
        const { data, error } = await supabase.rpc('water_garden', {
            p_user_id: userId,
            p_intensity: intensity
        });

        if (error) {
            console.error("Watering failed", error);
            throw error;
        }

        if (!data || !data.garden) return null;

        const g = data.garden;
        return {
            userId: g.user_id,
            level: g.level,
            currentPlantType: g.current_plant_type as any,
            waterLevel: g.water_level || 50,
            lastWateredAt: g.last_watered_at,
            streakCurrent: g.streak_current,
            streakBest: g.streak_best
        };
    }

    static async clipPlant(userId: string): Promise<{ success: boolean; reward?: string; prize?: number; message?: string }> {
        try {
            // 1. Check Cooldown (Local)
            const lastClip = localStorage.getItem(`peutic_last_clip_${userId}`);
            const now = Date.now();

            if (lastClip && now - parseInt(lastClip) < 60000) {
                return { success: false, message: "The plant needs time to regrow." };
            }

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

            // 3. Update Balance (Mocking Backend Call)
            // Ideally we call UserService.addBalance here, but to avoid circular deps we return values
            // and let the UI handler call the service.

            // Update local cooldown
            localStorage.setItem(`peutic_last_clip_${userId}`, now.toString());

            return { success: true, reward: quote, prize, message: "Clipped!" };
        } catch (e) {
            console.error("Clip failed", e);
            return { success: false, message: "Failed to clip." };
        }
    }
}
