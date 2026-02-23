-- ==========================================
-- COMPANION RESTORATION PARTICLE - (Force Seed)
-- ==========================================
-- This script will:
-- 1. CLEAR all existing companions (to remove duplicates/corruption).
-- 2. INSERT the clean 35-Avatar Roster.

-- WARNING: This deletes existing companion data!
truncate table public.companions cascade;

-- INSERT ROSTER
insert into public.companions (name, specialty, status, rating, bio, image_url, years_experience, degree) 
values 
    ('Dr. Sarah Chen', 'Clinical Psychology', 'AVAILABLE', 4.9, 'Expert in CBT and anxiety management.', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300', 12, 'PhD'),
    ('Marcus Rivera', 'Life Coach', 'AVAILABLE', 4.8, 'Specializing in career transitions and motivation.', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300', 8, 'ICF'),
    ('Elena Vostok', 'Trauma Specialist', 'AVAILABLE', 5.0, 'Somatic experiencing and deep healing.', 'https://images.unsplash.com/photo-1573496359-0cf84adb60cc?w=300', 15, 'MD'),
    ('Kai Tanaka', 'Mindfulness Mentor', 'AVAILABLE', 4.9, 'Zen practice and stress reduction.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300', 10, 'MA'),
    ('Julia Banks', 'Family Therapist', 'AVAILABLE', 4.7, 'Healing relationships and family dynamics.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300', 14, 'LMFT'),
    ('Dr. Amani Okafor', 'Psychiatrist', 'AVAILABLE', 5.0, 'Holistic medication and therapy management.', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300', 18, 'MD'),
    ('Leo Thorne', 'Addiction Counselor', 'AVAILABLE', 4.8, 'Supportive path to recovery.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300', 9, 'CADC'),
    ('Sophia Rossi', 'Art Therapist', 'AVAILABLE', 4.9, 'Expressing emotion through creative arts.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300', 7, 'ATR'),
    ('James Wilson', 'Grief Counselor', 'AVAILABLE', 4.9, 'Navigating loss with compassion.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300', 20, 'LCSW'),
    ('Nadia Petrova', 'Sleep Specialist', 'AVAILABLE', 4.8, 'Insomnia and circadian rhythm optimization.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300', 11, 'PhD'),
    ('Liam O''Connor', 'Youth Mentor', 'AVAILABLE', 4.7, 'Guiding adolescents through challenges.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300', 6, 'BSw'),
    ('Priya Patel', 'Postpartum Support', 'AVAILABLE', 5.0, 'Supporting new mothers and parents.', 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=300', 13, 'Doula'),
    ('Thomas Wright', 'Veterans Support', 'AVAILABLE', 4.9, 'PTSD and reintegration specialist.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300', 16, 'PsyD'),
    ('Isabella Martinez', 'Eating Disorders', 'AVAILABLE', 4.9, 'Developing healthy relationships with food.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300', 12, 'RD'),
    ('Robert Chang', 'Financial Therapist', 'AVAILABLE', 4.8, 'Healing money anxiety and mindset.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300', 10, 'CFT'),
    ('Zoe Anderson', 'Sex Therapist', 'AVAILABLE', 4.9, 'Intimacy and relationship health.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300', 14, 'AASECT'),
    ('David Kim', 'Performance Coach', 'AVAILABLE', 4.7, 'Optimizing mental state for high achievers.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300', 9, 'MSc'),
    ('Maria Garcia', 'Geriatric Counseling', 'AVAILABLE', 4.8, 'Supporting aging and life transitions.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300', 15, 'MSW'),
    ('Dr. Samuel Abebe', 'Neurodiversity', 'AVAILABLE', 5.0, 'ADHD and Autism support specialist.', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300', 11, 'PhD'),
    ('Clara Dubois', 'Spirituality Guide', 'AVAILABLE', 4.9, 'Finding meaning and spiritual connection.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300', 20, 'MDiv'),
    ('Oliver Grant', 'Men''s Health', 'AVAILABLE', 4.8, 'Emotional intelligence and support for men.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300', 8, 'LPC'),
    ('Lily Chen', 'Social Anxiety', 'AVAILABLE', 4.9, 'Overcoming shyness and building confidence.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300', 10, 'LCSW'),
    ('Hassan Ahmed', 'Anger Management', 'AVAILABLE', 4.7, 'Constructive emotional regulation.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300', 13, 'PhD'),
    ('Emma Watson', 'Divorce Recovery', 'AVAILABLE', 4.9, 'Navigating separation and new beginnings.', 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=300', 11, 'LMFT'),
    ('Lucas Silva', 'Tech Addiction', 'AVAILABLE', 4.8, 'Digital detox and healthy habits.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300', 7, 'PsyD'),
    ('Grace Kelly', 'Chronic Pain', 'AVAILABLE', 4.9, 'Pain psychology and management.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300', 14, 'PhD'),
    ('Noah Williams', 'LGBTQ+ Support', 'AVAILABLE', 5.0, 'Affirmative therapy and identity support.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300', 9, 'LCSW'),
    ('Ava Johnson', 'Burnout Specialist', 'AVAILABLE', 4.9, 'Recovery from professional exhaustion.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300', 12, 'MBA'),
    ('Ethan Brown', 'Phobia Specialist', 'AVAILABLE', 4.8, 'Exposure therapy for specific fears.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300', 10, 'PhD'),
    ('Mia Davis', 'Cultural Identity', 'AVAILABLE', 4.9, 'Navigating cross-cultural experiences.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300', 8, 'MA'),
    ('Alexander White', 'Existential Therapy', 'AVAILABLE', 4.8, 'Finding purpose and meaning in life.', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300', 17, 'PhD'),
    ('Charlotte Miller', 'Pet Loss', 'AVAILABLE', 5.0, 'Grieving animal companions.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300', 6, 'PLSC'),
    ('Benjamin Moore', 'Impulse Control', 'AVAILABLE', 4.7, 'Managing urges and behaviors.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300', 11, 'PsyD'),
    ('Amelia Taylor', 'Remote Work Wellness', 'AVAILABLE', 4.9, 'Balancing life and work from home.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300', 5, 'Coach'),
    ('Daniel Anderson', 'Crisis Intervention', 'AVAILABLE', 5.0, 'Immediate support for acute distress.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300', 15, 'LCSW');
