
import { User, UserRole, Transaction, Companion, GlobalSettings, SystemLog, MoodEntry, JournalEntry, PromoCode, SessionFeedback, ArtEntry, BreathLog, SessionMemory, GiftCard } from '../types';
import { supabase } from './supabaseClient';

const DB_KEYS = {
  USER: 'peutic_db_current_user_v26', 
  ALL_USERS: 'peutic_db_all_users_v26', // Added for Local Fallback
  TRANSACTIONS: 'peutic_db_transactions_v26', // Added for Local Fallback
  COMPANIONS: 'peutic_db_companions_v26',
  SETTINGS: 'peutic_db_settings_v26',
  LOGS: 'peutic_db_logs_v26',
  MOODS: 'peutic_db_moods_v26',
  JOURNALS: 'peutic_db_journals_v26',
  ART: 'peutic_db_art_v26',
  PROMOS: 'peutic_db_promos_v26',
  ADMIN_ATTEMPTS: 'peutic_db_admin_attempts_v26',
  BREATHE_COOLDOWN: 'peutic_db_breathe_cooldown_v26',
  BREATHE_LOGS: 'peutic_db_breathe_logs_v26',
  MEMORIES: 'peutic_db_memories_v26',
  GIFTS: 'peutic_db_gifts_v26',
  FEEDBACK: 'peutic_db_feedback_v26',
  ACTIVE_SESSIONS: 'peutic_active_sessions_v2',
  QUEUE: 'peutic_queue_v1'
};

// --- GENERIC AVATAR POOL (For Users/Fallbacks ONLY) ---
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
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800"
];

