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
            videoRef.current.playbackRate = 0.8;
            videoRef.current.play().catch(e => {
                console.warn("Video autoplay blocked by browser policy:", e);
                // Fallback to muted interaction if needed, handled by browser controls mostly
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
            {/* Fallback Overlay to ensure text readability if video fails */}
            <div className="absolute inset-0 bg-black/30" />
        </div>
    );
};
