import React, { useState, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { LanguageCode } from '../../services/i18n';

interface LanguageSelectorProps {
    currentLanguage: LanguageCode;
    onLanguageChange: (lang: LanguageCode) => void;
    variant?: 'minimal' | 'full';
}

const LANGUAGES: { code: LanguageCode; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' }
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    currentLanguage,
    onLanguageChange,
    variant = 'minimal'
}) => {
    const [isOpen, setIsOpen] = useState(false);

    // Close when clicking outside
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = () => setIsOpen(false);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [isOpen]);

    if (variant === 'minimal') {
        return (
            <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 border border-white/20 dark:border-gray-700/50 transition-all text-sm font-bold backdrop-blur-md"
                >
                    <Globe className="w-3.5 h-3.5" />
                    <span className="uppercase">{currentLanguage}</span>
                </button>

                {isOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-2 space-y-1">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        onLanguageChange(lang.code);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${currentLanguage === lang.code
                                        ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-500'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-base">{lang.flag}</span>
                                        <span>{lang.label}</span>
                                    </div>
                                    {currentLanguage === lang.code && <Check className="w-3.5 h-3.5" />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => onLanguageChange(lang.code)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${currentLanguage === lang.code
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg scale-105'
                        : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-100 border border-gray-100 dark:border-gray-700'
                        }`}
                >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.label}
                </button>
            ))}
        </div>
    );
};