// --- HERO COMPANIONS ---
export const INITIAL_COMPANIONS: Companion[] = [
  { id: 'c1', name: 'Ruby', gender: 'Female', specialty: 'Anxiety & Panic', status: 'AVAILABLE', rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800", bio: 'Specializing in grounding techniques.', replicaId: 're3a705cf66a', licenseNumber: 'LCSW-NY-44021', degree: 'MSW, Columbia University', stateOfPractice: 'NY', yearsExperience: 8 },
  { id: 'c2', name: 'Carter', gender: 'Male', specialty: 'Life Coaching', status: 'AVAILABLE', rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800", bio: 'Success roadmap planning.', replicaId: 'rca8a38779a8', licenseNumber: 'ICF-PCC-9921', degree: 'MBA, Stanford', stateOfPractice: 'CA', yearsExperience: 12 },
  { id: 'c5', name: 'Anna', gender: 'Female', specialty: 'Family Dynamics', status: 'AVAILABLE', rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?auto=format&fit=crop&q=80&w=800", bio: 'Navigating complex relationships.', replicaId: 'r6ae5b6efc9d', licenseNumber: 'LMFT-CA-9901', degree: 'MS, Family Therapy', stateOfPractice: 'CA', yearsExperience: 11 },
  { id: 'c3', name: 'James', gender: 'Male', specialty: 'Men\'s Health', status: 'AVAILABLE', rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=800", bio: 'Safe space for men.', replicaId: 'r92debe21318', licenseNumber: 'LMFT-TX-2201', degree: 'PhD, Psychology', stateOfPractice: 'TX', yearsExperience: 15 },
  { id: 'c46', name: 'Scarlett', gender: 'Female', specialty: 'Women\'s Issues', status: 'AVAILABLE', rating: 5.0, imageUrl: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&q=80&w=800", bio: 'Empowerment and health.', replicaId: 're3a705cf66a', licenseNumber: 'LCSW-NY-1188', degree: 'MSW, Social Work', stateOfPractice: 'NY', yearsExperience: 13 },
  { id: 'c8', name: 'Marcus', gender: 'Male', specialty: 'Addiction Recovery', status: 'AVAILABLE', rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800", bio: 'One day at a time.', replicaId: 'rca8a38779a8', licenseNumber: 'LAC-NJ-8821', degree: 'MA, Addiction Counseling', stateOfPractice: 'NJ', yearsExperience: 14 }
];

export class Database {
  
  // --- HELPERS ---
  private static mapDbUserToAppUser(dbUser: any): User {
      return {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role as UserRole,
          balance: dbUser.balance,
          avatar: dbUser.avatar,
          subscriptionStatus: dbUser.subscription_status || 'ACTIVE',
          joinedAt: dbUser.joined_at,
          lastLoginDate: dbUser.last_login_date,
          streak: dbUser.streak || 0,
          provider: dbUser.provider,
          birthday: dbUser.birthday,
          emailPreferences: dbUser.email_preferences
      };
  }

  // --- LOCAL STORAGE FALLBACK HELPERS ---
  private static getLocalUsers(): User[] {
      try {
          const stored = localStorage.getItem(DB_KEYS.ALL_USERS);
          return stored ? JSON.parse(stored) : [];
      } catch (e) { return []; }
  }

  private static saveLocalUser(user: User) {
      const users = this.getLocalUsers();
      const index = users.findIndex(u => u.id === user.id);
      if (index >= 0) users[index] = user;
      else users.push(user);
      localStorage.setItem(DB_KEYS.ALL_USERS, JSON.stringify(users));
  }

  private static deleteLocalUser(userId: string) {
      const users = this.getLocalUsers().filter(u => u.id !== userId);
      localStorage.setItem(DB_KEYS.ALL_USERS, JSON.stringify(users));
  }

  private static getLocalTransactions(): Transaction[] {
      try {
          const stored = localStorage.getItem(DB_KEYS.TRANSACTIONS);
          return stored ? JSON.parse(stored) : [];
      } catch (e) { return []; }
  }

  private static saveLocalTransaction(tx: Transaction) {
      const txs = this.getLocalTransactions();
      txs.unshift(tx);
      localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(txs));
  }

  // --- USER MANAGEMENT ---

  static getUser(): User | null {
    const userStr = localStorage.getItem(DB_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  }

  static saveUserSession(user: User) {
    localStorage.setItem(DB_KEYS.USER, JSON.stringify(user));
  }

  static async syncUser(userId: string): Promise<User | null> {
      try {
          const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
          if (error) throw error;
          if (!data) throw new Error("No data");
          
          const user = this.mapDbUserToAppUser(data);
          this.saveUserSession(user);
          this.saveLocalUser(user); // Keep local in sync
          return user;
      } catch (e) {
          // Fallback to local
          const localUser = this.getLocalUsers().find(u => u.id === userId);
          if (localUser) {
              this.saveUserSession(localUser);
              return localUser;
          }
          return null;
      }
  }

  static async getAllUsers(): Promise<User[]> {
      try {
          const { data, error } = await supabase.from('users').select('*').order('joined_at', { ascending: false });
          if (error) throw error;
          return data.map(this.mapDbUserToAppUser);
      } catch (e) {
          return this.getLocalUsers();
      }
  }

  static async getUserByEmail(email: string): Promise<User | undefined> {
      try {
          const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
          if (error) {
              // If it's a "no rows found" error (PGRST116), return undefined gracefully
              if (error.code === 'PGRST116') return undefined;
              throw error; 
          }
          if (!data) return undefined;
          return this.mapDbUserToAppUser(data);
      } catch (e) {
          // Fallback to local storage checks
          console.warn("Supabase unreachable, checking local cache.");
          return this.getLocalUsers().find(u => u.email === email);
      }
  }

  static async createUser(name: string, email: string, provider: 'email' | 'google' | 'facebook' | 'x', birthday?: string, role: UserRole = UserRole.USER): Promise<User> {
    const newUser = {
      id: `u_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      role,
      balance: 0,
      subscription_status: 'ACTIVE',
      joined_at: new Date().toISOString(),
      last_login_date: new Date().toISOString(),
      streak: 0,
      provider,
      birthday
    };

    const appUser = this.mapDbUserToAppUser(newUser);
    
    // Always save locally first to ensure success
    this.saveLocalUser(appUser);
    this.saveUserSession(appUser);

    // Try Remote
    try {
        await supabase.from('users').insert(newUser);
    } catch (e) {
        console.warn("Created user locally (Supabase offline).");
    }

    return appUser;
  }

  static async updateUser(user: Partial<User> & { id: string }) {
    // Optimistic Local Update
    const current = this.getUser();
    let merged = current ? { ...current, ...user } : undefined;
    
    // If updating a user that isn't current session, fetch from local list
    if (!merged) {
        const local = this.getLocalUsers().find(u => u.id === user.id);
        if (local) merged = { ...local, ...user };
    }

    if (merged) {
        // Update Session if it matches
        if (current && current.id === user.id) this.saveUserSession(merged as User);
        // Update Local Storage DB
        this.saveLocalUser(merged as User);
    }

    // Remote Update
    try {
        const dbUpdate: any = {};
        if (user.name) dbUpdate.name = user.name;
        if (user.email) dbUpdate.email = user.email;
        if (user.avatar) dbUpdate.avatar = user.avatar;
        if (user.lastLoginDate) dbUpdate.last_login_date = user.lastLoginDate;
        if (user.streak !== undefined) dbUpdate.streak = user.streak;
        if (user.balance !== undefined) dbUpdate.balance = user.balance;
        if (user.emailPreferences) dbUpdate.email_preferences = user.emailPreferences;
        if (user.subscriptionStatus) dbUpdate.subscription_status = user.subscriptionStatus;

        await supabase.from('users').update(dbUpdate).eq('id', user.id);
    } catch (e) {
        console.warn("Update failed remotely, saved locally.");
    }
  }

  static async deleteUser(id: string) {
      this.deleteLocalUser(id);
      const current = this.getUser();
      if (current && current.id === id) this.clearSession();
      try {
          await supabase.from('users').delete().eq('id', id);
      } catch (e) {}
  }

  static clearSession() {
    localStorage.removeItem(DB_KEYS.USER);
  }

  static async hasAdmin(): Promise<boolean> {
    try {
        const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'ADMIN');
        return (count || 0) > 0;
    } catch (e) {
        // Local Check
        return this.getLocalUsers().some(u => u.role === 'ADMIN');
    }
  }

  static async checkAndIncrementStreak(user: User): Promise<User> {
      const today = new Date().toISOString().split('T')[0];
      const lastLogin = user.lastLoginDate ? user.lastLoginDate.split('T')[0] : '';
      
      let newStreak = user.streak;
      if (lastLogin !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (lastLogin === yesterdayStr) {
             newStreak += 1;
          } else {
             newStreak = 1;
          }
          
          const updatedUser = { ...user, streak: newStreak, lastLoginDate: new Date().toISOString() };
          await this.updateUser(updatedUser);
          return updatedUser;
      }
      return user;
  }

  static async resetAllUsers() {
      // DEV ONLY: Deletes everyone except protected admins ideally
      try {
          await supabase.from('users').delete().neq('role', 'ADMIN');
      } catch (e) {}
      localStorage.removeItem(DB_KEYS.ALL_USERS);
      this.clearSession();
  }

  // --- TRANSACTIONS ---

  static async getAllTransactions(): Promise<Transaction[]> {
      try {
          const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false }).limit(100);
          if (error) throw error;
          return (data || []).map((t: any) => ({
              id: t.id,
              userId: t.user_id,
              userName: t.user_name,
              date: t.date,
              amount: t.amount,
              cost: t.cost,
              description: t.description,
              status: t.status
          }));
      } catch (e) {
          return this.getLocalTransactions();
      }
  }

  static async getUserTransactions(userId: string): Promise<Transaction[]> {
      try {
          const { data, error } = await supabase
              .from('transactions')
              .select('*')
              .eq('user_id', userId)
              .order('date', { ascending: false });
          
          if (error) throw error;
          
          return (data || []).map((t: any) => ({
              id: t.id,
              userId: t.user_id,
              userName: t.user_name,
              date: t.date,
              amount: t.amount,
              cost: t.cost,
              description: t.description,
              status: t.status
          }));
      } catch (e) {
          return this.getLocalTransactions().filter(t => t.userId === userId);
      }
  }

  static async addTransaction(tx: Transaction) {
      // Local Save
      this.saveLocalTransaction(tx);
      
      // Remote Save
      try {
          await supabase.from('transactions').insert({
              user_id: tx.userId,
              user_name: tx.userName,
              amount: tx.amount,
              cost: tx.cost,
              description: tx.description,
              status: tx.status,
              date: tx.date
          });
      } catch (e) {}
  }

  static async topUpWallet(amount: number, cost: number, userId?: string) {
      const targetUser = userId ? await this.syncUser(userId) : this.getUser();
      if (targetUser) {
          const newBalance = targetUser.balance + amount;
          await this.updateUser({ ...targetUser, balance: newBalance });
          
          await this.addTransaction({
              id: `tx_${Date.now()}`,
              userId: targetUser.id,
              userName: targetUser.name,
              date: new Date().toISOString(),
              amount: amount,
              cost: cost,
              description: cost > 0 ? 'Credit Purchase' : 'Admin Grant',
              status: 'COMPLETED'
          });
      }
  }

  static async deductBalance(amount: number) {
      const user = this.getUser();
      if (user) {
          const newBalance = Math.max(0, user.balance - amount);
          await this.updateUser({ ...user, balance: newBalance });
      }
  }

  // --- SETTINGS (Keep Local for simplicity + Admin Sync) ---
  static getSettings(): GlobalSettings {
    const defaultSettings: GlobalSettings = {
        pricePerMinute: 1.49,
        saleMode: true,
        maintenanceMode: false,
        allowSignups: true,
        siteName: 'Peutic',
        maxConcurrentSessions: 15,
        multilingualMode: true
    };
    const saved = localStorage.getItem(DB_KEYS.SETTINGS);
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  }

  static saveSettings(settings: GlobalSettings) {
      localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settings));
  }

  // --- COMPANIONS ---
  static getCompanions(): Companion[] {
      const saved = localStorage.getItem(DB_KEYS.COMPANIONS);
      if (!saved) {
          localStorage.setItem(DB_KEYS.COMPANIONS, JSON.stringify(INITIAL_COMPANIONS));
          return INITIAL_COMPANIONS;
      }
      return JSON.parse(saved);
  }

  static updateCompanion(companion: Companion) {
      const list = this.getCompanions();
      const index = list.findIndex(c => c.id === companion.id);
      if (index !== -1) {
          list[index] = companion;
          localStorage.setItem(DB_KEYS.COMPANIONS, JSON.stringify(list));
      }
  }

  // --- QUEUE & SESSIONS (SUPABASE) ---
  static async getActiveSessionCount(): Promise<number> {
      try {
          const { count } = await supabase.from('active_sessions').select('*', { count: 'exact', head: true });
          return count || 0;
      } catch (e) { return 0; }
  }

  static async claimActiveSpot(userId: string): Promise<boolean> {
      const settings = this.getSettings();
      try {
          const count = await this.getActiveSessionCount();
          
          const { data: existing } = await supabase.from('active_sessions').select('user_id').eq('user_id', userId).single();
          if (existing) { await this.sendKeepAlive(userId); return true; }

          if (count >= settings.maxConcurrentSessions) return false;

          const { error } = await supabase.from('active_sessions').insert({ user_id: userId, last_ping: new Date().toISOString() });
          if (error && error.code !== '23505') return false;

          await this.leaveQueue(userId);
          return true;
      } catch (e) {
          // If Supabase is down, assume open access for demo
          return true;
      }
  }

  static async sendKeepAlive(userId: string) {
      try { await supabase.from('active_sessions').upsert({ user_id: userId, last_ping: new Date().toISOString() }); } catch(e) {}
  }

  static async endSession(userId: string) {
      try { await supabase.from('active_sessions').delete().eq('user_id', userId); } catch(e) {}
  }

  static async joinQueue(userId: string): Promise<number> {
      try {
          await supabase.from('session_queue').upsert({ user_id: userId, joined_at: new Date().toISOString() });
          return this.getQueuePosition(userId);
      } catch(e) { return 1; }
  }

  static async leaveQueue(userId: string) {
      try { await supabase.from('session_queue').delete().eq('user_id', userId); } catch(e) {}
  }

  static async getQueuePosition(userId: string): Promise<number> {
      try {
          const { data: myEntry } = await supabase.from('session_queue').select('joined_at').eq('user_id', userId).single();
          if (!myEntry) return 0;
          const { count } = await supabase.from('session_queue').select('*', { count: 'exact', head: true }).lt('joined_at', myEntry.joined_at);
          return (count || 0) + 1;
      } catch(e) { return 1; }
  }

  static getEstimatedWaitTime(pos: number): number {
      return Math.max(0, (pos - 1) * 3);
  }

  // --- ART (Supabase) ---
  static async saveArt(entry: ArtEntry) {
      // Local cache for speed
      this.saveArtLocal(entry);
      try {
          await supabase.from('user_art').insert({
              id: entry.id, user_id: entry.userId, image_url: entry.imageUrl, prompt: entry.prompt, title: entry.title, created_at: entry.createdAt
          });
      } catch(e) {}
  }

  static saveArtLocal(entry: ArtEntry) {
      let art = JSON.parse(localStorage.getItem(DB_KEYS.ART) || '[]');
      art.unshift(entry);
      localStorage.setItem(DB_KEYS.ART, JSON.stringify(art));
  }

  static async getUserArt(userId: string): Promise<ArtEntry[]> {
      try {
          const { data } = await supabase.from('user_art').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
          if (data) {
              return data.map((d: any) => ({
                  id: d.id, userId: d.user_id, imageUrl: d.image_url, prompt: d.prompt, title: d.title, createdAt: d.created_at
              }));
          }
      } catch(e) {}
      return this.getUserArtLocal(userId);
  }

  static getUserArtLocal(userId: string): ArtEntry[] {
      const art = JSON.parse(localStorage.getItem(DB_KEYS.ART) || '[]');
      return art.filter((a: ArtEntry) => a.userId === userId);
  }

  static async deleteArt(artId: string) {
      try { await supabase.from('user_art').delete().eq('id', artId); } catch(e) {}
      let art = JSON.parse(localStorage.getItem(DB_KEYS.ART) || '[]');
      art = art.filter((a: ArtEntry) => a.id !== artId);
      localStorage.setItem(DB_KEYS.ART, JSON.stringify(art));
  }

  // --- OTHER (Sync/Local for now) ---
  static getSystemLogs(): SystemLog[] { return JSON.parse(localStorage.getItem(DB_KEYS.LOGS) || '[]'); } 
  static logSystemEvent(type: string, event: string, details: string) { 
      const logs = this.getSystemLogs();
      logs.unshift({ id: `log_${Date.now()}`, timestamp: new Date().toISOString(), type: type as any, event, details });
      localStorage.setItem(DB_KEYS.LOGS, JSON.stringify(logs));
  }
  static saveFeedback(feedback: SessionFeedback) {
      const list = JSON.parse(localStorage.getItem(DB_KEYS.FEEDBACK) || '[]');
      list.unshift(feedback);
      localStorage.setItem(DB_KEYS.FEEDBACK, JSON.stringify(list));
  }
  static saveMood(userId: string, mood: any) { 
      const moods = JSON.parse(localStorage.getItem(DB_KEYS.MOODS) || '[]');
      moods.push({ id: `m_${Date.now()}`, userId, date: new Date().toISOString(), mood });
      localStorage.setItem(DB_KEYS.MOODS, JSON.stringify(moods));
  }
  static getJournals(userId: string): JournalEntry[] { 
      return JSON.parse(localStorage.getItem(DB_KEYS.JOURNALS) || '[]').filter((j: JournalEntry) => j.userId === userId);
  } 
  static saveJournal(entry: JournalEntry) {
      const journals = JSON.parse(localStorage.getItem(DB_KEYS.JOURNALS) || '[]');
      journals.unshift(entry);
      localStorage.setItem(DB_KEYS.JOURNALS, JSON.stringify(journals));
  }
  
  // --- ADMIN UTILS ---
  static checkAdminLockout(): number {
      const stored = localStorage.getItem(DB_KEYS.ADMIN_ATTEMPTS);
      if (!stored) return 0;
      const { attempts, lockoutUntil } = JSON.parse(stored);
      if (lockoutUntil && Date.now() < lockoutUntil) return Math.ceil((lockoutUntil - Date.now()) / 60000);
      if (lockoutUntil && Date.now() > lockoutUntil) { this.resetAdminFailure(); return 0; }
      return 0;
  }
  static recordAdminFailure() {
      const stored = localStorage.getItem(DB_KEYS.ADMIN_ATTEMPTS);
      let { attempts, lockoutUntil } = stored ? JSON.parse(stored) : { attempts: 0, lockoutUntil: 0 };
      attempts++;
      if (attempts >= 5) { lockoutUntil = Date.now() + (15 * 60 * 1000); } 
      localStorage.setItem(DB_KEYS.ADMIN_ATTEMPTS, JSON.stringify({ attempts, lockoutUntil }));
  }
  static resetAdminFailure() { localStorage.removeItem(DB_KEYS.ADMIN_ATTEMPTS); }
  static getWeeklyProgress(userId: string): { current: number; target: number; message: string } {
      return { current: 3, target: 10, message: "Keep going!" }; 
  }
  static getMoods(userId: string): MoodEntry[] { return []; }
  static getBreathLogs(userId: string): BreathLog[] { return []; }
  static recordBreathSession(userId: string, duration: number) {}
}
