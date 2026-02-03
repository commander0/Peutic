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

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let sway = 0;
        let particles: { x: number, y: number, vy: number, vx: number, life: number, color: string, size: number }[] = [];

        // Draw Branch Function (Organic Tapered Brush)
        const drawBranch = (startX: number, startY: number, len: number, angle: number, branchWidth: number, depth: number) => {
            ctx.save();
            ctx.translate(startX, startY);

            // Natural Sway: More intense at tips
            const swayOffset = Math.sin(sway * 0.8 + depth) * 0.02 * (depth * 0.5);
            ctx.rotate(angle + swayOffset);

            // Draw Limb (Bezier for curve)
            ctx.beginPath();
            ctx.moveTo(0, 0);

            // Texture Gradient
            const grad = ctx.createLinearGradient(0, 0, branchWidth, -len);
            grad.addColorStop(0, '#3e2723'); // Dark Wood
            grad.addColorStop(1, '#5d4037'); // Lighter Wood

            ctx.fillStyle = grad;

            // Draw a tapered shape rather than a line
            ctx.moveTo(-branchWidth / 2, 0);
            ctx.quadraticCurveTo(branchWidth / 4, -len / 2, -branchWidth / 3, -len); // Left edge
            ctx.lineTo(branchWidth / 3, -len); // Top
            ctx.quadraticCurveTo(branchWidth / 2, -len / 2, branchWidth / 2, 0); // Right edge
            ctx.closePath();
            ctx.fill();

            // Transform to end of branch for next iteration
            ctx.translate(0, -len);

            // FLOWERS / LEAVES
            if (len < 12 || depth > (garden.level + 3)) {
                // Determine Plant Type Colors
                const pType = (garden.currentPlantType as string) || 'Lotus';
                let leafColor = '#4CAF50';
                let bloomColor = '#F48FB1';

                if (pType === 'Pine') { leafColor = '#2e7d32'; bloomColor = '#a5d6a7'; }
                if (garden.waterLevel < 30) bloomColor = '#ef5350'; // Wilted

                // Bloom/Leaf Logic
                const isBloom = Math.random() > 0.6 || depth > 9;
                const size = isBloom ? 6 : 4;

                ctx.beginPath();
                ctx.arc(0, 0, size * (1 + Math.sin(frameRef.current * 0.05 + depth) * 0.2), 0, Math.PI * 2);
                ctx.fillStyle = isBloom ? bloomColor : leafColor;

                // Glow
                ctx.shadowBlur = 10;
                ctx.shadowColor = ctx.fillStyle;
                ctx.fill();

                // Bright center for blooms
                if (isBloom) {
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
                return;
            }

            // Recursive branching (Fractal)
            // Asymmetric splitting for natural look
            drawBranch(0, 0, len * 0.8, 0.4, branchWidth * 0.7, depth + 1);
            drawBranch(0, 0, len * 0.7, -0.5, branchWidth * 0.7, depth + 1);

            ctx.restore();
        };

        const render = () => {
            frameRef.current++;
            sway += 0.015;

            // 1. Clear with Transparency for Trail (optional, sticking to clean clear for now)
            ctx.clearRect(0, 0, width, height);

            // 2. Rising Sun / Moon Glow (Background Light)
            const gradient = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, 300);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // 3. Pot (Minimalist Ceramic with Reflection)
            const potY = height - 60;
            const potW = 120;

            // Shadow under pot
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.ellipse(width / 2, potY + 40, potW * 0.6, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // Main Pot
            const potGrad = ctx.createLinearGradient(width / 2 - potW / 2, potY, width / 2 + potW / 2, potY);
            potGrad.addColorStop(0, '#3e2723');
            potGrad.addColorStop(0.5, '#5d4037');
            potGrad.addColorStop(1, '#3e2723');
            ctx.fillStyle = potGrad;

            ctx.beginPath();
            // Trapezoid shape
            ctx.moveTo(width / 2 - potW / 2, potY); // Top Left
            ctx.lineTo(width / 2 + potW / 2, potY); // Top Right
            ctx.lineTo(width / 2 + potW / 3, potY + 40); // Bot Right
            ctx.lineTo(width / 2 - potW / 3, potY + 40); // Bot Left
            ctx.closePath();
            ctx.fill();

            // Rim
            ctx.fillStyle = '#795548';
            ctx.fillRect(width / 2 - potW / 2 - 5, potY, potW + 10, 8);


            // 4. Tree Root System
            drawBranch(width / 2, potY, 70, 0, 16, 0);

            // 5. Interaction Particles (Water Splash)
            if (interactionType === 'water' && Math.random() > 0.6) {
                // Splash from top
                particles.push({
                    x: width / 2 + (Math.random() - 0.5) * 100,
                    y: 0,
                    vx: 0,
                    vy: Math.random() * 5 + 5,
                    life: 1.0,
                    color: '#4fc3f7',
                    size: Math.random() * 2 + 1
                });
            }

            // Growth Sparkles
            if (interactionType === 'clip' && Math.random() > 0.8) {
                particles.push({
                    x: width / 2 + (Math.random() - 0.5) * 200,
                    y: height / 2 + (Math.random() - 0.5) * 200,
                    vx: (Math.random() - 0.5) * 1,
                    vy: -Math.random() * 1, // Float up
                    life: 1.0,
                    color: '#fff176', // Gold
                    size: Math.random() * 3
                });
            }

            // Render Particles
            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.015;

                // If splashing, bounce off pot? Simplified: fade out
                if (p.y > potY && p.color === '#4fc3f7') {
                    p.vy = -p.vy * 0.3; // Splash bounce
                    p.life -= 0.1;
                }

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
            className="w-full h-full object-contain pointer-events-none" // Pointer events passed to parent for tilt
        />
    );
};

export default GardenCanvas;
