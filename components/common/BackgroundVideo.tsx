import React, { useEffect, useRef, useState } from 'react';

interface BackgroundVideoProps {
    src: string;
    poster?: string;
    className?: string;
}

export const BackgroundVideo: React.FC<BackgroundVideoProps> = ({ src, poster, className }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Vital for autoplay
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;

        const attemptPlay = () => {
            video.play()
                .then(() => setIsPlaying(true))
                .catch((e) => {
                    console.warn("Autoplay blocked, waiting for interaction:", e);
                });
        };

        attemptPlay();

        // Fallback: Try to play on first user interaction
        const onInteraction = () => {
            if (video.paused) {
                video.play().catch(e => console.error("Interaction play failed", e));
            }
            // Cleanup listeners after interaction
            window.removeEventListener('click', onInteraction);
            window.removeEventListener('touchstart', onInteraction);
            window.removeEventListener('keydown', onInteraction);
        };

        window.addEventListener('click', onInteraction);
        window.addEventListener('touchstart', onInteraction);
        window.addEventListener('keydown', onInteraction);

        return () => {
            window.removeEventListener('click', onInteraction);
            window.removeEventListener('touchstart', onInteraction);
            window.removeEventListener('keydown', onInteraction);
        };
    }, [src]);

    return (
        <video
            ref={videoRef}
            src={src}
            poster={poster}
            className={className}
            autoPlay
            loop
            muted
            playsInline
            style={{ objectFit: 'cover' }}
        />
    );
};
