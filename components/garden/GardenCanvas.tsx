import React, { useMemo } from 'react';
import { GardenState } from '../../types';

interface GardenCanvasProps {
    garden: GardenState;
    width: number;
    height: number;
    interactionType?: 'clip' | 'water' | 'breath' | 'sing' | null;
    streak?: number;
}

const GardenCanvas: React.FC<GardenCanvasProps> = ({ garden, width, height, interactionType }) => {
    // Stage logic matches SQL: Level 1 (<5m), Level 2 (5-14m), Level 3 (15m+)
    const stage = Math.min(Math.max(garden.level, 1), 3);

    const SvgContent = useMemo(() => {
        if (stage === 1) {
            // Seedling SVG
            return (
                <svg viewBox="0 0 100 100" className="w-full h-full animate-ethereal-breathe filter drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                    {/* Dirt Mound */}
                    <path d="M 20 80 Q 50 70 80 80 Q 90 90 50 95 Q 10 90 20 80" fill="#2d3748" />
                    {/* Tiny Sprout */}
                    <path d="M 50 80 Q 48 60 55 50" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="55" cy="50" r="4" fill="#a3e635" />
                    <circle cx="50" cy="65" r="3" fill="#84cc16" />
                </svg>
            );
        } else if (stage === 2) {
            // Sapling SVG
            return (
                <svg viewBox="0 0 100 100" className="w-full h-full animate-ethereal-breathe filter drop-shadow-[0_0_15px_rgba(74,222,128,0.4)]">
                    {/* Dirt Mound */}
                    <path d="M 15 85 Q 50 75 85 85 Q 95 95 50 98 Q 5 95 15 85" fill="#1a202c" />
                    {/* Main Stem */}
                    <path d="M 50 85 Q 45 50 50 20" fill="none" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" />
                    {/* Branches */}
                    <path d="M 48 60 Q 30 50 25 40" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 49 40 Q 70 30 75 25" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
                    {/* Leaves */}
                    <path d="M 50 20 Q 40 10 50 5 Q 60 10 50 20" fill="#a3e635" className="animate-pulse" />
                    <path d="M 25 40 Q 15 35 25 25 Q 35 30 25 40" fill="#84cc16" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <path d="M 75 25 Q 85 15 80 5 Q 70 10 75 25" fill="#bef264" className="animate-pulse" style={{ animationDelay: '1s' }} />
                </svg>
            );
        } else {
            // Full Bloom SVG (Stage 3+)
            // Determine color based on plant type
            let bloomColor = '#f472b6'; // Default Pink (Rose/Lotus)
            let coreColor = '#fb7185';
            if (garden.currentPlantType === 'Sunflower') {
                bloomColor = '#fde047'; // Yellow
                coreColor = '#fbbf24';
            } else if (garden.currentPlantType === 'Fern') {
                bloomColor = '#6ee7b7'; // Cyan/Green
                coreColor = '#34d399';
            }

            return (
                <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                    {/* Glowing Aura */}
                    <circle cx="50" cy="40" r="35" fill={`url(#bloomGlow)`} className="animate-pulse-slow object-center transform origin-center" />
                    <defs>
                        <radialGradient id="bloomGlow">
                            <stop offset="0%" stopColor={bloomColor} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={bloomColor} stopOpacity="0" />
                        </radialGradient>
                    </defs>

                    {/* Elegant Trunk */}
                    <path d="M 50 90 Q 45 60 50 40" fill="none" stroke="#4a2e15" strokeWidth="5" strokeLinecap="round" />
                    <path d="M 48 70 Q 30 50 20 40" fill="none" stroke="#4a2e15" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 49 55 Q 70 40 80 30" fill="none" stroke="#4a2e15" strokeWidth="3" strokeLinecap="round" />

                    {/* Foliage / Blossoms */}
                    {/* Core Bloom */}
                    <circle cx="50" cy="40" r="15" fill={coreColor} className="animate-pulse" />
                    <circle cx="50" cy="40" r="8" fill="#ffffff" opacity="0.8" />

                    {/* Left Bloom */}
                    <circle cx="20" cy="40" r="10" fill={bloomColor} className="animate-pulse" style={{ animationDelay: '0.3s' }} />
                    <circle cx="20" cy="40" r="4" fill="#ffffff" opacity="0.6" />

                    {/* Right Bloom */}
                    <circle cx="80" cy="30" r="12" fill={bloomColor} className="animate-pulse" style={{ animationDelay: '0.6s' }} />
                    <circle cx="80" cy="30" r="5" fill="#ffffff" opacity="0.7" />

                    {/* Magic Particles (SVG animations) */}
                    <circle cx="35" cy="20" r="1.5" fill="#fff" className="animate-particle-float" />
                    <circle cx="65" cy="15" r="2" fill="#fff" className="animate-particle-float" style={{ animationDelay: '1.2s' }} />
                    <circle cx="50" cy="10" r="1" fill="#fff" className="animate-particle-float" style={{ animationDelay: '2s' }} />
                </svg>
            );
        }
    }, [stage, garden.currentPlantType]);

    return (
        <div style={{ width: width, height: height }} className="relative flex items-center justify-center">
            {/* Water Interaction Effect */}
            {interactionType === 'water' && (
                <div className="absolute inset-0 bg-blue-400/20 mix-blend-overlay animate-pulse rounded-full blur-xl pointer-events-none z-10"></div>
            )}

            {/* The SVG Container */}
            <div className={`w-full h-full relative z-20 transition-transform duration-1000 ${interactionType === 'clip' ? 'scale-90 rotate-2' : 'scale-100 hover:scale-105'}`}>
                {SvgContent}
            </div>

            {/* Stage Indicator (Hidden on small screens) */}
            <div className="absolute bottom-[-10px] w-full text-center pointer-events-none">
                <span className="text-[8px] font-black text-white/50 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    STAGE {stage}
                </span>
            </div>
        </div>
    );
};

export default React.memo(GardenCanvas);
