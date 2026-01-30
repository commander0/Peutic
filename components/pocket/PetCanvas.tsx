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

        ctx.imageSmoothingEnabled = false;

        let frame = 0;
        let animationId: number;
        const particles: { x: number, y: number, life: number, color: string }[] = [];

        const render = () => {
            // Background
            ctx.fillStyle = '#0f172a'; // Deep Space Blue
            ctx.fillRect(0, 0, width, height);

            // Dramatic Aura (Glowing Gradient behind pet)
            const gradient = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, 100);
            gradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)'); // Cyan Aura
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Particles
            if (Math.random() > 0.8) {
                particles.push({
                    x: width / 2 + (Math.random() - 0.5) * 100,
                    y: height / 2 + (Math.random() - 0.5) * 100,
                    life: 1.0,
                    color: Math.random() > 0.5 ? '#22d3ee' : '#ffffff'
                });
            }
            particles.forEach((p, i) => {
                p.y -= 1; // float up
                p.life -= 0.02;
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.fillRect(p.x, p.y, 2, 2);
                if (p.life <= 0) particles.splice(i, 1);
            });
            ctx.globalAlpha = 1.0;

            const centerX = Math.floor(width / (2 * PIXEL_SIZE)) * PIXEL_SIZE;
            const centerY = Math.floor(height / (2 * PIXEL_SIZE)) * PIXEL_SIZE;
            const bounce = Math.floor(Math.sin(frame * 0.1) * 4) * PIXEL_SIZE;

            ctx.save();
            ctx.translate(centerX, centerY + bounce);

            // EVOLUTION LOGIC
            // Level 1-2: Egg
            // Level 3-5: Baby Blob
            // Level 6-9: Teen (Features)
            // Level 10+: Master (Full armor/details)
            if (pet.level < 3) {
                drawEgg(ctx);
            } else if (pet.level < 6) {
                drawBabyBlob(ctx, pet.species, frame);
            } else if (pet.level < 10) {
                drawTeenPet(ctx, pet.species, frame);
            } else {
                drawMasterPet(ctx, pet.species, frame);
            }

            ctx.restore();

            frame++;
            animationId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationId);
    }, [pet, width, height, emotion, trick]);

    // --- SPRITES ---
    const drawRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, w * PIXEL_SIZE, h * PIXEL_SIZE);
    };

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
