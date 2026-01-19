import React, { useEffect, useRef } from 'react';
import { GardenState } from '../../types';

interface GardenCanvasProps {
    garden: GardenState;
    width?: number;
    height?: number;
}

const GardenCanvas: React.FC<GardenCanvasProps> = ({ garden, width = 300, height = 300 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Draw Soil
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.ellipse(width / 2, height - 20, width / 3, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        const centerX = width / 2;
        const groundY = height - 30;

        // Procedural Drawing based on Level
        drawPlant(ctx, centerX, groundY, garden.level, garden.currentPlantType);

    }, [garden, width, height]);

    const drawPlant = (ctx: CanvasRenderingContext2D, x: number, y: number, level: number, type: string) => {
        if (level === 1) { // Seed
            ctx.fillStyle = '#8d6e63';
            ctx.beginPath();
            ctx.ellipse(x, y + 5, 5, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        // Stem (Sprout to Bloom)
        ctx.lineWidth = level * 2;
        ctx.strokeStyle = '#4caf50';
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(x, y);

        // Height grows with level
        const height = level * 30;
        // Slight curve
        const curveX = x + (Math.random() * 20 - 10);
        ctx.quadraticCurveTo(x, y - height / 2, curveX, y - height);
        ctx.stroke();

        const topX = curveX;
        const topY = y - height;

        if (level >= 2) { // Leaves
            drawLeaf(ctx, x, y - height / 3, -1);
            drawLeaf(ctx, x, y - height / 3, 1);
        }

        if (level >= 3) { // Branches
            drawBranch(ctx, topX, topY, -1, level);
            drawBranch(ctx, topX, topY, 1, level);
        }

        if (level >= 4) { // Bud or Bloom
            if (level === 5) {
                drawFlower(ctx, topX, topY, type);
            } else {
                drawBud(ctx, topX, topY, type);
            }
        }
    };

    const drawLeaf = (ctx: CanvasRenderingContext2D, x: number, y: number, dir: number) => {
        ctx.fillStyle = '#66bb6a';
        ctx.beginPath();
        ctx.ellipse(x + (10 * dir), y, 10, 5, dir * 0.5, 0, Math.PI * 2);
        ctx.fill();
    };

    const drawBranch = (ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, level: number) => {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (20 * dir), y - 20);
        ctx.stroke();
        // Leaf on branch
        drawLeaf(ctx, x + (20 * dir), y - 20, dir);
    };

    const drawBud = (ctx: CanvasRenderingContext2D, x: number, y: number, type: string) => {
        ctx.fillStyle = getFlowerColor(type);
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
    };

    const drawFlower = (ctx: CanvasRenderingContext2D, x: number, y: number, type: string) => {
        const color = getFlowerColor(type);
        ctx.fillStyle = color;

        // Procedural petals
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const px = x + Math.cos(angle) * 10;
            const py = y + Math.sin(angle) * 10;

            ctx.beginPath();
            ctx.ellipse(px, py, 15, 8, angle, 0, Math.PI * 2);
            ctx.fill();
        }

        // Center
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
    };

    const getFlowerColor = (type: string) => {
        switch (type) {
            case 'Rose': return '#e91e63';
            case 'Sunflower': return '#ffc107';
            case 'Lotus': return '#f48fb1';
            case 'Fern': return '#1b5e20'; // Ferns don't flower, but logic holds
            default: return '#9c27b0';
        }
    };

    return <canvas ref={canvasRef} width={width} height={height} className="animate-in fade-in zoom-in duration-1000" />;
};

export default GardenCanvas;
