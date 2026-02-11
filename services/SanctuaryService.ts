import { supabase } from './supabaseClient';
import { logger } from './logger';

export interface FocusSession {
    id: string;
    userId: string;
    durationSeconds: number; // Stored in DB
    completedAt: string;
    mode: 'FOCUS' | 'BREAK';
}

export interface DreamLog {
    id: string;
    userId: string;
    content: string;
    lucidityLevel: number;
    sleepQuality: 'Restful' | 'Average' | 'Poor';
    createdAt: string;
}

export class SanctuaryService {

    // --- DOJO (FOCUS) ---

    static async saveFocusSession(userId: string, durationSeconds: number, mode: 'FOCUS' | 'BREAK'): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('focus_sessions')
                .insert({ user_id: userId, duration_seconds: durationSeconds, mode });

            if (error) {
                logger.error("Failed to save focus session", error);
                return false;
            }
            return true;
        } catch (e) {
            logger.error("System Error saving focus", e);
            return false;
        }
    }

    static async getFocusHistory(userId: string): Promise<FocusSession[]> {
        const { data } = await supabase
            .from('focus_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('completed_at', { ascending: false })
            .limit(10);

        return (data || []).map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            durationSeconds: d.duration_seconds,
            completedAt: d.completed_at,
            mode: d.mode
        }));
    }

    // --- OBSERVATORY (DREAMS) ---

    static async saveDream(userId: string, content: string, lucidity: number, quality: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('dream_logs')
                .insert({
                    user_id: userId,
                    content,
                    lucidity_level: lucidity,
                    sleep_quality: quality
                });

            if (error) {
                logger.error("Failed to save dream", error);
                return false;
            }
            return true;
        } catch (e) {
            logger.error("System Error saving dream", e);
            return false;
        }
    }

    static async getDreamHistory(userId: string): Promise<DreamLog[]> {
        const { data } = await supabase
            .from('dream_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        return (data || []).map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            content: d.content,
            lucidityLevel: d.lucidity_level,
            sleepQuality: d.sleep_quality,
            createdAt: d.created_at
        }));
    }
}
