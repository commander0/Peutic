import React from 'react';

interface BackgroundVideoProps {
    src: string;
    poster?: string;
    className?: string;
}

export const BackgroundVideo: React.FC<BackgroundVideoProps> = ({ src, poster, className }) => {
    // NUCLEAR OPTION: DangerouslySetInnerHTML
    // We treat the video tag as a raw string to ensure React does not touch its attributes.
    // This is the only way to guarantee 'muted' and 'autoplay' work 100% of the time across all hydration states.

    const videoHTML = `
        <video
            src="${src}"
            poster="${poster || ''}"
            class="absolute inset-0 w-full h-full object-cover"
            loop
            muted
            playsinline
            autoplay
            style="object-fit: cover;"
        ></video>
    `;

    return (
        <div className={`relative ${className || 'w-full h-full'} overflow-hidden bg-black`}>
            {/* Render Raw HTML */}
            <div
                className="absolute inset-0 w-full h-full"
                dangerouslySetInnerHTML={{ __html: videoHTML }}
            />

            {/* 
                We keep a simple poster div behind it just in case the HTML takes 1ms to parse, 
                avoiding a black flash.
            */}
            <div
                className="absolute inset-0 bg-cover bg-center -z-10"
                style={{ backgroundImage: poster ? `url(${poster})` : 'none' }}
            />
        </div>
    );
};
