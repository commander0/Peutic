import { User, UserRole, Transaction, MoodEntry, JournalEntry, ArtEntry, SessionFeedback, VoiceJournalEntry } from '../types';

import { supabase } from './supabaseClient';
import { BaseService } from './baseService';
import { NameValidator } from './nameValidator';
import { logger } from './logger';
import { Database } from '../types/supabase';

type UserRow = Database['public']['Tables']['users']['Row'];

export class UserService {
    private static currentUser: User | null = null;
    private static CACHE_KEY = 'peutic_user_profile';

    // ... (Cache methods remain unchanged)
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

    // ... (SWR remains unchanged)
    static async getWithSWR<T>(key: string, fetcher: () => Promise<T>, onUpdate?: (data: T) => void): Promise<T | null> {
        try {
            const cached = localStorage.getItem(key);
            const staleData = cached ? JSON.parse(cached) : null;
            fetcher().then(newData => {
                if (newData) {
                    localStorage.setItem(key, JSON.stringify(newData));
                    if (onUpdate) onUpdate(newData);
                }
            }).catch(e => console.error(`SWR revalidation failed for ${key}`, e));
            return staleData;
        } catch (e) {
            return null;
        }
    }

    static getUser(): User | null { return this.currentUser; }

    static async restoreSession(): Promise<User | null> {
        const { data: { session } } = await supabase.auth.getSession();

        // 1. No Session? Purge everything.
        if (!session?.user) {
            this.clearCache();
            return null;
        }

        // 2. Session exists. Check Cache.
        const cached = this.getCachedUser();

        // 3. Cache Mismatch? (Zombie Detection)
        if (cached && cached.id !== session.user.id) {
            console.warn("UserService: Zombie Cache Detected. Purging.");
            this.clearCache();
        }

        // 4. Always Sync with DB to be sure (Single Source of Truth)
        const syncedUser = await this.syncUser(session.user.id);

        if (syncedUser) {
            this.currentUser = syncedUser;
            return syncedUser;
        }

        // 5. DB Record Missing? (Orphaned Auth User)
        console.error("UserService: Auth Session valid but DB Record missing. Logout required.");
        await this.logout(); // Force logout to clear bad state
        return null;
    }

    static async syncUser(userId: string): Promise<User | null> {
        if (!userId) return null;
        try {
            // STRICT TYPING: Select matching the Row definition
            const response = await BaseService.withTimeout(
                supabase.from('users').select('*').eq('id', userId).maybeSingle(),
                5000,
                "User sync timeout"
            );

            // Supabase types are complex, safe cast to allow destructuring while keeping data typed below
            const { data, error } = response as any;

            if (error) {
                console.error("CRITICAL: User Sync Database Error", error);
                return null;
            }

            if (data) {
                // 'data' is now strictly typed as UserRow (partial)
                this.currentUser = this.mapUser(data as UserRow);
                this.saveUserToCache(this.currentUser);
                this.checkAchievements(this.currentUser);
                return this.currentUser;
            } else {
                console.warn("CRITICAL: User Sync Data Missing - Attempting Self-Healing", { userId });
                const session = await supabase.auth.getUser();
                if (session.data.user && session.data.user.id === userId) {
                    console.warn("Attempting Self-Healing: Force Creating User Profile over REST", { userId });

                    // FAIL-SAFE: If Trigger failed, we must insert from Client.
                    // RLS "User Insert Own" Policy allows this.
                    const metadata = session.data.user.user_metadata || {};
                    const name = metadata.full_name || metadata.name || session.data.user.email?.split('@')[0] || 'User';

                    const { error: insertError } = await supabase.from('users').insert({
                        id: userId,
                        email: session.data.user.email,
                        name: name,
                        role: 'USER', // Safe default. Use "Claim System" for Admin if needed.
                        created_at: new Date().toISOString()
                    });

                    if (insertError) {
                        console.error("Self-Healing Insert Failed", insertError);
                    } else {
                        console.info("Self-Healing Insert Success");
                    }

                    // RETRY: Fetch again (now it should exist)
                    await new Promise(r => setTimeout(r, 500));
                    const retry = await supabase.from('users').select('*').eq('id', userId).single();
                    if (retry.data) {
                        this.currentUser = this.mapUser(retry.data as UserRow);
                        return this.currentUser;
                    }

                    console.error("CRITICAL: User Sync Failed even after self-healing. DB integrity issue.");
                    return null;
                }
            }

        } catch (e) {
            logger.error("User Sync Exception", `ID: ${userId}`, e);
        }
        return null;
    }

