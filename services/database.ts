import { User, UserRole, Transaction, Companion, GlobalSettings, SystemLog, ServerMetric, MoodEntry, JournalEntry, PromoCode, SessionFeedback, ArtEntry, BreathLog, SessionMemory, GiftCard } from '../types';
import { supabase } from './supabaseClient';

const DB_KEYS = {
  USER: 'peutic_db_current_user_v16',
  ALL_USERS: 'peutic_db_users_v16', 
  COMPANIONS: 'peutic_db_companions_v16',
  TRANSACTIONS: 'peutic_db_transactions_v16',
  SETTINGS: 'peutic_db_settings_v16',
  LOGS: 'peutic_db_logs_v16',
  MOODS: 'peutic_db_moods_v16',
  JOURNALS: 'peutic_db_journals_v16',
  ART: 'peutic_db_art_v16',
  PROMOS: 'peutic_db_promos_v16',
  ADMIN_ATTEMPTS: 'peutic_db_admin_attempts_v16',
  BREATHE_COOLDOWN: 'peutic_db_breathe_cooldown_v16',
  BREATHE_LOGS: 'peutic_db_breathe_logs_v16',
  MEMORIES: 'peutic_db_memories_v16',
  GIFTS: 'peutic_db_gifts_v16',
  FEEDBACK: 'peutic_db_feedback_v16',
};

export const STABLE_AVATAR_POOL = [
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1619895862022-09114b41f16f?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1598550874175-4d7112ee7f41?auto=format&fit=crop&q=80&w=800", 
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800", 
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800", 
    "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1554151228-14d9def656ec?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1530268729831-4b0b97f70be4?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1521119989659-a83eee488058?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1546539782-6fc531453083?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1589571894960-20bbe2815d22?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=800"
];

