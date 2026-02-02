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
            // Ensure muted is set before play() to allow autoplay
            videoRef.current.muted = true;
            videoRef.current.play().catch(e => {
                console.warn("Video autoplay blocked:", e);
            });
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