    // ADAPTER: Snake_Case (DB) -> CamelCase (Domain)
    static mapUser(data: UserRow): User {
        // Safe Cast for JSON fields
        const scores = data.game_scores as { match: number; cloud: number } | null;
        const emailPrefs = data.email_preferences as { marketing: boolean; updates: boolean } | null;

        return {
            id: data.id,
            name: data.name || "User",
            email: data.email,
            birthday: data.birthday || undefined,
            role: (data.role as UserRole) || UserRole.USER,
            balance: data.balance || 0,
            subscriptionStatus: (data.subscription_status as any) || 'ACTIVE',
            joinedAt: data.created_at, // BRIDGE: Correct mapping
            lastLoginDate: data.last_login_date || new Date().toISOString(),
            streak: data.streak || 0,
            provider: 'email', // Default, as this isn't always in public.users
            avatar: data.avatar_url || undefined,
            avatarLocked: data.avatar_locked || false,
            emailPreferences: emailPrefs || { marketing: true, updates: true },
            themePreference: data.theme_preference || 'amber-light',
            languagePreference: data.language_preference || 'en',
            gameScores: scores || { match: 0, cloud: 0 },
            unlockedRooms: data.unlocked_rooms || []
        };
    }

    // FALLBACK REMOVED: Strict Consistency Enforced
    // static createFallbackUser(sessionUser: any): User { ... }