export const INITIAL_COMPANIONS: Companion[] = [
  { id: 'c1', name: 'Ruby', gender: 'Female', specialty: 'Anxiety & Panic', status: 'AVAILABLE', rating: 4.9, imageUrl: STABLE_AVATAR_POOL[0], bio: 'Specializing in grounding techniques.', replicaId: 're3a705cf66a', licenseNumber: 'LCSW-NY-44021', degree: 'MSW, Columbia University', stateOfPractice: 'NY', yearsExperience: 8 },
  { id: 'c2', name: 'Carter', gender: 'Male', specialty: 'Life Coaching', status: 'AVAILABLE', rating: 4.8, imageUrl: STABLE_AVATAR_POOL[1], bio: 'Success roadmap planning.', replicaId: 'rca8a38779a8', licenseNumber: 'ICF-PCC-9921', degree: 'MBA, Stanford', stateOfPractice: 'CA', yearsExperience: 12 },
  { id: 'c3', name: 'James', gender: 'Male', specialty: 'Men\'s Health', status: 'AVAILABLE', rating: 4.9, imageUrl: STABLE_AVATAR_POOL[3], bio: 'Safe space for men.', replicaId: 'r92debe21318', licenseNumber: 'LMFT-TX-2201', degree: 'PhD, Psychology', stateOfPractice: 'TX', yearsExperience: 15 },
  { id: 'c4', name: 'Danny', gender: 'Male', specialty: 'Grief Support', status: 'AVAILABLE', rating: 5.0, imageUrl: STABLE_AVATAR_POOL[5], bio: 'Walking beside you in grief.', replicaId: 'r62baeccd777', licenseNumber: 'LPC-OH-5510', degree: 'MA, Counseling', stateOfPractice: 'OH', yearsExperience: 9 },
  { id: 'c5', name: 'Anna', gender: 'Female', specialty: 'Family Dynamics', status: 'AVAILABLE', rating: 4.9, imageUrl: STABLE_AVATAR_POOL[2], bio: 'Navigating complex relationships.', replicaId: 'r6ae5b6efc9d', licenseNumber: 'LMFT-CA-9901', degree: 'MS, Family Therapy', stateOfPractice: 'CA', yearsExperience: 11 },
  { id: 'c6', name: 'Gloria', gender: 'Female', specialty: 'Elder Care', status: 'AVAILABLE', rating: 5.0, imageUrl: STABLE_AVATAR_POOL[4], bio: 'Support for caregivers.', replicaId: 'r4317e64d25a', licenseNumber: 'BSW-FL-3321', degree: 'BSW, Gerontology', stateOfPractice: 'FL', yearsExperience: 20 },
  { id: 'c7', name: 'Olivia', gender: 'Female', specialty: 'Workplace Stress', status: 'AVAILABLE', rating: 4.9, imageUrl: STABLE_AVATAR_POOL[6], bio: 'Burnout prevention strategies.', replicaId: 'rc2146c13e81', licenseNumber: 'PsyD-NY-1102', degree: 'PsyD, Org Psychology', stateOfPractice: 'NY', yearsExperience: 7 },
  { id: 'c8', name: 'Marcus', gender: 'Male', specialty: 'Addiction Recovery', status: 'AVAILABLE', rating: 4.9, imageUrl: STABLE_AVATAR_POOL[7], bio: 'One day at a time.', replicaId: 'r_marcus', licenseNumber: 'LAC-NJ-8821', degree: 'MA, Addiction Counseling', stateOfPractice: 'NJ', yearsExperience: 14 },
  { id: 'c9', name: 'Elena', gender: 'Female', specialty: 'Postpartum Support', status: 'AVAILABLE', rating: 5.0, imageUrl: STABLE_AVATAR_POOL[8], bio: 'Supporting new mothers.', replicaId: 'r_elena', licenseNumber: 'LCSW-TX-3321', degree: 'MSW, Clinical Social Work', stateOfPractice: 'TX', yearsExperience: 6 },
  { id: 'c10', name: 'Dr. Chen', gender: 'Male', specialty: 'Executive Burnout', status: 'BUSY', rating: 5.0, imageUrl: STABLE_AVATAR_POOL[9], bio: 'High performance sustainability.', replicaId: 'r_chen', licenseNumber: 'PsyD-CA-9921', degree: 'PsyD, Org Psychology', stateOfPractice: 'CA', yearsExperience: 18 },
  { id: 'c11', name: 'Sarah', gender: 'Female', specialty: 'Eating Disorders', status: 'AVAILABLE', rating: 4.8, imageUrl: STABLE_AVATAR_POOL[10], bio: 'Building a healthy relationship with food.', replicaId: 'r_sarah', licenseNumber: 'RD-NY-4421', degree: 'MS, Nutrition & Psychology', stateOfPractice: 'NY', yearsExperience: 9 },
  { id: 'c12', name: 'Malik', gender: 'Male', specialty: 'Trauma & PTSD', status: 'AVAILABLE', rating: 4.9, imageUrl: STABLE_AVATAR_POOL[11], bio: 'Healing the past.', replicaId: 'r_malik', licenseNumber: 'LPC-IL-2210', degree: 'PhD, Clinical Psychology', stateOfPractice: 'IL', yearsExperience: 11 },
  { id: 'c13', name: 'Zoe', gender: 'Female', specialty: 'LGBTQ+ Issues', status: 'AVAILABLE', rating: 5.0, imageUrl: STABLE_AVATAR_POOL[12], bio: 'Affirming and inclusive care.', replicaId: 'r_zoe', licenseNumber: 'LMFT-OR-5521', degree: 'MA, Counseling Psychology', stateOfPractice: 'OR', yearsExperience: 5 },
  { id: 'c14', name: 'Liam', gender: 'Male', specialty: 'Anger Management', status: 'AVAILABLE', rating: 4.7, imageUrl: STABLE_AVATAR_POOL[13], bio: 'Constructive expression.', replicaId: 'r_liam', licenseNumber: 'LCSW-MA-8812', degree: 'MSW, Social Work', stateOfPractice: 'MA', yearsExperience: 13 },
  { id: 'c15', name: 'Aisha', gender: 'Female', specialty: 'Cultural Identity', status: 'AVAILABLE', rating: 4.9, imageUrl: STABLE_AVATAR_POOL[14], bio: 'Navigating dual identities.', replicaId: 'r_aisha', licenseNumber: 'LPC-GA-3321', degree: 'MA, Multicultural Counseling', stateOfPractice: 'GA', yearsExperience: 7 },
  { id: 'c16', name: 'Noah', gender: 'Male', specialty: 'Teen Anxiety', status: 'AVAILABLE', rating: 4.8, imageUrl: STABLE_AVATAR_POOL[15], bio: 'Helping teens navigate pressure.', replicaId: 'r_noah', licenseNumber: 'LMFT-WA-9921', degree: 'MA, Family Therapy', stateOfPractice: 'WA', yearsExperience: 6 },
  { id: 'c17', name: 'Dr. Patel', gender: 'Female', specialty: 'Sleep Insomnia', status: 'AVAILABLE', rating: 5.0, imageUrl: STABLE_AVATAR_POOL[16], bio: 'Restoring natural rhythms.', replicaId: 'r_patel', licenseNumber: 'MD-NY-1102', degree: 'MD, Psychiatry', stateOfPractice: 'NY', yearsExperience: 22 },
  { id: 'c18', name: 'Sofia', gender: 'Female', specialty: 'Chronic Pain', status: 'AVAILABLE', rating: 4.9, imageUrl: STABLE_AVATAR_POOL[17], bio: 'Mind-body healing.', replicaId: 'r_sofia', licenseNumber: 'PhD-CA-1123', degree: 'PhD, Health Psychology', stateOfPractice: 'CA', yearsExperience: 12 },
  { id: 'c19', name: 'Jackson', gender: 'Male', specialty: 'Sports Psychology', status: 'AVAILABLE', rating: 4.8, imageUrl: STABLE_AVATAR_POOL[18], bio: 'Peak performance mindset.', replicaId: 'r_jackson', licenseNumber: 'PsyD-FL-4421', degree: 'PsyD, Sports Psychology', stateOfPractice: 'FL', yearsExperience: 8 },
  { id: 'c20', name: 'Emma', gender: 'Female', specialty: 'Relationship Counseling', status: 'AVAILABLE', rating: 5.0, imageUrl: STABLE_AVATAR_POOL[19], bio: 'Building stronger bonds.', replicaId: 'r_emma', licenseNumber: 'LMFT-TX-8821', degree: 'MA, Marriage & Family', stateOfPractice: 'TX', yearsExperience: 10 },
  { id: 'c21', name: 'Lucas', gender: 'Male', specialty: 'Digital Addiction', status: 'AVAILABLE', rating: 4.7, imageUrl: STABLE_AVATAR_POOL[20], bio: 'Unplugging for mental health.', replicaId: 'r_lucas', licenseNumber: 'LCSW-NY-3321', degree: 'MSW, Social Work', stateOfPractice: 'NY', yearsExperience: 6 },
  { id: 'c22', name: 'Mia', gender: 'Female', specialty: 'Self-Esteem', status: 'AVAILABLE', rating: 4.9, imageUrl: STABLE_AVATAR_POOL[21], bio: 'Finding your inner voice.', replicaId: 'r_mia', licenseNumber: 'LPC-CO-9921', degree: 'MA, Counseling', stateOfPractice: 'CO', yearsExperience: 9 },
  { id: 'c23', name: 'William', gender: 'Male', specialty: 'Divorce Recovery', status: 'AVAILABLE', rating: 4.8, imageUrl: STABLE_AVATAR_POOL[22], bio: 'Navigating life transitions.', replicaId: 'r_william', licenseNumber: 'LMFT-IL-5521', degree: 'MA, Family Therapy', stateOfPractice: 'IL', yearsExperience: 15 },
  { id: 'c24', name: 'Ava', gender: 'Female', specialty: 'Social Anxiety', status: 'AVAILABLE', rating: 5.0, imageUrl: STABLE_AVATAR_POOL[23], bio: 'Building confidence socially.', replicaId: 'r_ava', licenseNumber: 'PsyD-MA-1123', degree: 'PsyD, Clinical Psychology', stateOfPractice: 'MA', yearsExperience: 7 },
  { id: 'c25', name: 'Benjamin', gender: 'Male', specialty: 'Fatherhood', status: 'AVAILABLE', rating: 4.9, imageUrl: STABLE_AVATAR_POOL[24], bio: 'Supporting new dads.', replicaId: 'r_benjamin', licenseNumber: 'LCSW-WA-4421', degree: 'MSW, Social Work', stateOfPractice: 'WA', yearsExperience: 11 },
  { id: 'c26', name: 'Charlotte', gender: 'Female', specialty: 'Art Therapy', status: 'AVAILABLE', rating: 5.0, imageUrl: STABLE_AVATAR_POOL[25], bio: 'Healing through creativity.', replicaId: 'r_charlotte', licenseNumber: 'ATR-BC-NY-8821', degree: 'MA, Art Therapy', stateOfPractice: 'NY', yearsExperience: 14 },
  { id: 'c27', name: 'Henry', gender: 'Male', specialty: 'Financial Stress', status: 'AVAILABLE', rating: 4.8, imageUrl: STABLE_AVATAR_POOL[26], bio: 'Managing money mindset.', replicaId: 'r_henry', licenseNumber: 'LPC-OH-3321', degree: 'MA, Counseling', stateOfPractice: 'OH', yearsExperience: 13 }
];

