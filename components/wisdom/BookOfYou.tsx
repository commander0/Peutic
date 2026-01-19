import React, { useEffect, useState } from 'react';
import { UserService } from '../../services/userService';
import { User, JournalEntry, MoodEntry, ArtEntry } from '../../types';
import { BookOpen, Heart, Sparkles, Image as ImageIcon } from 'lucide-react';

// A Printable View Component
const BookOfYou: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [journals, setJournals] = useState<JournalEntry[]>([]);
    const [moods, setMoods] = useState<MoodEntry[]>([]);
    const [arts, setArts] = useState<ArtEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const u = UserService.getUser();
            if (u) {
                setUser(u);
                const [j, m, a] = await Promise.all([
                    UserService.getJournals(u.id),
                    UserService.getMoods(u.id),
                    UserService.getUserArt(u.id)
                ]);
                setJournals(j);
                setMoods(m);
                setArts(a);
            }
            setLoading(false);
        };
        loadData();
    }, []);

    if (loading) return <div className="p-12 text-center font-serif text-gray-500">Opening your book...</div>;
    if (!user) return <div className="p-12 text-center text-red-500">Please log in to view your book.</div>;

    return (
        <div className="min-h-screen bg-[#FFFBEB] text-gray-800 p-8 md:p-16 print:p-0 print:bg-white"> {/* Lighter Yellow Background */}
            <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-r-3xl border-l-[12px] border-yellow-600 p-12 md:p-24 min-h-[80vh] print:shadow-none print:border-none print:w-full">

                {/* COVER */}
                <div className="text-center border-b-2 border-gray-100 pb-12 mb-12 break-after-page">
                    <div className="flex justify-center mb-6 text-yellow-500">
                        <Sparkles className="w-16 h-16" /> {/* Peutic Logo Proxy */}
                    </div>
                    <h1 className="text-6xl font-serif font-bold text-gray-900 mb-4 tracking-tight">The Book of You</h1>
                    <p className="text-xl text-gray-500 italic font-serif">A chronicle of {user.name}'s journey.</p>
                    <div className="mt-12 text-sm text-gray-400 uppercase tracking-widest font-sans">Vol. 1 &bull; {new Date().getFullYear()}</div>
                </div>

                {/* CHAPTER 1: REFLECTIONS */}
                <div className="mb-16">
                    <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8 flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-yellow-600" />
                        Chapter I: Reflections
                    </h2>
                    {journals.length === 0 ? <p className="text-gray-400 italic">No entries yet.</p> : (
                        <div className="space-y-8">
                            {journals.map(j => (
                                <div key={j.id} className="prose font-serif">
                                    <h3 className="text-lg font-bold text-gray-400 font-sans mb-1">{new Date(j.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{j.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* CHAPTER 2: EMOTIONS */}
                <div className="mb-16 break-before-page">
                    <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8 flex items-center gap-3">
                        <Heart className="w-6 h-6 text-red-500" />
                        Chapter II: Emotional Landscape
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {moods.map((m, i) => (
                            <div key={i} className="p-4 bg-gray-50 rounded-xl text-center">
                                <span className="text-2xl block mb-2">{m.mood === 'Happy' ? '😊' : m.mood === 'Calm' ? '😌' : m.mood === 'Anxious' ? '😰' : '😐'}</span>
                                <div className="text-xs font-bold uppercase text-gray-400">{new Date(m.date).toLocaleDateString()}</div>
                                <div className="text-sm font-bold text-gray-900">{m.mood}</div>
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
                                <div key={a.id} className="break-inside-avoid">
                                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3 border-4 border-white shadow-lg">
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
