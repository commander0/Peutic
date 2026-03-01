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
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();

                if (userData && isMounted) {
                    const parsed = UserSchema.safeParse(userData);
                    if (parsed.success) setUserProfile(parsed.data as unknown as User);
                    else console.error("Zod User Parse Error:", parsed.error);
                }

                // Fetch Garden
                const { data: gardenData } = await supabase
                    .from('gardens')
                    .select('*')
                    .eq('userId', authUser.id)
                    .single();

                if (gardenData && isMounted) {
                    const parsed = GardenStateSchema.safeParse(gardenData);
                    if (parsed.success) setGarden(parsed.data);
                }

                // Fetch Lumina
                const { data: luminaData } = await supabase
                    .from('luminas')
                    .select('*')
                    .eq('userId', authUser.id)
                    .single();

                if (luminaData && isMounted) {
                    const parsed = LuminaSchema.safeParse(luminaData);
                    if (parsed.success) setLumina(parsed.data);
                }
            } catch (err: any) {
                if (isMounted) setSyncError(err);
            } finally {
                if (isMounted) setIsSyncing(false);
            }
        };

        fetchInitialState();

        // 2. Realtime Subscriptions (The Single Truth implementation)
        const userSub = supabase
            .channel('public:users')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${authUser.id}` }, (payload) => {
                const parsed = UserSchema.safeParse(payload.new);
                if (parsed.success && isMounted) setUserProfile(parsed.data);
            })
            .subscribe();

        const gardenSub = supabase
            .channel('public:gardens')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'gardens', filter: `userId=eq.${authUser.id}` }, (payload: any) => {
                const parsed = GardenStateSchema.safeParse(payload.new);
                if (parsed.success && isMounted) setGarden(parsed.data);
            })
            .subscribe();

        const luminaSub = supabase
            .channel('public:luminas')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'luminas', filter: `userId=eq.${authUser.id}` }, (payload: any) => {
                const parsed = LuminaSchema.safeParse(payload.new);
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
