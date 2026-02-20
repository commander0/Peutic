import { User, UserRole, Transaction, MoodEntry, JournalEntry, ArtEntry, SessionFeedback, VoiceJournalEntry, Achievement } from '../types';

import { supabase } from './supabaseClient';
import { BaseService } from './baseService';
import { NameValidator } from './nameValidator';
import { logger } from './logger';
import { Database } from '../types/supabase';
import { CacheService } from './cacheService';
import { debounce } from '../utils/debounce';

type UserRow = Database['public']['Tables']['users']['Row'];

import { OfflineManager } from './OfflineManager';

export class UserService {
    private static currentUser: User | null = null;
    private static CACHE_KEY = 'peutic_user_profile';

    // OFFLINE SYNC HANDLER
    static {
        if (typeof window !== 'undefined') {
            window.addEventListener('peutic-sync-offline', async (e: any) => {
                const requests = e.detail.requests as any[];
                for (const req of requests) {
                    try {
                        console.log(`[UserService] Syncing ${req.type}...`);
                        if (req.type === 'JOURNAL') await this.saveJournal(req.payload);
                        if (req.type === 'MOOD') await this.saveMood(req.payload.userId, req.payload.mood);
                        // Voice is harder due to blob, assuming base64 or skipped for now
                    } catch (err) {
                        console.error(`[UserService] Sync Failed for ${req.id}`, err);
                        // Re-queue if it's a network error? For now, we assume if it fails here it might be permanent or re-try later manually.
                    }
                }
            });
        }
    }

    // ... (Cache methods)
    static async saveUserToCache(user: User) {
        await CacheService.set(this.CACHE_KEY, user, 3600 * 24); // 24h TTL
    }

    static async clearCache() {
        await CacheService.del(this.CACHE_KEY);
        await CacheService.del('peutic_companions');
        await CacheService.del('peutic_settings');
    }

    static async getCachedUser(): Promise<User | null> {
        return await CacheService.get<User>(this.CACHE_KEY);
    }

