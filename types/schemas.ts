import { z } from 'zod';

export const UserRoleSchema = z.enum(['GUEST', 'USER', 'ADMIN']);

export const UserSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    role: UserRoleSchema,
    balance: z.number().default(0),
    avatar: z.string().optional(),
    avatarLocked: z.boolean().optional(),
    subscriptionStatus: z.enum(['ACTIVE', 'INACTIVE', 'PREMIUM', 'BANNED']),
    joinedAt: z.string(),
    lastActive: z.string().optional(),
    birthday: z.string().optional(),
    provider: z.enum(['email', 'google', 'facebook', 'x']),
    emailPreferences: z.object({
        marketing: z.boolean(),
        updates: z.boolean(),
    }).optional(),
    gameScores: z.object({
        match: z.number(),
        cloud: z.number(),
        slicer: z.number().optional()
    }).optional(),
    streak: z.number().default(0),
    lastLoginDate: z.string(),
    themePreference: z.string().optional(),
    languagePreference: z.string().optional(),
    gamificationEnabled: z.boolean().optional(),
    unlockedRooms: z.array(z.string()).optional(),
    unlockedAchievements: z.array(z.string()).optional(),
    unlockedDecor: z.array(z.string()).optional(),
    oracleTokens: z.number().optional(),
});

export const GardenStateSchema = z.object({
    userId: z.string(),
    level: z.number().min(1).max(5),
    currentPlantType: z.enum(['Lotus', 'Rose', 'Sunflower', 'Fern', 'Sakura', 'Oak', 'Willow', 'Bonsai', 'Crystal Lotus', 'Lunar Fern', 'Storm Oak', 'Sunlight Spire']),
    waterLevel: z.number().min(0).max(100),
    lastWateredAt: z.string(),
    streakCurrent: z.number(),
    streakBest: z.number(),
    focusMinutes: z.number(),
    harvestedPlants: z.array(z.string()).optional(),
});

export const LuminaSchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    species: z.enum(['Holo-Hamu', 'Digi-Dino', 'Neo-Shiba', 'Zen-Sloth']),
    level: z.number(),
    experience: z.number(),
    health: z.number().min(0).max(100),
    hunger: z.number().min(0).max(100),
    happiness: z.number().min(0).max(100),
    cleanliness: z.number().min(0).max(100),
    energy: z.number().min(0).max(100),
    isSleeping: z.boolean(),
    lastInteractionAt: z.string(),
    createdAt: z.string(),
});
