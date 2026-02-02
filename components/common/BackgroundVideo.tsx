import React, { useRef, useEffect } from 'react';

interface BackgroundVideoProps {
    src: string;
    poster?: string;
    className?: string;
}

export const BackgroundVideo: React.FC<BackgroundVideoProps> = ({ src, poster, className }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            // CRITICAL: defaultMuted is required for some browsers (React's muted prop isn't always enough)
            videoRef.current.defaultMuted = true;
            videoRef.current.muted = true;

            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.warn("Video autoplay failed (likely low power mode or blocking):", e);
                });
            }
        }
    }, [src]);

    return (
        <div className={`relative ${className || 'w-full h-full'} overflow-hidden`}>
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                src={src}
                poster={poster}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
            />
        </div>
    );
};
