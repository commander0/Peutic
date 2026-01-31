import React, { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';

interface BackgroundVideoProps {
    src: string;
    poster?: string;
    className?: string;
}

export const BackgroundVideo: React.FC<BackgroundVideoProps> = ({ src, poster, className }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPlayButton, setShowPlayButton] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Vital for autoplay
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;

        const attemptPlay = async () => {
            try {
                await video.setSinkId?.(''); // Attempt to clear audio output if supported
            } catch (e) { /* ignore */ }

            try {
                await video.play();
                setIsPlaying(true);
                setShowPlayButton(false);
            } catch (error) {
                console.warn("Autoplay prevention caught:", error);
                // If autoplay fails, we show the play button
                setShowPlayButton(true);
            }
        };

        attemptPlay();
    }, [src]);

    const handleManualPlay = () => {
        const video = videoRef.current;
        if (!video) return;

        // Ensure muted for best chance of playing, though user interaction allows unmuted usually.
        // Keeping it consistent with background video nature.
        video.muted = true;

        video.play().then(() => {
            setIsPlaying(true);
            setShowPlayButton(false);
        }).catch(err => {
            console.error("Manual play failed:", err);
            // Optionally show an error or keep button
        });
    };

    return (
        <div className={`relative ${className || 'w-full h-full'} overflow-hidden`}>
            {/* Video Element */}
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                muted
                playsInline
                autoPlay
                style={{ opacity: isPlaying ? 1 : 0, transition: 'opacity 0.5s ease-in' }}
            />

            {/* Static Poster Fallback (Visible when not playing) */}
            {!isPlaying && (
                <div
                    className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 pointer-events-none"
                    style={{ backgroundImage: `url(${poster})`, zIndex: 10 }}
                />
            )}

            {/* Play Button (Visible if autoplay failed and not yet playing) */}
            {showPlayButton && !isPlaying && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
                    <button
                        onClick={handleManualPlay}
                        className="group flex flex-col items-center gap-3 cursor-pointer transition-transform active:scale-95"
                    >
                        <div className="w-20 h-20 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/50 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.3)] group-hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-all duration-300">
                            <Play className="w-10 h-10 text-white fill-white ml-2 opacity-90 group-hover:opacity-100" />
                        </div>
                        <span className="text-white/80 font-bold tracking-[0.2em] text-xs uppercase group-hover:text-white transition-colors">Play Video</span>
                    </button>
                </div>
            )}
        </div>
    );
};
