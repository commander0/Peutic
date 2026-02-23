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
        const isCelestial = level >= 50;
        switch (species) {
            case 'Neo-Shiba': return { p: isCelestial ? '#ffffff' : isAscendant ? '#fcd34d' : isApex ? '#f59e0b' : '#fbbf24', s: isCelestial ? '#fef3c7' : isAscendant ? '#fffbeb' : isApex ? '#b45309' : '#d97706', g: isCelestial ? '#fde68a' : isAscendant ? '#ffffff' : '#fcd34d' };
            case 'Digi-Dino': return { p: isCelestial ? '#ffffff' : isAscendant ? '#6ee7b7' : isApex ? '#10b981' : '#4ade80', s: isCelestial ? '#ecfdf5' : isAscendant ? '#ecfdf5' : isApex ? '#047857' : '#16a34a', g: isCelestial ? '#a7f3d0' : isAscendant ? '#ffffff' : '#6ee7b7' };
            case 'Holo-Hamu': return { p: isCelestial ? '#ffffff' : isAscendant ? '#fbcfe8' : isApex ? '#ec4899' : '#f472b6', s: isCelestial ? '#fdf2f8' : isAscendant ? '#fdf2f8' : isApex ? '#be185d' : '#db2777', g: isCelestial ? '#fbcfe8' : isAscendant ? '#ffffff' : '#fbcfe8' };
            case 'Zen-Sloth': return { p: isCelestial ? '#ffffff' : isAscendant ? '#e7e5e4' : '#a8a29e', s: isCelestial ? '#fafaf9' : isAscendant ? '#fafaf9' : '#78716c', g: isCelestial ? '#e7e5e4' : isAscendant ? '#ffffff' : '#e7e5e4' };
            default: return { p: isCelestial ? '#ffffff' : isAscendant ? '#fcd34d' : '#fbbf24', s: isCelestial ? '#fafaf9' : isAscendant ? '#fffbeb' : '#d97706', g: isCelestial ? '#fef08a' : isAscendant ? '#ffffff' : '#fcd34d' };
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

                    {/* Level 30-49: ASCENDANT */}
                    {pet.level >= 30 && pet.level < 50 && pet.species?.toLowerCase().includes('shiba') && (
                        <g className="origin-center" style={{ transform: 'translate(50px, 50px)' }}>
                            <circle cx="0" cy="0" r="50" fill="url(#coreGlow)" opacity="0.4" className="animate-[ping_2s_ease-in-out_infinite]" />
                            <path d="M 0 -45 L 15 -15 L 45 0 L 15 15 L 0 45 L -15 15 L -45 0 L -15 -15 Z" fill={c.s} className="animate-[spin_10s_linear_infinite]" opacity="0.6" />
                            <rect x="-20" y="-20" width="40" height="40" rx="4" fill="url(#bodyGrad)" className="animate-[spin_4s_linear_infinite_reverse]" />
                            <circle cx="0" cy="0" r="18" fill={c.p} className="drop-shadow-[0_0_10px_rgba(255,255,255,1)] animate-bounce" />
                            <Face emotion={emotion} isSleeping={pet.isSleeping || emotion === 'sleeping'} scale={1.5} />
                        </g>
                    )}
                    {pet.level >= 30 && pet.level < 50 && pet.species?.toLowerCase().includes('dino') && (
                        <g className="origin-center" style={{ transform: 'translate(50px, 50px)' }}>
                            <polygon points="0,-45 40,25 -40,25" fill={c.s} opacity="0.5" className="animate-pulse" />
                            <polygon points="0,-35 30,15 -30,15" fill={c.g} opacity="0.8" className="animate-[sway_3s_ease-in-out_infinite]" />
                            <path d="M 0 -20 L 25 10 L -25 10 Z" fill="url(#bodyGrad)" className="drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                            <g className="animate-[bounce_2s_infinite]">
                                <rect x="-25" y="-5" width="10" height="15" fill={c.p} />
                                <rect x="15" y="-5" width="10" height="15" fill={c.p} />
                            </g>
                            <Face emotion={emotion} isSleeping={pet.isSleeping || emotion === 'sleeping'} scale={1.4} />
                        </g>
                    )}
                    {pet.level >= 30 && pet.level < 50 && pet.species?.toLowerCase().includes('hamu') && (
                        <g className="origin-center" style={{ transform: 'translate(50px, 50px)' }}>
                            <circle cx="0" cy="0" r="45" fill="none" stroke={c.s} strokeWidth="2" strokeDasharray="10 10" className="animate-[spin_6s_linear_infinite]" />
                            <path d="M 0 -30 C 20 -30 30 -10 0 20 C -30 -10 -20 -30 0 -30 Z" fill={c.g} opacity="0.5" className="animate-pulse scale-150" />
                            <circle cx="0" cy="0" r="22" fill="url(#bodyGrad)" className="drop-shadow-[0_0_15px_rgba(236,72,153,0.8)] animate-bounce" />
                            <circle cx="-35" cy="-20" r="6" fill={c.s} className="animate-ping" />
                            <circle cx="35" cy="-20" r="6" fill={c.s} className="animate-ping" style={{ animationDelay: '1s' }} />
                            <Face emotion={emotion} isSleeping={pet.isSleeping || emotion === 'sleeping'} scale={1.6} />
                        </g>
                    )}
                    {pet.level >= 30 && pet.level < 50 && pet.species?.toLowerCase().includes('sloth') && (
                        <g className="origin-center" style={{ transform: 'translate(50px, 50px)' }}>
                            <circle cx="0" cy="0" r="50" fill="url(#coreGlow)" opacity="0.3" className="animate-[pulse_5s_infinite]" />
                            <g className="animate-[spin_12s_linear_infinite]">
                                {[...Array(6)].map((_, i) => (
                                    <circle key={i} cx={40 * Math.cos(i * Math.PI / 3)} cy={40 * Math.sin(i * Math.PI / 3)} r="8" fill={c.s} />
                                ))}
                            </g>
                            <ellipse cx="0" cy="5" rx="28" ry="18" fill="url(#bodyGrad)" className="drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-float" />
                            <Face emotion={emotion} isSleeping={pet.isSleeping || emotion === 'sleeping'} scale={1.5} />
                        </g>
                    )}
                    {/* Fallback for ASCENDANT */}
                    {pet.level >= 30 && pet.level < 50 && !pet.species?.toLowerCase().includes('shiba') && !pet.species?.toLowerCase().includes('dino') && !pet.species?.toLowerCase().includes('hamu') && !pet.species?.toLowerCase().includes('sloth') && (
                        <g className="origin-center" style={{ transform: 'translate(50px, 50px)' }}>
                            <circle cx="0" cy="0" r="45" fill="url(#coreGlow)" opacity="0.4" className="animate-[pulse_2s_infinite]" />
                            <rect x="-25" y="-25" width="50" height="50" rx="10" fill="url(#bodyGrad)" className="animate-[spin_8s_linear_infinite]" />
                            <Face emotion={emotion} isSleeping={pet.isSleeping || emotion === 'sleeping'} scale={1.5} />
                        </g>
                    )}

                    {/* Level 50+: CELESTIAL */}
                    {pet.level >= 50 && pet.species?.toLowerCase().includes('shiba') && (
                        <g className="origin-center" style={{ transform: 'translate(50px, 50px)' }}>
                            {/* Solar Flare Halo */}
                            <circle cx="0" cy="0" r="80" fill="url(#coreGlow)" opacity="0.4" className="animate-[pulse_2s_infinite]" />
                            <path d="M 0 -70 L 10 -30 L 70 0 L 10 30 L 0 70 L -10 30 L -70 0 L -10 -30 Z" fill={c.g} opacity="0.8" className="animate-[spin_4s_linear_infinite]" />
                            <path d="M 0 -60 L 15 -20 L 60 0 L 15 20 L 0 60 L -15 20 L -60 0 L -15 -20 Z" fill={c.s} opacity="0.9" className="animate-[spin_3s_linear_infinite_reverse]" />
                            <circle cx="0" cy="0" r="25" fill="#fff" className="drop-shadow-[0_0_30px_#fcd34d]" />
                            <Face emotion={emotion} isSleeping={pet.isSleeping || emotion === 'sleeping'} scale={2.0} />
                        </g>
                    )}
                    {pet.level >= 50 && pet.species?.toLowerCase().includes('dino') && (
                        <g className="origin-center" style={{ transform: 'translate(50px, 50px)' }}>
                            {/* Crystal Behemoth */}
                            <polygon points="0,-75 60,35 -60,35" fill="url(#coreGlow)" opacity="0.3" className="animate-pulse" />
                            <polygon points="0,-60 40,20 -40,20" fill={c.s} opacity="0.6" className="animate-[bounce_3s_infinite]" />
                            <polygon points="-20,-20 50,-50 20,40" fill={c.g} opacity="0.5" className="animate-[spin_8s_linear_infinite]" />
                            <polygon points="20,-20 -50,-50 -20,40" fill={c.g} opacity="0.5" className="animate-[spin_8s_linear_infinite_reverse]" />
                            <path d="M 0 -30 L 35 25 L -35 25 Z" fill="#fff" className="drop-shadow-[0_0_20px_#10b981]" stroke={c.p} strokeWidth="4" />
                            <Face emotion={emotion} isSleeping={pet.isSleeping || emotion === 'sleeping'} scale={1.8} />
                        </g>
                    )}
                    {pet.level >= 50 && pet.species?.toLowerCase().includes('hamu') && (
                        <g className="origin-center" style={{ transform: 'translate(50px, 50px)' }}>
                            {/* Heart of the Cosmos */}
                            <circle cx="0" cy="0" r="90" fill="url(#coreGlow)" opacity="0.2" className="animate-[pulse_3s_infinite]" />
                            <path d="M 0 -50 C 40 -50 60 -10 0 40 C -60 -10 -40 -50 0 -50 Z" fill="none" stroke={c.s} strokeWidth="4" className="animate-[ping_3s_infinite]" />
                            <path d="M 0 -40 C 30 -40 45 -10 0 30 C -45 -10 -30 -40 0 -40 Z" fill={c.g} opacity="0.6" className="animate-pulse" />
                            <g className="animate-[spin_5s_linear_infinite]">
                                <circle cx="50" cy="0" r="8" fill="#fff" className="drop-shadow-[0_0_10px_#fbcfe8]" />
                                <circle cx="-50" cy="0" r="8" fill="#fff" className="drop-shadow-[0_0_10px_#fbcfe8]" />
                            </g>
                            <circle cx="0" cy="0" r="22" fill="#fff" className="drop-shadow-[0_0_25px_#ec4899] animate-bounce" />
                            <Face emotion={emotion} isSleeping={pet.isSleeping || emotion === 'sleeping'} scale={1.8} />
                        </g>
                    )}
                    {pet.level >= 50 && pet.species?.toLowerCase().includes('sloth') && (
                        <g className="origin-center" style={{ transform: 'translate(50px, 50px)' }}>
                            {/* Nirvana Entity */}
                            <circle cx="0" cy="0" r="80" fill="url(#coreGlow)" opacity="0.4" className="animate-[pulse_6s_infinite]" />
                            <g className="animate-[spin_20s_linear_infinite]">
                                {[...Array(12)].map((_, i) => (
                                    <circle key={i} cx={55 * Math.cos(i * Math.PI / 6)} cy={55 * Math.sin(i * Math.PI / 6)} r="6" fill={c.g} opacity="0.8" />
                                ))}
                            </g>
                            <g className="animate-[spin_15s_linear_infinite_reverse]">
                                {[...Array(8)].map((_, i) => (
                                    <circle key={i} cx={35 * Math.cos(i * Math.PI / 4)} cy={35 * Math.sin(i * Math.PI / 4)} r="12" fill={c.s} opacity="0.9" />
                                ))}
                            </g>
                            <ellipse cx="0" cy="0" rx="35" ry="25" fill="#fff" className="drop-shadow-[0_0_30px_#e7e5e4] animate-float" />
                            <Face emotion={emotion} isSleeping={pet.isSleeping || emotion === 'sleeping'} scale={1.8} />
                        </g>
                    )}
                    {/* Fallback for CELESTIAL */}
                    {pet.level >= 50 && !pet.species?.toLowerCase().includes('shiba') && !pet.species?.toLowerCase().includes('dino') && !pet.species?.toLowerCase().includes('hamu') && !pet.species?.toLowerCase().includes('sloth') && (
                        <g className="origin-center" style={{ transform: 'translate(50px, 50px)' }}>
                            <circle cx="0" cy="0" r="70" fill="url(#coreGlow)" opacity="0.4" className="animate-[pulse_3s_infinite]" />
                            <path d="M 0 -60 L 60 0 L 0 60 L -60 0 Z" fill="url(#bodyGrad)" className="animate-[spin_10s_linear_infinite]" />
                            <circle cx="0" cy="0" r="25" fill="#fff" className="drop-shadow-[0_0_20px_#fff] animate-bounce" />
                            <Face emotion={emotion} isSleeping={pet.isSleeping || emotion === 'sleeping'} scale={2.0} />
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
