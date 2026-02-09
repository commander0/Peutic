import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { UserService } from '../services/userService';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (role: UserRole, name: string, avatar?: string, email?: string, birthday?: string, provider?: 'email' | 'google' | 'facebook' | 'x', password?: string, isSignup?: boolean) => Promise<void>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    setSession: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(UserService.getCachedUser());
    const [isLoading, setIsLoading] = useState(true);

    // 1. UNIFIED AUTHENTICATION FLOW
    useEffect(() => {
        let mounted = true;

        const handleSession = async (session: any) => {
            if (!mounted) return;

            if (session?.user) {
                // A. Valid Session: Sync with DB
                try {
                    const dbUser = await UserService.restoreSession();
                    if (mounted && dbUser) {
                        setUser(dbUser);
                        // UserService.restoreSession already handles local storage sync
                    } else if (mounted) {
                        // Fallback: If DB sync fails (e.g. network), try cache but warn
                        console.warn("AuthContext: Using cached user due to sync failure");
                        const cached = UserService.getCachedUser();
                        if (cached && cached.id === session.user.id) setUser(cached);
                    }
                } catch (error) {
                    console.error("AuthContext: Session Sync Error", error);
                }
            } else {
                // B. No Session: Clear State
                if (mounted) setUser(null);
                UserService.clearCache();
            }
            if (mounted) setIsLoading(false);
        };

        // Initialize
        supabase.auth.getSession().then(({ data: { session } }) => handleSession(session as any));

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
            handleSession(session);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const login = async (
        _role: UserRole,
        name: string,
        _avatar?: string,
        email?: string,
        birthday?: string,
        provider: 'email' | 'google' | 'facebook' | 'x' = 'email',
        password?: string,
        isSignup: boolean = false
    ) => {
        setIsLoading(true);
        try {
            let currentUser: User;
            const userEmail = email || `${name.toLowerCase().replace(/ /g, '.')}@example.com`;

            if (provider === 'email' && password) {
                try {
                    if (isSignup) throw new Error("Signup");
                    currentUser = await UserService.login(userEmail, password);
                } catch (e: any) {
                    // Fallback to Create if login fails and it looks like a signup intent or generic credential error
                    if (isSignup || e.message.includes('Signup') || !e.message.includes('Invalid')) {
                        currentUser = await UserService.createUser(name, userEmail, password, provider, birthday);
                    } else throw e;
                }
            } else {
                // Social Mock / OAuth placeholder logic
                currentUser = await UserService.createUser(name, userEmail, 'social-pw', provider, birthday);
            }

            setUser(currentUser);
            UserService.saveUserSession(currentUser);
        } catch (e) {
            console.error("Login Context Error", e);
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await UserService.logout();
            setUser(null);
            UserService.clearCache();
        } finally {
            setIsLoading(false);
        }
    };

    const refreshProfile = async () => {
        if (!user) return;
        const fresh = await UserService.syncUser(user.id);
        if (fresh) setUser(fresh);
    };

    const setSession = (user: User) => {
        setUser(user);
        UserService.saveUserSession(user);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, refreshProfile, setSession }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
