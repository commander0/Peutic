import React from 'react';
import { Lumina } from '../../types';

interface PetCanvasProps {
    pet: Lumina;
    width?: number;
    height?: number;
    emotion?: 'idle' | 'happy' | 'hungry' | 'sleeping' | 'sad' | 'eating';
    trick?: 'spin' | 'magic' | null;
}

const PetCanvas: React.FC<PetCanvasProps> = ({ pet, width = 300, height = 300, emotion = 'idle', trick = null }) => {

    const getSpeciesColor = (species: string, level: number) => {
        const isApex = level >= 10;
        switch (species) {
            case 'Neo-Shiba': return isApex ? '#d97706' : '#fbbf24'; // Gold/Orange
            case 'Digi-Dino': return isApex ? '#166534' : '#4ade80'; // Green
            case 'Holo-Hamu': return isApex ? '#db2777' : '#f472b6'; // Pink
            case 'Zen-Sloth': return '#a8a29e';
            default: return '#fbbf24';
        }
    };

    const color = getSpeciesColor(pet.species, pet.level);

    // Bouncy animation based on emotion
    const bounceClass = emotion === 'sleeping' ? 'animate-pulse-slow' : 'animate-[bounce_2s_infinite]';
    const trickClass = trick === 'spin' ? 'animate-[spin_1s_ease-in-out]' : trick === 'magic' ? 'animate-[ping_0.5s_ease-in-out_infinite] brightness-150' : '';
    const sadClass = emotion === 'sad' ? 'grayscale opacity-80 scale-95' : '';

    return (
        <div style={{ width, height, perspective: '1000px' }} className="relative flex items-center justify-center">

            {/* Holographic Base Grid/Scanlines */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1)_0%,transparent_70%)] rounded-full pointer-events-none" />

            <div className={`relative transition-all duration-700 w-full h-[80%] flex items-center justify-center ${bounceClass} ${trickClass} ${sadClass}`}>

                {/* Pet scalable SVG container */}
                <svg viewBox="0 0 100 100" className="w-[80%] h-[80%] filter drop-shadow-[0_0_15px_rgba(6,182,212,0.4)] overflow-visible">

                    {/* Level 1-2: EGG */}
                    {pet.level < 3 && (
                        <g className="origin-center" style={{ transform: 'translate(50px, 60px)' }}>
                            <path d="M -15 -20 Q 0 -50 15 -20 Q 20 20 0 20 Q -20 20 -15 -20" fill="#f1f5f9" />
                            <circle cx="-5" cy="-5" r="4" fill="#94a3b8" />
                            <circle cx="8" cy="5" r="3" fill="#38bdf8" />
                        </g>
                    )}

                    {/* Level 3-5: BABY BLOB */}
                    {pet.level >= 3 && pet.level < 6 && (
                        <g className="origin-center" style={{ transform: 'translate(50px, 60px)' }}>
                            <rect x="-20" y="-15" width="40" height="35" rx="15" fill={color} />
                            {/* Nubs */}
                            <circle cx="-16" cy="-15" r="6" fill={color} />
                            <circle cx="16" cy="-15" r="6" fill={color} />

                            <Face emotion={emotion} isSleeping={pet.isSleeping || emotion === 'sleeping'} />
                        </g>
                    )}

                    {/* Level 6-9: TEEN */}
                    {pet.level >= 6 && pet.level < 10 && (
                        <g className="origin-center" style={{ transform: 'translate(50px, 50px)' }}>
                            <rect x="-25" y="-20" width="50" height="45" rx="10" fill={color} />

                            {pet.species === 'Neo-Shiba' && (
                                <>
                                    <polygon points="-25,-10 -15,-30 -5,-20" fill={color} />
                                    <polygon points="25,-10 15,-30 5,-20" fill={color} />
                                    {/* Tail */}
                                    <path d="M 20 15 Q 35 15 35 5" fill="none" stroke="#fbbf24" strokeWidth="6" strokeLinecap="round" className="animate-[pulse_0.5s_infinite]" />
                                </>
                            )}
                            {pet.species === 'Digi-Dino' && (
                                <>
                                    <polygon points="0,-20 -10,-35 10,-35" fill="#bef264" />
                                    <polygon points="10,-10 20,-20 25,-10" fill="#bef264" />
                                </>
                            )}

                            <Face emotion={emotion} isSleeping={pet.isSleeping || emotion === 'sleeping'} scale={1.2} />
                        </g>
                    )}

                    {/* Level 10+: MASTER */}
                    {pet.level >= 10 && (
                        <g className="origin-center" style={{ transform: 'translate(50px, 50px)' }}>
                            <rect x="-35" y="-30" width="70" height="60" rx="20" fill={color} className="filter drop-shadow-[0_0_20px_rgba(255,255,255,0.7)]" />

                            {pet.species === 'Neo-Shiba' && (
                                <>
                                    <polygon points="-35,-10 -20,-45 -5,-30" fill={color} />
                                    <polygon points="35,-10 20,-45 5,-30" fill={color} />
                                    {/* Scarf */}
                                    <rect x="-32" y="10" width="60" height="12" rx="4" fill="#ef4444" />
                                    <path d="M 20 20 L 35 40 L 25 45 Z" fill="#ef4444" className="animate-[bounce_1s_infinite]" />
                                </>
                            )}
                            {pet.species === 'Digi-Dino' && (
                                <>
                                    <polygon points="-5,-30 -15,-50 15,-50" fill="#166534" />
                                    <polygon points="15,-20 30,-30 35,-10" fill="#166534" />
                                    {/* Aura Spikes */}
                                    <path d="M -20 -20 Q -40 -40 -10 -40" fill="none" stroke="#4ade80" strokeWidth="5" className="animate-pulse" />
                                </>
                            )}

                            <Face emotion={emotion} isSleeping={pet.isSleeping || emotion === 'sleeping'} scale={1.5} />
                        </g>
                    )}

                </svg>

                {/* Eating Animation Particles */}
                {emotion === 'eating' && (
                    <>
                        <div className="absolute top-[60%] w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
                        <div className="absolute top-[50%] right-[30%] w-2 h-2 bg-yellow-300 rounded-full animate-bounce" />
                    </>
                )}
                {/* Happy Hearts */}
                {emotion === 'happy' && (
                    <>
                        <div className="absolute top-[20%] right-[20%] text-pink-500 animate-bounce text-2xl">❤️</div>
                        <div className="absolute top-[30%] left-[20%] text-pink-400 animate-[bounce_1s_infinite] text-lg">❤️</div>
                    </>
                )}
                {/* Sleep Zzz */}
                {(pet.isSleeping || emotion === 'sleeping') && (
                    <>
                        <div className="absolute top-[10%] right-[20%] text-cyan-500 animate-pulse text-2xl font-bold font-mono">Z</div>
                        <div className="absolute top-[20%] right-[10%] text-cyan-400 animate-[pulse_2s_infinite] text-xl font-bold font-mono">z</div>
                    </>
                )}
            </div>
        </div>
    );
};