export class Database {
  // Static flag to handle graceful degradation when Supabase is not fully configured
  static isOfflineMode = false;

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
    this.syncUserToSupabase(newUser);
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
    
    if (!this.isOfflineMode) {
        supabase.from('users').delete().eq('id', userId).then(({ error }) => {
            if (error) console.error("Supabase Delete Error:", error);
        });
    }
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
    this.syncUserToSupabase(updatedUser);
  }

  static async syncUserToSupabase(user: User) {
      if (this.isOfflineMode) return;
      try {
          const { error } = await supabase.from('users').upsert({
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              provider: user.provider,
              balance: user.balance,
              avatar: user.avatar,
              subscription_status: user.subscriptionStatus,
              created_at: user.joinedAt,
              last_active: user.lastActive,
              birthday: user.birthday,
              streak: user.streak
          });
          if (error) {
              if (error.message.includes("Could not find the table") || error.code === '42P01') {
                  console.warn("Supabase tables missing. Switching to Local-Only Mode.");
                  this.isOfflineMode = true;
              } else {
                  console.warn("Supabase Sync Warning:", error.message);
              }
          }
      } catch (e) { console.warn("Supabase Sync Failed (Offline Mode)", e); }
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
      this.updateUser(user); // Triggers sync to Supabase Users table
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
    all.push(tx); 
    localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(all));
    
    if (!this.isOfflineMode) {
        supabase.from('transactions').insert([{
            id: tx.id, user_id: tx.userId, amount: tx.amount, cost: tx.cost, description: tx.description, status: tx.status, created_at: tx.date
        }]).then(({ error }) => { if(error) console.error("Supabase Tx Error:", error); });
    }
  }

  static getSettings(): GlobalSettings {
    const saved = localStorage.getItem(DB_KEYS.SETTINGS);
    const defaultSettings = {
      pricePerMinute: 1.49, saleMode: true, maintenanceMode: false, allowSignups: true, siteName: 'Peutic', broadcastMessage: undefined, maxConcurrentSessions: 15, multilingualMode: true
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
  // === GLOBAL QUEUE SYSTEM (SUPABASE) ===
  // ==========================================
  
  static async getActiveSessionCount(): Promise<number> {
      if (this.isOfflineMode) return 0; // Fallback: 0 active sessions implies "Available"
      try {
          const { count, error } = await supabase
              .from('session_queue')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'active');
          
          if (error) throw error;
          return count || 0;
      } catch (e: any) {
          if (e.message?.includes("Could not find the table") || e.code === '42P01') {
             this.isOfflineMode = true;
             console.warn("Queue Tables Missing. Switching to Offline Mode.");
          }
          return 0; // Fallback unsafe
      }
  }

  static async getQueueList(): Promise<string[]> {
      if (this.isOfflineMode) return [];
      try {
          const { data, error } = await supabase
              .from('session_queue')
              .select('user_id')
              .eq('status', 'waiting')
              .order('created_at', { ascending: true });
          
          if (error) throw error;
          return data ? data.map((d: any) => d.user_id) : [];
      } catch (e) {
          return [];
      }
  }

  static async leaveQueue(userId: string) {
      await this.endSession(userId);
  }

  // Returns queue position. 0 means you are active or something went wrong.
  // Updated to use secure RPC call
  static async joinQueue(userId: string): Promise<number> {
      if (this.isOfflineMode) return 1; 
      try {
          // Use secure RPC to prevent race conditions and "mutable search_path" warnings from raw sql usage
          const { data, error } = await supabase.rpc('join_queue', { user_id_input: userId });
          
          if (error) {
              // Fallback to old method if function missing (for backward compatibility)
              if (error.message?.includes("function not found")) {
                  return await this.fallbackJoinQueue(userId);
              }
              // If table is missing, switch to offline mode immediately
              if (error.message?.includes("relation") || error.code === '42P01') {
                 this.isOfflineMode = true;
                 return 1;
              }
              throw error;
          }
          return data as number;
      } catch (e: any) {
          if (e.message?.includes("Could not find the table") || e.code === '42P01') {
              this.isOfflineMode = true;
              return 1; 
          }
          console.error("Join Queue Error:", e);
          return 99;
      }
  }

  // Fallback for when RPC is missing
  static async fallbackJoinQueue(userId: string): Promise<number> {
      const { data: existing, error } = await supabase.from('session_queue').select('status, created_at').eq('user_id', userId).single();
      if (error && error.code !== 'PGRST116') throw error; 

      if (existing && existing.status === 'active') return 0;
      
      if (!existing) {
          const { error: insertError } = await supabase.from('session_queue').insert({ user_id: userId, status: 'waiting' });
          if (insertError) throw insertError;
      } else {
          await supabase.from('session_queue').update({ last_ping: new Date() }).eq('user_id', userId);
      }
      return await this.getQueuePosition(userId);
  }

  static async getQueuePosition(userId: string): Promise<number> {
      if (this.isOfflineMode) return 1;
      try {
          const { data: myRow } = await supabase.from('session_queue').select('created_at, status').eq('user_id', userId).single();
          if (!myRow) return 0;
          if (myRow.status === 'active') return 0;

          const { count } = await supabase
              .from('session_queue')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'waiting')
              .lt('created_at', myRow.created_at);
          
          return (count || 0) + 1;
      } catch (e) {
          return 99;
      }
  }

  static getEstimatedWaitTime(position: number): number {
      return Math.max(0, (position - 1) * 3);
  }

  // ATTEMPT TO ENTER: Returns true if successfully claimed a spot
  static async claimActiveSpot(userId: string): Promise<boolean> {
      if (this.isOfflineMode) return true; 
      
      try {
          const { data, error } = await supabase.rpc('claim_session_spot', { user_id_input: userId });
          
          if (!error) {
              return !!data;
          } else {
              if (error.message?.includes("function not found")) {
                  // RPC missing, use fallback
              } else if (error.message?.includes("relation") || error.code === '42P01') {
                   this.isOfflineMode = true;
                   return true;
              }
              console.warn("RPC Failed (using fallback):", error.message);
          }

          // Fallback Logic
          const activeCount = await this.getActiveSessionCount();
          const MAX_CONCURRENT = 15;

          if (activeCount >= MAX_CONCURRENT) return false;

          const pos = await this.getQueuePosition(userId);
          
          if (pos <= 1 || activeCount < MAX_CONCURRENT) {
              const { error } = await supabase
                  .from('session_queue')
                  .update({ status: 'active', last_ping: new Date() })
                  .eq('user_id', userId)
                  .eq('status', 'waiting');
              
              return !error;
          }
          return false;
      } catch (e) {
          console.error("Claim Spot Error", e);
          // If totally broken, allow entry to avoid bad UX
          return true;
      }
  }

  static async endSession(userId: string) {
      if (this.isOfflineMode) return;
      try {
          await supabase.from('session_queue').delete().eq('user_id', userId);
      } catch (e) { console.error("End Session Error", e); }
  }

  // Updated to use secure RPC
  static async sendKeepAlive(userId: string) {
      if (this.isOfflineMode) return;
      try {
          const { error } = await supabase.rpc('heartbeat', { user_id_input: userId });
          if (error) throw error;
      } catch (e) {
          // Fallback
          try { await supabase.from('session_queue').update({ last_ping: new Date() }).eq('user_id', userId); } catch (err) {}
      }
  }

  static async enterActiveSession(userId: string) {
      await this.claimActiveSpot(userId);
  }

  static saveFeedback(feedback: SessionFeedback) {
      const list = this.getAllFeedback();
      list.unshift(feedback);
      if (list.length > 200) list.pop();
      localStorage.setItem(DB_KEYS.FEEDBACK, JSON.stringify(list));
      
      if (!this.isOfflineMode) {
          supabase.from('session_feedback').insert([{
              id: feedback.id, 
              user_id: feedback.userId, 
              companion_name: feedback.companionName,
              rating: feedback.rating,
              tags: feedback.tags,
              duration: feedback.duration,
              created_at: feedback.date
          }]).then(({ error }) => { if(error) console.error("Supabase Feedback Error:", error); });
      }
  }

  // ... (Rest of existing methods unchanged) ...
  static getAllFeedback(): SessionFeedback[] { return JSON.parse(localStorage.getItem(DB_KEYS.FEEDBACK) || '[]'); }
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