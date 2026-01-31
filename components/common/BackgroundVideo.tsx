import React, { useEffect, useRef, useState } from 'react';

interface BackgroundVideoProps {
    src: string;
    poster?: string;
    className?: string;
}

export const BackgroundVideo: React.FC<BackgroundVideoProps> = ({ src, poster, className }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // CRITICAL: Ensure muted is set via PROPERTY to allow autoplay
        video.muted = true;
        video.defaultMuted = true;

        // Try to play immediately
        const startPlay = async () => {
            try {
                await video.play();
                setIsLoaded(true);
            } catch (err) {
                console.warn("Autoplay prevented:", err);
                // Retry on interaction (handled by standard browser behavior usually, but we can force it)
                window.addEventListener('click', () => {
                    if (video.paused) video.play();
                }, { once: true });
            }
        };
        startPlay();

    }, [src]);

    return (
        <div className={`relative ${className || 'w-full h-full'} bg-black overflow-hidden`}>
            <video
                ref={videoRef}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                src={src}
                poster={poster} // Native poster support
                autoPlay
                playsInline
                muted
                loop
                preload="auto"
                onLoadedData={() => setIsLoaded(true)}
            />
            {/* Fallback Poster (visible if video loads slowly) */}
            <div
                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 pointer-events-none -z-10 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
                style={{ backgroundImage: poster ? `url(${poster})` : undefined }}
            />
        </div>
    );
};
