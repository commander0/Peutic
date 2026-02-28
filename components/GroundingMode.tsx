import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, Hand, Ear, Coffee, Wind, CheckCircle, ArrowRight, Heart, Volume2, VolumeX, Loader2, Play, Sparkles } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';

interface GroundingModeProps {
    onClose: () => void;
}

// "Hyper Organic" Persona Script
const STEPS = [
    {
        id: 'breathe',
        title: "Just Breathe",
        subtitle: "Sync with the rhythm. You're safe here.",
        gradient: "from-blue-900/40 via-blue-800/20 to-black",
        icon: Wind,
        narration: "Hey... it’s okay. You’re safe. Everything is going to be alright. Let’s just... pause for a second. Breathe with me. In... and out. Just focus on that rhythm."
    },
    {
        id: 'sight',
        count: 5,
        title: "Sight",
        subtitle: "Look around. Find 5 details you usually miss.",
        gradient: "from-indigo-900/40 via-purple-900/20 to-black",
        icon: Eye,
        narration: "Look away from the screen for a moment. Just look around your space. Find 5 distinct things you can see. Maybe a shadow, a color, a texture. Just notice them."
    },
    {
        id: 'touch',
        count: 4,
        title: "Touch",
        subtitle: "Feel the ground. Anchor yourself.",
        gradient: "from-violet-900/40 via-fuchsia-900/20 to-black",
        icon: Hand,
        narration: "Now bring your attention to your body. Feel your feet on the floor. The weight of your arms. Find 4 things you can physically feel right now. Really feel them."
    },
    {
        id: 'sound',
        count: 3,
        title: "Sound",
        subtitle: "Listen past the silence.",
        gradient: "from-pink-900/40 via-rose-900/20 to-black",
        icon: Ear,
        narration: "Close your eyes if you want. Listen. Past the obvious sounds. Can you hear the hum of the room? Traffic outside? Find 3 layers of sound."
    },
    {
        id: 'smell',
        count: 2,
        title: "Scent",
        subtitle: "Breathe deep. Engage your senses.",
        gradient: "from-orange-900/40 via-amber-900/20 to-black",
        icon: Coffee,
        narration: "Take a deep breath through your nose. Can you smell anything? Coffee? Rain? Or just fresh air. Identify 2 things."
    },
    {
        id: 'taste',
        count: 1,
        title: "Appreciation",
        subtitle: "One kindness for yourself.",
        gradient: "from-emerald-900/40 via-green-900/20 to-black",
        icon: Heart,
        narration: "We're almost there. For this last one... I want you to name one thing you like about yourself. Just one. You deserve that kindness."
    },
    {
        id: 'complete',
        title: "You Are Grounded",
        subtitle: "Carry this calm with you.",
        gradient: "from-teal-900/40 via-cyan-900/20 to-black",
        icon: CheckCircle,
        narration: "You did it. Take a moment to feel the difference. You are safe, you are grounded, and you are ready. I'll be here whenever you need me."
    }
];

