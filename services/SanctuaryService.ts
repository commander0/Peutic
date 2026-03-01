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

    static async saveFocusSession(userId: string, durationSeconds: number, mode: 'FOCUS' | 'BREAK'): Promise<{ success: boolean; atomic: boolean }> {
        try {
            // V2: Attempt Atomic Flow State RPC
            const { data, error: rpcError } = await supabase.rpc('complete_flow_state', {
                p_user_id: userId,
                p_duration_seconds: durationSeconds,
                p_mode: mode
            });

            if (!rpcError && data && data.success) {
                logger.info("Atomic Focus Session saved", "Flow DB transaction successful");
                return { success: true, atomic: true };
            }

            // FALLBACK TO NON-ATOMIC for unmigrated environments
            logger.warn("Atomic RPC missing or failed, using multi-step fallback.");
            const { error } = await supabase
                .from('focus_sessions')
                .insert({ user_id: userId, duration_seconds: durationSeconds, mode });

            if (error) {
                logger.error("Failed to save focus session", error);
                return { success: false, atomic: false };
            }
            return { success: true, atomic: false };
        } catch (e) {
            logger.error("System Error saving focus", e as any);
            return { success: false, atomic: false };
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
            logger.error("System Error saving dream", e as any);
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

    // --- THE ORACLE (WISDOM) ---

    static async saveOracleReading(userId: string, message: string, context: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('oracle_logs')
                .insert({ user_id: userId, message, context });

            if (error) {
                logger.error("Failed to archive Oracle reading", error);
                return false;
            }
            return true;
        } catch (e) {
            logger.error("System Error archiving Oracle reading", e as any);
            return false;
        }
    }

    static async getOracleHistory(userId: string): Promise<any[]> {
        const { data } = await supabase
            .from('oracle_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);
        return data || [];
    }
}
