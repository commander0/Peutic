import { User, UserRole, Transaction, Companion, GlobalSettings, SystemLog, MoodEntry, JournalEntry, SessionFeedback, ArtEntry } from '../types';
import { supabase } from './supabaseClient';

// --- HELPER: Promise with Timeout ---
const withTimeout = <T>(promise: Promise<T>, ms: number, errorMessage = "Operation timed out"): Promise<T> => {
    let timeoutId: any;
    const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(errorMessage)), ms);
    });
    return Promise.race([
        promise.then(res => { clearTimeout(timeoutId); return res; }),
        timeoutPromise
    ]);
};

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

// --- SEED DATA (35 Specialists) ---
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
            const { data: { session } } = (await withTimeout(supabase.auth.getSession(), 3000)) as any;
            if (session?.user) {
                const user = await this.syncUser(session.user.id);
                if (!user) {
                    console.warn("Auth active but Profile missing. Running self-healing...");
                    return await this.repairProfile(session.user);
                }
                return user;
            }
        } catch (e) {
            console.warn("Restore Session Failed", e);
        }
        return this.currentUser;
    }

    private static async repairProfile(authUser: any): Promise<User | null> {
        try {
            const { count } = await supabase.from('users').select('id', { count: 'exact', head: true });
            const isFirst = (count || 0) === 0;

            const optimisticUser: User = {
                id: authUser.id,
                email: authUser.email,
                name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
                role: isFirst ? UserRole.ADMIN : UserRole.USER,
                balance: isFirst ? 999 : 0,
                subscriptionStatus: 'ACTIVE',
                joinedAt: new Date().toISOString(),
                lastLoginDate: new Date().toISOString(),
                streak: 0,
                provider: authUser.app_metadata?.provider || 'email',
                emailPreferences: { marketing: true, updates: true }
            };

            const newUser = {
                id: authUser.id,
                email: authUser.email,
                name: optimisticUser.name,
                role: optimisticUser.role,
                balance: optimisticUser.balance,
                provider: optimisticUser.provider
            };

            const { error } = await supabase.from('users').upsert(newUser, { onConflict: 'id' }) as any;

            if (error) {
                if (error.code === '42501' || error.message.includes('row-level security')) {
                    console.warn("RLS blocking profile creation. Using Backend Bypass...");
                    try {
                        await withTimeout(
                            supabase.functions.invoke('api-gateway', {
                                body: { action: 'profile-create-bypass', payload: newUser }
                            }),
                            10000,
                            "Backend Bypass Timeout"
                        );
                    } catch (backendErr: any) {
                        console.error("Backend Bypass failed:", backendErr);
                    }
                    return optimisticUser;
                }
                if (error.code === '23505') {
                    return await this.syncUser(authUser.id) || optimisticUser;
                }
                console.error("Repair Profile Error:", error);
                return optimisticUser;
            }

            return await this.syncUser(authUser.id) || optimisticUser;
        } catch (e: any) {
            console.error("Repair failed", e);
            return {
                id: authUser.id,
                email: authUser.email,
                name: authUser.user_metadata?.full_name || 'User',
                role: UserRole.USER,
                balance: 0,
                subscriptionStatus: 'ACTIVE',
                joinedAt: new Date().toISOString(),
                lastLoginDate: new Date().toISOString(),
                streak: 0,
                provider: 'email'
            };
        }
    }

    static getUser(): User | null { return this.currentUser; }
    static saveUserSession(user: User) { this.currentUser = user; }
    static clearSession() { this.currentUser = null; supabase.auth.signOut(); }

    static async syncUser(userId: string): Promise<User | null> {
        if (!userId) return null;
        try {
            const { data, error } = (await withTimeout(
                supabase.from('users').select('*').eq('id', userId).single(),
                5000,
                "User sync timeout"
            )) as any;
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
            // Enforce timeout on Login to prevent indefinite hanging
            const { data, error } = (await withTimeout(
                supabase.auth.signInWithPassword({ email, password }),
                10000,
                "Login request timed out"
            )) as any;

            if (error) throw new Error(error.message);
            if (data.user) {
                const user = await this.syncUser(data.user.id);
                if (user) return user;
                try {
                    const repaired = await this.repairProfile(data.user);
                    if (repaired) return repaired;
                } catch (repairErr: any) {
                    console.error("Repair on Login Failed:", repairErr);
                }
            }
        }
        throw new Error("Login failed. Profile could not be synchronized.");
    }

    static async createUser(name: string, email: string, password?: string, provider: string = 'email'): Promise<User> {
        if (provider === 'email' && password) {
            console.log("Creating user...", { name, email, provider });

            // Timeout Protection for SignUp (12s)
            const { data, error } = (await withTimeout(
                supabase.auth.signUp({
                    email, password,
                    options: { data: { full_name: name } }
                }),
                12000,
                "Authentication service timed out"
            )) as any;

            if (error) {
                console.error("SignUp Error:", error);
                if (error.message.includes("registered") || error.message.includes("already exists")) {
                    console.log("User exists in Auth. Attempting recovery login...");
                    return this.login(email, password);
                }
                throw new Error(error.message);
            }

            console.log("SignUp Success:", data);

            if (data.user) {
                // Force sign-in if session is missing (rare but happens with email confirm off)
                if (!data.session) {
                    console.warn("Session missing after signup. Attempting login...");
                    try {
                        // Also timeout protected
                        await withTimeout(supabase.auth.signInWithPassword({ email, password }), 5000);
                    } catch (e: any) {
                        console.warn("Auto-login post-signup failed:", e.message);
                        if (e.message.includes("not confirmed") || e.message.includes("Email not confirmed")) {
                            try { await this.repairProfile(data.user); } catch (err) { }
                            throw new Error("Account created! Please check your email to confirm verification, then log in.");
                        }
                    }
                }

                // OPTIMISTIC USER
                const optimisticUser: User = {
                    id: data.user.id,
                    name: name || data.user.user_metadata?.full_name || email.split('@')[0],
                    email: email,
                    role: UserRole.USER,
                    balance: 0,
                    subscriptionStatus: 'ACTIVE',
                    joinedAt: new Date().toISOString(),
                    lastLoginDate: new Date().toISOString(),
                    streak: 0,
                    provider: 'email',
                    emailPreferences: { marketing: true, updates: true }
                };

                // Attempt strict sync with 2.5s timeout. If fails, return optimistic.
                try {
                    const syncPromise = this.syncUser(data.user.id);
                    const syncTimeout = new Promise<User | null>(r => setTimeout(() => r(null), 2500));

                    const syncedUser = await Promise.race([syncPromise, syncTimeout]);
                    if (syncedUser) return syncedUser;

                    console.warn("Sync timed out, firing repair and returning optimistic user.");
                    this.repairProfile(data.user).catch(console.error);
                } catch (err) {
                    console.warn("Sync error during creation:", err);
                }

                return optimisticUser;
            }
        } else if (provider !== 'email') {
            return {
                id: 'temp',
                name: name,
                email: email,
                role: UserRole.USER,
                balance: 0,
                subscriptionStatus: 'ACTIVE',
                joinedAt: new Date().toISOString(),
                lastLoginDate: new Date().toISOString(),
                streak: 0,
                provider: provider as any
            };
        }
        throw new Error("Failed to initialize user account (Timeout or DB Error).");
    }

    // ... (rest of class identical) ...
    static async createRootAdmin(email: string, password?: string): Promise<User> {
        try {
            const { data, error } = (await supabase.functions.invoke('api-gateway', {
                body: { action: 'admin-create', payload: { email, password } }
            })) as any;
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            return await this.login(email, password);
        } catch (e: any) {
            console.error("Root Admin Creation Failed:", e);
            throw e;
        }
    }

    static async forceVerifyEmail(email: string): Promise<boolean> {
        try {
            const { data, error } = (await supabase.functions.invoke('api-gateway', {
                body: { action: 'admin-auto-verify', payload: { email } }
            })) as any;
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            return true;
        } catch (e) { return false; }
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
        const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'ADMIN');
        if (error) return false;
        return (count || 0) > 0;
    }
    static checkAndIncrementStreak(user: User): User { return user; }
    static async getAllUsers(): Promise<User[]> {
        const { data } = await supabase.from('users').select('*');
        return (data || []).map(this.mapUser);
    }
    static async getCompanions(): Promise<Companion[]> {
        try {
            const { data } = await supabase.from('companions').select('*');
            if (data && data.length > 0) return data.map((d: any) => ({
                id: d.id, name: d.name, gender: d.gender, specialty: d.specialty,
                status: d.status as any, rating: d.rating, imageUrl: d.image_url,
                bio: d.bio, replicaId: d.replica_id, licenseNumber: d.license_number,
                degree: d.degree, stateOfPractice: d.state_of_practice, yearsExperience: d.years_experience
            }));
        } catch (e) { }
        return INITIAL_COMPANIONS;
    }
    static async updateCompanion(companion: Companion) { await supabase.from('companions').update({ status: companion.status }).eq('id', companion.id); }
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
            } else { await this.saveSettings(this.settingsCache); }
        } catch (e) { }
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
    static async getUserTransactions(userId: string): Promise<Transaction[]> {
        const { data } = await supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false });
        return (data || []).map((t: any) => ({
            id: t.id, userId: t.user_id, date: t.date, amount: t.amount, cost: t.cost, description: t.description, status: t.status as any
        }));
    }
    static async getAllTransactions(): Promise<Transaction[]> {
        const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false });
        return (data || []).map((t: any) => ({
            id: t.id, userId: t.user_id, date: t.date, amount: t.amount, cost: t.cost, description: t.description, status: t.status as any
        }));
    }
    static async addTransaction(tx: Transaction) { await supabase.from('transactions').insert({ id: tx.id, user_id: tx.userId, date: tx.date, amount: tx.amount, cost: tx.cost, description: tx.description, status: tx.status }); }
    static async topUpWallet(amount: number, cost: number, userId?: string, paymentToken?: string) {
        const uid = userId || this.currentUser?.id; if (!uid) return;
        const { error } = await supabase.functions.invoke('api-gateway', { body: { action: 'process-topup', payload: { userId: uid, amount, cost, paymentToken } } });
        if (error) throw new Error("Transaction Failed: " + error.message);
        await this.syncUser(uid);
    }
    static async deductBalance(p_amount: number) {
        if (!this.currentUser) return;
        try {
            const { data, error } = await supabase.rpc('deduct_user_balance', { p_user_id: this.currentUser.id, p_amount });
            if (!error && data !== null) {
                this.currentUser.balance = data;
            }
        } catch (e) {
            console.error("Atomic Balance Deduction Failed:", e);
            // Fallback (non-atomic)
            this.currentUser.balance = Math.max(0, this.currentUser.balance - p_amount);
        }
    }
    static async getJournals(userId: string): Promise<JournalEntry[]> {
        const { data } = await supabase.from('journals').select('*').eq('user_id', userId).order('date', { ascending: false });
        return (data || []).map((j: any) => ({ id: j.id, userId: j.user_id, date: j.date, content: j.content }));
    }
    static async saveJournal(entry: JournalEntry) { await supabase.from('journals').insert({ id: entry.id, user_id: entry.userId, date: entry.date, content: entry.content }); }
    static async getMoods(userId: string): Promise<MoodEntry[]> {
        const { data } = await supabase.from('moods').select('*').eq('user_id', userId).order('date', { ascending: false });
        return (data || []).map((m: any) => ({ id: m.id, userId: m.user_id, date: m.date, mood: m.mood as any }));
    }
    static async saveMood(userId: string, mood: 'confetti' | 'rain') { await supabase.from('moods').insert({ user_id: userId, date: new Date().toISOString(), mood }); }
    static async getUserArt(userId: string): Promise<ArtEntry[]> {
        const { data } = await supabase.from('user_art').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        return (data || []).map((a: any) => ({ id: a.id, userId: a.user_id, imageUrl: a.image_url, prompt: a.prompt, createdAt: a.created_at, title: a.title }));
    }
    static async saveArt(entry: ArtEntry) { await supabase.from('user_art').insert({ id: entry.id, user_id: entry.userId, image_url: entry.imageUrl, prompt: entry.prompt, title: entry.title, created_at: entry.createdAt }); }
    static async deleteArt(id: string) { await supabase.from('user_art').delete().eq('id', id); }
    static async getSystemLogs(): Promise<SystemLog[]> {
        const { data } = await supabase.from('system_logs').select('*').order('timestamp', { ascending: false }).limit(100);
        return data || [];
    }
    static async logSystemEvent(type: string, event: string, details: string) { await supabase.from('system_logs').insert({ type, event, details, timestamp: new Date().toISOString() }); }
    static async saveFeedback(feedback: SessionFeedback) { await supabase.from('feedback').insert({ user_id: feedback.userId, companion_name: feedback.companionName, rating: feedback.rating, tags: feedback.tags, date: feedback.date }); }
    static recordBreathSession(_userId: string, _duration: number) { }
    private static async runGlobalCleanup() { try { await supabase.rpc('cleanup_stale_sessions'); } catch (e) { } }
    static async getActiveSessionCount(): Promise<number> { await this.runGlobalCleanup(); const { count } = await supabase.from('active_sessions').select('*', { count: 'exact', head: true }); return count || 0; }
    static async getQueueLength(): Promise<number> { const { count } = await supabase.from('session_queue').select('*', { count: 'exact', head: true }); return count || 0; }
    static async claimActiveSpot(userId: string): Promise<boolean> { try { const { data, error } = await supabase.rpc('claim_active_spot', { p_user_id: userId }); if (error) { console.error("Claim Spot RPC Error:", error); return false; } return !!data; } catch (e) { console.error("Claim Active Spot Exception:", e); return false; } }
    static async joinQueue(userId: string): Promise<number> { try { const { data, error } = await supabase.rpc('join_queue', { p_user_id: userId }); if (error) { console.error("Join Queue RPC Error:", error); return 99; } return data !== null ? data : 99; } catch (e) { return 99; } }
    static async leaveQueue(userId: string) { await supabase.from('session_queue').delete().eq('user_id', userId); }
    static async getQueuePosition(userId: string): Promise<number> {
        try {
            const { data, error } = await supabase.from('session_queue').select('created_at').eq('user_id', userId).single();
            if (error || !data) return 0;

            const { count } = await supabase.from('session_queue')
                .select('*', { count: 'exact', head: true })
                .lt('created_at', data.created_at);

            return (count || 0) + 1;
        } catch (e) {
            console.warn("Queue position retrieval fallback:", e);
            return 1; // Return 1 to allow entry attempt if schema is broken but user exists
        }
    }
    static async sendKeepAlive(userId: string) { await supabase.from('active_sessions').upsert({ user_id: userId, last_ping: new Date().toISOString() }); }
    static async sendQueueHeartbeat(userId: string) { await supabase.from('session_queue').update({ last_ping: new Date().toISOString() }).eq('user_id', userId); }
    static async endSession(userId: string) { await supabase.from('active_sessions').delete().eq('user_id', userId); await supabase.from('session_queue').delete().eq('user_id', userId); }
    static getEstimatedWaitTime(pos: number): number { return Math.max(0, (pos - 1) * 3); }
    static async getWeeklyProgress(userId: string): Promise<{ current: number, target: number, message: string }> { const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7); const { count: journalCount } = await supabase.from('journals').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('date', oneWeekAgo.toISOString()); const { count: sessionCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'COMPLETED').gte('date', oneWeekAgo.toISOString()); const current = (journalCount || 0) + (sessionCount || 0); return { current, target: 10, message: current >= 10 ? "Goal crushed!" : "Keep going!" }; }
    static async checkAdminLockout(): Promise<number> { const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString(); const { count } = await supabase.from('system_logs').select('*', { count: 'exact', head: true }).eq('type', 'SECURITY').eq('event', 'Admin Login Failed').gte('timestamp', fifteenMinsAgo); return (count || 0) >= 5 ? 15 : 0; }
    static async recordAdminFailure() { await this.logSystemEvent('SECURITY', 'Admin Login Failed', 'Invalid credentials or key'); }
    static async resetAdminFailure() { }
    static async resetAllUsers() { await supabase.from('users').delete().neq('role', 'ADMIN'); }

    // --- SYSTEM RECLAMATION (MASTER KEY) ---
    static verifyMasterKey(key: string): boolean {
        const masterKey = (import.meta as any).env.VITE_MASTER_KEY || 'PEUTIC_MASTER_2026';
        return key === masterKey;
    }

    static async resetAdminStatus(): Promise<void> {
        // High-risk: Reset all ADMIN users to GUEST or USER to allow re-claiming
        // This is triggered only after Master Key verification
        const { data: admins } = await supabase.from('users').select('id').eq('role', 'ADMIN');
        if (admins && admins.length > 0) {
            for (const admin of admins) {
                await supabase.from('users').update({ role: 'USER' }).eq('id', admin.id);
            }
        }
        // Force log out current user if they are admin
        if (this.currentUser?.role === 'ADMIN') {
            this.clearSession();
        }
    }
}