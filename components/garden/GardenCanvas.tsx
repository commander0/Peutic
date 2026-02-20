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
    const maxMinutes = 10;
    const progress = Math.min((garden.focusMinutes || 0) / maxMinutes, 1);

    // The previous design had defined stages: 0 (seed), 1 (sprout), 2 (small tree), 3 (full bloom)
    const stage = progress < 0.25 ? 0 : progress < 0.6 ? 1 : progress < 1 ? 2 : 3;

    // Determine colors
    const getThemeColors = (type: string) => {
        switch (type) {
            case 'Fern': return { trunk: '#573010', leaf: '#22c55e', leafDark: '#166534', bloom: '#a7f3d0' };
            case 'Rose': return { trunk: '#573010', leaf: '#10b981', leafDark: '#047857', bloom: '#fb7185' };
            case 'Sunflower': return { trunk: '#4ade80', leaf: '#4ade80', leafDark: '#22c55e', bloom: '#facc15' };
            default: return { trunk: '#573010', leaf: '#22c55e', leafDark: '#166534', bloom: '#a7f3d0' };
        }
    };

    const theme = getThemeColors(garden.currentPlantType as string);

    // Determines the sway animation speeds based on interaction (wind)
    const swayClass = interactionType === 'sing' ? 'animate-[sway_1s_ease-in-out_infinite]' : 'animate-[sway_3s_ease-in-out_infinite]';

    const SvgContent = useMemo(() => {
        return (
            <svg viewBox="0 0 100 100" className="w-[80%] h-[80%] drop-shadow-lg mx-auto overflow-visible">
                {/* Pot / Base */}
                <path d="M 30 90 L 70 90 L 65 98 L 35 98 Z" fill="#78350f" />
                <rect x="25" y="85" width="50" height="5" fill="#92400e" rx="1" />

                {/* Soil */}
                <ellipse cx="50" cy="85" rx="22" ry="3" fill="#451a03" />

                {/* Growth Stages */}
                <g style={{ transformOrigin: '50px 85px' }} className={swayClass}>
                    {/* STAGE 0: SEED */}
                    {stage === 0 && (
                        <circle cx="50" cy="83" r="3" fill={theme.leafDark} />
                    )}

                    {/* STAGE 1: SPROUT */}
                    {stage === 1 && (
                        <>
                            <path d="M 50 85 Q 45 75 50 65" fill="none" stroke={theme.trunk} strokeWidth="2" strokeLinecap="round" />
                            <circle cx="45" cy="72" r="4" fill={theme.leaf} />
                            <circle cx="54" cy="68" r="3" fill={theme.leafDark} />
                        </>
                    )}

                    {/* STAGE 2: SMALL TREE */}
                    {stage === 2 && (
                        <>
                            <path d="M 50 85 Q 40 60 55 40 Q 60 30 50 20" fill="none" stroke={theme.trunk} strokeWidth="4" strokeLinecap="round" />
                            <path d="M 47 60 Q 35 50 30 45" fill="none" stroke={theme.trunk} strokeWidth="2" strokeLinecap="round" />
                            <path d="M 53 50 Q 65 40 70 30" fill="none" stroke={theme.trunk} strokeWidth="2" strokeLinecap="round" />

                            {/* Leaves */}
                            <circle cx="30" cy="45" r="8" fill={theme.leaf} />
                            <circle cx="28" cy="42" r="6" fill={theme.leafDark} />

                            <circle cx="70" cy="30" r="9" fill={theme.leaf} />
                            <circle cx="72" cy="27" r="5" fill={theme.leafDark} />

                            <circle cx="50" cy="20" r="12" fill={theme.leaf} />
                            <circle cx="48" cy="15" r="8" fill={theme.leafDark} />
                        </>
                    )}

                    {/* STAGE 3: FULL BLOOM */}
                    {stage === 3 && (
                        <>
                            {/* Trunk */}
                            <path d="M 50 85 Q 35 50 50 30 Q 65 15 50 10" fill="none" stroke={theme.trunk} strokeWidth="6" strokeLinecap="round" />
                            <path d="M 45 60 Q 30 50 20 40" fill="none" stroke={theme.trunk} strokeWidth="3" strokeLinecap="round" />
                            <path d="M 55 50 Q 80 40 85 20" fill="none" stroke={theme.trunk} strokeWidth="3" strokeLinecap="round" />
                            <path d="M 48 40 Q 30 30 35 20" fill="none" stroke={theme.trunk} strokeWidth="2" strokeLinecap="round" />

                            {/* Main Canopy */}
                            <circle cx="50" cy="20" r="18" fill={theme.leaf} />
                            <circle cx="45" cy="15" r="14" fill={theme.leafDark} />
                            <circle cx="60" cy="18" r="12" fill={theme.leaf} />

                            <circle cx="20" cy="35" r="12" fill={theme.leaf} />
                            <circle cx="15" cy="30" r="8" fill={theme.leafDark} />

                            <circle cx="80" cy="25" r="14" fill={theme.leaf} />
                            <circle cx="85" cy="20" r="10" fill={theme.leafDark} />

                            <circle cx="35" cy="20" r="10" fill={theme.leaf} />
                            <circle cx="30" cy="15" r="6" fill={theme.leafDark} />

                            {/* Blooms/Fruits */}
                            <circle cx="45" cy="15" r="4" fill={theme.bloom} />
                            <circle cx="55" cy="25" r="3" fill={theme.bloom} />
                            <circle cx="65" cy="18" r="4.5" fill={theme.bloom} />
                            <circle cx="20" cy="35" r="3.5" fill={theme.bloom} />
                            <circle cx="80" cy="20" r="4" fill={theme.bloom} />
                            <circle cx="35" cy="18" r="3" fill={theme.bloom} />
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
