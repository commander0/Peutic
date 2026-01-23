import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserService } from '../services/userService';

type Theme = 'light' | 'dark' | 'cyberpunk' | 'forest' | 'midnight';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'light', setTheme: () => { } });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>('light');

    // Load from User/Storage on mount
    useEffect(() => {
        const user = UserService.getUser();
        if (user?.themePreference) {
            setThemeState(user.themePreference as Theme);
        } else {
            const saved = localStorage.getItem('peutic_theme') as Theme;
            if (saved) setThemeState(saved);
            else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setThemeState('dark');
        }
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('peutic_theme', newTheme);

        // Sync with User Profile if logged in
        const user = UserService.getUser();
        if (user) {
            UserService.updateUser({ ...user, themePreference: newTheme });
        }
    };

    // Apply to DOM robustly
    useEffect(() => {
        const root = document.documentElement;
        // 1. Clear all possible theme classes
        root.classList.remove('light', 'dark', 'theme-cyberpunk', 'theme-forest', 'theme-midnight');

        // 2. Apply new theme classes
        if (theme === 'light') {
            root.classList.add('light');
        } else if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            // Premium themes: Apply 'dark' for base styling AND the specific theme class
            root.classList.add('dark');
            root.classList.add(`theme-${theme}`);
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};