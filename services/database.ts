
import { User, UserRole, Transaction, Companion, GlobalSettings, SystemLog, MoodEntry, JournalEntry, PromoCode, SessionFeedback, ArtEntry, BreathLog } from '../types';
import { supabase } from './supabaseClient';

// We use localStorage ONLY for the session token (user ID) to persist login across reloads
const SESSION_KEY = 'peutic_session_user_id';

// --- INITIAL COMPANIONS SEED DATA (35 Total) ---
export const INITIAL_COMPANIONS: Companion[] = [
  // 1. Ruby (F)
  { 
    id: 'c1', name: 'Ruby', gender: 'Female', specialty: 'Anxiety & Panic', status: 'AVAILABLE', rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800", 
    bio: 'Specializing in grounding techniques.', replicaId: 're3a705cf66a', licenseNumber: 'LCSW-NY-44021', degree: 'MSW, Columbia University', stateOfPractice: 'NY', yearsExperience: 8 
  },
  // 2. Carter (M)
  { 
    id: 'c2', name: 'Carter', gender: 'Male', specialty: 'Life Coaching', status: 'AVAILABLE', rating: 4.8, 
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800", 
    bio: 'Success roadmap planning.', replicaId: 'rca8a38779a8', licenseNumber: 'ICF-PCC-9921', degree: 'MBA, Stanford', stateOfPractice: 'CA', yearsExperience: 12 
  },
  // 3. Anna (F)
  { 
    id: 'c5', name: 'Anna', gender: 'Female', specialty: 'Family Dynamics', status: 'AVAILABLE', rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?auto=format&fit=crop&q=80&w=800", 
    bio: 'Navigating complex relationships.', replicaId: 'r6ae5b6efc9d', licenseNumber: 'LMFT-CA-9901', degree: 'MS, Family Therapy', stateOfPractice: 'CA', yearsExperience: 11 
  },
  // 4. James (M)
  { 
    id: 'c3', name: 'James', gender: 'Male', specialty: 'Men\'s Health', status: 'AVAILABLE', rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=800", 
    bio: 'Safe space for men.', replicaId: 'r92debe21318', licenseNumber: 'LMFT-TX-2201', degree: 'PhD, Psychology', stateOfPractice: 'TX', yearsExperience: 15 
  },
  // 5. Scarlett (F)
  { 
    id: 'c46', name: 'Scarlett', gender: 'Female', specialty: 'Women\'s Issues', status: 'AVAILABLE', rating: 5.0, 
    imageUrl: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&q=80&w=800", 
    bio: 'Empowerment and health.', replicaId: 're3a705cf66a', licenseNumber: 'LCSW-NY-1188', degree: 'MSW, Social Work', stateOfPractice: 'NY', yearsExperience: 13 
  },
  // 6. Marcus (M)
  { 
    id: 'c8', name: 'Marcus', gender: 'Male', specialty: 'Addiction Recovery', status: 'AVAILABLE', rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800", 
    bio: 'One day at a time.', replicaId: 'rca8a38779a8', licenseNumber: 'LAC-NJ-8821', degree: 'MA, Addiction Counseling', stateOfPractice: 'NJ', yearsExperience: 14 
  },
  // 7. Gloria (F)
  { 
    id: 'c6', name: 'Gloria', gender: 'Female', specialty: 'Elder Care', status: 'AVAILABLE', rating: 5.0, 
    imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800", 
    bio: 'Support for caregivers.', replicaId: 'r4317e64d25a', licenseNumber: 'BSW-FL-3321', degree: 'BSW, Gerontology', stateOfPractice: 'FL', yearsExperience: 20 
  },
  // 8. Matthew (M)
  { 
    id: 'c45', name: 'Matthew', gender: 'Male', specialty: 'Tech Burnout', status: 'AVAILABLE', rating: 4.8, 
    imageUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=800", 
    bio: 'Restoring digital balance.', replicaId: 'r92debe21318', licenseNumber: 'LMFT-WA-3399', degree: 'MA, Psychology', stateOfPractice: 'WA', yearsExperience: 7 
  },
  // 9. Olivia (F)
  { 
    id: 'c7', name: 'Olivia', gender: 'Female', specialty: 'Workplace Stress', status: 'AVAILABLE', rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1619895862022-09114b41f16f?auto=format&fit=crop&q=80&w=800", 
    bio: 'Burnout prevention strategies.', replicaId: 'rc2146c13e81', licenseNumber: 'PsyD-NY-1102', degree: 'PsyD, Org Psychology', stateOfPractice: 'NY', yearsExperience: 7 
  },
  // 10. Dr. Chen (M)
  { 
    id: 'c10', name: 'Dr. Chen', gender: 'Male', specialty: 'Executive Burnout', status: 'BUSY', rating: 5.0, 
    imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=800", 
    bio: 'High performance sustainability.', replicaId: 'rca8a38779a8', licenseNumber: 'PsyD-CA-9921', degree: 'PsyD, Org Psychology', stateOfPractice: 'CA', yearsExperience: 18 
  },
  // 11. Elena (F)
  { 
    id: 'c9', name: 'Elena', gender: 'Female', specialty: 'Postpartum Support', status: 'AVAILABLE', rating: 5.0, 
    imageUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=800", 
    bio: 'Supporting new mothers.', replicaId: 're3a705cf66a', licenseNumber: 'LCSW-TX-3321', degree: 'MSW, Clinical Social Work', stateOfPractice: 'TX', yearsExperience: 6 
  },
  // 12. Malik (M)
  { 
    id: 'c12', name: 'Malik', gender: 'Male', specialty: 'Trauma & PTSD', status: 'AVAILABLE', rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800", 
    bio: 'Healing the past.', replicaId: 'r92debe21318', licenseNumber: 'LPC-IL-2210', degree: 'PhD, Clinical Psychology', stateOfPractice: 'IL', yearsExperience: 11 
  },
  // 13. Avery (F)
  { 
    id: 'c44', name: 'Avery', gender: 'Female', specialty: 'ADHD Support', status: 'AVAILABLE', rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800", 
    bio: 'Thriving with neurodiversity.', replicaId: 'rc2146c13e81', licenseNumber: 'PsyD-MA-6622', degree: 'PsyD, Psychology', stateOfPractice: 'MA', yearsExperience: 10 
  },
  // 14. Liam (M)
  { 
    id: 'c14', name: 'Liam', gender: 'Male', specialty: 'Anger Management', status: 'AVAILABLE', rating: 4.7, 
    imageUrl: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=800", 
    bio: 'Constructive expression.', replicaId: 'rca8a38779a8', licenseNumber: 'LCSW-MA-8812', degree: 'MSW, Social Work', stateOfPractice: 'MA', yearsExperience: 13 
  },
  // 15. Sarah (F)
  { 
    id: 'c11', name: 'Sarah', gender: 'Female', specialty: 'Eating Disorders', status: 'AVAILABLE', rating: 4.8, 
    imageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=800", 
    bio: 'Building a healthy relationship with food.', replicaId: 'r6ae5b6efc9d', licenseNumber: 'RD-NY-4421', degree: 'MS, Nutrition & Psychology', stateOfPractice: 'NY', yearsExperience: 9 
  },
  // 16. Noah (M)
  { 
    id: 'c16', name: 'Noah', gender: 'Male', specialty: 'Teen Anxiety', status: 'AVAILABLE', rating: 4.8, 
    imageUrl: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=800", 
    bio: 'Helping teens navigate pressure.', replicaId: 'r92debe21318', licenseNumber: 'LMFT-WA-9921', degree: 'MA, Family Therapy', stateOfPractice: 'WA', yearsExperience: 6 
  },
  // 17. Zoey (F)
  { 
    id: 'c13', name: 'Zoey', gender: 'Female', specialty: 'LGBTQ+ Issues', status: 'AVAILABLE', rating: 5.0, 
    imageUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=800", 
    bio: 'Affirming and inclusive care.', replicaId: 're3a705cf66a', licenseNumber: 'LMFT-OR-5521', degree: 'MA, Counseling Psychology', stateOfPractice: 'OR', yearsExperience: 5 
  },
  // 18. Jackson (M)
  { 
    id: 'c19', name: 'Jackson', gender: 'Male', specialty: 'Sports Psychology', status: 'AVAILABLE', rating: 4.8, 
    imageUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=800", 
    bio: 'Peak performance mindset.', replicaId: 'rca8a38779a8', licenseNumber: 'PsyD-FL-4421', degree: 'PsyD, Sports Psychology', stateOfPractice: 'FL', yearsExperience: 8 
  },
  // 19. Dr. Patel (F)
  { 
    id: 'c17', name: 'Dr. Patel', gender: 'Female', specialty: 'Sleep Insomnia', status: 'AVAILABLE', rating: 5.0, 
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800", 
    bio: 'Restoring natural rhythms.', replicaId: 'rc2146c13e81', licenseNumber: 'MD-NY-1102', degree: 'MD, Psychiatry', stateOfPractice: 'NY', yearsExperience: 22 
  },
  // 20. Lucas (M)
  { 
    id: 'c21', name: 'Lucas', gender: 'Male', specialty: 'Digital Addiction', status: 'AVAILABLE', rating: 4.7, 
    imageUrl: "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&q=80&w=800", 
    bio: 'Unplugging for mental health.', replicaId: 'r92debe21318', licenseNumber: 'LCSW-NY-3321', degree: 'MSW, Social Work', stateOfPractice: 'NY', yearsExperience: 6 
  },
  // 21. Sofia (F)
  { 
    id: 'c18', name: 'Sofia', gender: 'Female', specialty: 'Chronic Pain', status: 'AVAILABLE', rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=800", 
    bio: 'Mind-body healing.', replicaId: 're3a705cf66a', licenseNumber: 'PhD-CA-1123', degree: 'PhD, Health Psychology', stateOfPractice: 'CA', yearsExperience: 12 
  },
  // 22. William (M)
  { 
    id: 'c23', name: 'William', gender: 'Male', specialty: 'Divorce Recovery', status: 'AVAILABLE', rating: 4.8, 
    imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=800", 
    bio: 'Navigating life transitions.', replicaId: 'rca8a38779a8', licenseNumber: 'LMFT-IL-5521', degree: 'MA, Family Therapy', stateOfPractice: 'IL', yearsExperience: 15 
  },
  // 23. Emma (F)
  { 
    id: 'c20', name: 'Emma', gender: 'Female', specialty: 'Relationship Counseling', status: 'AVAILABLE', rating: 5.0, 
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800", 
    bio: 'Building stronger bonds.', replicaId: 'r6ae5b6efc9d', licenseNumber: 'LMFT-TX-8821', degree: 'MA, Marriage & Family', stateOfPractice: 'TX', yearsExperience: 10 
  },
  // 24. Maya (F)
  { 
    id: 'c24', name: 'Maya', gender: 'Female', specialty: 'Cultural Identity', status: 'AVAILABLE', rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&q=80&w=800", 
    bio: 'Navigating dual cultures and belonging.', replicaId: 're3a705cf66a', licenseNumber: 'LCSW-CA-1102', degree: 'MSW, Social Work', stateOfPractice: 'CA', yearsExperience: 9 
  },
  // 25. Caleb (M)
  { 
    id: 'c25', name: 'Caleb', gender: 'Male', specialty: 'Imposter Syndrome', status: 'AVAILABLE', rating: 4.8, 
    imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800", 
    bio: 'Owning your success with confidence.', replicaId: 'rca8a38779a8', licenseNumber: 'LPC-TX-9921', degree: 'MA, Counseling', stateOfPractice: 'TX', yearsExperience: 7 
  },
  // 26. Chloe (F)
  { 
    id: 'c26', name: 'Chloe', gender: 'Female', specialty: 'Pet Loss Grief', status: 'AVAILABLE', rating: 5.0, 
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800", 
    bio: 'Honoring the bond with our animal companions.', replicaId: 'r6ae5b6efc9d', licenseNumber: 'LMFT-NY-2210', degree: 'MS, Family Therapy', stateOfPractice: 'NY', yearsExperience: 12 
  },
  // 27. Jordan (M)
  { 
    id: 'c27', name: 'Jordan', gender: 'Male', specialty: 'Military Transition', status: 'AVAILABLE', rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800", 
    bio: 'From service to civilian life.', replicaId: 'r92debe21318', licenseNumber: 'LCSW-VA-4421', degree: 'MSW, Clinical Social Work', stateOfPractice: 'VA', yearsExperience: 16 
  },
  // 28. Layla (F)
  { 
    id: 'c28', name: 'Layla', gender: 'Female', specialty: 'Fertility Support', status: 'AVAILABLE', rating: 5.0, 
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=800", 
    bio: 'Supporting your path to parenthood.', replicaId: 're3a705cf66a', licenseNumber: 'PhD-CA-8821', degree: 'PhD, Health Psychology', stateOfPractice: 'CA', yearsExperience: 14 
  },
  // 29. Henry (M)
  { 
    id: 'c29', name: 'Henry', gender: 'Male', specialty: 'Retirement Adjustment', status: 'AVAILABLE', rating: 4.8, 
    imageUrl: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&q=80&w=800", 
    bio: 'Finding purpose in the next chapter.', replicaId: 'rca8a38779a8', licenseNumber: 'LMFT-FL-3321', degree: 'MA, Counseling', stateOfPractice: 'FL', yearsExperience: 25 
  },
  // 30. Nora (F)
  { 
    id: 'c30', name: 'Nora', gender: 'Female', specialty: 'Caregiver Stress', status: 'AVAILABLE', rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800", 
    bio: 'Caring for yourself while caring for others.', replicaId: 'r4317e64d25a', licenseNumber: 'LCSW-OH-9912', degree: 'MSW, Social Work', stateOfPractice: 'OH', yearsExperience: 18 
  },
  // 31. Owen (M)
  { 
    id: 'c31', name: 'Owen', gender: 'Male', specialty: 'Gaming Addiction', status: 'AVAILABLE', rating: 4.7, 
    imageUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=800", 
    bio: 'Balancing virtual worlds with reality.', replicaId: 'r92debe21318', licenseNumber: 'LPC-WA-2210', degree: 'MA, Psychology', stateOfPractice: 'WA', yearsExperience: 6 
  },
  // 32. Luna (F)
  { 
    id: 'c32', name: 'Luna', gender: 'Female', specialty: 'Spiritual Crisis', status: 'AVAILABLE', rating: 5.0, 
    imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=800", 
    bio: 'Navigating faith transitions and meaning.', replicaId: 'rc2146c13e81', licenseNumber: 'LMFT-OR-5521', degree: 'MA, Transpersonal Psych', stateOfPractice: 'OR', yearsExperience: 11 
  },
  // 33. Gabriel (M)
  { 
    id: 'c33', name: 'Gabriel', gender: 'Male', specialty: 'Anger Regulation', status: 'AVAILABLE', rating: 4.8, 
    imageUrl: "https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?auto=format&fit=crop&q=80&w=800", 
    bio: 'Transforming rage into constructive action.', replicaId: 'rca8a38779a8', licenseNumber: 'PsyD-IL-4421', degree: 'PsyD, Clinical Psychology', stateOfPractice: 'IL', yearsExperience: 13 
  },
  // 34. Sophie (F)
  { 
    id: 'c34', name: 'Sophie', gender: 'Female', specialty: 'Social Anxiety', status: 'AVAILABLE', rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800", 
    bio: 'Building confidence in connection.', replicaId: 'r6ae5b6efc9d', licenseNumber: 'LCSW-NY-3399', degree: 'MSW, Social Work', stateOfPractice: 'NY', yearsExperience: 8 
  },
  // 35. Ethan (M)
  { 
    id: 'c35', name: 'Ethan', gender: 'Male', specialty: 'Financial Anxiety', status: 'AVAILABLE', rating: 4.9, 
    imageUrl: "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&q=80&w=800", 
    bio: 'Healing your relationship with money.', replicaId: 'r92debe21318', licenseNumber: 'LMFT-CA-2210', degree: 'MA, Financial Therapy', stateOfPractice: 'CA', yearsExperience: 10 
  }
];

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
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1554151228-14d9def656ec?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1485206412256-701ccc5b93ca?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1618077555391-58f67333af49?auto=format&fit=crop&q=80&w=800"
];

