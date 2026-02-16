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

export const VALID_THEMES: ThemeBrand[] = ['sunshine', 'rose', 'ocean', 'forest', 'sunset', 'lavender', 'cyberpunk', 'midnight', 'coffee', 'royal'];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<ThemeBrand>('sunshine');
    const [mode, setModeState] = useState<ThemeMode>('light');

    // Helper: Validate and Sanitize
    const validateTheme = (input: string): ThemeBrand => {
        if (VALID_THEMES.includes(input as ThemeBrand)) return input as ThemeBrand;
        // Legacy/Fallback Mapping
        if (input === 'gold' || input === 'amber' || input === 'default') return 'sunshine';
        // Check if it's a known "ghost" theme and map if possible, otherwise default
        console.warn(`ThemeContext: Invalid theme '${input}' detected. Fallback to 'sunshine'.`);
        return 'sunshine';
    };

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
                // Validate the brand part
                const rawBrand = parts.slice(0, -1).join('-');
                loadedTheme = validateTheme(rawBrand);
            } else {
                // Fallback for legacy values
                if (user.themePreference === 'dark') { loadedMode = 'dark'; loadedTheme = 'sunshine'; }
                else if (user.themePreference === 'light') { loadedMode = 'light'; loadedTheme = 'sunshine'; }
                else {
                    loadedTheme = validateTheme(user.themePreference);
                }
            }

            // SELF-HEALING: If DB had invalid data, update it now to prevent future issues
            if (loadedTheme !== user.themePreference.split('-')[0]) {
                console.log("ThemeContext: Self-healing invalid DB theme...");
                setTimeout(() => updatePreferences(loadedTheme, loadedMode), 1000);
            }

        } else {
            const savedTheme = localStorage.getItem('peutic_theme');
            const savedMode = localStorage.getItem('peutic_mode') as ThemeMode;

            if (savedTheme) loadedTheme = validateTheme(savedTheme);
            if (savedMode) loadedMode = savedMode;
        }

        // Apply immediately
        setThemeState(loadedTheme);
        setModeState(loadedMode);

        // REALTIME: Subscribe to User Changes for Multi-Device/Tab Sync
        if (user?.id) {
            const sub = UserService.subscribeToUserChanges(user.id, (updatedUser) => {
                if (updatedUser.themePreference) {
                    const parts = updatedUser.themePreference.split('-');
                    const potentialMode = parts[parts.length - 1];
                    if (potentialMode === 'light' || potentialMode === 'dark') {
                        setModeState(potentialMode as ThemeMode);
                        const validated = validateTheme(parts.slice(0, -1).join('-'));
                        setThemeState(validated);
                    }
                }
            });
            return () => sub.unsubscribe();
        }
    }, []);

    const updatePreferences = (newTheme: ThemeBrand, newMode: ThemeMode) => {
        const validatedTheme = validateTheme(newTheme);
        setThemeState(validatedTheme);
        setModeState(newMode);
        localStorage.setItem('peutic_theme', validatedTheme);
        localStorage.setItem('peutic_mode', newMode);

        const user = UserService.getUser();
        if (user) {
            // Save as combined string "brand-mode"
            const prefString = `${validatedTheme}-${newMode}`;
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

    // Apply to DOM (Tailwind)
    useEffect(() => {
        const root = document.documentElement;

        // Remove all previous theme classes
        VALID_THEMES.forEach(t => root.classList.remove(`theme-${t}`));
        root.classList.remove('dark');

        // Apply Mode
        if (mode === 'dark') root.classList.add('dark');

        // FORCE STANDARD THEME ON LANDING PAGE
        const isLanding = window.location.pathname === '/' || window.location.hash === '#/';
        const activeTheme = isLanding ? 'sunshine' : (VALID_THEMES.includes(theme) ? theme : 'sunshine');

        root.setAttribute('data-theme', activeTheme);
        root.classList.add(`theme-${activeTheme}`);

        // Debug
        // console.log(`Theme Applied: ${activeTheme} (${mode})`);
    }, [theme, mode]);

    return (
        <ThemeContext.Provider value={{ theme, mode, setTheme, setMode: setModeState, toggleMode }}>
            {children}
        </ThemeContext.Provider>
    );
};
