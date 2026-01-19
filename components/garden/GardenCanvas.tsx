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
}

const GardenCanvas: React.FC<GardenCanvasProps> = ({ garden, width = 300, height = 300 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef(0);
    const animationRef = useRef<number>();
    const petalsRef = useRef<Petal[]>([]);

    // Initialize petals once
    useEffect(() => {
        petalsRef.current = Array.from({ length: 8 }, () => ({
            x: Math.random() * width,
            y: Math.random() * height * 0.5,
            rotation: Math.random() * Math.PI * 2,
            speedX: 0.2 + Math.random() * 0.3,
            speedY: 0.3 + Math.random() * 0.4,
            size: 4 + Math.random() * 3
        }));
    }, [width, height]);

    useEffect(() => {
        const render = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            const frame = frameRef.current;

            // Clear with a soft gradient sky
            const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
            skyGradient.addColorStop(0, 'rgba(230, 245, 255, 0.8)');
            skyGradient.addColorStop(0.5, 'rgba(220, 240, 250, 0.6)');
            skyGradient.addColorStop(1, 'rgba(200, 230, 210, 0.5)');
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, width, height);

            // Soft volumetric light
            const lightGradient = ctx.createRadialGradient(width * 0.7, height * 0.2, 0, width * 0.7, height * 0.2, height * 0.6);
            lightGradient.addColorStop(0, 'rgba(255, 253, 230, 0.5)');
            lightGradient.addColorStop(1, 'rgba(255, 253, 230, 0)');
            ctx.fillStyle = lightGradient;
            ctx.fillRect(0, 0, width, height);

            // Draw background Torii Gate
            drawToriiGate(ctx, width, height, garden.level);

            // Draw Soil Mound
            const soilGradient = ctx.createRadialGradient(width / 2, height - 10, 10, width / 2, height, width / 2.5);
            soilGradient.addColorStop(0, '#6d4c41');
            soilGradient.addColorStop(1, '#3e2723');
            ctx.fillStyle = soilGradient;
            ctx.beginPath();
            ctx.ellipse(width / 2, height - 15, width / 2.8, 25, 0, 0, Math.PI * 2);
            ctx.fill();

            // Grass tufts
            ctx.strokeStyle = '#66bb6a';
            ctx.lineWidth = 2;
            for (let i = 0; i < 6; i++) {
                const gx = width / 2 + (i - 2.5) * 25;
                ctx.beginPath();
                ctx.moveTo(gx, height - 35);
                ctx.quadraticCurveTo(gx + (i % 2 === 0 ? 5 : -5), height - 50 - Math.sin(frame * 0.05 + i) * 3, gx, height - 60);
                ctx.stroke();
            }

            const centerX = width / 2;
            const groundY = height - 40;

            // Procedural Drawing based on Level
            drawPlant(ctx, centerX, groundY, garden.level, garden.currentPlantType, frame);

            // Draw Spirit Wisp
            drawSpirit(ctx, centerX + 40, groundY - (garden.level * 18), frame, garden.level);

            // Draw drifting petals
            drawPetals(ctx, frame);

            frameRef.current++;
            animationRef.current = requestAnimationFrame(render);
        };

        render();
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [garden, width, height]);

    const drawToriiGate = (ctx: CanvasRenderingContext2D, w: number, h: number, level: number) => {
        if (level < 3) return; // Only show gate at higher levels
        const opacity = Math.min(0.4, (level - 2) * 0.1);
        ctx.globalAlpha = opacity;

        const gateColor = '#d32f2f';
        const gateX = w * 0.5;
        const gateY = h * 0.25;
        const gateWidth = w * 0.5;
        const gateHeight = h * 0.35;

        ctx.fillStyle = gateColor;

        // Pillars
        ctx.fillRect(gateX - gateWidth / 2, gateY, 8, gateHeight);
        ctx.fillRect(gateX + gateWidth / 2 - 8, gateY, 8, gateHeight);

        // Top beam
        ctx.fillRect(gateX - gateWidth / 2 - 10, gateY, gateWidth + 20, 12);
        // Lower beam
        ctx.fillRect(gateX - gateWidth / 2, gateY + gateHeight * 0.3, gateWidth, 8);

        ctx.globalAlpha = 1.0;
    };

    const drawSpirit = (ctx: CanvasRenderingContext2D, anchorX: number, anchorY: number, frame: number, level: number) => {
        const floatY = Math.sin(frame * 0.05) * 6;
        const floatX = Math.cos(frame * 0.03) * 8;
        const x = anchorX + floatX;
        const y = anchorY + floatY;
        const spiritSize = 12 + level * 2;

        // Outer glow
        const gradient = ctx.createRadialGradient(x, y, 2, x, y, spiritSize + 10);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        gradient.addColorStop(0.4, 'rgba(180, 255, 230, 0.5)');
        gradient.addColorStop(1, 'rgba(100, 255, 218, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, spiritSize + 10, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Sparkle trail
        for (let i = 0; i < 3; i++) {
            const trailX = x - floatX * (0.5 + i * 0.3);
            const trailY = y - floatY * (0.5 + i * 0.3) + i * 5;
            ctx.fillStyle = `rgba(180, 255, 230, ${0.6 - i * 0.2})`;
            ctx.beginPath();
            ctx.arc(trailX, trailY, 2 - i * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    const drawPlant = (ctx: CanvasRenderingContext2D, x: number, y: number, level: number, type: string, frame: number) => {
        if (level === 1) { // Seed
            ctx.fillStyle = '#8d6e63';
            ctx.beginPath();
            ctx.ellipse(x, y + 5, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            // Little sprout line
            ctx.strokeStyle = '#a5d6a7';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y + 3);
            ctx.lineTo(x, y - 5 + Math.sin(frame * 0.1) * 2);
            ctx.stroke();
            return;
        }

        // Stem (Sprout to Bloom)
        const stemHeight = level * 25 + 20;
        const sway = Math.sin(frame * 0.02) * 3;

        // Stem gradient
        const stemGradient = ctx.createLinearGradient(x, y, x, y - stemHeight);
        stemGradient.addColorStop(0, '#388e3c');
        stemGradient.addColorStop(1, '#81c784');
        ctx.strokeStyle = stemGradient;
        ctx.lineWidth = 3 + level;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + sway, y - stemHeight / 2, x + sway * 0.5, y - stemHeight);
        ctx.stroke();

        const topX = x + sway * 0.5;
        const topY = y - stemHeight;

        if (level >= 2) {
            drawLeaf(ctx, x + sway * 0.3, y - stemHeight * 0.4, -1, frame);
            drawLeaf(ctx, x + sway * 0.3, y - stemHeight * 0.4, 1, frame);
        }

        if (level >= 3) {
            drawLeaf(ctx, x + sway * 0.4, y - stemHeight * 0.7, -1, frame);
            drawLeaf(ctx, x + sway * 0.4, y - stemHeight * 0.7, 1, frame);
        }

        if (level >= 4) {
            if (level === 5) {
                drawFlower(ctx, topX, topY, type, frame);
            } else {
                drawBud(ctx, topX, topY, type);
            }
        }
    };

    const drawLeaf = (ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, frame: number) => {
        const sway = Math.sin(frame * 0.03 + dir) * 2;
        const leafGradient = ctx.createLinearGradient(x, y, x + 15 * dir, y);
        leafGradient.addColorStop(0, '#81c784');
        leafGradient.addColorStop(1, '#4caf50');
        ctx.fillStyle = leafGradient;
        ctx.beginPath();
        ctx.ellipse(x + (12 * dir) + sway, y, 12, 6, dir * 0.4, 0, Math.PI * 2);
        ctx.fill();
    };

    const drawBud = (ctx: CanvasRenderingContext2D, x: number, y: number, type: string) => {
        ctx.fillStyle = getFlowerColor(type);
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        // highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(x - 3, y - 3, 4, 0, Math.PI * 2);
        ctx.fill();
    };

    const drawFlower = (ctx: CanvasRenderingContext2D, x: number, y: number, type: string, frame: number) => {
        const color = getFlowerColor(type);
        const petalCount = 8;

        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2 + Math.sin(frame * 0.02) * 0.05;
            const px = x + Math.cos(angle) * 12;
            const py = y + Math.sin(angle) * 12;

            const petalGradient = ctx.createRadialGradient(px, py, 0, px, py, 18);
            petalGradient.addColorStop(0, color);
            petalGradient.addColorStop(1, adjustColorBrightness(color, -30));
            ctx.fillStyle = petalGradient;
            ctx.beginPath();
            ctx.ellipse(px, py, 18, 10, angle, 0, Math.PI * 2);
            ctx.fill();
        }

        // Center
        const centerGradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
        centerGradient.addColorStop(0, '#fff59d');
        centerGradient.addColorStop(1, '#ffeb3b');
        ctx.fillStyle = centerGradient;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
    };

    const getFlowerColor = (type: string): string => {
        switch (type) {
            case 'Rose': return '#e91e63';
            case 'Sunflower': return '#ffc107';
            case 'Lotus': return '#f48fb1';
            case 'Fern': return '#2e7d32';
            default: return '#ab47bc';
        }
    };

    const adjustColorBrightness = (hex: string, amount: number): string => {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        r = Math.max(0, Math.min(255, r + amount));
        g = Math.max(0, Math.min(255, g + amount));
        b = Math.max(0, Math.min(255, b + amount));
        return `rgb(${r},${g},${b})`;
    };

    const drawPetals = (ctx: CanvasRenderingContext2D, frame: number) => {
        petalsRef.current.forEach(petal => {
            petal.x += petal.speedX + Math.sin(frame * 0.01 + petal.rotation) * 0.5;
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
            ctx.fillStyle = `rgba(255, 182, 193, ${0.7 + Math.sin(frame * 0.05) * 0.2})`;
            ctx.beginPath();
            ctx.ellipse(0, 0, petal.size, petal.size / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    };

    return <canvas ref={canvasRef} width={width} height={height} className="w-full h-full animate-in fade-in zoom-in duration-1000" />;
};

export default GardenCanvas;
