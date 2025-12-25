

import { User, UserRole, Transaction, Companion, GlobalSettings, SystemLog, ServerMetric, MoodEntry, JournalEntry, PromoCode, SessionFeedback, ArtEntry, BreathLog, SessionMemory, GiftCard } from '../types';
import { supabase } from './supabaseClient';

const DB_KEYS = {
  USER: 'peutic_db_current_user_v26', // Bumped to v26 to clear data
  ALL_USERS: 'peutic_db_users_v26', 
  COMPANIONS: 'peutic_db_companions_v26',
  TRANSACTIONS: 'peutic_db_transactions_v26',
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
  ACTIVE_SESSIONS: 'peutic_active_sessions_v2', // Versioned up for new structure
  QUEUE: 'peutic_queue_v1'
};

// --- GENERIC AVATAR POOL (For Users/Fallbacks ONLY) ---
// These images do NOT appear in the therapist roster below.
export const STABLE_AVATAR_POOL = [
    "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=800", // Man w/ beard
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=800", // Woman smiling
    "https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&q=80&w=800", // Man portrait
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=800", // Woman pink background
    "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=800", // Man cap
    "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=800", // Man glasses
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=800", // Man profile
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800", // Woman model
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=800", // Man watching
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800"  // Woman laughing
];

// --- HERO COMPANIONS (UNIQUE IMAGES GUARANTEED) ---
export const INITIAL_COMPANIONS: Companion[] = [
  // 1. Ruby (F) - Anxiety
  { 
    id: 'c1', 
    name: 'Ruby', 
    gender: 'Female', 
    specialty: 'Anxiety & Panic', 
    status: 'AVAILABLE', 
    rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800", 
    bio: 'Specializing in grounding techniques.', 
    replicaId: 're3a705cf66a', 
    licenseNumber: 'LCSW-NY-44021', 
    degree: 'MSW, Columbia University', 
    stateOfPractice: 'NY', 
    yearsExperience: 8 
  },
  // 2. Carter (M) - Life Coaching
  { 
    id: 'c2', 
    name: 'Carter', 
    gender: 'Male', 
    specialty: 'Life Coaching', 
    status: 'AVAILABLE', 
    rating: 4.8, 
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800", 
    bio: 'Success roadmap planning.', 
    replicaId: 'rca8a38779a8', 
    licenseNumber: 'ICF-PCC-9921', 
    degree: 'MBA, Stanford', 
    stateOfPractice: 'CA', 
    yearsExperience: 12 
  },
  // 3. Anna (F) - Family
  { 
    id: 'c5', 
    name: 'Anna', 
    gender: 'Female', 
    specialty: 'Family Dynamics', 
    status: 'AVAILABLE', 
    rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?auto=format&fit=crop&q=80&w=800", 
    bio: 'Navigating complex relationships.', 
    replicaId: 'r6ae5b6efc9d', 
    licenseNumber: 'LMFT-CA-9901', 
    degree: 'MS, Family Therapy', 
    stateOfPractice: 'CA', 
    yearsExperience: 11 
  },
  // 4. James (M) - Men's Health
  { 
    id: 'c3', 
    name: 'James', 
    gender: 'Male', 
    specialty: 'Men\'s Health', 
    status: 'AVAILABLE', 
    rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=800", 
    bio: 'Safe space for men.', 
    replicaId: 'r92debe21318', 
    licenseNumber: 'LMFT-TX-2201', 
    degree: 'PhD, Psychology', 
    stateOfPractice: 'TX', 
    yearsExperience: 15 
  },
  // 5. Scarlett (F) - Women's Issues
  { 
    id: 'c46', 
    name: 'Scarlett', 
    gender: 'Female', 
    specialty: 'Women\'s Issues', 
    status: 'AVAILABLE', 
    rating: 5.0, 
    imageUrl: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&q=80&w=800", 
    bio: 'Empowerment and health.', 
    replicaId: 're3a705cf66a', 
    licenseNumber: 'LCSW-NY-1188', 
    degree: 'MSW, Social Work', 
    stateOfPractice: 'NY', 
    yearsExperience: 13 
  },
  // 6. Marcus (M) - Addiction
  { 
    id: 'c8', 
    name: 'Marcus', 
    gender: 'Male', 
    specialty: 'Addiction Recovery', 
    status: 'AVAILABLE', 
    rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800", 
    bio: 'One day at a time.', 
    replicaId: 'rca8a38779a8', 
    licenseNumber: 'LAC-NJ-8821', 
    degree: 'MA, Addiction Counseling', 
    stateOfPractice: 'NJ', 
    yearsExperience: 14 
  },
  // 7. Gloria (F) - Elder Care
  { 
    id: 'c6', 
    name: 'Gloria', 
    gender: 'Female', 
    specialty: 'Elder Care', 
    status: 'AVAILABLE', 
    rating: 5.0, 
    imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800", 
    bio: 'Support for caregivers.', 
    replicaId: 'r4317e64d25a', 
    licenseNumber: 'BSW-FL-3321', 
    degree: 'BSW, Gerontology', 
    stateOfPractice: 'FL', 
    yearsExperience: 20 
  },
  // 8. Matthew (M) - Tech Burnout
  { 
    id: 'c45', 
    name: 'Matthew', 
    gender: 'Male', 
    specialty: 'Tech Burnout', 
    status: 'AVAILABLE', 
    rating: 4.8, 
    imageUrl: "https://images.unsplash.com/photo-1629460741589-9bd72a6c278c?auto=format&fit=crop&q=80&w=800", 
    bio: 'Restoring digital balance.', 
    replicaId: 'r92debe21318', 
    licenseNumber: 'LMFT-WA-3399', 
    degree: 'MA, Psychology', 
    stateOfPractice: 'WA', 
    yearsExperience: 7 
  },
  // 9. Olivia (F) - Workplace
  { 
    id: 'c7', 
    name: 'Olivia', 
    gender: 'Female', 
    specialty: 'Workplace Stress', 
    status: 'AVAILABLE', 
    rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1619895862022-09114b41f16f?auto=format&fit=crop&q=80&w=800", 
    bio: 'Burnout prevention strategies.', 
    replicaId: 'rc2146c13e81', 
    licenseNumber: 'PsyD-NY-1102', 
    degree: 'PsyD, Org Psychology', 
    stateOfPractice: 'NY', 
    yearsExperience: 7 
  },
  // 10. Dr. Chen (M) - Executive
  { 
    id: 'c10', 
    name: 'Dr. Chen', 
    gender: 'Male', 
    specialty: 'Executive Burnout', 
    status: 'BUSY', 
    rating: 5.0, 
    imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=800", 
    bio: 'High performance sustainability.', 
    replicaId: 'rca8a38779a8', 
    licenseNumber: 'PsyD-CA-9921', 
    degree: 'PsyD, Org Psychology', 
    stateOfPractice: 'CA', 
    yearsExperience: 18 
  },
  // 11. Elena (F) - Postpartum
  { 
    id: 'c9', 
    name: 'Elena', 
    gender: 'Female', 
    specialty: 'Postpartum Support', 
    status: 'AVAILABLE', 
    rating: 5.0, 
    imageUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=800", 
    bio: 'Supporting new mothers.', 
    replicaId: 're3a705cf66a', 
    licenseNumber: 'LCSW-TX-3321', 
    degree: 'MSW, Clinical Social Work', 
    stateOfPractice: 'TX', 
    yearsExperience: 6 
  },
  // 12. Malik (M) - Trauma
  { 
    id: 'c12', 
    name: 'Malik', 
    gender: 'Male', 
    specialty: 'Trauma & PTSD', 
    status: 'AVAILABLE', 
    rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800", 
    bio: 'Healing the past.', 
    replicaId: 'r92debe21318', 
    licenseNumber: 'LPC-IL-2210', 
    degree: 'PhD, Clinical Psychology', 
    stateOfPractice: 'IL', 
    yearsExperience: 11 
  },
  // 13. Avery (F) - ADHD Support
  { 
    id: 'c44', 
    name: 'Avery', 
    gender: 'Female', 
    specialty: 'ADHD Support', 
    status: 'AVAILABLE', 
    rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800", 
    bio: 'Thriving with neurodiversity.', 
    replicaId: 'rc2146c13e81', 
    licenseNumber: 'PsyD-MA-6622', 
    degree: 'PsyD, Psychology', 
    stateOfPractice: 'MA', 
    yearsExperience: 10 
  },
  // 14. Liam (M) - Anger
  { 
    id: 'c14', 
    name: 'Liam', 
    gender: 'Male', 
    specialty: 'Anger Management', 
    status: 'AVAILABLE', 
    rating: 4.7, 
    imageUrl: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=800", 
    bio: 'Constructive expression.', 
    replicaId: 'rca8a38779a8', 
    licenseNumber: 'LCSW-MA-8812', 
    degree: 'MSW, Social Work', 
    stateOfPractice: 'MA', 
    yearsExperience: 13 
  },
  // 15. Sarah (F) - Eating Disorders
  { 
    id: 'c11', 
    name: 'Sarah', 
    gender: 'Female', 
    specialty: 'Eating Disorders', 
    status: 'AVAILABLE', 
    rating: 4.8, 
    imageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=800", 
    bio: 'Building a healthy relationship with food.', 
    replicaId: 'r6ae5b6efc9d', 
    licenseNumber: 'RD-NY-4421', 
    degree: 'MS, Nutrition & Psychology', 
    stateOfPractice: 'NY', 
    yearsExperience: 9 
  },
  // 16. Noah (M) - Teen Anxiety
  { 
    id: 'c16', 
    name: 'Noah', 
    gender: 'Male', 
    specialty: 'Teen Anxiety', 
    status: 'AVAILABLE', 
    rating: 4.8, 
    imageUrl: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=800", 
    bio: 'Helping teens navigate pressure.', 
    replicaId: 'r92debe21318', 
    licenseNumber: 'LMFT-WA-9921', 
    degree: 'MA, Family Therapy', 
    stateOfPractice: 'WA', 
    yearsExperience: 6 
  },
  // 17. Zoey (F) - LGBTQ+ (Renamed from Zoe)
  { 
    id: 'c13', 
    name: 'Zoey', 
    gender: 'Female', 
    specialty: 'LGBTQ+ Issues', 
    status: 'AVAILABLE', 
    rating: 5.0, 
    imageUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=800", 
    bio: 'Affirming and inclusive care.', 
    replicaId: 're3a705cf66a', 
    licenseNumber: 'LMFT-OR-5521', 
    degree: 'MA, Counseling Psychology', 
    stateOfPractice: 'OR', 
    yearsExperience: 5 
  },
  // 18. Jackson (M) - Sports
  { 
    id: 'c19', 
    name: 'Jackson', 
    gender: 'Male', 
    specialty: 'Sports Psychology', 
    status: 'AVAILABLE', 
    rating: 4.8, 
    imageUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=800", 
    bio: 'Peak performance mindset.', 
    replicaId: 'rca8a38779a8', 
    licenseNumber: 'PsyD-FL-4421', 
    degree: 'PsyD, Sports Psychology', 
    stateOfPractice: 'FL', 
    yearsExperience: 8 
  },
  // 19. Dr. Patel (F) - Sleep
  { 
    id: 'c17', 
    name: 'Dr. Patel', 
    gender: 'Female', 
    specialty: 'Sleep Insomnia', 
    status: 'AVAILABLE', 
    rating: 5.0, 
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800", 
    bio: 'Restoring natural rhythms.', 
    replicaId: 'rc2146c13e81', 
    licenseNumber: 'MD-NY-1102', 
    degree: 'MD, Psychiatry', 
    stateOfPractice: 'NY', 
    yearsExperience: 22 
  },
  // 20. Lucas (M) - Digital Addiction (Swapped Image with Henry)
  { 
    id: 'c21', 
    name: 'Lucas', 
    gender: 'Male', 
    specialty: 'Digital Addiction', 
    status: 'AVAILABLE', 
    rating: 4.7, 
    imageUrl: "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&q=80&w=800", 
    bio: 'Unplugging for mental health.', 
    replicaId: 'r92debe21318', 
    licenseNumber: 'LCSW-NY-3321', 
    degree: 'MSW, Social Work', 
    stateOfPractice: 'NY', 
    yearsExperience: 6 
  },
  // 21. Sofia (F) - Chronic Pain
  { 
    id: 'c18', 
    name: 'Sofia', 
    gender: 'Female', 
    specialty: 'Chronic Pain', 
    status: 'AVAILABLE', 
    rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=800", // FIXED: Smiling woman
    bio: 'Mind-body healing.', 
    replicaId: 're3a705cf66a', 
    licenseNumber: 'PhD-CA-1123', 
    degree: 'PhD, Health Psychology', 
    stateOfPractice: 'CA', 
    yearsExperience: 12 
  },
  // 22. William (M) - Divorce
  { 
    id: 'c23', 
    name: 'William', 
    gender: 'Male', 
    specialty: 'Divorce Recovery', 
    status: 'AVAILABLE', 
    rating: 4.8, 
    imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=800", // FIXED: Male portrait
    bio: 'Navigating life transitions.', 
    replicaId: 'rca8a38779a8', 
    licenseNumber: 'LMFT-IL-5521', 
    degree: 'MA, Family Therapy', 
    stateOfPractice: 'IL', 
    yearsExperience: 15 
  },
  // 23. Emma (F) - Relationships
  { 
    id: 'c20', 
    name: 'Emma', 
    gender: 'Female', 
    specialty: 'Relationship Counseling', 
    status: 'AVAILABLE', 
    rating: 5.0, 
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800", // FIXED: Female portrait
    bio: 'Building stronger bonds.', 
    replicaId: 'r6ae5b6efc9d', 
    licenseNumber: 'LMFT-TX-8821', 
    degree: 'MA, Marriage & Family', 
    stateOfPractice: 'TX', 
    yearsExperience: 10 
  },
  // --- EXTENDED ROSTER (UNIQUE URLS) ---
  // 24. Maya (F)
  { 
    id: 'c24', 
    name: 'Maya', 
    gender: 'Female', 
    specialty: 'Cultural Identity', 
    status: 'AVAILABLE', 
    rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&q=80&w=800", 
    bio: 'Navigating dual cultures and belonging.', 
    replicaId: 're3a705cf66a', 
    licenseNumber: 'LCSW-CA-1102', 
    degree: 'MSW, Social Work', 
    stateOfPractice: 'CA', 
    yearsExperience: 9 
  },
  // 25. Caleb (M)
  { 
    id: 'c25', 
    name: 'Caleb', 
    gender: 'Male', 
    specialty: 'Imposter Syndrome', 
    status: 'AVAILABLE', 
    rating: 4.8, 
    imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800", 
    bio: 'Owning your success with confidence.', 
    replicaId: 'rca8a38779a8', 
    licenseNumber: 'LPC-TX-9921', 
    degree: 'MA, Counseling', 
    stateOfPractice: 'TX', 
    yearsExperience: 7 
  },
  // 26. Chloe (F)
  { 
    id: 'c26', 
    name: 'Chloe', 
    gender: 'Female', 
    specialty: 'Pet Loss Grief', 
    status: 'AVAILABLE', 
    rating: 5.0, 
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800", 
    bio: 'Honoring the bond with our animal companions.', 
    replicaId: 'r6ae5b6efc9d', 
    licenseNumber: 'LMFT-NY-2210', 
    degree: 'MS, Family Therapy', 
    stateOfPractice: 'NY', 
    yearsExperience: 12 
  },
  // 27. Jordan (M)
  { 
    id: 'c27', 
    name: 'Jordan', 
    gender: 'Male', 
    specialty: 'Military Transition', 
    status: 'AVAILABLE', 
    rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800", 
    bio: 'From service to civilian life.', 
    replicaId: 'r92debe21318', 
    licenseNumber: 'LCSW-VA-4421', 
    degree: 'MSW, Clinical Social Work', 
    stateOfPractice: 'VA', 
    yearsExperience: 16 
  },
  // 28. Layla (F) - VALID REPLICA ID
  { 
    id: 'c28', 
    name: 'Layla', 
    gender: 'Female', 
    specialty: 'Fertility Support', 
    status: 'AVAILABLE', 
    rating: 5.0, 
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=800", 
    bio: 'Supporting your path to parenthood.', 
    replicaId: 're3a705cf66a', 
    licenseNumber: 'PhD-CA-8821', 
    degree: 'PhD, Health Psychology', 
    stateOfPractice: 'CA', 
    yearsExperience: 14 
  },
  // 29. Henry (M) - VALID REPLICA ID
  { 
    id: 'c29', 
    name: 'Henry', 
    gender: 'Male', 
    specialty: 'Retirement Adjustment', 
    status: 'AVAILABLE', 
    rating: 4.8, 
    imageUrl: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&q=80&w=800", 
    bio: 'Finding purpose in the next chapter.', 
    replicaId: 'rca8a38779a8', 
    licenseNumber: 'LMFT-FL-3321', 
    degree: 'MA, Counseling', 
    stateOfPractice: 'FL', 
    yearsExperience: 25 
  },
  // 30. Nora (F) - UPDATED IMAGE (Female) & VALID REPLICA ID
  { 
    id: 'c30', 
    name: 'Nora', 
    gender: 'Female', 
    specialty: 'Caregiver Stress', 
    status: 'AVAILABLE', 
    rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800", // NEW: Verified Female Portrait from User
    bio: 'Caring for yourself while caring for others.', 
    replicaId: 'r4317e64d25a', 
    licenseNumber: 'LCSW-OH-9912', 
    degree: 'MSW, Social Work', 
    stateOfPractice: 'OH', 
    yearsExperience: 18 
  },
  // 31. Owen (M) - VALID REPLICA ID
  { 
    id: 'c31', 
    name: 'Owen', 
    gender: 'Male', 
    specialty: 'Gaming Addiction', 
    status: 'AVAILABLE', 
    rating: 4.7, 
    imageUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=800", 
    bio: 'Balancing virtual worlds with reality.', 
    replicaId: 'r92debe21318', 
    licenseNumber: 'LPC-WA-2210', 
    degree: 'MA, Psychology', 
    stateOfPractice: 'WA', 
    yearsExperience: 6 
  },
  // 32. Luna (F) - VALID REPLICA ID
  { 
    id: 'c32', 
    name: 'Luna', 
    gender: 'Female', 
    specialty: 'Spiritual Crisis', 
    status: 'AVAILABLE', 
    rating: 5.0, 
    imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=800", 
    bio: 'Navigating faith transitions and meaning.', 
    replicaId: 'rc2146c13e81', 
    licenseNumber: 'LMFT-OR-5521', 
    degree: 'MA, Transpersonal Psych', 
    stateOfPractice: 'OR', 
    yearsExperience: 11 
  },
  // 33. Gabriel (M) - VALID REPLICA ID
  { 
    id: 'c33', 
    name: 'Gabriel', 
    gender: 'Male', 
    specialty: 'Anger Regulation', 
    status: 'AVAILABLE', 
    rating: 4.8, 
    imageUrl: "https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?auto=format&fit=crop&q=80&w=800", 
    bio: 'Transforming rage into constructive action.', 
    replicaId: 'rca8a38779a8', 
    licenseNumber: 'PsyD-IL-4421', 
    degree: 'PsyD, Clinical Psychology', 
    stateOfPractice: 'IL', 
    yearsExperience: 13 
  },
  // 34. Sophie (F) - VALID REPLICA ID
  { 
    id: 'c34', 
    name: 'Sophie', 
    gender: 'Female', 
    specialty: 'Social Anxiety', 
    status: 'AVAILABLE', 
    rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800", 
    bio: 'Building confidence in connection.', 
    replicaId: 'r6ae5b6efc9d', 
    licenseNumber: 'LCSW-NY-3399', 
    degree: 'MSW, Social Work', 
    stateOfPractice: 'NY', 
    yearsExperience: 8 
  },
  // 35. Ethan (M) - VALID REPLICA ID
  { 
    id: 'c35', 
    name: 'Ethan', 
    gender: 'Male', 
    specialty: 'Financial Anxiety', 
    status: 'AVAILABLE', 
    rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&q=80&w=800", 
    bio: 'Healing your relationship with money.', 
    replicaId: 'r92debe21318', 
    licenseNumber: 'LMFT-CA-2210', 
    degree: 'MA, Financial Therapy', 
    stateOfPractice: 'CA', 
    yearsExperience: 10 
  }
];

