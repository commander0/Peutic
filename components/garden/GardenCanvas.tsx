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
        petalsRef.current = Array.from({ length: 25 }, () => ({
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

            // Clear - Transparent so it blends with container background
            ctx.clearRect(0, 0, width, height);

            const centerX = width / 2;
            const groundY = height - 40;

            // Procedural Ground Grass
            ctx.lineWidth = 2;
            for (let i = 0; i < 12; i++) {
                const gx = width / 2 + (i - 5.5) * 20;
                const sway = Math.sin(frame * 0.05 + i) * 3;

                const grassGradient = ctx.createLinearGradient(gx, height - 20, gx, height - 60);
                grassGradient.addColorStop(0, '#2e7d32');
                grassGradient.addColorStop(1, '#66bb6a');
                ctx.strokeStyle = grassGradient;

                ctx.beginPath();
                ctx.moveTo(gx, height - 20);
                ctx.quadraticCurveTo(gx + (i % 2 === 0 ? 5 : -5) + sway, height - 45, gx + sway, height - 60);
                ctx.stroke();
            }

            // Aura Base
            const plantGlow = ctx.createRadialGradient(centerX, groundY - 50, 10, centerX, groundY - 50, 120);
            plantGlow.addColorStop(0, 'rgba(105, 240, 174, 0.4)');
            plantGlow.addColorStop(1, 'rgba(105, 240, 174, 0)');
            ctx.fillStyle = plantGlow;
            ctx.beginPath();
            ctx.arc(centerX, groundY - 50, 120, 0, Math.PI * 2);
            ctx.fill();

            // Plant Logic
            drawPlant(ctx, centerX, groundY, garden.level, garden.currentPlantType, frame);

            // Spirit Wisp (Floating light)
            drawSpirit(ctx, centerX + 40, groundY - (garden.level * 25), frame, garden.level);

            // Floating Petals/Spores
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
        const floatY = Math.sin(frame * 0.05) * 8;
        const floatX = Math.cos(frame * 0.03) * 10;
        const x = anchorX + floatX;
        const y = anchorY + floatY;
        const spiritSize = 10 + level * 2;

        // Outer glow
        const gradient = ctx.createRadialGradient(x, y, 2, x, y, spiritSize + 20);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.4, 'rgba(100, 255, 218, 0.6)');
        gradient.addColorStop(1, 'rgba(100, 255, 218, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, spiritSize + 20, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#64ffda';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    };

    const drawPlant = (ctx: CanvasRenderingContext2D, x: number, y: number, level: number, type: string, frame: number) => {
        const swayBase = Math.sin(frame * 0.02) * 2;

        if (level === 1) { // Seed
            ctx.fillStyle = '#795548';
            ctx.beginPath();
            ctx.ellipse(x, y + 5, 8, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Sprout tip
            ctx.strokeStyle = '#69f0ae';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x, y + 5);
            ctx.quadraticCurveTo(x + swayBase, y - 5, x + swayBase * 2, y - 10);
            ctx.stroke();
            return;
        }

        // Main Stem Construction
        const stemHeight = level * 35 + 20;
        const cp1x = x + swayBase * 5;
        const cp1y = y - stemHeight / 2;
        const endX = x + swayBase * 2;
        const endY = y - stemHeight;

        const stemGradient = ctx.createLinearGradient(x, y, endX, endY);
        stemGradient.addColorStop(0, '#1b5e20');
        stemGradient.addColorStop(0.5, '#4caf50');
        stemGradient.addColorStop(1, '#a5d6a7');
        
        ctx.strokeStyle = stemGradient;
        ctx.lineWidth = 4 + level * 1.5;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(cp1x, cp1y, endX, endY);
        ctx.stroke();

        // Branches / Leaves
        if (level >= 2) {
            drawLeaf(ctx, x + swayBase * 2, y - stemHeight * 0.3, -1, frame, 12);
            drawLeaf(ctx, x + swayBase * 2, y - stemHeight * 0.3, 1, frame, 12);
        }
        if (level >= 3) {
            drawLeaf(ctx, x + swayBase * 3, y - stemHeight * 0.6, -1, frame, 15);
            drawLeaf(ctx, x + swayBase * 3, y - stemHeight * 0.6, 1, frame, 15);
        }
        if (level >= 4) {
            drawLeaf(ctx, endX, endY, -1, frame, 10); // Small top leaves
            drawLeaf(ctx, endX, endY, 1, frame, 10);
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
        const tipX = x + (size * 1.5 * dir) + sway;
        const tipY = y - size * 0.5;

        const grad = ctx.createLinearGradient(x, y, tipX, tipY);
        grad.addColorStop(0, '#388e3c');
        grad.addColorStop(1, '#69f0ae');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + (size * dir), y - size, tipX, tipY);
        ctx.quadraticCurveTo(x + (size * dir), y + size * 0.5, x, y);
        ctx.fill();
    };

    const drawBud = (ctx: CanvasRenderingContext2D, x: number, y: number, type: string) => {
        ctx.fillStyle = getFlowerColor(type);
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.ellipse(x, y, 10, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    };

    const drawFlower = (ctx: CanvasRenderingContext2D, x: number, y: number, type: string, frame: number) => {
        const color = getFlowerColor(type);
        const petalCount = 12;
        const radius = 25;

        ctx.shadowColor = color;
        ctx.shadowBlur = 25;

        // Layered Petals
        for (let j = 0; j < 2; j++) {
            const scale = j === 0 ? 1 : 0.6;
            for (let i = 0; i < petalCount; i++) {
                const angle = (i / petalCount) * Math.PI * 2 + Math.sin(frame * 0.01) * 0.2 + (j * 0.5);
                const px = x + Math.cos(angle) * (radius * scale * 0.5);
                const py = y + Math.sin(angle) * (radius * scale * 0.5);

                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(angle);
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.ellipse(10 * scale, 0, 15 * scale, 8 * scale, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        ctx.shadowBlur = 0;

        // Glowing Core
        ctx.fillStyle = '#fff59d';
        ctx.shadowColor = '#ffee58';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    };

    const getFlowerColor = (type: string): string => {
        switch (type) {
            case 'Rose': return '#f50057';
            case 'Sunflower': return '#ffea00';
            case 'Lotus': return '#e040fb';
            case 'Fern': return '#00e676';
            default: return '#d500f9';
        }
    };

    const drawPetals = (ctx: CanvasRenderingContext2D, frame: number) => {
        petalsRef.current.forEach(petal => {
            petal.x += petal.speedX;
            petal.y += petal.speedY;
            petal.rotation += 0.02;

            if (petal.y > height + 10) {
                petal.y = -10;
                petal.x = Math.random() * width;
            }
            if (petal.x > width + 10) petal.x = -10;

            ctx.save();
            ctx.translate(petal.x, petal.y);
            ctx.rotate(petal.rotation);
            ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + Math.sin(frame * 0.1) * 0.2})`;
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.arc(0, 0, petal.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    };

    return <canvas ref={canvasRef} width={width} height={height} className="w-full h-full animate-in fade-in zoom-in duration-1000" />;
};

export default GardenCanvas;