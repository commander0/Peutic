import { supabase } from './supabaseClient';
import { TimeCapsule } from '../types';

export class TimeCapsuleService {

    static async getCapsules(userId: string): Promise<TimeCapsule[]> {
        const { data } = await supabase.from('time_capsules')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        return (data || []).map((c: any) => ({
            id: c.id,
            userId: c.user_id,
            content: c.content, // Frontend will mask this if locked
            unlockDate: c.unlock_date,
            createdAt: c.created_at,
            isRevealed: c.is_revealed
        }));
    }

    static async createCapsule(userId: string, content: string, unlockDate: string) {
        const { error } = await supabase.from('time_capsules').insert({
            user_id: userId,
            content,
            unlock_date: unlockDate
        });
        if (error) throw error;
    }

    static async deleteCapsule(id: string) {
        const { error } = await supabase.from('time_capsules').delete().eq('id', id);
        if (error) throw error;
    }
}
