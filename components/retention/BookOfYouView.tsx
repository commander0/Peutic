import React, { useEffect, useState } from 'react';
import { UserService } from '../../services/userService';
import { User, JournalEntry, MoodEntry, ArtEntry, GardenState } from '../../types';
import { BookOpen, Lock, Sun, CloudRain, ChevronLeft, Download } from 'lucide-react';

interface BookOfYouViewProps {
    user: User;
    garden: GardenState | null;
    onClose: () => void;
}

// RESTORED: "The First Iteration" - Atmospheric, Chapter-based, Yellow Paper Design
const BookOfYouView: React.FC<BookOfYouViewProps> = ({ user, onClose }) => {
    const [journals, setJournals] = useState<JournalEntry[]>([]);
    const [moods, setMoods] = useState<MoodEntry[]>([]);
    const [arts, setArts] = useState<ArtEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(true);
    const [moodRatio, setMoodRatio] = useState({ sun: 0, rain: 0 }); // Percentages

    useEffect(() => {
        const loadData = async () => {
            if (user) {
                // WEEKLY RESET LOGIC
                // 1. Calculate Current Cycle
                const joinDate = new Date(user.joinedAt).getTime();
                const now = Date.now();
                const msPerWeek = 7 * 24 * 60 * 60 * 1000;

                // Determine which week "volume" we are in
                const weeksSinceJoin = Math.floor((now - joinDate) / msPerWeek);

                // Start of the CURRENT 7-day cycle
                const currentWeekStart = joinDate + (weeksSinceJoin * msPerWeek);
                const nextWeekStart = currentWeekStart + msPerWeek;

                // Unlock logic: Always unlocked for user satisfaction, but content resets weekly.
                setIsLocked(false);

                const [j, m, a] = await Promise.all([
                    UserService.getJournals(user.id),
                    UserService.getMoods(user.id),
                    UserService.getUserArt(user.id)
                ]);

                // 2. Filter Data for Current Week Cycle
                const weeklyJournals = j.filter(item => {
                    const d = new Date(item.date).getTime();
                    return d >= currentWeekStart && d < nextWeekStart;
                });

                const weeklyMoods = m.filter(item => {
                    const d = new Date(item.date).getTime();
                    return d >= currentWeekStart && d < nextWeekStart;
                });

                const weeklyArts = a.filter(item => {
                    const d = new Date(item.createdAt).getTime();
                    return d >= currentWeekStart && d < nextWeekStart;
                });

                setJournals(weeklyJournals);
                setMoods(weeklyMoods);
                setArts(weeklyArts);

                // Calculate Mood Ratio for this week
                const total = weeklyMoods.length;
                if (total > 0) {
                    const sunCount = weeklyMoods.filter(x => x.mood && ['Happy', 'Calm', 'confetti', 'sun'].includes(x.mood)).length;
                    const sunPct = (sunCount / total) * 100;
                    setMoodRatio({ sun: sunPct, rain: 100 - sunPct });
                } else {
                    setMoodRatio({ sun: 50, rain: 50 }); // Default balanced
                }
            }
            setLoading(false);
        };
        loadData();
    }, [user]);

    if (loading) return (
        <div className="fixed inset-0 z-[120] bg-black flex items-center justify-center font-serif text-white/50 animate-pulse">
            Consulting the archives...
        </div>
    );

    // LOCKED STATE
    if (isLocked) {
        return (
            <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-amber-50/95 dark:bg-stone-900/95 backdrop-blur-md p-8 text-center animate-in fade-in duration-500">
                <button onClick={onClose} className="absolute top-8 left-8 text-amber-900/40 dark:text-stone-400 hover:text-amber-900 dark:hover:text-stone-200 flex items-center gap-2 transition-colors font-serif">
                    <ChevronLeft className="w-5 h-5" /> Return
                </button>
                <div className="bg-[#fdfaf6] dark:bg-[#2a2826] border border-amber-900/10 dark:border-stone-700 p-12 rounded-sm shadow-2xl max-w-md relative overflow-hidden before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] before:opacity-50 before:pointer-events-none">
                    <div className="bg-amber-100/50 dark:bg-stone-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 border border-amber-900/5 dark:border-stone-700">
                        <Lock className="w-8 h-8 text-amber-900/40 dark:text-stone-400" />
                    </div>
                    <h2 className="text-2xl font-serif text-amber-900 dark:text-stone-200 mb-4 relative z-10">The Ink is Still Drying</h2>
                    <p className="text-amber-900/60 dark:text-stone-400 mb-8 relative z-10 font-serif leading-relaxed">Your story is just beginning. The Chronicle requires at least one week of history to weave your narrative.</p>
                    <div className="text-xs font-serif italic text-amber-900/50 dark:text-stone-500 relative z-10">Unlocked after {user ? new Date(new Date(user.joinedAt).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() : '7 Days'}</div>
                </div>
            </div>
        );
    }

    // Determine Dominant Weather
    const isSunny = moodRatio.sun >= moodRatio.rain;

    return (
        <div className="fixed inset-0 z-[120] bg-[#f4f1ea] dark:bg-[#1a1918] text-amber-950 dark:text-stone-200 overflow-y-auto animate-in fade-in duration-1000 font-serif custom-scrollbar relative">

            {/* PAPER TEXTURE OVERLAY */}
            <div className="fixed inset-0 pointer-events-none z-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-[0.8] dark:opacity-30 dark:bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] mix-blend-multiply dark:mix-blend-color-burn"></div>

            {/* FLOATING ACTION BAR */}
            <div className="fixed top-0 inset-x-0 h-24 bg-gradient-to-b from-[#f4f1ea]/90 dark:from-[#1a1918]/90 to-transparent pointer-events-none z-50"></div>

            <button
                onClick={onClose}
                className="fixed top-6 left-6 md:top-8 md:left-8 bg-[#fdfaf6] dark:bg-[#2a2826] border border-amber-900/10 dark:border-stone-700 hover:bg-amber-50 dark:hover:bg-stone-800 text-amber-900/70 dark:text-stone-400 hover:text-amber-900 dark:hover:text-stone-200 py-2.5 px-5 rounded-sm flex items-center gap-3 transition-all shadow-sm z-[60] group"
            >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold text-xs uppercase tracking-widest font-sans">Close Book</span>
            </button>

            <button
                onClick={() => window.print()}
                className="fixed top-6 right-6 md:top-8 md:right-8 bg-[#fdfaf6] dark:bg-[#2a2826] border border-amber-900/10 dark:border-stone-700 hover:bg-amber-50 dark:hover:bg-stone-800 text-amber-900/70 dark:text-stone-400 hover:text-amber-900 dark:hover:text-stone-200 w-11 h-11 rounded-sm flex items-center justify-center transition-all shadow-sm z-[60] group print:hidden"
                title="Print Pages"
            >
                <Download className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
            </button>


            <div className="max-w-5xl mx-auto pt-32 pb-24 px-4 sm:px-8 relative z-10">

                {/* HERO COVER: Book Title Page */}
                <div className="text-center mb-32 mt-12 relative">
                    <div className="inline-flex justify-center items-center w-20 h-20 rounded-full border border-amber-900/20 dark:border-stone-600 mb-8 relative group">
                        <BookOpen className="w-8 h-8 text-amber-900/40 dark:text-stone-400 group-hover:text-amber-900" />
                    </div>
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-900/20 dark:via-stone-700 to-transparent mb-12"></div>
                    <h1 className="text-5xl md:text-7xl font-light text-amber-950 dark:text-stone-100 mb-6 tracking-normal">The Book of You</h1>
                    <p className="text-xl text-amber-900/60 dark:text-stone-400 font-medium italic">A chronicle of {user.name}'s journey.</p>
                    <div className="mt-16 flex justify-center gap-8 text-[10px] font-sans font-black uppercase tracking-[0.3em] text-amber-900/40 dark:text-stone-500">
                        <span>Volume I</span>
                        <span>&bull;</span>
                        <span>{new Date().getFullYear()}</span>
                    </div>
                </div>

                {/* CHAPTER 1: REFLECTIONS */}
                <div className="mb-24 relative break-after-page">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-light tracking-wide text-amber-950 dark:text-stone-200 mb-4 inline-block border-b border-amber-900/20 dark:border-stone-700 pb-2">Chapter I: Reflections</h2>
                    </div>

                    {journals.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-amber-900/40 dark:text-stone-500 italic text-lg">The pages are blank, waiting for your thoughts.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                            {journals.map((j) => (
                                <div key={j.id} className="group relative">
                                    <h3 className="text-sm font-sans font-bold text-amber-900/60 dark:text-stone-400 mb-3 uppercase tracking-widest">{new Date(j.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                                    <div className="pl-6 border-l-2 border-amber-900/10 dark:border-stone-700/50">
                                        <p className="text-amber-950/80 dark:text-stone-300 leading-loose whitespace-pre-wrap text-lg first-letter:text-5xl first-letter:font-bold first-letter:-ml-8 first-letter:mr-2 first-letter:float-left first-letter:text-amber-900/30 dark:first-letter:text-stone-600">{j.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* CHAPTER 2: EMOTIONAL CLIMATE */}
                <div className="mb-24 relative break-after-page">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-light tracking-wide text-amber-950 dark:text-stone-200 mb-4 inline-block border-b border-amber-900/20 dark:border-stone-700 pb-2">Chapter II: Emotional Climate</h2>
                    </div>

                    {/* VISUAL RATIO SCALE - PAPER */}
                    <div className="p-8 md:p-12 mb-16 flex flex-col items-center border-b border-t border-amber-900/10 dark:border-stone-700/50 relative">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-30 mix-blend-multiply pointer-events-none"></div>

                        <h3 className="font-serif italic text-amber-900/50 dark:text-stone-500 mb-8 relative z-10 text-lg">Dominant Weather Pattern</h3>

                        <div className="w-full max-w-xl h-4 bg-amber-900/5 dark:bg-stone-800 rounded-sm flex relative shadow-inner z-10 overflow-hidden border border-amber-900/10 dark:border-stone-700">
                            <div className="h-full transition-all duration-1000 bg-amber-500 dark:bg-amber-600" style={{ width: `${Math.max(2, moodRatio.sun)}%` }}></div>
                            <div className="h-full transition-all duration-1000 bg-slate-400 dark:bg-slate-600 blur-[1px]" style={{ width: `${Math.max(2, moodRatio.rain)}%` }}></div>
                        </div>

                        <div className="flex justify-between w-full max-w-xl mt-4 font-serif text-sm z-10">
                            <div className={`flex items-center gap-2 ${isSunny ? 'text-amber-700 dark:text-amber-500 font-bold' : 'text-amber-900/40 dark:text-stone-500'} transition-all`}>
                                <Sun className="w-4 h-4" /> Sunny ({Math.round(moodRatio.sun)}%)
                            </div>
                            <div className={`flex items-center gap-2 ${!isSunny ? 'text-slate-600 dark:text-slate-400 font-bold' : 'text-amber-900/40 dark:text-stone-500'} transition-all`}>
                                Rainy ({Math.round(moodRatio.rain)}%) <CloudRain className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 md:grid-cols-8 gap-4 px-4">
                        {moods.slice(0, 8).map((m, i) => {
                            const isPositive = (m.mood as any) === 'confetti' || (m.mood as any) === 'Happy' || (m.mood as any) === 'Calm' || (m.mood as any) === 'sun';
                            const isNegative = (m.mood as any) === 'rain' || (m.mood as any) === 'Anxious' || (m.mood as any) === 'Sad';
                            let emoji = '😐';

                            if (isPositive) {
                                emoji = ['confetti', 'Happy'].includes(String(m.mood)) ? '🎉' : '☀️';
                            } else if (isNegative) {
                                emoji = ['rain', 'Sad'].includes(String(m.mood)) ? '🌧️' : '😰';
                            }

                            return (
                                <div key={i} className={`aspect-square p-2 bg-amber-900/5 dark:bg-stone-800/50 rounded-sm border border-amber-900/10 dark:border-stone-700 flex flex-col items-center justify-center relative group`}>
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-10 mix-blend-multiply pointer-events-none"></div>
                                    <span className="text-3xl md:text-4xl block mb-2 filter sepia-[0.3] group-hover:sepia-0 transition-all">{emoji}</span>
                                    <div className="text-[9px] font-sans font-bold uppercase text-amber-900/50 dark:text-stone-500 tracking-widest">{new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* CHAPTER 3: VISIONS (ART) */}
                <div className="mb-16 relative">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-light tracking-wide text-amber-950 dark:text-stone-200 mb-4 inline-block border-b border-amber-900/20 dark:border-stone-700 pb-2">Chapter III: Visions</h2>
                    </div>

                    {arts.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-amber-900/40 dark:text-stone-500 italic text-lg">The canvas awaits your dreams.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                            {arts.map(a => (
                                <div key={a.id} className="group flex flex-col relative">
                                    <div className="bg-[#fcfaf7] dark:bg-[#201e1c] p-3 shadow-md border border-amber-900/10 dark:border-stone-700 mb-4 relative rotate-1 hover:rotate-0 transition-transform duration-500">
                                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-400/20 rounded-full blur-[1px]"></div>
                                        <div className="aspect-square overflow-hidden bg-amber-900/5 dark:bg-black/50 filter sepia-[0.2] dark:sepia-[0.3]">
                                            <img src={a.imageUrl} alt={a.prompt} className="w-full h-full object-cover transition-transform duration-1000 ease-out" />
                                        </div>
                                    </div>
                                    <div className="px-4 text-center">
                                        <p className="font-serif italic text-lg text-amber-950/80 dark:text-stone-300 leading-relaxed mb-3">"{a.prompt}"</p>
                                        <p className="text-[10px] font-sans font-bold text-amber-900/40 dark:text-stone-500 uppercase tracking-widest">{new Date(a.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                {/* FOOTER */}
                <div className="mt-40 pt-16 border-t border-amber-900/10 dark:border-stone-700/50 text-center relative z-10 pb-8">
                    <div className="w-10 h-10 border border-amber-900/20 dark:border-stone-600 bg-transparent mx-auto mb-6 flex items-center justify-center rounded-sm rotate-45">
                        <div className="-rotate-45"><BookOpen className="w-4 h-4 text-amber-900/40 dark:text-stone-500" /></div>
                    </div>
                    <p className="font-serif italic text-amber-900/50 dark:text-stone-500 text-sm">Chronicle complete.</p>
                </div>
            </div>
        </div>
    );
};

export default BookOfYouView;
