import React, { useMemo } from 'react';
import { GardenState } from '../../types';

interface GardenCanvasProps {
    garden: GardenState;
    width: number;
    height: number;
    interactionType?: 'clip' | 'water' | 'breath' | 'sing' | 'harvest' | null;
}

const GardenCanvas: React.FC<GardenCanvasProps> = ({ garden, width, height, interactionType }) => {

    // Scale focus minutes to a "Tree Age" from 0 to 1
    const maxMinutes = 25; // Decreased from 100 to 25 for faster gamification
    const progress = Math.min((garden.focusMinutes || 0) / maxMinutes, 1);
    const treeAge = 0.1 + (progress * 0.9); // 0.1 to 1.0

    // Determine colors with high fidelity gradients
    const getThemeColors = (type: string) => {
        switch (type) {
            case 'Fern': return { trunk: 'url(#trunkWood)', leaf: 'url(#leafFern)', bloom: 'url(#bloomFern)', glow: '#34d399' };
            case 'Rose': return { trunk: 'url(#trunkWood)', leaf: 'url(#leafRose)', bloom: 'url(#bloomRose)', glow: '#fb7185' };
            case 'Sunflower': return { trunk: 'url(#trunkWood)', leaf: 'url(#leafSun)', bloom: 'url(#bloomSun)', glow: '#facc15' };
            default: return { trunk: 'url(#trunkWood)', leaf: 'url(#leafFern)', bloom: 'url(#bloomFern)', glow: '#34d399' };
        }
    };

    const theme = getThemeColors(garden.currentPlantType as string);

    const generateDeterministicTree = (
        x: number, y: number, length: number, angle: number,
        depth: number, maxDepth: number,
        branches: React.ReactNode[], leaves: React.ReactNode[],
        treeAge: number, index: number = 1
    ) => {
        if (depth >= maxDepth) return;

        // Pseudo-random deterministic factor based on depth and index
        const pseudoRand = (Math.sin(depth * 13.3 + index * 5.7) + 1) / 2; // 0 to 1

        const scaledLength = length * (0.8 + pseudoRand * 0.4) * (0.5 + treeAge * 0.5);
        const x2 = x + Math.cos(angle) * scaledLength;
        const y2 = y + Math.sin(angle) * scaledLength;

        const branchWidth = Math.max((maxDepth - depth) * 1.8 * treeAge, 0.5);

        branches.push(
            <line
                key={`b-${depth}-${index}`}
                x1={x} y1={y} x2={x2} y2={y2}
                stroke={theme.trunk}
                strokeWidth={branchWidth}
                strokeLinecap="round"
                className="transition-all duration-1000"
            />
        );

        if (depth === maxDepth - 1 && treeAge > 0.3) {
            const leafSize = (2 + pseudoRand * 2.5) * treeAge;

            // Crystalline/Star Leaves instead of flat circles
            leaves.push(
                <g key={`l-${depth}-${index}`} style={{ transform: `translate(${x2}px, ${y2}px) rotate(${pseudoRand * 360}deg)` }} className="animate-float">
                    <path
                        d={`M 0 -${leafSize} L ${leafSize / 2} 0 L 0 ${leafSize} L -${leafSize / 2} 0 Z`}
                        fill={theme.leaf}
                        opacity={0.85}
                        className="transition-all duration-1000"
                    />
                </g>
            );

            if (treeAge > 0.8 && pseudoRand > 0.3) {
                // High-Fidelity Bloom Phase
                leaves.push(
                    <g key={`f-${depth}-${index}`} style={{ transform: `translate(${x2 + (pseudoRand * 4 - 2)}px, ${y2 + (pseudoRand * 4 - 2)}px)` }}>
                        <path d={`M 0 -${leafSize * 1.5} Q ${leafSize} -${leafSize * 0.5} 0 0 Q -${leafSize} -${leafSize * 0.5} 0 -${leafSize * 1.5}`} fill={theme.bloom} opacity={0.9} className="animate-[spin_4s_linear_infinite]" style={{ transformOrigin: '0px 0px' }} />
                        <path d={`M 0 -${leafSize * 1.5} Q ${leafSize} -${leafSize * 0.5} 0 0 Q -${leafSize} -${leafSize * 0.5} 0 -${leafSize * 1.5}`} fill={theme.bloom} opacity={0.9} className="animate-[spin_4s_linear_infinite]" style={{ transformOrigin: '0px 0px', transform: 'rotate(90deg)' }} />
                        <circle r={leafSize * 0.4} fill="#fff" className="animate-pulse" />
                    </g>
                );
            }
        }

        const angleOffset = 0.2 + (pseudoRand * 0.4); // 0.2 to 0.6 radians
        generateDeterministicTree(x2, y2, length * 0.75, angle - angleOffset, depth + 1, maxDepth, branches, leaves, treeAge, index * 2);
        generateDeterministicTree(x2, y2, length * 0.75, angle + angleOffset, depth + 1, maxDepth, branches, leaves, treeAge, index * 2 + 1);
    };

    const SvgContent = useMemo(() => {
        const branches: React.ReactNode[] = [];
        const leaves: React.ReactNode[] = [];

        const startX = 50;
        const startY = 85;
        const initialLength = 28 * treeAge;
        const initialAngle = -Math.PI / 2;

        const maxDepth = Math.max(2, Math.floor(treeAge * 7));

        if (treeAge < 0.25) {
            // Early Stage: Magical Seed / Sprout
            return (
                <svg viewBox="0 0 100 100" className={`w-full h-full filter ${treeAge > 0.15 ? 'drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]' : ''}`}>
                    <defs>
                        <radialGradient id="baseGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor={theme.glow} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={theme.glow} stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    {/* Ethereal Base */}
                    <ellipse cx="50" cy="88" rx="25" ry="6" fill="url(#baseGlow)" className="animate-pulse-slow" />
                    {/* Seed Core */}
                    <circle cx="50" cy="80" r={4 + (treeAge * 10)} fill={theme.leaf} className="animate-[pulse_2s_infinite]" />
                    <circle cx="50" cy="80" r={(4 + (treeAge * 10)) / 2} fill="#fff" className="animate-pulse" opacity="0.8" />
                    {/* Tiny Sprout */}
                    {treeAge > 0.15 && (
                        <path d={`M 50 75 Q ${45 - treeAge * 20} ${70 - treeAge * 30} 50 ${65 - treeAge * 40}`} fill="none" stroke="#292524" strokeWidth="2" strokeLinecap="round" className="animate-[bounce_3s_infinite]" />
                    )}
                    {/* Sparkling Energy */}
                    <circle cx="45" cy="70" r="1.5" fill={theme.glow} className="animate-ping" />
                    <circle cx="55" cy="65" r="1" fill={theme.glow} className="animate-ping" style={{ animationDelay: '0.5s' }} />
                </svg>
            );
        }

        generateDeterministicTree(startX, startY, initialLength, initialAngle, 0, maxDepth, branches, leaves, treeAge, 1);

        // Generate glowing fireflies
        const fireflies = Array.from({ length: 15 * treeAge }).map((_, i) => (
            <circle
                key={`ff-${i}`}
                cx={20 + Math.random() * 60}
                cy={20 + Math.random() * 60}
                r={0.5 + Math.random() * 1}
                fill={theme.glow}
                className="animate-pulse-slow"
                style={{
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 3}s`,
                    transformOrigin: `${20 + Math.random() * 60}px ${20 + Math.random() * 60}px`,
                    animation: `spin ${10 + Math.random() * 10}s linear infinite`
                }}
            />
        ));

        return (
            <svg viewBox="0 0 100 100" className={`w-full h-full filter ${treeAge > 0.5 ? 'drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]' : ''}`}>
                <defs>
                    {/* Gradients */}
                    <linearGradient id="trunkWood" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#292524" />
                        <stop offset="50%" stopColor="#44403c" />
                        <stop offset="100%" stopColor="#1c1917" />
                    </linearGradient>

                    <radialGradient id="leafFern" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#064e3b" />
                    </radialGradient>

                    <radialGradient id="leafRose" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#fb7185" />
                        <stop offset="100%" stopColor="#881337" />
                    </radialGradient>

                    <radialGradient id="leafSun" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#facc15" />
                        <stop offset="100%" stopColor="#713f12" />
                    </radialGradient>

                    <radialGradient id="bloomFern" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#a7f3d0" />
                        <stop offset="100%" stopColor="#10b981" />
                    </radialGradient>

                    <radialGradient id="bloomRose" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#fda4af" />
                        <stop offset="100%" stopColor="#e11d48" />
                    </radialGradient>

                    <radialGradient id="bloomSun" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#fef08a" />
                        <stop offset="100%" stopColor="#eab308" />
                    </radialGradient>

                    <radialGradient id="baseGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={theme.glow} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={theme.glow} stopOpacity="0" />
                    </radialGradient>

                    <radialGradient id="harvestGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Ethereal Base/Pedestal */}
                <ellipse cx="50" cy="88" rx="25" ry="6" fill="url(#baseGlow)" className="animate-pulse-slow" />
                <path d="M 35 85 Q 50 90 65 85 L 60 92 Q 50 95 40 92 Z" fill="url(#trunkWood)" opacity="0.8" />
                <path d="M 30 85 Q 50 78 70 85" fill="none" stroke={theme.glow} strokeWidth="0.5" opacity="0.5" />

                {/* Fireflies */}
                {fireflies}

                {/* Ambient Breathing Tree */}
                <g className={interactionType === 'sing' ? 'animate-[spin_4s_ease-in-out_infinite]' : 'animate-ethereal-breathe'} style={{ transformOrigin: '50px 85px' }}>
                    {branches}
                    {leaves}
                </g>

                {/* Harvesting Explosion Effects */}
                {interactionType === 'harvest' && (
                    <circle cx="50" cy="50" r="50" fill="url(#harvestGlow)" className="animate-[ping_1s_ease-out_forwards]" />
                )}
            </svg>
        );
    }, [treeAge, garden.currentPlantType, interactionType]);

    return (
        <div style={{ width: width, height: height }} className="relative flex flex-col items-center justify-center">

            {/* Water Interaction Effect */}
            {interactionType === 'water' && (
                <div className="absolute inset-0 bg-blue-400/20 mix-blend-overlay animate-pulse rounded-full blur-xl pointer-events-none z-10"></div>
            )}

            {/* The SVG Container */}
            <div className={`w-full h-[90%] relative z-20 transition-transform duration-1000 ${interactionType === 'clip' ? 'scale-90 rotate-2' : 'scale-100 hover:scale-[1.05] cursor-pointer'}`}>
                {SvgContent}
            </div>

            {/* Focus Minutes / Age Indicator */}
            <div className="absolute bottom-[-10px] w-full max-w-[200px] h-2 bg-gray-900 border border-gray-700/50 rounded-full overflow-hidden shadow-inner">
                <div
                    className={`h-full transition-all duration-1000 ${progress >= 1 ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)] animate-pulse' : 'bg-green-500'}`}
                    style={{ width: `${progress * 100}%` }}
                />
            </div>
            <span className="absolute bottom-[-28px] text-[10px] font-mono text-gray-400 font-bold uppercase tracking-widest">
                {progress >= 1 ? 'READY FOR HARVEST' : `${garden.focusMinutes} / ${maxMinutes} MINS`}
            </span>
        </div>
    );
};

export default React.memo(GardenCanvas);
