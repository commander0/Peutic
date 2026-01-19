import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { LanguageCode } from '../../services/i18n';

const LANGUAGES: { code: LanguageCode; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'zh', label: '中文' },
    { code: 'ar', label: 'العربية' }
];

interface LanguageSelectorProps {
    className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = "" }) => {
    const { lang, setLang } = useLanguage();
    const [showLangMenu, setShowLangMenu] = useState(false);
    const langMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
                setShowLangMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={langMenuRef}>
            <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-md border border-gray-200 dark:border-gray-800 hover:border-yellow-400 dark:hover:border-yellow-500 transition-all text-[10px] md:text-xs font-black uppercase tracking-wider shadow-sm group"
            >
                <Globe className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors" />
                <span className="text-gray-800 dark:text-gray-200 hidden md:inline">{lang}</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${showLangMenu ? 'rotate-180' : ''} hidden md:block`} />
            </button>
            {showLangMenu && (
                <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[100] animate-in fade-in zoom-in duration-200">
                    {LANGUAGES.map((l) => (
                        <button
                            key={l.code}
                            onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                            className={`w-full text-left px-4 py-3 text-xs font-bold hover:bg-yellow-50 dark:hover:bg-gray-800 transition-colors flex justify-between items-center ${lang === l.code ? 'text-yellow-600 dark:text-yellow-500 bg-yellow-50/50' : 'text-gray-700 dark:text-gray-300'}`}
                        >
                            {l.label}
                            {lang === l.code && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
