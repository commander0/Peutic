import React, { useEffect, useState } from 'react';
import { UserService } from '../../services/userService';
import { User, JournalEntry, MoodEntry } from '../../types';
import { BookOpen, Heart, Feather } from 'lucide-react';

// A Printable View Component
const BookOfYou: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [journals, setJournals] = useState<JournalEntry[]>([]);
    const [moods, setMoods] = useState<MoodEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const u = UserService.getCachedUser();
            if (!u) return;
            setUser(u);

            const [j, m] = await Promise.all([
                UserService.getJournals(u.id),
                UserService.getMoods(u.id)
            ]);

            // Assuming we also want to fetch Art (needs a new method in UserService if not public, 
            // but for now let's reuse what we know or mock if missing, 
            // actually UserService doesn't have getArt exposed publicly in the cached view usually, 
            // let's fetch it via Supabase directly or add a helper if needed.
            // For this iteration, I'll stick to Journals + Moods to ensure types safety, 
            // or see if we can get Art.
            // checking UserService... it has saveArt but getGallery is usually in Dashboard.
            // I'll stick to Journals and Moods for V1 to avoid breakage.

            setJournals(j);
            setMoods(m);
            setLoading(false);
        };
        loadData();
    }, []);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7] font-serif italic text-gray-400">Binding your story...</div>;
    if (!user) return <div className="p-10 text-center">Please log in to view your book.</div>;

    return (
        <div className="min-h-screen bg-[#fdfbf7] text-[#2c2c2c] font-serif print:bg-white">
            {/* COVER PAGE */}
            <div className="h-screen flex flex-col items-center justify-center text-center p-12 border-[20px] border-double border-[#e6e2d8] m-0 print:m-0 print:border-none">
                <div className="mb-8">
                    <Feather className="w-24 h-24 text-[#d4c5a5] mx-auto opacity-50" />
                </div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 text-[#1a1a1a] uppercase leading-none">
                    The Book<br /><span className="text-[#d4c5a5]">of</span> You
                </h1>
                <div className="w-32 h-1 bg-[#2c2c2c] my-8"></div>
                <h2 className="text-2xl italic text-gray-500 mb-2">A Journey of Growth & Resilience</h2>
                <h3 className="text-xl font-bold uppercase tracking-widest mt-8">{user.name}</h3>
                <p className="absolute bottom-12 text-xs text-gray-400 uppercase tracking-[0.3em]">Peutic Edition &bull; {new Date().getFullYear()}</p>
            </div>

            {/* PAGE BREAK */}
            <div className="break-before-page"></div>

            {/* DEDICATION */}
            <div className="h-screen flex flex-col items-center justify-center px-12 text-center print:break-after-page">
                <p className="text-xl italic leading-loose max-w-2xl mx-auto text-gray-600">
                    "For the moments you kept going,<br />
                    for the quiet breaths you took,<br />
                    and for the peace you built,<br />
                    one day at a time."
                </p>
            </div>

            {/* CHAPTER 1: JOURNALS */}
            <div className="max-w-4xl mx-auto px-12 py-24 print:py-12">
                <div className="flex items-center gap-4 mb-16 border-b border-gray-200 pb-8">
                    <BookOpen className="w-12 h-12 text-[#d4c5a5]" />
                    <h2 className="text-5xl font-black uppercase tracking-tight">Chronicles of Thought</h2>
                </div>

                <div className="space-y-16">
                    {journals.length === 0 ? (
                        <p className="italic text-gray-400 text-center">Your pages are waiting to be written.</p>
                    ) : (
                        journals.map((entry) => (
                            <div key={entry.id} className="break-inside-avoid mb-12">
                                <div className="flex items-baseline gap-4 mb-4">
                                    <span className="text-4xl font-bold text-[#d4c5a5]">
                                        {new Date(entry.date).getDate()}
                                    </span>
                                    <span className="text-sm font-bold uppercase tracking-widest text-gray-400">
                                        {new Date(entry.date).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                                <p className="text-lg leading-relaxed whitespace-pre-line text-gray-800">
                                    {entry.content}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* PAGE BREAK */}
            <div className="break-before-page"></div>

            {/* CHAPTER 2: MOODS */}
            <div className="max-w-4xl mx-auto px-12 py-24 print:py-12">
                <div className="flex items-center gap-4 mb-16 border-b border-gray-200 pb-8">
                    <Heart className="w-12 h-12 text-[#d4c5a5]" />
                    <h2 className="text-5xl font-black uppercase tracking-tight">Emotional Landscapes</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {moods.map((m) => (
                        <div key={m.id} className="p-4 border border-gray-100 rounded-lg text-center break-inside-avoid bg-white">
                            <span className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                                {new Date(m.date).toLocaleDateString()}
                            </span>
                            <span className="text-2xl capitalize font-medium text-gray-800">
                                {m.mood === 'confetti' ? 'Joy ☀️' : m.mood === 'rain' ? 'Melancholy 🌧️' : m.mood}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* FOOTER - ONLY FOR WEB */}
            <div className="fixed bottom-8 right-8 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="bg-black text-white px-8 py-4 rounded-full font-bold shadow-2xl hover:scale-105 transition-transform flex items-center gap-3"
                >
                    <BookOpen className="w-5 h-5" /> Print to PDF
                </button>
            </div>
        </div>
    );
};

export default BookOfYou;
