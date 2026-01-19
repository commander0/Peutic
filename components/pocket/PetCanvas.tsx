import React, { useEffect, useRef } from 'react';
import { PocketPet } from '../../types';

interface PetCanvasProps {
    pet: PocketPet;
    width?: number;
    height?: number;
    emotion?: 'idle' | 'happy' | 'hungry' | 'sleeping' | 'sad' | 'eating';
}

const PetCanvas: React.FC<PetCanvasProps> = ({ pet, width = 300, height = 300, emotion = 'idle' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frame = 0;
        let animationId: number;

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            const centerX = width / 2;
            const centerY = height / 2;
            const scale = width / 300;

            // Floating bounce effect
            const bounce = Math.sin(frame * 0.1) * 5 * scale;
            const yOffset = bounce + (pet.isSleeping ? 10 * scale : 0);

            ctx.save();
            ctx.translate(centerX, centerY + yOffset);

            // DRAW PET BASED ON SPECIES
            switch (pet.species) {
                case 'Holo-Hamu':
                    drawHamu(ctx, scale, frame, emotion, pet.isSleeping);
                    break;
                case 'Digi-Dino':
                    drawDino(ctx, scale, frame, emotion, pet.isSleeping);
                    break;
                case 'Neo-Shiba':
                    drawShiba(ctx, scale, frame, emotion, pet.isSleeping);
                    break;
                case 'Zen-Sloth':
                    drawSloth(ctx, scale, frame, emotion, pet.isSleeping);
                    break;
            }

            // HOLOGRAPHIC GLOW EFFECT
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';

            ctx.restore();

            // Overlay Scanlines for Retro feel
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            for (let i = 0; i < height; i += 4) {
                ctx.fillRect(0, i, width, 1);
            }

            frame++;
            animationId = requestAnimationFrame(draw);
        };

        animationId = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animationId);
    }, [pet, width, height, emotion]);

    // SPECIES DRAWING FUNCTIONS
    const drawHamu = (ctx: CanvasRenderingContext2D, scale: number, frame: number, emotion: string, isSleeping: boolean) => {
        const size = 60 * scale;

        // Body (Round blob)
        ctx.fillStyle = '#ffecd2';
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Belly
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, size * 0.3, size * 0.7, size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.fillStyle = '#ffcad4';
        ctx.beginPath();
        ctx.arc(-size * 0.6, -size * 0.7, size * 0.3, 0, Math.PI * 2); // Left ear
        ctx.arc(size * 0.6, -size * 0.7, size * 0.3, 0, Math.PI * 2); // Right ear
        ctx.fill();

        drawFace(ctx, size, frame, emotion, isSleeping);
    };

    const drawDino = (ctx: CanvasRenderingContext2D, scale: number, frame: number, emotion: string, isSleeping: boolean) => {
        const size = 65 * scale;

        // Body
        ctx.fillStyle = '#b7e4c7';
        ctx.beginPath();
        ctx.roundRect(-size, -size * 0.5, size * 1.5, size * 1.2, size * 0.5);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(size * 0.3, -size * 0.6, size * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Spikes
        ctx.fillStyle = '#74c69d';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-size * 0.8 + (i * size * 0.5), -size * 0.6);
            ctx.lineTo(-size * 0.6 + (i * size * 0.5), -size * 1.1);
            ctx.lineTo(-size * 0.4 + (i * size * 0.5), -size * 0.6);
            ctx.fill();
        }

        ctx.save();
        ctx.translate(size * 0.3, -size * 0.4);
        drawFace(ctx, size * 0.8, frame, emotion, isSleeping);
        ctx.restore();
    };

    const drawShiba = (ctx: CanvasRenderingContext2D, scale: number, frame: number, emotion: string, isSleeping: boolean) => {
        const size = 60 * scale;

        // Body
        ctx.fillStyle = '#ffb347';
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 1.1, size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.fillStyle = '#ffb347';
        ctx.beginPath();
        ctx.arc(size * 0.9, -size * 0.5, size * 0.4, 0, Math.PI * 2);
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
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.moveTo(-size * 0.5, -size * 1.1);
        ctx.lineTo(-size * 0.2, -size * 1.6);
        ctx.lineTo(0.1, -size * 1.1);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(size * 0.5, -size * 1.1);
        ctx.lineTo(size * 0.2, -size * 1.6);
        ctx.lineTo(-0.1, -size * 1.1);
        ctx.fill();

        ctx.save();
        ctx.translate(0, -size * 0.6);
        drawFace(ctx, size, frame, emotion, isSleeping);
        ctx.restore();
    };

    const drawSloth = (ctx: CanvasRenderingContext2D, scale: number, frame: number, emotion: string, isSleeping: boolean) => {
        const size = 60 * scale;

        // Body
        ctx.fillStyle = '#d7ccc8';
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 1.2, size, 0, 0, Math.PI * 2);
        ctx.fill();

        // Face Mask
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.7, size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye Patches
        ctx.fillStyle = '#8d6e63';
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
            className="drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-transform duration-700"
        />
    );
};

export default PetCanvas;
