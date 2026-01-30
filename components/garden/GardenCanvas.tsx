
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

            if (len < 10 || depth > (garden.level + 3)) { // Growth based on level
                // Draw Leaves/Blossoms at tips
                ctx.beginPath();
                ctx.arc(0, -len, 4 + Math.random() * 2, 0, Math.PI * 2);
                ctx.fillStyle = garden.currentPlantType === 'Sakura' ? '#F48FB1' : '#4CAF50'; // Pink or Green
                ctx.fill();
                ctx.restore();
                return;
            }

            // Recursive branching
            drawBranch(0, -len, len * 0.75, 0.4, branchWidth * 0.7, depth + 1);
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
            drawBranch(width / 2, height - 50, 60 + (garden.level * 10), 0, 15, 0);

            frameRef.current = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(frameRef.current);
    }, [garden, width, height]);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

ctx.restore();
    };

const drawInkLeaf = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, time: number, angle: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.sin(time) * 0.1);

    ctx.beginPath();
    ctx.ellipse(15, 0, size, size * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981'; // Emerald 500
    ctx.fill();
    ctx.strokeStyle = '#064e3b'; // Dark Ink outline
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Leaf vein
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size * 1.5, 0);
    ctx.stroke();

    ctx.restore();
};

const drawInkFlower = (ctx: CanvasRenderingContext2D, time: number) => {
    // Cherry Blossom Style
    const petals = 5;

    for (let i = 0; i < petals; i++) {
        ctx.save();
        const angle = (Math.PI * 2 * i) / petals;
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(10, -10, 20, 0);
        ctx.quadraticCurveTo(10, 10, 0, 0);
        ctx.fillStyle = '#ec4899'; // Pink 500
        ctx.fill();
        ctx.strokeStyle = '#831843'; // Pink 900 ink
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }

    // Center
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#facc15';
    ctx.fill();
};

const drawInkWisp = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    ctx.save();
    ctx.translate(x, y);

    // Spirit Flame
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.quadraticCurveTo(15, 0, 0, -20);
    ctx.quadraticCurveTo(-15, 0, 0, 10);
    ctx.fillStyle = '#3b82f6'; // Blue spirit
    ctx.fill();
    ctx.strokeStyle = '#1e3a8a'; // Blue ink
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
};

return (
    <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full object-contain drop-shadow-2xl"
    />
);
};

export default GardenCanvas;
