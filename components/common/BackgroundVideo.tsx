import React, { useEffect, useRef, useState } from 'react';

interface BackgroundVideoProps {
    src: string;
    poster?: string;
    className?: string;
}

export const BackgroundVideo: React.FC<BackgroundVideoProps> = ({ src, poster, className }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasPlayed, setHasPlayed] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // CRITICAL FOR AUTOPLAY: Always ensure these are set properties, not just attributes
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;

        const startPlay = async () => {
            try {
                // Modern browsers require setSinkId for completely silent playback sometimes
                // @ts-ignore - setSinkId is not in all TS definitions yet
                if (typeof video.setSinkId === 'function') {
                    // @ts-ignore
                    await video.setSinkId('');
                }

                await video.play();
                setHasPlayed(true);
            } catch (err) {
                console.warn("Autoplay blocked (will retry on interaction):", err);
            }
        };

        // Attempt immediate play
        startPlay();

        // Fallback: If autoplay was blocked, play on ANY first user interaction
        const forcePlayOnInteraction = () => {
            if (video.paused) {
                video.muted = true; // Ensure muted again just in case
                video.play().then(() => {
                    setHasPlayed(true);
                    // Remove listeners once success
                    cleanupListeners();
                }).catch(e => console.error("Interaction play retry failed", e));
            }
        };

        const cleanupListeners = () => {
            window.removeEventListener('click', forcePlayOnInteraction);
            window.removeEventListener('touchstart', forcePlayOnInteraction);
            window.removeEventListener('scroll', forcePlayOnInteraction);
            window.removeEventListener('keydown', forcePlayOnInteraction);
        };

        window.addEventListener('click', forcePlayOnInteraction);
        window.addEventListener('touchstart', forcePlayOnInteraction);
        window.addEventListener('scroll', forcePlayOnInteraction);
        window.addEventListener('keydown', forcePlayOnInteraction);

        return () => cleanupListeners();
    }, [src]);

    return (
        <div className={`relative ${className || 'w-full h-full'} overflow-hidden`}>
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                muted
                playsInline
                autoPlay
                // We do NOT toggle display:none because that prevents loading/buffering.
                // Instead we assume the poster is behind it or we fade it.
                style={{ objectFit: 'cover' }}
            />
            {/* 
                We do not show a poster overlay div here because simpler is better for "just working".
                The video tag's native 'poster' attribute handles the loading image.
                If video plays, it covers the poster.
            */}
        </div>
    );
};
