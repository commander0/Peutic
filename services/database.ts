import { User, UserRole, Transaction, Companion, GlobalSettings, SystemLog, ServerMetric, MoodEntry, JournalEntry, PromoCode, SessionMemory, GiftCard, ArtEntry, BreathLog } from '../types';
import { supabase } from './supabaseClient';

const DB_KEYS = {
  USER: 'peutic_db_current_user_v14',
  ALL_USERS: 'peutic_db_users_v14', 
  COMPANIONS: 'peutic_db_companions_v14',
  TRANSACTIONS: 'peutic_db_transactions_v14',
  SETTINGS: 'peutic_db_settings_v14',
  LOGS: 'peutic_db_logs_v14',
  MOODS: 'peutic_db_moods_v14',
  JOURNALS: 'peutic_db_journals_v14',
  ART: 'peutic_db_art_v14',
  PROMOS: 'peutic_db_promos_v14',
  ADMIN_ATTEMPTS: 'peutic_db_admin_attempts_v14',
  BREATHE_COOLDOWN: 'peutic_db_breathe_cooldown_v14',
  BREATHE_LOGS: 'peutic_db_breathe_logs_v14',
  MEMORIES: 'peutic_db_memories_v14',
  GIFTS: 'peutic_db_gifts_v14',
};

// CLEANED POOL: 50+ Unique, Friendly, High-Quality Portraits
export const STABLE_AVATAR_POOL = [
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800", // Ruby
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800", // Carter
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=800", // Anna
    "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=800", // James
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800", // Gloria
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800", // Danny
    "https://images.unsplash.com/photo-1619895862022-09114b41f16f?auto=format&fit=crop&q=80&w=800", // Olivia
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800", // Charlie
    "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=800", // Luna
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=800", // Zane
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=800", // Julia
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800", // Owen
    "https://images.unsplash.com/photo-1598550874175-4d7112ee7f41?auto=format&fit=crop&q=80&w=800", // Gabby
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800", // Male
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800", // Katya
    "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=800", // Ivy
    "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&q=80&w=800", // Samantha
    "https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&q=80&w=800", // Kai
    "https://images.unsplash.com/photo-1554151228-14d9def656ec?auto=format&fit=crop&q=80&w=800", // Jakey
    "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&q=80&w=800", // Liam
    "https://images.unsplash.com/photo-1530268729831-4b0b97f70be4?auto=format&fit=crop&q=80&w=800", // Beth
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=800", // Mary
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800", // Destiny
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=800", // Rosalie
    "https://images.unsplash.com/photo-1521119989659-a83eee488058?auto=format&fit=crop&q=80&w=800", // Raj
    "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&q=80&w=800", // Ben
    "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&q=80&w=800", // Steph
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800", // Extra 1
    "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?auto=format&fit=crop&q=80&w=800", // Extra 2
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800", // Extra 3
    "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&q=80&w=800", // Extra 4
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=800", // Extra 5
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=800", // Extra 6
    "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?auto=format&fit=crop&q=80&w=800", // Extra 7
    "https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&q=80&w=800", // Extra 8
    "https://images.unsplash.com/photo-1509967419530-da842fe72305?auto=format&fit=crop&q=80&w=800", // Extra 9
    "https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&q=80&w=800", // Extra 10
    "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&q=80&w=800", // Extra 11
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800", // Extra 12
    "https://images.unsplash.com/photo-1517365830460-955ce3ccd263?auto=format&fit=crop&q=80&w=800", // Extra 13
    "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=800", // Extra 14
    "https://images.unsplash.com/photo-1503467913725-deb546c1aa40?auto=format&fit=crop&q=80&w=800", // Extra 15
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=800", // Extra 16
    "https://images.unsplash.com/photo-1628157588553-5eeea00af15c?auto=format&fit=crop&q=80&w=800", // Extra 17
    "https://images.unsplash.com/photo-1581456495146-65a71b2c8e52?auto=format&fit=crop&q=80&w=800", // Extra 18
    "https://images.unsplash.com/photo-1503104834685-7205e8607eb9?auto=format&fit=crop&q=80&w=800", // Extra 19
    "https://images.unsplash.com/photo-1503185912284-5271ff81b9a8?auto=format&fit=crop&q=80&w=800", // Extra 20
    "https://images.unsplash.com/photo-1505033575518-a36ea2ef75ae?auto=format&fit=crop&q=80&w=800", // Extra 21
    "https://images.unsplash.com/photo-1503593245033-a040be3f3c82?auto=format&fit=crop&q=80&w=800", // Extra 22
    "https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&q=80&w=800", // Extra 23
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=800", // Extra 24
];

