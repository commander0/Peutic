import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Trash2, RefreshCw, Pause, CheckCircle, Volume2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { VoiceJournalEntry } from '../../types';

interface VoiceRecorderProps {
    userId: string;
    onSave: (entry: VoiceJournalEntry) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ userId, onSave }) => {
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [previewPlaying, setPreviewPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [saving, setSaving] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // WEB AUDIO BOOST: Process mic input before recording
            const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContextClass();
            const source = audioCtx.createMediaStreamSource(stream);
            const boost = audioCtx.createGain();
            const destination = audioCtx.createMediaStreamDestination();

            // 1.5x recording boost
            boost.gain.value = 1.5;

            source.connect(boost);
            boost.connect(destination);

            const mediaRecorder = new MediaRecorder(destination.stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                if (timerRef.current) clearInterval(timerRef.current);
                audioCtx.close();
            };

            mediaRecorder.start();
            setRecording(true);
            setDuration(0);
            timerRef.current = window.setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);

        } catch (err) {
            console.error("Mic Access Error:", err);
            alert("Could not access microphone. Please allow permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop();
            setRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleSave = async () => {
        if (!audioBlob) return;
        setSaving(true);
        try {
            const filename = `${userId}/${Date.now()}.webm`;
            const { error } = await supabase.storage
                .from('voice-journals')
                .upload(filename, audioBlob);

            if (error) {
                console.error("Storage upload failed:", error);
                alert("Failed to save recording. Please ensure the 'voice-journals' storage bucket exists and is public.");
                setSaving(false);
                return;
            }

            const { data } = supabase.storage.from('voice-journals').getPublicUrl(filename);
            const publicUrl = data.publicUrl;

            const entry: VoiceJournalEntry = {
                id: crypto.randomUUID(),
                userId,
                audioUrl: publicUrl,
                durationSeconds: duration,
                createdAt: new Date().toISOString(),
                title: `Journal ${new Date().toLocaleTimeString()}`
            };

            onSave(entry);
            setAudioBlob(null);
            setDuration(0);

        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-yellow-100 dark:border-gray-800 shadow-sm flex flex-col items-center">
            <h3 className="font-bold text-gray-500 text-xs uppercase tracking-widest mb-6 w-full text-center">Voice Journal</h3>

            {/* VISUALIZER PLACEHOLDER */}
            <div className="w-full h-24 bg-yellow-50 dark:bg-gray-800 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden">
                {recording ? (
                    <div className="flex items-center gap-1 h-full">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                            <div key={i} className="w-2 bg-red-400 rounded-full animate-pulse" style={{ height: `${Math.random() * 80 + 20}%`, animationDuration: `${Math.random() * 0.5 + 0.2}s` }}></div>
                        ))}
                    </div>
                ) : audioBlob ? (
                    <div className="w-full h-[2px] bg-yellow-400"></div>
                ) : (
                    <span className="text-gray-300 text-xs">Ready to record</span>
                )}
            </div>

            <div className="text-2xl font-black font-mono mb-6 dark:text-white">{formatTime(duration)}</div>

            <div className="flex gap-4">
                {!recording && !audioBlob && (
                    <button onClick={startRecording} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95">
                        <Mic className="w-6 h-6" />
                    </button>
                )}

                {recording && (
                    <button onClick={stopRecording} className="w-16 h-16 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95">
                        <Square className="w-6 h-6 fill-current" />
                    </button>
                )}

                {audioBlob && (
                    <>
                        <button onClick={() => setAudioBlob(null)} className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors">
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setPreviewPlaying(!previewPlaying)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${previewPlaying ? 'bg-black text-white dark:bg-yellow-400 dark:text-black' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'}`}
                        >
                            {previewPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                        </button>
                        <button onClick={handleSave} disabled={saving} className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95">
                            {saving ? <RefreshCw className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6" />}
                        </button>
                        <audio
                            src={audioBlob ? URL.createObjectURL(audioBlob) : ''}
                            ref={(el) => {
                                if (el) {
                                    if (previewPlaying) el.play(); else el.pause();
                                    el.onended = () => setPreviewPlaying(false);
                                }
                            }}
                            className="hidden"
                        />
                    </>
                )}
            </div>
        </div>
    );
};

// Singleton AudioContext to avoid browser limits
let sharedAudioCtx: AudioContext | null = null;
const getSharedAudioCtx = () => {
    if (!sharedAudioCtx) {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) sharedAudioCtx = new AudioContextClass();
    }
    return sharedAudioCtx;
};

// Also define a mini player for list view
export const VoiceEntryItem: React.FC<{ entry: VoiceJournalEntry, onDelete: (id: string) => void }> = ({ entry, onDelete }) => {
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(entry.durationSeconds || 0);
    const [isBoosted, setIsBoosted] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

    // Sync playing state with actual audio events
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onPlay = () => setPlaying(true);
        const onPause = () => setPlaying(false);
        const onEnded = () => setPlaying(false);
        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onLoadedMetadata = () => setDuration(audio.duration);

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);

        return () => {
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        };
    }, []);

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return;
        const time = parseFloat(e.target.value);
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const togglePlay = async () => {
        if (!audioRef.current) return;

        try {
            if (audioRef.current.paused) {
                // Ensure context is resumed if we are dealing with AudioContext
                const ctx = sharedAudioCtx;
                if (ctx && ctx.state === 'suspended') {
                    await ctx.resume().catch(e => console.warn("Could not resume AudioContext", e));
                }

                // If finished or near end, restart
                if (audioRef.current.ended || audioRef.current.currentTime >= audioRef.current.duration - 0.1) {
                    audioRef.current.currentTime = 0;
                }

                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.error("Playback failed (Autoplay/Source):", error);
                        setPlaying(false);
                    });
                }
            } else {
                audioRef.current.pause();
            }
        } catch (e: any) {
            console.error("Playback operation failed", e);
            setPlaying(false);
        }
    };

    const toggleBoost = async () => {
        const nextBoost = !isBoosted;

        if (nextBoost && !sourceRef.current && audioRef.current) {
            const ctx = getSharedAudioCtx();
            if (ctx) {
                try {
                    // Check if already connected by tracking on the audio element itself to be safe
                    if (!(audioRef.current as any)._connectedToVault) {
                        const source = ctx.createMediaElementSource(audioRef.current);
                        const gain = ctx.createGain();
                        source.connect(gain);
                        gain.connect(ctx.destination);
                        sourceRef.current = source;
                        gainNodeRef.current = gain;
                        (audioRef.current as any)._connectedToVault = true;
                    }
                    if (ctx.state === 'suspended') await ctx.resume();
                } catch (e) {
                    console.warn("Audio graph connection attempted again or failed:", e);
                }
            }
        }

        if (gainNodeRef.current) {
            const ctx = getSharedAudioCtx();
            const now = ctx?.currentTime || 0;
            // Smoothly transition gain
            gainNodeRef.current.gain.setTargetAtTime(nextBoost ? 3.0 : 1.0, now, 0.1);
        }

        setIsBoosted(nextBoost);
    };

    return (
        <div className="group relative p-4 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] overflow-hidden">
            {/* Waveform Visualization Simulation (Animated on hover) */}
            <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-[0.03] dark:opacity-[0.07] pointer-events-none group-hover:opacity-20 transition-opacity duration-700 h-full w-full px-8">
                {[...Array(24)].map((_, i) => (
                    <div
                        key={i}
                        className="w-1 bg-yellow-400 rounded-full transition-all duration-500"
                        style={{
                            height: `${20 + Math.random() * 60}%`,
                            animation: playing ? `breathing ${2 + Math.random() * 2}s ease-in-out infinite` : 'none',
                            animationDelay: `${i * 0.1}s`
                        }}
                    ></div>
                ))}
            </div>

            <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={togglePlay}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${playing ? 'bg-black text-white dark:bg-yellow-400 dark:text-black scale-110' : 'bg-gray-100 dark:bg-gray-800 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'}`}
                    >
                        {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                    </button>
                    <div>
                        <h4 className="text-sm font-black text-gray-900 dark:text-white tracking-tight leading-tight">{entry.title || 'Untitled Audio Reflection'}</h4>
                        <div className="flex flex-col gap-2 mt-2">
                            <div className="flex items-center gap-3 w-48 md:w-64">
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 100}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="flex-1 h-1 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                                />
                                <span className="text-[9px] font-mono text-gray-400 w-8">{Math.floor(currentTime)}s</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                <span className="text-[10px] font-black text-yellow-600/70 dark:text-yellow-400/50 uppercase tracking-widest">
                                    {Math.floor(duration / 60)}:{(Math.floor(duration) % 60).toString().padStart(2, '0')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleBoost}
                        className={`group/boost px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-500 flex items-center gap-1.5 ${isBoosted ? 'bg-yellow-400 text-black shadow-[0_0_20px_rgba(250,204,21,0.4)]' : 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 border border-transparent hover:border-yellow-200/50'}`}
                    >
                        <Volume2 className={`w-3 h-3 ${isBoosted ? 'animate-pulse' : ''}`} />
                        {isBoosted ? 'Boosted 2.5x' : 'Boost Audio'}
                    </button>
                    <button
                        onClick={() => onDelete(entry.id)}
                        className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        title="Delete Entry"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <audio
                ref={audioRef}
                src={entry.audioUrl}
                crossOrigin="anonymous"
                onEnded={() => setPlaying(false)}
                className="hidden"
                preload="metadata"
                controls={false}
            />
        </div>
    );
};

