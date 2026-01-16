
import { GlobalSettings, SystemLog, User, Companion, Transaction } from '../types';
import { supabase } from './supabaseClient';
import { BaseService } from './baseService';

import { logger } from './logger';
import { UserService } from './userService';

export class AdminService {
    private static settingsCache: GlobalSettings = {
        pricePerMinute: 1.99,
        saleMode: false,
        maintenanceMode: false,
        allowSignups: true,
        siteName: 'Peutic',
        maxConcurrentSessions: 15,
        multilingualMode: true,
        broadcastMessage: ''
    };

    static getSettings(): GlobalSettings { return this.settingsCache; }

    static async syncGlobalSettings(): Promise<GlobalSettings> {
        try {
            const { data, error } = await supabase.from('global_settings').select('*').eq('id', 1).single();
            if (data && !error) {
                const settingsData = data as any;
                this.settingsCache = {
                    pricePerMinute: settingsData.price_per_minute,
                    saleMode: settingsData.sale_mode,
                    maintenanceMode: settingsData.maintenance_mode,
                    allowSignups: settingsData.allow_signups,
                    siteName: settingsData.site_name,
                    broadcastMessage: settingsData.broadcast_message,
                    maxConcurrentSessions: settingsData.max_concurrent_sessions,
                    multilingualMode: settingsData.multilingual_mode
                };

            }
        } catch (e) {
            console.warn("Settings sync failed", e);
        }
        return this.settingsCache;
    }

    static async saveSettings(settings: GlobalSettings) {
        this.settingsCache = settings;
        const { error } = await supabase.from('global_settings').upsert({
            id: 1,
            price_per_minute: settings.pricePerMinute,
            sale_mode: settings.saleMode,
            maintenance_mode: settings.maintenanceMode,
            allow_signups: settings.allowSignups,
            site_name: settings.siteName,
            broadcast_message: settings.broadcastMessage,
            max_concurrent_sessions: settings.maxConcurrentSessions,
            multilingual_mode: settings.multilingualMode
        });
        if (error) logger.error("Save Settings Failed", "", error);
    }

    static async getSystemLogs(): Promise<SystemLog[]> {
        const { data } = await BaseService.invokeGateway('system-logs');
        return (data || []) as SystemLog[];
    }



    static async getAllUsers(): Promise<User[]> {
        try {
            // Use API Gateway (bypasses RLS via service role)
            const { data, error } = await BaseService.invokeGateway('admin-list-users');
            if (error) {
                logger.warn("getAllUsers Gateway Error", error.message || error);
                return [];
            }
            return (data || []).map(UserService.mapUser);
        } catch (e: any) {
            logger.error("getAllUsers Failed", "", e);
            return [];
        }
    }

    static async deleteUser(userId: string) {
        await BaseService.invokeGateway('delete-user', { userId });
        logger.security("User Deleted", `ID: ${userId}`);
    }

    static async updateUserStatus(userId: string, status: 'ACTIVE' | 'BANNED' | 'TRIAL') {
        const { error } = await BaseService.invokeGateway('user-status', { userId, status });
        if (error) throw error;
        logger.info("User Status Updated", `ID: ${userId}, Status: ${status}`);
    }



    static async broadcastMessage(message: string) {
        const data = await BaseService.invokeGateway('broadcast', { message });
        this.settingsCache.broadcastMessage = message;
        logger.info("Global Broadcast Sent", message);
        return data;
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
        await supabase.from('users').delete().neq('role', 'ADMIN');
        logger.security("System Reset", "All non-admin users purged");
    }

    static async getAdminLockoutStatus(): Promise<number> {
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const { count } = await supabase.from('system_logs').select('*', { count: 'exact', head: true }).eq('type', 'SECURITY').eq('event', 'Admin Login Failed').gte('timestamp', fifteenMinsAgo);
        return (count || 0) >= 5 ? 15 : 0;
    }

    static async recordAdminFailure() {
        await supabase.from('system_logs').insert({
            type: 'SECURITY',
            event: 'Admin Login Failed',
            details: 'Invalid credentials or key',
            timestamp: new Date().toISOString()
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

    static async createRootAdmin(email: string, password?: string): Promise<User> {
        const { data, error } = await BaseService.invokeGateway('admin-create', { email, password });
        if (error || !data?.user) throw new Error(error?.message || "Root admin creation failed");
        return UserService.mapUser(data.user);
    }

    static verifyMasterKey(key: string): boolean {
        const masterKey = (import.meta as any).env.VITE_MASTER_KEY || 'PEUTIC_MASTER_2026';
        return key === masterKey;
    }

    static async resetAdminStatus(masterKey: string): Promise<void> {
        const { data, error } = await BaseService.invokeGateway('admin-reclaim', { masterKey });
        if (error || data?.error) throw new Error(error?.message || data?.error || "Reclaim failed");

        const currentUser = UserService.getUser();
        if (currentUser?.role === 'ADMIN') {
            await UserService.logout();
        }
    }

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

        try {
            // Try API Gateway first (bypasses RLS)
            const { data: gatewayData, error: gatewayError } = await BaseService.invokeGateway('admin-list-companions');
            if (!gatewayError && gatewayData && gatewayData.length > 0) {
                return gatewayData.map(mapCompanion);
            }

            // Fallback to direct Supabase (works if RLS is permissive)
            const { data, error } = await supabase.from('companions').select('*').order('name');
            if (error) {
                logger.warn("getCompanions RLS Error", error.message);
            }
            if (!data || data.length === 0) {
                logger.warn("getCompanions Empty", "No companions found - check if seed script was run");
            }
            return (data || []).map(mapCompanion);
        } catch (e: any) {
            logger.error("getCompanions Failed", "", e);
            return [];
        }
    }

    static async updateCompanion(companion: Companion): Promise<void> {
        const { error } = await supabase.from('companions').update({
            name: companion.name,
            gender: companion.gender,
            specialty: companion.specialty,
            status: companion.status,
            rating: companion.rating,
            image_url: companion.imageUrl,
            bio: companion.bio,
            replica_id: companion.replicaId,
            license_number: companion.licenseNumber,
            degree: companion.degree,
            state_of_practice: companion.stateOfPractice,
            years_experience: companion.yearsExperience
        }).eq('id', companion.id);
        if (error) logger.error("Update Companion Failed", companion.id, error);
    }

    static async getAllTransactions(): Promise<Transaction[]> {
        const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false });
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
        await supabase.from('system_logs').insert({
            type,
            event,
            details,
            timestamp: new Date().toISOString()
        });
    }
}