// Ensure INITIAL_COMPANIONS uses distinct indices from 0 to N to guarantee no duplicates
export const INITIAL_COMPANIONS: Companion[] = [
  { id: 'c1', name: 'Ruby', gender: 'Female', specialty: 'Anxiety & Panic', status: 'AVAILABLE', rating: 4.9, imageUrl: STABLE_AVATAR_POOL[0], bio: 'Specializing in grounding techniques.', replicaId: 're3a705cf66a' },
  { id: 'c2', name: 'Carter', gender: 'Male', specialty: 'Life Coaching', status: 'AVAILABLE', rating: 4.8, imageUrl: STABLE_AVATAR_POOL[1], bio: 'Success roadmap planning.', replicaId: 'rca8a38779a8' },
  { id: 'c3', name: 'James', gender: 'Male', specialty: 'Men\'s Health', status: 'AVAILABLE', rating: 4.9, imageUrl: STABLE_AVATAR_POOL[3], bio: 'Safe space for men.', replicaId: 'r92debe21318' },
  { id: 'c4', name: 'Danny', gender: 'Male', specialty: 'Grief Support', status: 'AVAILABLE', rating: 5.0, imageUrl: STABLE_AVATAR_POOL[5], bio: 'Walking beside you in grief.', replicaId: 'r62baeccd777' },
  { id: 'c5', name: 'Anna', gender: 'Female', specialty: 'Family Dynamics', status: 'AVAILABLE', rating: 4.9, imageUrl: STABLE_AVATAR_POOL[2], bio: 'Navigating complex relationships.', replicaId: 'r6ae5b6efc9d' },
  { id: 'c6', name: 'Gloria', gender: 'Female', specialty: 'Elder Care', status: 'AVAILABLE', rating: 5.0, imageUrl: STABLE_AVATAR_POOL[4], bio: 'Support for caregivers.', replicaId: 'r4317e64d25a' }, 
  { id: 'c7', name: 'Olivia', gender: 'Female', specialty: 'Workplace Stress', status: 'AVAILABLE', rating: 4.9, imageUrl: STABLE_AVATAR_POOL[6], bio: 'Burnout prevention strategies.', replicaId: 'rc2146c13e81' },
  { id: 'c8', name: 'Charlie', gender: 'Male', specialty: 'Listening Ear', status: 'AVAILABLE', rating: 4.8, imageUrl: STABLE_AVATAR_POOL[7], bio: 'Non-judgmental listening.', replicaId: 'rf4703150052' },
  { id: 'c9', name: 'Luna', gender: 'Female', specialty: 'Creative Blocks', status: 'AVAILABLE', rating: 4.9, imageUrl: STABLE_AVATAR_POOL[8], bio: 'Unlocking your potential.', replicaId: 're5c4a8dd5ea' },
  { id: 'c10', name: 'Julia', gender: 'Female', specialty: 'Relationships', status: 'AVAILABLE', rating: 4.9, imageUrl: STABLE_AVATAR_POOL[10], bio: 'Modern dating advice.', replicaId: 'rb43357fb2ee' },
  { id: 'c11', name: 'Gabby', gender: 'Female', specialty: 'Self-Esteem', status: 'AVAILABLE', rating: 5.0, imageUrl: STABLE_AVATAR_POOL[12], bio: 'Building core confidence.', replicaId: 'rdf61be0d4e1' },
  { id: 'c12', name: 'Katya', gender: 'Female', specialty: 'Mindfulness', status: 'AVAILABLE', rating: 4.8, imageUrl: STABLE_AVATAR_POOL[14], bio: 'Guided meditation.', replicaId: 'r5791c5ab229' },
  { id: 'c13', name: 'Ivy', gender: 'Female', specialty: 'Youth Mentoring', status: 'AVAILABLE', rating: 4.7, imageUrl: STABLE_AVATAR_POOL[15], bio: 'Young adult guidance.', replicaId: 'r991fc9af2be' },
  { id: 'c14', name: 'Zane', gender: 'Male', specialty: 'Addiction', status: 'AVAILABLE', rating: 4.9, imageUrl: STABLE_AVATAR_POOL[9], bio: 'Supportive accountability.', replicaId: 'r24efb3b9bef' },
  { id: 'c15', name: 'Rose', gender: 'Female', specialty: 'Trauma', status: 'AVAILABLE', rating: 4.9, imageUrl: STABLE_AVATAR_POOL[28], bio: 'Gentle processing.', replicaId: 'r3f8decedbd2' },
  { id: 'c16', name: 'Owen', gender: 'Male', specialty: 'Career', status: 'AVAILABLE', rating: 4.8, imageUrl: STABLE_AVATAR_POOL[11], bio: 'Career pivots and growth.', replicaId: 'r9458111c64a' },
  { id: 'c17', name: 'Samantha', gender: 'Female', specialty: 'Divorce', status: 'AVAILABLE', rating: 4.9, imageUrl: STABLE_AVATAR_POOL[16], bio: 'Separation support.', replicaId: 'rf6b1c8d5e9d' },
  { id: 'c18', name: 'Kai', gender: 'Male', specialty: 'LGBTQ+', status: 'AVAILABLE', rating: 5.0, imageUrl: STABLE_AVATAR_POOL[17], bio: 'Identity and acceptance.', replicaId: 'r31e11adf1d3' },
  { id: 'c19', name: 'Jakey', gender: 'Male', specialty: 'Social Anxiety', status: 'AVAILABLE', rating: 4.7, imageUrl: STABLE_AVATAR_POOL[18], bio: 'Overcoming shyness.', replicaId: 'r5fb46c843a8' },
  { id: 'c20', name: 'Liam', gender: 'Male', specialty: 'Anger Management', status: 'AVAILABLE', rating: 4.8, imageUrl: STABLE_AVATAR_POOL[19], bio: 'Emotional regulation.', replicaId: 'r90a0339d496' },
  { id: 'c21', name: 'Beth', gender: 'Female', specialty: 'Postpartum', status: 'AVAILABLE', rating: 5.0, imageUrl: STABLE_AVATAR_POOL[20], bio: 'New mother support.', replicaId: 'rec4a4153a78' },
  { id: 'c22', name: 'Mary', gender: 'Female', specialty: 'Nutrition', status: 'AVAILABLE', rating: 4.8, imageUrl: STABLE_AVATAR_POOL[21], bio: 'Holistic health.', replicaId: 'r6ca16dbe104' },
  { id: 'c23', name: 'Destiny', gender: 'Female', specialty: 'Spirituality', status: 'AVAILABLE', rating: 4.9, imageUrl: STABLE_AVATAR_POOL[22], bio: 'Finding purpose.', replicaId: 'r38a383b0173' },
  { id: 'c24', name: 'Rosalie', gender: 'Female', specialty: 'Sleep', status: 'AVAILABLE', rating: 4.8, imageUrl: STABLE_AVATAR_POOL[23], bio: 'Insomnia relief.', replicaId: 'r1af76e94d00' },
  { id: 'c25', name: 'Raj', gender: 'Male', specialty: 'Medical Stress', status: 'AVAILABLE', rating: 4.9, imageUrl: STABLE_AVATAR_POOL[24], bio: 'Chronic illness coping.', replicaId: 'ra066ab28864' },
  { id: 'c26', name: 'Ben', gender: 'Male', specialty: 'Financial Stress', status: 'AVAILABLE', rating: 4.7, imageUrl: STABLE_AVATAR_POOL[25], bio: 'Money mindset.', replicaId: 'r1a4e22fa0d9' },
  { id: 'c27', name: 'Steph', gender: 'Female', specialty: 'Parenting', status: 'AVAILABLE', rating: 4.9, imageUrl: STABLE_AVATAR_POOL[26], bio: 'Raising teens.', replicaId: 'r9c55f9312fb' },
];

