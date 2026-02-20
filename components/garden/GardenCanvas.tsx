import React, { useMemo } from 'react';
import { GardenState } from '../../types';

interface GardenCanvasProps {
    garden: GardenState;
    width: number;
    height: number;
    interactionType?: 'clip' | 'water' | 'breath' | 'sing' | 'harvest' | null;
}


const GardenCanvas: React.FC<GardenCanvasProps> = ({ garden, width, height, interactionType }) => {

    // Scale focus minutes to a "Tree Age"
    const maxMinutes = 20; // Doubled difficulty
    const progress = Math.min((garden.focusMinutes || 0) / maxMinutes, 1);

    // The previous design had defined stages: 0 (seed), 1 (sprout), 2 (small tree), 3 (full bloom)
    const stage = progress < 0.25 ? 0 : progress < 0.6 ? 1 : progress < 1 ? 2 : 3;

    // Determine colors
    const getThemeColors = (type: string) => {
        switch (type) {
            case 'Fern': return { trunk: '#45220c', leaf: '#15803d', leafLight: '#4ade80', leafDark: '#064e3b', bloom: '#a7f3d0' };
            case 'Rose': return { trunk: '#45220c', leaf: '#059669', leafLight: '#34d399', leafDark: '#065f46', bloom: '#f43f5e' };
            case 'Sunflower': return { trunk: '#22c55e', leaf: '#22c55e', leafLight: '#86efac', leafDark: '#166534', bloom: '#fbbf24' };
            case 'Sakura': return { trunk: '#3f2b2b', leaf: '#fda4af', leafLight: '#fecdd3', leafDark: '#e11d48', bloom: '#ffe4e6' };
            case 'Oak': return { trunk: '#451a03', leaf: '#166534', leafLight: '#22c55e', leafDark: '#14532d', bloom: '#84cc16' };
            case 'Willow': return { trunk: '#292524', leaf: '#65a30d', leafLight: '#a3e635', leafDark: '#3f6212', bloom: '#bef264' };
            case 'Bonsai': return { trunk: '#27272a', leaf: '#065f46', leafLight: '#10b981', leafDark: '#022c22', bloom: '#d1fae5' };
            default: return { trunk: '#45220c', leaf: '#15803d', leafLight: '#4ade80', leafDark: '#064e3b', bloom: '#a7f3d0' };
        }
    };

    const theme = getThemeColors(garden.currentPlantType as string);

    // Determines the sway animation speeds based on interaction (wind)
    const swayClass = interactionType === 'sing' ? 'animate-[sway_1s_ease-in-out_infinite]' : 'animate-[sway_3s_ease-in-out_infinite]';

    const SvgContent = useMemo(() => {
        return (
            <svg viewBox="0 0 100 100" className="w-[80%] h-[80%] drop-shadow-lg mx-auto overflow-visible">
                <defs>
                    <filter id="bloom-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <linearGradient id="pot-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#451a03" />
                        <stop offset="50%" stopColor="#78350f" />
                        <stop offset="100%" stopColor="#451a03" />
                    </linearGradient>
                    <linearGradient id="trunk-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#291307" />
                        <stop offset="50%" stopColor={theme.trunk} />
                        <stop offset="100%" stopColor="#291307" />
                    </linearGradient>
                </defs>

                {/* Aura for fully bloomed tree */}
                {stage === 3 && (
                    <circle cx="50" cy="30" r="40" fill={theme.bloom} opacity="0.05" className="animate-[pulse_4s_infinite]" filter="url(#bloom-glow)" />
                )}

                {/* Pot / Base with gradient */}
                <path d="M 32 88 L 68 88 L 63 98 L 37 98 Z" fill="url(#pot-grad)" stroke="#291307" strokeWidth="0.5" />
                <rect x="28" y="85" width="44" height="3" fill="#92400e" rx="1" stroke="#451a03" strokeWidth="0.5" />
                <path d="M 28 88 L 72 88 L 70 89 L 30 89 Z" fill="#451a03" opacity="0.5" /> {/* pot rim shadow */}

                {/* Soil */}
                <ellipse cx="50" cy="85" rx="19" ry="2.5" fill="#291307" />

                {/* Growth Stages */}
                <g style={{ transformOrigin: '50px 85px' }} className={swayClass}>
                    {/* STAGE 0: SEED */}
                    {stage === 0 && (
                        <ellipse cx="50" cy="84" rx="2" ry="1.5" fill={theme.leafDark} />
                    )}

                    {/* STAGE 1: SPROUT */}
                    {stage === 1 && (
                        <>
                            <path d="M 50 85 Q 45 75 50 65" fill="none" stroke="url(#trunk-grad)" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="45" cy="72" r="4" fill={theme.leaf} />
                            <circle cx="54" cy="68" r="3" fill={theme.leafDark} />
                            <circle cx="50" cy="64" r="2" fill={theme.leafLight} />
                        </>
                    )}

                    {/* STAGE 2: SMALL TREE */}
                    {stage === 2 && (
                        <>
                            <path d="M 50 85 Q 40 60 55 40 Q 60 30 50 20" fill="none" stroke="url(#trunk-grad)" strokeWidth="4" strokeLinecap="round" />
                            <path d="M 47 60 Q 35 50 30 45" fill="none" stroke="url(#trunk-grad)" strokeWidth="2" strokeLinecap="round" />
                            <path d="M 53 50 Q 65 40 70 30" fill="none" stroke="url(#trunk-grad)" strokeWidth="2" strokeLinecap="round" />

                            {/* Leaves */}
                            <g filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.3))">
                                <circle cx="30" cy="45" r="8" fill={theme.leafDark} />
                                <circle cx="28" cy="42" r="6" fill={theme.leaf} />

                                <circle cx="70" cy="30" r="9" fill={theme.leafDark} />
                                <circle cx="72" cy="27" r="6" fill={theme.leaf} />

                                <circle cx="50" cy="20" r="12" fill={theme.leafDark} />
                                <circle cx="48" cy="15" r="9" fill={theme.leaf} />
                                <circle cx="50" cy="12" r="5" fill={theme.leafLight} />
                            </g>
                        </>
                    )}

                    {/* STAGE 3: FULL BLOOM */}
                    {stage === 3 && (
                        <>
                            {/* Trunk */}
                            <path d="M 50 85 Q 35 50 50 30 Q 65 15 50 10" fill="none" stroke="url(#trunk-grad)" strokeWidth="6" strokeLinecap="round" />
                            <path d="M 45 60 Q 30 50 20 40" fill="none" stroke="url(#trunk-grad)" strokeWidth="3" strokeLinecap="round" />
                            <path d="M 55 50 Q 80 40 85 20" fill="none" stroke="url(#trunk-grad)" strokeWidth="3" strokeLinecap="round" />
                            <path d="M 48 40 Q 30 30 35 20" fill="none" stroke="url(#trunk-grad)" strokeWidth="2" strokeLinecap="round" />

                            {/* Main Canopy */}
                            <g filter="drop-shadow(0px 3px 4px rgba(0,0,0,0.4))">
                                <circle cx="50" cy="20" r="18" fill={theme.leafDark} />
                                <circle cx="45" cy="15" r="14" fill={theme.leaf} />
                                <circle cx="48" cy="10" r="10" fill={theme.leafLight} />

                                <circle cx="60" cy="18" r="12" fill={theme.leafDark} />
                                <circle cx="62" cy="14" r="8" fill={theme.leaf} />

                                <circle cx="20" cy="35" r="12" fill={theme.leafDark} />
                                <circle cx="15" cy="30" r="8" fill={theme.leaf} />
                                <circle cx="12" cy="26" r="4" fill={theme.leafLight} />

                                <circle cx="80" cy="25" r="14" fill={theme.leafDark} />
                                <circle cx="85" cy="20" r="10" fill={theme.leaf} />

                                <circle cx="35" cy="20" r="10" fill={theme.leafDark} />
                                <circle cx="30" cy="15" r="6" fill={theme.leaf} />
                            </g>

                            {/* Glowing Blooms/Fruits */}
                            <g filter="url(#bloom-glow)">
                                <circle cx="45" cy="15" r="4" fill={theme.bloom} />
                                <circle cx="55" cy="25" r="3" fill={theme.bloom} />
                                <circle cx="68" cy="18" r="4.5" fill={theme.bloom} />
                                <circle cx="20" cy="35" r="3.5" fill={theme.bloom} />
                                <circle cx="82" cy="20" r="4" fill={theme.bloom} />
                                <circle cx="35" cy="18" r="3" fill={theme.bloom} />
                            </g>

                            {/* Falling leaves/petals animation for full bloom */}
                            <g className="animate-[fade_4s_ease-in-out_infinite]" opacity="0">
                                <path d="M 20 40 Q 22 42 20 44 Q 18 42 20 40" fill={theme.bloom} className="animate-[sway-drop_5s_linear_infinite]" />
                                <path d="M 75 30 Q 77 32 75 34 Q 73 32 75 30" fill={theme.bloom} className="animate-[sway-drop_6s_linear_infinite]" style={{ animationDelay: '2s' }} />
                            </g>
                        </>
                    )}
                </g>

                {/* Harvesting/Water Effects Overlay */}
                {interactionType === 'harvest' && (
                    <>
                        <circle cx="50" cy="50" r="50" fill="#facc15" opacity="0.5" className="animate-[ping_1s_ease-out_forwards]" />
                        <path d="M 50 0 L 52 30 L 80 20 L 60 45 L 90 60 L 60 70 L 50 100 L 40 70 L 10 60 L 40 45 L 20 20 L 48 30 Z" fill="#ffffff" opacity="0.8" className="animate-[spin_2s_linear_infinite] scale-50 origin-center" />
                    </>
                )}
                {interactionType === 'water' && (
                    <>
                        <path d="M 48 10 L 50 15 L 52 10 Z" fill="#60a5fa" className="animate-[bounce_1s_infinite]" />
                        <path d="M 30 20 L 32 25 L 34 20 Z" fill="#60a5fa" className="animate-[bounce_1.2s_infinite]" />
                        <path d="M 70 15 L 72 20 L 74 15 Z" fill="#60a5fa" className="animate-[bounce_1.1s_infinite]" />
                    </>
                )}
            </svg>
        );
    }, [stage, garden.currentPlantType, interactionType, swayClass]);

    return (
        <div style={{ width: width, height: height }} className="relative flex flex-col items-center justify-end overflow-visible">

            {/* The SVG Container */}
            <div className={`w-full relative z-20 transition-transform duration-500 origin-bottom ${interactionType === 'clip' ? 'scale-95 rotate-2' : ''}`}>
                {SvgContent}
            </div>

            {/* Focus Minutes / Age Indicator */}
            <div className="absolute bottom-[-15px] md:bottom-[-20px] w-full max-w-[150px] h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                <div
                    className={`h-full transition-all duration-1000 ${progress >= 1 ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}
                    style={{ width: `${progress * 100}%` }}
                />
            </div>
            <span className="absolute bottom-[-32px] md:bottom-[-40px] text-[9px] md:text-[10px] font-sans text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">
                {progress >= 1 ? 'READY FOR HARVEST' : `${garden.focusMinutes} / ${maxMinutes} MINS`}
            </span>
        </div>
    );
};

export default React.memo(GardenCanvas);