const GroundingMode: React.FC<GroundingModeProps> = ({ onClose }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [counter, setCounter] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [breathText, setBreathText] = useState("Breathe In");
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [loadingVoice, setLoadingVoice] = useState(false);
    const [audioBlocked, setAudioBlocked] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const voiceSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const audioCache = useRef<Map<string, AudioBuffer>>(new Map());
    const lastRequestId = useRef<number>(0);
    const musicNodesRef = useRef<AudioNode[]>([]);

    const currentStep = STEPS[stepIndex];
    const progress = ((stepIndex) / (STEPS.length - 1)) * 100;

    // Manual PCM Decode
    const pcmToAudioBuffer = (chunk: Uint8Array, ctx: AudioContext): AudioBuffer => {
        const pcmData = new Int16Array(chunk.buffer);
        const numChannels = 1;
        const sampleRate = 24000;
        const frameCount = pcmData.length;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < frameCount; i++) { channelData[i] = pcmData[i] / 32768.0; }
        return buffer;
    };

    const initAudioContext = () => {
        if (!audioContextRef.current) { audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)(); }
        if (audioContextRef.current.state === 'suspended') { audioContextRef.current.resume(); }
        return audioContextRef.current;
    };

    const startAmbientSong = () => {
        const ctx = initAudioContext();
        if (musicNodesRef.current.length > 0) return;

        const masterGain = ctx.createGain();
        masterGain.gain.value = 0.15; // Subtle ambient
        masterGain.connect(ctx.destination);
        musicNodesRef.current.push(masterGain);

        // Ethereal Drone (Pad-like)
        const drones = [110.00, 164.81, 196.00, 220.00]; // A2, E3, G3, A3 (Am7)
        drones.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = i % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.value = freq;
            const lfo = ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.1 + (Math.random() * 0.1); // Slow modulation
            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 5;
            lfo.connect(lfoGain.gain);

            const g = ctx.createGain();
            g.gain.value = 0.05;
            osc.connect(g);
            g.connect(masterGain);
            osc.start();
            lfo.start();
            musicNodesRef.current.push(osc, g, lfo, lfoGain);
        });
    };

    const playBuffer = (buffer: AudioBuffer) => {
        const ctx = initAudioContext();
        if (voiceSourceRef.current) { try { voiceSourceRef.current.stop(); } catch (e) { } }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => setLoadingVoice(false);
        source.start(0);
        voiceSourceRef.current = source;
    };

    const playAiVoice = async (text: string) => {
        if (!voiceEnabled) return;
        if (voiceSourceRef.current) { try { voiceSourceRef.current.stop(); } catch (e) { } voiceSourceRef.current = null; }
        window.speechSynthesis.cancel();

        if (audioCache.current.has(text)) {
            playBuffer(audioCache.current.get(text)!);
            return;
        }

        const requestId = Date.now();
        lastRequestId.current = requestId;
        setLoadingVoice(true);

        // Try Gemini first (if configured/capable), else fallback immediately to avoid silence
        const data = await generateSpeech(text);

        if (lastRequestId.current === requestId && data) {
            try {
                const ctx = initAudioContext();
                const buffer = pcmToAudioBuffer(data, ctx);
                audioCache.current.set(text, buffer);
                playBuffer(buffer);
            } catch (e) {
                fallbackSpeak(text);
            }
        } else if (lastRequestId.current === requestId) {
            fallbackSpeak(text);
        }
        if (lastRequestId.current === requestId) setLoadingVoice(false);
    };

    const fallbackSpeak = (text: string) => {
        if (!voiceEnabled) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.80; // Slower, deliberate pacing
        utterance.pitch = 0.85; // Lower, warmer, less computerized
        utterance.volume = 1.0;

        // HYPER-ORGANIC SOOTHING VOICE SELECTION
        const voices = window.speechSynthesis.getVoices();

        // Prioritize Neural/Online premium female voices, then standard natural ones
        const preferredVoice = voices.find(v =>
            v.name.includes("Samantha") || v.name.includes("Victoria") ||
            v.name.includes("Google UK English Female") ||
            v.name.includes("Microsoft Aria Online") || v.name.includes("Microsoft Jenny") ||
            (v.lang === 'en-US' && v.name.toLowerCase().includes("female")) ||
            (v.lang === 'en-GB' && v.name.toLowerCase().includes("female")) ||
            v.name.includes("Natural") || v.name.includes("Neural")
        );

        if (preferredVoice) utterance.voice = preferredVoice;
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        // Trigger voice load
        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = () => playAiVoice(currentStep.narration);
        } else {
            playAiVoice(currentStep.narration);
        }
    }, [stepIndex]);

    useEffect(() => {
        initAudioContext();
        try { startAmbientSong(); } catch (e) { setAudioBlocked(true); }
        return () => {
            if (voiceSourceRef.current) { try { voiceSourceRef.current.stop(); } catch (e) { } }
            window.speechSynthesis.cancel();
            musicNodesRef.current.forEach(node => {
                try { (node as any).stop && (node as any).stop(); } catch (e) { }
                try { node.disconnect(); } catch (e) { }
            });
            musicNodesRef.current = [];
            if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
        };
    }, []);

    const handleTap = () => {
        if (currentStep.count) {
            if (counter + 1 >= currentStep.count) {
                nextStep();
            } else {
                setCounter(c => c + 1);
            }
        }
    };

    const nextStep = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setStepIndex(i => i + 1);
            setCounter(0);
            setIsTransitioning(false);
        }, 300);
    };

    useEffect(() => {
        if (currentStep.id === 'breathe') {
            const timer = setTimeout(() => nextStep(), 20000); // Longer breathe session
            const textCycle = () => {
                setBreathText("Breathe In...");
                setTimeout(() => setBreathText("Hold..."), 4000);
                setTimeout(() => setBreathText("Exhale..."), 7000);
            };
            textCycle();
            const interval = setInterval(textCycle, 10000); // Slower 10s cycle
            return () => { clearTimeout(timer); clearInterval(interval); };
        }
    }, [stepIndex]);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center text-white overflow-hidden bg-black">
            {/* DYNAMIC BACKGROUND */}
            <div className={`absolute inset-0 bg-gradient-to-br ${currentStep.gradient} transition-all duration-[2000ms] ease-in-out`}></div>
            <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-overlay"></div>

            {/* CINEMATIC AMBIENT ORBS & LIQUID BLOBS */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-[120px] animate-[pulse_6s_ease-in-out_infinite] pointer-events-none mix-blend-screen"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/15 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] blur-[80px] animate-[spin_15s_linear_infinite] pointer-events-none mix-blend-screen"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-fuchsia-400/15 rounded-[60%_40%_30%_70%/50%_60%_40%_50%] blur-[90px] animate-[spin_20s_linear_infinite_reverse] pointer-events-none mix-blend-screen"></div>

            {/* Blocked Audio Overlay */}
            {audioBlocked && (
                <div className="absolute inset-0 z-[110] bg-black/80 flex items-center justify-center backdrop-blur-md">
                    <button onClick={() => { setAudioBlocked(false); startAmbientSong(); playAiVoice(currentStep.narration); }} className="bg-white text-black px-8 py-4 rounded-full font-bold text-xl flex items-center gap-3 hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)] animate-pulse">
                        <Play className="w-6 h-6 fill-black" /> Begin Session
                    </button>
                </div>
            )}

            {/* CONTROLS */}
            <div className="absolute top-8 right-8 flex items-center gap-4 z-20">
                <button onClick={() => setVoiceEnabled(!voiceEnabled)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-105">
                    {loadingVoice ? <Loader2 className="w-5 h-5 animate-spin" /> : (voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />)}
                </button>
                <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-105">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* PROGRESS BAR */}
            <div className="absolute top-0 left-0 h-1.5 bg-white/10 w-full">
                <div className="h-full bg-gradient-to-r from-blue-400 to-purple-400 shadow-[0_0_20px_rgba(96,165,250,0.8)] transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
            </div>

            {/* CONTENT */}
            <div className={`relative z-10 max-w-2xl w-full px-8 md:px-16 py-12 md:py-20 text-center transition-all duration-[800ms] transform ${isTransitioning ? 'opacity-0 scale-95 blur-xl translate-y-10' : 'opacity-100 scale-100 blur-0 translate-y-0'} bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-[0_0_80px_rgba(255,255,255,0.05),inset_0_0_40px_rgba(255,255,255,0.05)]`}>

                {/* ICON GLOW */}
                <div className="mb-10 flex justify-center relative">
                    <div className="absolute inset-0 bg-white/20 blur-[60px] animate-[pulse_4s_ease-in-out_infinite]"></div>
                    <div className="relative w-28 h-28 bg-gradient-to-br from-white/20 to-transparent rounded-full flex items-center justify-center backdrop-blur-2xl border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.5)] animate-[bounce_6s_infinite]">
                        <currentStep.icon className="w-12 h-12 text-white drop-shadow-[0_0_20px_rgba(255,255,255,1)]" />
                    </div>
                </div>

                <h2 className="text-5xl md:text-6xl font-serif font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 drop-shadow-md">{currentStep.title}</h2>
                <p className="text-xl md:text-2xl text-blue-100 font-light mb-12 leading-relaxed tracking-wide opacity-90">{currentStep.subtitle}</p>

                {/* BREATHE VISUALIZER */}
                {currentStep.id === 'breathe' && (
                    <div className="relative w-64 h-64 mx-auto mb-16 flex items-center justify-center">
                        {/* Rings */}
                        <div className="absolute inset-0 border border-white/30 rounded-full animate-ping opacity-30" style={{ animationDuration: '4s' }}></div>
                        <div className="absolute inset-8 border border-white/40 rounded-full animate-ping opacity-30" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>

                        {/* Core Liquid */}
                        <div className="absolute inset-0 bg-white/10 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] animate-[spin_8s_linear_infinite] blur-xl"></div>
                        <div className="absolute inset-10 bg-gradient-to-br from-white/30 to-transparent rounded-full backdrop-blur-xl border border-white/40 shadow-[0_0_60px_rgba(255,255,255,0.2)] flex items-center justify-center transition-all duration-[4000ms] ease-in-out breathing-text-container">
                            <span className="font-sans font-black tracking-[0.3em] text-xl uppercase text-white drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)]">{breathText}</span>
                        </div>
                    </div>
                )}

                {/* INTERACTIVE COUNTER */}
                {currentStep.count && (
                    <div className="space-y-10">
                        <div className="flex justify-center gap-5 mb-8">
                            {Array.from({ length: currentStep.count }).map((_, i) => (
                                <div key={i} className={`w-5 h-5 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(255,255,255,0.3)] ${i < counter ? 'bg-white scale-150 shadow-[0_0_30px_rgba(255,255,255,1)]' : 'bg-white/10'}`}></div>
                            ))}
                        </div>
                        <button
                            onClick={handleTap}
                            className="w-full py-6 bg-white/10 hover:bg-white/20 border-t border-white/30 text-white rounded-[2rem] font-bold text-2xl tracking-wide hover:scale-105 active:scale-95 transition-all shadow-2xl backdrop-blur-xl flex items-center justify-center gap-4 group"
                        >
                            {counter + 1 >= currentStep.count ? (
                                <span className="flex items-center gap-3 group-hover:translate-x-2 transition-transform drop-shadow-md">Complete <ArrowRight className="w-7 h-7" /></span>
                            ) : (
                                <span className="flex items-center gap-3 drop-shadow-md"><Sparkles className="w-6 h-6 animate-pulse" /> Found It</span>
                            )}
                        </button>
                    </div>
                )}

                {currentStep.id === 'complete' && (
                    <button onClick={onClose} className="px-14 py-6 bg-white text-black rounded-full font-black text-2xl tracking-wide hover:bg-blue-50 transition-all shadow-[0_0_60px_rgba(255,255,255,0.6)] hover:scale-105 hover:shadow-[0_0_80px_rgba(255,255,255,0.8)] mt-4">
                        Return to Sanctuary
                    </button>
                )}

            </div>
        </div>
    );
};

export default GroundingMode;