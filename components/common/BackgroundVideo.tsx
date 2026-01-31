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

        // Force correct attributes for autoplay
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;

        // Attempt play
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                setIsLoaded(true);
            }).catch(e => {
                console.warn("Autoplay blocked:", e);
                // Attempt to play again on any user interaction with the document
                const onInteraction = () => {
                    video.play();
                    setIsLoaded(true);
                    document.removeEventListener('click', onInteraction);
                };
                document.addEventListener('click', onInteraction);
            });
        }

    }, [src]);

    return (
        <div className={`relative ${className || 'w-full h-full'} bg-black overflow-hidden`}>
            <video
                ref={videoRef}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                src={src}
                poster={poster}
                playsInline
                muted
                loop
                autoPlay
                preload="auto"
            />
            {/* Fallback Poster */}
            <div
                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 -z-10 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
                style={{ backgroundImage: poster ? `url(${poster})` : undefined }}
            />
        </div>
    );
};
