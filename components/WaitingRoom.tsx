import React, { useEffect, useState } from 'react';
import { Clock, Users, Coffee } from 'lucide-react';

interface WaitingRoomProps {
    position: number;
    wait: number; // in minutes
    onMoodSelect?: (mood: string) => void;
}

const QUOTES = [
    "Patience is not simply the ability to wait - it's how we behave while we're waiting.",
    "Good things arrive to those who are present.",
    "Breathe. You are exactly where you need to be.",
    "The best view comes after the hardest climb.",
    "Your peace is being prepared."
];

const WaitingRoom: React.FC<WaitingRoomProps> = ({ position, wait, onMoodSelect }) => {
    const [quote, setQuote] = useState(QUOTES[0]);
    const [selectedMood, setSelectedMood] = useState<string | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleMood = (mood: string) => {
        setSelectedMood(mood);
        if (onMoodSelect) onMoodSelect(mood);
    };

    return (
        <div className="min-h-screen bg-[#FFFBEB] dark:bg-black text-black dark:text-white flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 animate-pulse"></div>
            <div className="absolute top-20 left-10 text-yellow-500/10 dark:text-yellow-500/5 animate-spin-slow">
                <Clock className="w-64 h-64" />
            </div>

            <div className="relative z-10 max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="bg-white dark:bg-gray-900 border border-yellow-200 dark:border-gray-800 p-8 rounded-3xl shadow-xl">
                    <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                        <Users className="w-8 h-8 text-yellow-600 dark:text-yellow-500 relative z-10" />
                        <div className="absolute inset-0 bg-yellow-400/20 rounded-full animate-ping"></div>
                    </div>

                    <h1 className="text-3xl font-black mb-2 tracking-tight">We are at capacity.</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">To ensure the highest quality of service for every member, we limit concurrent sessions. You are in line.</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Your Position</p>
                            <p className="text-3xl font-black text-black dark:text-white">#{position}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Est. Wait</p>
                            <p className="text-3xl font-black text-black dark:text-white flex items-center justify-center gap-1">
                                {wait}<span className="text-sm font-bold text-gray-400">m</span>
                            </p>
                        </div>
                    </div>

                    {/* MOOD CHECK-IN */}
                    {!selectedMood ? (
                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 p-4 rounded-2xl animate-in zoom-in duration-500">
                            <p className="text-xs font-bold uppercase text-blue-500 mb-3 tracking-widest">Help us prepare for you</p>
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">How are you feeling right now?</p>
                            <div className="flex justify-center gap-3">
                                {['😔', '😐', '🙂', '😤', '😰'].map((emoji, idx) => {
                                    const labels = ['Sad', 'Okay', 'Good', 'Angry', 'Anxious'];
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleMood(labels[idx])}
                                            className="text-2xl hover:scale-125 transition-transform p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:shadow-md border border-transparent hover:border-blue-200"
                                            title={labels[idx]}
                                        >
                                            {emoji}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 p-4 rounded-2xl animate-in fade-in">
                            <p className="text-green-600 dark:text-green-400 text-sm font-bold flex items-center justify-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Shared. Your specialist will know.
                            </p>
                        </div>
                    )}

                    <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-6">
                        <div className="h-full bg-yellow-400 animate-progress-indeterminate"></div>
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="italic text-gray-600 dark:text-gray-400 font-medium">"{quote}"</p>
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <Coffee className="w-4 h-4" />
                        <span>Reserving your spot...</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaitingRoom;
