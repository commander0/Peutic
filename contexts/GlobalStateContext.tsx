import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import { User, GardenState, Lumina } from '../types';
import { UserSchema, GardenStateSchema, LuminaSchema } from '../types/schemas';

interface GlobalState {
    userProfile: User | null;
    garden: GardenState | null;
    lumina: Lumina | null;
    isSyncing: boolean;
    syncError: Error | null;
}

const GlobalStateContext = createContext<GlobalState | undefined>(undefined);

export const GlobalStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user: authUser } = useAuth(); // Auth session user

    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [garden, setGarden] = useState<GardenState | null>(null);
    const [lumina, setLumina] = useState<Lumina | null>(null);

    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState<Error | null>(null);

    useEffect(() => {
        if (!authUser) {
            setUserProfile(null);
            setGarden(null);
            setLumina(null);
            return;
        }

        let isMounted = true;
        setIsSyncing(true);
        setSyncError(null);

        const fetchInitialState = async () => {
            try {
                // Fetch User Profile
                const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();

                if (userData && isMounted) {
                    const mappedUser = {
                        ...userData,
                        avatarLocked: userData.avatar_locked,
                        subscriptionStatus: userData.subscription_status,
                        joinedAt: userData.joined_at,
                        lastActive: userData.last_active,
                        emailPreferences: userData.email_preferences,
                        gameScores: userData.game_scores,
                        lastLoginDate: userData.last_login_date,
                        themePreference: userData.theme_preference,
                        languagePreference: userData.language_preference,
                        gamificationEnabled: userData.gamification_enabled,
                        unlockedRooms: userData.unlocked_rooms,
                        unlockedAchievements: userData.unlocked_achievements,
                        unlockedDecor: userData.unlocked_decor,
                        oracleTokens: userData.oracle_tokens
                    };
                    const parsed = UserSchema.safeParse(mappedUser);
                    if (parsed.success) setUserProfile(parsed.data as unknown as User);
                    else console.error("Zod User Parse Error:", parsed.error);
                }

                const { data: gardenData } = await supabase
                    .from('garden_log')
                    .select('*')
                    .eq('user_id', authUser.id)
                    .single();

                if (gardenData && isMounted) {
                    const mappedGarden = {
                        userId: gardenData.user_id,
                        level: gardenData.level,
                        currentPlantType: gardenData.current_plant_type,
                        waterLevel: gardenData.water_level || 50,
                        lastWateredAt: gardenData.last_watered_at,
                        streakCurrent: gardenData.streak_current,
                        streakBest: gardenData.streak_best,
                        focusMinutes: gardenData.focus_minutes || 0,
                        harvestedPlants: gardenData.harvested_plants || []
                    };
                    const parsed = GardenStateSchema.safeParse(mappedGarden);
                    if (parsed.success) setGarden(parsed.data);
                }

                const { data: luminaData } = await supabase
                    .from('pocket_pets')
                    .select('*')
                    .eq('user_id', authUser.id)
                    .single();

                if (luminaData && isMounted) {
                    const mappedLumina = {
                        ...luminaData,
                        userId: luminaData.user_id,
                        isSleeping: luminaData.is_sleeping,
                        lastInteractionAt: luminaData.last_interaction_at,
                        createdAt: luminaData.created_at
                    };
                    const parsed = LuminaSchema.safeParse(mappedLumina);
                    if (parsed.success) setLumina(parsed.data);
                }
            } catch (err: any) {
                if (isMounted) setSyncError(err);
            } finally {
                if (isMounted) setIsSyncing(false);
            }
        };

        fetchInitialState();

        const userSub = supabase
            .channel('public:users')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${authUser.id}` }, (payload: any) => {
                const mappedUser = {
                    ...payload.new,
                    avatarLocked: payload.new.avatar_locked,
                    subscriptionStatus: payload.new.subscription_status,
                    joinedAt: payload.new.joined_at,
                    lastActive: payload.new.last_active,
                    emailPreferences: payload.new.email_preferences,
                    gameScores: payload.new.game_scores,
                    lastLoginDate: payload.new.last_login_date,
                    themePreference: payload.new.theme_preference,
                    languagePreference: payload.new.language_preference,
                    gamificationEnabled: payload.new.gamification_enabled,
                    unlockedRooms: payload.new.unlocked_rooms,
                    unlockedAchievements: payload.new.unlocked_achievements,
                    unlockedDecor: payload.new.unlocked_decor,
                    oracleTokens: payload.new.oracle_tokens
                };
                const parsed = UserSchema.safeParse(mappedUser);
                if (parsed.success && isMounted) setUserProfile(parsed.data as any);
            })
            .subscribe();

        const gardenSub = supabase
            .channel('public:garden_log')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'garden_log', filter: `user_id=eq.${authUser.id}` }, (payload: any) => {
                const mappedGarden = {
                    userId: payload.new.user_id,
                    level: payload.new.level,
                    currentPlantType: payload.new.current_plant_type,
                    waterLevel: payload.new.water_level || 50,
                    lastWateredAt: payload.new.last_watered_at,
                    streakCurrent: payload.new.streak_current,
                    streakBest: payload.new.streak_best,
                    focusMinutes: payload.new.focus_minutes || 0,
                    harvestedPlants: payload.new.harvested_plants || []
                };
                const parsed = GardenStateSchema.safeParse(mappedGarden);
                if (parsed.success && isMounted) setGarden(parsed.data);
            })
            .subscribe();

        const luminaSub = supabase
            .channel('public:pocket_pets')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pocket_pets', filter: `user_id=eq.${authUser.id}` }, (payload: any) => {
                const mappedLumina = {
                    ...payload.new,
                    userId: payload.new.user_id,
                    isSleeping: payload.new.is_sleeping,
                    lastInteractionAt: payload.new.last_interaction_at,
                    createdAt: payload.new.created_at
                };
                const parsed = LuminaSchema.safeParse(mappedLumina);
                if (parsed.success && isMounted) setLumina(parsed.data);
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(userSub);
            supabase.removeChannel(gardenSub);
            supabase.removeChannel(luminaSub);
        };
    }, [authUser]);

    return (
        <GlobalStateContext.Provider value={{ userProfile, garden, lumina, isSyncing, syncError }}>
            {children}
        </GlobalStateContext.Provider>
    );
};

export const useGlobalState = () => {
    const context = useContext(GlobalStateContext);
    if (context === undefined) throw new Error('useGlobalState must be used within GlobalStateProvider');
    return context;
};
