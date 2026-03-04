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
    const [availableVolumes, setAvailableVolumes] = useState<{ key: string, label: string }[]>([]);
    const [activeVolumeIndex, setActiveVolumeIndex] = useState(0);

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

                const volumeKeys = new Set<string>();
                const addVolumeKey = (dateStr: string) => {
                    if (!dateStr) return;
                    const d = new Date(dateStr);
                    if (!isNaN(d.getTime())) {
                        volumeKeys.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                    }
                };

                j.forEach(x => addVolumeKey(x.date));
                m.forEach(x => addVolumeKey(x.date));
                a.forEach(x => addVolumeKey(x.createdAt));

                const sortedKeys = Array.from(volumeKeys).sort().reverse();
                if (sortedKeys.length === 0) {
                    const today = new Date();
                    sortedKeys.push(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
                }

                const volumes = sortedKeys.map(key => {
                    const [yy, mm] = key.split('-');
                    const date = new Date(parseInt(yy), parseInt(mm) - 1, 1);
                    return {
                        key,
                        label: date.toLocaleString('default', { month: 'long', year: 'numeric' })
                    };
                });

                setAvailableVolumes(volumes);
            }
            setLoading(false);
        };
        loadData();
    }, []);

    if (loading) return <div className="p-12 text-center font-serif text-gray-500 animate-pulse">Consulting the archives...</div>;

    // LOCKED STATE
    if (isLocked) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-[#1e1b18]">
                {/* Ancient Library Ambient Background */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-luminosity grayscale pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b18] via-[#1e1b18]/80 to-transparent pointer-events-none"></div>

                <div className="relative z-10 bg-[#f4ebd8] p-10 md:p-12 rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-w-md w-full border-x-4 border-y border-[#d4b886] before:content-[''] before:absolute before:inset-2 before:border before:border-[#d4b886]/50 before:pointer-events-none">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-40 mix-blend-multiply pointer-events-none rounded-lg"></div>

                    <div className="relative z-20">
                        <div className="w-20 h-20 mx-auto mb-6 relative">
                            <div className="absolute inset-0 border-2 border-[#8b7355] rounded-full animate-[spin_10s_linear_infinite] opacity-50"></div>
                            <div className="absolute inset-2 border border-[#8b7355] rounded-full animate-[spin_15s_linear_infinite_reverse] opacity-30"></div>
                            <div className="w-full h-full rounded-full flex items-center justify-center bg-[#e8dcc4] shadow-inner mb-4">
                                <Lock className="w-8 h-8 text-[#5c4a3d]" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-[#3e3226] mb-3 tracking-wide drop-shadow-sm">The Ink is Setting</h2>
                        <div className="w-24 h-px bg-[#8b7355]/40 mx-auto mb-6"></div>
                        <p className="text-[#5c4a3d] mb-8 font-serif leading-relaxed italic text-sm md:text-base px-4">The Book of You requires the passage of time to weave your narrative. Allow one week for the first chapter to bind.</p>

                        <div className="inline-block px-4 py-2 bg-[#1e1b18] text-[#d4b886] text-[10px] font-bold uppercase tracking-[0.3em] rounded border border-[#8b7355]/30 shadow-lg">
                            Unlocks {user ? new Date(new Date(user.joinedAt).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() : 'in 7 Days'}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return <div className="p-12 text-center text-red-500">Please log in to view your book.</div>;

    const activeVolume = availableVolumes.length > 0 ? availableVolumes[activeVolumeIndex] : null;
    const activeKey = activeVolume?.key || '';

    const filterByVolume = (dateStr: string) => {
        if (!dateStr || !activeKey) return false;
        const d = new Date(dateStr);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === activeKey;
    };

    const currentJournals = journals.filter(x => filterByVolume(x.date));
    const currentMoods = moods.filter(x => filterByVolume(x.date));
    const currentArts = arts.filter(x => filterByVolume(x.createdAt));

    let sunPct = 50;
    let rainPct = 50;
    if (currentMoods.length > 0) {
        const sunCount = currentMoods.filter(x => x.mood && ['Happy', 'Calm', 'confetti', 'sun'].includes(x.mood)).length;
        sunPct = (sunCount / currentMoods.length) * 100;
        rainPct = 100 - sunPct;
    }
    const moodRatio = { sun: sunPct, rain: rainPct };
    const isSunny = moodRatio.sun >= moodRatio.rain;

    return (
        <div className="min-h-[100dvh] bg-[#1a1816] text-[#2c241c] p-4 md:p-10 print:p-8 print:bg-[#1a1816] relative overflow-hidden flex justify-center selection:bg-[#8b7355]/30">
            <style>{`
                @media print {
                    @page { size: landscape; margin: 0; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>

            {/* ATMOSPHERIC SURROUNDINGS */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30 mix-blend-overlay"></div>
                {isSunny ? (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,184,134,0.15),transparent_60%)]"></div>
                ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.08),transparent_60%)]"></div>
                )}
            </div>

            {/* THE TOME BINDING (MOBILE/DESKTOP CONTAINER) */}
            <div className="w-full max-w-4xl bg-[#f4ebd8] shadow-[0_30px_60px_rgba(0,0,0,0.8),inset_0_0_100px_rgba(139,115,85,0.1)] rounded-sm md:rounded-r-2xl border-l-[16px] border-[#4a3b2c] min-h-[90vh] print:shadow-xl print:w-[1000px] print:max-w-none print:mx-auto relative z-10 before:content-[''] before:absolute before:inset-2 md:before:inset-4 before:border-2 before:border-[#8b7355]/20 before:pointer-events-none overflow-hidden pb-32">

                {/* PARCHMENT TEXTURE */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-40 mix-blend-multiply pointer-events-none z-0"></div>

                {/* VIGNETTE SHADOWING */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(62,50,38,0.08)_100%)] pointer-events-none z-0"></div>

                <div className="relative z-10 px-6 py-12 md:p-20">

                    {/* COVER PAGE */}
                    <div className="text-center border-b-[3px] border-double border-[#8b7355]/30 pb-16 mb-16 break-after-page relative">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[#8b7355]/20">
                            <svg width="200" height="40" viewBox="0 0 200 40">
                                <path d="M 0,20 Q 50,-10 100,20 T 200,20" fill="none" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>

                        <div className="flex justify-center mb-10 text-[#a38051] relative">
                            <div className="absolute w-24 h-24 bg-[#d4b886]/20 rounded-full blur-2xl"></div>
                            <Sparkles className="w-12 h-12 relative z-10 drop-shadow-sm animate-pulse-slow" />
                        </div>

                        <h1 className="text-5xl md:text-7xl font-serif font-black text-[#2c241c] mb-6 tracking-tight drop-shadow-sm uppercase" style={{ fontVariantLigatures: 'common-ligatures' }}>
                            Book of You
                        </h1>

                        <div className="w-32 h-px bg-gradient-to-r from-transparent via-[#8b7355]/50 to-transparent mx-auto mb-6"></div>

                        <p className="text-lg md:text-xl text-[#5c4a3d] italic font-serif tracking-wide px-4 leading-relaxed">The living chronicle of <span className="font-bold text-[#3e3226]">{user.name}</span>.</p>

                        <div className="mt-16 text-[10px] text-[#8b7355] font-black uppercase tracking-[0.4em] font-sans flex flex-col items-center justify-center gap-6 print:hidden">
                            <div className="flex items-center gap-6 bg-[#f4ebd8] px-2 py-1.5 rounded-full border border-[#8b7355]/30 shadow-sm relative z-20">
                                <button onClick={() => setActiveVolumeIndex(Math.min(availableVolumes.length - 1, activeVolumeIndex + 1))} disabled={activeVolumeIndex === availableVolumes.length - 1} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#8b7355]/10 disabled:opacity-30 transition-all font-serif italic text-lg">&larr;</button>
                                <span className="pt-0.5 min-w-[140px] text-center">Volume &bull; {activeVolume?.label}</span>
                                <button onClick={() => setActiveVolumeIndex(Math.max(0, activeVolumeIndex - 1))} disabled={activeVolumeIndex === 0} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#8b7355]/10 disabled:opacity-30 transition-all font-serif italic text-lg">&rarr;</button>
                            </div>
                        </div>
                        <div className="hidden print:flex mt-16 text-[10px] text-[#8b7355] font-black uppercase tracking-[0.4em] font-sans items-center justify-center gap-4">
                            <span className="w-8 h-px bg-[#8b7355]/30"></span>
                            Volume &bull; {activeVolume?.label}
                            <span className="w-8 h-px bg-[#8b7355]/30"></span>
                        </div>
                    </div>

                    {/* CHAPTER 1: REFLECTIONS */}
                    <div className="mb-20">
                        <div className="flex flex-col items-center mb-12">
                            <BookOpen className="w-6 h-6 text-[#8b7355] mb-4" />
                            <h2 className="text-2xl md:text-3xl font-serif font-black text-[#2c241c] uppercase tracking-widest text-center">
                                Chapter I<br /><span className="text-[#8b7355] text-xl md:text-2xl italic normal-case tracking-normal">Reflections</span>
                            </h2>
                        </div>

                        {currentJournals.length === 0 ? <p className="text-[#a38051] italic text-center font-serif relative z-10">No reflections recorded for this bound volume.</p> : (
                            <div className="space-y-12">
                                {currentJournals.map(j => (
                                    <div key={j.id} className="relative group p-6 backdrop-blur-[2px] bg-[#ffffff]/30 rounded-sm border border-[#8b7355]/10 shadow-sm transition-all hover:bg-[#ffffff]/50 hover:shadow-md">
                                        <div className="absolute -left-[3px] top-6 w-[5px] h-12 bg-[#a38051]/60"></div>
                                        <h3 className="text-[10px] font-black text-[#8b7355] font-sans mb-3 uppercase tracking-[0.2em] border-b border-[#8b7355]/10 pb-2 inline-block">
                                            {new Date(j.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                        </h3>
                                        <p className="text-[#3e3226] leading-[2] whitespace-pre-wrap font-serif text-sm md:text-base selection:bg-[#d4b886]/40">{j.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* CHAPTER 2: EMOTIONAL CLIMATE */}
                    <div className="mb-20 break-before-page">
                        <div className="flex flex-col items-center mb-12">
                            <Heart className="w-6 h-6 text-[#8b7355] mb-4" />
                            <h2 className="text-2xl md:text-3xl font-serif font-black text-[#2c241c] uppercase tracking-widest text-center">
                                Chapter II<br /><span className="text-[#8b7355] text-xl md:text-2xl italic normal-case tracking-normal">Inner Weather</span>
                            </h2>
                        </div>

                        {/* RUSTIC VISUAL RATIO SCALE */}
                        <div className="bg-[#e8dcc4]/50 border border-[#8b7355]/20 p-8 rounded-sm mb-12 flex flex-col items-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 mix-blend-multiply pointer-events-none"></div>
                            <h3 className="font-serif italic text-[#5c4a3d] mb-8 font-bold text-center relative z-10">Dominant Climate</h3>

                            <div className="w-full max-w-sm h-3 bg-[#cfc1a7] rounded-full overflow-hidden flex relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] z-10">
                                <div className="bg-gradient-to-r from-[#d4b886] to-[#eab308] h-full transition-all duration-1000 relative" style={{ width: `${moodRatio.sun}%` }}>
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/woven.png')] opacity-30 mix-blend-overlay"></div>
                                </div>
                                <div className="bg-gradient-to-r from-[#6b7280] to-[#3b82f6]/80 h-full transition-all duration-1000 relative" style={{ width: `${moodRatio.rain}%` }}>
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/woven.png')] opacity-30 mix-blend-overlay"></div>
                                </div>
                            </div>

                            <div className="flex justify-between w-full max-w-sm mt-6 text-[10px] font-black uppercase tracking-[0.2em] z-10">
                                <div className={`flex items-center gap-2 ${isSunny ? 'text-[#a38051] scale-110' : 'text-[#8b7355]/60'} transition-all`}>
                                    <Sun className="w-4 h-4" /> Clear ({Math.round(moodRatio.sun)}%)
                                </div>
                                <div className={`flex items-center gap-2 ${!isSunny ? 'text-[#5c4a3d] scale-110' : 'text-[#8b7355]/60'} transition-all`}>
                                    Stormy ({Math.round(moodRatio.rain)}%) <CloudRain className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        {currentMoods.length === 0 && <p className="text-[#a38051] italic text-center font-serif -mt-8 mb-8 relative z-10 text-sm">No inner winds tracked for this volume.</p>}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 opacity-80 hover:opacity-100 transition-opacity relative z-10">
                            {currentMoods.slice(0, 8).map((m, i) => {
                                const isPositive = (m.mood as any) === 'confetti' || (m.mood as any) === 'Happy' || (m.mood as any) === 'Calm' || (m.mood as any) === 'sun';
                                const isNegative = (m.mood as any) === 'rain' || (m.mood as any) === 'Anxious' || (m.mood as any) === 'Sad';
                                let emoji = '😐'; // Default neutral

                                if (isPositive) {
                                    emoji = (m.mood as any) === 'confetti' ? '🎉' : (m.mood as any) === 'sun' ? '☀️' : '😊';
                                } else if (isNegative) {
                                    emoji = (m.mood as any) === 'rain' ? '🌧️' : (m.mood as any) === 'Anxious' ? '😰' : '😔';
                                }

                                return (
                                    <div key={i} className="flex flex-col items-center justify-center py-6 px-4 bg-[#ffffff]/30 border border-[#8b7355]/10 rounded-sm hover:shadow-[0_5px_15px_rgba(139,115,85,0.1)] hover:bg-[#ffffff]/50 transition-all border-b-2 border-b-transparent hover:border-b-[#d4b886]">
                                        <span className="text-3xl block mb-3 drop-shadow-sm">{emoji}</span>
                                        <div className="text-[9px] font-black uppercase text-[#8b7355] tracking-widest">{new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* CHAPTER 3: VISIONS (ART) */}
                    <div className="mb-20 break-before-page">
                        <div className="flex flex-col items-center mb-12">
                            <ImageIcon className="w-6 h-6 text-[#8b7355] mb-4" />
                            <h2 className="text-2xl md:text-3xl font-serif font-black text-[#2c241c] uppercase tracking-widest text-center">
                                Chapter III<br /><span className="text-[#8b7355] text-xl md:text-2xl italic normal-case tracking-normal">Visions</span>
                            </h2>
                        </div>
                        {currentArts.length === 0 ? <p className="text-[#a38051] italic text-center font-serif relative z-10">No visions bound to this volume.</p> : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                                {currentArts.map((a, i) => (
                                    <div key={a.id} className="break-inside-avoid group relative">
                                        <div className="absolute inset-0 bg-[#d4b886]/10 transform translate-x-1.5 translate-y-1.5 pointer-events-none rounded-sm"></div>
                                        <div className={`p-4 bg-[#ffffff]/60 border border-[#8b7355]/20 shadow-md relative z-10 transition-transform duration-700 hover:scale-[1.03] hover:z-20 ${i % 2 === 0 ? '-rotate-1' : 'rotate-[0.5deg]'}`}>
                                            <div className="aspect-[4/3] bg-black/5 overflow-hidden border border-[#8b7355]/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] mb-4">
                                                <img src={a.imageUrl} alt={a.prompt} className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:opacity-100 transition-all duration-700" />
                                            </div>
                                            <div className="text-center px-1">
                                                <p className="font-serif text-[#3e3226] italic leading-snug text-xs md:text-sm selection:bg-[#d4b886]/40 line-clamp-3" title={a.prompt}>"{a.prompt}"</p>
                                                <div className="w-8 h-px bg-[#8b7355]/30 mx-auto my-3"></div>
                                                <p className="text-[8px] text-[#8b7355] font-black uppercase tracking-[0.2em]">{new Date(a.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* FOOTER */}
                    <div className="mt-32 pt-16 border-t border-[#8b7355]/20 text-center relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#f4ebd8] px-4">
                            <svg width="40" height="20" viewBox="0 0 40 20" className="text-[#8b7355]/40 fill-current">
                                <path d="M 20,0 L 40,20 L 0,20 Z" />
                            </svg>
                        </div>
                        <p className="font-serif italic text-[#8b7355] text-sm">Chronicled by Peutic &bull; Bound in Privacy</p>

                        {/* Floating Print Button for Screen Only */}
                        <button onClick={() => window.print()} className="fixed bottom-6 md:bottom-10 right-6 md:right-10 bg-[#2c241c] hover:bg-[#4a3b2c] text-[#d4b886] p-4 md:p-5 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.5)] border border-[#8b7355]/50 hover:scale-110 transition-all print:hidden z-50 group">
                            <BookOpen className="w-6 h-6 group-hover:animate-pulse" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookOfYou;
