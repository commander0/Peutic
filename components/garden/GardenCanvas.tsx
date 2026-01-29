
import React, { useRef, useEffect } from 'react';
import { GardenState } from '../../types';

interface GardenCanvasProps {
    garden: GardenState;
    width: number;
    height: number;
}

const GardenCanvas: React.FC<GardenCanvasProps> = ({ garden, width, height }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef<number>(0);
    const timeRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Animation Loop
        const render = () => {
            timeRef.current += 0.02;
            ctx.clearRect(0, 0, width, height);

            // Center of garden
            const cx = width / 2;
            const cy = height * 0.8;

            // Draw based on level
            drawPlant(ctx, cx, cy, garden.level, timeRef.current);

            // Draw Spirit Wisp (Focus)
            const wispX = cx + Math.sin(timeRef.current * 0.5) * 30;
            const wispY = cy - 100 + Math.cos(timeRef.current * 0.3) * 20 - (garden.level * 20);
            drawWisp(ctx, wispX, wispY, timeRef.current);

            frameRef.current = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(frameRef.current);
    }, [garden, width, height]);

    const drawPlant = (ctx: CanvasRenderingContext2D, x: number, y: number, level: number, time: number) => {
        ctx.save();
        ctx.translate(x, y);

        // Sway
        const sway = Math.sin(time) * 0.05;
        ctx.rotate(sway);

        // Stem
        ctx.beginPath();
        ctx.moveTo(0, 0);

        const height = 40 + (level * 25);
        // Quadratic curve for stem
        ctx.quadraticCurveTo(Math.sin(time * 0.5) * 10, -height / 2, 0, -height);

        ctx.strokeStyle = '#22c55e'; // Green 500
        ctx.lineWidth = 4 + (level);
        ctx.lineCap = 'round';
        ctx.stroke();

        // Leaves
        if (level >= 2) {
            drawLeaf(ctx, 0, -height * 0.3, 20, time, -0.5);
            drawLeaf(ctx, 0, -height * 0.5, 25, time, 0.5);
        }
        if (level >= 3) {
            drawLeaf(ctx, 0, -height * 0.7, 15, time, -0.8);
            drawLeaf(ctx, 0, -height * 0.8, 15, time, 0.8);
        }

        // Flower / Bud
        ctx.translate(0, -height);
        if (level >= 1) {
            if (level === 1) {
                // Sprout
                ctx.fillStyle = '#86efac';
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI * 2);
                ctx.fill();
            } else if (level < 4) {
                // Bud
                ctx.fillStyle = '#f472b6'; // Pink 400
                ctx.beginPath();
                ctx.ellipse(0, 0, 8, 12, 0, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Bloom
                drawFlower(ctx, level >= 5, time); // Level 5 is radiant
            }
        }

        ctx.restore();
    };

    const drawLeaf = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, time: number, angleOffset: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angleOffset + Math.sin(time + x) * 0.1);
        ctx.fillStyle = '#4ade80'; // Green 400
        ctx.beginPath();
        ctx.ellipse(10, 0, size, size / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    const drawFlower = (ctx: CanvasRenderingContext2D, radiant: boolean, time: number) => {
        const petals = 8;
        ctx.fillStyle = radiant ? '#f43f5e' : '#fb7185'; // Rose 500 / 400

        for (let i = 0; i < petals; i++) {
            ctx.save();
            const angle = (Math.PI * 2 * i) / petals;
            ctx.rotate(angle + (radiant ? time * 0.1 : 0));
            ctx.beginPath();
            ctx.ellipse(0, -15, 8, 15, 0, 0, Math.PI * 2);
            ctx.fill();

            // Inner detail
            ctx.strokeStyle = '#fff1f2';
            ctx.lineWidth = 1;
            ctx.moveTo(0, -5);
            ctx.lineTo(0, -20);
            ctx.stroke();

            ctx.restore();
        }

        // Center
        ctx.fillStyle = '#facc15'; // Yellow
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        if (radiant) {
            // Glow
            ctx.shadowColor = '#f43f5e';
            ctx.shadowBlur = 20 + Math.sin(time * 3) * 10;
        }
    };

    const drawWisp = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
        ctx.save();
        ctx.translate(x, y);
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
        gradient.addColorStop(0, 'rgba(250, 204, 21, 0.8)');
        gradient.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    return <canvas ref={canvasRef} width={width} height={height} className="pointer-events-none" />;
};

export default GardenCanvas;