export class Database {
  
  // --- USER MANAGEMENT (SUPABASE ASYNC) ---

  // Get current logged-in user details from DB
  static async getUser(): Promise<User | null> {
    const userId = localStorage.getItem(SESSION_KEY);
    if (!userId) return null;

    try {
        const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
        if (error || !data) {
            // Invalid session or user deleted
            this.clearSession();
            return null;
        }
        
        // Map DB response to User type
        return {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role as UserRole,
            balance: data.balance,
            subscriptionStatus: data.subscription_status,
            joinedAt: data.joined_at,
            lastLoginDate: data.last_login_date,
            avatar: data.avatar,
            provider: data.provider || 'email',
            streak: 0, // Computed dynamically in real app, reset here for now
            emailPreferences: data.email_preferences
        };
    } catch (e) {
        console.error("DB Get User Error:", e);
        return null;
    }
  }

  // Admin: Get all users
  static async getAllUsers(): Promise<User[]> {
      try {
          const { data, error } = await supabase.from('users').select('*');
          if (error) throw error;
          return data.map((d: any) => ({
             id: d.id, name: d.name, email: d.email, role: d.role, balance: d.balance, 
             subscriptionStatus: d.subscription_status, joinedAt: d.joined_at, 
             lastLoginDate: d.last_login_date, avatar: d.avatar, provider: d.provider, streak: 0
          }));
      } catch (e) {
          return [];
      }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
      const { data } = await supabase.from('users').select('*').eq('email', email).single();
      if (!data) return null;
      return {
          id: data.id, name: data.name, email: data.email, role: data.role, balance: data.balance,
          subscriptionStatus: data.subscription_status, joinedAt: data.joined_at,
          lastLoginDate: data.last_login_date, avatar: data.avatar, provider: data.provider, streak: 0
      };
  }

