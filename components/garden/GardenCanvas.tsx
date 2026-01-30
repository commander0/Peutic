import React, { useRef, useEffect } from 'react';
import { GardenState } from '../../types';

interface GardenCanvasProps {
    garden: GardenState;
    width: number;
    height: number;
}

const GardenCanvas: React.FC<GardenCanvasProps> = ({ garden, width, height }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef<number>(0);

    // --- FRACTAL BONSAI RENDERER ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let sway = 0;

        const drawBranch = (startX: number, startY: number, len: number, angle: number, branchWidth: number, depth: number) => {
            ctx.beginPath();
            ctx.save();

            ctx.translate(startX, startY);
            ctx.rotate(angle + Math.sin(sway * 0.5 + depth) * 0.02); // Subtle wind sway
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -len);

            // Tapered branch style
            ctx.lineWidth = branchWidth;
            ctx.lineCap = 'round';
            ctx.strokeStyle = depth < 2 ? '#3E2723' : '#5D4037'; // Bark colors
            ctx.stroke();

            // Growth limit logic
            // If branch is too small or depth exceeds level-based complexity
            // (Level 1 = depth 3, Level 10 = depth 13 etc, capped slightly)
            const maxDepth = Math.min(garden.level + 3, 12);

            if (len < 10 || depth > maxDepth) {
                // Draw Leaves/Blossoms at tips
                ctx.beginPath();
                // Randomize leaf size slightly
                const leafSize = 4 + Math.random() * 2;
                ctx.arc(0, -len, leafSize, 0, Math.PI * 2);

                // Color based on plant type (defaulting to Sakura logic for now as requested by user aesthetic)
                // If the user hasn't selected a type, default to Green.
                const isSakura = garden.currentPlantType === 'Sakura' || garden.currentPlantType === 'Rose';
                ctx.fillStyle = isSakura ? '#F48FB1' : '#4CAF50';

                ctx.fill();
                ctx.restore();
                return;
            }

            // Recursive branching
            // Left branch
            drawBranch(0, -len, len * 0.75, 0.4, branchWidth * 0.7, depth + 1);
            // Right branch
            drawBranch(0, -len, len * 0.75, -0.4, branchWidth * 0.7, depth + 1);

            ctx.restore();
        };

        const render = () => {
            sway += 0.05;

            // Clear
            ctx.clearRect(0, 0, width, height);

            // Background (Soft Gradient)
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#E0F7FA');
            gradient.addColorStop(1, '#FFFFFF');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Sun
            ctx.beginPath();
            ctx.arc(width * 0.8, height * 0.2, 40, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 235, 59, 0.5)'; // Soft sun
            ctx.fill();

            // Ground/Pot
            ctx.fillStyle = '#795548';
            ctx.fillRect(width / 2 - 60, height - 40, 120, 20); // Pot rim

            ctx.beginPath();
            ctx.moveTo(width / 2 - 50, height - 40);
            ctx.lineTo(width / 2 + 50, height - 40);
            ctx.lineTo(width / 2 + 40, height - 10);
            ctx.lineTo(width / 2 - 40, height - 10);
            ctx.fill();

            // Tree Trunk Start
            // Length grows with level
            const trunkLen = 60 + (Math.min(garden.level, 10) * 5);
            drawBranch(width / 2, height - 50, trunkLen, 0, 15, 0);

            frameRef.current = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(frameRef.current);
    }, [garden, width, height]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full h-full object-contain drop-shadow-xl rounded-xl"
        />
    );
};

export default GardenCanvas;
