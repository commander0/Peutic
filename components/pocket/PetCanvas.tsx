import React, { useEffect, useRef } from 'react';
import { Lumina } from '../../types';

interface PetCanvasProps {
    pet: Lumina;
    width?: number;
    height?: number;
    emotion?: 'idle' | 'happy' | 'hungry' | 'sleeping' | 'sad' | 'eating';
    trick?: 'spin' | 'flip' | 'magic' | null;
    feedingItem?: string | null;
    onPet?: () => void;
}

const PetCanvas: React.FC<PetCanvasProps> = ({
    pet, width = 300, height = 300,
    emotion = 'idle', trick = null,
    feedingItem = null, onPet
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const PIXEL_SIZE = 4;

    // Petting State
    const mousePos = useRef({ x: 0, y: 0 });
    const rubCount = useRef(0);
    const lastRubTime = useRef(0);

    // Physics State
    const feedPos = useRef({ x: width / 2, y: -50, vy: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.imageSmoothingEnabled = false;

        let frame = 0;
        let animationId: number;

        // --- JUICY PARTICLE SYSTEM ---
        const particles: { x: number, y: number, vx: number, vy: number, life: number, color: string, size: number, type: 'square' | 'circle' | 'heart' }[] = [];

        const spawnParticles = (x: number, y: number, count: number, color: string, type: 'square' | 'circle' | 'heart' = 'square') => {
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

        // Reset feed pos when feeding starts
        if (feedingItem) {
            feedPos.current = { x: width / 2, y: -50, vy: 2 };
        }

        const render = () => {
            // Clear
            ctx.clearRect(0, 0, width, height);

            // --- DYNAMIC ENVIRONMENT (Level Based) ---
            drawEnvironment(ctx, width, height, pet.level, frame);

            // --- SCANLINES / GRID ---
            drawGridBackground(ctx, width, height, frame);

            // --- PET RENDERING ---
            const centerX = Math.floor(width / (2 * PIXEL_SIZE)) * PIXEL_SIZE;
            const centerY = Math.floor(height / (2 * PIXEL_SIZE)) * PIXEL_SIZE;

            // Bouncy / Idle Animation
            const bounce = emotion === 'sleeping'
                ? Math.sin(frame * 0.05) * 2 // Slow breathe
                : Math.abs(Math.sin(frame * 0.15)) * -4 * PIXEL_SIZE; // Hopping

            // Feeding Logic
            if (feedingItem) {
                feedPos.current.y += feedPos.current.vy;
                feedPos.current.vy += 0.5; // Gravity

                // Floor collision (Mouth height approx centerY)
                if (feedPos.current.y > centerY) {
                    feedPos.current.y = centerY;
                    feedPos.current.vy *= -0.5; // Bounce
                    if (Math.abs(feedPos.current.vy) < 1) feedPos.current.vy = 0;

                    // Munch particles
                    if (frame % 5 === 0) spawnParticles(centerX, centerY + 20, 2, '#fbbf24', 'square');
                }

                // Draw Food
                ctx.fillStyle = '#ef4444'; // Berry color
                ctx.fillRect(feedPos.current.x - 10, feedPos.current.y - 10, 20, 20);
            }

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
                p.vy += 0.2; // Gravity
                p.life -= 0.02;

                if (p.life <= 0) {
                    particles.splice(i, 1);
                    return;
                }

                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;

                if (p.type === 'heart') {
                    // Simple heart shape
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.type === 'circle') {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillRect(p.x, p.y, p.size, p.size);
                }
                ctx.globalAlpha = 1;
            });

            frame++;
            animationId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationId);
    }, [pet, width, height, emotion, trick, feedingItem, onPet]);

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
