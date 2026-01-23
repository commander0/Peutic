import { User, UserRole, Transaction, MoodEntry, JournalEntry, ArtEntry, SessionFeedback, VoiceJournalEntry } from '../types';

import { supabase } from './supabaseClient';
import { BaseService } from './baseService';
import { NameValidator } from './nameValidator';
import { logger } from './logger';

export class UserService {
    private static currentUser: User | null = null;
    private static CACHE_KEY = 'peutic_user_profile';

    static saveUserToCache(user: User) {
        try {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(user));
        } catch (e) { }
    }

    static clearCache() {
        localStorage.removeItem(this.CACHE_KEY);
        localStorage.removeItem('peutic_companions');
        localStorage.removeItem('peutic_settings');
    }

    static getCachedUser(): User | null {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            if (cached) return JSON.parse(cached);
        } catch (e) { }
        return null;
    }

    static getUser(): User | null { return this.currentUser; }

    static async restoreSession(): Promise<User | null> {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const cached = this.getCachedUser();
            if (cached && cached.id === session.user.id) {
                this.currentUser = cached;
                this.syncUser(session.user.id);
                return cached;
            }
            return await this.syncUser(session.user.id);
        }
        return null;
    }

    static async syncUser(userId: string): Promise<User | null> {
        if (!userId) return null;
        try {
            const fields = 'id, name, email, birthday, role, balance, subscription_status, created_at, last_login_date, streak, provider, avatar_url, avatar_locked, email_preferences, theme_preference, language_preference, game_scores';
            const { data, error } = (await BaseService.withTimeout(
                supabase.from('users').select(fields).eq('id', userId).maybeSingle(),
                5000,
                "User sync timeout"
            )) as any;

            if (error) {
                console.error("CRITICAL: User Sync Database Error", error);
                return null;
            }

            if (data) {
                this.currentUser = this.mapUser(data);
                this.saveUserToCache(this.currentUser);
                this.checkAchievements(this.currentUser);
                return this.currentUser;
            }
        } catch (e) {
            logger.error("User Sync Exception", `ID: ${userId}`, e);
        }
        return null;
    }

    static mapUser(data: any): User {
        return {
            id: data.id,
            name: data.name,
            email: data.email,
            birthday: data.birthday,
            role: data.role as UserRole,
            balance: data.balance || 0,
            subscriptionStatus: (data.subscription_status || 'ACTIVE') as any,
            joinedAt: data.created_at || new Date().toISOString(),
            lastLoginDate: data.last_login_date || new Date().toISOString(),
            streak: data.streak || 0,
            provider: data.provider || 'email',
            avatar: data.avatar_url,
            avatarLocked: data.avatar_locked || false,
            emailPreferences: data.email_preferences || { marketing: true, updates: true },
            themePreference: data.theme_preference,
            languagePreference: data.language_preference,
            gameScores: data.game_scores || { match: 0, cloud: 0 }
        };
    }

    static createFallbackUser(sessionUser: any): User {
        return {
            id: sessionUser.id,
            name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || "User",
            email: sessionUser.email || "",
            role: UserRole.USER,
            balance: 0,
            subscriptionStatus: 'ACTIVE',
            joinedAt: new Date().toISOString(),
            lastLoginDate: new Date().toISOString(),
            streak: 0,
            provider: sessionUser.app_metadata?.provider || 'email',
            avatar: sessionUser.user_metadata?.avatar_url,
            emailPreferences: { marketing: true, updates: true },
            themePreference: 'light',
            languagePreference: 'en',
            gameScores: { match: 0, cloud: 0 }
        };
    }

    static async repairUserRecord(sessionUser: any): Promise<User | null> {
        try {
            const fallback = this.createFallbackUser(sessionUser);
            const { error } = await supabase.from('users').upsert({
                id: fallback.id,
                email: fallback.email,
                name: fallback.name,
                provider: fallback.provider,
                last_login_date: new Date().toISOString()
            });

            if (error) return null;
            return await this.syncUser(sessionUser.id);
        } catch (e) {
            return null;
        }
    }

    static async login(email: string, password?: string): Promise<User> {
        if (!password) throw new Error("Password required");
        const { data, error } = (await BaseService.withTimeout(
            supabase.auth.signInWithPassword({ email, password }),
            10000,
            "Login request timed out"
        )) as any;

        if (error) throw new Error(error.message);
        if (data.user) {
            const user = await this.syncUser(data.user.id);
            if (user) {
                return user;
            }
        }
        throw new Error("Profile synchronization failed");
    }

    static async createUser(name: string, email: string, password?: string, provider: string = 'email', birthday?: string): Promise<User> {
        const cleanName = NameValidator.sanitize(name) || "User";
        if (provider === 'email' && password) {
            const { data, error } = (await BaseService.withTimeout(
                supabase.auth.signUp({
                    email, password,
                    options: { data: { full_name: cleanName, birthday } }
                }),
                12000,
                "Signup service timed out"
            )) as any;

            if (error) {
                if (error.message.includes("registered") || error.message.includes("already exists")) {
                    return this.login(email, password);
                }
                throw new Error(error.message);
            }

            if (data.user) {
                const optimisticUser: User = {
                    id: data.user.id,
                    name: cleanName,
                    email: email,
                    role: UserRole.USER,
                    balance: 0,
                    subscriptionStatus: 'ACTIVE',
                    joinedAt: new Date().toISOString(),
                    lastLoginDate: new Date().toISOString(),
                    streak: 0,
                    provider: 'email',
                    emailPreferences: { marketing: true, updates: true },
                    birthday: birthday
                };
                return optimisticUser;
            }
        }
        throw new Error("Failed to initialize account");
    }

    static async updateUser(user: User) {
        if (!user.id) return;
        this.currentUser = user;

        // Fix: Use camelCase keys in the payload to match the User interface type if inferred by the supabase client
        // This resolves property errors reported by TypeScript
        const payload = {
            name: user.name,
            avatar: user.avatar,
            avatarLocked: user.avatarLocked,
            emailPreferences: user.emailPreferences,
            themePreference: user.themePreference,
            languagePreference: user.languagePreference,
            lastLoginDate: user.lastLoginDate,
            streak: user.streak,
            balance: user.balance
        };

        const { error } = await supabase.from('users').update(payload).eq('id', user.id);
        if (error) {
            logger.error("Update Profile Failed", user.id, error);
        } else {
            this.saveUserToCache(user);
        }
    }

    static checkAndIncrementStreak(user: User): User {
        const today = new Date().toDateString();
        const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate).toDateString() : null;

        if (lastLogin === today) return user;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        let newStreak = user.streak || 0;
        if (lastLogin === yesterdayStr) newStreak++;
        else if (lastLogin !== today) newStreak = 1;

        const updatedUser = { ...user, streak: newStreak, lastLoginDate: new Date().toISOString() };
        
        // Fix: Use camelCase key 'lastLoginDate' to match User interface as expected by inferred types
        supabase.from('users').update({ 
            streak: newStreak, 
            lastLoginDate: new Date().toISOString() 
        }).eq('id', user.id).then();

        return updatedUser;
    }

    static async logout() {
        this.clearCache();
        await supabase.auth.signOut();
        this.currentUser = null;
    }

    static async getUserArt(userId: string): Promise<ArtEntry[]> {
        const { data } = await supabase.from('user_art')
            .select('id, user_id, image_url, prompt, created_at, title')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        return (data || []).map((a: any) => ({
            id: a.id, userId: a.user_id, imageUrl: a.image_url, prompt: a.prompt, createdAt: a.created_at, title: a.title
        }));
    }

    static async saveArt(entry: ArtEntry) {
        const { error } = await supabase.from('user_art').insert({
            id: entry.id || crypto.randomUUID(),
            user_id: entry.userId,
            image_url: entry.imageUrl,
            prompt: entry.prompt,
            title: entry.title,
            created_at: entry.createdAt || new Date().toISOString()
        });
        if (error) throw error;
    }

    static async deleteArt(id: string) {
        const { error } = await supabase.from('user_art').delete().eq('id', id);
        if (error) throw error;
    }

    static async getUserTransactions(userId: string): Promise<Transaction[]> {
        const { data } = await supabase.from('transactions')
            .select('id, user_id, date, amount, cost, description, status')
            .eq('user_id', userId)
            .order('date', { ascending: false });
        return (data || []).map((t: any) => ({
            id: t.id, userId: t.user_id, date: t.date, amount: t.amount, cost: t.cost, description: t.description, status: t.status as any
        }));
    }

    static async getJournals(userId: string): Promise<JournalEntry[]> {
        const { data } = await supabase.from('journals')
            .select('id, user_id, date, content')
            .eq('user_id', userId)
            .order('date', { ascending: false });
        return (data || []).map((j: any) => ({ id: j.id, userId: j.user_id, date: j.date, content: j.content }));
    }

    static async saveJournal(entry: JournalEntry) {
        const { error } = await supabase.from('journals').insert({
            id: entry.id || crypto.randomUUID(),
            user_id: entry.userId,
            date: entry.date || new Date().toISOString(),
            content: entry.content
        });
        if (error) throw error;
    }

    static async deleteJournal(id: string) {
        const { error } = await supabase.from('journals').delete().eq('id', id);
        if (error) throw error;
    }

    static async getMoods(userId: string): Promise<MoodEntry[]> {
        const { data } = await supabase.from('moods')
            .select('id, user_id, date, mood')
            .eq('user_id', userId)
            .order('date', { ascending: false });
        return (data || []).map((m: any) => ({ id: m.id, userId: m.user_id, date: m.date, mood: m.mood as any }));
    }

    static async saveMood(userId: string, mood: string) {
        await supabase.from('moods').insert({
            user_id: userId,
            date: new Date().toISOString(),
            mood: mood
        });
    }

    static async getWeeklyProgress(userId: string): Promise<{ current: number, target: number, message: string }> {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const iso = oneWeekAgo.toISOString();

        const [jRes, sRes, mRes] = await Promise.all([
            supabase.from('journals').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('date', iso),
            supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'COMPLETED').gte('date', iso),
            supabase.from('moods').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('date', iso),
        ]);

        const current = (jRes.count || 0) + (sRes.count || 0) + (mRes.count || 0);
        return { current, target: 10, message: current >= 10 ? "Great work!" : "Keep going." };
    }

    static async endSession(userId: string) {
        await supabase.from('active_sessions').delete().eq('user_id', userId);
        await supabase.from('session_queue').delete().eq('user_id', userId);
    }

    static async joinQueue(userId: string): Promise<number> {
        const { data } = await supabase.rpc('join_queue', { p_user_id: userId });
        return data !== null ? data : 99;
    }

    static getEstimatedWaitTime(pos: number): number {
        return Math.max(0, (pos - 1) * 3);
    }

    static async claimActiveSpot(userId: string): Promise<boolean> {
        const { data } = await supabase.rpc('claim_active_spot', { p_user_id: userId });
        return !!data;
    }

    static async sendQueueHeartbeat(userId: string) {
        await BaseService.invokeGateway('queue-heartbeat', { userId });
    }

    static async getQueuePosition(userId: string): Promise<number> {
        const { data } = await supabase.rpc('get_client_queue_position', { p_user_id: userId });
        return data;
    }

    static async sendKeepAlive(userId: string) {
        await BaseService.invokeGateway('session-keepalive', { userId });
    }

    static async deductBalance(amount: number, reason: string): Promise<boolean> {
        const user = this.getUser();
        if (!user) return false;

        // PREVENTION OF NEGATIVE BALANCE
        if (user.balance < amount) return false;

        try {
            const { data, error } = await BaseService.invokeGateway('process-topup', {
                userId: user.id,
                amount: -amount,
                cost: 0,
                description: reason
            });

            if (error || !data.success) return false;

            // Optimistic update local
            user.balance = data.newBalance;
            this.saveUserToCache(user);
            return true;
        } catch (e) {
            return false;
        }
    }

    static async saveTransaction(tx: Transaction) {
        await supabase.from('transactions').insert({
            id: tx.id,
            user_id: tx.userId,
            date: tx.date || new Date().toISOString(),
            amount: tx.amount,
            cost: tx.cost,
            description: tx.description,
            status: tx.status
        });
    }

    static async saveFeedback(feedback: SessionFeedback) {
        await supabase.from('feedback').insert({
            user_id: feedback.userId,
            companion_name: feedback.companionName,
            rating: feedback.rating,
            tags: feedback.tags,
            date: feedback.date || new Date().toISOString()
        });
    }

    static async updateGameScore(userId: string, game: 'match' | 'cloud', score: number) {
        const user = this.getUser();
        if (!user) return;
        const currentScores = user.gameScores || { match: 0, cloud: 0 };
        const newScore = game === 'match' ? (currentScores.match === 0 ? score : Math.min(currentScores.match, score)) : Math.max(currentScores.cloud, score);
        
        user.gameScores = { ...currentScores, [game]: newScore };
        this.saveUserToCache(user);

        await BaseService.invokeGateway('update-game-score', { userId, game, score });
    }

    static recordBreathSession(userId: string, duration: number) {
        supabase.from('breath_sessions').insert({ user_id: userId, duration }).then();
    }

    static async deleteUser(id: string) {
        await BaseService.invokeGateway('delete-user', { userId: id });
        this.logout();
    }

    static async checkAchievements(user: User) {
        // Trigger check in background
    }

    static async topUpWallet(amount: number, cost: number, userId?: string, paymentToken?: string) {
        const uid = userId || this.getUser()?.id;
        if (!uid) return;
        await BaseService.invokeGateway('process-topup', { userId: uid, amount, cost, paymentToken });
        await this.syncUser(uid);
    }

    static saveUserSession(user: User) { this.currentUser = user; }

    static async getVoiceJournals(userId: string): Promise<VoiceJournalEntry[]> {
        const { data } = await supabase.from('voice_journals')
            .select('id, user_id, audio_url, duration_seconds, title, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        return (data || []).map((d: any) => ({
            id: d.id, userId: d.user_id, audioUrl: d.audio_url, durationSeconds: d.duration_seconds, title: d.title, createdAt: d.created_at
        }));
    }

    static async saveVoiceJournal(entry: VoiceJournalEntry) {
        await supabase.from('voice_journals').insert({
            id: entry.id,
            user_id: entry.userId,
            audio_url: entry.audioUrl,
            duration_seconds: entry.durationSeconds,
            title: entry.title,
            created_at: entry.createdAt
        });
    }

    static async deleteVoiceJournal(id: string) {
        await supabase.from('voice_journals').delete().eq('id', id);
    }

    static async predictMoodRisk(userId: string): Promise<boolean> {
        return false;
    }
}