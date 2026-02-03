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

    const refreshProfile = async (currentUserId?: string) => {
        const targetId = currentUserId || session?.user?.id;
        if (!targetId) return;

        try {
            const profile = await UserService.syncUser(targetId);
            if (profile) {
                console.log("Auth: Profile Synced", profile.role);
                setUser(profile);
            } else {
                console.warn("Auth: Profile not found in public.users");
            }
        } catch (err) {
            console.error("Auth: Profile Sync Failed", err);
        }
    };

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            // 1. Get Initial Session
            const { data: { session: initialSession } } = await supabase.auth.getSession();

            if (mounted) {
                setSession(initialSession);
                if (initialSession?.user) {
                    await refreshProfile(initialSession.user.id);
                }
                setLoading(false);
            }
        };

        initAuth();

        // 2. Listen for Changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log(`Auth Event: ${event}`);
            if (!mounted) return;

            if (event === 'SIGNED_OUT') {
                setSession(null);
                setUser(null);
                setLoading(false);
            } else if (newSession?.user) {
                setSession(newSession);
                // Only sync profile if we don't have it or the user changed
                if (!user || user.id !== newSession.user.id || event === 'SIGNED_IN') {
                    await refreshProfile(newSession.user.id);
                }
            } else {
                // Edge case: Session exists but empty?
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        // State updates handled by onAuthStateChange
    };

    // Derived State
    const isAdmin = user?.role === UserRole.ADMIN;

    return (
        <AuthContext.Provider value={{
            user,
            session,
            loading,
            isAdmin,
            refreshProfile: () => refreshProfile(),
            signOut,
            setUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};
