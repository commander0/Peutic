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
            // OPTIMIZATION: Use RPC for atomic reward + updates
            const { data, error } = await supabase.rpc('clip_garden', { p_user_id: userId });

            if (error) {
                console.error("Clip RPC failed", error);
                return { success: false, message: "Garden is resting." };
            }

            // Data contains: { prize: number, quote: string, new_balance: number }
            return {
                success: true,
                reward: data.quote,
                prize: data.prize,
                message: "Clipped!"
            };
        } catch (e) {
            console.error("Clip exception", e);
            return { success: false, message: "Failed to clip." };
        }
    }
}
