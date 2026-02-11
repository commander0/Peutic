import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserService } from '../services/userService';

export type ThemeBrand = 'default' | 'sunshine' | 'rose' | 'ocean' | 'forest' | 'sunset' | 'lavender' | 'cyberpunk' | 'midnight' | 'coffee' | 'royal';
export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    theme: ThemeBrand;
    mode: ThemeMode;
    setTheme: (theme: ThemeBrand) => void;
    setMode: (mode: ThemeMode) => void;
    toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'default',
    mode: 'light',
    setTheme: () => { },
    setMode: () => { },
    toggleMode: () => { }
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<ThemeBrand>('sunshine');
    const [mode, setModeState] = useState<ThemeMode>('light');

    // Load from User/Storage on mount
    useEffect(() => {
        const user = UserService.getUser();
        let loadedTheme: ThemeBrand = 'sunshine';
        let loadedMode: ThemeMode = 'light';

        if (user?.themePreference) {
            // Parse "brand-mode" string
            const parts = user.themePreference.split('-');
            const potentialMode = parts[parts.length - 1];
            if (potentialMode === 'light' || potentialMode === 'dark') {
                loadedMode = potentialMode;
                loadedTheme = parts.slice(0, -1).join('-') as ThemeBrand;
            } else {
                // Fallback for legacy values
                if (user.themePreference === 'dark') { loadedMode = 'dark'; loadedTheme = 'sunshine'; }
                else if (user.themePreference === 'light') { loadedMode = 'light'; loadedTheme = 'sunshine'; }
                else {
                    const pref = user.themePreference as string;
                    loadedTheme = (pref === 'default' || pref === 'gold' || pref === 'amber') ? 'sunshine' : (pref as ThemeBrand);
                }
            }
        } else {
            const savedTheme = localStorage.getItem('peutic_theme') as ThemeBrand;
            const savedMode = localStorage.getItem('peutic_mode') as ThemeMode;
            if (savedTheme) loadedTheme = savedTheme;
            if (savedMode) loadedMode = savedMode;
        }

        // Default to SUNSHINE if not specified (User Request)
        setThemeState(loadedTheme || 'sunshine');
        setModeState(loadedMode || 'light');

        // REALTIME: Subscribe to User Changes for Multi-Device/Tab Sync
        if (user?.id) {
            const sub = UserService.subscribeToUserChanges(user.id, (updatedUser) => {
                if (updatedUser.themePreference) {
                    const parts = updatedUser.themePreference.split('-');
                    const potentialMode = parts[parts.length - 1];
                    if (potentialMode === 'light' || potentialMode === 'dark') {
                        setModeState(potentialMode as ThemeMode);
                        setThemeState(parts.slice(0, -1).join('-') as ThemeBrand);
                    }
                }
            });
            return () => sub.unsubscribe();
        }
    }, []);

    const updatePreferences = (newTheme: ThemeBrand, newMode: ThemeMode) => {
        setThemeState(newTheme);
        setModeState(newMode);
        localStorage.setItem('peutic_theme', newTheme);
        localStorage.setItem('peutic_mode', newMode);

        const user = UserService.getUser();
        if (user) {
            // Save as combined string "brand-mode"
            const prefString = `${newTheme}-${newMode}`;
            UserService.updateUser({ ...user, themePreference: prefString });
        }
    };

    const setTheme = (newTheme: ThemeBrand) => {
        updatePreferences(newTheme, mode);
    };

    const toggleMode = () => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        updatePreferences(theme, newMode);
    };

    // Apply to DOM
    useEffect(() => {
        // We need to access location here. Since ThemeProvider is inside Router in index.tsx, we can use window.location or we need to move useLocation up.
        // But simply using window.location.hash or pathname works if we trust it updates. 
        // Better: Assuming ThemeProvider is inside Router (which it is in index.tsx), we can try useLocation.
        // However, useTheme is exported, but ThemeProvider is a component.
        // Let's rely on the passed-in props or just standard DOM check, or better: 
        // We will stick to the props theme unless we specific logic. 
        // Actually, easiest way is to check window.location.pathname in the effect.

        const root = document.documentElement;
        root.className = '';

        // Apply Mode
        if (mode === 'dark') root.classList.add('dark');

        // FORCE STANDARD THEME ON LANDING PAGE
        const isLanding = window.location.pathname === '/' || window.location.hash === '#/';
        const activeTheme = isLanding ? 'sunshine' : theme;

        root.setAttribute('data-theme', activeTheme);
        root.classList.add(`theme-${activeTheme}`);

    }, [theme, mode]); // Note: This won't re-run on route change unless we listen to it. 
    // Ideally we'd use useLocation, let's verify if we can import it.

    return (
        <ThemeContext.Provider value={{ theme, mode, setTheme, setMode: setModeState, toggleMode }}>
            {children}
        </ThemeContext.Provider>
    );
};
