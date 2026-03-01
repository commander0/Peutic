import React, { useState, useEffect, useRef } from 'react';
import { Lumina } from '../../types';

interface PetCanvasProps {
    pet: Lumina;
    width?: number;
    height?: number;
    emotion?: 'idle' | 'happy' | 'hungry' | 'sleeping' | 'sad' | 'eating' | 'energized' | 'thinker' | 'sleepy';
    trick?: 'spin' | 'magic' | null;
}

const PetCanvas: React.FC<PetCanvasProps> = ({ pet, width = 300, height = 300, emotion = 'idle', trick = null }) => {

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setMousePos({ x, y });
    };

    const handleMouseLeave = () => {
        setMousePos({ x: 0, y: 0 });
    };

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
    const bounceClass = (emotion === 'sleeping' || emotion === 'sleepy') ? 'animate-pulse-slow' : emotion === 'energized' ? 'animate-[bounce_0.5s_infinite]' : 'animate-[bounce_2s_infinite]';
    const trickClass = trick === 'spin' ? 'animate-[spin_1s_ease-in-out]' : trick === 'magic' ? 'animate-[ping_0.5s_ease-in-out_infinite] brightness-150' : '';
    const sadClass = emotion === 'sad' ? 'grayscale opacity-80 scale-95' : '';

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Dynamic Physics Particles
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        // Define particle count and behavior scaling with level
        const baseLevel = pet.level || 1;
        const particleCount = Math.min(baseLevel * 3 + 10, 150);
        let particles: any[] = [];

        // Convert hex to hue approx for particles to match, or use fixed ethereal hues
        const isHappy = emotion === 'happy';
        const isSad = emotion === 'sad';

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * (baseLevel > 20 ? 1.5 : 0.5),
                vy: (Math.random() - 0.5) * (baseLevel > 20 ? 1.5 : 0.5) - 0.2, // Drift up
                size: Math.random() * (baseLevel > 30 ? 3 : 1.5) + 0.5,
                alpha: Math.random(),
                pulseRate: (Math.random() - 0.5) * 0.05
            });
        }

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.alpha += p.pulseRate;

                // Wrap-around
                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;
                if (p.alpha <= 0.1 || p.alpha >= 1) p.pulseRate *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

                // Color context
                if (isSad) {
                    ctx.fillStyle = `rgba(150, 150, 150, ${p.alpha})`;
                    ctx.shadowBlur = 0;
                } else if (isHappy) {
                    ctx.fillStyle = `rgba(236, 72, 153, ${p.alpha})`; // Pink
                    ctx.shadowColor = `rgba(236, 72, 153, 0.8)`;
                    ctx.shadowBlur = baseLevel > 15 ? 8 : 0;
                } else {
                    ctx.fillStyle = `rgba(34, 211, 238, ${p.alpha})`; // Cyan default
                    ctx.shadowColor = `rgba(34, 211, 238, 0.8)`;
                    ctx.shadowBlur = baseLevel > 10 ? 12 : 0;
                }

                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(render);
        };
        render();

        return () => cancelAnimationFrame(animationFrameId);
    }, [pet.level, width, height, emotion]);

    return (
        <div
            style={{ width, height, perspective: '1000px' }}
            className="relative flex items-center justify-center cursor-crosshair overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >

            {/* High Fidelity Holographic Base - Dynamic Gradient Based on Species */}
            <div className="absolute inset-0 rounded-full pointer-events-none transition-all duration-1000 ease-in-out"
                style={{ background: `radial-gradient(ellipse at center, ${c.p}33 0%, transparent 65%)` }} />

            {/* Dynamic Level-based Canvas Particles */}
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="absolute inset-0 pointer-events-none z-10"
                style={{ filter: emotion === 'sad' ? 'grayscale(100%)' : 'none' }}
            />

            <div className={`relative transition-all duration-700 w-full h-[80%] flex items-center justify-center ${bounceClass} ${trickClass} ${sadClass}`}>

                {/* Pet scalable SVG container */}
                <svg viewBox="-120 -120 240 240" className={`w-full h-full filter ${pet.level >= 10 ? 'drop-shadow-[0_0_25px_rgba(6,182,212,0.6)]' : 'drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]'} overflow-visible`}>

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
                        <g className="origin-center" style={{ transform: 'translate(0px, 0px)' }}>
                            <ellipse cx="0" cy="0" rx="15" ry="20" fill="url(#bodyGrad)" className="animate-pulse" />
                            <circle cx="0" cy="0" r="25" fill="none" stroke={c.g} strokeWidth="2" strokeDasharray="10 5" className="animate-[spin_4s_linear_infinite]" />
                            <circle cx="0" cy="0" r="30" fill="none" stroke={c.s} strokeWidth="1" strokeDasharray="5 15" className="animate-[spin_6s_linear_infinite_reverse]" />
                            <circle cx="0" cy="0" r="5" fill="#fff" className="animate-ping" />
                        </g>
                    )}

                    {/* Determine Species Fallback clearly */}
                    {(() => {
                        const s = (pet.species || '').toLowerCase();
                        const isDino = s.includes('dino') || s.includes('dragon');
                        const isHamu = s.includes('hamu') || s.includes('mouse');
                        const isSloth = s.includes('sloth') || s.includes('bear');
                        const isShiba = !isDino && !isHamu && !isSloth; // Default

                        return (
                            <>
                                {/* Level 3-9: BABY */}
                                {pet.level >= 3 && pet.level < 10 && (
                                    <g className="origin-center animate-[float_4s_ease-in-out_infinite]" style={{ transform: 'translate(0px, 10px)' }}>
                                        {isShiba && (
                                            <g className="drop-shadow-[0_0_8px_#fbbf24]">
                                                <path d="M 0 -35 Q 20 -35 25 -10 Q 30 15 0 25 Q -30 15 -25 -10 Q -20 -35 0 -35 Z" fill="url(#bodyGrad)" />
                                                <path d="M -18 -15 Q -25 -35 -5 -25 Z M 18 -15 Q 25 -35 5 -25 Z" fill={c.s} opacity="0.9" />
                                                <circle cx="0" cy="-5" r="4" fill={c.p} className="animate-pulse" />
                                            </g>
                                        )}
                                        {isDino && (
                                            <g className="drop-shadow-[0_0_8px_#34d399]">
                                                <path d="M 0 -30 L 20 -10 L 25 15 L 0 30 L -25 15 L -20 -10 Z" fill="url(#bodyGrad)" />
                                                <path d="M -15 -18 L 0 -35 L 15 -18 Z" fill={c.g} opacity="0.8" />
                                                <polygon points="-8,-5 8,-5 0,8" fill={c.s} className="animate-pulse" />
                                            </g>
                                        )}
                                        {isHamu && (
                                            <g className="drop-shadow-[0_0_8px_#f472b6]">
                                                <circle cx="0" cy="0" r="22" fill="url(#bodyGrad)" />
                                                <circle cx="-16" cy="-18" r="10" fill="none" stroke={c.s} strokeWidth="3" />
                                                <circle cx="16" cy="-18" r="10" fill="none" stroke={c.s} strokeWidth="3" />
                                                <rect x="-6" y="-6" width="12" height="4" rx="2" fill={c.g} className="animate-pulse" />
                                            </g>
                                        )}
                                        {isSloth && (
                                            <g className="drop-shadow-[0_0_8px_#a8a29e]">
                                                <ellipse cx="0" cy="0" rx="24" ry="18" fill="url(#bodyGrad)" />
                                                <path d="M -15 -5 Q 0 -15 15 -5" fill="none" stroke={c.s} strokeWidth="4" strokeLinecap="round" opacity="0.6" />
                                                <circle cx="0" cy="8" r="3" fill={c.g} />
                                            </g>
                                        )}
                                        <Face emotion={emotion} isSleeping={pet.isSleeping || emotion === 'sleeping'} mousePos={mousePos} />
                                    </g>
                                )}

                                {/* Level 10-19: TEEN */}
                                {pet.level >= 10 && pet.level < 20 && (
                                    <g className="origin-center animate-[float_5s_ease-in-out_infinite]" style={{ transform: 'translate(0px, 0px)' }}>
                                        {isShiba && (
                                            <g className="drop-shadow-[0_0_12px_#fbbf24]">
                                                <path d="M 0 -40 L 30 0 L 20 30 L -20 30 L -30 0 Z" fill="url(#bodyGrad)" />
                                                <path d="M -20 -15 L -35 -45 L -5 -25 Z M 20 -15 L 35 -45 L 5 -25 Z" fill={c.s} />
                                                <polygon points="0,-15 10,5 -10,5" fill={c.p} opacity="0.8" className="animate-pulse" />
                                                <path d="M -15 15 L 15 15" stroke={c.g} strokeWidth="2" strokeDasharray="4 2" />
                                            </g>
                                        )}
                                        {isDino && (
                                            <g className="drop-shadow-[0_0_12px_#34d399]">
                                                <path d="M 0 -45 L 35 -10 L 25 35 L -25 35 L -35 -10 Z" fill="url(#bodyGrad)" />
                                                <path d="M -20 -20 L 0 -50 L 20 -20 Z" fill={c.g} opacity="0.9" />
                                                <path d="M -35 -10 L -50 0 L -28 10 Z" fill={c.s} />
                                                <circle cx="0" cy="5" r="8" fill="none" stroke={c.p} strokeWidth="2" className="animate-[spin_4s_linear_infinite]" strokeDasharray="6 4" />
                                            </g>
                                        )}
                                        {isHamu && (
                                            <g className="drop-shadow-[0_0_12px_#f472b6]">
                                                <rect x="-26" y="-26" width="52" height="52" rx="16" fill="url(#bodyGrad)" />
                                                <path d="M -26 -10 C -40 -20 -15 -45 -10 -26 Z M 26 -10 C 40 -20 15 -45 10 -26 Z" fill={c.s} opacity="0.8" />
                                                <circle cx="0" cy="0" r="32" fill="none" stroke={c.g} strokeWidth="1" strokeDasharray="8 8" className="animate-[spin_8s_linear_infinite]" />
                                            </g>
                                        )}
                                        {isSloth && (
                                            <g className="drop-shadow-[0_0_12px_#a8a29e]">
                                                <ellipse cx="0" cy="0" rx="36" ry="24" fill="url(#bodyGrad)" />
                                                <path d="M -25 -10 Q -40 -30 -15 -15 Z M 25 -10 Q 40 -30 15 -15 Z" fill={c.s} />
                                                <path d="M -20 0 Q 0 -15 20 0" fill="none" stroke={c.g} strokeWidth="3" opacity="0.5" />
                                            </g>
                                        )}
                                        <Face emotion={emotion} isSleeping={pet.isSleeping || emotion === 'sleeping'} scale={1.2} mousePos={mousePos} />
                                    </g>
                                )}

                                {/* Level 20-29: MASTER */}
                                {pet.level >= 20 && pet.level < 30 && (
                                    <g className="origin-center animate-[float_6s_ease-in-out_infinite]" style={{ transform: 'translate(0px, 0px)' }}>
                                        {isShiba && (
                                            <g className="drop-shadow-[0_0_15px_#fbbf24]">
                                                <circle cx="0" cy="0" r="55" fill="none" stroke={c.g} strokeWidth="1" opacity="0.5" className="animate-[spin_12s_linear_infinite]" strokeDasharray="10 15" />
                                                <path d="M 0 -45 L 35 15 L -35 15 Z" fill="url(#bodyGrad)" />
                                                <path d="M -20 -20 L -45 -55 L -5 -35 Z M 20 -20 L 45 -55 L 5 -35 Z" fill={c.s} className="animate-pulse" />
                                                <polygon points="0,-20 15,5 -15,5" fill={c.p} opacity="0.8" className="animate-[pulse_2s_infinite]" />
                                                <path d="M -25 5 L -40 25 M 25 5 L 40 25" stroke={c.g} strokeWidth="3" strokeLinecap="round" />
                                            </g>
                                        )}
                                        {isDino && (
                                            <g className="drop-shadow-[0_0_15px_#34d399]">
                                                <polygon points="-30,-30 30,-30 45,10 20,40 -20,40 -45,10" fill="url(#bodyGrad)" />
                                                <polygon points="0,-30 0,-60 20,-30" fill={c.g} className="animate-pulse" />
                                                <polygon points="-30,-30 -30,-55 -10,-30" fill={c.s} className="animate-[pulse_1.5s_infinite_0.5s]" />
                                                <circle cx="0" cy="5" r="50" fill="none" stroke={c.p} strokeWidth="2" className="animate-[spin_8s_linear_infinite]" strokeDasharray="15 15" />
                                            </g>
                                        )}
                                        {isHamu && (
                                            <g className="drop-shadow-[0_0_15px_#f472b6]">
                                                <circle cx="0" cy="0" r="32" fill="url(#bodyGrad)" />
                                                <circle cx="0" cy="0" r="48" fill="none" stroke={c.s} strokeWidth="2" strokeDasharray="4 12" className="animate-[spin_6s_linear_infinite]" />
                                                <circle cx="0" cy="0" r="58" fill="none" stroke={c.g} strokeWidth="1" strokeDasharray="20 10" className="animate-[spin_10s_linear_infinite_reverse]" />
                                                <path d="M -30 -15 C -50 -40 -10 -55 -10 -30 Z M 30 -15 C 50 -40 10 -55 10 -30 Z" fill={c.s} opacity="0.9" className="animate-pulse" />
                                            </g>
                                        )}
                                        {isSloth && (
                                            <g className="drop-shadow-[0_0_15px_#a8a29e]">
                                                <ellipse cx="0" cy="0" rx="42" ry="32" fill="url(#bodyGrad)" />
                                                <path d="M -30 -15 Q -50 -45 -15 -25 Z M 30 -15 Q 50 -45 15 -25 Z" fill={c.s} opacity="0.8" />
                                                <path d="M -25 -5 Q 0 -25 25 -5" fill="none" stroke={c.g} strokeWidth="5" strokeLinecap="round" opacity="0.7" />
                                            </g>
                                        )}
                                        <Face emotion={emotion} isSleeping={pet.isSleeping || emotion === 'sleeping'} scale={1.4} mousePos={mousePos} />
                                    </g>
                                )}

                                {/* Level 30-49: ASCENDANT */}
                                {pet.level >= 30 && pet.level < 50 && (
                                    <g className="origin-center animate-[float_4s_ease-in-out_infinite]" style={{ transform: 'translate(0px, 0px)' }}>
                                        {isShiba && (
                                            <g className="drop-shadow-[0_0_20px_#fbbf24]">
                                                <circle cx="0" cy="0" r="60" fill="url(#coreGlow)" opacity="0.4" className="animate-[ping_3s_ease-in-out_infinite]" />
                                                <path d="M 0 -55 L 20 -20 L 55 0 L 20 20 L 0 55 L -20 20 L -55 0 L -20 -20 Z" fill={c.p} opacity="0.3" className="animate-[spin_15s_linear_infinite]" />
                                                <path d="M 0 -40 Q 30 -40 35 0 Q 30 30 0 35 Q -30 30 -35 0 Q -30 -40 0 -40 Z" fill="url(#bodyGrad)" />
                                                <path d="M -15 -25 L -40 -65 L -5 -40 Z M 15 -25 L 40 -65 L 5 -40 Z" fill={c.s} className="animate-pulse" />
                                                <circle cx="0" cy="0" r="75" fill="none" stroke={c.s} strokeWidth="1" strokeDasharray="5 20" className="animate-[spin_10s_linear_infinite_reverse]" />
                                            </g>
                                        )}
                                        {isDino && (
                                            <g className="drop-shadow-[0_0_20px_#34d399]">
                                                <polygon points="0,-60 50,35 -50,35" fill="url(#coreGlow)" opacity="0.4" className="animate-pulse" />
                                                <polygon points="-35,-20 35,-20 45,25 25,45 -25,45 -45,25" fill="url(#bodyGrad)" />
                                                <polygon points="0,-45 25,-15 -25,-15" fill={c.p} opacity="0.6" className="animate-bounce" />
                                                <path d="M 0 -20 L 0 -75 L 25 -30 Z" fill={c.g} className="animate-[pulse_1.5s_infinite]" />
                                                <path d="M -35 -20 L -55 -40 L -25 -20 Z M 35 -20 L 55 -40 L 25 -20 Z" fill={c.s} className="animate-pulse" />
                                                <circle cx="0" cy="5" r="65" fill="none" stroke={c.g} strokeWidth="2" className="animate-[spin_5s_linear_infinite]" strokeDasharray="20 10 5 10" />
                                            </g>
                                        )}
                                        {isHamu && (
                                            <g className="drop-shadow-[0_0_20px_#f472b6]">
                                                <circle cx="0" cy="0" r="40" fill="url(#bodyGrad)" />
                                                <circle cx="0" cy="0" r="55" fill="none" stroke={c.s} strokeWidth="3" strokeDasharray="8 16" className="animate-[spin_4s_linear_infinite]" />
                                                <circle cx="0" cy="0" r="70" fill="none" stroke={c.g} strokeWidth="1" strokeDasharray="30 15" className="animate-[spin_8s_linear_infinite_reverse]" />
                                                <path d="M -35 -20 C -65 -50 -15 -70 -10 -40 Z M 35 -20 C 65 -50 15 -70 10 -40 Z" fill={c.p} opacity="0.8" className="animate-bounce" />
                                                <rect x="-15" y="-15" width="30" height="30" fill="none" stroke={c.s} strokeWidth="2" className="animate-[spin_6s_linear_infinite]" />
                                            </g>
                                        )}
                                        {isSloth && (
                                            <g className="drop-shadow-[0_0_20px_#a8a29e]">
                                                <circle cx="0" cy="0" r="60" fill="url(#coreGlow)" opacity="0.5" className="animate-[pulse_4s_infinite]" />
                                                <path d="M 0 -45 C 50 -45 50 35 0 35 C -50 35 -50 -45 0 -45 Z" fill="url(#bodyGrad)" />
                                                <path d="M -35 -20 C -60 -55 -20 -40 -15 -25 Z M 35 -20 C 60 -55 20 -40 15 -25 Z" fill={c.p} opacity="0.7" />
                                                <g className="animate-[spin_25s_linear_infinite_reverse]">
                                                    <circle cx="0" cy="0" r="85" fill="none" stroke={c.s} strokeWidth="1" strokeDasharray="10 30" />
                                                </g>
                                            </g>
                                        )}
                                        <Face emotion={emotion} isSleeping={pet.isSleeping || emotion === 'sleeping'} scale={1.5} mousePos={mousePos} />
                                    </g>
                                )}

                                {/* Level 50+: CELESTIAL */}
                                {pet.level >= 50 && (
                                    <g className="origin-center animate-[float_8s_ease-in-out_infinite]" style={{ transform: 'translate(0px, 0px)' }}>
                                        {isShiba && (
                                            <g className="drop-shadow-[0_0_30px_#fbbf24]">
                                                <circle cx="0" cy="0" r="90" fill="url(#coreGlow)" opacity="0.5" className="animate-[pulse_2s_infinite]" />
                                                <g className="animate-[spin_20s_linear_infinite]">
                                                    <path d="M 0 -80 L 25 -25 L 80 0 L 25 25 L 0 80 L -25 25 L -80 0 L -25 -25 Z" fill={c.s} opacity="0.2" />
                                                    <circle cx="0" cy="0" r="100" fill="none" stroke={c.p} strokeWidth="2" strokeDasharray="2 10 20 10" />
                                                </g>
                                                <path d="M 0 -50 Q 40 -50 45 0 Q 40 40 0 45 Q -40 40 -45 0 Q -40 -50 0 -50 Z" fill="url(#bodyGrad)" />
                                                <path d="M -20 -30 L -50 -85 L -5 -50 Z M 20 -30 L 50 -85 L 5 -50 Z" fill={c.g} className="animate-pulse" />
                                            </g>
                                        )}
                                        {isDino && (
                                            <g className="drop-shadow-[0_0_30px_#34d399]">
                                                <polygon points="0,-100 85,45 -85,45" fill="url(#coreGlow)" opacity="0.4" className="animate-pulse" />
                                                <polygon points="-45,-25 45,-25 55,35 35,55 -35,55 -55,35" fill="url(#bodyGrad)" />
                                                <polygon points="0,-60 35,-15 -35,-15" fill={c.s} opacity="0.7" className="animate-bounce" />
                                                <path d="M -15 -25 L 0 -95 L 25 -35 Z" fill={c.g} className="animate-[pulse_1.5s_infinite]" />
                                                <path d="M -45 -25 L -75 -45 L -35 -25 Z M 45 -25 L 75 -45 L 35 -25 Z" fill={c.p} className="animate-pulse" />
                                                <circle cx="0" cy="5" r="85" fill="none" stroke={c.g} strokeWidth="3" className="animate-[spin_8s_linear_infinite]" strokeDasharray="30 20 10 20" />
                                            </g>
                                        )}
                                        {isHamu && (
                                            <g className="drop-shadow-[0_0_30px_#f472b6]">
                                                <circle cx="0" cy="0" r="100" fill="url(#coreGlow)" opacity="0.4" className="animate-[pulse_3s_infinite]" />
                                                <circle cx="0" cy="0" r="50" fill="url(#bodyGrad)" />
                                                <circle cx="0" cy="0" r="70" fill="none" stroke={c.s} strokeWidth="4" strokeDasharray="12 24" className="animate-[spin_5s_linear_infinite]" />
                                                <circle cx="0" cy="0" r="85" fill="none" stroke={c.g} strokeWidth="2" strokeDasharray="40 20" className="animate-[spin_10s_linear_infinite_reverse]" />
                                                <path d="M -45 -25 C -85 -65 -20 -90 -15 -50 Z M 45 -25 C 85 -65 20 -90 15 -50 Z" fill={c.p} opacity="0.9" className="animate-bounce" />
                                                <rect x="-25" y="-25" width="50" height="50" fill="none" stroke={c.s} strokeWidth="3" className="animate-[spin_8s_linear_infinite]" />
                                            </g>
                                        )}
                                        {isSloth && (
                                            <g className="drop-shadow-[0_0_30px_#a8a29e]">
                                                <circle cx="0" cy="0" r="110" fill="url(#coreGlow)" opacity="0.6" className="animate-[pulse_6s_infinite]" />
                                                <path d="M 0 -60 C 65 -60 65 45 0 45 C -65 45 -65 -60 0 -60 Z" fill="url(#bodyGrad)" />
                                                <path d="M -45 -25 C -80 -70 -25 -50 -20 -30 Z M 45 -25 C 80 -70 25 -50 20 -30 Z" fill={c.p} opacity="0.8" />
                                                <g className="animate-[spin_40s_linear_infinite_reverse]">
                                                    <circle cx="0" cy="0" r="115" fill="none" stroke={c.g} strokeWidth="2" strokeDasharray="15 45" />
                                                    <circle cx="0" cy="0" r="95" fill="none" stroke={c.p} strokeWidth="1" strokeDasharray="5 15" />
                                                </g>
                                                <path d="M -50 20 Q -90 50 -100 20 Q -110 -10 -70 5 Z M 50 20 Q 90 50 100 20 Q 110 -10 70 5 Z" fill={c.s} opacity="0.6" className="animate-[sway_5s_ease-in-out_infinite]" />
                                            </g>
                                        )}
                                        <Face emotion={emotion} isSleeping={pet.isSleeping || emotion === 'sleeping'} scale={isHamu ? 2.5 : 2.0} mousePos={mousePos} />
                                    </g>
                                )}
                            </>
                        );
                    })()}

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
                {(pet.isSleeping || emotion === 'sleeping' || emotion === 'sleepy') && (
                    <>
                        <div className="absolute top-[10%] right-[20%] text-cyan-400 animate-pulse text-2xl font-black font-mono drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">Z</div>
                        <div className="absolute top-[20%] right-[10%] text-cyan-500 animate-[pulse_2s_infinite] text-xl font-bold font-mono drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">z</div>
                    </>
                )}
            </div>

            {/* Glowing Interactive Toy (Orb) */}
            {(mousePos.x !== 0 || mousePos.y !== 0) && (
                <div
                    className="absolute w-6 h-6 bg-yellow-200 rounded-full blur-[2px] pointer-events-none transition-transform duration-75 ease-out shadow-[0_0_20px_rgba(253,224,71,1)] z-50 animate-pulse"
                    style={{
                        left: `calc(50% + ${mousePos.x * width}px)`,
                        top: `calc(50% + ${mousePos.y * height}px)`,
                        transform: 'translate(-50%, -50%)'
                    }}
                />
            )}
        </div>
    );
};

