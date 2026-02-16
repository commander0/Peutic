import React, { useRef, useEffect } from 'react';
import { GardenState } from '../../types';

interface GardenCanvasProps {
    garden: GardenState;
    width: number;
    height: number;
    interactionType?: 'clip' | 'water' | 'breath' | 'sing' | null;
    streak?: number; // Added for growth density
}

const GardenCanvas: React.FC<GardenCanvasProps> = ({ garden, width, height, interactionType, streak = 0 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef<number>(0);

    // --- ETHEREAL BONSAI RENDERER ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let time = 0;

        // Petal System
        let petals: { x: number, y: number, vx: number, vy: number, size: number, angle: number, opacity: number }[] = [];

        // Initialize some petals
        for (let i = 0; i < 30; i++) {
            petals.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: Math.random() * 0.8 + 0.2,
                size: Math.random() * 3 + 1,
                angle: Math.random() * Math.PI,
                opacity: Math.random() * 0.5 + 0.3
            });
        }

        const drawBranch = (startX: number, startY: number, len: number, angle: number, branchWidth: number, depth: number) => {
            ctx.save();
            ctx.translate(startX, startY);
            // Organic Sway: more sway at tips (high depth)
            const sway = Math.sin(time * 0.5 + depth) * 0.015 * (depth * 0.5);
            ctx.rotate(angle + sway);

            // Tapering Branch
            ctx.beginPath();
            ctx.moveTo(0, 0);

            // Curved Branch Logic
            const cp1x = Math.sin(depth * 1.5 + time * 0.2) * (5 + depth);
            const cp1y = -len * 0.5;
            ctx.quadraticCurveTo(cp1x, cp1y, 0, -len);

            ctx.lineWidth = branchWidth;
            ctx.lineCap = 'round';

            // Gradient for wood (Dark to Light) - Mystic Wood
            const gradient = ctx.createLinearGradient(0, 0, 0, -len);
            gradient.addColorStop(0, `hsl(25, ${30 - depth * 2}%, ${10 + depth}%)`); // Darker base
            gradient.addColorStop(1, `hsl(25, ${25 - depth * 2}%, ${15 + depth}%)`);
            ctx.strokeStyle = gradient;
            ctx.stroke();

            ctx.translate(0, -len);

            // Foliage / Blossoms
            const maxDepth = Math.max(5, garden.level + 6); // More levels = more depth

            if (len < 12 || depth > maxDepth) {
                // Bloom Logic
                const bloomSize = (4 + Math.sin(time * 1.5 + depth) * 1.5) * (garden.waterLevel > 20 ? 1 : 0.7);

                ctx.beginPath();
                ctx.arc(0, 0, bloomSize, 0, Math.PI * 2);

                // Dynamic Color based on Health/Water
                let r = 255, g = 180, b = 180; // Pink default

                if (garden.currentPlantType === 'Fern') {
                    r = 100; g = 200; b = 150; // Cyan/Green
                } else if (garden.currentPlantType === 'Sunflower') {
                    r = 255; g = 220; b = 100; // Gold
                } else if (garden.currentPlantType === 'Lotus') {
                    r = 230; g = 180; b = 255; // Purple
                }

                // Adjust for "Dead" state
                if (garden.waterLevel < 10) {
                    r *= 0.6; g *= 0.6; b *= 0.5;
                }

                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.6 + Math.random() * 0.2})`;
                ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
                ctx.shadowBlur = 15; // Bloom Glow
                ctx.fill();
                ctx.shadowBlur = 0; // Reset
            } else {
                // Recursive Growth
                if (depth < 12) {
                    const splitAngle = 0.4 - (depth * 0.01);
                    drawBranch(0, 0, len * 0.75, -splitAngle + Math.sin(time + depth) * 0.05, branchWidth * 0.75, depth + 1);
                    drawBranch(0, 0, len * 0.75, splitAngle + Math.cos(time + depth) * 0.05, branchWidth * 0.75, depth + 1);

                    // Occasional 3rd branch for fullness
                    if (depth > 2 && Math.random() > 0.6) {
                        drawBranch(0, 0, len * 0.6, 0 + Math.sin(time * 1.2) * 0.1, branchWidth * 0.6, depth + 1);
                    }
                }
            }

            ctx.restore();
        };

        const render = () => {
            frameRef.current++;
            time += 0.015;

            // Clear
            ctx.clearRect(0, 0, width, height);

            // Ground / Moss Island
            ctx.save();
            ctx.translate(width / 2, height - 60);
            ctx.beginPath();
            ctx.ellipse(0, 0, 160, 30, 0, 0, Math.PI * 2);
            const mossGrad = ctx.createRadialGradient(0, -20, 10, 0, 0, 160);
            mossGrad.addColorStop(0, '#4ade80'); // Bright Green center
            mossGrad.addColorStop(1, '#14532d'); // Dark Green edge
            ctx.fillStyle = mossGrad;
            ctx.fill();
            ctx.shadowColor = 'rgba(74, 222, 128, 0.3)';
            ctx.shadowBlur = 30;
            ctx.restore();

            // Draw Tree
            drawBranch(width / 2, height - 60, 70, 0, 12 + garden.streakCurrent * 0.2, 0);

            // Falling Petals Update & Draw
            petals.forEach(p => {
                p.y += p.vy;
                p.x += Math.sin(time + p.y * 0.02) + p.vx;
                p.angle += 0.02;

                if (p.y > height) {
                    p.y = -10;
                    p.x = Math.random() * width;
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.shadowColor = 'white';
                ctx.shadowBlur = 5;
                ctx.beginPath();
                ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // Interaction Effects
            if (interactionType === 'water') {
                ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
                for (let i = 0; i < 15; i++) {
                    ctx.fillRect(Math.random() * width, Math.random() * height, 1, Math.random() * 20 + 10);
                }
            }

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
            className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        />
    );
};

export default React.memo(GardenCanvas);
