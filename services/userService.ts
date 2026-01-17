
import { User, UserRole, Transaction, MoodEntry, JournalEntry, ArtEntry, SessionFeedback } from '../types';

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

    static getCachedUser(): User | null {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            if (cached) return JSON.parse(cached);
        } catch (e) { }
        return null;
    }

    static clearCache() {
        localStorage.removeItem(this.CACHE_KEY);
    }



    static getUser(): User | null { return this.currentUser; }

    static async restoreSession(): Promise<User | null> {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            // Check cache first for instant boot
            const cached = this.getCachedUser();
            if (cached && cached.id === session.user.id) {
                this.currentUser = cached;
                // Still fire sync in background
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
            // Using maybeSingle to handle RLS strictness gracefully
            const { data, error } = (await BaseService.withTimeout(
                supabase.from('users').select('*').eq('id', userId).maybeSingle(),
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
                return this.currentUser;
            } else {
                console.warn("CRITICAL: User Sync Data Missing - RLS/ID Mismatch", { userId });
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
            emailPreferences: data.email_preferences || { marketing: true, updates: true },
            themePreference: data.theme_preference,
            languagePreference: data.language_preference,
            gameScores: data.game_scores || { match: 0, cloud: 0 }
        };
    }

    // FALLBACK: Construct a temporary user object from Auth Session to prevent logout
    static createFallbackUser(sessionUser: any): User {
        return {
            id: sessionUser.id,
            name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || "User",
            email: sessionUser.email || "",
            role: UserRole.USER, // Default to USER, Admin dashboard handles its own checks
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

    // REPAIR: Attempt to fix missing public.users record
    static async repairUserRecord(sessionUser: any): Promise<User | null> {
        try {
            console.log("Attempting to repair user profile...", sessionUser.id);
            const fallback = this.createFallbackUser(sessionUser);

            // Try explicit UPSERT to fix missing row
            const { error } = await supabase.from('users').upsert({
                id: fallback.id,
                email: fallback.email,
                name: fallback.name,
                role: 'USER',
                provider: fallback.provider,
                last_login_date: new Date().toISOString()
            });

            if (error) {
                console.error("Repair failed (likely RLS denied):", error);
                return null;
            }

            // Retry Sync
            return await this.syncUser(sessionUser.id);
        } catch (e) {
            console.error("Repair Exception:", e);
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
                logger.success("User Login", `Email: ${email}`);
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
                logger.success("User Created", `Email: ${email}`);
                return optimisticUser;
            }
        }
        throw new Error("Failed to initialize account");
    }

    static async updateUser(user: User) {
        if (!user.id) return;
        this.currentUser = user;
        const { error } = await BaseService.invokeGateway('user-update', user);
        if (error) logger.error("Update Profile Failed", user.id, error);
    }

    static checkAndIncrementStreak(user: User): User {
        const today = new Date().toDateString();
        const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate).toDateString() : null;

        if (lastLogin === today) {
            return user;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        let newStreak = user.streak || 0;
        if (lastLogin === yesterdayStr) {
            newStreak++;
        } else if (lastLogin !== today) {
            newStreak = 1;
        }

        const updatedUser = { ...user, streak: newStreak, lastLoginDate: new Date().toISOString() };
        supabase.from('users').update({
            streak: newStreak,
            last_login_date: new Date().toISOString()
        }).eq('id', user.id).then(() => { }).catch(console.error);

        return updatedUser;
    }


    static async logout() {
        await supabase.auth.signOut();
        this.currentUser = null;
        logger.info("User Logout", "Session cleared");
    }

    static async getUserArt(userId: string): Promise<ArtEntry[]> {

        const { data } = await supabase.from('user_art').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        return (data || []).map((a: any) => ({
            id: a.id, userId: a.user_id, imageUrl: a.image_url, prompt: a.prompt, createdAt: a.created_at, title: a.title
        }));
    }

    static async saveArt(entry: ArtEntry) {
        const { error } = await supabase.from('user_art').insert({
            id: entry.id, user_id: entry.userId, image_url: entry.imageUrl, prompt: entry.prompt, title: entry.title, created_at: entry.createdAt
        });
        if (error) {
            console.error("Save Art Failed:", error);
            throw error;
        }
    }

    static async deleteArt(id: string) {
        const { error } = await supabase.from('user_art').delete().eq('id', id);
        if (error) {
            logger.error("Delete Art Failed", id, error);
            throw error;
        }
    }


    static async getUserTransactions(userId: string): Promise<Transaction[]> {
        const { data } = await supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false });
        return (data || []).map((t: any) => ({
            id: t.id, userId: t.user_id, date: t.date, amount: t.amount, cost: t.cost, description: t.description, status: t.status as any
        }));
    }

    static async getJournals(userId: string): Promise<JournalEntry[]> {
        const { data } = await supabase.from('journals').select('*').eq('user_id', userId).order('date', { ascending: false });
        return (data || []).map((j: any) => ({ id: j.id, userId: j.user_id, date: j.date, content: j.content }));
    }

    static async saveJournal(entry: JournalEntry) {
        const { error } = await supabase.from('journals').insert({
            id: entry.id, user_id: entry.userId, date: entry.date, content: entry.content
        });
        if (error) {
            console.error("Save Journal Failed:", error);
            throw error;
        }
    }

    static async getMoods(userId: string): Promise<MoodEntry[]> {
        const { data } = await supabase.from('moods').select('*').eq('user_id', userId).order('date', { ascending: false });
        return (data || []).map((m: any) => ({ id: m.id, userId: m.user_id, date: m.date, mood: m.mood as any }));
    }

    static async saveMood(userId: string, mood: 'confetti' | 'rain') {
        const { error } = await supabase.from('moods').insert({ user_id: userId, date: new Date().toISOString(), mood });
        if (error) console.error("Save Mood Failed:", error);
    }

    static async getWeeklyProgress(userId: string): Promise<{ current: number, target: number, message: string }> {
        try {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const iso = oneWeekAgo.toISOString();

            // Run queries in parallel for performance, handling potential failures individually
            const [jRes, sRes, mRes, aRes] = await Promise.all([
                supabase.from('journals').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('date', iso),
                supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'COMPLETED').gte('date', iso),
                supabase.from('moods').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('date', iso),
                supabase.from('user_art').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', iso)
            ]);

            const journalCount = jRes.count || 0;
            const sessionCount = sRes.count || 0;
            const moodCount = mRes.count || 0;
            const artCount = aRes.count || 0;

            const totalActions = journalCount + sessionCount + moodCount + artCount;
            const current = totalActions * 0.5;

            const messages = [
                "Keep going, you're doing great!",
                "Every small step counts.",
                "Consistency is key.",
                "You're prioritizing your peace.",
                "Goal crushed! Amazing work."
            ];
            const msg = current >= 10 ? messages[4] : messages[Math.min(3, Math.floor(current / 2.5))];

            return { current, target: 10, message: msg };
        } catch (e) {
            console.warn("Weekly Progress Calculation Failed", e);
            return { current: 0, target: 10, message: "Start your journey." };
        }
    }

    static async endSession(userId: string) {
        await supabase.from('active_sessions').delete().eq('user_id', userId);
        await supabase.from('session_queue').delete().eq('user_id', userId);
    }

    static async joinQueue(userId: string): Promise<number> {
        try {
            const { data, error } = await supabase.rpc('join_queue', { p_user_id: userId });
            if (error) {
                console.error("Join Queue RPC Error:", error);
                return 99;
            }
            return data !== null ? data : 99;
        } catch (e) {
            return 99;
        }
    }

    static getEstimatedWaitTime(pos: number): number {
        return Math.max(0, (pos - 1) * 3);
    }

    static async claimActiveSpot(userId: string): Promise<boolean> {
        try {
            const { data, error } = await supabase.rpc('claim_active_spot', { p_user_id: userId });
            if (error) {
                console.error("Claim Spot RPC Error:", error);
                return false;
            }
            return !!data;
        } catch (e) {
            console.error("Claim Active Spot Exception:", e);
            return false;
        }
    }

    static async sendQueueHeartbeat(userId: string) {
        await supabase.from('session_queue').update({ last_ping: new Date().toISOString() }).eq('user_id', userId);
    }

    static async getQueuePosition(userId: string): Promise<number> {
        try {
            const { data, error } = await supabase.rpc('get_client_queue_position', { p_user_id: userId });
            if (error) {
                console.warn("Queue position RPC error:", error);
                return 1;
            }
            return data;
        } catch (e) {
            console.warn("Queue position retrieval fallback:", e);
            return 1;
        }
    }

    static async sendKeepAlive(userId: string) {
        await supabase.from('active_sessions').upsert({ user_id: userId, last_ping: new Date().toISOString() });
    }

    static async deductBalance(amount: number) {
        const user = this.getUser();
        if (!user) return;
        try {
            const { data, error } = await supabase.rpc('deduct_user_balance', { p_user_id: user.id, p_amount: amount });
            if (!error && data !== null) {
                user.balance = data;
            }
        } catch (e) {
            console.error("Atomic Balance Deduction Failed:", e);
            user.balance = Math.max(0, user.balance - amount);
        }
    }

    static async saveTransaction(tx: Transaction) {
        await supabase.from('transactions').insert({
            id: tx.id,
            user_id: tx.userId,
            date: tx.date,
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
            date: feedback.date
        });
    }

    static async updateGameScore(userId: string, game: 'match' | 'cloud', score: number) {
        const user = this.getUser();
        if (!user || user.id !== userId) return;

        const currentScores = user.gameScores || { match: 0, cloud: 0 };
        const newScores = { ...currentScores, [game]: Math.max(currentScores[game] || 0, score) };

        // Optimistic update
        user.gameScores = newScores;

        const { error } = await supabase.from('users').update({ game_scores: newScores }).eq('id', userId);
        if (error) logger.error("Update Game Score Failed", userId, error);
    }

    static recordBreathSession(userId: string, duration: number) {
        logger.info("Breath session completed", `User: ${userId}, Duration: ${duration}s`);
    }


    static async deleteUser(id: string) {
        const { error } = await BaseService.invokeGateway('delete-user', { userId: id });
        if (error) throw new Error(error.message);
        await this.logout();
    }

    static async topUpWallet(amount: number, cost: number, userId?: string, paymentToken?: string) {
        const uid = userId || this.getUser()?.id;
        if (!uid) return;
        const { error } = await BaseService.invokeGateway('process-topup', { userId: uid, amount, cost, paymentToken });

        if (error) throw new Error("Transaction Failed: " + error.message);
        await this.syncUser(uid);
    }

    static saveUserSession(user: User) { this.currentUser = user; }
}