// Subcomponent for the Face (Upgraded to Digital LED style)
const Face = ({ emotion, isSleeping, scale = 1, mousePos = { x: 0, y: 0 } }: { emotion: string, isSleeping?: boolean, scale?: number, mousePos?: { x: number, y: number } }) => {

    // Calculate eye tracking offset
    const eyeOffsetX = isSleeping ? 0 : mousePos.x * 12;
    const eyeOffsetY = isSleeping ? 0 : mousePos.y * 12;

    return (
        <g style={{ transform: `scale(${scale})` }}>
            {isSleeping ? (
                <>
                    <path d="M -15 0 Q -10 5 -5 0" fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
                    <path d="M 5 0 Q 10 5 15 0" fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
                </>
            ) : (
                <>
                    <g style={{ transform: `translate(${eyeOffsetX}px, ${eyeOffsetY}px)`, transition: 'transform 0.1s ease-out' }}>
                        {/* Digital Eyes */}
                        <rect x="-14" y="-8" width="10" height="6" rx="2" fill="#0f172a" className={emotion === 'happy' ? '' : 'animate-[pulse_3s_infinite]'} />
                        <rect x="4" y="-8" width="10" height="6" rx="2" fill="#0f172a" className={emotion === 'happy' ? '' : 'animate-[pulse_3s_infinite]'} />

                        {/* Eye Highlights */}
                        <rect x="-12" y="-6" width="3" height="2" fill="#38bdf8" />
                        <rect x="6" y="-6" width="3" height="2" fill="#38bdf8" />
                    </g>

                    {/* Mouth */}
                    {emotion === 'happy' && <path d="M -8 4 Q 0 12 8 4" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />}
                    {(emotion === 'eating' || emotion === 'energized') && <ellipse cx="0" cy="6" rx="4" ry="6" fill="#0f172a" className="animate-pulse" />}
                    {emotion === 'sad' && <path d="M -8 10 Q 0 4 8 10" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />}
                    {['idle', 'hungry'].includes(emotion) && <line x1="-4" y1="5" x2="4" y2="5" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />}

                    {/* Thinker specifics */}
                    {emotion === 'thinker' && <path d="M -4 5 Q 0 7 4 5" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />}
                    {emotion === 'thinker' && <circle cx="10" cy="-14" r="3" fill="#facc15" className="animate-pulse" />}
                </>
            )}
        </g>
    );
}

export default PetCanvas;
