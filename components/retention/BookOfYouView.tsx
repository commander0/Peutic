import React, { useEffect, useState } from 'react';
import { UserService } from '../../services/userService';
import { User, JournalEntry, MoodEntry, ArtEntry, GardenState } from '../../types';
import { BookOpen, Heart, Sparkles, Image as ImageIcon, Lock, Sun, CloudRain, ChevronLeft, Download } from 'lucide-react';

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
            <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-black/90 backdrop-blur-3xl p-8 text-center animate-in fade-in duration-500">
                <button onClick={onClose} className="absolute top-8 left-8 text-white/40 hover:text-white flex items-center gap-2 transition-colors">
                    <ChevronLeft className="w-5 h-5" /> Return
                </button>
                <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-md relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-50"></div>
                    <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10 border border-white/20">
                        <Lock className="w-8 h-8 text-white/60" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-3 relative z-10 shadow-sm drop-shadow-md">The Ink is Still Drying</h2>
                    <p className="text-white/60 mb-8 relative z-10 leading-relaxed text-sm">Your story is just beginning. The Chronicle requires at least one week of history to weave your narrative.</p>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 relative z-10 bg-purple-500/10 py-2 rounded-full border border-purple-500/20">Unlocked after {user ? new Date(new Date(user.joinedAt).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() : '7 Days'}</div>
                </div>
            </div>
        );
    }

    // Determine Dominant Weather
    const isSunny = moodRatio.sun >= moodRatio.rain;

    return (
        <div className="fixed inset-0 z-[120] bg-black text-white overflow-y-auto animate-in fade-in duration-1000 font-sans custom-scrollbar">
            {/* ETHEREAL ATMOSPHERE ENGINES */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                {isSunny ? (
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-black mix-blend-screen opacity-50">
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-yellow-400/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse-slow"></div>
                        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[150px] translate-y-1/3 -translate-x-1/3"></div>
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/40 to-black mix-blend-screen opacity-50">
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse-slow"></div>
                        <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-cyan-700/20 rounded-full blur-[120px] -translate-x-1/2"></div>
                    </div>
                )}
                {/* Dusted stars / noise overlay */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-screen"></div>
            </div>

            {/* FLOATING ACTION BAR */}
            <div className="fixed top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-50"></div>
            <button
                onClick={onClose}
                className="fixed top-6 left-6 md:top-8 md:left-8 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/20 text-white/80 hover:text-white py-3 px-6 rounded-full flex items-center gap-3 transition-all shadow-[0_4px_30px_rgba(0,0,0,0.1)] z-[60] group"
            >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold text-xs uppercase tracking-[0.2em]">Sanctuary</span>
            </button>

            <button
                onClick={() => window.print()}
                className="fixed top-6 right-6 md:top-8 md:right-8 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/20 text-white/80 hover:text-white w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-[0_4px_30px_rgba(0,0,0,0.1)] z-[60] group print:hidden"
                title="Export Chronicle"
            >
                <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
            </button>


            <div className="max-w-5xl mx-auto pt-32 pb-24 px-4 sm:px-8 relative z-10">

                {/* HERO COVER: Premium Glassmorphism */}
                <div className="text-center mb-24 relative">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/30 blur-[100px] pointer-events-none"></div>
                    <div className="inline-flex justify-center items-center w-24 h-24 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl mb-8 relative group">
                        <div className="absolute inset-0 rounded-3xl border border-purple-500/50 scale-105 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 pointer-events-none"></div>
                        <Sparkles className="w-10 h-10 text-purple-400 group-hover:text-purple-300 transition-colors drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-white/60 mb-6 tracking-tighter drop-shadow-sm">The Book of You</h1>
                    <p className="text-xl text-purple-200/60 font-medium tracking-wide">A digital chronicle of {user.name}'s inner universe.</p>
                    <div className="mt-12 flex justify-center gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                        <span className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10">Vol. 1</span>
                        <span className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10">{new Date().getFullYear()}</span>
                    </div>
                </div>

                {/* CHAPTER 1: REFLECTIONS */}
                <div className="mb-24 relative">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-widest uppercase text-white drop-shadow-md">Reflections</h2>
                    </div>

                    {journals.length === 0 ? (
                        <div className="p-8 rounded-[2rem] bg-white/5 border border-dashed border-white/20 backdrop-blur-md text-center">
                            <p className="text-white/40 italic font-medium">The pages are blank, waiting for your thoughts.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {journals.map((j) => (
                                <div key={j.id} className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] group-hover:bg-indigo-500/20 transition-colors pointer-events-none"></div>
                                    <h3 className="text-[10px] font-black text-indigo-400 mb-4 uppercase tracking-[0.2em]">{new Date(j.date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}</h3>
                                    <p className="text-white/80 leading-relaxed whitespace-pre-wrap group-hover:text-white transition-colors">{j.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* CHAPTER 2: EMOTIONAL CLIMATE */}
                <div className="mb-24 relative">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                            <Heart className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-widest uppercase text-white drop-shadow-md">Emotional Climate</h2>
                    </div>

                    {/* VISUAL RATIO SCALE - GLASSMORPHIC */}
                    <div className="p-8 md:p-12 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-2xl mb-10 flex flex-col items-center relative overflow-hidden shadow-2xl">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-2xl blur-[100px] pointer-events-none opacity-30">
                            <div className="w-full h-full bg-gradient-to-r from-yellow-500 to-blue-500"></div>
                        </div>

                        <h3 className="font-bold text-[10px] text-white/50 tracking-[0.3em] uppercase mb-8 relative z-10">Dominant Weather Pattern</h3>

                        <div className="w-full max-w-xl h-6 bg-black/40 rounded-full p-1 flex relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] z-10 border border-white/5">
                            <div className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-amber-200 to-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.6)]" style={{ width: `${Math.max(2, moodRatio.sun)}%` }}></div>
                            <div className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-400 to-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)] ml-1" style={{ width: `${Math.max(2, moodRatio.rain)}%` }}></div>
                        </div>

                        <div className="flex justify-between w-full max-w-xl mt-6 text-[10px] font-black uppercase tracking-[0.2em] z-10">
                            <div className={`flex items-center gap-2 ${isSunny ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)] scale-110' : 'text-white/30'} transition-all`}>
                                <Sun className="w-4 h-4" /> Sunny ({Math.round(moodRatio.sun)}%)
                            </div>
                            <div className={`flex items-center gap-2 ${!isSunny ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)] scale-110' : 'text-white/30'} transition-all`}>
                                Rainy ({Math.round(moodRatio.rain)}%) <CloudRain className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                        {moods.slice(0, 8).map((m, i) => {
                            const isPositive = (m.mood as any) === 'confetti' || (m.mood as any) === 'Happy' || (m.mood as any) === 'Calm' || (m.mood as any) === 'sun';
                            const isNegative = (m.mood as any) === 'rain' || (m.mood as any) === 'Anxious' || (m.mood as any) === 'Sad';
                            let emoji = '😐';
                            let color = 'from-gray-500/20 to-gray-600/20';

                            if (isPositive) {
                                emoji = ['confetti', 'Happy'].includes(String(m.mood)) ? '🎉' : '☀️';
                                color = 'from-yellow-400/20 to-orange-500/20 shadow-[0_0_15px_rgba(250,204,21,0.15)]';
                            } else if (isNegative) {
                                emoji = ['rain', 'Sad'].includes(String(m.mood)) ? '🌧️' : '😰';
                                color = 'from-blue-500/20 to-cyan-600/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]';
                            }

                            return (
                                <div key={i} className={`aspect-square p-2 bg-gradient-to-br ${color} rounded-3xl border border-white/10 backdrop-blur-md flex flex-col items-center justify-center hover:scale-110 transition-transform`}>
                                    <span className="text-3xl md:text-4xl block mb-1 drop-shadow-lg filter">{emoji}</span>
                                    <div className="text-[8px] font-black uppercase text-white/50 tracking-widest">{new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* CHAPTER 3: VISIONS (ART) */}
                <div className="mb-16 relative">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-3 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.2)]">
                            <ImageIcon className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-widest uppercase text-white drop-shadow-md">Visions</h2>
                    </div>

                    {arts.length === 0 ? (
                        <div className="p-8 rounded-[2rem] bg-white/5 border border-dashed border-white/20 backdrop-blur-md text-center">
                            <p className="text-white/40 italic font-medium">The canvas awaits your dreams.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {arts.map(a => (
                                <div key={a.id} className="group flex flex-col">
                                    <div className="aspect-square bg-white/5 rounded-[2rem] overflow-hidden mb-4 border border-white/10 shadow-2xl hover:shadow-[0_0_30px_rgba(217,70,239,0.3)] transition-all duration-700 relative">
                                        <img src={a.imageUrl} alt={a.prompt} className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-transform duration-1000 ease-out" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    </div>
                                    <div className="px-2">
                                        <p className="font-medium text-sm text-white/80 leading-relaxed mb-2 line-clamp-3">"{a.prompt}"</p>
                                        <p className="text-[9px] font-black text-fuchsia-400/80 uppercase tracking-[0.2em]">{new Date(a.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="mt-32 pt-12 border-t border-white/10 text-center relative z-10">
                    <div className="w-12 h-12 rounded-full border border-white/20 bg-white/5 mx-auto mb-6 flex items-center justify-center backdrop-blur-xl">
                        <Sparkles className="w-5 h-5 text-white/40" />
                    </div>
                    <p className="font-black tracking-[0.4em] uppercase text-[9px] text-white/30">Created with Peutic</p>
                    <p className="font-bold tracking-widest uppercase text-[8px] text-white/20 mt-2">End-to-End Encrypted Chronicle</p>
                </div>
            </div>
        </div>
    );
};

export default BookOfYouView;
