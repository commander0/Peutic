import React, { useState, useEffect } from 'react';
import { Lumina } from '../../types';

interface PetCanvasProps {
    pet: Lumina;
    width?: number;
    height?: number;
    emotion?: 'idle' | 'happy' | 'hungry' | 'sleeping' | 'sad' | 'eating';
    trick?: 'spin' | 'flip' | 'magic' | null;
}

const PetCanvas: React.FC<PetCanvasProps> = ({ pet, width = 300, height = 300, emotion = 'idle', trick = null }) => {
    const [rippleFrames, setRippleFrames] = useState<number[]>([]);

    // Determine Base Color based on species and level
    const getSpeciesColor = (species: string, level: number) => {
        const isApex = level >= 10;
        switch (species) {
            case 'Neo-Shiba': return isApex ? 'from-orange-400 to-amber-600' : 'from-yellow-300 to-amber-500';
            case 'Digi-Dino': return isApex ? 'from-emerald-400 to-green-600' : 'from-green-300 to-emerald-500';
            case 'Holo-Hamu': return isApex ? 'from-pink-400 to-rose-600' : 'from-fuchsia-300 to-pink-500';
            case 'Zen-Sloth': return 'from-slate-300 to-zinc-500';
            default: return 'from-cyan-300 to-blue-500';
        }
    };

    const getGlowColor = (species: string) => {
        switch (species) {
            case 'Neo-Shiba': return 'rgba(245, 158, 11, ';
            case 'Digi-Dino': return 'rgba(16, 185, 129, ';
            case 'Holo-Hamu': return 'rgba(236, 72, 153, ';
            case 'Zen-Sloth': return 'rgba(148, 163, 184, ';
            default: return 'rgba(6, 182, 212, ';
        }
    };

    const colorClasses = getSpeciesColor(pet.species || 'Neo-Shiba', pet.level);
    const glowBase = getGlowColor(pet.species || 'Neo-Shiba');

    // Progression Size (expanding Entity of Light)
    const baseScale = Math.min(1 + (pet.level * 0.05), 2.5); // Max scale 2.5 at high levels

    // Interaction Ripples
    const handleInteract = () => {
        const id = Date.now();
        setRippleFrames(prev => [...prev, id]);
        setTimeout(() => {
            setRippleFrames(prev => prev.filter(r => r !== id));
        }, 1000); // Ripple lasts 1s
    };

    return (
        <div
            style={{ width: width, height: height, perspective: '1000px' }}
            className="relative flex items-center justify-center cursor-pointer group"
            onClick={handleInteract}
        >
            {/* Holographic Base Grid/Scanlines */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)] rounded-full pointer-events-none" />

            {/* The Entity Container (Handles tricks, sleeping, ethereal floating) */}
            <div
                className={`
                    relative flex items-center justify-center transition-all duration-700
                    ${emotion === 'sleeping' ? 'animate-pulse-slow scale-90 opacity-70' : 'animate-ethereal-breathe'}
                    ${trick === 'spin' ? 'animate-[spin_1s_ease-in-out]' : ''}
                    ${trick === 'magic' ? 'animate-[bounce_0.5s_ease-in-out_infinite] brightness-150' : ''}
                    ${emotion === 'sad' ? 'grayscale opacity-50 scale-95' : ''}
                `}
                style={{ transform: `scale(${baseScale})` }}
            >
                {/* Layer 1: Outer Ambient Glow (Diffused) */}
                <div
                    className={`absolute w-40 h-40 rounded-full blur-3xl opacity-40 mix-blend-screen transition-all duration-1000 ${emotion === 'eating' ? 'animate-pulse opacity-80 scale-125' : ''}`}
                    style={{ background: `radial-gradient(circle, ${glowBase}0.8) 0%, transparent 70%)` }}
                />

                {/* Layer 2: Core Plasma Orbitals (Rotating) */}
                <div className="absolute w-24 h-24 rotate-45 animate-[spin_8s_linear_infinite]">
                    <div className={`w-full h-full rounded-full bg-gradient-to-tr ${colorClasses} opacity-60 blur-md mix-blend-overlay`} />
                </div>
                <div className="absolute w-24 h-24 -rotate-45 animate-[spin_12s_linear_infinite_reverse]">
                    <div className={`w-full h-full rounded-[40%] bg-gradient-to-bl ${colorClasses} opacity-50 blur-sm mix-blend-overlay`} />
                </div>

                {/* Layer 3: Solid Inner Core of Light */}
                <div className={`relative w-16 h-16 rounded-full bg-gradient-to-b ${colorClasses} shadow-[0_0_30px_rgba(255,255,255,0.8)] flex items-center justify-center overflow-hidden border border-white/20`}>

                    {/* Inner White Hot Core */}
                    <div className="absolute w-6 h-6 bg-white rounded-full blur-[2px] animate-pulse"></div>

                    {/* Facial Abstraction or Emotion Indicators */}
                    {emotion === 'happy' && (
                        <div className="absolute flex gap-3 animate-bounce">
                            <div className="w-1.5 h-3 bg-white/90 rounded-full rotate-45" />
                            <div className="w-1.5 h-3 bg-white/90 rounded-full -rotate-45" />
                        </div>
                    )}

                    {emotion === 'sleeping' && (
                        <div className="absolute flex gap-4 opacity-50">
                            <div className="w-3 h-0.5 bg-black/40 rounded-full" />
                            <div className="w-3 h-0.5 bg-black/40 rounded-full" />
                        </div>
                    )}

                    {!['happy', 'sleeping'].includes(emotion) && (
                        <div className="absolute flex gap-4">
                            <div className="w-1.5 h-1.5 bg-white/80 rounded-full shadow-[0_0_5px_white] animate-[pulse_3s_infinite]" />
                            <div className="w-1.5 h-1.5 bg-white/80 rounded-full shadow-[0_0_5px_white] animate-[pulse_3s_infinite_0.5s]" />
                        </div>
                    )}
                </div>

                {/* Layer 4: Interactive Ripples */}
                {rippleFrames.map(id => (
                    <div
                        key={id}
                        className={`absolute w-32 h-32 rounded-full border-2 border-white/40 opacity-0 animate-[ping_1s_ease-out_forwards] pointer-events-none`}
                        style={{ borderColor: `${glowBase}0.8)` }}
                    />
                ))}

                {/* Sparkle Particles (CSS driven) */}
                {emotion === 'happy' && (
                    <>
                        <div className="absolute -top-10 -right-5 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white] animate-particle-float" />
                        <div className="absolute top-5 -left-10 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white] animate-particle-float" style={{ animationDelay: '0.4s' }} />
                        <div className="absolute -bottom-8 right-8 w-2 h-2 bg-yellow-200 rounded-full shadow-[0_0_10px_yellow] animate-particle-float" style={{ animationDelay: '0.8s' }} />
                    </>
                )}
            </div>
        </div>
    );
};

export default PetCanvas;
