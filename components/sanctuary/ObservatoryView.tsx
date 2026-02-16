import React, { useState, useEffect } from 'react';
import { X, Moon, Star, Sparkles, User as UserIcon, Calendar, Zap, Wind } from 'lucide-react';
import { User } from '../../types';
import { useToast } from '../common/Toast';
import { UserService } from '../../services/userService';
import { SanctuaryService, DreamLog } from '../../services/SanctuaryService';

interface ObservatoryViewProps {
    user: User;
    onClose: () => void;
}

const ObservatoryView: React.FC<ObservatoryViewProps> = ({ user, onClose }) => {
    const { showToast } = useToast();
    const [dreamLog, setDreamLog] = useState('');
    const [lucidity, setLucidity] = useState(1); // 1-5
    const [history, setHistory] = useState<DreamLog[]>([]);
    const [oracleMessage, setOracleMessage] = useState('');

    useEffect(() => {
        loadHistory();
        divineInsight();
    }, [user.id]);

    const loadHistory = async () => {
        const logs = await SanctuaryService.getDreamHistory(user.id);
        setHistory(logs);
    };

    const divineInsight = () => {
        // Cold Reading Logic
        const hour = new Date().getHours();
        const isNight = hour >= 20 || hour < 6;
        const streak = user.streak || 0;
        const balance = user.balance || 0;
        const joinDate = new Date(user.joinedAt);
        const daysSinceJoin = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));

        let insight = "";

        if (streak > 7) {
            insight = "I sense a powerful dedication within you. The stars align to reward your persistence.";
        } else if (streak === 0) {
            insight = "The path has been quiet, but the cosmos welcomes your return. Begin anew.";
        } else {
            insight = "Momentum gathers around your spirit. Continue, and the universe shall yield its secrets.";
        }

        if (balance > 100) {
            insight += " Abundance flows through your timeline, a sign of preparation for great journeys.";
        }

        if (daysSinceJoin > 30) {
            insight += ` You have walked this path for ${daysSinceJoin} cycles. Your aura has grown stronger.`;
        }

        if (isNight) {
            insight += " The veil is thin tonight. Your dreams may carry messages from the deep.";
        } else {
            insight += " Even in the light of day, the stars watch over your endeavors.";
        }

        setOracleMessage(insight);
    };

    const handleLogDream = async () => {
        if (!dreamLog.trim()) {
            showToast("Please describe your dream first.", "info");
            return;
        }

        const success = await SanctuaryService.saveDream(user.id, dreamLog, lucidity, 'Restful');
        if (success) {
            await UserService.deductBalance(0, 'Dream Log Reward');
            showToast("Dream archived in the Cosmic Library. (+20 XP)", "success");
            setDreamLog('');
            loadHistory(); // Refresh
        } else {
            showToast("Failed to archive dream.", "error");
        }
    };

    return (
        <div className="fixed inset-0 z-[120] bg-[#0c0a1f] text-indigo-50 flex flex-col animate-in fade-in duration-1000 overflow-hidden font-serif">
            {/* MYSTICAL AMBIENCE */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-40 pointer-events-none animate-pulse-slow"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1a1638]/50 to-[#0c0a1f] pointer-events-none"></div>

            {/* FLOATING ORBS */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] animate-float opacity-50 pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-[80px] animate-float-delayed opacity-50 pointer-events-none"></div>

            {/* HEADER */}
            <header className="relative z-10 px-8 py-6 flex justify-between items-center bg-black/10 backdrop-blur-sm border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors group">
                        <X className="w-6 h-6 text-indigo-300 group-hover:text-white transition-colors" />
                    </button>
                    <div>
                        <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-[0.3em] flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-200 drop-shadow-[0_0_10px_rgba(165,180,252,0.5)]">
                            <Moon className="w-6 h-6 text-indigo-300 animate-pulse" /> The Oracle
                        </h2>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.4em] ml-1">Guardian of Dreams & Fate</p>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative z-10">
                <div className="max-w-6xl mx-auto space-y-10">

                    {/* ORACLE'S INSIGHT (COLD READING) */}
                    <div className="relative group perspective-1000">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl opacity-30 group-hover:opacity-60 blur-xl transition-opacity duration-700 animate-tilt"></div>
                        <div className="relative bg-[#131129]/80 backdrop-blur-xl border border-white/10 p-8 lg:p-10 rounded-3xl shadow-2xl text-center overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
                            <Sparkles className="w-8 h-8 text-indigo-300 mx-auto mb-4 animate-spin-slow opacity-80" />
                            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-indigo-300 mb-4">Cosmic Insight</h3>
                            <p className="text-lg md:text-2xl font-serif italic text-indigo-100/90 leading-relaxed drop-shadow-md">
                                "{oracleMessage}"
                            </p>
                            <div className="mt-6 flex justify-center gap-8 text-[10px] uppercase tracking-widest text-indigo-400/60 font-medium">
                                <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {user.name}</span>
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Cycle {Math.floor((Date.now() - new Date(user.joinedAt).getTime()) / (1000 * 60 * 60 * 24))}</span>
                                <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Energy: High</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                        {/* LEFT: DREAM ARCHIVE */}
                        <div className="space-y-6">
                            <div className="bg-[#131129]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-indigo-500/30 transition-colors duration-500">
                                <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-200 mb-6 flex items-center gap-2">
                                    <Star className="w-4 h-4 fill-indigo-200" /> Archive Dream
                                </h3>
                                <textarea
                                    value={dreamLog}
                                    onChange={(e) => setDreamLog(e.target.value)}
                                    placeholder="Describe the visions that came to you in the night..."
                                    className="w-full h-48 bg-black/30 border border-indigo-500/20 rounded-xl p-5 text-indigo-100 placeholder:text-indigo-600/50 outline-none focus:border-indigo-400/50 focus:bg-black/50 transition-all font-serif italic text-lg resize-none shadow-inner"
                                />

                                <div className="mt-6 flex flex-col md:flex-row items-center gap-6">
                                    <div className="w-full space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                            <span>Clarity (Lucidity)</span>
                                            <span className="text-white">{lucidity}/5</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="5" step="1"
                                            value={lucidity} onChange={(e) => setLucidity(Number(e.target.value))}
                                            className="w-full h-1 bg-indigo-900 rounded-full appearance-none accent-indigo-400 cursor-pointer"
                                        />
                                    </div>
                                    <button
                                        onClick={handleLogDream}
                                        className="w-full md:w-auto whitespace-nowrap bg-indigo-600/80 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all active:scale-95 border border-indigo-400/30"
                                    >
                                        Seal Memory
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: HISTORY SCROLL */}
                        <div className="space-y-6 max-h-[600px] overflow-hidden flex flex-col">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-300/80 px-2 flex items-center gap-2">
                                <Wind className="w-4 h-4" /> Past Visions
                            </h3>
                            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-10">
                                {history.length === 0 ? (
                                    <div className="p-10 text-center border border-dashed border-white/10 rounded-2xl">
                                        <p className="text-indigo-500/50 italic text-sm font-serif">The archives are silent. Record your first dream.</p>
                                    </div>
                                ) : (
                                    history.map(log => (
                                        <div key={log.id} className="relative p-6 bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/5 hover:border-indigo-500/30 hover:bg-white/10 transition-all cursor-pointer group">
                                            <div className="absolute top-4 right-4 text-indigo-500/30 group-hover:text-indigo-400 transition-colors">
                                                <Star className="w-4 h-4" />
                                            </div>
                                            <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mb-2 block opacity-70">
                                                {new Date(log.createdAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                            </span>
                                            <p className="text-base text-indigo-100/90 font-serif leading-relaxed italic line-clamp-3 group-hover:line-clamp-none transition-all">
                                                "{log.content}"
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ObservatoryView;
