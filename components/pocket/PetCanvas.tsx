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
        const isAscendant = level >= 30;
        switch (species) {
            case 'Neo-Shiba': return { p: isAscendant ? '#fcd34d' : isApex ? '#f59e0b' : '#fbbf24', s: isAscendant ? '#fffbeb' : isApex ? '#b45309' : '#d97706', g: isAscendant ? '#ffffff' : '#fcd34d' };
            case 'Digi-Dino': return { p: isAscendant ? '#6ee7b7' : isApex ? '#10b981' : '#4ade80', s: isAscendant ? '#ecfdf5' : isApex ? '#047857' : '#16a34a', g: isAscendant ? '#ffffff' : '#6ee7b7' };
            case 'Holo-Hamu': return { p: isAscendant ? '#fbcfe8' : isApex ? '#ec4899' : '#f472b6', s: isAscendant ? '#fdf2f8' : isApex ? '#be185d' : '#db2777', g: isAscendant ? '#ffffff' : '#fbcfe8' };
            case 'Zen-Sloth': return { p: isAscendant ? '#e7e5e4' : '#a8a29e', s: isAscendant ? '#fafaf9' : '#78716c', g: isAscendant ? '#ffffff' : '#e7e5e4' };
            default: return { p: isAscendant ? '#fcd34d' : '#fbbf24', s: isAscendant ? '#fffbeb' : '#d97706', g: isAscendant ? '#ffffff' : '#fcd34d' };
        }
    };

    const c = getSpeciesColor(pet.species, pet.level);

    // Bouncy animation based on emotion
    const bounceClass = emotion === 'sleeping' ? 'animate-pulse-slow' : 'animate-[bounce_2s_infinite]';
    const trickClass = trick === 'spin' ? 'animate-[spin_1s_ease-in-out]' : trick === 'magic' ? 'animate-[ping_0.5s_ease-in-out_infinite] brightness-150' : '';
    const sadClass = emotion === 'sad' ? 'grayscale opacity-80 scale-95' : '';

    return (
        <div style={{ width, height, perspective: '1000px' }} className="relative flex items-center justify-center">

            {/* High Fidelity Holographic Base */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.15)_0%,transparent_60%)] rounded-full pointer-events-none" />

            {/* Ambient Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-particle-float opacity-0" style={{
                        left: `${20 + Math.random() * 60}%`,
                        animationDelay: `${Math.random() * 4}s`,
                        animationDuration: `${3 + Math.random() * 3}s`
                    }} />
                ))}
            </div>

            <div className={`relative transition-all duration-700 w-full h-[80%] flex items-center justify-center ${bounceClass} ${trickClass} ${sadClass}`}>

                {/* Pet scalable SVG container */}
                <svg viewBox="0 0 100 100" className={`w-[85%] h-[85%] filter ${pet.level >= 10 ? 'drop-shadow-[0_0_25px_rgba(6,182,212,0.6)]' : 'drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]'} overflow-visible`}>

                    <defs>
                        <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={c.p} />
                            <stop offset="100%" stopColor={c.s} />
                        </linearGradient>
                        <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor={c.g} stopOpacity="1" />
                            <stop offset="100%" stopColor={c.p} stopOpacity="0" />
                        </radialGradient>
                    </defs>

                    {/* Level 1-2: EGG (Core + Orbital Ring) */}
                    {pet.level < 3 && (
                        <g className="origin-center" style={{ transform: 'translate(50px, 50px)' }}>
                            <ellipse cx="0" cy="0" rx="15" ry="20" fill="url(#bodyGrad)" className="animate-pulse" />
                            <circle cx="0" cy="0" r="25" fill="none" stroke={c.g} strokeWidth="2" strokeDasharray="10 5" className="animate-[spin_4s_linear_infinite]" />
                            <circle cx="0" cy="0" r="30" fill="none" stroke={c.s} strokeWidth="1" strokeDasharray="5 15" className="animate-[spin_6s_linear_infinite_reverse]" />
                            <circle cx="0" cy="0" r="5" fill="#fff" className="animate-ping" />
                        </g>
                    )}

                    {/* Level 3-9: BABY BLOB (Soft Droplet) */}
                    {pet.level >= 3 && pet.level < 10 && (
                        <g className="origin-center" style={{ transform: 'translate(50px, 60px)' }}>
                            <path d="M 0 -25 Q 20 -25 20 0 Q 20 20 0 20 Q -20 20 -20 0 Q -20 -25 0 -25 Z" fill="url(#bodyGrad)" />
                            {/* Inner Glow */}
                            <circle cx="0" cy="-5" r="10" fill="url(#coreGlow)" opacity="0.6" />
                            <Face emotion={emotion} isSleeping={pet.isSleeping || emotion === 'sleeping'} />
                        </g>
                    )}

                    {/* Level 10-19: TEEN (Geometric Entity) */}
                    {pet.level >= 10 && pet.level < 20 && (
                        <g className="origin-center" style={{ transform: 'translate(50px, 50px)' }}>
                            {/* Floating Pods */}
                            <path d="M -30 -10 L -20 -20 L -15 -5 Z" fill={c.s} className="animate-float" style={{ animationDelay: '0.5s' }} />
                            <path d="M 30 -10 L 20 -20 L 15 -5 Z" fill={c.s} className="animate-float" style={{ animationDelay: '1s' }} />

                            {/* Main Body */}
                            <rect x="-22" y="-22" width="44" height="44" rx="12" fill="url(#bodyGrad)" />
                            <rect x="-18" y="-18" width="36" height="36" rx="8" fill="none" stroke={c.g} strokeWidth="2" opacity="0.5" />

                            <Face emotion={emotion} isSleeping={pet.isSleeping || emotion === 'sleeping'} scale={1.1} />
                        </g>
                    )}

                    {/* Level 20-29: MASTER (Sacred Geometry / Apex) */}
                    {pet.level >= 20 && pet.level < 30 && (
                        <g className="origin-center" style={{ transform: 'translate(50px, 50px)' }}>
                            {/* Aura Rings */}
                            <circle cx="0" cy="0" r="45" fill="none" stroke={c.g} strokeWidth="1" opacity="0.3" className="animate-[spin_10s_linear_infinite]" strokeDasharray="5 20" />
                            <circle cx="0" cy="0" r="38" fill="none" stroke={c.s} strokeWidth="2" opacity="0.5" className="animate-[spin_7s_linear_infinite_reverse]" strokeDasharray="30 10" />

                            {/* Cy-Wings */}
                            <path d="M -25 0 Q -45 -30 -20 -45 Q -15 -20 -25 0 Z" fill={c.s} className="animate-[pulse_1.5s_infinite]" style={{ transformOrigin: '0 0' }} />
                            <path d="M 25 0 Q 45 -30 20 -45 Q 15 -20 25 0 Z" fill={c.s} className="animate-[pulse_1.5s_infinite]" style={{ transformOrigin: '0 0' }} />

                            {/* Apex Body */}
                            <path d="M 0 -35 L 30 0 L 0 35 L -30 0 Z" fill="url(#bodyGrad)" className="drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                            <circle cx="0" cy="0" r="18" fill={c.p} className="animate-pulse" />
                            <circle cx="0" cy="0" r="12" fill="url(#coreGlow)" />

                            <Face emotion={emotion} isSleeping={pet.isSleeping || emotion === 'sleeping'} scale={1.4} />
                        </g>
                    )}

                    {/* Level 30+: ASCENDANT (Pure Energy / Starform) */}
                    {pet.level >= 30 && (
                        <g className="origin-center" style={{ transform: 'translate(50px, 50px)' }}>
                            {/* Starburst Aura */}
                            <circle cx="0" cy="0" r="50" fill="url(#coreGlow)" opacity="0.4" className="animate-[ping_3s_ease-in-out_infinite]" />
                            <path d="M 0 -50 L 5 -10 L 50 0 L 5 10 L 0 50 L -5 10 L -50 0 L -5 -10 Z" fill="url(#bodyGrad)" className="animate-[spin_15s_linear_infinite] opacity-30" />
                            <path d="M 0 -50 L 5 -10 L 50 0 L 5 10 L 0 50 L -5 10 L -50 0 L -5 -10 Z" fill={c.s} className="animate-[spin_20s_linear_infinite_reverse] opacity-50 scale-75" />

                            {/* Orbiting Orbs */}
                            <g className="animate-[spin_4s_linear_infinite]">
                                <circle cx="35" cy="0" r="3" fill="#fff" className="animate-pulse" />
                                <circle cx="-35" cy="0" r="3" fill="#fff" className="animate-pulse" />
                                <circle cx="0" cy="35" r="3" fill="#fff" className="animate-pulse" />
                                <circle cx="0" cy="-35" r="3" fill="#fff" className="animate-pulse" />
                            </g>

                            {/* Central Diamond Core */}
                            <path d="M 0 -25 L 20 0 L 0 25 L -20 0 Z" fill="url(#bodyGrad)" stroke="#fff" strokeWidth="1" className="drop-shadow-[0_0_20px_rgba(255,255,255,1)] animate-bounce" />

                            <circle cx="0" cy="0" r="6" fill="#ffffff" className="animate-pulse shadow-[0_0_10px_#fff]" />

                            <Face emotion={emotion} isSleeping={pet.isSleeping || emotion === 'sleeping'} scale={1.6} />
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
                        <div className="absolute top-[20%] right-[20%] text-pink-500 animate-bounce text-2xl drop-shadow-[0_0_5px_rgba(236,72,153,0.8)]">❤️</div>
                        <div className="absolute top-[30%] left-[20%] text-pink-400 animate-[bounce_1s_infinite] text-lg drop-shadow-[0_0_5px_rgba(236,72,153,0.8)]">❤️</div>
                    </>
                )}
                {/* Sleep Zzz */}
                {(pet.isSleeping || emotion === 'sleeping') && (
                    <>
                        <div className="absolute top-[10%] right-[20%] text-cyan-400 animate-pulse text-2xl font-black font-mono drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">Z</div>
                        <div className="absolute top-[20%] right-[10%] text-cyan-500 animate-[pulse_2s_infinite] text-xl font-bold font-mono drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">z</div>
                    </>
                )}
            </div>
        </div>
    );
};

