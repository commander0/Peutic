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

        // --- JUICY PARTICLE SYSTEM ---
        const particles: { x: number, y: number, vx: number, vy: number, life: number, color: string, size: number, type: 'square' | 'circle' }[] = [];

        const spawnParticles = (x: number, y: number, count: number, color: string, type: 'square' | 'circle' = 'square') => {
            for (let i = 0; i < count; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 1.5) * 6, // Upward tendency
                    life: 1.0,
                    color,
                    size: Math.random() * 6 + 2,
                    type
                });
            }
        };

        // Spawn happy particles if emotion changed to happy recently (mock detection)
        if (emotion === 'happy' && Math.random() > 0.95) {
            spawnParticles(width / 2, height / 2, 2, '#facc15', 'circle');
        }

        const render = () => {
            // Clear
            ctx.clearRect(0, 0, width, height);

            // --- HOLOGRAPHIC BACKGROUND ---
            // Scanlines are handled by parent CSS usually, but we draw grid here
            drawGridBackground(ctx, width, height, frame);

            // --- PET RENDERING ---
            const centerX = Math.floor(width / (2 * PIXEL_SIZE)) * PIXEL_SIZE;
            const centerY = Math.floor(height / (2 * PIXEL_SIZE)) * PIXEL_SIZE;

            // Bouncy / Idle Animation
            const bounce = emotion === 'sleeping'
                ? Math.sin(frame * 0.05) * 2 // Slow breathe
                : Math.abs(Math.sin(frame * 0.15)) * -4 * PIXEL_SIZE; // Hopping

            // Trick Logic (Spin/Flip)
            ctx.save();
            ctx.translate(centerX, centerY + bounce);

            if (trick === 'spin') {
                ctx.rotate(frame * 0.2);
            }

            // Draw Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(0, 40, 20 + Math.abs(bounce / 2), 8, 0, 0, Math.PI * 2);
            ctx.fill();

            // EVOLUTION & SPECIES LOGIC
            const pSpecies = pet.species || 'Neo-Shiba';

            if (pet.level < 3) {
                drawEgg(ctx, frame);
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

            // --- PARTICLES RENDER ---
            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
                p.vy += 0.1; // Gravity (optional)

                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;

                if (p.type === 'circle') {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillRect(p.x, p.y, p.size, p.size);
                }

                if (p.life <= 0) particles.splice(i, 1);
            });
            ctx.globalAlpha = 1.0;

            frame++;
            animationId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationId);
    }, [pet, width, height, emotion, trick]);

    // --- DRAWING HELPERS ---
    const drawRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, w * PIXEL_SIZE, h * PIXEL_SIZE);
    };

    // --- EVOLUTION STAGES ---

    const drawEgg = (ctx: CanvasRenderingContext2D, frame: number) => {
        // Wobble
        if (frame % 60 < 10) ctx.rotate(Math.sin(frame) * 0.1);

        drawRect(ctx, -6, -8, 12, 16, '#f1f5f9'); // White
        drawRect(ctx, -4, -6, 2, 2, '#94a3b8');   // Shading
        // Spot
        drawRect(ctx, 0, -2, 2, 2, '#38bdf8');
    };

    const drawBabyBlob = (ctx: CanvasRenderingContext2D, species: string, frame: number) => {
        const color = getSpeciesColor(species, 1);
        // Round Body
        drawRect(ctx, -8, -6, 16, 14, color);
        // Little ears/nubs
        drawRect(ctx, -8, -8, 4, 2, color);
        drawRect(ctx, 4, -8, 4, 2, color);
    };

    const drawTeenPet = (ctx: CanvasRenderingContext2D, species: string, frame: number) => {
        const color = getSpeciesColor(species, 6);
        // Body
        drawRect(ctx, -10, -10, 20, 18, color);

        if (species === 'Neo-Shiba') {
            // Pointy Ears
            drawRect(ctx, -10, -14, 4, 4, color);
            drawRect(ctx, 6, -14, 4, 4, color);
            // Tail Wags
            if (Math.floor(frame / 10) % 2 === 0) drawRect(ctx, 10, -4, 4, 4, '#fbbf24');
        } else if (species === 'Digi-Dino') {
            // Spikes
            drawRect(ctx, 0, -14, 2, 4, '#bef264');
            drawRect(ctx, 4, -12, 2, 2, '#bef264');
        }
    };

    const drawMasterPet = (ctx: CanvasRenderingContext2D, species: string, frame: number) => {
        const color = getSpeciesColor(species, 10);

        // Aura
        const auraColor = species === 'Holo-Hamu' ? '#f472b6' : species === 'Digi-Dino' ? '#4ade80' : '#fbbf24';
        ctx.shadowColor = auraColor;
        ctx.shadowBlur = 20 + Math.sin(frame * 0.1) * 10;

        // Majestic Body
        drawRect(ctx, -14, -14, 28, 24, color);
        ctx.shadowBlur = 0; // Reset

        // Accessories based on species
        if (species === 'Neo-Shiba') {
            // Scarf
            drawRect(ctx, -12, 6, 24, 4, '#ef4444');
            if (frame % 20 < 10) drawRect(ctx, 12, 6, 4, 4, '#ef4444'); // Scarf flap
        }
    };

    const getSpeciesColor = (species: string, level: number) => {
        const isApex = level >= 10;
        switch (species) {
            case 'Neo-Shiba': return isApex ? '#d97706' : '#fbbf24'; // Gold/Orange
            case 'Digi-Dino': return isApex ? '#166534' : '#4ade80'; // Green
            case 'Holo-Hamu': return isApex ? '#db2777' : '#f472b6'; // Pink
            case 'Zen-Sloth': return '#a8a29e';
            default: return '#fbbf24';
        }
    };

    const drawFace = (ctx: CanvasRenderingContext2D, frame: number, emotion: string, isSleeping: boolean) => {
        const eyeColor = '#1e293b';

        if (isSleeping) {
            drawRect(ctx, -5, -2, 3, 1, eyeColor);
            drawRect(ctx, 2, -2, 3, 1, eyeColor);
            return;
        }

        // Blink
        if (Math.floor(frame / 60) % 5 === 0 && frame % 60 < 5) {
            drawRect(ctx, -5, -2, 3, 1, eyeColor);
            drawRect(ctx, 2, -2, 3, 1, eyeColor);
        } else {
            // Eyes
            drawRect(ctx, -5, -3, 3, 3, eyeColor);
            drawRect(ctx, 2, -3, 3, 3, eyeColor);
            // Sparkle
            drawRect(ctx, -3, -3, 1, 1, '#fff');
            drawRect(ctx, 4, -3, 1, 1, '#fff');
        }

        // Mouth
        if (emotion === 'happy') {
            drawRect(ctx, -2, 2, 4, 1, eyeColor);
            drawRect(ctx, -3, 1, 1, 1, eyeColor);
            drawRect(ctx, 2, 1, 1, 1, eyeColor);
        } else if (emotion === 'eating') {
            const open = Math.floor(frame / 10) % 2 === 0;
            if (open) drawRect(ctx, -2, 2, 4, 3, '#ef4444');
            else drawRect(ctx, -2, 3, 4, 1, eyeColor);
        } else {
            drawRect(ctx, -2, 3, 4, 1, eyeColor);
        }
    };

    const drawGridBackground = (ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => {
        // Subtle moving grid
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
        ctx.lineWidth = 1;

        const offset = (frame * 0.5) % 20; // Scrolling floor

        // Floor perspective lines
        for (let i = -10; i < 20; i++) {
            ctx.beginPath();
            ctx.moveTo(w / 2 + i * 40, h / 2);
            ctx.lineTo(w / 2 + i * 160, h);
            ctx.stroke();
        }

        // Horizontal moving lines
        for (let y = h / 2; y < h; y += 20) {
            const yPos = y + offset;
            if (yPos > h) continue;
            ctx.beginPath();
            ctx.moveTo(0, yPos);
            ctx.lineTo(w, yPos);
            ctx.stroke();
        }
    };

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]"
        />
    );
};

export default PetCanvas;
