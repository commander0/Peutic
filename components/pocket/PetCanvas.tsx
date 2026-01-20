import React, { useEffect, useRef } from 'react';
import { Anima } from '../../types';

interface PetCanvasProps {
    pet: Anima;
    width?: number;
    height?: number;
    emotion?: 'idle' | 'happy' | 'hungry' | 'sleeping' | 'sad' | 'eating';
}

const PetCanvas: React.FC<PetCanvasProps> = ({ pet, width = 300, height = 300, emotion = 'idle' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Evolution stage based on level: Spirit (1-4), Guardian (5-9), Apex (10+)
    const getEvolutionStage = (level: number): 'spirit' | 'guardian' | 'apex' => {
        if (level >= 10) return 'apex';
        if (level >= 5) return 'guardian';
        return 'spirit';
    };

    const getEvolutionScale = (stage: 'spirit' | 'guardian' | 'apex'): number => {
        switch (stage) {
            case 'apex': return 1.4;
            case 'guardian': return 1.15;
            default: return 1.0;
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frame = 0;
        let animationId: number;

        const evolutionStage = getEvolutionStage(pet.level);
        const evolutionScale = getEvolutionScale(evolutionStage);

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            const centerX = width / 2;
            const centerY = height / 2;
            const baseScale = (width / 300) * evolutionScale;

            // Floating bounce effect
            const bounce = Math.sin(frame * 0.05) * 8 * baseScale;
            const yOffset = bounce + (pet.isSleeping ? 10 * baseScale : 0);

            ctx.save();
            ctx.translate(centerX, centerY + yOffset);

            // AURA & GLOWS
            if (evolutionStage !== 'spirit') {
                const auraSize = evolutionStage === 'apex' ? 120 : 80;
                const auraColor = evolutionStage === 'apex' ? '255, 215, 0' : '100, 255, 218';

                // Outer Glow
                const gradient = ctx.createRadialGradient(0, 0, 30 * baseScale, 0, 0, auraSize * baseScale);
                gradient.addColorStop(0, `rgba(${auraColor}, 0.2)`);
                gradient.addColorStop(1, `rgba(${auraColor}, 0)`);
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, auraSize * baseScale, 0, Math.PI * 2);
                ctx.fill();

                // Inner Pulse
                ctx.beginPath();
                ctx.arc(0, 0, (auraSize * 0.6 + Math.sin(frame * 0.1) * 5) * baseScale, 0, Math.PI * 2);
                ctx.lineWidth = 2;
                ctx.strokeStyle = `rgba(${auraColor}, 0.3)`;
                ctx.stroke();
            }

            // DRAW PET BASED ON SPECIES
            switch (pet.species) {
                case 'Holo-Hamu':
                    drawHamu(ctx, baseScale, frame, emotion, pet.isSleeping, evolutionStage);
                    break;
                case 'Digi-Dino':
                    drawDino(ctx, baseScale, frame, emotion, pet.isSleeping, evolutionStage);
                    break;
                case 'Neo-Shiba':
                    drawShiba(ctx, baseScale, frame, emotion, pet.isSleeping, evolutionStage);
                    break;
                case 'Zen-Sloth':
                    drawSloth(ctx, baseScale, frame, emotion, pet.isSleeping, evolutionStage);
                    break;
            }

            // HOLOGRAPHIC GLOW EFFECT
            ctx.shadowBlur = evolutionStage === 'apex' ? 40 : 20;
            ctx.shadowColor = evolutionStage === 'apex' ? 'rgba(255, 215, 0, 0.6)' : 'rgba(50, 255, 255, 0.4)';

            ctx.restore();

            // Overlay Scanlines for Retro feel
            ctx.fillStyle = 'rgba(0, 255, 255, 0.03)';
            for (let i = 0; i < height; i += 3) {
                ctx.fillRect(0, i, width, 1);
            }

            // Glitch Effect (Random)
            if (Math.random() > 0.98) {
                const h = Math.random() * 20;
                const y = Math.random() * height;
                ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
                ctx.fillRect(0, y, width, h);
            }

            // Floating particles
            for (let i = 0; i < 8; i++) {
                const angle = (frame * 0.02) + (i * (Math.PI * 2) / 8);
                const r = 100 * baseScale + Math.sin(frame * 0.05 + i) * 20;
                const px = centerX + Math.cos(angle) * r;
                const py = centerY + Math.sin(angle) * r;

                ctx.fillStyle = evolutionStage === 'apex' ? 'rgba(255,215,0,0.6)' : 'rgba(100,255,218,0.4)';
                ctx.beginPath();
                ctx.arc(px, py, 2 * baseScale, 0, Math.PI * 2);
                ctx.fill();
            }

            frame++;
            animationId = requestAnimationFrame(draw);
        };

        animationId = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animationId);
    }, [pet, width, height, emotion]);

    // SPECIES DRAWING FUNCTIONS
    const drawHamu = (ctx: CanvasRenderingContext2D, scale: number, frame: number, emotion: string, isSleeping: boolean, stage: 'spirit' | 'guardian' | 'apex') => {
        const size = 60 * scale;

        // Body (Round blob)
        ctx.fillStyle = stage === 'apex' ? '#ffe8c5' : '#ffecd2';
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Belly
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, size * 0.3, size * 0.7, size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.fillStyle = stage === 'apex' ? '#ff9eb3' : '#ffcad4';
        ctx.beginPath();
        ctx.arc(-size * 0.6, -size * 0.7, size * 0.3, 0, Math.PI * 2);
        ctx.arc(size * 0.6, -size * 0.7, size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Crown for Apex
        if (stage === 'apex') {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(0, -size * 1.1);
            ctx.lineTo(-size * 0.3, -size * 0.85);
            ctx.lineTo(size * 0.3, -size * 0.85);
            ctx.fill();
        }

        drawFace(ctx, size, frame, emotion, isSleeping);
    };

    const drawDino = (ctx: CanvasRenderingContext2D, scale: number, frame: number, emotion: string, isSleeping: boolean, stage: 'spirit' | 'guardian' | 'apex') => {
        const size = 65 * scale;

        // Body
        ctx.fillStyle = stage === 'apex' ? '#8fd4a1' : '#b7e4c7';
        ctx.beginPath();
        ctx.roundRect(-size, -size * 0.5, size * 1.5, size * 1.2, size * 0.5);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(size * 0.3, -size * 0.6, size * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Spikes (more for higher stages)
        const spikeCount = stage === 'apex' ? 5 : stage === 'guardian' ? 4 : 3;
        ctx.fillStyle = stage === 'apex' ? '#50b86a' : '#74c69d';
        for (let i = 0; i < spikeCount; i++) {
            ctx.beginPath();
            ctx.moveTo(-size * 0.8 + (i * size * 0.4), -size * 0.6);
            ctx.lineTo(-size * 0.65 + (i * size * 0.4), -size * 1.2);
            ctx.lineTo(-size * 0.5 + (i * size * 0.4), -size * 0.6);
            ctx.fill();
        }

        ctx.save();
        ctx.translate(size * 0.3, -size * 0.4);
        drawFace(ctx, size * 0.8, frame, emotion, isSleeping);
        ctx.restore();
    };

    const drawShiba = (ctx: CanvasRenderingContext2D, scale: number, frame: number, emotion: string, isSleeping: boolean, stage: 'spirit' | 'guardian' | 'apex') => {
        const size = 60 * scale;

        // Body
        ctx.fillStyle = stage === 'apex' ? '#ffbf5e' : '#ffb347';
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 1.1, size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail (Bushy for higher stages)
        ctx.fillStyle = stage === 'apex' ? '#ffbf5e' : '#ffb347';
        ctx.beginPath();
        ctx.arc(size * 0.9, -size * 0.5, size * (stage === 'apex' ? 0.5 : 0.4), 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(0, -size * 0.6, size * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // White Mask
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, -size * 0.4, size * 0.5, size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.fillStyle = stage === 'apex' ? '#db7014' : '#e67e22';
        ctx.beginPath();
        ctx.moveTo(-size * 0.5, -size * 1.1);
        ctx.lineTo(-size * 0.2, -size * (stage === 'apex' ? 1.8 : 1.6));
        ctx.lineTo(0.1, -size * 1.1);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(size * 0.5, -size * 1.1);
        ctx.lineTo(size * 0.2, -size * (stage === 'apex' ? 1.8 : 1.6));
        ctx.lineTo(-0.1, -size * 1.1);
        ctx.fill();

        ctx.save();
        ctx.translate(0, -size * 0.6);
        drawFace(ctx, size, frame, emotion, isSleeping);
        ctx.restore();
    };

    const drawSloth = (ctx: CanvasRenderingContext2D, scale: number, frame: number, emotion: string, isSleeping: boolean, stage: 'spirit' | 'guardian' | 'apex') => {
        const size = 60 * scale;

        // Body
        ctx.fillStyle = stage === 'apex' ? '#c9b8ac' : '#d7ccc8';
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 1.2, size, 0, 0, Math.PI * 2);
        ctx.fill();

        // Face Mask
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.7, size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye Patches (more defined for higher stages)
        ctx.fillStyle = stage === 'apex' ? '#765549' : '#8d6e63';
        ctx.beginPath();
        ctx.ellipse(-size * 0.3, -size * 0.1, size * 0.25, size * (stage === 'apex' ? 0.4 : 0.35), Math.PI / 4, 0, Math.PI * 2);
        ctx.ellipse(size * 0.3, -size * 0.1, size * 0.25, size * (stage === 'apex' ? 0.4 : 0.35), -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        drawFace(ctx, size, frame, emotion, isSleeping);
    };

    const drawFace = (ctx: CanvasRenderingContext2D, size: number, frame: number, emotion: string, isSleeping: boolean) => {
        const eyeSize = size * 0.12;
        const eyeX = size * 0.4;
        const blink = !isSleeping && frame % 120 < 5;

        // Eyes
        ctx.fillStyle = '#000000';
        if (isSleeping) {
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(-eyeX, 0, eyeSize, Math.PI, 0); // Left closed
            ctx.arc(eyeX, 0, eyeSize, Math.PI, 0); // Right closed
            ctx.stroke();
            // Zzz effect
            if (frame % 30 < 15) {
                ctx.font = 'bold 20px Arial';
                ctx.fillText('Z', size * 0.8, -size * 0.5);
            }
        } else if (blink) {
            ctx.fillRect(-eyeX - eyeSize, 0, eyeSize * 2, 2);
            ctx.fillRect(eyeX - eyeSize, 0, eyeSize * 2, 2);
        } else if (emotion === 'happy') {
            ctx.beginPath();
            ctx.arc(-eyeX, 0, eyeSize, 0, Math.PI, true);
            ctx.arc(eyeX, 0, eyeSize, 0, Math.PI, true);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(-eyeX, 0, eyeSize, 0, Math.PI * 2);
            ctx.arc(eyeX, 0, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            // Shine
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(-eyeX - eyeSize * 0.2, -eyeSize * 0.2, eyeSize * 0.3, 0, Math.PI * 2);
            ctx.arc(eyeX - eyeSize * 0.2, -eyeSize * 0.2, eyeSize * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Mouth
        ctx.fillStyle = '#000';
        ctx.beginPath();
        if (emotion === 'eating') {
            const mouthOpen = Math.sin(frame * 0.3) * 5;
            ctx.ellipse(0, size * 0.3, 5, mouthOpen, 0, 0, Math.PI * 2);
        } else if (emotion === 'hungry' || emotion === 'sad') {
            ctx.arc(0, size * 0.4, 5, Math.PI, 0);
        } else {
            ctx.arc(0, size * 0.3, 3, 0, Math.PI);
        }
        ctx.stroke();

        // Blush
        ctx.fillStyle = 'rgba(255, 182, 193, 0.5)';
        ctx.beginPath();
        ctx.arc(-size * 0.6, size * 0.2, size * 0.15, 0, Math.PI * 2);
        ctx.arc(size * 0.6, size * 0.2, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
    };

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-transform duration-700"
        />
    );
};

export default PetCanvas;
