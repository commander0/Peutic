import { supabase } from './supabaseClient';
import { WisdomEntry } from '../types';

export class WisdomService {

    // Get approved community wisdoms
    static async getGlobalStream(): Promise<WisdomEntry[]> {
        const { data, error } = await supabase
            .from('public_wisdom')
            .select('*')
            .eq('is_approved', true) // Only safe content
            .eq('exclude_from_feed', false)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error("Error fetching wisdom:", error);
            return [];
        }

        return data.map((d: any) => ({
            id: d.id,
            content: d.content,
            category: d.category,
            isApproved: d.is_approved,
            likes: d.likes,
            createdAt: d.created_at
        }));
    }

    // Submit new wisdom
    static async submitWisdom(userId: string, content: string, category: string = 'General'): Promise<boolean> {
        const { error } = await supabase.from('public_wisdom').insert({
            user_id: userId,
            content: content.substring(0, 480), // limit length
            category,
            is_approved: false // Default to unapproved
        });

        if (error) {
            console.error("Submission failed:", error);
            throw error;
        }
        return true;
    }

    // Admin verify (optional implementation for now)
    static async approve(id: string) {
        // Requires admin rights
        await supabase.from('public_wisdom').update({ is_approved: true }).eq('id', id);
    }
}
