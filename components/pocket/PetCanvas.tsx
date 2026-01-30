import React, { useEffect, useRef } from 'react';
import { Lumina } from '../../types';

interface PetCanvasProps {
    pet: Lumina;
    width?: number;
    height?: number;
    emotion?: 'idle' | 'happy' | 'hungry' | 'sleeping' | 'sad' | 'eating';
    trick?: 'spin' | 'flip' | 'magic' | null;
}

const PetCanvas: React.FC<PetCanvasProps> = ({ pet, width = 300, height = 300, emotion = 'idle', trick = null }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const PIXEL_SIZE = 4;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Disable smoothing for crisp pixels
        ctx.imageSmoothingEnabled = false;

        let frame = 0;
        let animationId: number;

        const render = () => {
            // clear
            ctx.fillStyle = '#1a1b26'; // Dark retro background
            ctx.fillRect(0, 0, width, height);

            // Grid / CRT Effect Background
            drawGridBackground(ctx, width, height);

            const centerX = Math.floor(width / (2 * PIXEL_SIZE)) * PIXEL_SIZE;
            const centerY = Math.floor(height / (2 * PIXEL_SIZE)) * PIXEL_SIZE;

            // Wobble / Animation
            const bounce = Math.floor(Math.sin(frame * 0.1) * 2) * PIXEL_SIZE;

            ctx.save();
            ctx.translate(centerX, centerY + bounce);

            // Draw Pet (Pixel Style)
            drawPixelPet(ctx, pet.species, frame, emotion, pet.isSleeping, pet.level);

            ctx.restore();

            // Scanlines Overlay
            drawScanlines(ctx, width, height, frame);

            frame++;
            animationId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationId);
    }, [pet, width, height, emotion, trick]);

    // --- PIXEL HELPERS ---
    const drawRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, w * PIXEL_SIZE, h * PIXEL_SIZE);
    };

    const drawPixelPet = (ctx: CanvasRenderingContext2D, species: string, frame: number, emotion: string, isSleeping: boolean, level: number) => {
        // Base Colors
        const primary = getSpeciesColor(species, level);
        const secondary = '#ffffff';
        const outline = '#000000';

        // Generic Body Shape (8-bit blob)
        // Outline
        drawRect(ctx, -8, -8, 16, 16, outline);
        // Body Fill
        drawRect(ctx, -7, -7, 14, 14, primary);
        // Belly
        drawRect(ctx, -4, 0, 8, 6, secondary);

        // Species specifics
        if (species === 'Neo-Shiba') {
            // Ears
            drawRect(ctx, -7, -11, 3, 3, primary); // Left Ear
            drawRect(ctx, 4, -11, 3, 3, primary);  // Right Ear
            drawRect(ctx, -7, -11, 3, 1, outline); // Ear tips outline
            drawRect(ctx, 4, -11, 3, 1, outline);
        } else if (species === 'Digi-Dino') {
            // Tail
            drawRect(ctx, 6, 0, 6, 4, primary);
            drawRect(ctx, 11, -2, 2, 2, outline); // Spike
        } else if (species === 'Holo-Hamu') {
            // Ears (Rounder)
            drawRect(ctx, -8, -10, 4, 3, primary);
            drawRect(ctx, 4, -10, 4, 3, primary);
        }

        // Face
        drawFace(ctx, frame, emotion, isSleeping);
    };

    const getSpeciesColor = (species: string, level: number) => {
        // High level = more neon
        const isApex = level >= 10;
        switch (species) {
            case 'Neo-Shiba': return isApex ? '#fbbf24' : '#d97706';
            case 'Digi-Dino': return isApex ? '#4ade80' : '#16a34a';
            case 'Holo-Hamu': return isApex ? '#f472b6' : '#db2777';
            case 'Zen-Sloth': return isApex ? '#e2e8f0' : '#94a3b8';
            default: return '#fbbf24';
        }
    };

    const drawFace = (ctx: CanvasRenderingContext2D, frame: number, emotion: string, isSleeping: boolean) => {
        const eyeColor = '#000000';

        if (isSleeping) {
            // Zzz lines
            drawRect(ctx, -4, -2, 3, 1, eyeColor);
            drawRect(ctx, 2, -2, 3, 1, eyeColor);
            // Zzz text floating
            if (Math.floor(frame / 30) % 2 === 0) {
                drawRect(ctx, 6, -12, 1, 1, '#ffffff'); // primitive Z dot
                drawRect(ctx, 7, -13, 1, 1, '#ffffff');
                drawRect(ctx, 8, -12, 1, 1, '#ffffff');
                drawRect(ctx, 6, -10, 3, 1, '#ffffff'); // Base
                drawRect(ctx, 6, -14, 3, 1, '#ffffff'); // Top
            }
            return;
        }

        // Blink
        if (Math.floor(frame / 60) % 5 === 0 && frame % 60 < 5) {
            drawRect(ctx, -4, -2, 2, 1, eyeColor);
            drawRect(ctx, 2, -2, 2, 1, eyeColor);
        } else {
            // Open Eyes
            drawRect(ctx, -4, -3, 2, 3, eyeColor);
            drawRect(ctx, 2, -3, 2, 3, eyeColor);
            // Shine
            drawRect(ctx, -3, -3, 1, 1, '#ffffff');
            drawRect(ctx, 3, -3, 1, 1, '#ffffff');
        }

        // Mouth
        if (emotion === 'happy') {
            drawRect(ctx, -2, 2, 1, 1, eyeColor);
            drawRect(ctx, 2, 2, 1, 1, eyeColor);
            drawRect(ctx, -1, 3, 3, 1, eyeColor);
        } else if (emotion === 'eating') {
            const open = Math.floor(frame / 10) % 2 === 0;
            if (open) drawRect(ctx, -1, 2, 2, 2, '#ef4444');
            else drawRect(ctx, -2, 3, 4, 1, eyeColor);
        } else {
            // Neutral
            drawRect(ctx, -1, 3, 2, 1, eyeColor);
        }
    };

    const drawGridBackground = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.1)'; // Low res teal grid
        ctx.lineWidth = 1;
        const cellSize = 20;

        for (let x = 0; x < w; x += cellSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += cellSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    };

    const drawScanlines = (ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let y = 0; y < h; y += 4) {
            ctx.fillRect(0, y, w, 2);
        }

        // Rolling bar
        const roll = (frame * 2) % h;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(0, roll, w, 20);
    };

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(45,212,191,0.5)] border-4 border-black bg-black rounded-lg"
        />
    );
};

export default PetCanvas;
