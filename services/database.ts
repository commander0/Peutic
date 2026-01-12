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

// --- FULL SEED DATA (35 Specialists) ---
export const INITIAL_COMPANIONS: Companion[] = [
  { id: 'c1', name: 'Ruby', gender: 'Female', specialty: 'Anxiety & Panic', status: 'AVAILABLE', rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800", bio: 'Specializing in grounding techniques and immediate panic reduction.', replicaId: 're3a705cf66a', licenseNumber: 'LCSW-NY-44021', degree: 'MSW, Columbia University', stateOfPractice: 'NY', yearsExperience: 8 },
  { id: 'c2', name: 'Carter', gender: 'Male', specialty: 'Life Coaching', status: 'AVAILABLE', rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800", bio: 'Success roadmap planning and career strategy.', replicaId: 'rca8a38779a8', licenseNumber: 'ICF-PCC-9921', degree: 'MBA, Stanford', stateOfPractice: 'CA', yearsExperience: 12 },
  { id: 'c3', name: 'James', gender: 'Male', specialty: 'Men\'s Health', status: 'AVAILABLE', rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=800", bio: 'Safe space for men.', replicaId: 'r92debe21318', licenseNumber: 'LMFT-TX-2201', degree: 'PhD, Psychology', stateOfPractice: 'TX', yearsExperience: 15 },
  { id: 'c4', name: 'Scarlett', gender: 'Female', specialty: 'Women\'s Issues', status: 'AVAILABLE', rating: 5.0, imageUrl: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&q=80&w=800", bio: 'Empowerment and health.', replicaId: 're3a705cf66a', licenseNumber: 'LCSW-NY-1188', degree: 'MSW, Social Work', stateOfPractice: 'NY', yearsExperience: 13 },
  { id: 'c5', name: 'Anna', gender: 'Female', specialty: 'Family Dynamics', status: 'AVAILABLE', rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?auto=format&fit=crop&q=80&w=800", bio: 'Navigating complex relationships.', replicaId: 'r6ae5b6efc9d', licenseNumber: 'LMFT-CA-9901', degree: 'MS, Family Therapy', stateOfPractice: 'CA', yearsExperience: 11 },
  { id: 'c6', name: 'Gloria', gender: 'Female', specialty: 'Elder Care', status: 'AVAILABLE', rating: 5.0, imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800", bio: 'Support for caregivers.', replicaId: 'r4317e64d25a', licenseNumber: 'BSW-FL-3321', degree: 'BSW, Gerontology', stateOfPractice: 'FL', yearsExperience: 20 },
  { id: 'c7', name: 'Olivia', gender: 'Female', specialty: 'Workplace Stress', status: 'AVAILABLE', rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1619895862022-09114b41f16f?auto=format&fit=crop&q=80&w=800", bio: 'Burnout prevention strategies.', replicaId: 'rc2146c13e81', licenseNumber: 'PsyD-NY-1102', degree: 'PsyD, Org Psychology', stateOfPractice: 'NY', yearsExperience: 7 },
  { id: 'c8', name: 'Marcus', gender: 'Male', specialty: 'Addiction Recovery', status: 'AVAILABLE', rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800", bio: 'One day at a time.', replicaId: 'rca8a38779a8', licenseNumber: 'LAC-NJ-8821', degree: 'MA, Addiction Counseling', stateOfPractice: 'NJ', yearsExperience: 14 },
  { id: 'c9', name: 'Elena', gender: 'Female', specialty: 'Postpartum Support', status: 'AVAILABLE', rating: 5.0, imageUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=800", bio: 'Supporting new mothers.', replicaId: 're3a705cf66a', licenseNumber: 'LCSW-TX-3321', degree: 'MSW, Clinical Social Work', stateOfPractice: 'TX', yearsExperience: 6 },
  { id: 'c10', name: 'Dr. Chen', gender: 'Male', specialty: 'Executive Burnout', status: 'BUSY', rating: 5.0, imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=800", bio: 'High performance sustainability.', replicaId: 'rca8a38779a8', licenseNumber: 'PsyD-CA-9921', degree: 'PsyD, Org Psychology', stateOfPractice: 'CA', yearsExperience: 18 },
  { id: 'c11', name: 'Sarah', gender: 'Female', specialty: 'Eating Disorders', status: 'AVAILABLE', rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=800", bio: 'Building a healthy relationship with food.', replicaId: 'r6ae5b6efc9d', licenseNumber: 'RD-NY-4421', degree: 'MS, Nutrition & Psychology', stateOfPractice: 'NY', yearsExperience: 9 },
  { id: 'c12', name: 'Malik', gender: 'Male', specialty: 'Trauma & PTSD', status: 'AVAILABLE', rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800", bio: 'Healing the past.', replicaId: 'r92debe21318', licenseNumber: 'LPC-IL-2210', degree: 'PhD, Clinical Psychology', stateOfPractice: 'IL', yearsExperience: 11 },
  { id: 'c13', name: 'Zoey', gender: 'Female', specialty: 'LGBTQ+ Issues', status: 'AVAILABLE', rating: 5.0, imageUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=800", bio: 'Affirming and inclusive care.', replicaId: 're3a705cf66a', licenseNumber: 'LMFT-OR-5521', degree: 'MA, Counseling Psychology', stateOfPractice: 'OR', yearsExperience: 5 },
  { id: 'c14', name: 'Liam', gender: 'Male', specialty: 'Anger Management', status: 'AVAILABLE', rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=800", bio: 'Constructive expression.', replicaId: 'rca8a38779a8', licenseNumber: 'LCSW-MA-8812', degree: 'MSW, Social Work', stateOfPractice: 'MA', yearsExperience: 13 },
  { id: 'c15', name: 'Avery', gender: 'Female', specialty: 'ADHD Support', status: 'AVAILABLE', rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800", bio: 'Thriving with neurodiversity.', replicaId: 'rc2146c13e81', licenseNumber: 'PsyD-MA-6622', degree: 'PsyD, Psychology', stateOfPractice: 'MA', yearsExperience: 10 },
  { id: 'c16', name: 'Noah', gender: 'Male', specialty: 'Teen Anxiety', status: 'AVAILABLE', rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=800", bio: 'Helping teens navigate pressure.', replicaId: 'r92debe21318', licenseNumber: 'LMFT-WA-9921', degree: 'MA, Family Therapy', stateOfPractice: 'WA', yearsExperience: 6 },
  { id: 'c17', name: 'Dr. Patel', gender: 'Female', specialty: 'Sleep Insomnia', status: 'AVAILABLE', rating: 5.0, imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800", bio: 'Restoring natural rhythms.', replicaId: 'rc2146c13e81', licenseNumber: 'MD-NY-1102', degree: 'MD, Psychiatry', stateOfPractice: 'NY', yearsExperience: 22 },
  { id: 'c18', name: 'Sofia', gender: 'Female', specialty: 'Chronic Pain', status: 'AVAILABLE', rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=800", bio: 'Mind-body healing.', replicaId: 're3a705cf66a', licenseNumber: 'PhD-CA-1123', degree: 'PhD, Health Psychology', stateOfPractice: 'CA', yearsExperience: 12 },
  { id: 'c19', name: 'Jackson', gender: 'Male', specialty: 'Sports Psychology', status: 'AVAILABLE', rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=800", bio: 'Peak performance mindset.', replicaId: 'rca8a38779a8', licenseNumber: 'PsyD-FL-4421', degree: 'PsyD, Sports Psychology', stateOfPractice: 'FL', yearsExperience: 8 },
  { id: 'c20', name: 'Matthew', gender: 'Male', specialty: 'Tech Burnout', status: 'AVAILABLE', rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=800", bio: 'Restoring digital balance.', replicaId: 'r92debe21318', licenseNumber: 'LMFT-WA-3399', degree: 'MA, Psychology', stateOfPractice: 'WA', yearsExperience: 7 },
  { id: 'c21', name: 'Lucas', gender: 'Male', specialty: 'Digital Addiction', status: 'AVAILABLE', rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&q=80&w=800", bio: 'Unplugging for mental health.', replicaId: 'r92debe21318', licenseNumber: 'LCSW-NY-3321', degree: 'MSW, Social Work', stateOfPractice: 'NY', yearsExperience: 6 },
  { id: 'c22', name: 'Isabella', gender: 'Female', specialty: 'Grief Counseling', status: 'AVAILABLE', rating: 5.0, imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800", bio: 'Finding light in darkness.', replicaId: 're3a705cf66a', licenseNumber: 'LCSW-NY-1102', degree: 'MSW, Social Work', stateOfPractice: 'NY', yearsExperience: 14 },
  { id: 'c23', name: 'William', gender: 'Male', specialty: 'Divorce Recovery', status: 'AVAILABLE', rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=800", bio: 'Navigating life transitions.', replicaId: 'rca8a38779a8', licenseNumber: 'LMFT-IL-5521', degree: 'MA, Family Therapy', stateOfPractice: 'IL', yearsExperience: 15 },
  { id: 'c24', name: 'Maya', gender: 'Female', specialty: 'Cultural Identity', status: 'AVAILABLE', rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&q=80&w=800", bio: 'Navigating dual cultures and belonging.', replicaId: 're3a705cf66a', licenseNumber: 'LCSW-CA-1102', degree: 'MSW, Social Work', stateOfPractice: 'CA', yearsExperience: 9 },
  { id: 'c25', name: 'Caleb', gender: 'Male', specialty: 'Imposter Syndrome', status: 'AVAILABLE', rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800", bio: 'Owning your success with confidence.', replicaId: 'rca8a38779a8', licenseNumber: 'LPC-TX-9921', degree: 'MA, Counseling', stateOfPractice: 'TX', yearsExperience: 7 },
  { id: 'c26', name: 'Chloe', gender: 'Female', specialty: 'Pet Loss Grief', status: 'AVAILABLE', rating: 5.0, imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800", bio: 'Honoring the bond with our animal companions.', replicaId: 'r6ae5b6efc9d', licenseNumber: 'LMFT-NY-2210', degree: 'MS, Family Therapy', stateOfPractice: 'NY', yearsExperience: 12 },
  { id: 'c27', name: 'Jordan', gender: 'Male', specialty: 'Military Transition', status: 'AVAILABLE', rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800", bio: 'From service to civilian life.', replicaId: 'r92debe21318', licenseNumber: 'LCSW-VA-4421', degree: 'MS, Clinical Social Work', stateOfPractice: 'VA', yearsExperience: 16 },
  { id: 'c28', name: 'Layla', gender: 'Female', specialty: 'Fertility Support', status: 'AVAILABLE', rating: 5.0, imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=800", bio: 'Supporting your path to parenthood.', replicaId: 're3a705cf66a', licenseNumber: 'PhD-CA-8821', degree: 'PhD, Health Psychology', stateOfPractice: 'CA', yearsExperience: 14 },
  { id: 'c29', name: 'Henry', gender: 'Male', specialty: 'Retirement Adjustment', status: 'AVAILABLE', rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&q=80&w=800", bio: 'Finding purpose in the next chapter.', replicaId: 'rca8a38779a8', licenseNumber: 'LMFT-FL-3321', degree: 'MA, Counseling', stateOfPractice: 'FL', yearsExperience: 25 },
  { id: 'c30', name: 'Nora', gender: 'Female', specialty: 'Caregiver Stress', status: 'AVAILABLE', rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800", bio: 'Caring for yourself while caring for others.', replicaId: 'r4317e64d25a', licenseNumber: 'LCSW-OH-9912', degree: 'MSW, Social Work', stateOfPractice: 'OH', yearsExperience: 18 },
  { id: 'c31', name: 'Owen', gender: 'Male', specialty: 'Gaming Addiction', status: 'AVAILABLE', rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=800", bio: 'Balancing virtual worlds with reality.', replicaId: 'r92debe21318', licenseNumber: 'LPC-WA-2210', degree: 'MA, Psychology', stateOfPractice: 'WA', yearsExperience: 6 },
  { id: 'c32', name: 'Luna', gender: 'Female', specialty: 'Spiritual Crisis', status: 'AVAILABLE', rating: 5.0, imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=800", bio: 'Navigating faith transitions and meaning.', replicaId: 'rc2146c13e81', licenseNumber: 'LMFT-OR-5521', degree: 'MA, Transpersonal Psych', stateOfPractice: 'OR', yearsExperience: 11 },
  { id: 'c33', name: 'Gabriel', gender: 'Male', specialty: 'Anger Regulation', status: 'AVAILABLE', rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?auto=format&fit=crop&q=80&w=800", bio: 'Transforming rage into constructive action.', replicaId: 'rca8a38779a8', licenseNumber: 'PsyD-IL-4421', degree: 'PsyD, Clinical Psychology', stateOfPractice: 'IL', yearsExperience: 13 },
  { id: 'c34', name: 'Sophie', gender: 'Female', specialty: 'Social Anxiety', status: 'AVAILABLE', rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800", bio: 'Building confidence in connection.', replicaId: 'r6ae5b6efc9d', licenseNumber: 'LCSW-NY-3399', degree: 'MSW, Social Work', stateOfPractice: 'NY', yearsExperience: 8 },
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

  // --- SESSION & USER SYNC ---

  static async restoreSession(): Promise<User | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Attempt to sync from public.users
        let user = await this.syncUser(session.user.id);
        
        // If user is missing in DB but exists in Auth (Trigger failed), create explicitly
        if (!user) {
            console.warn("Auth exists but DB profile missing. Attempting explicit creation.");
            user = await this.repairProfile(session.user);
        }
        return user;
      }
    } catch (e) {
      console.warn("Restore Session Failed", e);
    }
    return this.currentUser;
  }

  // FORCE CREATE PROFILE (Fallback if Trigger fails)
  private static async repairProfile(authUser: any): Promise<User | null> {
    const newUser = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        role: 'USER',
        balance: 0,
        provider: authUser.app_metadata?.provider || 'email'
    };

    // Try insert
    const { error } = await supabase.from('users').insert(newUser);
    
    // Return optimistic user even if insert fails (likely race condition with Trigger)
    const optimisticUser: User = {
        id: authUser.id,
        email: authUser.email,
        name: newUser.name,
        role: UserRole.USER,
        balance: 0,
        subscriptionStatus: 'ACTIVE',
        joinedAt: new Date().toISOString(),
        lastLoginDate: new Date().toISOString(),
        streak: 0,
        provider: 'email',
        emailPreferences: { marketing: true, updates: true }
    };

    if (error && error.code !== '23505') { // Ignore duplicate key error
        console.error("Manual profile creation failed:", error);
    }

    // Attempt sync again, but fallback to optimistic
    return (await this.syncUser(authUser.id)) || optimisticUser;
  }

  static getUser(): User | null { return this.currentUser; }
  static saveUserSession(user: User) { this.currentUser = user; }
  static clearSession() { this.currentUser = null; supabase.auth.signOut(); }

  static async syncUser(userId: string): Promise<User | null> {
      if (!userId) return null;
      try {
          const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
          if (data && !error) {
              this.currentUser = this.mapUser(data);
              return this.currentUser;
          }
      } catch (e) {
          console.error("User sync error", e);
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
          streak: data.streak || 0,
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
            
            // Sync failed? repair immediately.
            return await this.repairProfile(data.user) as User;
        }
    }
    throw new Error("Login failed. Please try again.");
  }

  static async createUser(name: string, email: string, password?: string, provider: string = 'email'): Promise<User> {
    if (provider === 'email' && password) {
        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { full_name: name } }
        });
        
        if (error) throw new Error(error.message);
        
        if (data.user) {
            // Check if user exists in DB (Trigger should have run)
            let user = await this.syncUser(data.user.id);
            
            // If trigger was slow, force insert manually
            if (!user) {
                user = await this.repairProfile(data.user);
            }

            // AUTO-LOGIN if session exists (Supabase sometimes returns session on signup)
            if (data.session) {
                this.currentUser = user;
                return user!;
            } else {
                // If email confirmation is required, Supabase won't return a session
                // We return a dummy user to let the UI show "Check Email"
                throw new Error("Account created! Please check your email to confirm verification, then log in.");
            }
        }
    } else if (provider !== 'email') {
        // Optimistic Social Login Return
        // Return a temp user object so UI renders immediately. 
        // Real auth state is handled by onAuthStateChange in App.tsx
        return {
            id: 'temp_social',
            name: name,
            email: email,
            role: UserRole.USER,
            balance: 0,
            subscriptionStatus: 'ACTIVE',
            joinedAt: new Date().toISOString(),
            lastLoginDate: new Date().toISOString(),
            streak: 0,
            provider: provider as any,
            emailPreferences: { marketing: true, updates: true }
        };
    }
    
    throw new Error("Failed to initialize user account.");
  }

  static getSettings(): GlobalSettings {
      return this.settingsCache;
  }

  static async logout() {
      await supabase.auth.signOut();
      this.currentUser = null;
  }

  static checkAndIncrementStreak(user: User): User {
      const now = new Date();
      const lastLogin = new Date(user.lastLoginDate);
      
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const last = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());
      
      const diffTime = Math.abs(today.getTime() - last.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let streak = user.streak;
      
      if (diffDays === 1) {
          streak += 1;
      } else if (diffDays > 1) {
          streak = 1;
      }
      
      const updatedUser = { 
          ...user, 
          streak, 
          lastLoginDate: now.toISOString() 
      };
      
      // Async update
      supabase.from('users').update({ 
          streak: streak, 
          last_login_date: now.toISOString() 
      }).eq('id', user.id).then();
      
      this.currentUser = updatedUser;
      return updatedUser;
  }

  static async forceVerifyEmail(email: string): Promise<boolean> {
      try {
          const { data, error } = await supabase.functions.invoke('api-gateway', {
              body: { action: 'admin-auto-verify', payload: { email } }
          });
          if (error) throw error;
          return !!data?.success;
      } catch (e) {
          console.error("Verification failed", e);
          return false;
      }
  }

  static async createRootAdmin(email: string, password: string): Promise<User> {
      const { data, error } = await supabase.functions.invoke('api-gateway', {
          body: { action: 'admin-create', payload: { email, password } }
      });
      
      if (error) throw new Error(error.message || "Failed to contact server");
      if (data?.error) throw new Error(data.error);
      if (!data?.user) throw new Error("Creation failed");
      
      const user = await this.syncUser(data.user.id);
      if (!user) throw new Error("Admin user created but profile sync failed.");
      
      return user;
  }

  static async updateUser(user: User) {
      const updateData: any = {
          name: user.name,
          email: user.email,
          theme_preference: user.themePreference,
          language_preference: user.languagePreference,
          email_preferences: user.emailPreferences
      };
      
      if (user.avatar) updateData.avatar_url = user.avatar;

      const { error } = await supabase.from('users').update(updateData).eq('id', user.id);
      
      if (error) throw new Error(error.message);
      
      if (this.currentUser?.id === user.id) {
          this.currentUser = { ...this.currentUser, ...user };
      }
  }

  static async addTransaction(transaction: Transaction) {
      const { error } = await supabase.from('transactions').insert({
          id: transaction.id,
          user_id: transaction.userId,
          amount: transaction.amount,
          cost: transaction.cost || 0,
          description: transaction.description,
          status: transaction.status,
          date: transaction.date
      });
      if (error) console.error("Transaction log error", error);
  }

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
              // Create default settings row if missing
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
  
  static async getCompanions(): Promise<Companion[]> {
      try {
          // Attempt to fetch from DB
          const { data } = await supabase.from('companions').select('*');
          // If we have enough data (at least 5), return it. 
          // Otherwise fall back to local seed to ensure grid isn't empty.
          if (data && data.length >= 5) {
              return data.map(d => ({
                  id: d.id, name: d.name, gender: d.gender, specialty: d.specialty,
                  status: d.status as any, rating: d.rating, imageUrl: d.image_url,
                  bio: d.bio, replicaId: d.replica_id, licenseNumber: d.license_number,
                  degree: d.degree, stateOfPractice: d.state_of_practice, yearsExperience: d.years_experience
              }));
          }
      } catch (e) {}
      
      // Fallback to static list if DB is empty or fails
      return INITIAL_COMPANIONS;
  }
  
  static async updateCompanion(companion: Companion) {
      await supabase.from('companions').update({ status: companion.status }).eq('id', companion.id);
  }

  static async getActiveSessionCount(): Promise<number> {
      const { count } = await supabase.from('active_sessions').select('*', { count: 'exact', head: true });
      return count || 0;
  }

  static async getQueueLength(): Promise<number> {
      const { count } = await supabase.from('session_queue').select('*', { count: 'exact', head: true });
      return count || 0;
  }
  
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
  
  static async getAllUsers(): Promise<User[]> {
      const { data } = await supabase.from('users').select('*');
      return (data || []).map(this.mapUser);
  }
  
  static async deleteUser(id: string) {
      await supabase.from('users').delete().eq('id', id);
      if (this.currentUser?.id === id) this.currentUser = null;
  }
  
  static async topUpWallet(amount: number, cost: number, userId?: string, paymentToken?: string) {
      const uid = userId || this.currentUser?.id;
      if (!uid) return;
      const { data } = await supabase.from('users').select('balance').eq('id', uid).single();
      const newBal = (data?.balance || 0) + amount;
      await supabase.from('users').update({ balance: newBal }).eq('id', uid);
      await supabase.from('transactions').insert({
          id: `tx_${Date.now()}`, user_id: uid, amount, cost, description: cost > 0 ? 'Credit Purchase' : 'Admin Grant', status: 'COMPLETED', date: new Date().toISOString()
      });
  }
  
  static async getSystemLogs(): Promise<SystemLog[]> {
      const { data } = await supabase.from('system_logs').select('*').order('timestamp', { ascending: false }).limit(100);
      return data || [];
  }
  
  static async logSystemEvent(type: string, event: string, details: string) {
      await supabase.from('system_logs').insert({ type, event, details, timestamp: new Date().toISOString() });
  }
  
  static async joinQueue(userId: string) { return 1; }
  static async claimActiveSpot(userId: string) { return true; }
  static getEstimatedWaitTime(pos: number) { return 0; }
  static async sendQueueHeartbeat(userId: string) {}
  static async sendKeepAlive(userId: string) {}
  static async endSession(userId: string) {}
  static async getQueuePosition(userId: string) { return 0; }
  static async getMoods(userId: string) { 
      const { data } = await supabase.from('mood_log').select('*').eq('user_id', userId).order('date', { ascending: false });
      return (data || []).map(m => ({ id: m.id, userId: m.user_id, date: m.date, mood: m.mood, note: m.note }));
  }
  static async saveMood(userId: string, mood: any) {
      await supabase.from('mood_log').insert({ id: `mood_${Date.now()}`, user_id: userId, mood, date: new Date().toISOString() });
  }
  static async getJournals(userId: string) { 
      const { data } = await supabase.from('journal_entries').select('*').eq('user_id', userId).order('date', { ascending: false });
      return (data || []).map(j => ({ id: j.id, userId: j.user_id, date: j.date, content: j.content }));
  }
  static async saveJournal(entry: any) {
      await supabase.from('journal_entries').insert({ id: entry.id, user_id: entry.userId, date: entry.date, content: entry.content });
  }
  static async getUserArt(userId: string) { 
      const { data } = await supabase.from('art_gallery').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return (data || []).map(a => ({ id: a.id, userId: a.user_id, imageUrl: a.image_url, prompt: a.prompt, createdAt: a.created_at, title: a.title }));
  }
  static async saveArt(entry: any) {
      await supabase.from('art_gallery').insert({ id: entry.id, user_id: entry.userId, image_url: entry.imageUrl, prompt: entry.prompt, created_at: entry.createdAt, title: entry.title });
  }
  static async deleteArt(id: string) {
      await supabase.from('art_gallery').delete().eq('id', id);
  }
  static async saveFeedback(feedback: any) {
      await supabase.from('session_feedback').insert({ id: feedback.id, user_id: feedback.userId, user_name: feedback.userName, companion_name: feedback.companionName, rating: feedback.rating, tags: feedback.tags, date: feedback.date, duration: feedback.duration });
  }
  static recordBreathSession(userId: string, duration: number) {}
  static async getWeeklyProgress(userId: string) { 
      return { current: 5, target: 10, message: "Keep going" }; 
  }
  static async checkAdminLockout() { return 0; }
  static async recordAdminFailure() {}
  static async resetAdminFailure() {}
  static async hasAdmin() { 
      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'ADMIN');
      return (count || 0) > 0;
  }
  static async deductBalance(amount: number) {
      if (this.currentUser) {
          this.currentUser.balance -= amount;
          await supabase.from('users').update({ balance: this.currentUser.balance }).eq('id', this.currentUser.id);
      }
  }
}