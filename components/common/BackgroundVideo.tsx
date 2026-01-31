import React, { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';

interface BackgroundVideoProps {
    src: string;
    poster?: string;
    className?: string;
}

export const BackgroundVideo: React.FC<BackgroundVideoProps> = ({ src, poster, className }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showPlayButton, setShowPlayButton] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Force correct attributes
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;

        // Attempt Autoplay
        const attemptPlay = async () => {
            try {
                // We must reset these before play
                video.muted = true;
                await video.play();
                setIsLoaded(true);
                setShowPlayButton(false);
            } catch (err) {
                console.warn("Autoplay blocked:", err);
                setShowPlayButton(true); // Show fallback button
            }
        };

        // Delay slightly to let browser init
        const timer = setTimeout(attemptPlay, 100);

        // Listen for pause/suspend which often indicate blocking
        const handleSuspend = () => {
            if (video.paused && !isLoaded) setShowPlayButton(true);
        };
        video.addEventListener('suspend', handleSuspend);

        return () => {
            clearTimeout(timer);
            video.removeEventListener('suspend', handleSuspend);
        };
    }, [src]);

    const handleManualPlay = () => {
        const video = videoRef.current;
        if (video) {
            video.muted = true; // Still needs to be muted often for non-interaction play
            video.play().then(() => {
                setIsLoaded(true);
                setShowPlayButton(false);
            }).catch(e => console.error("Manual play failed", e));
        }
    };

    return (
        <div className={`relative ${className || 'w-full h-full'} bg-black overflow-hidden group`}>
            <video
                ref={videoRef}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                src={src}
                poster={poster}
                playsInline
                muted
                loop
                preload="auto"
                onLoadedData={() => setIsLoaded(true)}
            />

            {/* Fallback Poster */}
            <div
                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 -z-10 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
                style={{ backgroundImage: poster ? `url(${poster})` : undefined }}
            />

            {/* MANUAL PLAY BUTTON OVERLAY - Only shows if Autoplay fails */}
            {showPlayButton && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    <button
                        onClick={handleManualPlay}
                        className="flex flex-col items-center gap-2 text-white animate-bounce hover:scale-110 transition-transform cursor-pointer"
                    >
                        <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.6)]">
                            <Play className="w-8 h-8 text-black fill-black ml-1" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] bg-black/50 px-3 py-1 rounded-full border border-white/20">Enable Motion</span>
                    </button>
                </div>
            )}
        </div>
    );
};
