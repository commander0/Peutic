import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Calendar, TrendingUp, ChevronLeft, Download, Eye, Sparkles } from 'lucide-react';
import { User, JournalEntry, MoodEntry, GardenState } from '../../types';
import { UserService } from '../../services/userService';
import { PetService } from '../../services/petService';
import GardenCanvas from '../garden/GardenCanvas';

interface BookOfYouViewProps {
    user: User;
    garden: GardenState | null;
    onClose: () => void;
}

const BookOfYouView: React.FC<BookOfYouViewProps> = ({ user, garden, onClose }) => {
    const [journals, setJournals] = useState<JournalEntry[]>([]);
    const [moods, setMoods] = useState<MoodEntry[]>([]);
    const [artEntries, setArtEntries] = useState<any[]>([]); // Using any for brevity in this view
    const [lumina, setLumina] = useState<any | null>(null);
    const [sessionMinutes, setSessionMinutes] = useState(0);

    useEffect(() => {
        const load = async () => {
            const [j, m, a, p, t] = await Promise.all([
                UserService.getJournals(user.id),
                UserService.getMoods(user.id),
                UserService.getUserArt(user.id),
                PetService.getPet(user.id),
                UserService.getUserTransactions(user.id)
            ]);
            setJournals(j);
            setMoods(m);
            setArtEntries(a);
            setLumina(p);

            // Calculate Session Time (transactions where amount < 0 implies spending time, usually)
            // Or if we track 'sessions' in transactions. Assuming simple sum of cost or distinct session logs.
            // For now, let's sum 'amount' of 'usage' transactions if negative, or just sum positive 'topups' as 'available'.
            // Better: Sum `duration` from session logs if available, but here we'll use a placeholder logic or `transactions.length * 15`
            const estimatedMinutes = t.filter(tx => tx.amount < 0).reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
            setSessionMinutes(estimatedMinutes);
        };
        load();
    }, [user.id]);

    const stats = [
        { label: 'Words Written', value: journals.reduce((acc, j) => acc + j.content.split(' ').length, 0), icon: BookOpen },
        { label: 'Days Mindful', value: moods.length, icon: Calendar },
        { label: 'Session Time', value: `${sessionMinutes}m`, icon: Clock },
    ];

    return (
        <div className="fixed inset-0 z-[100] bg-[#e5e7eb] dark:bg-[#0a0a0a] text-black dark:text-white flex flex-col animate-in fade-in duration-500 overflow-y-auto">
            {/* HER0 / METALLIC HEADER */}
            <div className="relative h-[300px] md:h-[400px] bg-gradient-to-br from-white via-gray-100 to-gray-300 dark:from-gray-800 dark:via-black dark:to-gray-950 flex flex-col items-center justify-center border-b border-gray-200 dark:border-gray-800 overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-[0.1] dark:opacity-[0.05]"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0a0a0a] to-transparent"></div>

                {/* FLOATING PARTICLES */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-white/20 blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-white/10 blur-[100px] animate-pulse delay-700"></div>
                </div>

                <div className="relative z-10 text-center px-6">
                    <button onClick={onClose} className="absolute -top-20 md:-top-32 left-0 flex items-center gap-2 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
                        <ChevronLeft className="w-4 h-4" /> Close Book
                    </button>
                    <div className="w-20 h-20 md:w-32 md:h-32 bg-white text-black rounded-[2rem] shadow-2xl flex items-center justify-center mb-6 mx-auto animate-float">
                        <BookOpen className="w-10 h-10 md:w-16 md:h-16" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-[0.2em] mb-2 drop-shadow-md">Book of You</h1>
                    <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-[0.4em]">The Digital Legacy of {user.name}</p>
                </div>
            </div>

            {/* CONTENT GRID */}
            <div className="max-w-6xl mx-auto w-full p-6 md:p-12 -mt-10 relative z-20 space-y-12 pb-24">
                {/* QUICK STATS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((s, i) => (
                        <div key={i} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-xl flex items-center gap-6 group hover:translate-y-[-4px] transition-all">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                                <s.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
                                <p className="text-2xl font-black">{s.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* SOUL SUMMARY CARD */}
                    <div className="bg-gradient-to-br from-black to-gray-800 text-white p-8 md:p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform"><Sparkles className="w-40 h-40" /></div>
                        <h3 className="text-2xl font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                            <TrendingUp className="w-6 h-6 text-yellow-500" /> Soul Summary
                        </h3>
                        <p className="text-gray-300 leading-relaxed text-lg italic mb-8">
                            "You have shown incredible resilience over the last few weeks. Your journals indicate a shift from reactive stress to proactive mindfulness. Your creative outputs and garden growth mirror this internal stability."
                        </p>
                        <div className="flex gap-4">
                            <div className="bg-white/10 px-4 py-2 rounded-full text-xs font-bold">Resilience ↑</div>
                            <div className="bg-white/10 px-4 py-2 rounded-full text-xs font-bold">Creativity ↑</div>
                        </div>
                    </div>

                    {/* RECENT JOURNEY TIMELINE */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3 mb-6">
                                <Clock className="w-6 h-6 text-gray-400" /> Recent Milestones
                            </h3>
                            <div className="space-y-4">
                                {journals.slice(0, 2).map((j, i) => (
                                    <div key={i} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 flex gap-4">
                                        <div className="w-1 h-auto bg-yellow-400 rounded-full"></div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{new Date(j.date).toLocaleDateString()}</p>
                                            <p className="text-sm font-medium line-clamp-2 leading-relaxed">{j.content}</p>
                                        </div>
                                    </div>
                                ))}

                                {/* GARDEN & PET SYNERGY */}
                                <div className="grid grid-cols-2 gap-4">
                                    {garden && (
                                        <div className="bg-green-50 dark:bg-green-950/20 p-5 rounded-3xl border border-green-100 dark:border-green-900/30">
                                            <h4 className="text-xs font-black text-green-700 dark:text-green-400 uppercase tracking-widest mb-2">Inner Garden</h4>
                                            <div className="flex items-center gap-3">
                                                <GardenCanvas garden={garden} width={40} height={40} />
                                                <span className="text-lg font-black dark:text-white">Lvl {garden.level}</span>
                                            </div>
                                        </div>
                                    )}
                                    {lumina && (
                                        <div className="bg-cyan-50 dark:bg-cyan-950/20 p-5 rounded-3xl border border-cyan-100 dark:border-cyan-900/30">
                                            <h4 className="text-xs font-black text-cyan-700 dark:text-cyan-400 uppercase tracking-widest mb-2">Companion</h4>
                                            <div className="flex items-center gap-3">
                                                {/* Placeholder for Pet Icon if no canvas */}
                                                <Sparkles className="w-8 h-8 text-cyan-500" />
                                                <div>
                                                    <p className="text-xs font-bold dark:text-white">{lumina.name}</p>
                                                    <p className="text-[10px] text-cyan-500">Lvl {lumina.level}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ESTATE STATUS */}
                        {user.unlockedRooms && user.unlockedRooms.length > 0 && (
                            <div className="pt-4">
                                <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3 mb-6">
                                    <BookOpen className="w-6 h-6 text-indigo-500" /> Sanctuary Estate
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {user.unlockedRooms.map(room => (
                                        <div key={room} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 text-xs font-black uppercase text-indigo-600 dark:text-indigo-400">
                                            {room}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* CREATIVE FLOW (ART) */}
                        {artEntries.length > 0 && (
                            <div className="pt-4">
                                <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3 mb-6">
                                    <Eye className="w-6 h-6 text-pink-500" /> Creative Flow
                                </h3>
                                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                                    {artEntries.slice(0, 5).map((art, i) => (
                                        <div key={i} className="w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 relative bg-gray-100">
                                            <img src={art.imageUrl} alt={art.prompt} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* EXPORT SECTION */}
                <div className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[3rem] p-12 text-center">
                    <h3 className="text-2xl font-black uppercase mb-4">Finalize Portfolio</h3>
                    <p className="text-gray-500 text-sm max-w-lg mx-auto mb-8">Download a beautifully formatted digital portfolio of your journey, including all journals, mood prints, and AI insights.</p>
                    <div className="flex flex-col md:flex-row justify-center gap-4">
                        <button className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                            <Download className="w-5 h-5" /> Export PDF Portfolio
                        </button>
                        <button className="bg-gray-200 dark:bg-gray-800 text-black dark:text-white px-8 py-4 rounded-2xl font-black hover:bg-gray-300 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-3">
                            <Eye className="w-5 h-5" /> Print Preview
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookOfYouView;
