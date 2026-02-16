import React, { useRef, useEffect } from 'react';
import { GardenState } from '../../types';

interface GardenCanvasProps {
    garden: GardenState;
    width: number;
    height: number;
    interactionType?: 'clip' | 'water' | 'breath' | 'sing' | null;
    isBreathing?: boolean;
}

const GardenCanvas: React.FC<GardenCanvasProps> = ({ garden, width, height, interactionType, isBreathing = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let time = 0;
        let animationId: number;

        const render = () => {
            // Clear
            ctx.clearRect(0, 0, width, height);

            // Time Dilation (Breathing)
            time += isBreathing ? 0.05 : 0.01;

            // Pulse Effect (Breathing)
            if (isBreathing) {
                const pulse = Math.sin(time * 2) * 50;
                ctx.save();
                ctx.translate(width / 2, height / 2);
                ctx.beginPath();
                ctx.arc(0, 0, 200 + pulse, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(167, 243, 208, 0.05)'; // Emerald Glow
                ctx.fill();
                ctx.restore();
            }

            // --- WATER RIPPLES ---
            drawRipples(ctx, width, height, time);

            const startX = width / 2;
            const startY = height - 100;

            // --- PLANT RENDERING ---
            const type = garden.currentPlantType || 'Ethereal Bonsai';

            if (type === 'Neon Fern') {
                drawNeonFern(ctx, startX, startY, 120, -Math.PI / 2, 10, 0, time, garden.level);
            } else if (type === 'Crystal Lotus') {
                drawCrystalLotus(ctx, startX, startY, time, garden.level);
            } else {
                drawBonsai(ctx, startX, startY, 100, -Math.PI / 2, 12, 0, time, garden.level);
            }

            // Interaction Effects
            if (interactionType === 'water') {
                ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
                for (let i = 0; i < 5; i++) {
                    ctx.fillRect(Math.random() * width, Math.random() * height, 1, Math.random() * 20 + 10);
                }
            }

            animationId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationId);
    }, [garden, width, height, isBreathing, interactionType]);

    return <canvas ref={canvasRef} width={width} height={height} className="block" />;
};

// --- DRAWING FUNCTIONS ---

const drawRipples = (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Horizon Line
    const horizon = h - 80;

    for (let i = 0; i < 5; i++) {
        const y = horizon + 20 + i * 15;
        const offset = Math.sin(time + i) * 20;

        ctx.beginPath();
        ctx.moveTo(0, y);
        // Beizer Wave
        ctx.bezierCurveTo(w / 3, y + offset, 2 * w / 3, y - offset, w, y);
        ctx.stroke();
    }
};

const drawBonsai = (ctx: CanvasRenderingContext2D, x: number, y: number, len: number, angle: number, width: number, depth: number, time: number, level: number) => {
    ctx.save();
    ctx.translate(x, y);
    const sway = Math.sin(time * 0.5 + depth) * 0.02 * (depth * 0.5);
    ctx.rotate(angle + sway);

    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.strokeStyle = `hsl(25, ${40 - depth * 2}%, ${15 + depth * 2}%)`; // Brownish

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.sin(depth) * 10, -len / 2, 0, -len);
    ctx.stroke();

    ctx.translate(0, -len);

    const maxDepth = Math.min(level + 4, 10);

    if (depth < maxDepth) {
        drawBonsai(ctx, 0, 0, len * 0.75, 0.3, width * 0.7, depth + 1, time, level);
        drawBonsai(ctx, 0, 0, len * 0.75, -0.3, width * 0.7, depth + 1, time, level);
    } else {
        ctx.fillStyle = `rgba(134, 239, 172, ${0.5 + Math.sin(time) * 0.2})`; // Green Light
        ctx.beginPath();
        ctx.arc(0, 0, 5 + Math.sin(time + depth) * 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
};

const drawNeonFern = (ctx: CanvasRenderingContext2D, x: number, y: number, len: number, angle: number, width: number, depth: number, time: number, level: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.lineWidth = width;
    ctx.strokeStyle = `hsl(${140 + depth * 10}, 100%, 50%)`;
    ctx.shadowColor = `hsl(${140 + depth * 10}, 100%, 50%)`;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -len);
    ctx.stroke();

    ctx.translate(0, -len);
    ctx.shadowBlur = 0; // Reset

    const maxDepth = Math.min(level + 3, 8);

    if (depth < maxDepth) {
        drawNeonFern(ctx, 0, 0, len * 0.7, 0.5 + Math.sin(time) * 0.1, width * 0.6, depth + 1, time, level);
        drawNeonFern(ctx, 0, 0, len * 0.7, -0.5 - Math.sin(time) * 0.1, width * 0.6, depth + 1, time, level);
        drawNeonFern(ctx, 0, 0, len * 0.8, 0, width * 0.6, depth + 1, time, level);
    }
    ctx.restore();
};

const drawCrystalLotus = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number, level: number) => {
    ctx.save();
    ctx.translate(x, y - 50);

    const count = 3 + Math.floor(level / 2);

    for (let i = 0; i < count; i++) {
        ctx.save();
        ctx.rotate((Math.PI * 2 / count) * i + time * 0.1);

        ctx.fillStyle = `rgba(167, 139, 250, 0.4)`;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-20, -60);
        ctx.lineTo(0, -100);
        ctx.lineTo(20, -60);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    // Core
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#d8b4fe';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, 0, 15 + Math.sin(time * 2) * 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};

export default GardenCanvas;
