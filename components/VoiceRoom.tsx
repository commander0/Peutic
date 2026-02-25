import React, { useEffect, useState, useRef } from 'react';
import { Companion } from '../types';
import { Mic, MicOff, PhoneOff, Camera, Image as ImageIcon, Volume2, Loader2, Focus } from 'lucide-react';
import { UserService } from '../services/userService';
import { generateCompanionResponse } from '../services/geminiService';
import { useToast } from './common/Toast';

interface VoiceRoomProps {
    companion: Companion;
    onEndSession: () => void;
    userName: string;
    userId: string;
}

export const VoiceRoom: React.FC<VoiceRoomProps> = ({ companion, onEndSession }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [isAIThinking, setIsAIThinking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [voiceActivity, setVoiceActivity] = useState<number>(0);
    const [aiActivity, setAiActivity] = useState<number>(0);

    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const sessionTimerRef = useRef<NodeJS.Timeout>();

    // Audio Visualizer Loops
    useEffect(() => {
        // User Voice Simulation (when not muted and not thinking)
        const userAudioLoop = setInterval(() => {
            if (!isMuted && isListening && !isAIThinking) {
                setVoiceActivity(Math.random() * 40 + 10);
            } else {
                setVoiceActivity(0);
            }
        }, 100);

        // AI Voice Simulation (when speaking)
        const aiAudioLoop = setInterval(() => {
            if (isAIThinking) {
                setAiActivity(Math.random() * 60 + 20);
            } else {
                setAiActivity((prev) => Math.max(0, prev - 10));
            }
        }, 80);

        return () => {
            clearInterval(userAudioLoop);
            clearInterval(aiAudioLoop);
        };
    }, [isMuted, isListening, isAIThinking]);

    // Session Timer & Billing
    useEffect(() => {
        sessionTimerRef.current = setInterval(() => {
            setDuration(d => {
                const nd = d + 1;
                if (nd % 60 === 0) {
                    UserService.deductBalance(1);
                    const user = UserService.getUser();
                    if (user && user.balance <= 0) {
                        showToast("Out of credits.", "error");
                        onEndSession();
                    }
                }
                return nd;
            });
        }, 1000);

        return () => clearInterval(sessionTimerRef.current);
    }, [onEndSession, showToast]);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
                showToast("Visual Context linked. Companion can now see this.", "success");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSimulatedSubmit = async () => {
        if (!transcript.trim() && !uploadedImage) return;

        setIsListening(false);
        setIsAIThinking(true);

        // Mock processing delay for realism
        await new Promise(r => setTimeout(r, 1500));

        let context = transcript;
        if (uploadedImage) {
            context += ` [USER UPLOADED AN IMAGE AS VISUAL CONTEXT]`;
        }

        try {
            // Send to GenAI Service for companion reply
            await generateCompanionResponse(companion.name, [{ role: 'user', content: context }]);
            // Normally we'd output the TTS audio here.
        } catch (e) {
            console.error(e);
        }

        setTimeout(() => {
            setIsAIThinking(false);
            setTranscript('');
            setUploadedImage(null); // Clear context after they "talk" about it
            setIsListening(true); // Auto-resume listening
        }, 3000);
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-between font-sans">
            {/* Immersive Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Abstract animated color blobs based on AI and User activity */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[100px] transition-all duration-300 ease-linear mix-blend-screen opacity-50"
                    style={{
                        background: isAIThinking ? 'radial-gradient(circle, rgba(59,130,246,0.8) 0%, rgba(37,99,235,0) 70%)' : 'radial-gradient(circle, rgba(234,179,8,0.3) 0%, rgba(202,138,4,0) 70%)',
                        transform: `translate(-50%, -50%) scale(${1 + aiActivity / 100})`
                    }}
                ></div>
            </div>

            {/* Header / Top Bar */}
            <div className="w-full flex justify-between items-center p-6 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-white font-mono font-bold tracking-widest">{formatTime(duration)}</span>
                </div>
                <div className="px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-md bg-white/5 flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">{isAIThinking ? 'Companion Speaking' : 'Streaming Voice Active'}</span>
                    {isAIThinking && <Volume2 className="w-4 h-4 text-blue-400 animate-pulse" />}
                </div>
                <button onClick={onEndSession} className="w-10 h-10 rounded-full bg-white/10 hover:bg-red-500 hover:text-white flex flex-col items-center justify-center transition-colors">
                    <PhoneOff className="w-4 h-4 text-gray-300" />
                </button>
            </div>

            {/* Central Visualizer Area */}
            <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10 gap-12">

                {/* Visual Context Preview Hub */}
                {uploadedImage && (
                    <div className="absolute top-0 right-8 animate-in slide-in-from-right-10 fade-in duration-500">
                        <div className="p-2 backdrop-blur-xl bg-white/5 border border-white/20 rounded-2xl flex flex-col items-end gap-2 shadow-2xl">
                            <span className="text-[8px] font-black uppercase text-blue-400 tracking-widest bg-blue-500/10 px-2 py-1 rounded-full"><Focus className="w-3 h-3 inline mr-1" /> Vision Active</span>
                            <img src={uploadedImage} alt="Context" className="w-32 h-32 object-cover rounded-xl border border-white/10" />
                        </div>
                    </div>
                )}

                <div className="relative">
                    {/* Ring 1: AI Audio Wave */}
                    <div className="absolute inset-[-40px] rounded-full border-2 border-dashed border-blue-500/30 animate-spin-slow transition-all duration-100" style={{ transform: `scale(${1 + aiActivity / 200}) rotate(${aiActivity}deg)`, opacity: isAIThinking ? 1 : 0.2 }}></div>
                    <div className="absolute inset-[-60px] rounded-full border border-blue-400/20 animate-spin transition-all duration-75" style={{ animationDirection: 'reverse', transform: `scale(${1 + aiActivity / 150})`, opacity: isAIThinking ? 0.8 : 0.1 }}></div>

                    {/* Ring 2: User Audio Wave */}
                    <div className="absolute inset-[-20px] rounded-full border-4 border-yellow-500/40 transition-all duration-100" style={{ transform: `scale(${1 + voiceActivity / 100})`, opacity: voiceActivity > 0 ? 1 : 0 }}></div>

                    {/* Avatar Core */}
                    <div className="w-48 h-48 md:w-64 md:h-64 rounded-full relative z-10 overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black">
                        <img src={companion.imageUrl} alt={companion.name} className={`w-full h-full object-cover transition-transform duration-[2000ms] ${isAIThinking ? 'scale-110 blur-[2px]' : 'scale-100'}`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-6 left-0 right-0 text-center">
                            <h2 className="text-white font-black text-2xl tracking-tighter drop-shadow-md">{companion.name}</h2>
                            <p className="text-yellow-500 text-xs font-bold uppercase tracking-[0.2em]">{companion.specialty}</p>
                        </div>
                    </div>
                </div>

                {/* Subtitles / Speech recognition text */}
                <div className="h-20 max-w-xl text-center px-4">
                    {isAIThinking ? (
                        <div className="flex items-center gap-3 text-blue-400 font-bold uppercase tracking-widest text-sm animate-pulse">
                            <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Multimodal Stream...
                        </div>
                    ) : (
                        <p className="text-gray-300 text-lg leading-relaxed font-medium min-h-[50px]">
                            {transcript || <span className="text-gray-600 italic">Listening...</span>}
                        </p>
                    )}
                </div>
            </div>

            {/* Bottom Controls / Tools */}
            <div className="w-full max-w-3xl pb-10 px-6 z-10 flex flex-col gap-4">

                {/* Fallback Input Box */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/0 via-yellow-500/20 to-blue-500/0 rounded-[30px] opacity-0 group-focus-within:opacity-100 transition-opacity blur-md"></div>
                    <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full overflow-hidden flex items-center pr-2 pl-6 py-2">
                        <input
                            type="text"
                            className="bg-transparent text-white w-full outline-none placeholder-gray-500 font-medium"
                            placeholder={isAIThinking ? "Companion is speaking..." : "Type text organically or just speak..."}
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSimulatedSubmit(); }}
                            disabled={isAIThinking}
                        />
                        <button onClick={handleSimulatedSubmit} disabled={isAIThinking || (!transcript && !uploadedImage)} className="bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 text-black px-6 py-3 rounded-full font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all w-32 flex items-center justify-center">
                            {isAIThinking ? 'Wait' : 'Transmit'}
                        </button>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex justify-center gap-6">
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'} border backdrop-blur-sm`}
                    >
                        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-16 h-16 rounded-full flex items-center justify-center bg-white/10 border border-white/20 text-white hover:bg-blue-500 hover:border-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all backdrop-blur-sm relative group overflow-hidden"
                    >
                        <ImageIcon className="w-6 h-6 group-hover:-translate-y-8 transition-transform" />
                        <Camera className="w-6 h-6 absolute translate-y-8 group-hover:translate-y-0 transition-transform" />
                        {/* Hidden File Input */}
                        <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                    </button>

                    <button
                        onClick={onEndSession}
                        className="w-16 h-16 rounded-full flex items-center justify-center bg-red-600/80 border border-red-500 text-white hover:bg-red-500 shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all"
                    >
                        <PhoneOff className="w-6 h-6" />
                    </button>
                </div>
                <div className="text-center mt-2">
                    <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-gray-500">Live Voice & Vision Protocol Active</span>
                </div>
            </div>
        </div>
    );
};
