import React, { useEffect, useRef, useState } from 'react';

interface BackgroundVideoProps {
    src: string;
    poster?: string;
    className?: string;
}

export const BackgroundVideo: React.FC<BackgroundVideoProps> = ({ src, poster, className }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // 1. FORCE ATTRIBUTES directly on DOM element to bypass React timing issues
        video.muted = true;
        video.playsInline = true;
        video.loop = true;
        video.autoplay = true;

        // 2. Event Listeners for Robustness
        const handleCanPlay = () => {
            setIsReady(true);
            attemptPlay();
        };

        const attemptPlay = () => {
            // Promise-based play handling
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Auto-play was prevented. Waiting for user interaction.", error);
                    // If blocked, we add a ONE-TIME listener to the document to start it on first touch/click
                    const onInteract = () => {
                        video.play();
                        document.removeEventListener('click', onInteract);
                        document.removeEventListener('touchstart', onInteract);
                        document.removeEventListener('keydown', onInteract);
                    };
                    document.addEventListener('click', onInteract);
                    document.addEventListener('touchstart', onInteract);
                    document.addEventListener('keydown', onInteract);
                });
            }
        };

        video.addEventListener('canplay', handleCanPlay);

        // Check if already ready (cached)
        if (video.readyState >= 3) {
            handleCanPlay();
        }

        return () => {
            video.removeEventListener('canplay', handleCanPlay);
        };
    }, [src]);

    return (
        <div className={`relative ${className || 'w-full h-full'} overflow-hidden bg-black`}>
            {/* 
               CRITICAL: React sometimes removes attributes during hydration. 
               We use standard camelCase but also redundancy in useEffect. 
            */}
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isReady ? 'opacity-100' : 'opacity-0'}`}
                playsInline
                muted
                loop
                autoPlay // React standard
                preload="auto"
            />

            {/* Poster Fallback (Cross-fades out when video is ready) */}
            <div
                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 pointer-events-none ${isReady ? 'opacity-0' : 'opacity-100'}`}
                style={{
                    backgroundImage: poster ? `url(${poster})` : 'none',
                    zIndex: 1
                }}
            />
        </div>
    );
};
