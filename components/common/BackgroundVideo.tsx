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

    // FORCE VIDEO AUTOPLAY (Nuclear Option)
    // React sometimes messes up the muted attribute during hydration, causing autoplay checks to fail.
    // By injecting raw HTML, we bypass React's lifecycle for the video element itself.
    const videoHtml = `
      <video
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
        src="https://player.vimeo.com/external/3249935.sd.mp4?s=d01072a3920c85b54655f05bb239f60c41076b1b&profile_id=164&oauth2_token_id=57447761"
        poster="${poster || 'https://images.pexels.com/videos/3249935/free-video-3249935.jpg'}"
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
