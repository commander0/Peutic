import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, Volume2, VolumeX, Eye } from 'lucide-react';
import { UserService } from '../../services/userService';

interface EmergencyOverlayProps {
    userId: string;
    onClose: () => void;
}

const EmergencyOverlay: React.FC<EmergencyOverlayProps> = ({ userId, onClose }) => {
    const [mode, setMode] = useState<'breathing' | 'grounding'>('breathing');
    const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
    const [timeLeft, setTimeLeft] = useState(60);
    const [isActive, setIsActive] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [muted, setMuted] = useState(false);

    // Audio for calming effect (Rain or White Noise)
    // Using a reliable safe source
    const AUDIO_SRC = "https://assets.mixkit.co/active_storage/sfx/1196/1196-preview.mp3"; // Ocean

    useEffect(() => {
        // Start audio on mount
        const audio = new Audio(AUDIO_SRC);
        audio.loop = true;
        audio.volume = 0.5;
        audioRef.current = audio;
        audio.play().catch(e => console.warn("Auto-play blocked", e));
        return () => { audio.pause(); };
    }, []);

    useEffect(() => {
        if (audioRef.current) audioRef.current.muted = muted;
    }, [muted]);

    useEffect(() => {
        if (!isActive || mode !== 'breathing') return;

        const timer = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    setIsActive(false);
                    // Record session
                    UserService.recordBreathSession(userId, 60);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);

        // Box Breathing: 4s Inhale, 4s Hold, 4s Exhale
        const cycle = setInterval(() => {
            setPhase(p => {
                if (p === 'Inhale') return 'Hold';
                if (p === 'Hold') return 'Exhale';
                return 'Inhale';
            });
        }, 4000);

        return () => {
            clearInterval(timer);
            clearInterval(cycle);
        };
    }, [isActive, userId, mode]);

    return (
        <div className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col items-center justify-center animate-in fade-in duration-300">
            {/* Background Gradient Pulse */}
            <div className={`absolute inset-0 transition-opacity duration-[4000ms] ${phase === 'Inhale' ? 'opacity-30' : 'opacity-10'}`}
                style={{ background: 'radial-gradient(circle at center, #0ea5e9 0%, transparent 70%)' }}>
            </div>

            {/* Close Button */}
            <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-20 p-2">
                <X className="w-8 h-8" />
            </button>

            {/* Mute Button */}
            <button onClick={() => setMuted(!muted)} className="absolute top-6 left-6 text-white/50 hover:text-white transition-colors z-20 p-2">
                {muted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>

            {mode === 'breathing' ? (
                <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center">
                    {timeLeft > 0 ? (
                        <>
                            <div className="relative mb-16">
                                {/* Visual Breather */}
                                <div className={`w-72 h-72 rounded-full border-4 border-white/10 flex items-center justify-center transition-all duration-[4000ms] ease-in-out shadow-2xl
                                    ${phase === 'Inhale' ? 'scale-110 bg-[#0ea5e9]/20 shadow-[0_0_50px_rgba(14,165,233,0.3)]' :
                                        phase === 'Hold' ? 'scale-110 bg-[#0ea5e9]/30' : 'scale-90 bg-transparent'}`}>

                                    <span className="text-4xl font-black text-white tracking-widest uppercase drop-shadow-lg animate-in fade-in duration-500">
                                        {phase}
                                    </span>
                                </div>

                                {/* Orbiting Particles for visual focus */}
                                <div className={`absolute inset-0 border border-white/5 rounded-full animate-spin-slow transition-all duration-[4000ms] ${phase === 'Inhale' ? 'scale-150' : 'scale-100'}`}></div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-blue-200/60 text-xs font-bold uppercase tracking-[0.2em]">Panic Anchor Active</p>
                                <p className="text-5xl font-mono text-white font-light">{timeLeft}s</p>
                                <p className="text-white/40 text-sm mt-4">Follow the rhythm. You are safe.</p>
                            </div>

                            <button onClick={() => setMode('grounding')} className="mt-12 text-white/30 hover:text-white text-xs font-bold uppercase tracking-widest hover:underline transition-all">
                                Switch to Grounding (5-4-3-2-1)
                            </button>
                        </>
                    ) : (
                        <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                            <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
                            <h2 className="text-3xl font-black text-white mb-2">You did it.</h2>
                            <p className="text-gray-400 mb-8 max-w-xs leading-relaxed">Your heart rate is slowing down. You are back in control.</p>
                            <button onClick={onClose} className="bg-white text-black px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl">
                                Return to Sanctuary
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="relative z-10 text-center max-w-lg px-6 animate-in slide-in-from-right duration-500">
                    <h2 className="text-2xl font-black text-white mb-8 flex items-center justify-center gap-3">
                        <Eye className="w-6 h-6 text-blue-400" /> Grounding
                    </h2>

                    <div className="space-y-6 text-left">
                        {[
                            { count: 5, text: "Things you can SEE", color: "text-blue-400" },
                            { count: 4, text: "Things you can TOUCH", color: "text-green-400" },
                            { count: 3, text: "Things you can HEAR", color: "text-yellow-400" },
                            { count: 2, text: "Things you can SMELL", color: "text-orange-400" },
                            { count: 1, text: "Thing you can TASTE", color: "text-red-400" },
                        ].map((item) => (
                            <div key={item.count} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-colors cursor-pointer group">
                                <span className={`text-3xl font-black ${item.color} w-8`}>{item.count}</span>
                                <span className="text-gray-300 font-bold group-hover:text-white">{item.text}</span>
                            </div>
                        ))}
                    </div>

                    <button onClick={() => setMode('breathing')} className="mt-8 text-white/50 hover:text-white text-xs font-bold uppercase tracking-widest hover:underline">
                        Back to Breathing
                    </button>
                </div>
            )}
        </div>
    );
};

export default EmergencyOverlay;
