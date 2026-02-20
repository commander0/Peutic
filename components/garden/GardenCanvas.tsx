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
    const maxMinutes = 100; // 100 minutes to fully grow
    const progress = Math.min(garden.focusMinutes / maxMinutes, 1);
    const treeAge = 0.1 + (progress * 0.9); // 0.1 to 1.0

    // Determine colors
    const trunkColor = garden.currentPlantType === 'Fern' as any ? '#064e3b' : '#451a03';
    const leafColor = garden.currentPlantType === 'Rose' as any ? '#be123c' :
        garden.currentPlantType === 'Sunflower' as any ? '#ca8a04' :
            '#15803d';

    const bloomColor = garden.currentPlantType === 'Rose' as any ? '#f43f5e' :
        garden.currentPlantType === 'Sunflower' as any ? '#fde047' :
            '#86efac';

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

        const branchWidth = Math.max((maxDepth - depth) * 1.5 * treeAge, 0.5);

        branches.push(
            <line
                key={`b-${depth}-${index}`}
                x1={x} y1={y} x2={x2} y2={y2}
                stroke={trunkColor}
                strokeWidth={branchWidth}
                strokeLinecap="round"
            />
        );

        if (depth === maxDepth - 1 && treeAge > 0.3) {
            const leafSize = (2 + pseudoRand * 2) * treeAge;
            leaves.push(
                <circle
                    key={`l-${depth}-${index}`}
                    cx={x2} cy={y2}
                    r={leafSize}
                    fill={leafColor}
                    opacity={0.8}
                    className="animate-pulse-slow"
                />
            );

            if (treeAge > 0.8 && pseudoRand > 0.3) {
                // Bloom Phase
                leaves.push(
                    <circle
                        key={`f-${depth}-${index}`}
                        cx={x2 + (pseudoRand * 4 - 2)} cy={y2 + (pseudoRand * 4 - 2)}
                        r={leafSize * 1.4}
                        fill={bloomColor}
                        opacity={0.9}
                        style={{ animation: `pulse ${2 + pseudoRand}s ease-in-out infinite` }}
                    />
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
        const startY = 90;
        const initialLength = 25 * treeAge;
        const initialAngle = -Math.PI / 2;

        // Depth scales from 2 to 7 based on age
        const maxDepth = Math.max(2, Math.floor(treeAge * 7));

        generateDeterministicTree(startX, startY, initialLength, initialAngle, 0, maxDepth, branches, leaves, treeAge, 1);

        return (
            <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                {/* Pot / Ground */}
                <path d="M 35 90 L 65 90 L 60 98 L 40 98 Z" fill="#1f2937" />
                <path d="M 30 90 Q 50 85 70 90" fill="none" stroke="#0f172a" strokeWidth="2" />

                {/* Tree */}
                <g className={interactionType === 'sing' ? 'animate-[spin_3s_ease-in-out_infinite]' : ''} style={{ transformOrigin: '50px 90px' }}>
                    {branches}
                    {leaves}
                </g>

                {/* Harvesting Glow */}
                {interactionType === 'harvest' && (
                    <circle cx="50" cy="50" r="50" fill="url(#harvestGlow)" className="animate-[ping_1s_ease-out_forwards]" />
                )}
                <defs>
                    <radialGradient id="harvestGlow">
                        <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                    </radialGradient>
                </defs>
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
