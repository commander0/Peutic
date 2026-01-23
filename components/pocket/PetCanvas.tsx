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

    const getEvolutionStage = (level: number): 'spirit' | 'guardian' | 'apex' => {
        if (level >= 10) return 'apex';
        if (level >= 5) return 'guardian';
        return 'spirit';
    };

    const getEvolutionScale = (stage: 'spirit' | 'guardian' | 'apex'): number => {
        switch (stage) {
            case 'apex': return 1.5;
            case 'guardian': return 1.25;
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

            // Bounce & Breath
            const bounce = Math.sin(frame * 0.05) * 8 * baseScale;
            const yOffset = bounce + (pet.isSleeping ? 10 * baseScale : 0);

            ctx.save();
            ctx.translate(centerX, centerY + yOffset);

            // GLOWING AURA (Holographic Effect)
            const auraSize = evolutionStage === 'apex' ? 140 : 90;
            const auraColor = evolutionStage === 'apex' ? '255, 215, 0' : '34, 211, 238'; // Gold vs Cyan

            const gradient = ctx.createRadialGradient(0, 0, 30 * baseScale, 0, 0, auraSize * baseScale);
            gradient.addColorStop(0, `rgba(${auraColor}, 0.2)`);
            gradient.addColorStop(1, `rgba(${auraColor}, 0)`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, auraSize * baseScale, 0, Math.PI * 2);
            ctx.fill();

            // Inner Rings
            ctx.strokeStyle = `rgba(${auraColor}, 0.4)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(0, 0, 70 * baseScale, 20 * baseScale, frame * 0.02, 0, Math.PI * 2);
            ctx.stroke();
            if(evolutionStage !== 'spirit') {
                ctx.beginPath();
                ctx.ellipse(0, 0, 90 * baseScale, 30 * baseScale, -frame * 0.02, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Draw Pet Logic
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

            ctx.restore();

            // Scanlines
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            for (let i = 0; i < height; i += 4) {
                ctx.fillRect(0, i, width, 1);
            }

            frame++;
            animationId = requestAnimationFrame(draw);
        };

        animationId = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animationId);
    }, [pet, width, height, emotion]);

    // DRAWING HELPERS
    const drawHamu = (ctx: CanvasRenderingContext2D, scale: number, frame: number, emotion: string, isSleeping: boolean, stage: 'spirit' | 'guardian' | 'apex') => {
        const size = 60 * scale;
        // Body
        ctx.fillStyle = stage === 'apex' ? '#ffdfba' : '#fff5eb';
        ctx.shadowColor = 'rgba(255,200,200,0.5)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Ears
        ctx.fillStyle = '#ffb7b2';
        ctx.beginPath();
        ctx.arc(-size * 0.6, -size * 0.6, size * 0.25, 0, Math.PI * 2);
        ctx.arc(size * 0.6, -size * 0.6, size * 0.25, 0, Math.PI * 2);
        ctx.fill();

        drawFace(ctx, size, frame, emotion, isSleeping);
    };

    const drawDino = (ctx: CanvasRenderingContext2D, scale: number, frame: number, emotion: string, isSleeping: boolean, stage: 'spirit' | 'guardian' | 'apex') => {
        const size = 65 * scale;
        ctx.fillStyle = stage === 'apex' ? '#69f0ae' : '#b9f6ca';
        ctx.shadowColor = 'rgba(100,255,150,0.5)';
        ctx.shadowBlur = 15;
        
        // Body
        ctx.beginPath();
        ctx.roundRect(-size * 0.8, -size * 0.5, size * 1.6, size * 1.2, 20);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(0, -size * 0.6, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Spikes
        ctx.fillStyle = '#00e676';
        for(let i=0; i<3; i++) {
            ctx.beginPath();
            ctx.moveTo(-40*scale + i*40*scale, -size * 1.1);
            ctx.lineTo(-25*scale + i*40*scale, -size * 1.4);
            ctx.lineTo(-10*scale + i*40*scale, -size * 1.1);
            ctx.fill();
        }

        ctx.save();
        ctx.translate(0, -size * 0.5);
        drawFace(ctx, size * 0.8, frame, emotion, isSleeping);
        ctx.restore();
    };

    const drawShiba = (ctx: CanvasRenderingContext2D, scale: number, frame: number, emotion: string, isSleeping: boolean, stage: 'spirit' | 'guardian' | 'apex') => {
        const size = 60 * scale;
        ctx.fillStyle = stage === 'apex' ? '#ffd180' : '#ffe0b2';
        ctx.shadowColor = 'rgba(255,160,0,0.5)';
        ctx.shadowBlur = 15;

        // Head
        ctx.beginPath();
        ctx.arc(0, -size*0.2, size * 0.9, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Ears (Pointy)
        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.moveTo(-size*0.6, -size*0.8);
        ctx.lineTo(-size*0.3, -size*1.6);
        ctx.lineTo(0, -size*0.8);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(size*0.6, -size*0.8);
        ctx.lineTo(size*0.3, -size*1.6);
        ctx.lineTo(0, -size*0.8);
        ctx.fill();

        // White cheeks
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(-size*0.4, size*0.1, size*0.3, size*0.25, 0, 0, Math.PI*2);
        ctx.ellipse(size*0.4, size*0.1, size*0.3, size*0.25, 0, 0, Math.PI*2);
        ctx.fill();

        drawFace(ctx, size, frame, emotion, isSleeping);
    };

    const drawSloth = (ctx: CanvasRenderingContext2D, scale: number, frame: number, emotion: string, isSleeping: boolean, stage: 'spirit' | 'guardian' | 'apex') => {
        const size = 60 * scale;
        ctx.fillStyle = stage === 'apex' ? '#cfd8dc' : '#eceff1';
        ctx.shadowColor = 'rgba(200,200,200,0.5)';
        ctx.shadowBlur = 15;

        // Head
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 1.1, size * 0.9, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Eye patches
        ctx.fillStyle = '#90a4ae';
        ctx.beginPath();
        ctx.ellipse(-size*0.35, 0, size*0.25, size*0.2, -0.2, 0, Math.PI*2);
        ctx.ellipse(size*0.35, 0, size*0.25, size*0.2, 0.2, 0, Math.PI*2);
        ctx.fill();

        drawFace(ctx, size, frame, emotion, isSleeping);
    };

    const drawFace = (ctx: CanvasRenderingContext2D, size: number, frame: number, emotion: string, isSleeping: boolean) => {
        const eyeX = size * 0.35;
        const eyeSize = size * 0.12;

        ctx.fillStyle = '#37474f';
        
        // Eyes
        if (isSleeping) {
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-eyeX - 10, 0); ctx.lineTo(-eyeX + 10, 0);
            ctx.moveTo(eyeX - 10, 0); ctx.lineTo(eyeX + 10, 0);
            ctx.stroke();
            // Zzz
            if(frame % 60 < 30) {
                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = '#fff';
                ctx.fillText('z', size*0.8, -size*0.8);
            }
        } else {
            // Blinking
            if (frame % 150 < 6) {
                ctx.fillRect(-eyeX - eyeSize, -2, eyeSize*2, 4);
                ctx.fillRect(eyeX - eyeSize, -2, eyeSize*2, 4);
            } else {
                ctx.beginPath();
                ctx.arc(-eyeX, 0, eyeSize, 0, Math.PI * 2);
                ctx.arc(eyeX, 0, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                // Sparkle
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(-eyeX - 3, -3, 3, 0, Math.PI * 2);
                ctx.arc(eyeX - 3, -3, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Mouth
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#37474f';
        ctx.beginPath();
        if (emotion === 'happy' || emotion === 'eating') {
            ctx.arc(0, size * 0.2, 8, 0, Math.PI);
        } else if (emotion === 'sad') {
            ctx.arc(0, size * 0.4, 8, Math.PI, 0);
        } else {
            ctx.moveTo(-5, size*0.3); ctx.lineTo(5, size*0.3);
        }
        ctx.stroke();

        // Cheeks
        if (emotion === 'happy') {
            ctx.fillStyle = 'rgba(255, 100, 100, 0.4)';
            ctx.beginPath();
            ctx.arc(-size*0.6, size*0.2, 10, 0, Math.PI*2);
            ctx.arc(size*0.6, size*0.2, 10, 0, Math.PI*2);
            ctx.fill();
        }
    };

    return <canvas ref={canvasRef} width={width} height={height} className="w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />;
};

export default PetCanvas;