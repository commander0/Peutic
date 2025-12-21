import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, Hand, Ear, Coffee, Wind, CheckCircle, ArrowRight, Heart, Volume2, VolumeX, Loader2, Play } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';

interface GroundingModeProps {
  onClose: () => void;
}

const STEPS = [
  { id: 'breathe', title: "Let's Pause.", subtitle: "Match your breath to the circle.", color: "bg-blue-600", icon: Wind, narration: "You are safe. Everything is going to be okay. Just breathe with me, and let's take this one step at a time." },
  { id: 'sight', count: 5, title: "5 Things You See", subtitle: "Look around. Tap the button for each item you identify.", color: "bg-indigo-600", icon: Eye, narration: "Look around you. Find 5 things you can see." },
  { id: 'touch', count: 4, title: "4 Things You Feel", subtitle: "The fabric of your chair, your feet on the floor...", color: "bg-purple-600", icon: Hand, narration: "Now, notice 4 things you can feel physically." },
  { id: 'sound', count: 3, title: "3 Things You Hear", subtitle: "A car outside, a fan, your own breath...", color: "bg-pink-600", icon: Ear, narration: "Listen closely. Name 3 things you can hear." },
  { id: 'smell', count: 2, title: "2 Things You Smell", subtitle: "Or your favorite scents you can imagine.", color: "bg-orange-600", icon: Coffee, narration: "Identify 2 things you can smell, or imagine your favorite scent." },
  { id: 'taste', count: 1, title: "1 Good Thing", subtitle: "Name one thing you like about yourself.", color: "bg-green-600", icon: Heart, narration: "Finally, name one thing you like about yourself." },
  { id: 'complete', title: "You Are Here.", subtitle: "You are safe. You are grounded.", color: "bg-teal-700", icon: CheckCircle, narration: "You did great. You are safe here." }
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

  // Manual PCM Decode (Gemini returns 24kHz raw PCM usually)
  const pcmToAudioBuffer = (chunk: Uint8Array, ctx: AudioContext): AudioBuffer => {
      const pcmData = new Int16Array(chunk.buffer);
      const numChannels = 1;
      const sampleRate = 24000; 
      const frameCount = pcmData.length;
      
      const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
      const channelData = buffer.getChannelData(0);
      
      for (let i = 0; i < frameCount; i++) {
          channelData[i] = pcmData[i] / 32768.0;
      }
      return buffer;
  };

  const initAudioContext = () => {
      if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
      }
      return audioContextRef.current;
  };

  const startAmbientSong = () => {
      const ctx = initAudioContext();
      // Prevent duplicates
      if (musicNodesRef.current.length > 0) return;

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.15; // Gentle background volume
      masterGain.connect(ctx.destination);
      musicNodesRef.current.push(masterGain);

      // Chords: Cmaj7 (C E G B), Fmaj7 (F A C E)
      const chords = [
          [261.63, 329.63, 392.00, 493.88], // C4
          [174.61, 220.00, 261.63, 329.63]  // F3
      ];

      const now = ctx.currentTime;
      const duration = 8; // seconds per chord

      // Schedule loops for 2 minutes
      for(let i=0; i<16; i++) {
          const chord = chords[i % 2];
          const startTime = now + (i * duration);
          
          chord.forEach((freq, index) => {
              const osc = ctx.createOscillator();
              osc.type = index % 2 === 0 ? 'sine' : 'triangle';
              osc.frequency.value = freq;

              const gain = ctx.createGain();
              gain.gain.setValueAtTime(0, startTime);
              gain.gain.linearRampToValueAtTime(0.05, startTime + 2); // Slow attack
              gain.gain.setValueAtTime(0.05, startTime + duration - 2);
              gain.gain.linearRampToValueAtTime(0, startTime + duration); // Slow release

              // Slight detune for warmth
              osc.detune.value = Math.random() * 10 - 5;

              osc.connect(gain);
              gain.connect(masterGain);
              
              osc.start(startTime);
              osc.stop(startTime + duration);
              
              musicNodesRef.current.push(osc, gain);
          });
      }
  };

  const playBuffer = (buffer: AudioBuffer) => {
      const ctx = initAudioContext();
      
      if (voiceSourceRef.current) {
          try { voiceSourceRef.current.stop(); } catch(e) {}
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setLoadingVoice(false);
      source.start(0);
      voiceSourceRef.current = source;
  };

  const playAiVoice = async (text: string) => {
      if (!voiceEnabled) return;
      
      if (voiceSourceRef.current) {
          try { voiceSourceRef.current.stop(); } catch(e) {}
          voiceSourceRef.current = null;
      }
      window.speechSynthesis.cancel(); 

      if (audioCache.current.has(text)) {
          playBuffer(audioCache.current.get(text)!);
          return;
      }

      const requestId = Date.now();
      lastRequestId.current = requestId;
      setLoadingVoice(true);

      const data = await generateSpeech(text);
      
      if (lastRequestId.current === requestId && data) {
          try {
              const ctx = initAudioContext();
              const buffer = pcmToAudioBuffer(data, ctx);
              audioCache.current.set(text, buffer);
              playBuffer(buffer);
          } catch (e) {
              console.error("Audio conversion failed", e);
              fallbackSpeak(text);
          }
      } else if (!data) {
          if (lastRequestId.current === requestId) fallbackSpeak(text);
      }
      
      if (lastRequestId.current === requestId) setLoadingVoice(false);
  };

  const fallbackSpeak = (text: string) => {
      if (!voiceEnabled) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; 
      utterance.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes("Samantha") || v.lang === "en-US");
      if (preferredVoice) utterance.voice = preferredVoice;
      window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
      const preloadNext = async () => {
          const nextStep = STEPS[stepIndex + 1];
          if (nextStep && nextStep.narration && !audioCache.current.has(nextStep.narration)) {
              const data = await generateSpeech(nextStep.narration);
              if (data && audioContextRef.current) {
                  const buffer = pcmToAudioBuffer(data, audioContextRef.current);
                  audioCache.current.set(nextStep.narration, buffer);
              }
          }
      };
      preloadNext();
  }, [stepIndex]);

  useEffect(() => {
      initAudioContext();
      playAiVoice(STEPS[0].narration);
      
      try {
        startAmbientSong();
      } catch (e) {
        console.warn("Autoplay prevented");
        setAudioBlocked(true);
      }

      return () => {
          if (voiceSourceRef.current) { try { voiceSourceRef.current.stop(); } catch(e) {} }
          window.speechSynthesis.cancel();
          musicNodesRef.current.forEach(node => {
              try { (node as any).stop && (node as any).stop(); } catch(e) {}
              try { node.disconnect(); } catch(e) {}
          });
          musicNodesRef.current = [];
          if (audioContextRef.current) {
              audioContextRef.current.close();
              audioContextRef.current = null;
          }
      };
  }, []);

  useEffect(() => {
      if (stepIndex > 0) {
          playAiVoice(currentStep.narration || "");
      }
  }, [stepIndex]);

  const handleStartAudio = () => {
      setAudioBlocked(false);
      startAmbientSong();
      playAiVoice(currentStep.narration || "");
  };

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
    }, 200); 
  };

  useEffect(() => {
    if (currentStep.id === 'breathe') {
      const timer = setTimeout(() => {
        nextStep();
      }, 16000); 
      
      const textCycle = () => {
          setBreathText("Inhale...");
          setTimeout(() => setBreathText("Hold..."), 3500);
          setTimeout(() => setBreathText("Exhale..."), 5500);
      };
      
      textCycle();
      const interval = setInterval(textCycle, 8000);

      return () => {
          clearTimeout(timer);
          clearInterval(interval);
      };
    }
  }, [stepIndex]);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center text-white transition-colors duration-500 ${currentStep.color}`}>
      <style>{`
        @keyframes deep-breathe {
          0% { transform: scale(1); opacity: 0.6; }
          45% { transform: scale(1.6); opacity: 0.9; }
          55% { transform: scale(1.6); opacity: 0.9; }
          100% { transform: scale(1); opacity: 0.6; }
        }
        .animate-deep-breathe {
          animation: deep-breathe 8s ease-in-out infinite;
        }
      `}</style>

      {/* Blocked Audio Overlay */}
      {audioBlocked && (
          <div className="absolute inset-0 z-[110] bg-black/80 flex items-center justify-center backdrop-blur-sm">
              <button 
                  onClick={handleStartAudio}
                  className="bg-white text-black px-8 py-4 rounded-full font-bold text-xl flex items-center gap-3 hover:scale-105 transition-transform shadow-2xl animate-pulse"
              >
                  <Play className="w-6 h-6 fill-black" /> Start Session Audio
              </button>
          </div>
      )}

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60 pointer-events-none"></div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] bg-white/5 rounded-full blur-[100px] animate-pulse-slow"></div>
      </div>

      <div className="absolute top-6 right-6 flex items-center gap-4 z-20">
          <button onClick={() => setVoiceEnabled(!voiceEnabled)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all">
              {loadingVoice ? <Loader2 className="w-5 h-5 animate-spin"/> : (voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />)}
          </button>
          <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all">
            <X className="w-5 h-5" />
          </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 h-2 bg-black/20 w-full">
        <div className="h-full bg-white/50 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
      </div>

      <div className={`relative z-10 max-w-md w-full px-8 text-center transition-all duration-300 transform ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        
        {/* Icon Header */}
        <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-lg shadow-2xl border border-white/20">
                <currentStep.icon className="w-10 h-10 text-white" />
            </div>
        </div>

        <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">{currentStep.title}</h2>
        <p className="text-lg md:text-xl text-white/80 font-medium mb-10 leading-relaxed">{currentStep.subtitle}</p>

        {/* Dynamic Content Area */}
        {currentStep.id === 'breathe' && (
           <div className="relative w-48 h-48 mx-auto mb-12 flex items-center justify-center">
               <div className="absolute inset-0 bg-white/20 rounded-full animate-deep-breathe"></div>
               <div className="absolute inset-8 bg-white/30 rounded-full backdrop-blur-sm border border-white/40 shadow-inner flex items-center justify-center transition-all duration-[4000ms] ease-in-out">
                   <span className="font-bold tracking-widest text-lg uppercase drop-shadow-md">{breathText}</span>
               </div>
           </div>
        )}

        {currentStep.count && (
            <div className="space-y-6">
                <div className="flex justify-center gap-3 mb-8">
                    {Array.from({ length: currentStep.count }).map((_, i) => (
                        <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${i < counter ? 'bg-white scale-125' : 'bg-white/20'}`}></div>
                    ))}
                </div>
                <button 
                    onClick={handleTap}
                    className="w-full py-5 bg-white text-black rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                >
                    {counter + 1 >= currentStep.count ? <span className="flex items-center gap-2">Complete Section <ArrowRight className="w-5 h-5"/></span> : "I Found One"}
                </button>
            </div>
        )}

        {currentStep.id === 'complete' && (
            <button onClick={onClose} className="px-10 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-white/90 transition-all shadow-lg hover:scale-105">
                Return to Dashboard
            </button>
        )}

      </div>
    </div>
  );
};

export default GroundingMode;