    static async getWithSWR<T>(key: string, fetcher: () => Promise<T>, onUpdate?: (data: T) => void): Promise<T | null> {
        try {
            const staleData = await CacheService.get<T>(key);

            // Background Fetch
            fetcher().then(async newData => {
                if (newData) {
                    await CacheService.set(key, newData);
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
        let { data: { session }, error } = await supabase.auth.getSession();

        // Retry once if session is null but no error (sometimes happens on weak connections)
        if (!session && !error) {
            const refresh = await supabase.auth.refreshSession();
            session = refresh.data.session;
        }

        if (!session?.user) {
            this.clearCache();
            return null;
        }

        // NOTE: getCachedUser is now async
        const cached = await this.getCachedUser();

        // ZOMBIE CHECK: Only purge if IDs definitely mismatch
        if (cached && cached.id !== session.user.id) {
            console.warn("UserService: Zombie Cache Detected (User Mismatch). Purging.");
            this.clearCache();
        }

        // Try to return cached user immediately for speed, then background sync
        if (cached && cached.id === session.user.id) {
            // Background sync
            this.syncUser(session.user.id).then(u => {
                if (u) this.currentUser = u;
            });
            this.currentUser = cached;
            return cached;
        }

        const syncedUser = await this.syncUser(session.user.id);

        if (syncedUser) {
            this.currentUser = syncedUser;
            this.seedAchievements();
            return syncedUser;
        }

        console.error("UserService: Auth Session valid but DB Record missing. Logout required.");
        await this.logout();
        return null;
    }

    static async syncUser(userId: string): Promise<User | null> {
        if (!userId) return null;
        try {
            const response = await BaseService.withTimeout(
                supabase.from('users').select('*').eq('id', userId).maybeSingle(),
                5000,
                "User sync timeout"
            );

            const { data, error } = response as any;

            if (error) {
                console.error("CRITICAL: User Sync Database Error", error);
                return null;
            }

            if (data) {
                this.currentUser = this.mapUser(data as UserRow);
                this.saveUserToCache(this.currentUser);
                this.checkAchievements(this.currentUser);
                return this.currentUser;
            } else {
                console.warn("CRITICAL: User Sync Data Missing - Attempting Self-Healing", { userId });
                const session = await supabase.auth.getUser();
                if (session.data.user && session.data.user.id === userId) {
                    console.warn("Attempting Self-Healing: Force Creating User Profile over REST", { userId });

                    const metadata = session.data.user.user_metadata || {};
                    const name = metadata.full_name || metadata.name || session.data.user.email?.split('@')[0] || 'User';

                    const { error: insertError } = await supabase.from('users').insert({
                        id: userId,
                        email: session.data.user.email,
                        name: name,
                        role: 'USER',
                        created_at: new Date().toISOString()
                    });

                    if (insertError) {
                        console.error("Self-Healing Insert Failed", insertError);
                    } else {
                        console.info("Self-Healing Insert Success");
                    }

                    await new Promise(r => setTimeout(r, 500));
                    const retry = await supabase.from('users').select('*').eq('id', userId).single();
                    if (retry.data) {
                        this.currentUser = this.mapUser(retry.data as UserRow);
                        return this.currentUser;
                    }

                    return null;
                }
            }

        } catch (e) {
            logger.error("User Sync Exception", `ID: ${userId}`, e);
        }
        return null;
    }

    static mapUser(data: UserRow): User {
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
            joinedAt: data.created_at,
            lastLoginDate: data.last_login_date || new Date().toISOString(),
            streak: data.streak || 0,
            provider: 'email',
            avatar: data.avatar_url || undefined,
            avatarLocked: data.avatar_locked || false,
            emailPreferences: emailPrefs || { marketing: true, updates: true },
            themePreference: data.theme_preference || 'amber-light',
            languagePreference: data.language_preference || 'en',
            gameScores: scores || { match: 0, cloud: 0 },
            unlockedRooms: data.unlocked_rooms || [],
            unlockedDecor: data.unlocked_decor || [],
            unlockedAchievements: []
        };
    }

    static subscribeToUserChanges(userId: string, callback: (payload: any) => void) {
        // Debounce the callback to avoid UI thrashing on frequent updates (e.g. game scores)
        const debouncedCallback = debounce((payload: any) => {
            const freshUser = this.mapUser(payload.new);
            this.currentUser = freshUser;
            this.saveUserToCache(freshUser);
            callback(freshUser);
        }, 500); // 500ms debounce

        return supabase
            .channel('public:users')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
                (payload: any) => debouncedCallback(payload)
            )
            .subscribe();
    }

    static async repairUserRecord(sessionUser: any): Promise<User | null> {
        try {
            console.log("Repair Requested: Manual Insert...", sessionUser.id);
            const fallbackName = sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || "Buddy";
            const { error } = await supabase.from('users').insert({
                id: sessionUser.id,
                email: sessionUser.email,
                name: fallbackName,
                role: 'USER',
                balance: 0,
                provider: sessionUser.app_metadata?.provider || 'email'
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
                // Avatar Rotation Hook
                if (!user.avatarLocked) {
                    const newAvatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${Date.now()}-${user.id.substring(0, 5)}`;
                    user.avatar = newAvatar;
                    // We don't await this update to avoid blocking login flow
                    this.updateUser(user).catch(console.error);
                }

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

            logger.success("User Signup Initiated", `Email: ${email}`);
            return optimisticUser;
        }
        throw new Error("Failed to initialize account");
    }

    static async updateUser(user: User) {
        if (!user.id) return;
        this.currentUser = user;

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
            game_scores: user.gameScores,
            unlocked_rooms: user.unlockedRooms
        };

        const { error } = await supabase.from('users').update(payload).eq('id', user.id);
        if (error) {
            logger.error("Update Profile Failed", user.id, error);
        } else {
            this.saveUserToCache(user);
        }
    }

    static async sendKeepAlive(userId: string) {
        await BaseService.invokeGateway('session-keepalive', { userId });
    }

    static async addBalance(amount: number, reason: string): Promise<boolean> {
        const user = this.getUser();
        if (!user) return false;

        const previousBalance = user.balance;
        user.balance = (user.balance || 0) + amount;
        await this.saveUserToCache(user);

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
            await this.saveUserToCache(user);
            return false;
        }
    }

    static async deductBalance(amount: number, reason: string = "Game Action"): Promise<boolean> {
        const user = this.getUser();
        if (!user) return false;

        if (user.gamificationEnabled === false) return true;

        if (user.balance < amount) {
            console.warn(`[Balance] Denied: Insufficient funds. Need ${amount}, have ${user.balance}`);
            return false;
        }

        const previousBalance = user.balance;
        user.balance = Math.max(0, user.balance - amount);
        await this.saveUserToCache(user);

        try {
            const { error, data } = await BaseService.invokeGateway('process-topup', {
                userId: user.id,
                amount: -amount,
                cost: 0,
                description: reason
            });

            if (error) {
                console.error("Balance Deduction Failed", error);
                user.balance = previousBalance;
                await this.saveUserToCache(user);
                return false;
            }

            if (data?.newBalance !== undefined) {
                user.balance = data.newBalance;
                await this.saveUserToCache(user);

                if (user.balance >= 100) {
                    this.unlockAchievement(user.id, 'WEALTHY_100');
                }
            }
            return true;

        } catch (e) {
            console.error("Balance Deduction Exception", e);
            user.balance = previousBalance;
            await this.saveUserToCache(user);
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

        const currentScores = user.gameScores || { match: 0, cloud: 0 };
        let newScore = score;

        if (game === 'match') {
            const current = currentScores.match || 0;
            newScore = (current === 0) ? score : Math.min(current, score);
        } else {
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
            const { error: rpcError } = await supabase.rpc('request_account_deletion');
            if (rpcError) throw rpcError;

            await BaseService.invokeGateway('delete-user', { userId: id }).catch(e => {
                logger.warn("Gateway cleanup skipped - database wipe was successful", e.message);
            });
        } catch (e) {
            logger.error("Total system wipe failed", id, e);
            throw e;
        }
        await this.logout();
    }

    private static lastAchievementCheck: number = 0;

    static async getAchievements(): Promise<Achievement[]> {
        const { data, error } = await supabase.from('achievements').select('*');
        if (error) {
            console.error("Failed to fetch achievements", error);
            return [];
        }
        return data as Achievement[];
    }

    static async checkAchievements(user: User) {
        if (!user || !user.id) return;

        if (Date.now() - this.lastAchievementCheck < 5 * 60 * 1000) return;
        this.lastAchievementCheck = Date.now();

        try {
            const { data: allAchievements } = await supabase.from('achievements').select('*');
            const { data: unlocked } = await supabase.from('user_achievements').select('achievement_id').eq('user_id', user.id);

            if (!allAchievements) return;
            const unlockedIds = new Set(unlocked?.map((u: any) => u.achievement_id));
            const newUnlocks: string[] = [];

            const [gRes, pRes, jRes] = await Promise.all([
                supabase.from('garden_state').select('level').eq('user_id', user.id).maybeSingle(),
                supabase.from('pocket_pets').select('level').eq('user_id', user.id).maybeSingle(),
                supabase.from('voice_journals').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
            ]);

            const gardenLevel = gRes.data?.level || 1;
            const animaLevel = pRes.data?.level || 1;
            const journalCount = jRes.count || 0;

            for (const ach of allAchievements) {
                if (unlockedIds.has(ach.id)) continue;

                let shouldUnlock = false;
                switch (ach.code) {
                    case 'FIRST_STEP': shouldUnlock = true; break;
                    case 'STREAK_3': shouldUnlock = user.streak >= 3; break;
                    case 'STREAK_7': shouldUnlock = user.streak >= 7; break;
                    case 'GARDEN_5': shouldUnlock = gardenLevel >= 5; break;
                    case 'ANIMA_5': shouldUnlock = animaLevel >= 5; break;
                    case 'JOURNAL_5': shouldUnlock = journalCount >= 5; break;
                }

                if (shouldUnlock) {
                    await this.unlockAchievement(user.id, ach.code);
                    newUnlocks.push(ach.title);
                }
            }

            if (newUnlocks.length > 0) {
                console.log("New Achievements Unlocked:", newUnlocks.join(", "));
            }

        } catch (e) {
            console.error("Achievement Check Failed", e);
        }
    }

    static async unlockAchievement(userId: string, code: string): Promise<Achievement | null> {
        if (!userId) return null;

        try {
            const { data: achievement, error: achError } = await supabase
                .from('achievements')
                .select('*')
                .eq('code', code)
                .single();

            if (achError || !achievement) return null;

            const { data: existing } = await supabase
                .from('user_achievements')
                .select('id')
                .eq('user_id', userId)
                .eq('achievement_id', achievement.id)
                .maybeSingle();

            if (existing) return null;

            const { error: insertError } = await supabase
                .from('user_achievements')
                .insert({ user_id: userId, achievement_id: achievement.id });

            if (insertError) throw insertError;

            logger.info("Achievement Unlocked!", JSON.stringify({ userId, code, title: achievement.title }));

            return achievement as Achievement;

        } catch (e) {
            console.error("Unlock achievement failed", e);
            return null;
        }
    }

    static checkAndIncrementStreak(user: User): User {
        const today = new Date().toISOString().split('T')[0];
        const lastLogin = user.lastLoginDate ? user.lastLoginDate.split('T')[0] : null;

        let newStreak = user.streak;

        if (lastLogin === today) {
            return user;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];

        if (lastLogin === yesterdayString) {
            newStreak += 1;
        } else {
            newStreak = 1;
        }

        if (newStreak === 3) this.unlockAchievement(user.id, 'STREAK_3');
        if (newStreak === 7) this.unlockAchievement(user.id, 'STREAK_7');

        const updatedUser = { ...user, streak: newStreak, lastLoginDate: new Date().toISOString() };
        BaseService.invokeGateway('user-update', updatedUser).catch(console.error);

        return updatedUser;
    }

    static async updateUserPartial(userId: string, updates: Partial<User>): Promise<User | null> {
        try {
            // Map our frontend keys to DB columns
            const dbUpdates: any = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.unlockedRooms !== undefined) dbUpdates.unlocked_rooms = updates.unlockedRooms;
            if (updates.unlockedDecor !== undefined) dbUpdates.unlocked_decor = updates.unlockedDecor;
            if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
            if (updates.themePreference !== undefined) dbUpdates.theme_preference = updates.themePreference;

            const { data, error } = await supabase
                .from('users')
                .update(dbUpdates)
                .eq('id', userId)
                .select('*')
                .single();

            if (error) {
                console.error("Failed to update user", error);
                return null;
            }

            const freshUser = this.mapUser(data as UserRow);
            if (this.currentUser && this.currentUser.id === userId) {
                this.currentUser = freshUser;
                this.saveUserToCache(freshUser);
            }
            return freshUser;

        } catch (e) {
            console.error("updateUser exception", e);
            return null;
        }
    }

    static async logout() {
        this.clearCache();
        await supabase.auth.signOut();
        this.currentUser = null;
        logger.info("User Logout", "Session cleared");
    }

    static async getUserArt(userId: string): Promise<ArtEntry[]> {
        const cacheKey = `peutic_art_${userId}`;
        const cached = await CacheService.get<ArtEntry[]>(cacheKey);

        const fetcher = async () => {
            const { data } = await supabase.from('user_art')
                .select('id, user_id, image_url, prompt, created_at, title')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            return (data || []).map((a: any) => ({
                id: a.id, userId: a.user_id, imageUrl: a.image_url, prompt: a.prompt, createdAt: a.created_at, title: a.title
            }));
        };

        if (!cached) {
            const data = await fetcher();
            await CacheService.set(cacheKey, data, 3600); // 1h Cache
            return data;
        }

        // Background update
        fetcher().then(async data => await CacheService.set(cacheKey, data, 3600));
        return cached;
    }

    static async saveArt(entry: ArtEntry) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No active session for Art Save");

        const { error } = await supabase.from('user_art').insert({
            id: entry.id,
            user_id: user.id,
            image_url: entry.imageUrl,
            prompt: entry.prompt,
            title: entry.title || "Untitled Masterpiece",
            created_at: entry.createdAt
        });

        if (error) {
            logger.error("Save Art Failed", user.id, error);
            throw error;
        }
        // Invalidate Cache
        await CacheService.del(`peutic_art_${user.id}`);
    }

    static async deleteArt(id: string) {
        const { error } = await supabase.from('user_art').delete().eq('id', id);
        if (error) {
            logger.error("Delete Art Failed", id, error);
            throw error;
        }
        // Invalidate Cache
        const user = this.getUser();
        if (user) await CacheService.del(`peutic_art_${user.id}`);
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
        const cached = await CacheService.get<JournalEntry[]>(cacheKey);

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
            await CacheService.set(cacheKey, data, 3600);
            return data;
        }

        fetcher().then(async data => await CacheService.set(cacheKey, data, 3600));
        return cached;
    }

    static async saveJournal(entry: JournalEntry) {
        try {
            const { error } = await supabase.from('journals').insert({
                user_id: entry.userId,
                date: entry.date,
                content: entry.content
            });

            if (error) throw error;

            const count = await supabase.from('journals').select('id', { count: 'exact', head: true }).eq('user_id', entry.userId);
            if ((count.count || 0) >= 5) {
                this.unlockAchievement(entry.userId, 'JOURNAL_5');
            }
        } catch (e) {
            console.error("Save Journal Failed (Queuing Offline)", e);
            OfflineManager.queueRequest('JOURNAL', entry);
            // Optionally notify UI of offline state
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

    static async saveMood(userId: string, mood: 'confetti' | 'rain' | 'Anxious' | 'Sad') {
        try {
            const { error } = await supabase.from('moods').insert({
                user_id: userId,
                date: new Date().toISOString(),
                mood: mood
            });
            if (error) throw error;
        } catch (e) {
            console.error("Save Mood Failed (Queuing Offline)", e);
            OfflineManager.queueRequest('MOOD', { userId, mood });
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
        const cached = await CacheService.get<VoiceJournalEntry[]>(cacheKey);

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
            await CacheService.set(cacheKey, data, 3600);
            return data;
        }

        fetcher().then(async data => await CacheService.set(cacheKey, data, 3600));
        return cached || [];
    }

    static async saveVoiceJournal(entry: VoiceJournalEntry) {
        const { error } = await supabase.from('voice_journals').insert({
            user_id: entry.userId,
            audio_url: entry.audioUrl,
            duration_seconds: entry.durationSeconds,
            title: entry.title,
            created_at: entry.createdAt || new Date().toISOString()
        });

        if (error) {
            console.error("Save Voice Journal Failed", error);
            throw error;
        }

        const count = await supabase.from('voice_journals').select('id', { count: 'exact', head: true }).eq('user_id', entry.userId);
        if ((count.count || 0) >= 5) {
            this.unlockAchievement(entry.userId, 'JOURNAL_5');
        }
    }

    static async deleteVoiceJournal(id: string) {
        const { error } = await supabase.from('voice_journals').delete().eq('id', id);
        if (error) throw error;
    }

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

    static async seedAchievements() {
        const newAchievements = [
            { code: 'WEALTHY_100', title: 'Abundance', description: 'Accumulate a balance of 100m.', icon_name: 'Star', xp_reward: 50 },
            { code: 'EXPLORER', title: 'Seeker', description: 'Unlock a Sanctuary Room.', icon_name: 'Zap', xp_reward: 25 },
            { code: 'SESSION_1', title: 'Connection', description: 'Complete your first session.', icon_name: 'Heart', xp_reward: 20 },
            { code: 'JOURNAL_5', title: 'Voice of Truth', description: 'Record 5 Voice Journals.', icon_name: 'Mic', xp_reward: 30 }
        ];

        const { error } = await supabase.from('achievements').upsert(newAchievements, { onConflict: 'code', ignoreDuplicates: true });
        if (error) console.error("Failed to seed achievements", error);
    }
}