  static saveUserSession(user: User) {
    localStorage.setItem(SESSION_KEY, user.id);
  }

  static async createUser(name: string, email: string, provider: 'email' | 'google' | 'facebook' | 'x', birthday?: string, role: UserRole = UserRole.USER): Promise<User> {
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
    
    // Save to Supabase
    try {
        await supabase.from('users').insert({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            balance: newUser.balance,
            provider: newUser.provider,
            last_login_date: newUser.lastLoginDate,
            avatar: newUser.avatar,
            subscription_status: newUser.subscriptionStatus
        });
        this.saveUserSession(newUser);
    } catch (e) {
        console.error("Create User Error", e);
    }
    
    return newUser;
  }

  static async updateUser(user: User) {
    try {
        await supabase.from('users').update({
            name: user.name,
            email: user.email,
            balance: user.balance,
            last_login_date: user.lastLoginDate,
            avatar: user.avatar,
            email_preferences: user.emailPreferences
        }).eq('id', user.id);
    } catch (e) {
        console.warn("Remote update failed", e);
    }
  }

  static async deleteUser(id: string) {
      try {
          await supabase.from('users').delete().eq('id', id);
          const currentId = localStorage.getItem(SESSION_KEY);
          if (currentId === id) this.clearSession();
      } catch (e) {}
  }

