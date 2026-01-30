
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
    const timeRef = useRef<number>(0);

    // --- UKIYO-E STYLE RENDERER ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Texture Pattern
        const createPaperTexture = () => {
            const patternCanvas = document.createElement('canvas');
            patternCanvas.width = 100;
            patternCanvas.height = 100;
            const pCtx = patternCanvas.getContext('2d');
            if (pCtx) {
                pCtx.fillStyle = '#fdfbf7'; // Rice paper base
                pCtx.fillRect(0, 0, 100, 100);
                // Noise
                for (let i = 0; i < 500; i++) {
                    pCtx.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`;
                    pCtx.fillRect(Math.random() * 100, Math.random() * 100, 2, 2);
                }
            }
            return ctx.createPattern(patternCanvas, 'repeat');
        };

        const paperPattern = createPaperTexture();

        // Animation Loop
        const render = () => {
            timeRef.current += 0.02;

            // Clear & Apply Paper Background
            ctx.fillStyle = paperPattern || '#fdfbf7';
            ctx.fillRect(0, 0, width, height);

            // Draw Background Elements (Sun/Cloud)
            drawSun(ctx, width, height);

            // Center of garden
            const cx = width / 2;
            const cy = height * 0.85;

            // Draw Soil / Ground
            drawGround(ctx, width, cy);

            // Draw Plant with Ink Style
            drawUkiyoPlant(ctx, cx, cy, garden.level, timeRef.current);

            // Draw Spirit Wisp (Ink Blob style)
            const wispX = cx + Math.sin(timeRef.current * 0.5) * 40;
            const wispY = cy - 120 + Math.cos(timeRef.current * 0.3) * 20 - (garden.level * 25);
            drawInkWisp(ctx, wispX, wispY, timeRef.current);

            frameRef.current = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(frameRef.current);
    }, [garden, width, height]);

    const drawSun = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        // Japanese Red Sun
        ctx.beginPath();
        ctx.arc(w * 0.8, h * 0.2, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444'; // Red 500
        ctx.fill();

        // Texture overlay on sun (stamp look)
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.arc(w * 0.8, h * 0.2, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    };

    const drawGround = (ctx: CanvasRenderingContext2D, w: number, y: number) => {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.3, y - 10, w * 0.7, y + 15, w, y + 5);
        ctx.lineTo(w, y + 100);
        ctx.lineTo(0, y + 100);
        ctx.fillStyle = '#d4c5b0'; // Earth tone
        ctx.fill();

        // Ink outline for ground
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.3, y - 10, w * 0.7, y + 15, w, y + 5);
        ctx.strokeStyle = '#2c241b';
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    const drawUkiyoPlant = (ctx: CanvasRenderingContext2D, x: number, y: number, level: number, time: number) => {
        ctx.save();
        ctx.translate(x, y);

        const sway = Math.sin(time * 0.5) * 0.05;
        ctx.rotate(sway);

        const height = 50 + (level * 30);

        // Stem (Ink Brush Style - Variable Width)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(Math.sin(time * 0.5) * 15, -height / 2, 5, -height);
        ctx.lineTo(-5, -height); // Make it thick at top
        ctx.quadraticCurveTo(Math.sin(time * 0.5) * 15, -height / 2, -8, 0); // Thick at base
        ctx.fillStyle = '#064e3b'; // Dark Emerald Ink
        ctx.fill();

        // Leaves with outlines
        if (level >= 2) drawInkLeaf(ctx, 0, -height * 0.4, 25, time, -0.6);
        if (level >= 2) drawInkLeaf(ctx, 0, -height * 0.6, 30, time, 0.6);
        if (level >= 3) drawInkLeaf(ctx, 5, -height * 0.8, 20, time, -0.4);

        // Flower
        ctx.translate(0, -height);
        if (level >= 4) {
            drawInkFlower(ctx, time);
        } else if (level >= 1) {
            // Bud
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#fda4af';
            ctx.fill();
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
