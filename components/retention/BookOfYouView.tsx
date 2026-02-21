import React, { useEffect, useState } from 'react';
import { UserService } from '../../services/userService';
import { User, JournalEntry, MoodEntry, GardenState } from '../../types';
import { BookOpen, Lock, Sun, CloudRain, ChevronLeft, Download, Sparkles } from 'lucide-react';
import { generateBookOfYouSummary } from '../../services/geminiService';

interface BookOfYouViewProps {
    user: User;
    garden: GardenState | null;
    onClose: () => void;
}

// RESTORED: "The First Iteration" - Atmospheric, Chapter-based, Yellow Paper Design
const BookOfYouView: React.FC<BookOfYouViewProps> = ({ user, onClose }) => {
    const [journals, setJournals] = useState<JournalEntry[]>([]);
    const [moods, setMoods] = useState<MoodEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(true);
    const [moodRatio, setMoodRatio] = useState({ sun: 0, rain: 0 }); // Percentages
    const [currentVolume, setCurrentVolume] = useState(0); // 0 is the oldest week, maxVolume is the current week
    const [maxVolume, setMaxVolume] = useState(0);
    const [narrative, setNarrative] = useState<string | null>(null);
    const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);

    // Store ALL data locally to avoid re-fetching when paginating
    const [allJournals, setAllJournals] = useState<JournalEntry[]>([]);
    const [allMoods, setAllMoods] = useState<MoodEntry[]>([]);

    const [dataLoaded, setDataLoaded] = useState(false);

    // 1. Fetch data only once
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user) return;
            const [fetchedJ, fetchedM] = await Promise.all([
                UserService.getJournals(user.id),
                UserService.getMoods(user.id)
            ]);

            setAllJournals(fetchedJ);
            setAllMoods(fetchedM);

            // Determine oldest date for Volume 0
            let oldestDate = new Date(user.joinedAt).getTime();
            if (fetchedJ.length > 0 || fetchedM.length > 0) {
                const oldestJ = fetchedJ.length > 0 ? Math.min(...fetchedJ.map(entry => new Date(entry.date).getTime())) : Infinity;
                const oldestM = fetchedM.length > 0 ? Math.min(...fetchedM.map(entry => new Date(entry.date).getTime())) : Infinity;
                const oldestDataDate = Math.min(oldestJ, oldestM);
                if (oldestDataDate < oldestDate) oldestDate = oldestDataDate;
            }

            const now = Date.now();
            const msPerWeek = 7 * 24 * 60 * 60 * 1000;
            const weeksSinceJoin = Math.floor((now - oldestDate) / msPerWeek);

            setMaxVolume(weeksSinceJoin);
            setCurrentVolume(weeksSinceJoin); // start at latest
            setIsLocked(false);
            setDataLoaded(true);
        };
        fetchInitialData();
    }, [user]);

    // 2. Filter data and generate narrative whenever currentVolume changes
    useEffect(() => {
        if (!dataLoaded || !user) return;

        setLoading(true);

        const msPerWeek = 7 * 24 * 60 * 60 * 1000;

        let oldestDate = new Date(user.joinedAt).getTime();
        if (allJournals.length > 0 || allMoods.length > 0) {
            const oldestJ = allJournals.length > 0 ? Math.min(...allJournals.map(entry => new Date(entry.date).getTime())) : Infinity;
            const oldestM = allMoods.length > 0 ? Math.min(...allMoods.map(entry => new Date(entry.date).getTime())) : Infinity;
            const oldestDataDate = Math.min(oldestJ, oldestM);
            if (oldestDataDate < oldestDate) oldestDate = oldestDataDate;
        }

        const volumeWeekStart = oldestDate + (currentVolume * msPerWeek);
        const volumeWeekEnd = volumeWeekStart + msPerWeek;

        const weeklyJournals = allJournals.filter(item => {
            const d = new Date(item.date).getTime();
            return d >= volumeWeekStart && d < volumeWeekEnd;
        });

        const weeklyMoods = allMoods.filter(item => {
            const d = new Date(item.date).getTime();
            return d >= volumeWeekStart && d < volumeWeekEnd;
        });

        setJournals(weeklyJournals);
        setMoods(weeklyMoods);

        const total = weeklyMoods.length;
        if (total > 0) {
            const sunCount = weeklyMoods.filter(x => x.mood && ['Happy', 'Calm', 'confetti', 'sun'].includes(x.mood)).length;
            const sunPct = (sunCount / total) * 100;
            setMoodRatio({ sun: sunPct, rain: 100 - sunPct });
        } else {
            setMoodRatio({ sun: 50, rain: 50 });
        }

        const generateNarrative = async () => {
            if (weeklyJournals.length > 0 || weeklyMoods.length > 0) {
                setNarrative(null);
                setIsGeneratingNarrative(true);
                try {
                    const contextData = JSON.stringify({
                        volumeSequence: currentVolume + 1,
                        entropyToken: Math.random().toString(36).substring(7),
                        journals: weeklyJournals.map(j => j.content),
                        moods: weeklyMoods.map(m => m.mood)
                    });
                    const text = await generateBookOfYouSummary(user.name, contextData, user.id);
                    setNarrative(text);
                } catch (e) {
                    console.error("Narrative Gen Error:", e);
                    setNarrative("The ink refuses to dry today. Your reflections are safely stored, but synthesis is currently resting.");
                } finally {
                    setIsGeneratingNarrative(false);
                }
            } else {
                setNarrative("This chapter is beautifully blank. The pages wait patiently for your reflections, when you are ready to write them.");
            }
            setLoading(false);
        };

        generateNarrative();

    }, [currentVolume, dataLoaded, allJournals, allMoods, user]);

    // handleGenerateNarrative function removed as it's now auto-generated above

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
        <div className="fixed inset-0 z-[120] bg-zinc-900 dark:bg-black text-amber-950 dark:text-stone-200 overflow-y-auto overflow-x-hidden flex items-center justify-center animate-in zoom-in-95 duration-1000 p-2 md:p-8 lg:p-12 font-serif bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] dark:bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] bg-blend-multiply">

            {/* FLOATING ACTION BAR */}
            <button
                onClick={onClose}
                className="fixed top-4 left-4 md:top-8 md:left-8 bg-zinc-800/80 backdrop-blur border border-white/10 hover:bg-zinc-700 text-zinc-300 py-2 md:py-2.5 px-4 md:px-5 rounded-md flex items-center gap-2 md:gap-3 transition-all shadow-xl z-[130] group"
            >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold text-[10px] md:text-xs uppercase tracking-widest font-sans">Close Book</span>
            </button>

            <button
                onClick={() => window.print()}
                className="fixed top-4 right-4 md:top-8 md:right-8 bg-zinc-800/80 backdrop-blur border border-white/10 hover:bg-zinc-700 text-zinc-300 w-9 h-9 md:w-11 md:h-11 rounded-md flex items-center justify-center transition-all shadow-xl z-[130] group print:hidden"
                title="Print Pages"
            >
                <Download className="w-3 h-3 md:w-4 md:h-4 group-hover:-translate-y-1 transition-transform" />
            </button>

            {/* THE PHYSICAL BOOK MOCKUP */}
            <div className="relative w-full max-w-6xl aspect-auto md:aspect-[16/10] min-h-[85vh] md:min-h-0 bg-[#fdfaf6] dark:bg-[#1a1817] shadow-[0_20px_40px_rgba(0,0,0,0.8),_0_0_0_1px_rgba(0,0,0,0.5)] dark:shadow-[0_20px_40px_rgba(0,0,0,1),_0_0_0_1px_rgba(255,255,255,0.05)] rounded-sm flex flex-col md:flex-row print:flex-col print:h-auto print:min-h-0 print:gap-8 print:shadow-none after:absolute after:inset-0 after:bg-[url('https://www.transparenttextures.com/patterns/paper.png')] after:opacity-[0.6] dark:after:opacity-[0.15] dark:after:bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] after:mix-blend-multiply dark:after:mix-blend-color-dodge after:pointer-events-none transition-colors duration-500">

                {/* PAGE EDGES (Thickness Mockup) */}
                <div className="absolute -bottom-1 -right-1 w-full h-full border-r-4 border-b-4 border-amber-900/10 dark:border-stone-400/5 rounded-br-md pointer-events-none hidden md:block"></div>
                <div className="absolute -bottom-2 -right-2 w-full h-full border-r-2 border-b-2 border-amber-900/5 dark:border-stone-400/5 rounded-br-lg pointer-events-none hidden md:block"></div>

                {/* LEFT PAGE */}
                <div className="w-full md:w-1/2 h-full flex flex-col p-6 md:p-12 lg:p-20 relative overflow-y-auto custom-scrollbar overflow-x-hidden border-b-2 md:border-b-0 border-amber-900/10 dark:border-stone-800">
                    {/* Page Numbers */}
                    <div className="hidden md:block absolute top-6 left-6 lg:top-8 lg:left-8 text-amber-900/30 font-sans text-[10px] tracking-widest font-bold">1</div>

                    {/* HERO COVER: Book Title Page */}
                    <div className="text-center mt-6 lg:mt-12 mb-12 lg:mb-20 relative">
                        <div className="inline-flex justify-center items-center w-16 h-16 lg:w-20 lg:h-20 rounded-full border border-amber-900/30 dark:border-stone-600 mb-6 lg:mb-8 relative group bg-gradient-to-br from-amber-900/10 to-transparent dark:from-stone-700/50 shadow-[rgba(0,0,0,0.1)_0px_4px_12px]">
                            <BookOpen className="w-6 h-6 lg:w-8 lg:h-8 text-amber-900/70 dark:text-stone-300 group-hover:text-amber-900 dark:group-hover:text-white transition-colors drop-shadow-md" />
                        </div>
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-900/30 dark:via-stone-600 to-transparent mb-8 lg:mb-12"></div>
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif text-amber-950 dark:text-stone-100 mb-4 lg:mb-6 tracking-wide drop-shadow-[0_2px_2px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">The Book<br />of You</h1>
                        <p className="text-lg lg:text-xl text-amber-900/70 dark:text-stone-400 font-serif italic">A chronicle of {user.name}'s journey.</p>

                        <div className="mt-12 lg:mt-16 flex flex-col items-center justify-center gap-4 lg:gap-6 z-20 relative">
                            <div className="flex bg-gradient-to-b from-amber-900/10 to-transparent dark:from-stone-800/60 dark:to-transparent px-6 lg:px-8 py-2 lg:py-3 rounded-full border border-amber-900/20 dark:border-stone-600 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]">
                                <span className="text-[10px] lg:text-xs font-sans font-black uppercase tracking-[0.3em] text-amber-900/80 dark:text-stone-300">Volume {currentVolume + 1}</span>
                            </div>

                            <div className="flex items-center gap-6 lg:gap-12 mt-2 lg:mt-4 p-2 md:p-4 rounded-xl bg-white/50 dark:bg-black/20 backdrop-blur-md border border-amber-900/10 dark:border-white/10 shadow-lg print:hidden">
                                <button
                                    onClick={() => currentVolume > 0 && setCurrentVolume(prev => prev - 1)}
                                    className={`flex items-center gap-2 px-4 lg:px-6 py-3 text-xs lg:text-sm font-sans font-black uppercase tracking-widest transition-all pointer-events-auto shadow-sm ${currentVolume > 0 ? 'text-amber-900 bg-amber-100 hover:bg-amber-200 dark:text-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-lg hover:scale-105 active:scale-95' : 'text-amber-900/20 bg-amber-100/30 dark:text-stone-600 dark:bg-stone-800/30 rounded-lg cursor-not-allowed'}`} disabled={currentVolume === 0}
                                >
                                    <ChevronLeft className="w-4 h-4" /> Past
                                </button>

                                <div className="flex flex-col items-center">
                                    <span className="text-amber-900 dark:text-stone-300 font-bold text-sm">Volume {currentVolume + 1}</span>
                                    <span className="text-amber-900/50 dark:text-stone-500 text-[10px] uppercase font-bold tracking-widest">of {maxVolume + 1}</span>
                                </div>

                                <button
                                    onClick={() => currentVolume < maxVolume && setCurrentVolume(prev => prev + 1)}
                                    className={`flex items-center gap-2 px-4 lg:px-6 py-3 text-xs lg:text-sm font-sans font-black uppercase tracking-widest transition-all pointer-events-auto shadow-sm ${currentVolume < maxVolume ? 'text-amber-900 bg-amber-100 hover:bg-amber-200 dark:text-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-lg hover:scale-105 active:scale-95' : 'text-amber-900/20 bg-amber-100/30 dark:text-stone-600 dark:bg-stone-800/30 rounded-lg cursor-not-allowed'}`} disabled={currentVolume >= maxVolume}
                                >
                                    Future <ChevronLeft className="w-4 h-4 rotate-180" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CHAPTER 1: REFLECTIONS (Left Page Continued) */}
                    <div className="mt-8 lg:mt-auto relative z-10 pointer-events-auto">
                        <div className="text-center mb-8 lg:mb-10">
                            <h2 className="text-xl lg:text-2xl font-light tracking-wide text-amber-950 dark:text-stone-200 mb-2 inline-block border-b border-amber-900/20 dark:border-stone-700 pb-2 drop-shadow-sm">Chapter I: Reflections</h2>
                        </div>
                        {journals.length === 0 ? (
                            <div className="p-8 text-center text-amber-900/40 dark:text-stone-600 italic">No notes written this week.</div>
                        ) : (
                            <div className="space-y-6 lg:space-y-8">
                                {journals.slice(0, 2).map((j) => (
                                    <div key={j.id}>
                                        <h3 className="text-[9px] lg:text-[10px] font-sans font-bold text-amber-900/50 dark:text-stone-500 mb-2 uppercase tracking-widest">{new Date(j.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
                                        <div className="pl-4 border-l-2 border-amber-900/10 dark:border-stone-700/50">
                                            <p className="text-amber-950/80 dark:text-stone-300 leading-relaxed text-sm lg:text-base first-letter:text-3xl first-letter:font-bold first-letter:float-left first-letter:mr-1 first-letter:text-amber-900/60 dark:first-letter:text-stone-400">{j.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {journals.length > 2 && (
                            <p className="text-center text-[10px] lg:text-xs font-sans text-amber-900/40 dark:text-stone-600 italic mt-6 lg:mt-8 tracking-widest">({journals.length - 2} more notes preserved...)</p>
                        )}
                    </div>
                </div>

                {/* THE SPINE SHADOW - Desktop Only */}
                <div className="hidden md:block w-16 shrink-0 h-full bg-gradient-to-r from-transparent via-black/10 to-transparent dark:from-transparent dark:via-black/60 dark:to-transparent shadow-[inset_15px_0_30px_rgba(0,0,0,0.1),inset_-15px_0_30px_rgba(0,0,0,0.1)] dark:shadow-[inset_20px_0_40px_rgba(0,0,0,0.4),inset_-20px_0_40px_rgba(0,0,0,0.4)] z-10 relative pointer-events-none print:hidden">
                    <div className="absolute inset-y-0 left-1/2 -ml-px w-px bg-black/20 dark:bg-black/80 w-[2px]"></div>
                    <div className="absolute inset-y-0 left-[calc(100%-1px)] w-[1px] bg-white/30 dark:bg-white/10 shadow-[0_0_5px_rgba(255,255,255,0.5)]"></div>
                    <div className="absolute inset-y-0 right-[calc(100%-1px)] w-[1px] bg-white/30 dark:bg-white/10 shadow-[0_0_5px_rgba(255,255,255,0.5)]"></div>
                </div>

                {/* RIGHT PAGE */}
                <div className="w-full md:w-1/2 h-full flex flex-col p-6 md:p-12 lg:p-20 relative overflow-y-auto custom-scrollbar overflow-x-hidden">
                    {/* Page Numbers */}
                    <div className="hidden md:block absolute top-6 right-6 lg:top-8 lg:right-8 text-amber-900/30 font-sans text-[10px] tracking-widest font-bold">2</div>

                    {/* CHAPTER 2: EMOTIONAL CLIMATE */}
                    <div className="mb-12 lg:mb-16 mt-4 md:mt-0 relative z-10 pointer-events-auto">
                        <div className="text-center mb-8 lg:mb-10">
                            <h2 className="text-xl lg:text-2xl font-light tracking-wide text-amber-950 dark:text-stone-200 mb-2 inline-block border-b border-amber-900/20 dark:border-stone-700 pb-2 drop-shadow-sm">Chapter II: Climate</h2>
                        </div>

                        {/* VISUAL RATIO SCALE - PAPER */}
                        <div className="p-4 lg:p-6 mb-8 lg:mb-12 flex flex-col items-center border border-amber-900/10 dark:border-stone-800 relative bg-amber-900/5 dark:bg-stone-800/20 shadow-sm rounded-sm">
                            <h3 className="font-serif italic text-amber-900/60 dark:text-stone-400 mb-4 lg:mb-6 text-xs lg:text-sm">Dominant Weather Pattern</h3>

                            <div className="w-full h-2 lg:h-3 bg-amber-900/10 dark:bg-stone-900 rounded-full flex relative shadow-inner overflow-hidden border border-amber-900/5 dark:border-stone-700">
                                <div className="h-full transition-all duration-1000 bg-amber-500 dark:bg-amber-600 rounded-l-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)]" style={{ width: `${Math.max(2, moodRatio.sun)}%` }}></div>
                                <div className="h-full transition-all duration-1000 bg-slate-400 dark:bg-slate-600 rounded-r-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]" style={{ width: `${Math.max(2, moodRatio.rain)}%` }}></div>
                            </div>

                            <div className="flex justify-between w-full mt-3 font-serif text-[10px] lg:text-xs">
                                <div className={`flex items-center gap-1 lg:gap-1.5 ${isSunny ? 'text-amber-700 dark:text-amber-500 font-bold' : 'text-amber-900/40 dark:text-stone-600'}`}>
                                    <Sun className="w-3 h-3 lg:w-3.5 lg:h-3.5" /> Sunny ({Math.round(moodRatio.sun)}%)
                                </div>
                                <div className={`flex items-center gap-1 lg:gap-1.5 ${!isSunny ? 'text-slate-600 dark:text-slate-400 font-bold' : 'text-amber-900/40 dark:text-stone-600'}`}>
                                    Rainy ({Math.round(moodRatio.rain)}%) <CloudRain className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 lg:gap-4 px-1 lg:px-2">
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
                                    <div key={i} className={`aspect-square p-2 bg-amber-900/5 dark:bg-stone-800/40 rounded-sm flex flex-col items-center justify-center group shadow-sm ring-1 ring-amber-900/10 dark:ring-stone-700 transition-all hover:bg-amber-900/10 dark:hover:bg-stone-700`}>
                                        <span className="text-xl lg:text-2xl block mb-1 lg:mb-1.5 filter sepia-[0.3] dark:sepia-[0.2] group-hover:scale-110 group-hover:sepia-0 transition-transform">{emoji}</span>
                                        <div className="text-[7px] lg:text-[8px] font-sans font-bold uppercase text-amber-900/50 dark:text-stone-500 tracking-widest">{new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* CHAPTER 3: VISIONS & CONCLUSION */}
                    <div className="mt-8 md:mt-auto pt-8 border-t border-amber-900/10 dark:border-stone-800 text-center relative z-10 pointer-events-auto">
                        <div className="w-6 h-6 lg:w-8 lg:h-8 border border-amber-900/20 dark:border-stone-700 bg-transparent mx-auto mb-3 lg:mb-4 flex items-center justify-center rounded-sm rotate-45 shadow-sm pointer-events-none">
                            <div className="-rotate-45"><BookOpen className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-amber-900/40 dark:text-stone-500" /></div>
                        </div>

                        {isGeneratingNarrative ? (
                            <div className="py-12 flex flex-col items-center justify-center space-y-4">
                                <Sparkles className="w-6 h-6 animate-spin text-amber-700/60 dark:text-stone-400" />
                                <p className="font-serif italic text-amber-900/60 dark:text-stone-400 text-sm">Weaving your chronicle together...</p>
                            </div>
                        ) : narrative ? (
                            <div className="text-left bg-gradient-to-b from-transparent via-[#fdfaf6]/30 to-transparent dark:via-[#1a1817]/30 p-4 lg:p-8 relative print:break-inside-avoid">
                                <div className="absolute top-0 left-10 w-8 h-px bg-amber-900/20 dark:bg-stone-700"></div>
                                <div className="absolute top-0 right-10 w-8 h-px bg-amber-900/20 dark:bg-stone-700"></div>
                                {narrative.split('\n\n').map((paragraph, idx) => (
                                    <p key={idx} className={`font-serif text-amber-950 dark:text-stone-200 text-sm lg:text-base leading-loose mb-6 last:mb-0 relative z-10 ${idx === 0 ? 'first-letter:text-4xl first-letter:font-bold first-letter:float-left first-letter:mr-2 tracking-wide' : 'tracking-wide indent-8'}`}>
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                        ) : null}

                        <p className="font-sans text-[7px] lg:text-[8px] uppercase tracking-[0.3em] font-bold text-amber-900/30 dark:text-stone-600 mt-6 pointer-events-none">Peutic Archives // Vol. {currentVolume + 1}</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default BookOfYouView;