// Helper interface for enhanced session tracking
interface ActiveSession {
    userId: string;
    lastPing: number;
}

export class Database {
  static isOfflineMode = false;

  // --- USER MANAGEMENT ---
  static getAllUsers(): User[] {
    const usersStr = localStorage.getItem(DB_KEYS.ALL_USERS);
    return usersStr ? JSON.parse(usersStr) : [];
  }

  static getUser(): User | null {
    const userStr = localStorage.getItem(DB_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  }

  static saveUserSession(user: User) {
    localStorage.setItem(DB_KEYS.USER, JSON.stringify(user));
  }

  static clearSession() {
    localStorage.removeItem(DB_KEYS.USER);
  }

  static getUserByEmail(email: string): User | undefined {
    return this.getAllUsers().find(u => u.email === email);
  }

  static createUser(name: string, email: string, provider: 'email' | 'google' | 'facebook' | 'x', birthday?: string, role: UserRole = UserRole.USER): User {
    const newUser: User = {
      id: `u_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      role,
      balance: 0, 
      subscriptionStatus: 'ACTIVE',
      joinedAt: new Date().toISOString(),
      lastLoginDate: new Date().toISOString(),
      streak: 0,
      provider,
      birthday
    };
    const users = this.getAllUsers();
    users.push(newUser);
    localStorage.setItem(DB_KEYS.ALL_USERS, JSON.stringify(users));
    return newUser;
  }

  static async updateUser(user: User) {
    const users = this.getAllUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
      localStorage.setItem(DB_KEYS.ALL_USERS, JSON.stringify(users));
    }
    const currentUser = this.getUser();
    if (currentUser && currentUser.id === user.id) {
        this.saveUserSession(user);
    }
    
    if (!this.isOfflineMode) {
        try {
            await supabase.from('users').update({
                name: user.name,
                email: user.email,
                balance: user.balance,
                last_login_date: user.lastLoginDate,
                email_preferences: user.emailPreferences
            }).eq('id', user.id);
        } catch (e) {
            // Silent fail for offline/local mode
        }
    }
  }

  static async deleteUser(id: string) {
      const users = this.getAllUsers().filter(u => u.id !== id);
      localStorage.setItem(DB_KEYS.ALL_USERS, JSON.stringify(users));
      const currentUser = this.getUser();
      if(currentUser && currentUser.id === id) {
          this.clearSession();
      }

      if (!this.isOfflineMode) {
          try {
              await supabase.from('users').delete().eq('id', id);
              console.log(`User ${id} deleted from remote DB`);
          } catch (e) {
              console.warn("Failed to delete from remote DB", e);
          }
      }
  }

  static hasAdmin(): boolean {
    return this.getAllUsers().some(u => u.role === UserRole.ADMIN);
  }

  static checkAndIncrementStreak(user: User): User {
      const today = new Date().toDateString();
      const lastLogin = new Date(user.lastLoginDate).toDateString();
      
      if (today !== lastLogin) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (new Date(user.lastLoginDate).toDateString() === yesterday.toDateString()) {
              user.streak += 1;
          } else {
              user.streak = 1;
          }
          user.lastLoginDate = new Date().toISOString();
          this.updateUser(user);
      }
      return user;
  }

  static resetAllUsers() {
      localStorage.removeItem(DB_KEYS.ALL_USERS);
      localStorage.removeItem(DB_KEYS.USER);
  }

  // --- SETTINGS ---
  static getSettings(): GlobalSettings {
    const defaultSettings: GlobalSettings = {
        pricePerMinute: 1.49,
        saleMode: true,
        maintenanceMode: false,
        allowSignups: true,
        siteName: 'Peutic',
        maxConcurrentSessions: 15, // STRICT LIMIT
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

  // --- QUEUE & SESSIONS WITH CONCURRENCY & ZOMBIE CLEANUP ---

  // Private Helper: Clean up sessions that haven't pinged in 15 seconds
  private static cleanupStaleSessions(sessions: ActiveSession[]): ActiveSession[] {
      const now = Date.now();
      const validSessions = sessions.filter(s => (now - s.lastPing) < 15000); // 15s Timeout
      if (validSessions.length !== sessions.length) {
          console.log(`Cleaned up ${sessions.length - validSessions.length} zombie sessions.`);
      }
      return validSessions;
  }

  static async joinQueue(userId: string): Promise<number> {
      let queue = JSON.parse(localStorage.getItem(DB_KEYS.QUEUE) || '[]');
      if (!queue.includes(userId)) {
          queue.push(userId);
          localStorage.setItem(DB_KEYS.QUEUE, JSON.stringify(queue));
      }
      return queue.indexOf(userId) + 1;
  }

  static async leaveQueue(userId: string) {
      let queue = JSON.parse(localStorage.getItem(DB_KEYS.QUEUE) || '[]');
      queue = queue.filter((id: string) => id !== userId);
      localStorage.setItem(DB_KEYS.QUEUE, JSON.stringify(queue));
  }

  static async getQueueList(): Promise<string[]> {
      return JSON.parse(localStorage.getItem(DB_KEYS.QUEUE) || '[]');
  }

  static async getQueuePosition(userId: string): Promise<number> {
      const queue = await this.getQueueList();
      const index = queue.indexOf(userId);
      return index === -1 ? 0 : index + 1;
  }

  static async getActiveSessionCount(): Promise<number> {
      // 1. Load Sessions
      let sessions: ActiveSession[] = JSON.parse(localStorage.getItem(DB_KEYS.ACTIVE_SESSIONS) || '[]');
      
      // 2. Backward Compatibility Check (migration from string[] to ActiveSession[])
      if (sessions.length > 0 && typeof sessions[0] === 'string') {
          sessions = []; // Clear legacy data to prevent crash
          localStorage.setItem(DB_KEYS.ACTIVE_SESSIONS, '[]');
      }

      // 3. Clean up zombies before counting
      sessions = this.cleanupStaleSessions(sessions);
      localStorage.setItem(DB_KEYS.ACTIVE_SESSIONS, JSON.stringify(sessions));
      
      return sessions.length;
  }

  static getEstimatedWaitTime(pos: number): number {
      return Math.max(0, (pos - 1) * 2);
  }

  // CORE LOGIC: Claim a spot strictly enforcing the limit
  static async claimActiveSpot(userId: string): Promise<boolean> {
      let sessions: ActiveSession[] = JSON.parse(localStorage.getItem(DB_KEYS.ACTIVE_SESSIONS) || '[]');
      
      // Backward Compat Check
      if (sessions.length > 0 && typeof sessions[0] === 'string') {
          sessions = [];
      }

      // 1. Run Cleanup First
      sessions = this.cleanupStaleSessions(sessions);

      // 2. Check if user is already inside
      const existingIndex = sessions.findIndex(s => s.userId === userId);
      if (existingIndex !== -1) {
          // Update ping and save
          sessions[existingIndex].lastPing = Date.now();
          localStorage.setItem(DB_KEYS.ACTIVE_SESSIONS, JSON.stringify(sessions));
          return true;
      }

      // 3. Check Limit
      const settings = this.getSettings();
      if (sessions.length < settings.maxConcurrentSessions) {
          // 4. Add User
          sessions.push({ userId, lastPing: Date.now() });
          localStorage.setItem(DB_KEYS.ACTIVE_SESSIONS, JSON.stringify(sessions));
          await this.leaveQueue(userId);
          return true;
      }

      // 5. Fail if full
      localStorage.setItem(DB_KEYS.ACTIVE_SESSIONS, JSON.stringify(sessions)); // Save cleanup
      return false;
  }

  // HEARTBEAT: Call this every ~3-5 seconds from the video room
  static sendKeepAlive(userId: string) {
      let sessions: ActiveSession[] = JSON.parse(localStorage.getItem(DB_KEYS.ACTIVE_SESSIONS) || '[]');
      
      // Backward Compat
      if (sessions.length > 0 && typeof sessions[0] === 'string') return;

      const index = sessions.findIndex(s => s.userId === userId);
      if (index !== -1) {
          sessions[index].lastPing = Date.now();
          localStorage.setItem(DB_KEYS.ACTIVE_SESSIONS, JSON.stringify(sessions));
      } else {
          // Edge case: User thought they were active but were cleaned up? 
          // Re-add them if space permits? 
          // For now, strict: If you are gone, you are gone. 
          // The frontend checks connectionState separately.
          console.warn(`KeepAlive failed for ${userId}: Session not found in active list.`);
      }
  }

  static endSession(userId: string) {
      let sessions: ActiveSession[] = JSON.parse(localStorage.getItem(DB_KEYS.ACTIVE_SESSIONS) || '[]');
      // Backward Compat
      if (sessions.length > 0 && typeof sessions[0] === 'string') {
          sessions = [];
      } else {
          sessions = sessions.filter(s => s.userId !== userId);
      }
      localStorage.setItem(DB_KEYS.ACTIVE_SESSIONS, JSON.stringify(sessions));
  }

  // --- TRANSACTIONS & REST ---
  // (Existing code remains same)
  static getAllTransactions(): Transaction[] {
      return JSON.parse(localStorage.getItem(DB_KEYS.TRANSACTIONS) || '[]');
  }
  // ... (rest of methods)
  static getUserTransactions(userId: string): Transaction[] {
      return this.getAllTransactions().filter(t => t.userId === userId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  static addTransaction(tx: Transaction) {
      const list = this.getAllTransactions();
      list.unshift(tx);
      localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(list));
  }
  static topUpWallet(amount: number, cost: number, userId?: string) {
      const targetUser = userId ? this.getAllUsers().find(u => u.id === userId) : this.getUser();
      if (targetUser) {
          targetUser.balance += amount;
          this.updateUser(targetUser);
          this.addTransaction({
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
  static deductBalance(amount: number) {
      const user = this.getUser();
      if (user) {
          user.balance = Math.max(0, user.balance - amount);
          this.updateUser(user);
      }
  }
  static getSystemLogs(): SystemLog[] {
      return JSON.parse(localStorage.getItem(DB_KEYS.LOGS) || '[]');
  }
  static logSystemEvent(type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'SECURITY', event: string, details: string) {
      const logs = this.getSystemLogs();
      logs.unshift({ id: `log_${Date.now()}`, timestamp: new Date().toISOString(), type, event, details });
      if (logs.length > 500) logs.pop(); 
      localStorage.setItem(DB_KEYS.LOGS, JSON.stringify(logs));
  }
  static getAllFeedback(): SessionFeedback[] {
      return JSON.parse(localStorage.getItem(DB_KEYS.FEEDBACK) || '[]');
  }
  static saveFeedback(feedback: SessionFeedback) {
      const list = this.getAllFeedback();
      list.unshift(feedback);
      localStorage.setItem(DB_KEYS.FEEDBACK, JSON.stringify(list));
  }
  static getJournals(userId: string): JournalEntry[] {
      const all = JSON.parse(localStorage.getItem(DB_KEYS.JOURNALS) || '[]');
      return all.filter((j: JournalEntry) => j.userId === userId).sort((a: any,b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  static saveJournal(entry: JournalEntry) {
      const all = JSON.parse(localStorage.getItem(DB_KEYS.JOURNALS) || '[]');
      all.unshift(entry);
      localStorage.setItem(DB_KEYS.JOURNALS, JSON.stringify(all));
  }
  static getMoods(userId: string): MoodEntry[] {
      const all = JSON.parse(localStorage.getItem(DB_KEYS.MOODS) || '[]');
      return all.filter((m: MoodEntry) => m.userId === userId);
  }
  static saveMood(userId: string, mood: 'confetti' | 'rain' | null) {
      if (mood === null) return;
      const all = JSON.parse(localStorage.getItem(DB_KEYS.MOODS) || '[]');
      const entry: MoodEntry = { id: `m_${Date.now()}`, userId, date: new Date().toISOString(), mood };
      all.push(entry);
      localStorage.setItem(DB_KEYS.MOODS, JSON.stringify(all));
  }
  static getBreathLogs(userId: string): BreathLog[] {
      const all = JSON.parse(localStorage.getItem(DB_KEYS.BREATHE_LOGS) || '[]');
      return all.filter((b: BreathLog) => b.userId === userId);
  }
  static recordBreathSession(userId: string, duration: number) {
      if (duration < 10) return;
      const all = JSON.parse(localStorage.getItem(DB_KEYS.BREATHE_LOGS) || '[]');
      all.push({ id: `b_${Date.now()}`, userId, date: new Date().toISOString(), durationSeconds: duration });
      localStorage.setItem(DB_KEYS.BREATHE_LOGS, JSON.stringify(all));
  }
  static async saveArt(entry: ArtEntry) { this.saveArtLocal(entry); }
  static saveArtLocal(entry: ArtEntry) {
      let art = JSON.parse(localStorage.getItem(DB_KEYS.ART) || '[]');
      const userArt = art.filter((a: ArtEntry) => a.userId === entry.userId);
      const otherArt = art.filter((a: ArtEntry) => a.userId !== entry.userId);
      userArt.unshift(entry); 
      while (userArt.length > 15) { userArt.pop(); }
      let newArt = [...otherArt, ...userArt];
      try { localStorage.setItem(DB_KEYS.ART, JSON.stringify(newArt)); } catch (e: any) {}
  }
  static async getUserArt(userId: string): Promise<ArtEntry[]> { return this.getUserArtLocal(userId); }
  static getUserArtLocal(userId: string): ArtEntry[] {
      const art = JSON.parse(localStorage.getItem(DB_KEYS.ART) || '[]');
      return art.filter((a: ArtEntry) => a.userId === userId).sort((a: ArtEntry, b: ArtEntry) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 15);
  }
  static async deleteArt(artId: string) { 
      let art = JSON.parse(localStorage.getItem(DB_KEYS.ART) || '[]'); 
      art = art.filter((a: ArtEntry) => a.id !== artId); 
      localStorage.setItem(DB_KEYS.ART, JSON.stringify(art)); 
  }
  static getBreathingCooldown(): number | null { const cd = localStorage.getItem(DB_KEYS.BREATHE_COOLDOWN); return cd ? parseInt(cd, 10) : null; }
  static setBreathingCooldown(timestamp: number) { localStorage.setItem(DB_KEYS.BREATHE_COOLDOWN, timestamp.toString()); }
  static getWeeklyProgress(userId: string): { current: number; target: number; message: string } {
      const now = new Date(); const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const tx = this.getUserTransactions(userId).filter(t => new Date(t.date) > oneWeekAgo && t.amount < 0);
      const j = this.getJournals(userId).filter(j => new Date(j.date) > oneWeekAgo);
      const a = this.getUserArtLocal(userId).filter(a => new Date(a.createdAt) > oneWeekAgo);
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

  // --- ADMIN SECURITY ---
  static checkAdminLockout(): number {
      const stored = localStorage.getItem(DB_KEYS.ADMIN_ATTEMPTS);
      if (!stored) return 0;
      const { attempts, lockoutUntil } = JSON.parse(stored);
      
      if (lockoutUntil && Date.now() < lockoutUntil) {
          return Math.ceil((lockoutUntil - Date.now()) / 60000);
      }
      // If lockout expired but attempts still high, reset or just allow?
      // Usually better to reset if expired.
      if (lockoutUntil && Date.now() > lockoutUntil) {
          this.resetAdminFailure();
          return 0;
      }
      return 0;
  }

  static recordAdminFailure() {
      const stored = localStorage.getItem(DB_KEYS.ADMIN_ATTEMPTS);
      let { attempts, lockoutUntil } = stored ? JSON.parse(stored) : { attempts: 0, lockoutUntil: 0 };
      
      attempts++;
      
      if (attempts >= 5) {
          lockoutUntil = Date.now() + (15 * 60 * 1000); // 15 min lockout
          this.logSystemEvent('SECURITY', 'Admin Lockout Triggered', '5 failed attempts');
      } else {
          this.logSystemEvent('WARNING', 'Failed Admin Login', `Attempt ${attempts}/5`);
      }
      
      localStorage.setItem(DB_KEYS.ADMIN_ATTEMPTS, JSON.stringify({ attempts, lockoutUntil }));
  }

  static resetAdminFailure() {
      localStorage.removeItem(DB_KEYS.ADMIN_ATTEMPTS);
  }
}