export class Database {
  static getAllUsers(): User[] {
    const usersStr = localStorage.getItem(DB_KEYS.ALL_USERS);
    return usersStr ? JSON.parse(usersStr) : [];
  }

  static createUser(name: string, email: string, provider: 'email' | 'google' | 'facebook' | 'x', birthday?: string, role: UserRole = UserRole.USER): User {
    const users = this.getAllUsers();
    if (role === UserRole.ADMIN && provider !== 'email') role = UserRole.USER; 
    const defaultAvatar = "https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=800";
    const today = new Date().toISOString().split('T')[0];
    const newUser: User = {
      id: `u_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name, email, role, provider, balance: 0, avatar: defaultAvatar, 
      subscriptionStatus: 'ACTIVE', joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(), birthday,
      emailPreferences: { marketing: true, updates: true },
      streak: 1, lastLoginDate: today
    };
    users.push(newUser);
    localStorage.setItem(DB_KEYS.ALL_USERS, JSON.stringify(users));
    this.saveUserSession(newUser);
    return newUser;
  }

  static checkAndIncrementStreak(user: User): User {
      const today = new Date().toISOString().split('T')[0];
      const lastLogin = user.lastLoginDate ? user.lastLoginDate.split('T')[0] : null;
      if (lastLogin === today) return user;
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      let newStreak = user.streak || 0;
      if (lastLogin === yesterdayStr) newStreak += 1; else newStreak = 1;
      const updatedUser = { ...user, streak: newStreak, lastLoginDate: today, lastActive: new Date().toISOString() };
      this.updateUser(updatedUser);
      return updatedUser;
  }

  static deleteUser(userId: string) {
    let users = this.getAllUsers();
    users = users.filter(u => u.id !== userId);
    localStorage.setItem(DB_KEYS.ALL_USERS, JSON.stringify(users));
    this.clearSession();
  }

  static getUser(): User | null {
    const userStr = localStorage.getItem(DB_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  }

  static saveUserSession(user: User) { localStorage.setItem(DB_KEYS.USER, JSON.stringify(user)); }
  static clearSession() { localStorage.removeItem(DB_KEYS.USER); }
  static updateUser(updatedUser: User) {
    const users = this.getAllUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem(DB_KEYS.ALL_USERS, JSON.stringify(users));
    }
    const currentUser = this.getUser();
    if (currentUser && currentUser.id === updatedUser.id) this.saveUserSession(updatedUser);
  }

  static getUserByEmail(email: string): User | undefined { return this.getAllUsers().find(u => u.email.toLowerCase() === email.toLowerCase()); }
  static hasAdmin(): boolean { return this.getAllUsers().some(u => u.role === UserRole.ADMIN); }

  static checkAdminLockout(): number | null {
      const attemptsStr = localStorage.getItem(DB_KEYS.ADMIN_ATTEMPTS);
      if (!attemptsStr) return null;
      const data = JSON.parse(attemptsStr);
      if (data.count >= 5) {
          const now = Date.now();
          const diff = now - data.lastAttempt;
          if (diff < 24 * 60 * 60 * 1000) return Math.ceil((24 * 60 * 60 * 1000 - diff) / (60 * 1000)); 
          else { localStorage.removeItem(DB_KEYS.ADMIN_ATTEMPTS); return null; }
      }
      return null;
  }

  static recordAdminFailure() {
      const attemptsStr = localStorage.getItem(DB_KEYS.ADMIN_ATTEMPTS);
      let data = attemptsStr ? JSON.parse(attemptsStr) : { count: 0, lastAttempt: Date.now() };
      data.count += 1; data.lastAttempt = Date.now();
      localStorage.setItem(DB_KEYS.ADMIN_ATTEMPTS, JSON.stringify(data));
  }

  static resetAdminFailure() { localStorage.removeItem(DB_KEYS.ADMIN_ATTEMPTS); }

  static getCompanions(): Companion[] {
    const saved = localStorage.getItem(DB_KEYS.COMPANIONS);
    if (!saved) { localStorage.setItem(DB_KEYS.COMPANIONS, JSON.stringify(INITIAL_COMPANIONS)); return INITIAL_COMPANIONS; }
    return JSON.parse(saved);
  }

  static updateCompanion(updated: Companion) {
      const list = this.getCompanions();
      const idx = list.findIndex(c => c.id === updated.id);
      if (idx !== -1) { list[idx] = updated; localStorage.setItem(DB_KEYS.COMPANIONS, JSON.stringify(list)); }
  }

  static setAllCompanionsStatus(status: 'AVAILABLE' | 'BUSY' | 'OFFLINE') {
      const list = this.getCompanions();
      const updatedList = list.map(c => ({ ...c, status }));
      localStorage.setItem(DB_KEYS.COMPANIONS, JSON.stringify(updatedList));
  }

  static topUpWallet(minutes: number, cost: number, targetUserId?: string) {
    let user = targetUserId ? this.getAllUsers().find(u => u.id === targetUserId) || null : this.getUser();
    if (user) {
      user.balance += minutes;
      this.updateUser(user);
      this.addTransaction({
        id: `tx_${Date.now()}`, userId: user.id, userName: user.name,
        date: new Date().toISOString(), amount: minutes, cost: cost, description: 'Wallet Top-up', status: 'COMPLETED'
      });
    }
  }

  static deductBalance(minutes: number) {
    const user = this.getUser();
    if (user) { user.balance = Math.max(0, user.balance - minutes); this.updateUser(user); }
  }

  static getAllTransactions(): Transaction[] { return JSON.parse(localStorage.getItem(DB_KEYS.TRANSACTIONS) || '[]'); }
  static getUserTransactions(userId: string): Transaction[] { return this.getAllTransactions().filter(tx => tx.userId === userId).reverse(); }
  static addTransaction(tx: Transaction) {
    const all = this.getAllTransactions();
    if (!tx.userId) { const u = this.getUser(); if (u) { tx.userId = u.id; tx.userName = u.name; } }
    all.push(tx); localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(all));
  }

  static getSettings(): GlobalSettings {
    const saved = localStorage.getItem(DB_KEYS.SETTINGS);
    const defaultSettings = {
      pricePerMinute: 1.49, saleMode: true, maintenanceMode: false, allowSignups: true, siteName: 'Peutic',
      maxConcurrentSessions: 15, multilingualMode: true
    };
    if (!saved) return defaultSettings;
    const parsed = JSON.parse(saved);
    if (parsed.maxConcurrentSessions !== 15) { parsed.maxConcurrentSessions = 15; localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(parsed)); }
    return parsed;
  }

  static saveSettings(s: GlobalSettings) { localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(s)); }
  static getSystemLogs(): SystemLog[] { return JSON.parse(localStorage.getItem(DB_KEYS.LOGS) || '[]'); }
  static logSystemEvent(type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'SECURITY', event: string, details: string) {
      const logs = this.getSystemLogs();
      const newLog: SystemLog = { id: `log_${Date.now()}_${Math.random()}`, timestamp: new Date().toISOString(), type, event, details };
      logs.unshift(newLog); if (logs.length > 200) logs.pop(); localStorage.setItem(DB_KEYS.LOGS, JSON.stringify(logs));
  }

  // ==========================================
  // === QUEUE SYSTEM (SUPABASE) ===
  // ==========================================
  
  static async getActiveSessionCount(): Promise<number> {
      try {
          const { count, error } = await supabase
              .from('session_queue')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'active');
          if (error) throw error;
          return count || 0;
      } catch (e) {
          console.warn("Supabase Queue Error (Count):", e);
          return 0;
      }
  }

  // Returns the queue position (1-based).
  static async joinQueue(userId: string): Promise<number> {
      try {
          // 1. Check if user exists
          const { data: existing, error: fetchError } = await supabase
              .from('session_queue')
              .select('status, created_at')
              .eq('user_id', userId)
              .single();

          if (existing) {
              if (existing.status === 'active') return 0; // Already active, no wait
              
              // Calculate position among waiting
              const { count } = await supabase
                  .from('session_queue')
                  .select('*', { count: 'exact', head: true })
                  .eq('status', 'waiting')
                  .lt('created_at', existing.created_at);
              
              return (count || 0) + 1;
          }

          // 2. Insert new waiting user
          // NOTE: We do NOT pass created_at here. We rely on the server default (now())
          // to prevent client-side clock manipulation for queue jumping.
          const { data: inserted, error: insertError } = await supabase
              .from('session_queue')
              .insert([{ user_id: userId, status: 'waiting' }])
              .select()
              .single();
          
          if (insertError) throw insertError;

          // 3. Return position
          const { count } = await supabase
              .from('session_queue')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'waiting')
              .lt('created_at', inserted.created_at);
          
          return (count || 0) + 1;

      } catch (e) {
          console.error("Supabase Queue Join Failed:", e);
          return 1; // Fail-open to allow usage if DB down, or handle gracefully
      }
  }

  // Attempts to move user from Waiting -> Active
  static async enterActiveSession(userId: string): Promise<boolean> {
      try {
          const activeCount = await this.getActiveSessionCount();
          if (activeCount >= 15) return false;

          const { error } = await supabase
              .from('session_queue')
              .update({ status: 'active' })
              .eq('user_id', userId);
          
          return !error;
      } catch (e) {
          console.error("Enter Session Error:", e);
          return false;
      }
  }

  static async leaveQueue(userId: string) {
      await this.endSession(userId);
  }

  static async endSession(userId: string) {
      try {
          await supabase.from('session_queue').delete().eq('user_id', userId);
      } catch (e) {
          console.warn("End Session Error:", e);
      }
  }

  static async getQueuePosition(userId: string): Promise<number> {
      try {
          const { data: userRecord } = await supabase
              .from('session_queue')
              .select('created_at, status')
              .eq('user_id', userId)
              .single();
          
          if (!userRecord || userRecord.status === 'active') return 0;

          const { count } = await supabase
              .from('session_queue')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'waiting')
              .lt('created_at', userRecord.created_at);
          
          return (count || 0) + 1;
      } catch (e) {
          return 1;
      }
  }

  static getEstimatedWaitTime(position: number): number {
      return Math.max(0, (position - 1) * 3); // Approx 3 mins per person ahead
  }

  static saveJournal(entry: JournalEntry) { const j = JSON.parse(localStorage.getItem(DB_KEYS.JOURNALS) || '[]'); j.push(entry); localStorage.setItem(DB_KEYS.JOURNALS, JSON.stringify(j)); }
  static getJournals(userId: string): JournalEntry[] { return JSON.parse(localStorage.getItem(DB_KEYS.JOURNALS) || '[]').filter((j: JournalEntry) => j.userId === userId).reverse(); }
  static saveMood(userId: string, mood: 'confetti' | 'rain' | null) { if (!mood) return; const m = JSON.parse(localStorage.getItem(DB_KEYS.MOODS) || '[]'); m.push({ id: `mood_${Date.now()}`, userId, date: new Date().toISOString(), mood }); localStorage.setItem(DB_KEYS.MOODS, JSON.stringify(m)); }
  static getMoods(userId: string): MoodEntry[] { return JSON.parse(localStorage.getItem(DB_KEYS.MOODS) || '[]').filter((m: MoodEntry) => m.userId === userId).reverse(); }
  static recordBreathSession(userId: string, durationSeconds: number) { const l = JSON.parse(localStorage.getItem(DB_KEYS.BREATHE_LOGS) || '[]'); l.push({ id: `breath_${Date.now()}`, userId, date: new Date().toISOString(), durationSeconds }); localStorage.setItem(DB_KEYS.BREATHE_LOGS, JSON.stringify(l)); }
  static getBreathLogs(userId: string): BreathLog[] { return JSON.parse(localStorage.getItem(DB_KEYS.BREATHE_LOGS) || '[]').filter((l: BreathLog) => l.userId === userId); }
  
  static saveArt(entry: ArtEntry) {
      let art = JSON.parse(localStorage.getItem(DB_KEYS.ART) || '[]');
      art.push(entry);
      try { localStorage.setItem(DB_KEYS.ART, JSON.stringify(art)); } 
      catch (e: any) {
          if (e.name === 'QuotaExceededError' || e.code === 22) {
              while (art.length > 1) { art.shift(); try { localStorage.setItem(DB_KEYS.ART, JSON.stringify(art)); break; } catch (r) {} }
          }
      }
  }
  static getUserArt(userId: string): ArtEntry[] { return JSON.parse(localStorage.getItem(DB_KEYS.ART) || '[]').filter((a: ArtEntry) => a.userId === userId).reverse(); }
  static deleteArt(artId: string) { let art = JSON.parse(localStorage.getItem(DB_KEYS.ART) || '[]'); art = art.filter((a: ArtEntry) => a.id !== artId); localStorage.setItem(DB_KEYS.ART, JSON.stringify(art)); }
  static getBreathingCooldown(): number | null { const cd = localStorage.getItem(DB_KEYS.BREATHE_COOLDOWN); return cd ? parseInt(cd, 10) : null; }
  static setBreathingCooldown(timestamp: number) { localStorage.setItem(DB_KEYS.BREATHE_COOLDOWN, timestamp.toString()); }

  static getWeeklyProgress(userId: string): { current: number; target: number; message: string } {
      const now = new Date(); const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const tx = this.getUserTransactions(userId).filter(t => new Date(t.date) > oneWeekAgo && t.amount < 0);
      const j = this.getJournals(userId).filter(j => new Date(j.date) > oneWeekAgo);
      const a = this.getUserArt(userId).filter(a => new Date(a.createdAt) > oneWeekAgo);
      const m = this.getMoods(userId).filter(m => new Date(m.date) > oneWeekAgo);
      const b = this.getBreathLogs(userId).filter(b => new Date(b.date) > oneWeekAgo);
      const score = (tx.length * 3) + (j.length * 1) + (a.length * 1) + (b.length * 1) + (m.length * 0.5);
      const target = 10;
      let message = "Start your journey.";
      const pct = score / target;
      if (pct > 0 && pct < 0.3) message = "Great start!"; else if (pct >= 0.3 && pct < 0.6) message = "Building momentum!"; else if (pct >= 0.6 && pct < 1) message = "Almost there!"; else if (pct >= 1) message = "Goal Crushed! 🌟";
      return { current: score, target, message };
  }

  static getPromoCodes(): PromoCode[] { return JSON.parse(localStorage.getItem(DB_KEYS.PROMOS) || '[]'); }
  static createPromoCode(code: string, discount: number) { const list = this.getPromoCodes(); list.push({ id: Date.now().toString(), code: code.toUpperCase(), discountPercentage: discount, uses: 0, active: true }); localStorage.setItem(DB_KEYS.PROMOS, JSON.stringify(list)); }
  static deletePromoCode(id: string) { const list = this.getPromoCodes().filter(p => p.id !== id); localStorage.setItem(DB_KEYS.PROMOS, JSON.stringify(list)); }
  static exportData(type: 'USERS' | 'LOGS') {
      const data = type === 'USERS' ? this.getAllUsers() : this.getSystemLogs();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `peutic_${type.toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }
}