import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserService } from '../services/userService';

export type ThemeBrand = 'default' | 'rose' | 'ocean' | 'forest' | 'sunset' | 'lavender' | 'cyberpunk' | 'midnight' | 'coffee' | 'royal' | 'amber';
export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    theme: ThemeBrand;
    mode: ThemeMode;
    setTheme: (theme: ThemeBrand) => void;
    toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'default',
    mode: 'light',
    setTheme: () => { },
    toggleMode: () => { }
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<ThemeBrand>('amber');
    const [mode, setModeState] = useState<ThemeMode>('light');

    // Load from User/Storage on mount
    useEffect(() => {
        const user = UserService.getUser();
        let loadedTheme: ThemeBrand = 'amber';
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
                if (user.themePreference === 'dark') { loadedMode = 'dark'; loadedTheme = 'amber'; }
                else if (user.themePreference === 'light') { loadedMode = 'light'; loadedTheme = 'amber'; }
                else { loadedTheme = user.themePreference as ThemeBrand; }
            }
        } else {
            const savedTheme = localStorage.getItem('peutic_theme') as ThemeBrand;
            const savedMode = localStorage.getItem('peutic_mode') as ThemeMode;
            if (savedTheme) loadedTheme = savedTheme;
            if (savedMode) loadedMode = savedMode;
        }

        // Default to AMBER if not specified (User Request)
        setThemeState(loadedTheme || 'amber');
        setModeState(loadedMode || 'light');
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
        const root = document.documentElement;
        // Clean existing classes
        root.className = ''; // wipe all

        // Apply Mode
        if (mode === 'dark') root.classList.add('dark');

        // Apply Theme
        // We use data-theme attribute for cleaner CSS selectors
        root.setAttribute('data-theme', theme);

        // Also add class for backward compatibility if needed, but attribute is better for 10 themes
        root.classList.add(`theme-${theme}`);

    }, [theme, mode]);

    return (
        <ThemeContext.Provider value={{ theme, mode, setTheme, toggleMode }}>
            {children}
        </ThemeContext.Provider>
    );
};
