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
        // JUICY PARTICLE SYSTEM
        const particles: { x: number, y: number, vx: number, vy: number, life: number, color: string, size: number }[] = [];

        // Helper to spawn particles
        const spawnParticles = (x: number, y: number, count: number, color: string) => {
            for (let i = 0; i < count; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    life: 1.0,
                    color,
                    size: Math.random() * 4 + 1
                });
            }
        };

        const render = () => {
            // Background - Dynamic Gradient based on emotion
            let bgGradient = ctx.createLinearGradient(0, 0, 0, height);
            if (emotion === 'happy') { bgGradient.addColorStop(0, '#fef08a'); bgGradient.addColorStop(1, '#facc15'); }
            else if (emotion === 'sleeping') { bgGradient.addColorStop(0, '#1e1b4b'); bgGradient.addColorStop(1, '#312e81'); }
            else { bgGradient.addColorStop(0, '#0f172a'); bgGradient.addColorStop(1, '#1e293b'); }

            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, width, height);

            // Retro Grid
            drawGridBackground(ctx, width, height);

            // Aura Pulse
            const pulse = 1 + Math.sin(frame * 0.05) * 0.1;
            const auraGradient = ctx.createRadialGradient(width / 2, height / 2, 30 * pulse, width / 2, height / 2, 120 * pulse);
            auraGradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
            auraGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = auraGradient;
            ctx.fillRect(0, 0, width, height);

            // Floating Particles (Ambient)
            if (Math.random() > 0.9) {
                particles.push({
                    x: Math.random() * width,
                    y: height + 10,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: -Math.random() * 2 - 1,
                    life: 1.0,
                    color: Math.random() > 0.5 ? '#22d3ee' : '#ffffff',
                    size: Math.random() * 3
                });
            }

            // Update & Draw Particles
            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                // Draw as little squares for pixel beat
                ctx.fillRect(p.x, p.y, p.size, p.size);
                if (p.life <= 0) particles.splice(i, 1);
            });
            ctx.globalAlpha = 1.0;

            const centerX = Math.floor(width / (2 * PIXEL_SIZE)) * PIXEL_SIZE;
            const centerY = Math.floor(height / (2 * PIXEL_SIZE)) * PIXEL_SIZE;

            // Bouncy Animation
            const bounce = Math.floor(Math.sin(frame * 0.1) * 4) * PIXEL_SIZE;

            // Squash and Stretch Logic
            // Scale Y slightly inversely to bounce for jelly effect
            // We simulate this by manipulating coordinates since canvas scale is uniform

            ctx.save();
            ctx.translate(centerX, centerY + bounce);

            // EVOLUTION LOGIC
            const pSpecies = pet.species || 'Neo-Shiba';

            if (pet.level < 3) {
                drawEgg(ctx);
            } else if (pet.level < 6) {
                drawBabyBlob(ctx, pSpecies, frame);
            } else if (pet.level < 10) {
                drawTeenPet(ctx, pSpecies, frame);
            } else {
                drawMasterPet(ctx, pSpecies, frame);
            }

            // Draw Face
            drawFace(ctx, frame, emotion, !!pet.isSleeping);

            ctx.restore();

            // Scanlines Overlay (CRTV Effect)
            drawScanlines(ctx, width, height, frame);

            frame++;
            animationId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationId);
    }, [pet, width, height, emotion, trick]);

    // --- SPRITE HELPERS ---
    const drawRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, w * PIXEL_SIZE, h * PIXEL_SIZE);
    };

    // --- EVOLUTION STAGE DRAWING FUNCTIONS ---

    const drawEgg = (ctx: CanvasRenderingContext2D) => {
        // Simple Egg Shape
        drawRect(ctx, -6, -8, 12, 16, '#f8fafc'); // White Shell
        drawRect(ctx, -4, -6, 2, 2, '#e2e8f0');   // Shading
        // Cracks or Spots
        drawRect(ctx, 0, -2, 2, 2, '#38bdf8');
        drawRect(ctx, -2, 4, 2, 2, '#38bdf8');
    };

    const drawBabyBlob = (ctx: CanvasRenderingContext2D, species: string, frame: number) => {
        const color = getSpeciesColor(species, 1);
        // Round Body
        drawRect(ctx, -8, -6, 16, 14, color);
        // Little nub feet
        drawRect(ctx, -6, 8, 4, 3, color);
        drawRect(ctx, 2, 8, 4, 3, color);
    };

    const drawTeenPet = (ctx: CanvasRenderingContext2D, species: string, frame: number) => {
        const color = getSpeciesColor(species, 6);
        // Larger Body
        drawRect(ctx, -10, -10, 20, 18, color);

        if (species === 'Neo-Shiba') {
            // Ears
            drawRect(ctx, -8, -14, 4, 4, color);
            drawRect(ctx, 4, -14, 4, 4, color);
        } else if (species === 'Digi-Dino') {
            // Tail
            drawRect(ctx, 10, -2, 6, 4, color);
        }
    };

    const drawMasterPet = (ctx: CanvasRenderingContext2D, species: string, frame: number) => {
        const color = getSpeciesColor(species, 10);
        // Majestic Body
        drawRect(ctx, -14, -14, 28, 24, color);

        // Armor / Details
        drawRect(ctx, -6, -16, 12, 4, '#fbbf24'); // Gold Crown/Headplate
        drawRect(ctx, -10, 0, 4, 8, '#ffffff'); // Chest markings
        drawRect(ctx, 6, 0, 4, 8, '#ffffff');

        // Cape/Aura wings
        if (Math.sin(frame * 0.2) > 0) {
            drawRect(ctx, -18, -10, 4, 12, '#a855f7'); // Wing L
            drawRect(ctx, 14, -10, 4, 12, '#a855f7');  // Wing R
        }
    };

    const getSpeciesColor = (species: string, level: number) => {
        const isApex = level >= 10;
        switch (species) {
            case 'Neo-Shiba': return isApex ? '#d97706' : '#fbbf24'; // Gold/Orange
            case 'Digi-Dino': return isApex ? '#15803d' : '#4ade80'; // Green
            case 'Holo-Hamu': return isApex ? '#db2777' : '#f472b6'; // Pink
            default: return '#fbbf24';
        }
    };

    const drawFace = (ctx: CanvasRenderingContext2D, frame: number, emotion: string, isSleeping: boolean) => {
        const eyeColor = '#0f172a'; // Dark Navy for eyes

        if (isSleeping) {
            // Zzz lines
            drawRect(ctx, -4, -2, 3, 1, eyeColor);
            drawRect(ctx, 2, -2, 3, 1, eyeColor);
            // Zzz text floating
            if (Math.floor(frame / 30) % 2 === 0) {
                drawRect(ctx, 10, -12, 1, 1, '#ffffff');
                drawRect(ctx, 12, -14, 1, 1, '#ffffff');
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
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.1)';
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
            className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(45,212,191,0.5)] border-4 border-gray-900 bg-gray-900 rounded-lg"
        />
    );
};

export default PetCanvas;
