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
            const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
            skyGradient.addColorStop(0, '#020617'); // Deep Space
            skyGradient.addColorStop(0.5, '#1e1b4b'); // Indigo Night
            skyGradient.addColorStop(1, '#312e81'); // Twilight
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, width, height);

            // Stars
            ctx.fillStyle = 'white';
            for (let i = 0; i < 30; i++) {
                const sX = (i * 123 + frame * 0.5) % width;
                const sY = (i * 87) % (height * 0.6);
                const sSize = Math.random() * 2;
                ctx.globalAlpha = Math.random() * 0.8 + 0.2;
                ctx.beginPath(); ctx.arc(sX, sY, sSize, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1.0;

            // Moon/Sun Glow
            const glow = ctx.createRadialGradient(width * 0.8, height * 0.2, 10, width * 0.8, height * 0.2, 150);
            glow.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
            glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(width * 0.8, height * 0.2, 150, 0, Math.PI * 2); ctx.fill();

            drawToriiGate(ctx, width, height, garden.level);

            // Ground - Textured
            const groundY = height - 40;
            const groundGrad = ctx.createLinearGradient(0, groundY - 20, 0, height);
            groundGrad.addColorStop(0, '#064e3b'); // Emerald 900
            groundGrad.addColorStop(1, '#022c22'); // Emerald 950
            ctx.fillStyle = groundGrad;
            ctx.beginPath();
            ctx.moveTo(0, height);
            ctx.lineTo(0, groundY);
            ctx.bezierCurveTo(width / 3, groundY - 20, width * 2 / 3, groundY + 10, width, groundY - 10);
            ctx.lineTo(width, height);
            ctx.fill();

            // Fireflies
            for (let i = 0; i < 5; i++) {
                const fx = width / 2 + Math.sin(frame * 0.02 + i) * 100;
                const fy = height - 100 + Math.cos(frame * 0.03 + i) * 40;
                ctx.fillStyle = '#fde047'; // Yellow
                ctx.shadowColor = '#facc15'; ctx.shadowBlur = 10;
                ctx.beginPath(); ctx.arc(fx, fy, 2, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
            }

            const centerX = width / 2;

            // FRACTAL PLANT GENERATION
            // Level determines complexity
            drawFractalPlant(ctx, centerX, groundY, -Math.PI / 2, Math.min(garden.level + 2, 8), 120, frame, garden.currentPlantType);

            // Spirit with Trail
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
        const branchGrad = ctx.createLinearGradient(x, y, x2, y2);
        branchGrad.addColorStop(0, '#3f2c22'); // Dark Wood
        branchGrad.addColorStop(1, '#5d4037'); // Lighter Wood
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

    const drawToriiGate = (ctx: CanvasRenderingContext2D, w: number, h: number, level: number) => {
        if (level < 3) return; // Only show gate at higher levels
        const opacity = Math.min(0.6, (level - 2) * 0.15);
        ctx.globalAlpha = opacity;

        const gateColor = '#b71c1c'; // Darker red/crimson
        const gateX = w * 0.5;
        const gateY = h * 0.25;
        const gateWidth = w * 0.5;
        const gateHeight = h * 0.35;

        ctx.fillStyle = gateColor;
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 10;

        // Pillars
        ctx.fillRect(gateX - gateWidth / 2, gateY, 10, gateHeight);
        ctx.fillRect(gateX + gateWidth / 2 - 10, gateY, 10, gateHeight);

        // Top beam
        ctx.fillRect(gateX - gateWidth / 2 - 15, gateY, gateWidth + 30, 15);
        // Lower beam
        ctx.fillRect(gateX - gateWidth / 2, gateY + gateHeight * 0.3, gateWidth, 10);

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
    };

    const drawSpirit = (ctx: CanvasRenderingContext2D, anchorX: number, anchorY: number, frame: number, level: number) => {
        const floatY = Math.sin(frame * 0.05) * 6;
        const floatX = Math.cos(frame * 0.03) * 8;
        const x = anchorX + floatX;
        const y = anchorY + floatY;
        const spiritSize = 12 + level * 2;

        // Outer glow
        const gradient = ctx.createRadialGradient(x, y, 2, x, y, spiritSize + 15);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        gradient.addColorStop(0.4, 'rgba(100, 255, 218, 0.6)');
        gradient.addColorStop(1, 'rgba(100, 255, 218, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, spiritSize + 15, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#64ffda';
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

    const drawPlant = (ctx: CanvasRenderingContext2D, x: number, y: number, level: number, type: string, frame: number) => {
        if (level === 1) { // Seed
            ctx.fillStyle = '#8d6e63';
            ctx.beginPath();
            ctx.ellipse(x, y + 5, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            // Glowing Sprout
            ctx.strokeStyle = '#b9f6ca';
            ctx.shadowColor = '#69f0ae';
            ctx.shadowBlur = 5;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, y + 3);
            ctx.lineTo(x, y - 8 + Math.sin(frame * 0.1) * 3);
            ctx.stroke();
            ctx.shadowBlur = 0;
            return;
        }

        // Stem
        const stemHeight = level * 25 + 20;
        const sway = Math.sin(frame * 0.02) * 5;

        const stemGradient = ctx.createLinearGradient(x, y, x, y - stemHeight);
        stemGradient.addColorStop(0, '#2e7d32');
        stemGradient.addColorStop(0.5, '#66bb6a');
        stemGradient.addColorStop(1, '#a5d6a7');
        ctx.strokeStyle = stemGradient;
        ctx.lineWidth = 4 + level;
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
        const sway = Math.sin(frame * 0.03 + dir) * 3;
        const leafGradient = ctx.createLinearGradient(x, y, x + 15 * dir, y);
        leafGradient.addColorStop(0, '#66bb6a');
        leafGradient.addColorStop(1, '#00e676');
        ctx.fillStyle = leafGradient;
        ctx.beginPath();
        ctx.ellipse(x + (12 * dir) + sway, y, 14, 7, dir * 0.5, 0, Math.PI * 2);
        ctx.fill();
    };

    const drawBud = (ctx: CanvasRenderingContext2D, x: number, y: number, type: string) => {
        ctx.fillStyle = getFlowerColor(type);
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
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
