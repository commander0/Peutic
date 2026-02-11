import React, { useRef, useEffect } from 'react';
import { GardenState } from '../../types';

interface GardenCanvasProps {
    garden: GardenState;
    width: number;
    height: number;
    interactionType?: 'clip' | 'water' | null;
}

const GardenCanvas: React.FC<GardenCanvasProps> = ({ garden, width, height, interactionType }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef<number>(0);

    // --- ASIAN BONSAI RENDERER ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let time = 0;
        let petals: { x: number, y: number, vx: number, vy: number, size: number, angle: number }[] = [];

        // Init falling petals
        for (let i = 0; i < 20; i++) {
            petals.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: Math.random() * 1 + 0.5,
                size: Math.random() * 3 + 2,
                angle: Math.random() * Math.PI
            });
        }

        const drawBranch = (startX: number, startY: number, len: number, angle: number, branchWidth: number, depth: number) => {
            ctx.save();
            ctx.translate(startX, startY);
            ctx.rotate(angle + Math.sin(time + depth) * 0.02); // Subtle sway

            // Draw branch segment (Gnarled look)
            ctx.beginPath();
            ctx.moveTo(0, 0);

            // Quadratic curves for organic, twisting growth
            const cp1x = 0 + Math.sin(depth * 1.5) * 5;
            const cp1y = -len * 0.5;
            ctx.quadraticCurveTo(cp1x, cp1y, 0, -len);

            ctx.lineWidth = branchWidth;
            ctx.lineCap = 'round';
            // Darker, aged wood color
            ctx.strokeStyle = `hsl(25, ${30 + depth * 5}%, ${20 + depth * 2}%)`;
            ctx.stroke();

            // Texture (simple lines)
            if (branchWidth > 5) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -len);
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.stroke();
            }

            ctx.translate(0, -len);

            // Foliage / Blossoms at ends
            if (len < 10 || depth > garden.level + 3) {
                const bloomSize = 5 + Math.sin(time * 2 + depth) * 2;
                ctx.beginPath();
                ctx.arc(0, 0, bloomSize, 0, Math.PI * 2);

                // Cherry Blossom Pink or Lush Green depending on "Season" (Level/Logic)
                // For now, let's go full Cherry Blossom (Sakura)
                const isSakura = true;
                ctx.fillStyle = isSakura
                    ? `rgba(255, 183, 178, ${0.7 + Math.random() * 0.3})` // Pink
                    : `rgba(76, 175, 80, ${0.7 + Math.random() * 0.3})`; // Green

                if (garden.waterLevel < 30) ctx.fillStyle = '#8d6e63'; // Dead leaves

                ctx.fill();

                // Glow
                ctx.shadowColor = ctx.fillStyle;
                ctx.shadowBlur = 10;
            } else {
                // Recursive Draw
                // Two branches, wider angles for spread
                if (depth < 10) {
                    drawBranch(0, 0, len * 0.8, -0.3 + Math.random() * 0.1, branchWidth * 0.7, depth + 1);
                    drawBranch(0, 0, len * 0.8, 0.3 + Math.random() * 0.1, branchWidth * 0.7, depth + 1);
                }
            }

            ctx.restore();
        };

        const render = () => {
            frameRef.current++;
            time += 0.01;

            // Background (Rice Paper / Washi feel)
            ctx.fillStyle = '#fdfbf7';
            ctx.fillRect(0, 0, width, height);

            // Sun (Red Circle)
            ctx.beginPath();
            ctx.arc(width * 0.7, height * 0.3, 60, 0, Math.PI * 2);
            ctx.fillStyle = '#ef5350';
            ctx.globalAlpha = 0.8;
            ctx.fill();
            ctx.globalAlpha = 1.0;

            // Ground / Moss
            ctx.beginPath();
            ctx.ellipse(width / 2, height - 50, 150, 40, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#558b2f'; // Moss Green
            ctx.fill();

            // Pot (Ceramic Blue/White)
            const potY = height - 50;
            const potW = 120;
            ctx.beginPath();
            ctx.moveTo(width / 2 - potW / 2, potY);
            ctx.lineTo(width / 2 + potW / 2, potY);
            ctx.lineTo(width / 2 + potW / 2 - 10, potY + 40);
            ctx.lineTo(width / 2 - potW / 2 + 10, potY + 40);
            ctx.closePath();
            ctx.fillStyle = '#1a237e';
            ctx.fill();

            // Base Trunk
            drawBranch(width / 2, potY, 60, 0, 15 + garden.streakCurrent * 0.5, 0);

            // Falling Petals
            petals.forEach(p => {
                p.y += p.vy;
                p.x += Math.sin(time + p.y * 0.01) + p.vx;
                if (p.y > height) p.y = -10;
                if (p.x > width) p.x = 0;
                if (p.x < 0) p.x = width;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle + time);
                ctx.fillStyle = '#ffcdd2';
                ctx.beginPath();
                ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            requestAnimationFrame(render);
        };

        const aniId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(aniId);
    }, [garden, width, height]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full h-full object-contain rounded-xl drop-shadow-2xl"
        />
    );
};

export default GardenCanvas;