  static clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  static hasAdmin(): boolean {
     // Since this is async in reality, for synchronous checks (like redirects), we might assume false
     // or this method should be refactored to be async in components.
     // For now, returning true prevents blocking login flow, logic handled in AdminLogin.
     return true; 
  }

  static checkAndIncrementStreak(user: User): User {
      // Local Logic kept for simplicity in object return, but typically needs async update
      return user; 
  }

  static async resetAllUsers() {
      // Admin only
      await supabase.from('users').delete().neq('role', 'ADMIN');
  }

  // --- SETTINGS (SUPABASE) ---
  static async getSettings(): Promise<GlobalSettings> {
    const defaultSettings: GlobalSettings = {
        pricePerMinute: 1.59,
        saleMode: true,
        maintenanceMode: false,
        allowSignups: true,
        siteName: 'Peutic',
        maxConcurrentSessions: 15,
        multilingualMode: true
    };
    try {
        const { data } = await supabase.from('global_settings').select('*').eq('id', 1).single();
        if (data) {
            return {
                pricePerMinute: data.price_per_minute,
                saleMode: data.sale_mode,
                maintenanceMode: data.maintenance_mode,
                allowSignups: data.allow_signups,
                siteName: data.site_name,
                broadcastMessage: data.broadcast_message,
                maxConcurrentSessions: data.max_concurrent_sessions,
                multilingualMode: data.multilingual_mode
            };
        }
    } catch (e) {}
    return defaultSettings;
  }