// Subcomponent for the Face (Upgraded to Digital LED style)
const Face = ({ emotion, isSleeping, scale = 1 }: { emotion: string, isSleeping?: boolean, scale?: number }) => {
    return (
        <g style={{ transform: `scale(${scale})` }}>
            {isSleeping ? (
                <>
                    <path d="M -15 0 Q -10 5 -5 0" fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
                    <path d="M 5 0 Q 10 5 15 0" fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
                </>
            ) : (
                <>
                    {/* Digital Eyes */}
                    <rect x="-14" y="-8" width="10" height="6" rx="2" fill="#0f172a" className={emotion === 'happy' ? '' : 'animate-[pulse_3s_infinite]'} />
                    <rect x="4" y="-8" width="10" height="6" rx="2" fill="#0f172a" className={emotion === 'happy' ? '' : 'animate-[pulse_3s_infinite]'} />

                    {/* Eye Highlights */}
                    <rect x="-12" y="-6" width="3" height="2" fill="#38bdf8" />
                    <rect x="6" y="-6" width="3" height="2" fill="#38bdf8" />

                    {/* Mouth */}
                    {emotion === 'happy' && <path d="M -8 4 Q 0 12 8 4" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />}
                    {emotion === 'eating' && <ellipse cx="0" cy="6" rx="4" ry="6" fill="#0f172a" className="animate-pulse" />}
                    {emotion === 'sad' && <path d="M -8 10 Q 0 4 8 10" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />}
                    {['idle', 'hungry'].includes(emotion) && <line x1="-4" y1="5" x2="4" y2="5" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />}
                </>
            )}
        </g>
    );
}

export default PetCanvas;
