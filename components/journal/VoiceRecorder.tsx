import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Trash2, RefreshCw, Pause } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { VoiceJournalEntry } from '../../types';

interface VoiceRecorderProps {
    userId: string;
    onSave: (entry: VoiceJournalEntry) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ userId, onSave }) => {
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
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
                // If bucket doesn't exist, use object URL for demo
                console.warn("Storage upload failed (Bucket missing?), using local URL", error);
            }

            const publicUrl = error
                ? URL.createObjectURL(audioBlob)
                : supabase.storage.from('voice-journals').getPublicUrl(filename).data.publicUrl;

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
                        <button onClick={handleSave} disabled={saving} className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95">
                            {saving ? <RefreshCw className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6" />}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

// Also define a mini player for list view
export const VoiceEntryItem: React.FC<{ entry: VoiceJournalEntry, onDelete: (id: string) => void }> = ({ entry, onDelete }) => {
    const [playing, setPlaying] = useState(false);
    const [isBoosted, setIsBoosted] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;

        // Initialize Audio Context for Volume Boosting on first play
        if (!audioCtxRef.current && audioRef.current) {
            try {
                const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
                const ctx = new AudioContextClass();
                const source = ctx.createMediaElementSource(audioRef.current);
                const gain = ctx.createGain();

                source.connect(gain);
                gain.connect(ctx.destination);

                audioCtxRef.current = ctx;
                gainNodeRef.current = gain;
                sourceRef.current = source;
            } catch (e) {
                console.error("Audio Context initialization failed", e);
            }
        }

        if (audioCtxRef.current?.state === 'suspended') {
            audioCtxRef.current.resume();
        }

        if (playing) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setPlaying(!playing);
    };

    const toggleBoost = () => {
        const newBoost = !isBoosted;
        setIsBoosted(newBoost);
        if (gainNodeRef.current) {
            // Apply 2x gain boost
            gainNodeRef.current.gain.setTargetAtTime(newBoost ? 2.5 : 1.0, audioCtxRef.current?.currentTime || 0, 0.1);
        }
    };

    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 group">
            <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-white dark:bg-black flex items-center justify-center shadow-sm text-yellow-600 hover:scale-105 active:scale-95 transition-transform">
                    {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
                <div>
                    <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">{entry.title || 'Audio Note'}</h4>
                    <p className="text-[10px] text-gray-400">{new Date(entry.createdAt).toLocaleDateString()} • {Math.floor(entry.durationSeconds / 60)}:{(entry.durationSeconds % 60).toString().padStart(2, '0')}</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={toggleBoost}
                    className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${isBoosted ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/30' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-gray-600'}`}
                    title="Volume Boost (2.5x)"
                >
                    {isBoosted ? 'Boosted' : 'Boost'}
                </button>
                <button onClick={() => onDelete(entry.id)} className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
            </div>

            <audio
                ref={audioRef}
                src={entry.audioUrl}
                onEnded={() => setPlaying(false)}
                className="hidden"
                crossOrigin="anonymous"
            />
        </div>
    );
};

import { CheckCircle } from 'lucide-react';
