import React, { useState, useEffect } from 'react';
import { ChevronLeft, Feather, Star, Calendar, Download, Sparkles } from 'lucide-react';
import { User, JournalEntry, MoodEntry, GardenState } from '../../types';
import { UserService } from '../../services/userService';
import { PetService } from '../../services/petService';

interface BookOfYouViewProps {
    user: User;
    garden: GardenState | null;
    onClose: () => void;
}

const BookOfYouView: React.FC<BookOfYouViewProps> = ({ user, garden, onClose }) => {
    const [journals, setJournals] = useState<JournalEntry[]>([]);
    const [moods, setMoods] = useState<MoodEntry[]>([]);
    const [lumina, setLumina] = useState<any | null>(null);
    const [currentPage, setCurrentPage] = useState(0);

    useEffect(() => {
        const load = async () => {
            const [j, m, p] = await Promise.all([
                UserService.getJournals(user.id),
                UserService.getMoods(user.id),
                PetService.getPet(user.id)
            ]);
            setJournals(j);
            setMoods(m);
            setLumina(p);
        };
        load();
    }, [user.id]);

    const totalPages = Math.ceil(journals.length / 2) + 1; // +1 for cover/summary page

    return (
        <div className="fixed inset-0 z-[120] bg-[#1a1a1a] flex items-center justify-center p-4 animate-in fade-in duration-700 overflow-hidden">
            {/* AMBIENT BACKGROUND */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-30 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 pointer-events-none"></div>

            {/* EXIT */}
            <button onClick={onClose} className="absolute top-8 left-8 text-white/50 hover:text-white flex items-center gap-2 transition-colors z-50">
                <ChevronLeft className="w-5 h-5" /> Return to Sanctuary
            </button>

            {/* THE BOOK */}
            <div className="relative w-full max-w-6xl aspect-[3/2] bg-[#fdfbf7] rounded-r-2xl rounded-l-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex overflow-hidden transform md:scale-95 transition-transform">
                {/* SPINE */}
                <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 z-20 shadow-inner opacity-80 mix-blend-multiply pointer-events-none"></div>

                {/* LEFT PAGE (Summary / Stats) */}
                <div className="flex-1 bg-[#fdfbf7] p-8 md:p-12 relative flex flex-col border-r border-[#e5e5e5]">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper.png')] opacity-50 mix-blend-multiply pointer-events-none"></div>

                    <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center border-4 border-double border-[#d4c5b0] p-8 m-4">
                        <div className="w-20 h-20 mb-6">
                            <Sparkles className="w-full h-full text-[#c5a065] opacity-80" />
                        </div>
                        <h1 className="font-serif text-4xl md:text-6xl text-[#2c241b] mb-4 tracking-tight">The Book<br />of You</h1>
                        <div className="w-32 h-px bg-[#c5a065] mb-4"></div>
                        <p className="font-serif text-lg text-[#5d5246] italic mb-8">Chronicling the journey of {user.name}</p>

                        <div className="grid grid-cols-2 gap-8 w-full max-w-xs text-[#2c241b]">
                            <div>
                                <div className="text-3xl font-serif font-bold">{journals.length}</div>
                                <div className="text-[10px] uppercase tracking-widest text-[#8a7f73]">Entries</div>
                            </div>
                            <div>
                                <div className="text-3xl font-serif font-bold">{moods.length}</div>
                                <div className="text-[10px] uppercase tracking-widest text-[#8a7f73]">Days Mindful</div>
                            </div>
                        </div>

                        <div className="mt-12 opacity-60">
                            {garden && (
                                <div className="flex items-center gap-2 justify-center mb-2">
                                    <Feather className="w-4 h-4 text-[#c5a065]" />
                                    <span className="font-serif text-sm text-[#5d5246]">Garden Lvl {garden.level}</span>
                                </div>
                            )}
                            {lumina && (
                                <div className="flex items-center gap-2 justify-center">
                                    <Star className="w-4 h-4 text-[#c5a065]" />
                                    <span className="font-serif text-sm text-[#5d5246]">{lumina.name} (Lvl {lumina.level})</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="text-center font-serif text-xs text-[#8a7f73] mt-4">- Volume I -</div>
                </div>

                {/* RIGHT PAGE (Content) */}
                <div className="flex-1 bg-[#fdfbf7] p-8 md:p-12 relative flex flex-col">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper.png')] opacity-50 mix-blend-multiply pointer-events-none"></div>

                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-8 border-b border-[#e5e5e5] pb-4">
                            <h2 className="font-serif text-2xl text-[#2c241b] italic">Recent Thoughts</h2>
                            <div className="flex items-center gap-2 text-[#8a7f73]">
                                <Calendar className="w-4 h-4" />
                                <span className="font-serif text-sm">{new Date().toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-4 space-y-8 scrollbar-thin scrollbar-thumb-[#d4c5b0]">
                            {journals.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                                    <Feather className="w-12 h-12 mb-4 text-[#d4c5b0]" />
                                    <p className="font-serif text-lg text-[#5d5246]">The pages are waiting for your story...</p>
                                </div>
                            ) : (
                                journals.slice(0, 3).map((entry, i) => (
                                    <div key={i} className="group">
                                        <p className="font-serif text-lg leading-relaxed text-[#2c241b] first-letter:text-4xl first-letter:font-bold first-letter:text-[#c5a065] first-letter:mr-1 first-letter:float-left">
                                            {entry.content}
                                        </p>
                                        <div className="flex justify-end mt-2">
                                            <span className="text-xs font-serif text-[#8a7f73] italic">{new Date(entry.date).toLocaleDateString()}</span>
                                        </div>
                                        {i < 2 && <div className="w-full h-px bg-[#e5e5e5] my-6"></div>}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-[#e5e5e5] flex justify-between items-center">
                            <div className="text-xs font-serif text-[#8a7f73] italic">Page 1</div>
                            <button className="flex items-center gap-2 px-4 py-2 border border-[#d4c5b0] rounded-full text-[#5d5246] hover:bg-[#efebe4] transition-colors font-serif text-sm">
                                <Download className="w-4 h-4" /> Save as PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookOfYouView;
