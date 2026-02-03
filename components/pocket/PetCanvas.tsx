import React, { useRef, useEffect } from 'react';
import { Lumina } from '../../types';

interface PetCanvasProps {
    pet: Lumina;
    width: number;
    height: number;
    emotion: 'idle' | 'happy' | 'hungry' | 'sleeping' | 'sad' | 'eating';
    trick: 'spin' | 'magic' | null;
}

export const PetCanvas: React.FC<PetCanvasProps> = ({ pet, width, height, emotion, trick }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let bounce = 0;
        let rotation = 0;
        let scaleX = 1;
        let scaleY = 1;

        const render = () => {
            frameRef.current++;
            const t = frameRef.current;

            // Clear
            ctx.clearRect(0, 0, width, height);

            // ANIMATION PHYSICS
            if (trick === 'spin') {
                rotation += 0.2;
            } else {
                // Organic Bounce (Squash & Stretch)
                bounce = Math.sin(t * 0.1) * 10;
                // Squash when hitting bottom, stretch when going up
                scaleX = 1 + Math.sin(t * 0.1) * 0.05;
                scaleY = 1 - Math.sin(t * 0.1) * 0.05;

                // Return to idle rotation
                rotation = rotation * 0.9;
            }

            if (trick === 'magic') {
                scaleX = 1 + Math.sin(t * 0.5) * 0.2;
                scaleY = 1 + Math.sin(t * 0.5) * 0.2;
            }

            ctx.save();
            ctx.translate(width / 2, height / 2);

            // Apply Transformations
            ctx.rotate(rotation);
            ctx.scale(scaleX, scaleY);
            ctx.translate(0, bounce); // Bounce happens in local Y

            // DRAW PET (Pixel Art Style via Rects)
            // Color Palettes based on species
            const colors = {
                'Holo-Hamu': { main: '#F48FB1', shade: '#C2185B', light: '#F8BBD0' },
                'Digi-Dino': { main: '#66BB6A', shade: '#2E7D32', light: '#A5D6A7' },
                'Neo-Shiba': { main: '#FFB74D', shade: '#EF6C00', light: '#FFE0B2' },
                'Zen-Sloth': { main: '#A1887F', shade: '#5D4037', light: '#D7CCC8' },
            }[pet.species] || { main: '#ccc', shade: '#888', light: '#eee' };

            const pSize = width / 10; // Base unit size

            // Glow Effect
            ctx.shadowBlur = 20;
            ctx.shadowColor = colors.main;

            // BODY (Rounded Rect approximation)
            ctx.fillStyle = colors.main;
            ctx.fillRect(-pSize * 1.5, -pSize * 1.5, pSize * 3, pSize * 3);

            // EARS / FEATURES
            ctx.fillStyle = colors.shade;
            if (pet.species === 'Digi-Dino') {
                // Spikes
                ctx.beginPath();
                ctx.moveTo(0, -pSize * 2);
                ctx.lineTo(pSize / 2, -pSize * 1.5);
                ctx.lineTo(-pSize / 2, -pSize * 1.5);
                ctx.fill();
            } else {
                // Ears
                ctx.fillRect(-pSize * 1.5, -pSize * 2, pSize, pSize);
                ctx.fillRect(pSize * 0.5, -pSize * 2, pSize, pSize);
            }

            // FACE
            ctx.fillStyle = '#111';

            // Eyes
            const eyeState = emotion === 'sleeping' ? 'closed' : (emotion === 'happy' || trick) ? 'happy' : 'open';

            if (eyeState === 'closed' || (t % 120 > 115)) { // Blink
                ctx.fillRect(-pSize, -pSize * 0.5, pSize * 0.8, pSize * 0.2);
                ctx.fillRect(pSize * 0.2, -pSize * 0.5, pSize * 0.8, pSize * 0.2);
            } else if (eyeState === 'happy') {
                // ^ ^ Eyes
                ctx.beginPath();
                ctx.moveTo(-pSize, -pSize * 0.3);
                ctx.lineTo(-pSize * 0.6, -pSize * 0.7);
                ctx.lineTo(-pSize * 0.2, -pSize * 0.3);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(pSize * 0.2, -pSize * 0.3);
                ctx.lineTo(pSize * 0.6, -pSize * 0.7);
                ctx.lineTo(pSize, -pSize * 0.3);
                ctx.stroke();
            } else {
                // Normal dots
                ctx.fillRect(-pSize, -pSize * 0.6, pSize * 0.6, pSize * 0.6);
                ctx.fillRect(pSize * 0.4, -pSize * 0.6, pSize * 0.6, pSize * 0.6);
                // Shine
                ctx.fillStyle = '#fff';
                ctx.fillRect(-pSize * 0.8, -pSize * 0.5, pSize * 0.2, pSize * 0.2);
                ctx.fillRect(pSize * 0.6, -pSize * 0.5, pSize * 0.2, pSize * 0.2);
            }

            // MOUTH
            ctx.fillStyle = '#111';
            if (emotion === 'eating') {
                ctx.beginPath();
                ctx.arc(0, pSize * 0.5, pSize * 0.4 * Math.abs(Math.sin(t * 0.2)), 0, Math.PI * 2);
                ctx.fill();
            } else if (emotion === 'happy') {
                ctx.beginPath();
                ctx.arc(0, pSize * 0.2, pSize * 0.5, 0, Math.PI);
                ctx.stroke();
            } else {
                ctx.fillRect(-pSize * 0.2, pSize * 0.5, pSize * 0.4, pSize * 0.1);
            }

            // PARTICLES (Emotion Bubbles)
            if (emotion === 'sleeping' && t % 60 === 0) {
                // Zzz drawn in parent component mostly, but we can add floating bubble
            }

            ctx.restore();

            requestAnimationFrame(render);
        };

        const aniId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(aniId);
    }, [pet, width, height, emotion, trick]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full h-full object-contain pointer-events-none"
        />
    );
};
