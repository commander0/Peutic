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
                    className="p-2 mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center"
                    title="Change Language"
                >
                    <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>

                {isOpen && (
                    <div className="absolute left-0 md:right-0 md:left-auto mt-2 w-48 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xl z-[100] overflow-hidden animate-in slide-in-from-top-2 fade-in duration-300 ease-out">
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
