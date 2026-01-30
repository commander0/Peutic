
import { GlobalSettings, SystemLog, User, Companion, Transaction } from '../types';
import { supabase } from './supabaseClient';
import { BaseService } from './baseService';

import { logger } from './logger';
import { UserService } from './userService';

export class AdminService {
    private static CACHE_KEY = 'peutic_global_settings';
    private static settingsCache: GlobalSettings = (() => {
        try {
            const cached = localStorage.getItem('peutic_global_settings');
            if (cached) return JSON.parse(cached);
        } catch (e) { }
        return {
            pricePerMinute: 1.99,
            saleMode: false,
            maintenanceMode: false,
            allowSignups: true,
            siteName: 'Peutic',
            maxConcurrentSessions: 15,
            multilingualMode: true,
            broadcastMessage: '',
            dashboardBroadcastMessage: ''
        };
    })();


    static getSettings(): GlobalSettings { return this.settingsCache; }

    static async syncGlobalSettings(): Promise<GlobalSettings> {
        try {
            const fields = 'price_per_minute, sale_mode, allow_signups, site_name, broadcast_message, dashboard_broadcast_message, max_concurrent_sessions, multilingual_mode, maintenance_mode';
            const { data, error } = await supabase.from('global_settings')
                .select(fields)
                .eq('id', 1)
                .single();
            if (data && !error) {
                const settingsData = data as any;
                this.settingsCache = {
                    pricePerMinute: settingsData.price_per_minute,
                    saleMode: settingsData.sale_mode,
                    allowSignups: settingsData.allow_signups,
                    siteName: settingsData.site_name,
                    broadcastMessage: settingsData.broadcast_message,
                    dashboardBroadcastMessage: settingsData.dashboard_broadcast_message,
                    maxConcurrentSessions: settingsData.max_concurrent_sessions,
                    multilingualMode: settingsData.multilingual_mode,
                    maintenanceMode: settingsData.maintenance_mode
                };
                localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.settingsCache));
            }
        } catch (e) {
            console.warn("Settings sync failed", e);
        }
        return this.settingsCache;
    }

    static async saveSettings(settings: GlobalSettings) {
        this.settingsCache = settings;
        const { error } = await BaseService.invokeGateway('system/settings-save', { settings });
        if (!error) {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(settings));
        }
        if (error) logger.error("Save Settings via Gateway Failed", "", error);
    }

    static async getSystemLogs(): Promise<SystemLog[]> {
        const cacheKey = 'peutic_admin_logs';
        const cached = localStorage.getItem(cacheKey);

        const fetcher = async () => {
            const { data, error } = await supabase.from('system_logs')
                .select('id, timestamp, type, event, details')
                .order('timestamp', { ascending: false })
                .limit(200);
            if (error) {
                logger.error("getSystemLogs Failed", "", error);
                return [];
            }
            return (data || []) as SystemLog[];
        };

        if (cached) {
            fetcher().then(data => localStorage.setItem(cacheKey, JSON.stringify(data)));
            return JSON.parse(cached);
        }

        const data = await fetcher();
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
    }



    static async getAllUsers(): Promise<User[]> {
        const cacheKey = 'peutic_admin_users';
        const cached = localStorage.getItem(cacheKey);

        const fetcher = async () => {
            const fields = 'id, name, email, birthday, role, balance, subscription_status, created_at, last_login_date, streak, provider, avatar_url, avatar_locked, email_preferences, theme_preference, language_preference, game_scores';
            const { data, error } = await supabase.from('users').select(fields).order('created_at', { ascending: false });
            if (error) {
                logger.warn("getAllUsers Error", error.message);
                return [];
            }
            return (data || []).map(UserService.mapUser);
        };

        if (cached) {
            fetcher().then(data => localStorage.setItem(cacheKey, JSON.stringify(data)));
            return JSON.parse(cached);
        }

        const data = await fetcher();
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
    }

    static async deleteUser(userId: string) {
        try {
            const response = await BaseService.invokeGateway('admin-delete-user', { userId });
            if (response?.error) {
                logger.error("Delete User Gateway Error", response.error);
                throw new Error(response.error);
            }
            logger.security("User Deleted", `ID: ${userId}`);
        } catch (e: any) {
            logger.error("Delete User Failed", userId, e);
            throw e; // Rethrow to show in UI
        }
    }

    static async updateUserStatus(userId: string, status: 'ACTIVE' | 'BANNED' | 'TRIAL') {
        const { error } = await BaseService.invokeGateway('users/status-update', { userId, status });
        if (error) throw error;
        logger.info("User Status Updated", `ID: ${userId}, Status: ${status}`);
    }



    static async broadcastMessage(message: string) {
        const data = await BaseService.invokeGateway('system/broadcast-public', { message });
        this.settingsCache.broadcastMessage = message;
        logger.info("Global Broadcast Sent", message);
        return data;
    }

    static async broadcastDashboardMessage(message: string) {
        const data = await BaseService.invokeGateway('system/broadcast-dashboard', { message });
        this.settingsCache.dashboardBroadcastMessage = message;
        logger.info("Dashboard Broadcast Sent", message);
        return data;
    }

    static async getStripeStats() {
        const { data, error } = await BaseService.invokeGateway('admin-stripe-stats', {});
        if (error) throw error;
        return data;
    }

    static async getSafetyAlerts(): Promise<any[]> {
        return await BaseService.invokeGateway('admin-safety-alerts');
    }

    static async getActiveSessionCount(): Promise<number> {
        // Run cleanup first
        try { await supabase.rpc('cleanup_stale_sessions'); } catch (e) { }
        const { count } = await supabase.from('active_sessions').select('*', { count: 'exact', head: true });
        return count || 0;
    }

    static async getQueueLength(): Promise<number> {
        const { count } = await supabase.from('session_queue').select('*', { count: 'exact', head: true });
        return count || 0;
    }

    static async resetAllUsers() {
        await BaseService.invokeGateway('admin-reset-system');
        logger.security("System Reset", "All non-admin users purged");
    }

    static async getAdminLockoutStatus(): Promise<number> {
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const { count } = await supabase.from('system_logs').select('*', { count: 'exact', head: true }).eq('type', 'SECURITY').eq('event', 'Admin Login Failed').gte('timestamp', fifteenMinsAgo);
        return (count || 0) >= 5 ? 15 : 0;
    }

    static async recordAdminFailure() {
        await BaseService.invokeGateway('log-event', {
            type: 'SECURITY',
            event: 'Admin Login Failed',
            details: 'Invalid credentials or key'
        });
    }

    static async resetAdminFailure() {
        // Implementation can be added if needed, e.g., logging a success event
    }

    static async hasAdmin(): Promise<boolean> {
        const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'ADMIN');
        return (count || 0) > 0;
    }

    static async forceVerifyEmail(email: string): Promise<boolean> {
        const { data, error } = await BaseService.invokeGateway('admin-auto-verify', { email });
        return !error && data?.success;
    }

    static async createRootAdmin(email: string, password?: string, masterKey?: string): Promise<User> {
        // 1. Sign Up
        const { data, error } = await supabase.auth.signUp({
            email,
            password: password || 'PeuticDefault123!',
            options: {
                data: { full_name: 'Root Admin' }
            }
        });

        if (error || !data.user) throw new Error(error?.message || "Sign up failed");

        // 2. Claim Admin Rights via RPC (using User ID directly, no session needed)
        if (masterKey) {
            const { data: claimed, error: claimError } = await supabase.rpc('claim_system_access', {
                p_user_id: data.user.id,
                p_master_key: masterKey
            });

            if (claimError) {
                console.error("Admin Claim RPC Error", claimError);
                throw new Error(`Admin Claim Failed (Database Error): ${claimError.message}`);
            }

            if (!claimed) {
                throw new Error("Admin Claim Failed: Invalid Master Key.");
            }
        }

        // 3. Return mapped user (requires sync to get role)
        const synced = await UserService.syncUser(data.user.id);
        if (!synced) throw new Error("User created but profile sync failed.");
        return synced;
    }

    static verifyMasterKey(key: string): boolean {
        const masterKey = (import.meta as any).env.VITE_MASTER_KEY || 'PEUTIC_ADMIN_ACCESS_2026';
        return key === masterKey;
    }

    static async resetAdminStatus(masterKey: string): Promise<void> {
        const { data, error } = await supabase.rpc('claim_system_access', { p_master_key: masterKey });
        if (error || !data) throw new Error(error?.message || "Start Reclaim failed: Invalid Key or Server Error");

        const currentUser = UserService.getUser();
        if (currentUser?.role === 'ADMIN') {
            await UserService.logout();
        }
    }

    private static COMPANION_CACHE_KEY = 'peutic_companions';

    static async getCompanions(): Promise<Companion[]> {
        const mapCompanion = (c: any) => ({
            id: c.id,
            name: c.name,
            gender: c.gender,
            specialty: c.specialty,
            status: c.status,
            rating: c.rating,
            imageUrl: c.image_url,
            bio: c.bio,
            replicaId: c.replica_id,
            licenseNumber: c.license_number,
            degree: c.degree,
            stateOfPractice: c.state_of_practice,
            yearsExperience: c.years_experience
        });

        const cached = localStorage.getItem(this.COMPANION_CACHE_KEY);

        const fetcher = async () => {
            const fields = 'id, name, gender, specialty, status, rating, image_url, bio, replica_id, license_number, degree, state_of_practice, years_experience';
            const { data, error } = await supabase.from('companions').select(fields).order('name');
            if (error) {
                logger.warn("getCompanions Error", error.message);
                return [];
            }
            return (data || []).map(mapCompanion);
        };

        if (cached) {
            fetcher().then(data => localStorage.setItem(this.COMPANION_CACHE_KEY, JSON.stringify(data)));
            return JSON.parse(cached);
        }

        const data = await fetcher();
        localStorage.setItem(this.COMPANION_CACHE_KEY, JSON.stringify(data));
        return data;
    }


    static async updateCompanion(companion: Companion): Promise<void> {
        const { error } = await BaseService.invokeGateway('admin-update-companion', { companion });
        if (error) logger.error("Update Companion via Gateway Failed", companion.id, error);
    }

    static async getAllTransactions(): Promise<Transaction[]> {
        const cacheKey = 'peutic_admin_transactions';
        const cached = localStorage.getItem(cacheKey);

        const fetcher = async () => {
            const fields = 'id, user_id, user_name, date, amount, cost, description, status';
            const { data } = await supabase.from('transactions').select(fields).order('date', { ascending: false });
            return (data || []).map((t: any) => ({
                id: t.id,
                userId: t.user_id,
                userName: t.user_name,
                date: t.date,
                amount: t.amount,
                cost: t.cost,
                description: t.description,
                status: t.status as any
            }));
        };

        if (cached) {
            fetcher().then(data => localStorage.setItem(cacheKey, JSON.stringify(data)));
            return JSON.parse(cached);
        }

        const data = await fetcher();
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
    }

    static async addCredits(userId: string, minutes: number) {
        const { error } = await BaseService.invokeGateway('process-topup', {
            userId,
            amount: minutes,
            isInternal: true
        });
        if (error) throw new Error(error.message);

        logger.success("Admin Credit Top-up", `User: ${userId}, Minutes: ${minutes}`);
    }

    static async logSystemEvent(type: string, event: string, details: string) {
        await BaseService.invokeGateway('log-event', {
            type, event, details
        });
    }
}



