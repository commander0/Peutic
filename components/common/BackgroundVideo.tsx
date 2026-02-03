import React, { useRef, useEffect, useState } from 'react';

interface BackgroundVideoProps {
    src: string;
    poster?: string;
    className?: string;
}

export const BackgroundVideo: React.FC<BackgroundVideoProps> = ({ src, poster, className }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (videoRef.current && !hasError) {
            // CRITICAL: defaultMuted is required for some browsers (React's muted prop isn't always enough)
            videoRef.current.defaultMuted = true;
            videoRef.current.muted = true;

            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.warn("Video autoplay failed (policy or source):", e);
                    // Don't set error immediately on autoplay block, only on source error
                });
            }
        }
    }, [src, hasError]);

    return (
        <div className={`relative ${className || 'w-full h-full'} overflow-hidden bg-black`}>
            {!hasError && (
                <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                    src={src}
                    poster={poster}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    onError={() => {
                        console.warn("Background video source failed to load:", src);
                        setHasError(true);
                    }}
                />
            )}

            {/* Fallback Layer (Visible if video errors or loading) */}
            <div className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-700 ${hasError ? 'opacity-100' : 'opacity-0'}`}
                style={{
                    backgroundImage: poster ? `url(${poster})` : 'none',
                    backgroundColor: '#000'
                }}
            />

            {/* Fallback Gradient if no poster */}
            {!poster && hasError && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />
            )}
        </div>
    );
};
