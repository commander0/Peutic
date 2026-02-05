import React, { useState, useEffect } from 'react';
import { X, Moon, Star, BarChart2 } from 'lucide-react';
import { User } from '../../types';
import { useToast } from '../common/Toast';
import { UserService } from '../../services/userService';

interface ObservatoryViewProps {
    user: User;
    onClose: () => void;
}

const ObservatoryView: React.FC<ObservatoryViewProps> = ({ user, onClose }) => {
    const { showToast } = useToast();
    const [dreamLog, setDreamLog] = useState('');
    const [sleepHours, setSleepHours] = useState(7);
    const [sleepQuality, setSleepQuality] = useState<'Restful' | 'Average' | 'Poor'>('Restful');
    const [lucidity, setLucidity] = useState(1); // 1-5

    const handleLogDream = async () => {
        if (!dreamLog.trim()) {
            showToast("Please describe your dream first.", "info");
            return;
        }
        // Mock save - in production this would hit a 'dreams' table
        // For now we simulate an XP reward
        if (await UserService.saveJournal(user.id, `[DREAM] ${dreamLog}`)) {
            await UserService.deductBalance(0, 'Dream Log Reward');
            showToast("Dream cataloged in the Starlight Archives. (+20 XP)", "success");
            setDreamLog('');
        }
    };

    return (
        <div className="fixed inset-0 z-[120] bg-indigo-950 text-white flex flex-col animate-in fade-in duration-700 overflow-hidden">
            {/* AMBIENCE */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black via-indigo-900/50 to-indigo-950 pointer-events-none"></div>

            {/* PARTICLES */}
            {[...Array(20)].map((_, i) => (
                <div key={i} className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        opacity: Math.random(),
                        animationDelay: `${Math.random() * 5}s`
                    }}></div>
            ))}

            {/* HEADER */}
            <header className="relative z-10 px-6 py-6 flex justify-between items-center bg-black/20 backdrop-blur-md border-b border-white/10">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6 text-indigo-300" />
                    </button>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <Moon className="w-5 h-5 text-indigo-400" /> Observatory
                        </h2>
                        <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Starlight Dream Tracker</p>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 overflow-y-auto p-6 relative z-10">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* LEFT: DREAM LOG */}
                    <div className="space-y-6">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-200 mb-4 flex items-center gap-2">
                                <Star className="w-4 h-4" /> Log Tonight's Dream
                            </h3>
                            <textarea
                                value={dreamLog}
                                onChange={(e) => setDreamLog(e.target.value)}
                                placeholder="I was flying over a neon city..."
                                className="w-full h-40 bg-black/40 border border-indigo-500/30 rounded-xl p-4 text-indigo-100 placeholder:text-indigo-500/50 outline-none focus:border-indigo-400 transition-all font-serif resize-none"
                            />

                            <div className="mt-4 flex items-center gap-4">
                                <div className="space-y-2 flex-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Lucidity Level</label>
                                    <input
                                        type="range" min="1" max="5" step="1"
                                        value={lucidity} onChange={(e) => setLucidity(Number(e.target.value))}
                                        className="w-full accent-indigo-400 cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[8px] text-indigo-500 uppercase font-bold">
                                        <span>Foggy</span>
                                        <span>Vivid</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogDream}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-indigo-900/50 transition-all active:scale-95"
                                >
                                    Archive
                                </button>
                            </div>
                        </div>

                        {/* RECENT DREAMS LIST (Mock) */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 px-2">Recent Archives</h3>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                                <span className="text-[10px] text-indigo-400 font-mono mb-1 block">Yesterday</span>
                                <p className="text-sm text-indigo-100 line-clamp-2 opacity-80 group-hover:opacity-100">Walking through a forest of giant mushrooms that glowed...</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                                <span className="text-[10px] text-indigo-400 font-mono mb-1 block">2 Days Ago</span>
                                <p className="text-sm text-indigo-100 line-clamp-2 opacity-80 group-hover:opacity-100">Chasing a train I could never catch, but I wasn't scared...</p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: SLEEP METRICS */}
                    <div className="space-y-6">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-200 mb-6 flex items-center gap-2">
                                <BarChart2 className="w-4 h-4" /> Sleep Patterns
                            </h3>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-black/20 p-4 rounded-2xl text-center">
                                    <div className="text-3xl font-black text-white mb-1">{sleepHours}h</div>
                                    <div className="text-[9px] uppercase tracking-widest text-indigo-400 font-bold">Avg Duration</div>
                                </div>
                                <div className="bg-black/20 p-4 rounded-2xl text-center">
                                    <div className="text-3xl font-black text-emerald-400 mb-1">85%</div>
                                    <div className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold">Quality Score</div>
                                </div>
                            </div>

                            <div className="h-48 flex items-end justify-between gap-2 px-2 pb-2 border-b border-white/10">
                                {[6, 7, 5, 8, 7, 7.5, 8].map((h, i) => (
                                    <div key={i} className="relative group w-full bg-indigo-500/20 hover:bg-indigo-500/40 rounded-t-lg transition-all" style={{ height: `${(h / 10) * 100}%` }}>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-white text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">{h}h</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-2 text-[9px] font-black uppercase text-indigo-500 tracking-widest">
                                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                            </div>
                        </div>

                        {/* SLEEP QUALITY INPUT */}
                        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-3xl p-6 border border-white/10">
                            <h3 className="text-xs font-black uppercase tracking-widest text-white mb-4">How did you sleep?</h3>
                            <div className="flex justify-between gap-2">
                                {(['Restful', 'Average', 'Poor'] as const).map(q => (
                                    <button
                                        key={q}
                                        onClick={() => setSleepQuality(q)}
                                        className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all ${sleepQuality === q ? 'bg-white text-indigo-900 border-white' : 'bg-transparent text-indigo-300 border-indigo-700 hover:border-white/50'}`}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ObservatoryView;