  static async saveSettings(settings: GlobalSettings) {
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

  // --- COMPANIONS (SUPABASE) ---
  static async getCompanions(): Promise<Companion[]> {
      // Prefer Database source for dynamic updates
      const { data } = await supabase.from('companions').select('*');
      if (data && data.length > 0) {
          return data.map((c: any) => ({
              id: c.id, name: c.name, specialty: c.specialty, status: c.status,
              imageUrl: c.image_url, rating: c.rating, bio: c.bio, replicaId: c.replica_id,
              gender: c.gender, licenseNumber: c.license_number, degree: c.degree,
              stateOfPractice: c.state_of_practice, yearsExperience: c.years_experience
          }));
      }
      // Fallback to static list if DB is empty
      return INITIAL_COMPANIONS;
  }

  static async updateCompanion(c: Companion) {
      await supabase.from('companions').upsert({
          id: c.id, name: c.name, specialty: c.specialty, status: c.status,
          image_url: c.imageUrl, rating: c.rating, bio: c.bio, replica_id: c.replicaId,
          gender: c.gender, license_number: c.licenseNumber, degree: c.degree,
          state_of_practice: c.stateOfPractice, years_experience: c.yearsExperience
      });
  }

  // --- JOURNALS (SUPABASE) ---
  static async getJournals(userId: string): Promise<JournalEntry[]> {
      const { data } = await supabase.from('journals').select('*').eq('user_id', userId).order('date', { ascending: false });
      return (data || []).map((d: any) => ({ id: d.id, userId: d.user_id, content: d.content, date: d.date }));
  }

  static async saveJournal(entry: JournalEntry) {
      await supabase.from('journals').insert({
          id: entry.id, user_id: entry.userId, content: entry.content, date: entry.date
      });
  }

  // --- TRANSACTIONS (SUPABASE) ---
  static async getAllTransactions(): Promise<Transaction[]> {
      const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      return (data || []).map((d: any) => ({
          id: d.id, userId: d.user_id, userName: d.user_name, amount: d.amount, cost: d.cost, description: d.description, status: d.status, date: d.date
      }));
  }

  static async getUserTransactions(userId: string): Promise<Transaction[]> {
      const { data } = await supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false });
      return (data || []).map((d: any) => ({
          id: d.id, userId: d.user_id, userName: d.user_name, amount: d.amount, cost: d.cost, description: d.description, status: d.status, date: d.date
      }));
  }

  static async addTransaction(tx: Transaction) {
      await supabase.from('transactions').insert({
          id: tx.id, user_id: tx.userId, user_name: tx.userName, amount: tx.amount, cost: tx.cost, description: tx.description, status: tx.status, date: tx.date
      });
  }

  static async topUpWallet(amount: number, cost: number, userId?: string) {
      if (!userId) {
          const u = await this.getUser();
          if (u) userId = u.id; else return;
      }
      const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
      if (user) {
          const newBalance = (user.balance || 0) + amount;
          await supabase.from('users').update({ balance: newBalance }).eq('id', userId);
          await this.addTransaction({
              id: `tx_${Date.now()}`, userId: userId, userName: user.name, date: new Date().toISOString(),
              amount: amount, cost: cost, description: cost > 0 ? 'Credit Purchase' : 'Admin Grant', status: 'COMPLETED'
          });
      }
  }

  static async deductBalance(amount: number) {
      const user = await this.getUser();
      if (user) {
          const newBalance = Math.max(0, user.balance - amount);
          await supabase.from('users').update({ balance: newBalance }).eq('id', user.id);
      }
  }

  // --- MOODS & LOGS ---
  static async getMoods(userId: string): Promise<MoodEntry[]> {
      const { data } = await supabase.from('mood_entries').select('*').eq('user_id', userId);
      return (data || []).map((d: any) => ({ id: d.id, userId: d.user_id, mood: d.mood, date: d.date }));
  }

  static async saveMood(userId: string, mood: 'confetti' | 'rain' | null) {
      if (!mood) return;
      await supabase.from('mood_entries').insert({
          id: `m_${Date.now()}`, user_id: userId, mood: mood, date: new Date().toISOString()
      });
  }

  // --- GLOBAL QUEUE SYSTEM (SUPABASE) ---
  private static async runGlobalCleanup() {
      const cutoff = new Date(Date.now() - 15000).toISOString(); 
      try {
          await supabase.from('active_sessions').delete().lt('last_ping', cutoff);
          await supabase.from('session_queue').delete().lt('last_ping', cutoff);
      } catch (e) {}
  }

  static async getActiveSessionCount(): Promise<number> {
      await this.runGlobalCleanup();
      const { count } = await supabase.from('active_sessions').select('*', { count: 'exact', head: true });
      return count || 0;
  }

  static async claimActiveSpot(userId: string): Promise<boolean> {
      await this.runGlobalCleanup();
      const settings = await this.getSettings();
      const count = await this.getActiveSessionCount();
      
      const { data: existing } = await supabase.from('active_sessions').select('user_id').eq('user_id', userId).single();
      if (existing) {
          await this.sendKeepAlive(userId);
          return true;
      }

      if (count >= settings.maxConcurrentSessions) return false;

      const { error } = await supabase.from('active_sessions').insert({ user_id: userId, last_ping: new Date().toISOString() });
      if (error && error.code !== '23505') return false;

      await this.leaveQueue(userId);
      return true;
  }

  static async sendKeepAlive(userId: string) {
      await supabase.from('active_sessions').upsert({ user_id: userId, last_ping: new Date().toISOString() });
  }

  static async sendQueueHeartbeat(userId: string) {
      await supabase.from('session_queue').update({ last_ping: new Date().toISOString() }).eq('user_id', userId);
  }

  static async endSession(userId: string) {
      await supabase.from('active_sessions').delete().eq('user_id', userId);
      await supabase.from('session_queue').delete().eq('user_id', userId);
  }

  static async getQueueLength(): Promise<number> {
      const { count } = await supabase.from('session_queue').select('*', { count: 'exact', head: true });
      return count || 0;
  }

  static async joinQueue(userId: string): Promise<number> {
      const currentPos = await this.getQueuePosition(userId);
      if (currentPos > 0) return currentPos;

      const queueLen = await this.getQueueLength();
      if (queueLen >= 35) return -1;

      await supabase.from('session_queue').upsert({
          user_id: userId,
          joined_at: new Date().toISOString(),
          last_ping: new Date().toISOString()
      });
      
      return await this.getQueuePosition(userId);
  }

  static async leaveQueue(userId: string) {
      await supabase.from('session_queue').delete().eq('user_id', userId);
  }

  static async getQueuePosition(userId: string): Promise<number> {
      const { data: myEntry } = await supabase.from('session_queue').select('joined_at').eq('user_id', userId).single();
      if (!myEntry) return 0;
      const { count } = await supabase.from('session_queue').select('*', { count: 'exact', head: true }).lt('joined_at', myEntry.joined_at);
      return (count || 0) + 1;
  }

  static getEstimatedWaitTime(pos: number): number {
      return Math.max(0, (pos - 1) * 3);
  }

  // --- ART & WISDOM ---
  static async saveArt(entry: ArtEntry) {
      await supabase.from('user_art').insert({
          id: entry.id, user_id: entry.userId, image_url: entry.imageUrl,
          prompt: entry.prompt, title: entry.title, created_at: entry.createdAt
      });
  }

  static async getUserArt(userId: string): Promise<ArtEntry[]> {
      const { data } = await supabase.from('user_art').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
      return (data || []).map((d: any) => ({
          id: d.id, userId: d.user_id, imageUrl: d.image_url, prompt: d.prompt, title: d.title, createdAt: d.created_at
      }));
  }

  static async deleteArt(id: string) {
      await supabase.from('user_art').delete().eq('id', id);
  }

  // --- FEEDBACK & LOGS ---
  static async saveFeedback(feedback: SessionFeedback) {
      await supabase.from('session_feedback').insert({
          id: feedback.id, user_id: feedback.userId, user_name: feedback.userName,
          companion_name: feedback.companionName, rating: feedback.rating, tags: feedback.tags,
          duration: feedback.duration, date: feedback.date
      });
  }

  static async recordBreathSession(userId: string, duration: number) {
      await supabase.from('breath_logs').insert({
          id: `b_${Date.now()}`, user_id: userId, duration_seconds: duration, date: new Date().toISOString()
      });
  }
  
  static async getSystemLogs(): Promise<SystemLog[]> {
      const { data } = await supabase.from('system_logs').select('*').order('timestamp', { ascending: false }).limit(100);
      return data || [];
  }

  static async logSystemEvent(type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'SECURITY', event: string, details: string) {
      await supabase.from('system_logs').insert({
          id: `log_${Date.now()}`, timestamp: new Date().toISOString(), type, event, details
      });
  }

  static async getWeeklyProgress(userId: string): Promise<{ current: number; target: number; message: string }> {
      // Simplified progress logic for backend migration
      const { count: sessions } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('user_id', userId).lt('amount', 0);
      const score = (sessions || 0) * 3;
      const target = 10;
      let message = "Start your journey.";
      if (score > 0) message = "Great start!";
      if (score >= 5) message = "Halfway there!";
      if (score >= 10) message = "Goal Crushed! 🌟";
      return { current: score, target, message };
  }

  // --- ADMIN SECURITY (SIMPLE LOCAL FALLBACK) ---
  static checkAdminLockout(): number {
      const stored = localStorage.getItem('peutic_admin_lockout');
      if (!stored) return 0;
      const { attempts, lockoutUntil } = JSON.parse(stored);
      if (lockoutUntil && Date.now() < lockoutUntil) return Math.ceil((lockoutUntil - Date.now()) / 60000);
      return 0;
  }
  static recordAdminFailure() {
      let stored = JSON.parse(localStorage.getItem('peutic_admin_lockout') || '{"attempts":0}');
      stored.attempts++;
      if (stored.attempts >= 5) stored.lockoutUntil = Date.now() + 15 * 60000;
      localStorage.setItem('peutic_admin_lockout', JSON.stringify(stored));
  }
  static resetAdminFailure() { localStorage.removeItem('peutic_admin_lockout'); }
}