// Subcomponent for the Face
const Face = ({ emotion, isSleeping, scale = 1 }: { emotion: string, isSleeping?: boolean, scale?: number }) => {
    return (
        <g style={{ transform: `scale(${scale})` }}>
            {isSleeping ? (
                <>
                    <path d="M -15 0 Q -10 5 -5 0" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 5 0 Q 10 5 15 0" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                </>
            ) : (
                <>
                    {/* Eyes */}
                    <circle cx="-10" cy="-5" r="4" fill="#1e293b" className="animate-[pulse_4s_infinite]" />
                    <circle cx="10" cy="-5" r="4" fill="#1e293b" className="animate-[pulse_4s_infinite]" />
                    {/* White sparkles in eyes */}
                    <circle cx="-12" cy="-7" r="1.5" fill="#ffffff" />
                    <circle cx="8" cy="-7" r="1.5" fill="#ffffff" />

                    {/* Mouth */}
                    {emotion === 'happy' && <path d="M -5 5 Q 0 12 5 5" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />}
                    {emotion === 'eating' && <circle cx="0" cy="8" r="4" fill="#ef4444" className="animate-pulse" />}
                    {emotion === 'sad' && <path d="M -5 8 Q 0 3 5 8" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />}
                    {['idle', 'hungry'].includes(emotion) && <line x1="-3" y1="5" x2="3" y2="5" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />}
                </>
            )}
        </g>
    );
}

export default PetCanvas;
