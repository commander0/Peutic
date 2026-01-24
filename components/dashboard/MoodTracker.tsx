import React from 'react';
import { Sun, StopCircle, CloudRain } from 'lucide-react';

export const MoodTracker: React.FC<{ onMoodSelect: (m: 'confetti' | 'rain' | null) => void }> = ({ onMoodSelect }) => {
    return (
        <div className="bg-transparent p-5 rounded-3xl border border-transparent shadow-none flex flex-col justify-between">
            <div>
                <h3 className="font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest mb-1">Current Vibe</h3>
                <p className="text-gray-900 dark:text-white font-bold text-base mb-3">How does the world feel?</p>
            </div>
            <div className="flex gap-2">
                <button onClick={() => onMoodSelect('confetti')} className="flex-1 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-colors flex flex-col items-center justify-center gap-1 group" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                    <Sun className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                    <span className="md:hidden lg:inline">Celebration</span>
                </button>
                <button onClick={() => onMoodSelect(null)} className="py-2.5 px-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors flex items-center justify-center group" title="Reset">
                    <StopCircle className="w-4 h-4 text-gray-500 group-hover:text-black dark:group-hover:text-white" />
                </button>
                <button onClick={() => onMoodSelect('rain')} className="flex-1 py-2.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-xs md:text-sm transition-colors flex flex-col items-center justify-center gap-1 group">
                    <CloudRain className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="md:hidden lg:inline">Melancholy</span>
                </button>
            </div>
        </div>
    );
};
