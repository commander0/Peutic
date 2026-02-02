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

    // 1. Core Sync Logic
    const syncSession = async (currentSession: any) => {
        if (!currentSession?.user) {
            setUser(null);
            setSession(null);
            setLoading(false);
            return;
        }

        setSession(currentSession);

        try {
            // Fetch strict profile from DB
            const profile = await UserService.syncUser(currentSession.user.id);
            if (profile) {
                setUser(profile);
            } else {
                console.warn("Auth: Session valid but Profile missing. Waiting for Trigger...");
                // In a perfect world (Golden Master), this shouldn't happen often.
                // We could implement a retry here if needed, but for now we let it settle.
            }
        } catch (error) {
            console.error("Auth: Sync failed", error);
        } finally {
            setLoading(false);
        }
    };

    // 2. Lifecycle Listener
    useEffect(() => {
        // Initial Load
        supabase.auth.getSession().then(({ data: { session } }) => {
            syncSession(session);
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

        return () => subscription.unsubscribe();
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
