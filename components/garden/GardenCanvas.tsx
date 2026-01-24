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
            speedX: 0.2 + Math.random() * 0.6,
            speedY: 0.3 + Math.random() * 0.7,
            size: 3 + Math.random() * 5,
            opacity: 0.4 + Math.random() * 0.6
        }));
    }, [width, height]);

    useEffect(() => {
        const render = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            const frame = frameRef.current;

            // --- HYPER REALISTIC ATMOSPHERE ---
            // Dynamic Sky based on "Time" (simulated by frame)
            // --- NATURAL ATMOSPHERE ---
            // Dynamic Sky - Daytime Blue to Sunset
            const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
            skyGradient.addColorStop(0, '#38bdf8'); // Sky Blue
            skyGradient.addColorStop(1, '#bae6fd'); // Light Blue
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, width, height);

            // Sun
            const sunX = width * 0.8;
            const sunY = height * 0.15;
            const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 40);
            sunGrad.addColorStop(0, '#fef08a');
            sunGrad.addColorStop(0.5, '#facc15');
            sunGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
            ctx.fillStyle = sunGrad;
            ctx.beginPath(); canvas ? ctx.arc(sunX, sunY, 60, 0, Math.PI * 2) : 0; ctx.fill();

            // Ground
            const groundY = height - 40;
            const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
            groundGrad.addColorStop(0, '#4ade80'); // Green
            groundGrad.addColorStop(1, '#16a34a'); // Dark Green
            ctx.fillStyle = groundGrad;
            ctx.fillRect(0, groundY, width, height - groundY);

            // Grass Blades
            ctx.strokeStyle = '#15803d';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i < width; i += 5) {
                const bladeHeight = Math.random() * 15;
                ctx.moveTo(i, groundY);
                ctx.lineTo(i + (Math.random() - 0.5) * 5, groundY - bladeHeight);
            }
            ctx.stroke();




            const centerX = width / 2;

            // FRACTAL PLANT GENERATION
            // Level determines complexity
            drawFractalPlant(ctx, centerX, groundY, -Math.PI / 2, Math.min(garden.level + 2, 8), 120, frame, garden.currentPlantType);

            // Spirit with Trail (Cyber Wisp)
            drawSpirit(ctx, centerX + 40, groundY - (garden.level * 25) - 50, frame, garden.level);

            // Foreground Petals (Depth of Field)
            drawPetals(ctx, frame);

            frameRef.current++;
            animationRef.current = requestAnimationFrame(render);
        };

        render();
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [garden, width, height]);

    // Recursive Fractal Draw
    const drawFractalPlant = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, depth: number, len: number, frame: number, type: string) => {
        if (depth === 0) {
            drawFlower(ctx, x, y, type, frame);
            return;
        }

        // Dynamic Sway
        const sway = Math.sin(frame * 0.01 + depth) * (0.02 * (10 - depth));
        const finalAngle = angle + sway;

        const x2 = x + Math.cos(finalAngle) * len;
        const y2 = y + Math.sin(finalAngle) * len;

        // Branch Style
        ctx.lineWidth = depth * 1.5;
        // Branch Style (Cyber)
        ctx.lineWidth = depth * 1.5;
        const branchGrad = ctx.createLinearGradient(x, y, x2, y2);
        branchGrad.addColorStop(0, '#5D4037'); // Brown
        branchGrad.addColorStop(1, '#8D6E63'); // Light Brown
        ctx.strokeStyle = branchGrad;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(x, y);
        // Slight curve for realism
        ctx.quadraticCurveTo(x + Math.cos(finalAngle) * len * 0.5 + sway * 20, y + Math.sin(finalAngle) * len * 0.5, x2, y2);
        ctx.stroke();

        // Leaves on branches
        if (depth < 6 && Math.random() > 0.3) {
            drawLeaf(ctx, x2, y2, depth % 2 === 0 ? 1 : -1, frame);
        }

        // Recursive Calls - split branches
        // Shrink factor 0.75
        const nextLen = len * 0.75;
        const splitAngle = 0.4; // 25 degrees approx

        drawFractalPlant(ctx, x2, y2, finalAngle - splitAngle, depth - 1, nextLen, frame, type);
        drawFractalPlant(ctx, x2, y2, finalAngle + splitAngle, depth - 1, nextLen, frame, type);
    };



    const drawSpirit = (ctx: CanvasRenderingContext2D, anchorX: number, anchorY: number, frame: number, level: number) => {
        const floatY = Math.sin(frame * 0.05) * 6;
        const floatX = Math.cos(frame * 0.03) * 8;
        const x = anchorX + floatX;
        const y = anchorY + floatY;
        const spiritSize = 12 + level * 2;

        // Outer glow
        const gradient = ctx.createRadialGradient(x, y, 2, x, y, spiritSize + 15);
        gradient.addColorStop(0, 'rgba(217, 70, 239, 0.95)'); // Pink Core
        gradient.addColorStop(0.4, 'rgba(0, 255, 128, 0.6)'); // Green Halo
        gradient.addColorStop(1, 'rgba(0, 255, 128, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, spiritSize + 15, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Sparkle trail
        for (let i = 0; i < 4; i++) {
            const trailX = x - floatX * (0.5 + i * 0.3);
            const trailY = y - floatY * (0.5 + i * 0.3) + i * 5;
            ctx.fillStyle = `rgba(100, 255, 218, ${0.7 - i * 0.2})`;
            ctx.beginPath();
            ctx.arc(trailX, trailY, 3 - i * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
    };



    const drawLeaf = (ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, frame: number) => {
        const sway = Math.sin(frame * 0.03 + dir) * 3;
        const leafGradient = ctx.createLinearGradient(x, y, x + 15 * dir, y);
        leafGradient.addColorStop(0, '#66bb6a');
        leafGradient.addColorStop(1, '#00e676');
        ctx.fillStyle = leafGradient;
        ctx.beginPath();
        ctx.ellipse(x + (12 * dir) + sway, y, 14, 7, dir * 0.5, 0, Math.PI * 2);
        ctx.fill();
    };



    const drawFlower = (ctx: CanvasRenderingContext2D, x: number, y: number, type: string, frame: number) => {
        const color = getFlowerColor(type);
        const petalCount = 8;

        ctx.shadowColor = color;
        ctx.shadowBlur = 15;

        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2 + Math.sin(frame * 0.02) * 0.1;
            const px = x + Math.cos(angle) * 14;
            const py = y + Math.sin(angle) * 14;

            const petalGradient = ctx.createRadialGradient(px, py, 0, px, py, 20);
            petalGradient.addColorStop(0, color);
            petalGradient.addColorStop(1, adjustColorBrightness(color, -40));
            ctx.fillStyle = petalGradient;
            ctx.beginPath();
            ctx.ellipse(px, py, 20, 10, angle, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Center
        const centerGradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
        centerGradient.addColorStop(0, '#ffff8d');
        centerGradient.addColorStop(1, '#ffd600');
        ctx.fillStyle = centerGradient;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
    };

    const getFlowerColor = (type: string): string => {
        switch (type) {
            case 'Rose': return '#ff4081';
            case 'Sunflower': return '#ffab00';
            case 'Lotus': return '#ea80fc';
            case 'Fern': return '#00e676';
            default: return '#e040fb';
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
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(frame * 0.1) * 0.2})`;
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