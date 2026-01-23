import React, { useEffect, useRef } from 'react';
import { GardenState } from '../../types';

interface GardenCanvasProps {
    garden: GardenState;
    width?: number;
    height?: number;
}

interface Petal {
    x: number;
    y: number;
    rotation: number;
    speedX: number;
    speedY: number;
    size: number;
    opacity: number;
}

const GardenCanvas: React.FC<GardenCanvasProps> = ({ garden, width = 300, height = 300 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef(0);
    const animationRef = useRef<number>();
    const petalsRef = useRef<Petal[]>([]);

    // Initialize petals once
    useEffect(() => {
        petalsRef.current = Array.from({ length: 20 }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            rotation: Math.random() * Math.PI * 2,
            speedX: 0.1 + Math.random() * 0.4,
            speedY: 0.2 + Math.random() * 0.5,
            size: 2 + Math.random() * 4,
            opacity: 0.2 + Math.random() * 0.5
        }));
    }, [width, height]);

    useEffect(() => {
        const render = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            const frame = frameRef.current;

            // Clear with transparency to allow CSS background
            ctx.clearRect(0, 0, width, height);

            const centerX = width / 2;
            const groundY = height - 40;

            // DRAW GROUND MOUND
            const moundGrad = ctx.createRadialGradient(centerX, height, 10, centerX, height, width * 0.4);
            moundGrad.addColorStop(0, '#3d2b1f');
            moundGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = moundGrad;
            ctx.beginPath();
            ctx.ellipse(centerX, height - 10, width * 0.35, 20, 0, 0, Math.PI * 2);
            ctx.fill();

            // GRASS BLADES
            ctx.lineWidth = 2;
            for (let i = 0; i < 12; i++) {
                const gx = centerX + (i - 5.5) * 18;
                const sway = Math.sin(frame * 0.04 + i) * 4;
                const grassGrad = ctx.createLinearGradient(gx, height, gx, height - 30);
                grassGrad.addColorStop(0, '#1b5e20');
                grassGrad.addColorStop(1, '#66bb6a');
                ctx.strokeStyle = grassGrad;
                ctx.beginPath();
                ctx.moveTo(gx, height - 10);
                ctx.quadraticCurveTo(gx + (i%2===0?5:-5) + sway, height - 25, gx + sway, height - 40);
                ctx.stroke();
            }

            // PLANT ATMOSPHERE
            const glowSize = 60 + garden.level * 20;
            const auraGrad = ctx.createRadialGradient(centerX, groundY - 50, 0, centerX, groundY - 50, glowSize);
            auraGrad.addColorStop(0, 'rgba(100, 255, 218, 0.15)');
            auraGrad.addColorStop(1, 'rgba(100, 255, 218, 0)');
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(centerX, groundY - 50, glowSize, 0, Math.PI * 2);
            ctx.fill();

            // Procedural Drawing based on Level
            drawPlant(ctx, centerX, groundY, garden.level, garden.currentPlantType, frame);

            // Draw Spirit Wisp
            drawSpirit(ctx, centerX + 40, groundY - (garden.level * 25), frame, garden.level);

            // Draw drifting petals / spores
            drawPetals(ctx, frame);

            frameRef.current++;
            animationRef.current = requestAnimationFrame(render);
        };

        render();
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [garden, width, height]);

    const drawSpirit = (ctx: CanvasRenderingContext2D, anchorX: number, anchorY: number, frame: number, level: number) => {
        const floatY = Math.sin(frame * 0.05) * 10;
        const floatX = Math.cos(frame * 0.03) * 12;
        const x = anchorX + floatX;
        const y = anchorY + floatY;
        const spiritSize = 10 + level * 2;

        ctx.save();
        // Glow
        const grad = ctx.createRadialGradient(x, y, 0, x, y, spiritSize * 2);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        grad.addColorStop(0.5, 'rgba(100, 255, 218, 0.3)');
        grad.addColorStop(1, 'rgba(100, 255, 218, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, spiritSize * 2, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#64ffda';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    const drawPlant = (ctx: CanvasRenderingContext2D, x: number, y: number, level: number, type: string, frame: number) => {
        if (level === 1) { // Seed/Sprout
            ctx.fillStyle = '#8d6e63';
            ctx.beginPath();
            ctx.ellipse(x, y + 5, 8, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Tiny sprout
            ctx.strokeStyle = '#69f0ae';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, y + 2);
            ctx.quadraticCurveTo(x + 5, y - 5, x + Math.sin(frame*0.1)*3, y - 12);
            ctx.stroke();
            return;
        }

        // Stem
        const stemHeight = level * 35 + 20;
        const sway = Math.sin(frame * 0.02) * 8;
        const endX = x + sway * 0.5;
        const endY = y - stemHeight;

        const stemGrad = ctx.createLinearGradient(x, y, endX, endY);
        stemGrad.addColorStop(0, '#2e7d32');
        stemGrad.addColorStop(1, '#a5d6a7');
        ctx.strokeStyle = stemGrad;
        ctx.lineWidth = 6 + level;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + sway, y - stemHeight/2, endX, endY);
        ctx.stroke();

        // Leaves
        if (level >= 2) {
            drawLeaf(ctx, x + sway*0.3, y - stemHeight*0.3, -1, frame, 16);
            drawLeaf(ctx, x + sway*0.3, y - stemHeight*0.3, 1, frame, 16);
        }
        if (level >= 3) {
            drawLeaf(ctx, x + sway*0.4, y - stemHeight*0.6, -1, frame, 20);
            drawLeaf(ctx, x + sway*0.4, y - stemHeight*0.6, 1, frame, 20);
        }

        // Bloom
        if (level === 5) {
            drawFlower(ctx, endX, endY, type, frame);
        } else if (level === 4) {
            drawBud(ctx, endX, endY, type);
        }
    };

    const drawLeaf = (ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, frame: number, size: number) => {
        const sway = Math.sin(frame * 0.03 + dir) * 3;
        ctx.fillStyle = '#66bb6a';
        ctx.beginPath();
        ctx.ellipse(x + (size * 0.8 * dir) + sway, y, size, size * 0.4, dir * 0.4, 0, Math.PI * 2);
        ctx.fill();
        // Vein
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (size*1.2*dir) + sway, y);
        ctx.stroke();
    };

    const drawBud = (ctx: CanvasRenderingContext2D, x: number, y: number, type: string) => {
        ctx.fillStyle = getFlowerColor(type);
        ctx.beginPath();
        ctx.ellipse(x, y, 12, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        // Highlights
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.ellipse(x - 3, y - 5, 4, 8, 0, 0, Math.PI * 2);
        ctx.fill();
    };

    const drawFlower = (ctx: CanvasRenderingContext2D, x: number, y: number, type: string, frame: number) => {
        const color = getFlowerColor(type);
        const petals = 10;
        const rad = 25;
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        
        for (let i = 0; i < petals; i++) {
            const angle = (i / petals) * Math.PI * 2 + Math.sin(frame * 0.02) * 0.1;
            const px = x + Math.cos(angle) * 10;
            const py = y + Math.sin(angle) * 10;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(px, py, rad, 12, angle, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Center
        ctx.fillStyle = '#ffff8d';
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    };

    const getFlowerColor = (type: string): string => {
        switch (type) {
            case 'Rose': return '#f50057';
            case 'Sunflower': return '#ffeb3b';
            case 'Lotus': return '#e040fb';
            case 'Fern': return '#00e676';
            default: return '#e040fb';
        }
    };

    const drawPetals = (ctx: CanvasRenderingContext2D, frame: number) => {
        petalsRef.current.forEach(p => {
            p.x += p.speedX + Math.sin(frame * 0.01) * 0.2;
            p.y += p.speedY;
            p.rotation += 0.02;

            if (p.y > height + 10) { p.y = -10; p.x = Math.random() * width; }
            if (p.x > width + 10) p.x = -10;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    };

    return <canvas ref={canvasRef} width={width} height={height} className="w-full h-full animate-in fade-in zoom-in duration-1000" />;
};

export default GardenCanvas;