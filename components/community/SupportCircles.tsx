import React, { useState, useEffect } from 'react';
import { X, Users, Mic, MicOff, Shield, Radio, Sparkles, MessageSquare, HandHeart } from 'lucide-react';

interface SupportCirclesProps {
    onClose: () => void;
}

const MOCK_ROOMS = [
    { id: '1', title: 'Founder Burnout & Stress', participants: 12, host: 'AI Moderator (Dr. Thorne)', tags: ['Career', 'Anxiety'] },
    { id: '2', title: 'Navigating Grief Together', participants: 8, host: 'AI Moderator (Evelyn)', tags: ['Grief', 'Support'] },
    { id: '3', title: 'New Mothers Circle', participants: 15, host: 'AI Moderator (Sarah)', tags: ['Parenting', 'Postpartum'] },
    { id: '4', title: 'Mindful Silence (Co-Regulation)', participants: 42, host: 'Lumina (Guide)', tags: ['Meditation', 'Silent'] },
];

export const SupportCircles: React.FC<SupportCirclesProps> = ({ onClose }) => {
    const [activeRoom, setActiveRoom] = useState<typeof MOCK_ROOMS[0] | null>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [speakingUser, setSpeakingUser] = useState<string | null>(null);

    // Simulate AI Moderation
    useEffect(() => {
        if (!activeRoom) return;

        // AI speaks first
        setSpeakingUser('host');

        const cycle = setInterval(() => {
            const rand = Math.random();
            if (rand > 0.7) setSpeakingUser('host'); // AI stepping in
            else if (rand > 0.3) setSpeakingUser(`User-${Math.floor(Math.random() * 10)}`); // Random user
            else setSpeakingUser(null); // Silence
        }, 4000);

        return () => clearInterval(cycle);
    }, [activeRoom]);

    return (
        <div className="fixed inset-0 z-50 bg-[#050510] font-sans flex flex-col items-center overflow-y-auto">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="w-full max-w-5xl mx-auto p-4 md:p-8 relative z-10 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-3xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                            <Radio className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Support Circles</h1>
                            <p className="text-blue-200/60 text-xs font-bold uppercase tracking-widest">Anonymous AI-Guided Communities</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-black/40 border border-white/10 flex items-center justify-center text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {!activeRoom ? (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Lobby / Room Selection */}
                        <div className="mb-8">
                            <h2 className="text-white text-xl font-bold mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-500" /> Live Guided Sessions</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {MOCK_ROOMS.map(room => (
                                    <div
                                        key={room.id}
                                        onClick={() => setActiveRoom(room)}
                                        className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] flex flex-col justify-between min-h-[160px]"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex gap-2">
                                                    {room.tags.map(t => <span key={t} className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md text-[10px] uppercase font-bold text-blue-300 tracking-wider w-max">{t}</span>)}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold">
                                                    <Users className="w-4 h-4" /> {room.participants}
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-black text-white mb-2">{room.title}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Shield className="w-4 h-4 text-purple-400" /> Moderated by <span className="text-purple-300 font-bold">{room.host}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/20 rounded-3xl p-8 text-center flex flex-col items-center">
                            <HandHeart className="w-12 h-12 text-blue-400 mb-4" />
                            <h3 className="text-white font-black text-xl mb-2">Safe, Anonymous Space</h3>
                            <p className="text-blue-200/80 max-w-md text-sm leading-relaxed">
                                Our AI Moderators proactively manage these spaces using cognitive behavioral therapy structures, ensuring no user dominates the microphone and everyone feels heard. Your real identity is completely hidden.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col animate-in zoom-in-95 duration-500">
                        {/* Active Room UI */}
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-3xl font-black text-white">{activeRoom.title}</h2>
                                <p className="text-gray-400 text-sm flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Live Session</p>
                            </div>
                            <button onClick={() => setActiveRoom(null)} className="px-4 py-2 rounded-full border border-white/20 text-white text-xs font-bold hover:bg-white/10 uppercase tracking-widest">Leave Quietly</button>
                        </div>

                        <div className="flex-1 flex items-center justify-center relative min-h-[400px]">
                            {/* Central AI Moderator */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
                                <div className={`w-28 h-28 rounded-full border-4 border-[#050510] bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.4)] transition-all duration-300 ${speakingUser === 'host' ? 'scale-110 shadow-[0_0_80px_rgba(168,85,247,0.8)]' : ''}`}>
                                    <Shield className={`w-12 h-12 text-white ${speakingUser === 'host' ? 'animate-pulse' : ''}`} />
                                </div>
                                <div className="mt-4 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex flex-col items-center">
                                    <span className="text-white text-xs font-bold">{activeRoom.host}</span>
                                </div>
                            </div>

                            {/* Orbiting Users (Mocked) */}
                            {Array.from({ length: activeRoom.participants }).map((_, i) => {
                                const angle = (i / activeRoom.participants) * Math.PI * 2;
                                const radius = 200 + (i % 2 === 0 ? 0 : 40); // Stagger radius slightly
                                const x = Math.cos(angle) * radius;
                                const y = Math.sin(angle) * radius;
                                const isSpeaking = speakingUser === `User-${i}`;
                                const isMe = i === 0;

                                return (
                                    <div
                                        key={i}
                                        className="absolute top-1/2 left-1/2 transition-all duration-500"
                                        style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className={`w-14 h-14 rounded-full border-2 bg-gray-800 flex items-center justify-center transition-all ${isSpeaking ? 'border-green-400 scale-125 shadow-[0_0_30px_rgba(74,222,128,0.4)]' : isMe ? 'border-blue-500' : 'border-gray-700'}`}>
                                                {isSpeaking ? <MessageSquare className="w-5 h-5 text-green-400 animate-pulse" /> : <div className="w-8 h-8 rounded-full bg-gray-700"></div>}
                                            </div>
                                            <span className="mt-2 text-[9px] text-gray-500 font-bold uppercase tracking-widest">{isMe ? 'You' : `Anon_${i + 1}`}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Bottom Controls */}
                        <div className="mt-auto bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-6 flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-white font-bold text-sm">Raise Hand / Speak</span>
                                <span className="text-gray-500 text-xs">Only the Moderator can unmute you.</span>
                            </div>

                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl border ${isMuted ? 'bg-black/50 border-gray-700 text-gray-400 hover:bg-gray-800' : 'bg-green-500 border-green-400 text-black'}`}
                            >
                                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
