import { User, UserRole, Transaction, Companion, GlobalSettings, SystemLog, MoodEntry, JournalEntry, SessionFeedback, ArtEntry } from '../types';
import { supabase } from './supabaseClient';

// --- GENERIC AVATAR POOL ---
export const STABLE_AVATAR_POOL = [
    "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1533227297464-60f45096b5f4?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1521119989659-a83eee488058?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1542596594-649edbc13630?auto=format&fit=crop&q=80&w=800"
];

// --- SEED DATA ---
export const INITIAL_COMPANIONS: Companion[] = [
  { id: 'c1', name: 'Ruby', gender: 'Female', specialty: 'Anxiety & Panic', status: 'AVAILABLE', rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800", bio: 'Specializing in grounding techniques and immediate panic reduction.', replicaId: 're3a705cf66a', licenseNumber: 'LCSW-NY-44021', degree: 'MSW, Columbia University', stateOfPractice: 'NY', yearsExperience: 8 },
  { id: 'c2', name: 'Carter', gender: 'Male', specialty: 'Life Coaching', status: 'AVAILABLE', rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800", bio: 'Success roadmap planning and career strategy.', replicaId: 'rca8a38779a8', licenseNumber: 'ICF-PCC-9921', degree: 'MBA, Stanford', stateOfPractice: 'CA', yearsExperience: 12 },
  { id: 'c5', name: 'Anna', gender: 'Female', specialty: 'Family Dynamics', status: 'AVAILABLE', rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?auto=format&fit=crop&q=80&w=800", bio: 'Navigating complex relationships.', replicaId: 'r6ae5b6efc9d', licenseNumber: 'LMFT-CA-9901', degree: 'MS, Family Therapy', stateOfPractice: 'CA', yearsExperience: 11 },
  { id: 'c3', name: 'James', gender: 'Male', specialty: 'Men\'s Health', status: 'AVAILABLE', rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=800", bio: 'Safe space for men.', replicaId: 'r92debe21318', licenseNumber: 'LMFT-TX-2201', degree: 'PhD, Psychology', stateOfPractice: 'TX', yearsExperience: 15 },
  { id: 'c46', name: 'Scarlett', gender: 'Female', specialty: 'Women\'s Issues', status: 'AVAILABLE', rating: 5.0, imageUrl: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&q=80&w=800", bio: 'Empowerment and health.', replicaId: 're3a705cf66a', licenseNumber: 'LCSW-NY-1188', degree: 'MSW, Social Work', stateOfPractice: 'NY', yearsExperience: 13 },
  { id: 'c8', name: 'Marcus', gender: 'Male', specialty: 'Addiction Recovery', status: 'AVAILABLE', rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800", bio: 'One day at a time.', replicaId: 'rca8a38779a8', licenseNumber: 'LAC-NJ-8821', degree: 'MA, Addiction Counseling', stateOfPractice: 'NJ', yearsExperience: 14 },
  { id: 'c6', name: 'Gloria', gender: 'Female', specialty: 'Elder Care', status: 'AVAILABLE', rating: 5.0, imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800", bio: 'Support for caregivers.', replicaId: 'r4317e64d25a', licenseNumber: 'BSW-FL-3321', degree: 'BSW, Gerontology', stateOfPractice: 'FL', yearsExperience: 20 },
  { id: 'c45', name: 'Matthew', gender: 'Male', specialty: 'Tech Burnout', status: 'AVAILABLE', rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=800", bio: 'Restoring digital balance.', replicaId: 'r92debe21318', licenseNumber: 'LMFT-WA-3399', degree: 'MA, Psychology', stateOfPractice: 'WA', yearsExperience: 7 },
  { id: 'c7', name: 'Olivia', gender: 'Female', specialty: 'Workplace Stress', status: 'AVAILABLE', rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1619895862022-09114b41f16f?auto=format&fit=crop&q=80&w=800", bio: 'Burnout prevention strategies.', replicaId: 'rc2146c13e81', licenseNumber: 'PsyD-NY-1102', degree: 'PsyD, Org Psychology', stateOfPractice: 'NY', yearsExperience: 7 },
  { id: 'c10', name: 'Dr. Chen', gender: 'Male', specialty: 'Executive Burnout', status: 'BUSY', rating: 5.0, imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=800", bio: 'High performance sustainability.', replicaId: 'rca8a38779a8', licenseNumber: 'PsyD-CA-9921', degree: 'PsyD, Org Psychology', stateOfPractice: 'CA', yearsExperience: 18 },
  { id: 'c35', name: 'Ethan', gender: 'Male', specialty: 'Financial Anxiety', status: 'AVAILABLE', rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&q=80&w=800", bio: 'Healing your relationship with money.', replicaId: 'r92debe21318', licenseNumber: 'LMFT-CA-2210', degree: 'MA, Financial Therapy', stateOfPractice: 'CA', yearsExperience: 10 }
];

export class Database {
  private static currentUser: User | null = null;
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

  // --- SESSION MANAGEMENT ---
  
  static async restoreSession(): Promise<User | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const user = await this.syncUser(session.user.id);
        if (!user) {
            console.warn("Session valid but Profile not found. Attempting repair...");
            return await this.repairProfile(session.user);
        }
        return user;
      }
    } catch (e) {
      console.warn("Restore Session Failed");
    }
    return this.currentUser;
  }

  // SELF-HEALING REPAIR LOGIC
  private static async repairProfile(authUser: any): Promise<User | null> {
    try {
        const isFirst = await this.isTableEmpty('users');
        const newUser = {
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
            role: isFirst ? 'ADMIN' : 'USER',
            balance: isFirst ? 999 : 0,
            provider: authUser.app_metadata?.provider || 'email'
        };
        const { error } = await supabase.from('users').insert(newUser);
        if (!error) return this.mapUser(newUser);
    } catch (e) { console.error("Repair failed", e); }
    return null;
  }

  private static async isTableEmpty(table: string): Promise<boolean> {
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
    return (count || 0) === 0;
  }

  static getUser(): User | null { return this.currentUser; }
  static saveUserSession(user: User) { this.currentUser = user; }
  static clearSession() { this.currentUser = null; supabase.auth.signOut(); }

  static async syncUser(userId: string): Promise<User | null> {
      if (!userId) return null;
      const { data } = await supabase.from('users').select('*').eq('id', userId).single();
      if (data) {
          this.currentUser = this.mapUser(data);
          return this.currentUser;
      }
      return null;
  }

  private static mapUser(data: any): User {
      return {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role as UserRole,
          balance: data.balance || 0,
          subscriptionStatus: (data.subscription_status || 'ACTIVE') as any,
          joinedAt: data.created_at || new Date().toISOString(),
          lastLoginDate: data.last_login_date || new Date().toISOString(),
          streak: 0,
          provider: data.provider || 'email',
          avatar: data.avatar_url,
          emailPreferences: data.email_preferences || { marketing: true, updates: true },
          themePreference: data.theme_preference,
          languagePreference: data.language_preference
      };
  }

  // --- AUTH ACTIONS ---

  static async login(email: string, password?: string): Promise<User> {
    if (password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
        if (data.user) {
            const user = await this.syncUser(data.user.id);
            if (user) return user;
            const repaired = await this.repairProfile(data.user);
            if (repaired) return repaired;
        }
    }
    throw new Error("Login failed");
  }

  static async createUser(name: string, email: string, password?: string, provider: string = 'email'): Promise<User> {
    if (provider === 'email' && password) {
        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { full_name: name } }
        });
        if (error) throw new Error(error.message);
        if (data.user) {
            // Wait for trigger to complete
            for (let i = 0; i < 5; i++) {
                const user = await this.syncUser(data.user.id);
                if (user) return user;
                await new Promise(r => setTimeout(r, 500));
            }
            // Fallback to manual repair if trigger is slow
            const repaired = await this.repairProfile(data.user);
            if (repaired) return repaired;
        }
    }
    throw new Error("Creation failed");
  }

  static async logout() { await supabase.auth.signOut(); this.currentUser = null; }

  static async updateUser(user: User) {
      if (!user.id) return;
      this.currentUser = user; 
      await supabase.from('users').update({
          name: user.name,
          email: user.email,
          avatar_url: user.avatar,
          email_preferences: user.emailPreferences,
          theme_preference: user.themePreference,
          language_preference: user.languagePreference
      }).eq('id', user.id);
  }

  static async deleteUser(id: string) {
      await supabase.from('users').delete().eq('id', id);
      if (this.currentUser?.id === id) this.currentUser = null;
  }

  static async hasAdmin(): Promise<boolean> {
      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'ADMIN');
      return (count || 0) > 0;
  }

  static checkAndIncrementStreak(user: User): User { return user; }

  // --- DATA FETCHING ---

  static async getAllUsers(): Promise<User[]> {
      const { data } = await supabase.from('users').select('*');
      return (data || []).map(this.mapUser);
  }

  static async getCompanions(): Promise<Companion[]> {
      const { data } = await supabase.from('companions').select('*');
      if (!data || data.length === 0) {
          const toInsert = INITIAL_COMPANIONS.map(c => ({
              id: c.id, name: c.name, gender: c.gender, specialty: c.specialty,
              status: c.status, rating: c.rating, image_url: c.imageUrl,
              bio: c.bio, replica_id: c.replicaId, license_number: c.licenseNumber,
              degree: c.degree, state_of_practice: c.stateOfPractice, years_experience: c.yearsExperience
          }));
          await supabase.from('companions').insert(toInsert);
          return INITIAL_COMPANIONS;
      }
      return data.map(d => ({
          id: d.id, name: d.name, gender: d.gender, specialty: d.specialty,
          status: d.status as any, rating: d.rating, imageUrl: d.image_url,
          bio: d.bio, replicaId: d.replica_id, licenseNumber: d.license_number,
          degree: d.degree, stateOfPractice: d.state_of_practice, yearsExperience: d.years_experience
      }));
  }

  static async updateCompanion(companion: Companion) {
      await supabase.from('companions').update({ status: companion.status }).eq('id', companion.id);
  }

  static getSettings(): GlobalSettings { return this.settingsCache; }

  static async syncGlobalSettings(): Promise<GlobalSettings> {
      try {
          const { data } = await supabase.from('global_settings').select('*').eq('id', 1).single();
          if (data) {
              this.settingsCache = {
                  pricePerMinute: data.price_per_minute,
                  saleMode: data.sale_mode,
                  maintenanceMode: data.maintenance_mode,
                  allowSignups: data.allow_signups,
                  siteName: data.site_name,
                  broadcastMessage: data.broadcast_message,
                  maxConcurrentSessions: data.max_concurrent_sessions,
                  multilingualMode: data.multilingual_mode
              };
          } else {
              await this.saveSettings(this.settingsCache);
          }
      } catch(e) {}
      return this.settingsCache;
  }

  static async saveSettings(settings: GlobalSettings) {
      this.settingsCache = settings;
      await supabase.from('global_settings').upsert({
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
  }

  // --- TRANSACTIONS ---
  static async getUserTransactions(userId: string): Promise<Transaction[]> {
      const { data } = await supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false });
      return (data || []).map(t => ({
          id: t.id, userId: t.user_id, date: t.date, amount: t.amount, cost: t.cost, description: t.description, status: t.status as any
      }));
  }

  static async getAllTransactions(): Promise<Transaction[]> {
      const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      return (data || []).map(t => ({
          id: t.id, userId: t.user_id, date: t.date, amount: t.amount, cost: t.cost, description: t.description, status: t.status as any
      }));
  }

  static async addTransaction(tx: Transaction) {
      await supabase.from('transactions').insert({
          id: tx.id, user_id: tx.userId, date: tx.date, amount: tx.amount, cost: tx.cost, description: tx.description, status: tx.status
      });
  }

  static async topUpWallet(amount: number, cost: number, userId?: string, paymentToken?: string) {
      const uid = userId || this.currentUser?.id;
      if (!uid) return;
      const { error } = await supabase.functions.invoke('api-gateway', {
          body: { action: 'process-topup', payload: { userId: uid, amount, cost, paymentToken } }
      });
      if (error) throw new Error("Transaction Failed: " + error.message);
      await this.syncUser(uid);
  }

  static async deductBalance(amount: number) {
      if (!this.currentUser) return;
      this.currentUser.balance -= amount;
      await supabase.from('users').update({ balance: this.currentUser.balance }).eq('id', this.currentUser.id);
  }

  // --- CONTENT ---
  static async getJournals(userId: string): Promise<JournalEntry[]> {
      const { data } = await supabase.from('journals').select('*').eq('user_id', userId).order('date', { ascending: false });
      return (data || []).map(j => ({ id: j.id, userId: j.user_id, date: j.date, content: j.content }));
  }

  static async saveJournal(entry: JournalEntry) {
      await supabase.from('journals').insert({ id: entry.id, user_id: entry.userId, date: entry.date, content: entry.content });
  }

  static async getMoods(userId: string): Promise<MoodEntry[]> {
      const { data } = await supabase.from('moods').select('*').eq('user_id', userId).order('date', { ascending: false });
      return (data || []).map(m => ({ id: m.id, userId: m.user_id, date: m.date, mood: m.mood as any }));
  }

  static async saveMood(userId: string, mood: 'confetti' | 'rain') {
      await supabase.from('moods').insert({ user_id: userId, date: new Date().toISOString(), mood });
  }

  static async getUserArt(userId: string): Promise<ArtEntry[]> {
      const { data } = await supabase.from('user_art').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return (data || []).map(a => ({ id: a.id, userId: a.user_id, imageUrl: a.image_url, prompt: a.prompt, createdAt: a.created_at, title: a.title }));
  }

  static async saveArt(entry: ArtEntry) {
      await supabase.from('user_art').insert({ id: entry.id, user_id: entry.userId, image_url: entry.imageUrl, prompt: entry.prompt, title: entry.title, created_at: entry.createdAt });
  }

  static async deleteArt(id: string) { await supabase.from('user_art').delete().eq('id', id); }

  static async getSystemLogs(): Promise<SystemLog[]> {
      const { data } = await supabase.from('system_logs').select('*').order('timestamp', { ascending: false }).limit(100);
      return data || [];
  }

  static async logSystemEvent(type: string, event: string, details: string) {
      await supabase.from('system_logs').insert({ type, event, details, timestamp: new Date().toISOString() });
  }

  static async saveFeedback(feedback: SessionFeedback) {
      await supabase.from('feedback').insert({
          user_id: feedback.userId, companion_name: feedback.companionName, rating: feedback.rating, tags: feedback.tags, date: feedback.date
      });
  }

  static recordBreathSession(userId: string, duration: number) { /* No-op */ }

  // --- QUEUE ---
  private static async runGlobalCleanup() {
      const cutoff = new Date(Date.now() - 15000).toISOString();
      await supabase.from('active_sessions').delete().lt('last_ping', cutoff);
      await supabase.from('session_queue').delete().lt('last_ping', cutoff);
  }

  static async getActiveSessionCount(): Promise<number> {
      await this.runGlobalCleanup();
      const { count } = await supabase.from('active_sessions').select('*', { count: 'exact', head: true });
      return count || 0;
  }

  static async getQueueLength(): Promise<number> {
      const { count } = await supabase.from('session_queue').select('*', { count: 'exact', head: true });
      return count || 0;
  }

  static async claimActiveSpot(userId: string): Promise<boolean> {
      await this.runGlobalCleanup();
      const count = await this.getActiveSessionCount();
      if (count >= this.settingsCache.maxConcurrentSessions) return false;
      const { error } = await supabase.from('active_sessions').insert({ user_id: userId, last_ping: new Date().toISOString() });
      if (!error || error.code === '23505') {
          await this.leaveQueue(userId);
          return true;
      }
      return false;
  }

  static async joinQueue(userId: string): Promise<number> {
      const { error } = await supabase.from('session_queue').upsert({ user_id: userId, last_ping: new Date().toISOString() });
      if (error) return 99;
      return this.getQueuePosition(userId);
  }

  static async leaveQueue(userId: string) { await supabase.from('session_queue').delete().eq('user_id', userId); }

  static async getQueuePosition(userId: string): Promise<number> {
      const { data } = await supabase.from('session_queue').select('created_at').eq('user_id', userId).single();
      if (!data) return 0;
      const { count } = await supabase.from('session_queue').select('*', { count: 'exact', head: true }).lt('created_at', data.created_at);
      return (count || 0) + 1;
  }

  static async sendKeepAlive(userId: string) { await supabase.from('active_sessions').upsert({ user_id: userId, last_ping: new Date().toISOString() }); }
  static async sendQueueHeartbeat(userId: string) { await supabase.from('session_queue').update({ last_ping: new Date().toISOString() }).eq('user_id', userId); }
  static async endSession(userId: string) { await supabase.from('active_sessions').delete().eq('user_id', userId); await supabase.from('session_queue').delete().eq('user_id', userId); }

  static getEstimatedWaitTime(pos: number): number { return Math.max(0, (pos - 1) * 3); }

  static async getWeeklyProgress(userId: string): Promise<{ current: number, target: number, message: string }> {
      const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const { count: journalCount } = await supabase.from('journals').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('date', oneWeekAgo.toISOString());
      const { count: sessionCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'COMPLETED').gte('date', oneWeekAgo.toISOString());
      const current = (journalCount || 0) + (sessionCount || 0);
      return { current, target: 10, message: current >= 10 ? "Goal crushed!" : "Keep going!" };
  }

  static async checkAdminLockout(): Promise<number> {
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { count } = await supabase.from('system_logs').select('*', { count: 'exact', head: true }).eq('type', 'SECURITY').eq('event', 'Admin Login Failed').gte('timestamp', fifteenMinsAgo);
      return (count || 0) >= 5 ? 15 : 0;
  }

  static async recordAdminFailure() { await this.logSystemEvent('SECURITY', 'Admin Login Failed', 'Invalid credentials or key'); }
  static async resetAdminFailure() { /* Managed by time */ }
  static async resetAllUsers() { await supabase.from('users').delete().neq('role', 'ADMIN'); }
}