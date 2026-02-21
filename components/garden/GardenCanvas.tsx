import React, { useMemo } from 'react';
import { GardenState } from '../../types';

interface GardenCanvasProps {
    garden: GardenState;
    width: number;
    height: number;
    interactionType?: 'clip' | 'water' | 'breath' | 'sing' | 'harvest' | null;
}


const GardenCanvas: React.FC<GardenCanvasProps> = ({ garden, width, height, interactionType }) => {

    // Expanded Gamification: Scale up to Ethereal Entity (120 minutes)
    const maxMinutes = 120;
    const progress = Math.min((garden.focusMinutes || 0) / maxMinutes, 1);

    let stage = 0;
    const fm = garden.focusMinutes || 0;
    if (fm >= 120) stage = 6; // Ethereal Entity
    else if (fm >= 90) stage = 5; // Mystic Guardian
    else if (fm >= 60) stage = 4; // Ancient Tree
    else if (fm >= 40) stage = 3; // Mature Tree
    else if (fm >= 20) stage = 2; // Sapling
    else if (fm >= 10) stage = 1; // Sprout

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
            case 'Lunar Fern': return { trunk: '#1e1b4b', leaf: '#818cf8', leafLight: '#c7d2fe', leafDark: '#312e81', bloom: '#e0e7ff' };
            case 'Crystal Lotus': return { trunk: '#0f172a', leaf: '#38bdf8', leafLight: '#bae6fd', leafDark: '#0369a1', bloom: '#f0f9ff' };
            case 'Storm Oak': return { trunk: '#18181b', leaf: '#52525b', leafLight: '#a1a1aa', leafDark: '#27272a', bloom: '#fef08a' }; // yellow lightning blooms
            case 'Sunlight Spire': return { trunk: '#422006', leaf: '#fb923c', leafLight: '#fdba74', leafDark: '#9a3412', bloom: '#fef3c7' };
            default: return { trunk: '#45220c', leaf: '#15803d', leafLight: '#4ade80', leafDark: '#064e3b', bloom: '#a7f3d0' };
        }
    };

    const theme = getThemeColors(garden.currentPlantType as string);

    // Determines the sway animation speeds based on interaction (wind)
    const swayClass = interactionType === 'sing' ? 'animate-[sway_1s_ease-in-out_infinite]' : 'animate-[sway_3s_ease-in-out_infinite]';

    const SvgContent = useMemo(() => {
        const isRare = ['Lunar Fern', 'Crystal Lotus', 'Storm Oak', 'Sunlight Spire'].includes(garden.currentPlantType);

        return (
            <svg viewBox="0 0 100 100" className={`w-[80%] h-[80%] drop-shadow-lg mx-auto overflow-visible ${isRare ? 'drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]' : ''}`}>
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

                    {/* STAGE 3: MATURE TREE (Old Full Bloom) */}
                    {stage === 3 && (
                        <>
                            <path d="M 50 85 Q 35 50 50 30 Q 65 15 50 10" fill="none" stroke="url(#trunk-grad)" strokeWidth="6" strokeLinecap="round" />
                            <path d="M 45 60 Q 30 50 20 40" fill="none" stroke="url(#trunk-grad)" strokeWidth="3" strokeLinecap="round" />
                            <path d="M 55 50 Q 80 40 85 20" fill="none" stroke="url(#trunk-grad)" strokeWidth="3" strokeLinecap="round" />
                            <path d="M 48 40 Q 30 30 35 20" fill="none" stroke="url(#trunk-grad)" strokeWidth="2" strokeLinecap="round" />

                            <g filter="drop-shadow(0px 3px 4px rgba(0,0,0,0.4))">
                                <circle cx="50" cy="20" r="18" fill={theme.leafDark} />
                                <circle cx="45" cy="15" r="14" fill={theme.leaf} />
                                <circle cx="48" cy="10" r="10" fill={theme.leafLight} /><circle cx="60" cy="18" r="12" fill={theme.leafDark} />
                                <circle cx="62" cy="14" r="8" fill={theme.leaf} /><circle cx="20" cy="35" r="12" fill={theme.leafDark} />
                                <circle cx="15" cy="30" r="8" fill={theme.leaf} /><circle cx="12" cy="26" r="4" fill={theme.leafLight} />
                                <circle cx="80" cy="25" r="14" fill={theme.leafDark} /><circle cx="85" cy="20" r="10" fill={theme.leaf} />
                                <circle cx="35" cy="20" r="10" fill={theme.leafDark} /><circle cx="30" cy="15" r="6" fill={theme.leaf} />
                            </g>
                            <g filter="url(#bloom-glow)">
                                <circle cx="45" cy="15" r="4" fill={theme.bloom} /><circle cx="55" cy="25" r="3" fill={theme.bloom} /><circle cx="68" cy="18" r="4.5" fill={theme.bloom} />
                                <circle cx="20" cy="35" r="3.5" fill={theme.bloom} /><circle cx="82" cy="20" r="4" fill={theme.bloom} /><circle cx="35" cy="18" r="3" fill={theme.bloom} />
                            </g>
                            <g className="animate-[fade_4s_ease-in-out_infinite]" opacity="0">
                                <path d="M 20 40 Q 22 42 20 44 Q 18 42 20 40" fill={theme.bloom} className="animate-[sway-drop_5s_linear_infinite]" />
                            </g>
                        </>
                    )}

                    {/* STAGE 4: ANCIENT TREE - Thicker, wider base, glowing roots */}
                    {stage === 4 && (
                        <>
                            {/* Glowing Roots */}
                            <path d="M 50 85 Q 30 88 20 95 M 50 85 Q 70 88 80 95 M 50 85 Q 40 90 35 98 M 50 85 Q 60 90 65 98" fill="none" stroke={theme.leafLight} strokeWidth="1" strokeLinecap="round" className="animate-[pulse_3s_infinite]" opacity="0.6" />
                            <path d="M 50 85 Q 25 40 50 15 Q 75 0 50 -5" fill="none" stroke="url(#trunk-grad)" strokeWidth="10" strokeLinecap="round" />
                            <path d="M 40 50 Q 15 40 5 30" fill="none" stroke="url(#trunk-grad)" strokeWidth="5" strokeLinecap="round" />
                            <path d="M 60 50 Q 85 40 95 30" fill="none" stroke="url(#trunk-grad)" strokeWidth="5" strokeLinecap="round" />
                            <path d="M 45 30 Q 20 20 25 5" fill="none" stroke="url(#trunk-grad)" strokeWidth="4" strokeLinecap="round" />

                            <g filter="drop-shadow(0px 5px 6px rgba(0,0,0,0.6))">
                                <circle cx="50" cy="5" r="22" fill={theme.leafDark} /><circle cx="45" cy="0" r="18" fill={theme.leaf} /><circle cx="50" cy="-5" r="12" fill={theme.leafLight} />
                                <circle cx="15" cy="25" r="18" fill={theme.leafDark} /><circle cx="10" cy="20" r="14" fill={theme.leaf} /><circle cx="5" cy="15" r="8" fill={theme.leafLight} />
                                <circle cx="85" cy="25" r="18" fill={theme.leafDark} /><circle cx="90" cy="20" r="14" fill={theme.leaf} /><circle cx="95" cy="15" r="8" fill={theme.leafLight} />
                                <circle cx="30" cy="10" r="15" fill={theme.leafDark} /><circle cx="25" cy="5" r="10" fill={theme.leaf} />
                                <circle cx="70" cy="10" r="15" fill={theme.leafDark} /><circle cx="75" cy="5" r="10" fill={theme.leaf} />
                            </g>
                            <g filter="url(#bloom-glow)">
                                <circle cx="45" cy="0" r="5" fill={theme.bloom} /><circle cx="10" cy="20" r="5" fill={theme.bloom} /><circle cx="90" cy="20" r="6" fill={theme.bloom} />
                                <circle cx="30" cy="10" r="4" fill={theme.bloom} /><circle cx="70" cy="10" r="4" fill={theme.bloom} /><circle cx="50" cy="-5" r="6" fill={theme.bloom} />
                            </g>
                        </>
                    )}

                    {/* STAGE 5: MYSTIC GUARDIAN - Floating Orbs, Majestic Canopy */}
                    {stage === 5 && (
                        <>
                            <circle cx="50" cy="10" r="70" fill={theme.bloom} opacity="0.08" filter="url(#bloom-glow)" className="animate-[pulse_5s_infinite]" />
                            <path d="M 50 85 Q 25 40 50 15 Q 75 0 50 -5" fill="none" stroke="url(#trunk-grad)" strokeWidth="12" strokeLinecap="round" />
                            <path d="M 38 50 Q 10 35 0 20" fill="none" stroke="url(#trunk-grad)" strokeWidth="6" strokeLinecap="round" />
                            <path d="M 62 50 Q 90 35 100 20" fill="none" stroke="url(#trunk-grad)" strokeWidth="6" strokeLinecap="round" />

                            <g filter="drop-shadow(0px 8px 10px rgba(0,0,0,0.7))">
                                <circle cx="50" cy="0" r="28" fill={theme.leafDark} /><circle cx="45" cy="-5" r="22" fill={theme.leaf} /><circle cx="50" cy="-10" r="15" fill={theme.leafLight} />
                                <circle cx="10" cy="20" r="22" fill={theme.leafDark} /><circle cx="5" cy="15" r="18" fill={theme.leaf} /><circle cx="0" cy="10" r="10" fill={theme.leafLight} />
                                <circle cx="90" cy="20" r="22" fill={theme.leafDark} /><circle cx="95" cy="15" r="18" fill={theme.leaf} /><circle cx="100" cy="10" r="10" fill={theme.leafLight} />
                            </g>
                            <g filter="url(#bloom-glow)" className="animate-[bounce_3s_infinite]">
                                <circle cx="25" cy="-15" r="4" fill={theme.bloom} /><circle cx="75" cy="-15" r="4" fill={theme.bloom} />
                                <circle cx="15" cy="5" r="5" fill={theme.bloom} /><circle cx="85" cy="5" r="5" fill={theme.bloom} />
                                <circle cx="50" cy="-25" r="6" fill={theme.bloom} />
                            </g>
                        </>
                    )}

                    {/* STAGE 6: ETHEREAL ENTITY - Sacred Geometry, Ascension */}
                    {stage === 6 && (
                        <>
                            {/* Massive Aura */}
                            <circle cx="50" cy="0" r="90" fill={theme.leafLight} opacity="0.1" filter="url(#bloom-glow)" className="animate-[pulse_4s_infinite]" />
                            <circle cx="50" cy="0" r="60" fill={theme.bloom} opacity="0.15" filter="url(#bloom-glow)" className="animate-[spin_20s_linear_infinite]" strokeWidth="1" strokeDasharray="4 4" stroke={theme.bloom} />

                            <path d="M 50 85 Q 20 40 50 10 Q 80 -10 50 -20" fill="none" stroke="url(#trunk-grad)" strokeWidth="14" strokeLinecap="round" />
                            <path d="M 35 50 Q -5 30 -10 10" fill="none" stroke="url(#trunk-grad)" strokeWidth="7" strokeLinecap="round" />
                            <path d="M 65 50 Q 105 30 110 10" fill="none" stroke="url(#trunk-grad)" strokeWidth="7" strokeLinecap="round" />

                            {/* Crystal Canopy */}
                            <g filter="drop-shadow(0px 0px 15px rgba(255,255,255,0.5))">
                                <circle cx="50" cy="-10" r="32" fill={theme.leafDark} opacity="0.8" />
                                <circle cx="45" cy="-15" r="26" fill={theme.leaf} opacity="0.9" />
                                <circle cx="50" cy="-20" r="18" fill={theme.leafLight} />

                                <circle cx="-5" cy="10" r="26" fill={theme.leafDark} opacity="0.8" />
                                <circle cx="-10" cy="5" r="20" fill={theme.leaf} opacity="0.9" />
                                <circle cx="-15" cy="0" r="12" fill={theme.leafLight} />

                                <circle cx="105" cy="10" r="26" fill={theme.leafDark} opacity="0.8" />
                                <circle cx="110" cy="5" r="20" fill={theme.leaf} opacity="0.9" />
                                <circle cx="115" cy="0" r="12" fill={theme.leafLight} />
                            </g>

                            {/* Floating Sacred Geometry */}
                            <g filter="url(#bloom-glow)" className="animate-[spin_10s_linear_infinite_reverse]" style={{ transformOrigin: '50px -10px' }}>
                                <polygon points="50,-35 40,-15 60,-15" fill="none" stroke={theme.bloom} strokeWidth="2" />
                                <polygon points="50,15 40,-5 60,-5" fill="none" stroke={theme.bloom} strokeWidth="2" />
                            </g>
                            <g filter="url(#bloom-glow)" className="animate-[bounce_2s_infinite]">
                                <circle cx="-10" cy="-10" r="6" fill={theme.bloom} />
                                <circle cx="110" cy="-10" r="6" fill={theme.bloom} />
                                <circle cx="50" cy="-35" r="8" fill={theme.bloom} />
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
            <div className="absolute bottom-[-15px] md:bottom-[-20px] w-full max-w-[150px] h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner flex relative">
                <div
                    className={`absolute left-0 top-0 h-full transition-all duration-1000 ${progress >= 1 ? 'bg-fuchsia-500 animate-pulse shadow-[0_0_15px_rgba(217,70,239,0.8)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`}
                    style={{ width: `${progress * 100}%` }}
                />
            </div>
            <div className="absolute bottom-[-32px] md:bottom-[-40px] flex flex-col items-center">
                <span className="text-[9px] md:text-[10px] font-sans text-emerald-400 font-black uppercase tracking-[0.2em] mb-0.5">
                    {stage === 6 ? 'ETHEREAL ENTITY' : stage === 5 ? 'MYSTIC GUARDIAN' : stage === 4 ? 'ANCIENT TREE' : stage === 3 ? 'MATURE TREE' : stage === 2 ? 'SAPLING' : stage === 1 ? 'SPROUT' : 'SEED'}
                </span>
                <span className="text-[8px] md:text-[9px] font-sans text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">
                    {progress >= 1 ? 'ASCENDED' : `${garden.focusMinutes} / ${maxMinutes} MINS`}
                </span>
            </div>
        </div>
    );
};

export default React.memo(GardenCanvas);
