import React, { useState, useEffect, useRef } from 'react';
import { Volume2, CloudRain, Flame, Wind, Music, Minimize2 } from 'lucide-react';

const Soundscapes: React.FC = () => {
    const [volumes, setVolumes] = useState({ rain: 0, fire: 0, white: 0 });
    const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

    // Asset URLs (Using reliable CDNs or Placeholders)
    const ASSETS = {
        rain: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_8ed540549c.mp3', // Rain
        fire: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_83d67f4007.mp3', // Fireplace
        white: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_053c295777.mp3' // Wind/White Noise
    };

    useEffect(() => {
        // Init Audio
        Object.entries(ASSETS).forEach(([key, url]) => {
            const audio = new Audio(url);
            audio.loop = true;
            audioRefs.current[key] = audio;
        });

        return () => {
            Object.values(audioRefs.current).forEach((audio: any) => {
                audio.pause();
                audio.src = '';
            });
        };
    }, []);

    const handleVolume = (key: string, val: number) => {
        setVolumes(prev => ({ ...prev, [key]: val }));
        const audio = audioRefs.current[key];
        if (audio) {
            audio.volume = val;
            if (val > 0 && audio.paused) audio.play().catch(e => console.warn("Audio Play Error:", e));
            if (val === 0) audio.pause();
        }
    };

    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className={`transition-all duration-500 ease-spring ${isOpen ? 'w-80' : 'w-14 h-14'}`}>
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
                >
                    <Music className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
                </button>
            ) : (
                <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl border border-indigo-700 animate-in slide-in-from-bottom-10 fade-in duration-300 relative">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-2 right-2 p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <Minimize2 className="w-4 h-4 text-indigo-200" />
                    </button>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                            <Volume2 className="w-5 h-5 text-indigo-300" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Soundscapes</h3>
                            <p className="text-xs text-indigo-200">Mix your perfect atmosphere.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* RAIN */}
                        <div className="flex items-center gap-4">
                            <CloudRain className="w-5 h-5 text-blue-300" />
                            <input
                                type="range" min="0" max="1" step="0.01"
                                value={volumes.rain} onChange={(e) => handleVolume('rain', parseFloat(e.target.value))}
                                className="w-full accent-blue-400 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* FIRE */}
                        <div className="flex items-center gap-4">
                            <Flame className="w-5 h-5 text-orange-300" />
                            <input
                                type="range" min="0" max="1" step="0.01"
                                value={volumes.fire} onChange={(e) => handleVolume('fire', parseFloat(e.target.value))}
                                className="w-full accent-orange-400 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* WIND */}
                        <div className="flex items-center gap-4">
                            <Wind className="w-5 h-5 text-gray-300" />
                            <input
                                type="range" min="0" max="1" step="0.01"
                                value={volumes.white} onChange={(e) => handleVolume('white', parseFloat(e.target.value))}
                                className="w-full accent-gray-400 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Soundscapes;