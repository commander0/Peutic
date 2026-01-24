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

    // Evolution stage based on level
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

            // --- ANIMATION STATE ---
            let rotation = 0;
            let scaleMod = 1;

            if (trick === 'spin') {
                rotation = (frame * 0.15) % (Math.PI * 2);
            } else if (trick === 'flip') {
                scaleMod = Math.sin(frame * 0.1);
            }

            // --- HYPER REALISTIC LUMINA EFFECT ---
            const time = Date.now() / 1000;
            const pulse = Math.sin(time * 2) * 5; // Used for glow pulsation

            // Background Halo
            const bgGrad = ctx.createRadialGradient(centerX, centerY, 50 * baseScale, centerX, centerY, 200 * baseScale);
            bgGrad.addColorStop(0, 'rgba(45, 212, 191, 0.1)'); // Teal-400 equivalent low opacity
            bgGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = bgGrad;
            ctx.beginPath(); ctx.arc(centerX, centerY, 200 * baseScale, 0, Math.PI * 2); ctx.fill();

            // Floating bounce effect
            const bounce = Math.sin(frame * 0.05) * 8 * baseScale;
            const yOffset = bounce + (pet.isSleeping ? 10 * baseScale : 0);

            ctx.save();
            ctx.translate(centerX, centerY + yOffset);
            ctx.rotate(rotation);
            ctx.scale(scaleMod, 1);

            // 2. CRYSTALLINE HOLOGRAPHIC SHADER
            // Add "Digital Rain" background noise
            ctx.fillStyle = `rgba(45, 212, 191, ${0.03 + Math.sin(frame * 0.1) * 0.02})`;
            for (let i = 0; i < 10; i++) {
                const rx = Math.random() * width - (width / 2);
                const ry = (frame * 5 + Math.random() * 500) % height - (height / 2);
                ctx.fillRect(rx, ry, 1, 10);
            }

            ctx.globalCompositeOperation = 'lighten';
            ctx.shadowColor = '#2dd4bf';
            ctx.shadowBlur = 15;

            // DRAW PET BASED ON SPECIES
            switch (pet.species) {
                case 'Holo-Hamu': drawHamu(ctx, baseScale, frame, emotion, pet.isSleeping, evolutionStage); break;
                case 'Digi-Dino': drawDino(ctx, baseScale, frame, emotion, pet.isSleeping, evolutionStage); break;
                case 'Neo-Shiba': drawShiba(ctx, baseScale, frame, emotion, pet.isSleeping, evolutionStage); break;
                case 'Zen-Sloth': drawSloth(ctx, baseScale, frame, emotion, pet.isSleeping, evolutionStage); break;
            }

            // 3. GLITCH ARTIFACTS
            if (Math.random() > 0.95) {
                const sliceH = Math.random() * 10;
                const sliceY = (Math.random() - 0.5) * 100 * baseScale;
                const sliceX = (Math.random() - 0.5) * 20;
                // Note: getImageData requires canvas coordinates, which is complex with transformations.
                // Simplified glitch for 'in-place' rendering
                ctx.fillStyle = 'rgba(45, 212, 191, 0.5)';
                ctx.fillRect(sliceX - 20, sliceY, 40, sliceH);
            }

            ctx.restore();

            // 4. PARTICLES (Magic Trick / Standard)
            const particleCount = trick === 'magic' ? 40 : 15;
            for (let i = 0; i < particleCount; i++) {
                const angle = (frame * 0.01 + i * 20) % (Math.PI * 2);
                const radius = (trick === 'magic' ? 160 : 120) * baseScale + Math.sin(frame * 0.05 + i) * 20;
                const px = centerX + Math.cos(angle) * radius;
                const py = centerY + Math.sin(angle) * radius * 0.3; // Elliptical orbit

                ctx.fillStyle = i % 2 === 0 ? '#2dd4bf' : (trick === 'magic' ? '#ff00ff' : '#facc15');
                ctx.globalAlpha = 0.6 + Math.sin(frame * 0.1 + i) * 0.4;
                ctx.beginPath();
                ctx.moveTo(px, py - 3);
                ctx.lineTo(px + 3, py);
                ctx.lineTo(px, py + 3);
                ctx.lineTo(px - 3, py);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;

            frame++;
            animationId = requestAnimationFrame(draw);
        };

        animationId = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animationId);
    }, [pet, width, height, emotion, trick]);

    // DRAWING HELPERS WITH BODY
    const drawLimbs = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, isLeg: boolean, frame: number) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        const swing = Math.sin(frame * 0.1) * 5;
        // Simple rounded rect for limb
        const w = size * 0.4;
        const h = size * 0.6;
        ctx.ellipse(x, y + (isLeg ? 0 : swing), w, h, 0, 0, Math.PI * 2);
        ctx.fill();
    };

    const drawHamu = (ctx: CanvasRenderingContext2D, scale: number, frame: number, emotion: string, isSleeping: boolean, stage: 'spirit' | 'guardian' | 'apex') => {
        const size = 60 * scale;
        const color = stage === 'apex' ? '#ffe8c5' : '#ffecd2';

        // Limbs (Feet)
        drawLimbs(ctx, -size * 0.4, size * 0.8, size * 0.4, color, true, frame);
        drawLimbs(ctx, size * 0.4, size * 0.8, size * 0.4, color, true, frame);
        // Arms
        drawLimbs(ctx, -size * 0.7, size * 0.3, size * 0.3, color, false, frame);
        drawLimbs(ctx, size * 0.7, size * 0.3, size * 0.3, color, false, frame);

        // Body
        ctx.fillStyle = color;
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

        // Crown
        if (stage === 'apex') {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(0, -size * 1.1); ctx.lineTo(-size * 0.3, -size * 0.85); ctx.lineTo(size * 0.3, -size * 0.85);
            ctx.fill();
        }
        drawFace(ctx, size, frame, emotion, isSleeping);
    };

    const drawDino = (ctx: CanvasRenderingContext2D, scale: number, frame: number, emotion: string, isSleeping: boolean, stage: 'spirit' | 'guardian' | 'apex') => {
        const size = 65 * scale;
        const color = stage === 'apex' ? '#8fd4a1' : '#b7e4c7';

        // Legs
        drawLimbs(ctx, -size * 0.4, size * 0.7, size * 0.4, color, true, frame);
        drawLimbs(ctx, size * 0.2, size * 0.7, size * 0.4, color, true, frame);
        // Tail
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(size * 0.5, 0); ctx.lineTo(size * 1.2, size * 0.5); ctx.lineTo(size * 0.5, size * 0.8);
        ctx.fill();

        // Body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(-size, -size * 0.5, size * 1.5, size * 1.2, size * 0.5);
        ctx.fill();

        // Head
        ctx.beginPath(); ctx.arc(size * 0.3, -size * 0.6, size * 0.6, 0, Math.PI * 2); ctx.fill();

        // Spikes
        const spikeCount = stage === 'apex' ? 5 : 3;
        ctx.fillStyle = stage === 'apex' ? '#50b86a' : '#74c69d';
        for (let i = 0; i < spikeCount; i++) {
            ctx.beginPath();
            ctx.moveTo(-size * 0.8 + (i * size * 0.4), -size * 0.6);
            ctx.lineTo(-size * 0.65 + (i * size * 0.4), -size * 1.2);
            ctx.lineTo(-size * 0.5 + (i * size * 0.4), -size * 0.6);
            ctx.fill();
        }

        ctx.save(); ctx.translate(size * 0.3, -size * 0.4);
        drawFace(ctx, size * 0.8, frame, emotion, isSleeping);
        ctx.restore();
    };

    const drawShiba = (ctx: CanvasRenderingContext2D, scale: number, frame: number, emotion: string, isSleeping: boolean, stage: 'spirit' | 'guardian' | 'apex') => {
        const size = 60 * scale;
        const color = stage === 'apex' ? '#ffbf5e' : '#ffb347';

        // Paws
        drawLimbs(ctx, -size * 0.6, size * 0.6, size * 0.3, color, true, frame);
        drawLimbs(ctx, size * 0.6, size * 0.6, size * 0.3, color, true, frame);

        // Body
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.ellipse(0, 0, size * 1.1, size * 0.8, 0, 0, Math.PI * 2); ctx.fill();

        // Tail
        ctx.beginPath(); ctx.arc(size * 0.9, -size * 0.5, size * 0.4, 0, Math.PI * 2); ctx.fill();

        // Head
        ctx.beginPath(); ctx.arc(0, -size * 0.6, size * 0.7, 0, Math.PI * 2); ctx.fill();

        // Mask
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.ellipse(0, -size * 0.4, size * 0.5, size * 0.4, 0, 0, Math.PI * 2); ctx.fill();

        // Ears
        ctx.fillStyle = stage === 'apex' ? '#db7014' : '#e67e22';
        ctx.beginPath(); ctx.moveTo(-size * 0.5, -size * 1.1); ctx.lineTo(-size * 0.2, -size * 1.6); ctx.lineTo(0.1, -size * 1.1); ctx.fill();
        ctx.beginPath(); ctx.moveTo(size * 0.5, -size * 1.1); ctx.lineTo(size * 0.2, -size * 1.6); ctx.lineTo(-0.1, -size * 1.1); ctx.fill();

        ctx.save(); ctx.translate(0, -size * 0.6);
        drawFace(ctx, size, frame, emotion, isSleeping);
        ctx.restore();
    };

    const drawSloth = (ctx: CanvasRenderingContext2D, scale: number, frame: number, emotion: string, isSleeping: boolean, stage: 'spirit' | 'guardian' | 'apex') => {
        const size = 60 * scale;
        const color = stage === 'apex' ? '#c9b8ac' : '#d7ccc8';

        // Limbs (Arms/Legs Hanging)
        drawLimbs(ctx, -size * 0.8, size * 0.2, size * 0.3, color, false, frame);
        drawLimbs(ctx, size * 0.8, size * 0.2, size * 0.3, color, false, frame);
        drawLimbs(ctx, -size * 0.6, size * 0.8, size * 0.3, color, true, frame);
        drawLimbs(ctx, size * 0.6, size * 0.8, size * 0.3, color, true, frame);

        // Body
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.ellipse(0, 0, size * 1.2, size, 0, 0, Math.PI * 2); ctx.fill();

        // Face Mask
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath(); ctx.ellipse(0, 0, size * 0.7, size * 0.6, 0, 0, Math.PI * 2); ctx.fill();

        // Eye Patches
        ctx.fillStyle = stage === 'apex' ? '#765549' : '#8d6e63';
        ctx.beginPath();
        ctx.ellipse(-size * 0.3, -size * 0.1, size * 0.25, size * 0.35, Math.PI / 4, 0, Math.PI * 2);
        ctx.ellipse(size * 0.3, -size * 0.1, size * 0.25, size * 0.35, -Math.PI / 4, 0, Math.PI * 2);
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
            className="drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-transform duration-700 origin-center"
            style={{ width: width, height: height }}
        />
    );
};

export default PetCanvas;
