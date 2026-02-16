import React, { useState, useEffect, useRef } from 'react';
import { Music, Minimize2, CloudRain, Trees, Anchor, Flame, Volume2, Play } from 'lucide-react';

export const SoundscapePlayer = React.memo(() => {
    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(0.4);
    const [track, setTrack] = useState<'rain' | 'forest' | 'ocean' | 'fire'>('rain');
    const [minimized, setMinimized] = useState(true);
    const audioRef = useRef<HTMLAudioElement>(null);
    const SOUND_URLS = {
        rain: 'https://assets.mixkit.co/active_storage/sfx/2393/2393-preview.mp3',
        forest: 'https://assets.mixkit.co/active_storage/sfx/1210/1210-preview.mp3',
        ocean: 'https://assets.mixkit.co/active_storage/sfx/1196/1196-preview.mp3',
        fire: 'https://assets.mixkit.co/active_storage/sfx/1330/1330-preview.mp3'
    };

    useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (playing) { audio.play().catch(console.warn); }
        else { audio.pause(); }
    }, [playing]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.load();
        if (playing) audio.play().catch(console.warn);
    }, [track]);

    return (
        <div className={`fixed bottom-6 right-6 z-[80] transition-all duration-500 ease-in-out border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden backdrop-blur-md ${minimized ? 'w-12 h-12 rounded-full bg-white/80 dark:bg-black/40' : 'w-72 rounded-3xl p-4 bg-white/90 dark:bg-black/60'}`}>
            <audio ref={audioRef} src={SOUND_URLS[track]} loop crossOrigin="anonymous" />
            {minimized ? (
                <button onClick={() => setMinimized(false)} className={`w-full h-full flex items-center justify-center hover:scale-110 transition-transform ${playing ? 'bg-primary dark:bg-transparent animate-pulse text-black dark:text-primary' : 'bg-primary dark:bg-transparent text-black dark:text-primary'}`}>
                    <Music className="w-5 h-5" />
                </button>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                                <Music className="w-4 h-4 text-black" />
                            </div>
                            <span className="font-black text-sm text-gray-900 dark:text-primary tracking-tight">SOUNDSCAPE</span>
                        </div>
                        <button onClick={() => setMinimized(true)} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"><Minimize2 className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { key: 'rain', label: 'Rain', icon: CloudRain }, { key: 'forest', label: 'Nature', icon: Trees },
                            { key: 'ocean', label: 'Ocean', icon: Anchor }, { key: 'fire', label: 'Fire', icon: Flame }
                        ].map((item) => (
                            <button key={item.key} onClick={() => setTrack(item.key as any)} className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${track === item.key ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg scale-105' : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-primary-light dark:hover:bg-gray-700 border border-primary-light dark:border-gray-700'}`}>
                                <item.icon className={`w-4 h-4 mb-1 ${track === item.key ? 'text-primary' : ''}`} />
                                <span className="text-[9px] font-bold uppercase">{item.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setPlaying(!playing)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${playing ? 'bg-primary text-black hover:opacity-90' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300'}`}>{playing ? <Volume2 className="w-6 h-6" /> : <Play className="w-5 h-5 ml-1" />}</button>
                        <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className="flex-1 h-2 bg-primary-light dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-black dark:accent-primary" />
                    </div>
                </div>
            )}
        </div>
    );
});