    // RECURRING: Subscribe to Realtime Changes
    static subscribeToUserChanges(userId: string, callback: (payload: any) => void) {
        return supabase
            .channel('public:users')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
                (payload: any) => {
                    const freshUser = this.mapUser(payload.new);
                    this.currentUser = freshUser;
                    this.saveUserToCache(freshUser);
                    callback(freshUser);
                }
            )
            .subscribe();
    }

    // REPAIR: Attempt to fix missing public.users record
    static async repairUserRecord(sessionUser: any): Promise<User | null> {
        try {
            console.log("Repair Requested: Manual Insert...", sessionUser.id);

            // DIRECT RESTORE (Bypassing Edge Function)
            const fallbackName = sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || "Buddy";

            const { error } = await supabase.from('users').insert({
                id: sessionUser.id,
                email: sessionUser.email,
                name: fallbackName,
                role: 'USER',
                balance: 0,
                provider: sessionUser.app_metadata?.provider || 'email'
            });

            if (error) {
                console.error("Direct Repair Failed:", error);
                return null;
            }

            // Retry Sync immediately
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
                    options: { data: { name: cleanName, full_name: cleanName, birthday } }
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

            // DATA SAFETY: We rely on the DB Trigger (handle_new_user) to create the public record.
            // We do NOT manual upsert here to avoid overwriting the "First User = Admin" logic.
            // syncUser() below will verify existence and self-heal if the trigger failed.

            logger.success("User Signup Initiated", `Email: ${email}`);
            return optimisticUser;
        }

        throw new Error("Failed to initialize account");
    }

    static async updateUser(user: User) {
        if (!user.id) return;
        this.currentUser = user;

        // STRICT TYPING: Ensure payload matches Database Update definition
        type UserUpdate = Database['public']['Tables']['users']['Update'];

        const payload: UserUpdate = {
            name: user.name,
            avatar_url: user.avatar,
            avatar_locked: user.avatarLocked,
            email_preferences: user.emailPreferences,
            theme_preference: user.themePreference,
            language_preference: user.languagePreference,
            last_login_date: user.lastLoginDate,
            streak: user.streak,
            game_scores: user.gameScores
        };

        const { error } = await supabase.from('users').update(payload).eq('id', user.id);
        if (error) {
            logger.error("Update Profile Failed", user.id, error);
        } else {
            // Keep cache in sync
            this.saveUserToCache(user);
        }
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
        BaseService.invokeGateway('user-update', updatedUser).catch(console.error);

        return updatedUser;
    }


    static async logout() {
        this.clearCache();
        await supabase.auth.signOut();
        this.currentUser = null;
        logger.info("User Logout", "Session cleared");
    }



    static async getUserArt(userId: string): Promise<ArtEntry[]> {
        const cacheKey = `peutic_art_${userId}`;
        const cached = localStorage.getItem(cacheKey);

        const fetcher = async () => {
            const { data } = await supabase.from('user_art')
                .select('id, user_id, image_url, prompt, created_at, title')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            return (data || []).map((a: any) => ({
                id: a.id, userId: a.user_id, imageUrl: a.image_url, prompt: a.prompt, createdAt: a.created_at, title: a.title
            }));
        };

        // If no cache, wait for fetch. Otherwise, fetch in background.
        if (!cached) {
            const data = await fetcher();
            localStorage.setItem(cacheKey, JSON.stringify(data));
            return data;
        }

        fetcher().then(data => localStorage.setItem(cacheKey, JSON.stringify(data)));
        return JSON.parse(cached);
    }

    static async saveArt(entry: ArtEntry) {
        // SECURITY: Always use the live session ID, never trust the client payload
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No active session for Art Save");

        console.log("UserService: Saving art...", entry.id);
        const { error } = await supabase.from('user_art').insert({
            id: entry.id,
            user_id: user.id, // STRICT OVERRIDE
            image_url: entry.imageUrl,
            prompt: entry.prompt,
            title: entry.title || "Untitled Masterpiece",
            created_at: entry.createdAt
        });

        if (error) {
            logger.error("Save Art Failed", user.id, error);
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
        const { data } = await supabase.from('transactions')
            .select('id, user_id, date, amount, cost, description, status')
            .eq('user_id', userId)
            .order('date', { ascending: false });
        return (data || []).map((t: any) => ({
            id: t.id, userId: t.user_id, date: t.date, amount: t.amount, cost: t.cost, description: t.description, status: t.status as any
        }));
    }

    static async getBookStats(userId: string): Promise<any> {
        const { data, error } = await supabase.rpc('get_book_stats', { p_user_id: userId });
        if (error) {
            console.error("Get Book Stats Failed", error);
            // Fallback object to preventing crashing
            return {
                isLocked: false,
                daysRemaining: 0,
                stats: { journals: 0, moods: 0, sunRatio: 0.5 },
                weather: 'sun'
            };
        }
        return data;
    }

    static async getJournals(userId: string): Promise<JournalEntry[]> {
        const cacheKey = `peutic_journals_${userId}`;
        const cached = localStorage.getItem(cacheKey);

        const fetcher = async () => {
            const { data } = await supabase.from('journals')
                .select('id, user_id, date, content')
                .eq('user_id', userId)
                .order('date', { ascending: false })
                .limit(50);
            return (data || []).map((j: any) => ({ id: j.id, userId: j.user_id, date: j.date, content: j.content }));
        };

        if (!cached) {
            const data = await fetcher();
            localStorage.setItem(cacheKey, JSON.stringify(data));
            return data;
        }

        fetcher().then(data => localStorage.setItem(cacheKey, JSON.stringify(data)));
        return JSON.parse(cached);
    }

    static async saveJournal(entry: JournalEntry) {
        const { error } = await supabase.from('journals').insert({
            id: entry.id || crypto.randomUUID(),
            user_id: entry.userId,
            date: entry.date || new Date().toISOString(),
            content: entry.content
        });
        if (error) {
            logger.error("Save Journal Failed", entry.userId, error);
            throw error;
        }
    }

    static async deleteJournal(id: string) {
        const { error } = await supabase.from('journals').delete().eq('id', id);
        if (error) {
            logger.error("Delete Journal Failed", id, error);
            throw error;
        }
    }

    static async getMoods(userId: string): Promise<MoodEntry[]> {
        const { data } = await supabase.from('moods')
            .select('id, user_id, date, mood')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(50);
        return (data || []).map((m: any) => ({ id: m.id, userId: m.user_id, date: m.date, mood: m.mood as any }));
    }

    static async saveMood(userId: string, mood: 'confetti' | 'rain') {
        const { error } = await supabase.from('moods').insert({
            user_id: userId,
            date: new Date().toISOString(),
            mood: mood
        });
        if (error) console.error("Save Mood Failed:", error);
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
        await BaseService.invokeGateway('queue-heartbeat', { userId });
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
        await BaseService.invokeGateway('session-keepalive', { userId });
    }


    static async addBalance(amount: number, reason: string): Promise<boolean> {
        const user = this.getUser();
        if (!user) return false;

        // Optimistic Update
        const previousBalance = user.balance;
        user.balance = (user.balance || 0) + amount;
        this.saveUserToCache(user);

        try {
            await BaseService.invokeGateway('process-topup', {
                userId: user.id,
                amount: amount,
                cost: 0,
                description: reason
            });
            return true;
        } catch (e) {
            console.error("Add Balance Failed", e);
            user.balance = previousBalance;
            this.saveUserToCache(user);
            return false;
        }
    }

    static async deductBalance(amount: number, reason: string = "Game Action"): Promise<boolean> {
        const user = this.getUser();
        if (!user) return false;

        // Optional Gamification Logic
        if (user.gamificationEnabled === false) {
            console.log(`[Balance] Skipped deduction (${amount}m) - Gamification Disabled`);
            return true;
        }

        // --- NEW SAFETY CHECK: Prevent Negative Balance ---
        if (user.balance < amount) {
            console.warn(`[Balance] Denied: Insufficient funds. Need ${amount}, have ${user.balance}`);
            return false;
        }

        // Optimistic UI Update
        const previousBalance = user.balance;
        user.balance = Math.max(0, user.balance - amount);
        this.saveUserToCache(user);

        // Notify UI (in a real app, use an event bus)
        console.log(`[Balance] Deducting ${amount} mins for ${reason}. New Balance: ${user.balance}`);

        try {
            // Use Gateway for secure transaction
            const { error, data } = await BaseService.invokeGateway('process-topup', {
                userId: user.id,
                amount: -amount, // Negative amount for deduction
                cost: 0,
                description: reason
            });

            if (error) {
                console.error("Balance Deduction Failed", error);
                // Revert
                user.balance = previousBalance;
                this.saveUserToCache(user);
                return false;
            }

            if (data?.newBalance !== undefined) {
                user.balance = data.newBalance;
                this.saveUserToCache(user);
            }
            return true;

        } catch (e) {
            console.error("Balance Deduction Exception", e);
            user.balance = previousBalance;
            this.saveUserToCache(user);
            return false;
        }
    }

    static async saveTransaction(tx: Transaction) {
        const { error } = await supabase.from('transactions').insert({
            id: tx.id,
            user_id: tx.userId,
            date: tx.date || new Date().toISOString(),
            amount: tx.amount,
            cost: tx.cost,
            description: tx.description,
            status: tx.status
        });
        if (error) logger.error("Save Transaction Failed", tx.id, error);
    }

    static async saveFeedback(feedback: SessionFeedback) {
        const { error } = await supabase.from('feedback').insert({
            user_id: feedback.userId,
            companion_name: feedback.companionName,
            rating: feedback.rating,
            tags: feedback.tags,
            date: feedback.date || new Date().toISOString()
        });
        if (error) logger.error("Save Feedback Failed", feedback.userId, error);
    }

    static async updateGameScore(userId: string, game: 'match' | 'cloud', score: number) {
        const user = this.getUser();
        if (!user || user.id !== userId) return;

        // Optimistic update
        const currentScores = user.gameScores || { match: 0, cloud: 0 };
        let newScore = score;

        if (game === 'match') {
            // Fewer moves is better. Only update if current is 0 or new score is lower.
            const current = currentScores.match || 0;
            newScore = (current === 0) ? score : Math.min(current, score);
        } else {
            // Higher height/score is better.
            newScore = Math.max(currentScores.cloud || 0, score);
        }

        const newScores = { ...currentScores, [game]: newScore };
        user.gameScores = newScores;

        const { error } = await supabase.from('users').update({ game_scores: newScores }).eq('id', userId);
        if (error) {
            logger.error("Update Game Score Failed", userId, error);
        }
    }

    static recordBreathSession(userId: string, duration: number) {
        logger.info("Breath session completed", `User: ${userId}, Duration: ${duration}s`);
    }


    static async deleteUser(id: string) {
        try {
            // Priority 1: Instant atomic database wipe (Deletes Auth record which then cascades)
            const { error: rpcError } = await supabase.rpc('request_account_deletion');
            if (rpcError) throw rpcError;

            // Priority 2: Cleanup Auth via Gateway as backup (ensures session invalidation)
            await BaseService.invokeGateway('delete-user', { userId: id }).catch(e => {
                logger.warn("Gateway cleanup skipped - database wipe was successful", e.message);
            });
        } catch (e) {
            logger.error("Total system wipe failed", id, e);
            throw e;
        }
        await this.logout();
    }

    // --- ACHIEVEMENTS ---
    private static lastAchievementCheck: number = 0;

    static async checkAchievements(user: User) {
        if (!user || !user.id) return;

        // THROTTLE: Only check every 5 minutes
        if (Date.now() - this.lastAchievementCheck < 5 * 60 * 1000) return;
        this.lastAchievementCheck = Date.now();

        try {
            // 1. Fetch Definition & Status
            const { data: allAchievements } = await supabase.from('achievements').select('*');
            const { data: unlocked } = await supabase.from('user_achievements').select('achievement_id').eq('user_id', user.id);

            if (!allAchievements) return;
            const unlockedIds = new Set(unlocked?.map((u: any) => u.achievement_id));
            const newUnlocks: string[] = [];

            // 2. Gather Stats (Parallel for performance)
            const [gRes, pRes, jRes] = await Promise.all([
                supabase.from('garden_state').select('level').eq('user_id', user.id).maybeSingle(),
                supabase.from('pocket_pets').select('level').eq('user_id', user.id).maybeSingle(),
                supabase.from('voice_journals').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
            ]);

            const gardenLevel = gRes.data?.level || 1;
            const animaLevel = pRes.data?.level || 1;
            const journalCount = jRes.count || 0;

            // 3. Check Triggers
            for (const ach of allAchievements) {
                if (unlockedIds.has(ach.id)) continue;

                let shouldUnlock = false;
                switch (ach.code) {
                    case 'FIRST_STEP': shouldUnlock = true; break; // Triggered on check (login)
                    case 'STREAK_3': shouldUnlock = user.streak >= 3; break;
                    case 'STREAK_7': shouldUnlock = user.streak >= 7; break;
                    case 'GARDEN_5': shouldUnlock = gardenLevel >= 5; break;
                    case 'ANIMA_5': shouldUnlock = animaLevel >= 5; break;
                    case 'JOURNAL_5': shouldUnlock = journalCount >= 5; break;
                }

                if (shouldUnlock) {
                    await supabase.from('user_achievements').insert({ user_id: user.id, achievement_id: ach.id });
                    newUnlocks.push(ach.title);
                }
            }

            // 4. Notify
            if (newUnlocks.length > 0) {
                // In a real app, we'd trigger a specialized Toast or Modal here via a callback or event
                console.log("New Achievements Unlocked:", newUnlocks.join(", "));
                // For now, we rely on the component polling or re-fetching to see the badge
            }

        } catch (e) {
            console.error("Achievement Check Failed", e);
        }
    }




    static async topUpWallet(amount: number, cost: number, userId?: string, paymentToken?: string) {
        const uid = userId || this.getUser()?.id;
        if (!uid) return;
        const { error } = await BaseService.invokeGateway('process-topup', { userId: uid, amount, cost, paymentToken });

        if (error) throw new Error("Transaction Failed: " + error.message);
        await this.syncUser(uid);
    }

    static saveUserSession(user: User) { this.currentUser = user; }

    static async getWeeklyProgress(userId: string): Promise<{ current: number, message: string }> {
        const { data, error } = await supabase.rpc('get_weekly_activity_count', { p_user_id: userId });
        if (error) {
            console.warn("Failed to fetch weekly progress", error);
            return { current: 0, message: "Start your journey." };
        }
        const count = (data || 0) * 0.5;
        let message = "Start your journey.";
        if (count > 0) message = "Good start!";
        if (count >= 3) message = "Building momentum!";
        if (count >= 5) message = "Halfway there!";
        if (count >= 8) message = "So close!";
        if (count >= 10) message = "🔥 You are on a hot streak!";

        return { current: count, message };
    }

    // --- VOICE JOURNALS ---
    static async getVoiceJournals(userId: string): Promise<VoiceJournalEntry[]> {
        const cacheKey = `peutic_voice_${userId}`;
        const cached = localStorage.getItem(cacheKey);

        const fetcher = async () => {
            const { data, error } = await supabase.from('voice_journals')
                .select('id, user_id, audio_url, duration_seconds, title, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (error) {
                console.error("Error fetching voice journals:", error);
                return [];
            }
            return (data || []).map((d: any) => ({
                id: d.id,
                userId: d.user_id,
                audioUrl: d.audio_url,
                durationSeconds: d.duration_seconds,
                title: d.title,
                createdAt: d.created_at
            }));
        };

        if (!cached) {
            const data = await fetcher();
            localStorage.setItem(cacheKey, JSON.stringify(data));
            return data;
        }

        fetcher().then(data => localStorage.setItem(cacheKey, JSON.stringify(data)));
        return JSON.parse(cached);
    }

    static async saveVoiceJournal(entry: VoiceJournalEntry) {
        const { error } = await supabase.from('voice_journals').insert({
            id: entry.id,
            user_id: entry.userId,
            audio_url: entry.audioUrl,
            duration_seconds: entry.durationSeconds,
            title: entry.title,
            created_at: entry.createdAt
        });
        if (error) throw error;
    }

    static async deleteVoiceJournal(id: string) {
        const { error } = await supabase.from('voice_journals').delete().eq('id', id);
        if (error) throw error;
    }

    // --- MOOD PREDICTION (DAILY PULSE) ---
    static async predictMoodRisk(userId: string): Promise<boolean> {
        try {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            const { data, error } = await supabase
                .from('moods')
                .select('mood')
                .eq('user_id', userId)
                .gte('date', threeDaysAgo.toISOString());

            if (error || !data || data.length < 3) return false;

            const rainCount = data.filter((m: any) => m.mood === 'rain' || m.mood === 'Anxious' || m.mood === 'Sad').length;
            return (rainCount / data.length) > 0.5;
        } catch (e) {
            console.error("Mood Prediction Failed", e);
            return false;
        }
    }
}




