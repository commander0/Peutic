import React, { useEffect, useState } from 'react';
import { UserService } from '../../services/userService';
import { User, JournalEntry, MoodEntry, ArtEntry } from '../../types';
import { BookOpen, Heart, Sparkles, Image as ImageIcon, Lock, Sun, CloudRain } from 'lucide-react';

// A Printable View Component
const BookOfYou: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [journals, setJournals] = useState<JournalEntry[]>([]);
    const [moods, setMoods] = useState<MoodEntry[]>([]);
    const [arts, setArts] = useState<ArtEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(true);
    const [moodRatio, setMoodRatio] = useState({ sun: 0, rain: 0 }); // Percentages

    useEffect(() => {
        const loadData = async () => {
            const u = UserService.getUser();
            if (u) {
                setUser(u);
                // Weekly Lock Check
                const joinDate = new Date(u.joinedAt).getTime();
                const oneWeek = 7 * 24 * 60 * 60 * 1000;
                // Allow access if > 7 days OR admin/dev (comment out logic for dev if needed)
                // For demo purposes, if < 7 days, we show Locked state.
                if (Date.now() - joinDate < oneWeek) {
                    setIsLocked(true);
                    setLoading(false);
                    // return; // Uncomment to strictly enforce lock. For now, let's allow it to render behind or just return.
                    // Actually, user requested it. So we return.
                    return;
                } else {
                    setIsLocked(false);
                }

                const [j, m, a] = await Promise.all([
                    UserService.getJournals(u.id),
                    UserService.getMoods(u.id),
                    UserService.getUserArt(u.id)
                ]);
                setJournals(j);
                setMoods(m);
                setArts(a);

                // Calculate Mood Ratio
                const total = m.length;
                if (total > 0) {
                    const sunCount = m.filter(x => ['Happy', 'Calm', 'confetti', 'sun'].includes(x.mood)).length;
                    const sunPct = (sunCount / total) * 100;
                    setMoodRatio({ sun: sunPct, rain: 100 - sunPct });
                } else {
                    setMoodRatio({ sun: 50, rain: 50 }); // Default balanced
                }
            }
            setLoading(false);
        };
        loadData();
    }, []);

    if (loading) return <div className="p-12 text-center font-serif text-gray-500 animate-pulse">Consulting the archives...</div>;

    // LOCKED STATE
    if (isLocked) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFBEB] p-8 text-center">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md border border-yellow-200">
                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">The Ink is Still Drying</h2>
                    <p className="text-gray-500 mb-6">Your story is just beginning. The Book of You requires at least one week of history to weave your narrative.</p>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Available after {user ? new Date(new Date(user.joinedAt).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() : '7 Days'}</div>
                </div>
            </div>
        );
    }

    if (!user) return <div className="p-12 text-center text-red-500">Please log in to view your book.</div>;

    // Determine Dominant Weather
    const isSunny = moodRatio.sun >= moodRatio.rain;

    return (
        <div className="min-h-screen bg-[#FFFBEB] text-gray-800 p-8 md:p-16 print:p-0 print:bg-white relative overflow-hidden">

            {/* ATMOSPHERIC OVERLAY */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {isSunny ? (
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-orange-100/20 to-transparent mix-blend-overlay">
                        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-yellow-300/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                        {/* CSS Sparkles could go here */}
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-200/20 to-slate-400/10 mix-blend-multiply">
                        {/* Simple Rain CSS would be complex, using static overlay for now */}
                        <div className="absolute w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')]"></div>
                    </div>
                )}
            </div>

            <div className="max-w-5xl mx-auto bg-white/90 backdrop-blur-sm shadow-2xl rounded-r-3xl border-l-[12px] border-yellow-600 p-12 md:p-24 min-h-[80vh] print:shadow-none print:border-none print:w-full relative z-10">

                {/* COVER */}
                <div className="text-center border-b-2 border-gray-100 pb-12 mb-12 break-after-page">
                    <div className="flex justify-center mb-6 text-yellow-500">
                        <Sparkles className="w-16 h-16 animate-pulse" />
                    </div>
                    <h1 className="text-6xl font-serif font-bold text-gray-900 mb-4 tracking-tight">The Book of You</h1>
                    <p className="text-xl text-gray-500 italic font-serif">A chronicle of {user.name}'s journey.</p>
                    <div className="mt-12 text-sm text-gray-400 uppercase tracking-widest font-sans flex justify-center gap-4">
                        <span>Vol. 1</span> &bull; <span>{new Date().getFullYear()}</span>
                    </div>
                </div>

                {/* CHAPTER 1: REFLECTIONS */}
                <div className="mb-16">
                    <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8 flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-yellow-600" />
                        Chapter I: Reflections
                    </h2>
                    {journals.length === 0 ? <p className="text-gray-400 italic">No entries yet.</p> : (
                        <div className="space-y-8 pl-4 border-l-2 border-gray-100">
                            {journals.map(j => (
                                <div key={j.id} className="prose font-serif group">
                                    <h3 className="text-sm font-bold text-gray-400 font-sans mb-1 uppercase tracking-wider">{new Date(j.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap group-hover:text-black transition-colors">{j.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* CHAPTER 2: EMOTIONAL CLIMATE (NEW VISUALS) */}
                <div className="mb-16 break-before-page">
                    <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8 flex items-center gap-3">
                        <Heart className="w-6 h-6 text-red-500" />
                        Chapter II: Emotional Climate
                    </h2>

                    {/* VISUAL RATIO SCALE */}
                    <div className="bg-gray-50 p-8 rounded-3xl mb-8 flex flex-col items-center">
                        <h3 className="font-serif italic text-gray-500 mb-6">Your Dominant Weather Pattern</h3>
                        <div className="w-full max-w-md h-4 bg-gray-200 rounded-full overflow-hidden flex relative shadow-inner">
                            <div className="bg-yellow-400 h-full transition-all duration-1000" style={{ width: `${moodRatio.sun}%` }}></div>
                            <div className="bg-blue-400 h-full transition-all duration-1000" style={{ width: `${moodRatio.rain}%` }}></div>

                            {/* Icons positioned absolutely based on ratio - Simplified to ends for now */}
                        </div>
                        <div className="flex justify-between w-full max-w-md mt-4 text-xs font-bold uppercase tracking-widest">
                            <div className={`flex items-center gap-2 ${isSunny ? 'text-yellow-600 scale-110' : 'text-gray-400'} transition-all`}>
                                <Sun className="w-5 h-5" /> Sunny ({Math.round(moodRatio.sun)}%)
                            </div>
                            <div className={`flex items-center gap-2 ${!isSunny ? 'text-blue-600 scale-110' : 'text-gray-400'} transition-all`}>
                                Rainy ({Math.round(moodRatio.rain)}%) <CloudRain className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-75 hover:opacity-100 transition-opacity">
                        {moods.slice(0, 8).map((m, i) => ( // Limit to recent 8 for clean layout
                            <div key={i} className="p-4 bg-gray-50 rounded-xl text-center borderBorder-transparent hover:border-gray-200 transition-all">
                                <span className="text-2xl block mb-2">{m.mood === 'Happy' ? '😊' : m.mood === 'Calm' ? '😌' : m.mood === 'Anxious' ? '😰' : '😐'}</span>
                                <div className="text-[10px] font-bold uppercase text-gray-400">{new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CHAPTER 3: VISIONS (ART) */}
                <div className="mb-16 break-before-page">
                    <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8 flex items-center gap-3">
                        <ImageIcon className="w-6 h-6 text-purple-500" />
                        Chapter III: Visions
                    </h2>
                    {arts.length === 0 ? <p className="text-gray-400 italic">No art created yet.</p> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {arts.map(a => (
                                <div key={a.id} className="break-inside-avoid group">
                                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3 border-4 border-white shadow-lg group-hover:scale-[1.02] transition-transform duration-500">
                                        <img src={a.imageUrl} alt={a.prompt} className="w-full h-full object-cover" />
                                    </div>
                                    <p className="text-center font-serif text-sm italic text-gray-600">"{a.prompt}"</p>
                                    <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest mt-1">{new Date(a.createdAt).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="mt-24 pt-12 border-t border-gray-100 text-center">
                    <p className="font-serif italic text-gray-400">Created with Peutic &bull; Secure & Private</p>

                    {/* Floating Print Button for Screen Only */}
                    <button onClick={() => window.print()} className="fixed bottom-8 right-8 bg-black text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform print:hidden z-50">
                        <BookOpen className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookOfYou;
