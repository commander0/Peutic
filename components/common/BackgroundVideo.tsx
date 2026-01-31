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

    // FORCE VIDEO AUTOPLAY (Nuclear Option) - RESTORED
    // React sometimes messes up the muted attribute during hydration.
    // By injecting raw HTML, we bypass React's lifecycle for the video element itself.
    const videoHtml = `
      <video
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
        src="${src}"
        poster="${poster || ''}"
        autoplay
        loop
        muted
        playsinline
        preload="auto"
      ></video>
    `;

    return (
        <div
            className={`relative ${className || 'w-full h-full'} overflow-hidden`}
            dangerouslySetInnerHTML={{ __html: videoHtml }}
        />
    );
};
