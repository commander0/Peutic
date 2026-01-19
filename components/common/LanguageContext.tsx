import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LanguageCode, getTranslation } from '../../services/i18n';

interface LanguageContextType {
    lang: LanguageCode;
    setLang: (lang: LanguageCode) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [lang, setLangState] = useState<LanguageCode>(() => {
        const saved = localStorage.getItem('peutic_lang');
        return (saved as LanguageCode) || 'en';
    });

    const setLang = (newLang: LanguageCode) => {
        setLangState(newLang);
        localStorage.setItem('peutic_lang', newLang);
    };

    const t = (key: string) => getTranslation(lang, key as any);

    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }, [lang]);

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
