import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserService } from '../services/userService';

type Theme = 'amber' | 'cyberpunk' | 'forest' | 'midnight' | 'rose';
type Mode = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    mode: Mode;
    setTheme: (theme: Theme) => void;
    setMode: (mode: Mode) => void;
    toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'amber',
    mode: 'light',
    setTheme: () => { },
    setMode: () => { },
    toggleMode: () => { }
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>('amber');
    const [mode, setModeState] = useState<Mode>('light');

    // Load from User/Storage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('peutic_theme') as Theme;
        const savedMode = localStorage.getItem('peutic_mode') as Mode;

        if (savedTheme) setThemeState(savedTheme);
        if (savedMode) setModeState(savedMode);
        else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setModeState('dark');

        const user = UserService.getUser();
        if (user?.themePreference) {
            const pref = user.themePreference as any;
            // Backward compatibility: if themePreference is 'light' or 'dark', set mode
            if (pref === 'light' || pref === 'dark') {
                setModeState(pref as Mode);
            } else {
                setThemeState(pref as Theme);
            }
        }
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('peutic_theme', newTheme);
        syncWithProfile(newTheme, mode);
    };

    const setMode = (newMode: Mode) => {
        setModeState(newMode);
        localStorage.setItem('peutic_mode', newMode);
        syncWithProfile(theme, newMode);
    };

    const toggleMode = () => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        setMode(newMode);
    };

    const syncWithProfile = (t: Theme, _m: Mode) => {
        const user = UserService.getUser();
        if (user) {
            UserService.updateUser({ ...user, themePreference: t });
        }
    };

    // Apply to DOM
    useEffect(() => {
        const root = document.documentElement;
        // Remove old classes
        root.classList.remove('light', 'dark');
        const themeClasses = ['theme-amber', 'theme-cyberpunk', 'theme-forest', 'theme-midnight', 'theme-rose'];
        root.classList.remove(...themeClasses);

        // Apply new
        root.classList.add(mode);
        root.classList.add(`theme-${theme}`);
    }, [theme, mode]);

    return (
        <ThemeContext.Provider value={{ theme, mode, setTheme, setMode, toggleMode }}>
            {children}
        </ThemeContext.Provider>
    );
};
