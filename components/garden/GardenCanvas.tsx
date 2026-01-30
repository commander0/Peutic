import React, { useRef, useEffect } from 'react';
import { GardenState } from '../../types';

interface GardenCanvasProps {
    garden: GardenState;
    width: number;
    height: number;
    // Optional props for interaction effects
    interactionType?: 'clip' | 'water' | null;
}

const GardenCanvas: React.FC<GardenCanvasProps> = ({ garden, width, height, interactionType }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef<number>(0);

    // --- ZEN BONSAI RENDERER ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let sway = 0;
        let particles: { x: number, y: number, vy: number, vx: number, life: number, color: string, size: number }[] = [];

        // Draw Branch Function (Fractal with organic twists)
        const drawBranch = (startX: number, startY: number, len: number, angle: number, branchWidth: number, depth: number) => {
            ctx.save();
            ctx.translate(startX, startY);

            // Organic sway
            const swayOffset = Math.sin(sway * 0.5 + depth) * 0.05 * (depth * 0.2);
            ctx.rotate(angle + swayOffset);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            // Quadratic curve for organic look
            ctx.quadraticCurveTo(0, -len / 2, 0, -len);

            ctx.lineWidth = branchWidth;
            ctx.lineCap = 'round';
            // Simple gradient for bark
            ctx.strokeStyle = depth < 2 ? '#4e342e' : '#795548';
            ctx.stroke();

            // Transform to end of branch for next iteration
            ctx.translate(0, -len);

            // Leaves / Blossoms at tips (Recursion Halt or Branch Nodes)
            if (len < 15 || depth > (garden.level + 2)) {
                // Determine Plant Type Colors
                const pType = (garden.currentPlantType as string) || 'Lotus';
                let leafColor = '#4CAF50';
                let bloomColor = '#F48FB1';

                if (pType === 'Pine') { leafColor = '#2e7d32'; bloomColor = '#a5d6a7'; }
                if (garden.waterLevel < 30) bloomColor = '#ef5350'; // Wilted

                ctx.beginPath();
                const bloomSize = 4 + Math.sin(frameRef.current * 0.05 + depth) * 1.5;
                ctx.arc(0, 0, bloomSize, 0, Math.PI * 2);

                // 30% chance of bloom vs leaf
                ctx.fillStyle = (Math.random() > 0.7 || depth > 8) ? bloomColor : leafColor;

                ctx.fill();

                // Glow effect
                ctx.shadowBlur = 5;
                ctx.shadowColor = ctx.fillStyle;

                ctx.restore();
                return;
            }

            // Recursive branching
            // Use slightly random angles for "Zen" asymmetry
            drawBranch(0, 0, len * 0.75, 0.45, branchWidth * 0.7, depth + 1);
            drawBranch(0, 0, len * 0.75, -0.45, branchWidth * 0.7, depth + 1);

            ctx.restore();
        };

        const render = () => {
            frameRef.current++;
            sway += 0.02;

            // 1. Background (Zen Gradient)
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#e0f7fa'); // Sky
            gradient.addColorStop(1, '#f1f8e9'); // Mist
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // 2. Rising Sun (Red/Orange)
            ctx.beginPath();
            ctx.arc(width * 0.5, height * 0.8, 100, 0, Math.PI, true);
            ctx.fillStyle = 'rgba(255, 87, 34, 0.15)'; // Zen sun
            ctx.fill();

            // 3. Pot (Minimalist Ceramic)
            const potY = height - 40;
            const potW = 100;
            ctx.fillStyle = '#5d4037';
            ctx.beginPath();
            // @ts-ignore
            if (ctx.roundRect) ctx.roundRect(width / 2 - potW / 2, potY, potW, 30, 5);
            else ctx.fillRect(width / 2 - potW / 2, potY, potW, 30);
            ctx.fill();
            // Rim
            ctx.fillStyle = '#8d6e63';
            ctx.fillRect(width / 2 - potW / 2 - 5, potY, potW + 10, 6);


            // 4. Tree Root
            drawBranch(width / 2, potY, 50, 0, 10, 0);

            // 5. Interaction Particles (Clip Effect)
            if (interactionType === 'clip' && Math.random() > 0.8) {
                particles.push({
                    x: width / 2 + (Math.random() - 0.5) * 150,
                    y: height / 2 + (Math.random() - 0.5) * 150,
                    vx: (Math.random() - 0.5) * 1,
                    vy: Math.random() * 2,
                    life: 1.0,
                    color: '#f48fb1',
                    size: Math.random() * 3 + 2
                });
            }

            // Render Particles
            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
                if (p.life <= 0) particles.splice(i, 1);
            });

            requestAnimationFrame(render);
        };

        const aniId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(aniId);
    }, [garden, width, height, interactionType]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full h-full object-contain drop-shadow-xl rounded-xl"
        />
    );
};

export default GardenCanvas;
