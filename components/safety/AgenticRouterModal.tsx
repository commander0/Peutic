import React, { useEffect, useState } from 'react';
import { Bot, Sparkles, X, ArrowRight, HeartPulse, Wind, Music } from 'lucide-react';
interface AgenticRouterModalProps {
    message: string;
    onClose: () => void;
    onAcceptAction: (action: string) => void;
}

const AgenticRouterModal: React.FC<AgenticRouterModalProps> = ({ message, onClose, onAcceptAction }) => {
    const [actionRoute, setActionRoute] = useState<'dojo' | 'breathing' | 'soundscape'>('breathing');

    useEffect(() => {
        // Determine the best route based on the AI's message context
        const msgLower = message.toLowerCase();
        if (msgLower.includes('dojo') || msgLower.includes('focus')) {
            setActionRoute('dojo');
        } else if (msgLower.includes('soundscape') || msgLower.includes('music') || msgLower.includes('rain')) {
            setActionRoute('soundscape');
        } else {
            setActionRoute('breathing');
        }
    }, [message]);

    const handleAccept = () => {
        onAcceptAction(actionRoute);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-500 font-sans">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[100px] animate-pulse-slow"></div>
            </div>

            <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-hidden">
                {/* Tech scan line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-50"></div>

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/30 blur-xl animate-pulse"></div>
                        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg border border-emerald-300/50">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                            Sanctuary Agent <Sparkles className="w-4 h-4 text-emerald-400" />
                        </h2>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-500/70">Proactive Empathy Protocol</p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 relative">
                    <div className="absolute -left-2 top-6 w-1 h-12 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
                    <p className="text-lg text-gray-200 leading-relaxed font-light">
                        "{message}"
                    </p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleAccept}
                        className="w-full relative group overflow-hidden rounded-2xl bg-white text-black font-black py-4 px-6 flex items-center justify-between hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-100 to-teal-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="relative z-10 flex items-center gap-3 text-lg">
                            {actionRoute === 'dojo' && <><Wind className="w-5 h-5 text-emerald-600" /> Enter the Zen Dojo</>}
                            {actionRoute === 'breathing' && <><HeartPulse className="w-5 h-5 text-emerald-600" /> Start Guided Breathing</>}
                            {actionRoute === 'soundscape' && <><Music className="w-5 h-5 text-emerald-600" /> Queue Healing Soundscape</>}
                        </span>
                        <ArrowRight className="w-5 h-5 relative z-10 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-4 text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors"
                    >
                        I'm Okay For Now, Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgenticRouterModal;
