import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Star, Loader2 } from 'lucide-react';
import { User, JournalEntry } from '../../types';
import { useToast } from '../common/Toast';
import { UserService } from '../../services/userService';

const Typewriter = ({ text, speed = 40 }: { text: string, speed?: number }) => {
    const [displayed, setDisplayed] = useState('');

    useEffect(() => {
        setDisplayed('');
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayed((prev) => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(timer);
            }
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed]);

    return <span className="animate-in fade-in duration-300">{displayed}</span>;
};

interface ObservatoryViewProps {
    user: User;
    onClose: () => void;
}

const ObservatoryView: React.FC<ObservatoryViewProps> = ({ user, onClose }) => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'divination' | 'archive'>('divination');

    const [oracleMessage, setOracleMessage] = useState<string | null>(null);
    const [isReading, setIsReading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [path, setPath] = useState<{ x: number, y: number }[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [oracleStars, setOracleStars] = useState<{ x: number, y: number }[]>([]);

    const [journals, setJournals] = useState<JournalEntry[]>([]);
    const [isLoadingJournals, setIsLoadingJournals] = useState(false);
    const [selectedStar, setSelectedStar] = useState<JournalEntry | null>(null);
    const [starPositions, setStarPositions] = useState<{ id: string, x: number, y: number, r: number, delay: number }[]>([]);

    const audioCtxRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return () => {
            audioCtxRef.current?.close();
        };
    }, []);

    useEffect(() => {
        if (activeTab === 'archive' && journals.length === 0) {
            setIsLoadingJournals(true);
            UserService.getJournals(user.id).then(data => {
                const filtered = data.filter(j => j.content.length > 10).slice(-50);
                setJournals(filtered);

                const positions = filtered.map(j => ({
                    id: j.id,
                    x: 10 + Math.random() * 80,
                    y: 10 + Math.random() * 70,
                    r: 1.5 + Math.random() * 2,
                    delay: Math.random() * 5
                }));
                setStarPositions(positions);
                setIsLoadingJournals(false);
            });
        }
    }, [activeTab, user.id, journals.length]);

    const playMysticSound = (type: 'start' | 'reveal' | 'chime') => {
        if (!audioCtxRef.current) return;
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'start') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 2);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 1);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);
            osc.start();
            osc.stop(ctx.currentTime + 3);
        } else if (type === 'reveal') {
            const freqs = [440, 554, 659];
            freqs.forEach((f) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g);
                g.connect(ctx.destination);
                o.type = 'triangle';
                o.frequency.value = f;
                g.gain.setValueAtTime(0, ctx.currentTime);
                g.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4);
                o.start();
                o.stop(ctx.currentTime + 4);
            });
        } else if (type === 'chime') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
            osc.start();
            osc.stop(ctx.currentTime + 2);
        }
    };

    const divineInsight = async () => {
        if (isProcessing || isReading || activeTab !== 'divination') return;
        setIsProcessing(true);
        const COST = 1;

        if (user.balance < COST) {
            showToast(`The spirits require an offering of ${COST} Minutes. Play minigames to earn more!`, "error");
            setIsProcessing(false);
            return;
        }

        const success = await UserService.deductBalance(COST, 'Oracle Consultation');
        if (success) {
            setIsReading(true);
            setIsProcessing(false);
            setOracleMessage(null);
            playMysticSound('start');

            setTimeout(() => {
                const insights = [
                    "The universe whispers that your resilience is your greatest shield. A challenge that currently looms large is merely a shadow cast by a smaller object; shift your perspective and the darkness will recede.\n\n✨ Cosmic Insight: The stars align in your sector of creativity. Now is the time to build, not destroy.",
                    "A door you thought closed is merely waiting for a different key. Patience is not passive waiting, but active preparation. Clean your house, both literally and metaphorically, for a guest is coming.\n\n✨ Cosmic Insight: Energy flows where intention goes. Focus on what you want to grow.",
                    "Your energy affects those around you more than you realize; shine bright. You have been playing small to make others comfortable, but your dimness serves no one. Ignite your inner sun.\n\n✨ Cosmic Insight: A chance encounter will reveal a hidden truth about your path.",
                    "The path ahead is foggy, but your intuition is a lantern that never fails. Trust the quiet voice beneath the noise of anxiety. It knows the way home even when the map is lost.\n\n✨ Cosmic Insight: The moon phase suggests a time of release. Let go of what is heavy.",
                    "What you seek is already seeking you. Be still and let it find you. The frantic chasing has only pushed your desire further away. Become the magnet, not the hunter.\n\n✨ Cosmic Insight: Abundance is a frequency, not a destination. Tune in."
                ];
                const msg = insights[Math.floor(Math.random() * insights.length)];

                setOracleMessage(msg);
                setIsReading(false);
                setOracleStars(Array.from({ length: 12 }).map(() => ({ x: 10 + Math.random() * 80, y: 10 + Math.random() * 80 })));
                playMysticSound('reveal');

                UserService.addLuminaXP(user.id, 50).then(() => {
                    setTimeout(() => showToast("Your Lumina absorbed 50 Wisdom XP from the Oracle's energy!", "success"), 1000);
                });

            }, 3000);
        } else {
            setIsProcessing(false);
        }
    };

    const handleStarClick = (journal: JournalEntry) => {
        setSelectedStar(journal);
        playMysticSound('chime');
    };

    return (
        <div className="fixed inset-0 z-[120] bg-black text-indigo-50 flex flex-col animate-in fade-in duration-1000 overflow-hidden font-serif selection:bg-purple-500 selection:text-white">
            <style type="text/css">{`
                @keyframes drawLine { to { stroke-dashoffset: 0; } }
            `}</style>

            <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_#000000_80%)] transition-colors duration-1000 ${activeTab === 'archive' ? 'bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020617_80%)]' : ''}`}></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-40 animate-pulse-slow mix-blend-color-dodge pointer-events-none"></div>

            {activeTab === 'divination' && (
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none overflow-hidden transition-opacity duration-1000">
                    <svg viewBox="0 0 100 100" className="w-[150vw] h-[150vw] md:w-[100vw] md:h-[100vw] animate-[spin_120s_linear_infinite]">
                        <circle cx="50" cy="50" r="48" fill="none" stroke="#eab308" strokeWidth="0.5" strokeDasharray="4 8" />
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#eab308" strokeWidth="0.2" />
                        <polygon points="50,2 98,75 2,75" fill="none" stroke="#eab308" strokeWidth="0.3" />
                        <polygon points="50,98 98,25 2,25" fill="none" stroke="#eab308" strokeWidth="0.3" />
                        <rect x="15" y="15" width="70" height="70" fill="none" stroke="#eab308" strokeWidth="0.2" transform="rotate(45 50 50)" />
                    </svg>
                </div>
            )}

            {activeTab === 'divination' && oracleMessage && !isReading && (
                <div className="absolute inset-0 z-0 pointer-events-none mix-blend-screen">
                    <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-[3000ms]"></div>
                    <svg className="absolute inset-0 w-full h-full opacity-80 animate-in fade-in duration-[4000ms]">
                        <defs><filter id="oGlow"><feGaussianBlur stdDeviation="2" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
                        {oracleStars.map((s, i) => (
                            <circle key={`ostar-${i}`} cx={`${s.x}%`} cy={`${s.y}%`} r={Math.random() * 2 + 1.5} fill="#ffffff" filter="url(#oGlow)" className="animate-pulse-slow" style={{ animationDelay: `${Math.random() * 2}s` }} />
                        ))}
                    </svg>
                </div>
            )}

            <header className="relative z-50 p-6 flex items-center justify-center border-b border-indigo-900/30 bg-black/50 backdrop-blur-md">
                <div className="flex bg-indigo-950/40 rounded-full p-1 border border-indigo-800/50">
                    <button
                        onClick={() => setActiveTab('divination')}
                        className={`px-6 py-2 rounded-full text-xs font-sans uppercase tracking-widest font-bold transition-all ${activeTab === 'divination' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'text-indigo-400 hover:text-indigo-200'}`}
                    >
                        The Oracle
                    </button>
                    <button
                        onClick={() => setActiveTab('archive')}
                        className={`px-6 py-2 rounded-full text-xs font-sans uppercase tracking-widest font-bold transition-all flex items-center gap-2 ${activeTab === 'archive' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'text-indigo-400 hover:text-indigo-200'}`}
                    >
                        <Sparkles className="w-3 h-3" /> Archive of Triumphs
                    </button>
                </div>
                <button onClick={onClose} className="absolute right-6 p-4 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/5 group">
                    <X className="w-5 h-5 text-indigo-300 group-hover:text-white transition-colors" />
                </button>
            </header>

            {/* TAB CONTENT: ARCHIVE OF TRIUMPHS */}
            {activeTab === 'archive' && (
                <main className="flex-1 relative w-full h-full overflow-hidden flex items-center justify-center animate-in fade-in zoom-in-95 duration-700">

                    {isLoadingJournals ? (
                        <div className="flex flex-col items-center gap-4 animate-pulse">
                            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                            <p className="text-blue-300 font-sans text-xs uppercase tracking-widest">Mapping Constellations...</p>
                        </div>
                    ) : (
                        <>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-60 mix-blend-color-dodge pointer-events-none animate-[spin_120s_linear_infinite]"></div>
                            <div className="absolute -inset-[100%] bg-gradient-to-tr from-blue-900/0 via-purple-600/10 to-indigo-900/0 opacity-50 blur-[100px] pointer-events-none animate-[pulse_10s_ease-in-out_infinite_alternate]"></div>
                            <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-fuchsia-600/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none animate-pulse-slow"></div>
                            <div className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

                            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                <defs>
                                    <filter id="starGlowArchive"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                                </defs>
                                {starPositions.map((pos, i) => {
                                    if (i === starPositions.length - 1) return null;
                                    const next = starPositions[i + 1];
                                    const dist = Math.hypot(next.x - pos.x, next.y - pos.y);
                                    if (dist > 35) return null;
                                    return (
                                        <line key={`pline-${i}`} x1={`${pos.x}%`} y1={`${pos.y}%`} x2={`${next.x}%`} y2={`${next.y}%`} stroke="#8b5cf6" strokeWidth="1" strokeOpacity="0.35" filter="url(#starGlowArchive)" className="animate-pulse-slow" />
                                    );
                                })}
                            </svg>
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {[...Array(5)].map((_, i) => (
                                    <div key={`shooting-${i}`} className="absolute h-px w-24 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 rotate-45"
                                        style={{
                                            left: `${Math.random() * 100}%`,
                                            top: `${Math.random() * 50}%`,
                                            animation: `shooting 4s cubic-bezier(0.4, 0, 1, 1) infinite ${Math.random() * 10}s`
                                        }}
                                    />
                                ))}
                            </div>
                            <style type="text/css">{`
                                @keyframes shooting {
                                    0% { transform: translate(0, 0) rotate(45deg) scaleX(0); opacity: 0; }
                                    5% { opacity: 1; }
                                    10% { transform: translate(300px, 300px) rotate(45deg) scaleX(1); opacity: 0; }
                                    100% { opacity: 0; }
                                }
                            `}</style>

                            {starPositions.map((pos) => {
                                const journal = journals.find(j => j.id === pos.id);
                                if (!journal) return null;

                                const isSelected = selectedStar?.id === pos.id;

                                return (
                                    <div
                                        key={pos.id}
                                        className={`absolute w-12 h-12 -ml-6 -mt-6 rounded-full flex items-center justify-center cursor-pointer group transition-all duration-500 hover:scale-150 z-10 ${isSelected ? 'scale-[2.5] z-30' : ''}`}
                                        style={{ left: `${pos.x}%`, top: `${pos.y}%`, animation: `pulse ${4 + pos.delay}s infinite alternate` }}
                                        onClick={() => handleStarClick(journal)}
                                    >
                                        <div className={`w-3 h-3 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,1)] transition-all ${isSelected ? 'shadow-[0_0_50px_rgba(167,139,250,1)] bg-purple-100 scale-[2]' : 'group-hover:shadow-[0_0_30px_rgba(167,139,250,1)] group-hover:bg-purple-50'}`} style={{ width: pos.r * 2.5, height: pos.r * 2.5 }}></div>
                                        {!isSelected && (
                                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[10px] font-sans tracking-widest text-blue-200 bg-blue-900/50 backdrop-blur-md px-2 py-1 rounded border border-blue-500/20 pointer-events-none">
                                                {new Date(journal.date).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {journals.length === 0 && !isLoadingJournals && (
                                <div className="text-blue-300/50 font-serif italic text-lg z-10">
                                    Your sky is empty. Write in your journal to forge stars.
                                </div>
                            )}

                            {selectedStar && (
                                <div className="absolute bottom-10 left-10 right-10 md:left-1/2 md:-translate-x-1/2 md:w-[500px] bg-indigo-950/80 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(37,99,235,0.2)] z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
                                    <button onClick={() => setSelectedStar(null)} className="absolute top-4 right-4 text-blue-300 hover:text-white transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                        <span className="font-sans text-xs uppercase tracking-widest font-bold text-blue-200">Echo of {new Date(selectedStar.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-indigo-50 font-serif leading-relaxed text-sm md:text-base selection:bg-blue-500/30">
                                        "{selectedStar.content}"
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </main>
            )}

            {/* TAB CONTENT: DIVINATION */}
            {activeTab === 'divination' && (
                <main className="flex-1 flex flex-col items-center justify-center relative z-10 perspective-[1200px] w-full max-w-md mx-auto h-full animate-in fade-in duration-500">
                    <div className="relative flex flex-col items-center justify-center mt-20">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[120%] md:-translate-y-[130%] flex flex-col items-center pointer-events-none">
                            <div className={`w-36 h-48 md:w-44 md:h-56 bg-gradient-to-b from-stone-900 via-indigo-950 to-purple-900 rounded-[40%_40%_60%_60%] blur-[2px] shadow-[0_0_30px_rgba(0,0,0,0.8)] relative overflow-hidden group transition-all duration-[3000ms] ${isReading ? 'scale-105' : ''}`}>
                                <div className={`absolute top-1/3 left-1/4 w-4 h-2 bg-indigo-400 rounded-full blur-[2px] transition-all duration-1000 ${isReading ? 'opacity-100 animate-pulse scale-110 drop-shadow-[0_0_15px_rgba(129,140,248,1)]' : 'opacity-20'} `}></div>
                                <div className={`absolute top-1/3 right-1/4 w-4 h-2 bg-indigo-400 rounded-full blur-[2px] transition-all duration-1000 ${isReading ? 'opacity-100 animate-pulse scale-110 drop-shadow-[0_0_15px_rgba(129,140,248,1)]' : 'opacity-20'} `}></div>
                                <div className="absolute inset-x-2 top-[30%] bottom-0 bg-black/90 rounded-[50%_50%_0_0] blur-md"></div>
                            </div>
                            <div className={`w-72 h-32 md:w-96 md:h-40 bg-gradient-to-b from-purple-950 via-stone-900/80 to-transparent rounded-[50%_50%_0_0] -mt-12 md:-mt-16 blur-md transition-all duration-[3000ms] ${isReading ? 'opacity-80' : 'opacity-50'}`}></div>
                        </div>

                        <div className={`absolute -left-12 md:-left-24 top-1/3 w-20 h-40 md:w-28 md:h-48 bg-gradient-to-b from-stone-900 via-indigo-950 to-purple-900 rounded-[50%_50%_40%_40%_/_70%_70%_30%_30%] blur-[2px] shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all duration-[2000ms] ease-in-out z-10 pointer-events-none ${isReading ? 'translate-x-[40px] md:translate-x-[70px] -translate-y-8 rotate-[45deg] opacity-100 drop-shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'rotate-[20deg] opacity-40'}`}></div>
                        <div className={`absolute -right-12 md:-right-24 top-1/3 w-20 h-40 md:w-28 md:h-48 bg-gradient-to-b from-stone-900 via-indigo-950 to-purple-900 rounded-[50%_50%_40%_40%_/_70%_70%_30%_30%] blur-[2px] shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all duration-[2000ms] ease-in-out z-10 pointer-events-none ${isReading ? '-translate-x-[40px] md:-translate-x-[70px] -translate-y-8 -rotate-[45deg] opacity-100 drop-shadow-[0_0_20px_rgba(79,70,229,0.4)]' : '-rotate-[20deg] opacity-40'}`}></div>

                        <div
                            className={`relative group w-72 h-72 md:w-96 md:h-96 rounded-full transition-all duration-[2000ms] ${isReading ? 'scale-110 drop-shadow-[0_0_50px_rgba(79,70,229,0.5)]' : 'hover:scale-105 cursor-crosshair'} z-20 touch-none`}
                            onPointerDown={(e) => {
                                if (isProcessing || isReading || oracleMessage) return;
                                e.currentTarget.setPointerCapture(e.pointerId);
                                setIsDrawing(true);
                                setPath([]);
                            }}
                            onPointerMove={(e) => {
                                if (!isDrawing || isProcessing || isReading || oracleMessage) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                                setPath(prev => {
                                    const newPath = [...prev, pt];
                                    if (newPath.length > 40) {
                                        setIsDrawing(false);
                                        divineInsight();
                                        return [];
                                    }
                                    return newPath;
                                });
                            }}
                            onPointerUp={(e) => {
                                setIsDrawing(false);
                                e.currentTarget.releasePointerCapture(e.pointerId);
                                setPath([]);
                            }}
                            onPointerLeave={() => { setIsDrawing(false); setPath([]); }}
                        >
                            <div className={`absolute -inset-10 bg-indigo-600/20 rounded-full blur-3xl transition-opacity duration-1000 pointer-events-none ${isReading ? 'opacity-100 animate-pulse-fast' : 'opacity-30'}`}></div>

                            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,_rgba(255,255,255,0.1)_0%,_rgba(79,70,229,0.05)_20%,_rgba(0,0,0,0.9)_90%)] shadow-[inset_0_0_80px_rgba(0,0,0,0.9),inset_10px_10px_20px_rgba(255,255,255,0.05),0_0_50px_rgba(79,70,229,0.2)] border border-indigo-500/10 backdrop-blur-[1px] overflow-hidden z-20 pointer-events-none">
                                <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/foggy-birds.png')] mix-blend-color-dodge transition-transform duration-[20s] ease-linear ${isReading ? 'animate-[spin_4s_linear_infinite] scale-150 opacity-80' : 'animate-[spin_30s_linear_infinite] scale-125 opacity-20'}`}></div>
                                <div className={`absolute inset-0 bg-gradient-to-tr from-indigo-900/0 via-purple-500/10 to-indigo-900/0 mix-blend-overlay ${isReading ? 'animate-pulse' : ''}`}></div>
                                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-indigo-500 rounded-full blur-[50px] mix-blend-screen transition-all duration-500 ${isReading ? 'scale-150 opacity-80' : 'scale-100 opacity-30 animate-pulse-slow'}`}></div>

                                {oracleMessage && !isReading && (
                                    <div className="absolute inset-0 rounded-full border-[3px] border-indigo-400 animate-[ping_1.5s_ease-out_forwards] opacity-0 mix-blend-screen z-20"></div>
                                )}

                                {oracleMessage && !isReading && (
                                    <div className="absolute inset-0 flex items-center justify-center p-6 md:p-12 text-center z-30 bg-indigo-950/50 backdrop-blur-xl overflow-y-auto rounded-full custom-scrollbar shadow-[inset_0_0_60px_rgba(30,27,75,0.9),0_0_30px_rgba(99,102,241,0.5)] border-2 border-indigo-500/30 animate-in zoom-in-90 duration-700 pointer-events-auto">
                                        <div className="w-full text-transparent bg-clip-text bg-gradient-to-br from-amber-50 via-yellow-200 to-amber-600 font-serif leading-relaxed drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] tracking-wide italic text-sm md:text-base px-4 py-4 whitespace-pre-wrap">
                                            <Typewriter text={oracleMessage} speed={30} />
                                        </div>
                                    </div>
                                )}

                                {isReading && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
                                        <Sparkles className="w-16 h-16 text-indigo-200 animate-spin-slow opacity-90 drop-shadow-[0_0_25px_rgba(255,255,255,0.8)]" />
                                        <span className="mt-4 text-[10px] uppercase tracking-[0.3em] text-indigo-200/60 animate-pulse">Divining...</span>
                                    </div>
                                )}

                                {!isReading && !oracleMessage && path.length > 0 && (
                                    <svg className="absolute inset-0 w-full h-full z-40 pointer-events-none">
                                        <defs><filter id="sigilGlow"><feGaussianBlur stdDeviation="3" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
                                        <polyline points={path.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#a855f7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#sigilGlow)" className="opacity-80 mix-blend-screen" />
                                    </svg>
                                )}
                            </div>
                            <div className="absolute top-8 left-12 w-32 h-16 bg-gradient-to-b from-white/20 to-transparent rounded-[100%] blur-md -rotate-45 pointer-events-none z-30 mix-blend-overlay"></div>
                        </div>

                        <div className="w-40 h-12 bg-gradient-to-b from-stone-900 via-black to-transparent rounded-[100%] relative -mt-6 z-10 flex items-center justify-center shadow-2xl pointer-events-none">
                            <div className="w-24 h-1 bg-indigo-500/50 blur-[4px] absolute top-0 animate-pulse"></div>
                        </div>

                        <div className="mt-16 relative z-40 transition-all duration-500 text-center">
                            {!isReading && !oracleMessage && (
                                <div className="flex flex-col items-center gap-3">
                                    <span className="font-serif italic text-indigo-300 text-lg tracking-wide drop-shadow-md">Draw a sigil upon the orb to cast your fate.</span>
                                    <span className="text-[10px] font-mono tracking-widest uppercase text-indigo-500/80">Cost: 1 Minute</span>
                                </div>
                            )}

                            {oracleMessage && !isReading && (
                                <button onClick={() => setOracleMessage(null)} className="text-indigo-500/50 hover:text-indigo-300 text-xs uppercase tracking-[0.2em] transition-colors animate-pulse hover:animate-none">
                                    Clear Vision
                                </button>
                            )}
                        </div>
                    </div>
                </main>
            )}

        </div>
    );
};

export default ObservatoryView;
