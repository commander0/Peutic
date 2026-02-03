import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserRole } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { UserService } from '../../services/userService';

// --- Types ---
interface AuthContextType {
    user: User | null;
    session: any | null;
    loading: boolean;
    isAdmin: boolean;
    refreshProfile: () => Promise<void>;
    signOut: () => Promise<void>;
    setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};

// --- Provider ---
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const syncingRef = React.useRef(false);

    // 1. Core Sync Logic
    // 1. Core Sync Logic
    const syncSession = async (currentSession: any) => {
        if (syncingRef.current) return;
        syncingRef.current = true;

        try {
            if (!currentSession?.user) {
                setUser(null);
                setSession(null);
                setLoading(false);
                return;
            }

            setSession(currentSession);

            // Fetch latest profile state directly
            // Removed: UserService.clearCache() call here as it can cause flickering if unnecessary
            // We rely on syncUser to fetch fresh data if needed or return cached if valid
            const profile = await UserService.syncUser(currentSession.user.id);

            if (profile) {
                setUser(profile);
            } else {
                console.warn("Auth: Profile sync returned null for valid session.");
                // We do NOT set user to null here to avoid blowing up the session immediately
                // but usually this means the user is not in the public.users table yet
            }
        } catch (error) {
            console.error("Auth: Sync failed", error);
        } finally {
            setLoading(false);
            syncingRef.current = false;
        }
    };

    // 2. Lifecycle Listener
    useEffect(() => {
        // SAFETY TIMEOUT: If Supabase hangs (e.g. missing Envs in Production), force stop loading after 5s
        const safetyTimer = setTimeout(() => {
            if (loading) {
                console.warn("Auth: Loading timeout reached. Force releasing lock.");
                setLoading(false);
                syncingRef.current = false;
            }
        }, 5000);

        // Initial Load
        supabase.auth.getSession().then(({ data: { session } }) => {
            syncSession(session);
        }).catch(e => {
            console.error("Auth: Session Fetch Error", e);
            setLoading(false);
        });

        // Realtime Subscription
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log(`Auth Event: ${event}`);

            if (event === 'SIGNED_OUT') {
                setUser(null);
                setSession(null);
                setLoading(false);
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                await syncSession(newSession);
            }
        });

        return () => {
            clearTimeout(safetyTimer);
            subscription.unsubscribe();
        };
    }, []);

    // 3. Actions
    const refreshProfile = async () => {
        if (session?.user?.id) {
            const profile = await UserService.syncUser(session.user.id);
            if (profile) setUser(profile);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    // 4. Derived State
    const isAdmin = user?.role === UserRole.ADMIN;

    return (
        <AuthContext.Provider value={{
            user,
            session,
            loading,
            isAdmin,
            refreshProfile,
            signOut,
            setUser // Exposed for manual updates if absolutely necessary (legacy compat)
        }}>
            {children}
        </AuthContext.Provider>
    );
};
