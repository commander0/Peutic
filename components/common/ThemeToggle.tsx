import React from 'react';
import { useTheme, VALID_THEMES, ThemeBrand } from '../../contexts/ThemeContext';
import { Palette, Sun, Moon, Check } from 'lucide-react';

export const ThemeToggle = () => {
    const { theme, mode, setTheme, toggleMode } = useTheme();
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Close on click outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const themeColors: Record<ThemeBrand, string> = {
        sunshine: 'bg-yellow-400',
        rose: 'bg-rose-400',
        ocean: 'bg-sky-400',
        forest: 'bg-emerald-500',
        sunset: 'bg-orange-500',
        lavender: 'bg-violet-400',
        cyberpunk: 'bg-cyan-400',
        midnight: 'bg-indigo-500',
        coffee: 'bg-amber-800',
        royal: 'bg-purple-600',
        default: 'bg-gray-400'
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full text-text-base/70 hover:bg-primary/10 hover:text-primary transition-all relative overflow-hidden group"
                aria-label="Change Theme"
            >
                <Palette className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-base/90 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-primary/10">
                        <span className="text-xs font-black uppercase text-text-base/60 tracking-widest">Appearance</span>
                        <button
                            onClick={toggleMode}
                            className="p-1.5 rounded-lg bg-base hover:bg-primary/10 text-primary transition-colors"
                        >
                            {mode === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {VALID_THEMES.map((t) => (
                            <button
                                key={t}
                                onClick={() => { setTheme(t); setIsOpen(false); }}
                                className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold transition-all border
                                    ${theme === t
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-transparent border-transparent hover:bg-base/50 text-text-base/70'
                                    }`}
                            >
                                <span className={`w-3 h-3 rounded-full ${themeColors[t]}`}></span>
                                <span className="capitalize">{t}</span>
                                {theme === t && <Check className="w-3 h-3 ml-auto" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
