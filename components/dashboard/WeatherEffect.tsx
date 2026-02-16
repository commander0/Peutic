import React, { useEffect, useRef, memo } from 'react';

type WeatherType = 'confetti' | 'rain' | null;

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    type: 'confetti' | 'balloon' | 'streamer' | 'rain' | 'cloud';
    rotation: number;
    rotationSpeed: number;
    oscillation: number; // For streamers/balloons
    oscillationSpeed: number;
    opacity: number;
    cloudParts?: { x: number, y: number, r: number }[]; // For realistic clouds
}

const WeatherEffectComponent: React.FC<{ type: WeatherType }> = ({ type }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const particlesRef = useRef<Particle[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !type) return;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        // Resize handler
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Initialize Particles
        const initParticles = () => {
            const tempParticles: Particle[] = [];
            const w = canvas.width;
            const h = canvas.height;

            if (type === 'confetti') {
                const COLORS = ['#FACC15', '#FFD700', '#F87171', '#60A5FA', '#4ADE80', '#A78BFA'];

                // 1. Confetti (80 count - user requested optimized)
                for (let i = 0; i < 80; i++) {
                    tempParticles.push({
                        x: Math.random() * w,
                        y: Math.random() * h - h, // Start above
                        vx: (Math.random() - 0.5) * 8,
                        vy: Math.random() * 5 + 3,
                        size: Math.random() * 8 + 4,
                        color: COLORS[Math.floor(Math.random() * COLORS.length)],
                        type: 'confetti',
                        rotation: Math.random() * 360,
                        rotationSpeed: (Math.random() - 0.5) * 15,
                        oscillation: 0,
                        oscillationSpeed: 0,
                        opacity: 1
                    });
                }

                // 2. Balloons (15 count)
                for (let i = 0; i < 15; i++) {
                    tempParticles.push({
                        x: Math.random() * w,
                        y: h + Math.random() * 500, // Start below
                        vx: 0,
                        vy: -(Math.random() * 2 + 1), // Float UP
                        size: Math.random() * 15 + 10,
                        color: COLORS[Math.floor(Math.random() * COLORS.length)],
                        type: 'balloon',
                        rotation: 0,
                        rotationSpeed: 0,
                        oscillation: Math.random() * Math.PI * 2,
                        oscillationSpeed: Math.random() * 0.05 + 0.02,
                        opacity: 0.9
                    });
                }

                // 3. Streamers (10 count)
                for (let i = 0; i < 10; i++) {
                    tempParticles.push({
                        x: Math.random() * w,
                        y: Math.random() * h - h,
                        vx: 0,
                        vy: Math.random() * 4 + 4,
                        size: Math.random() * 3 + 2, // Width
                        color: COLORS[Math.floor(Math.random() * COLORS.length)],
                        type: 'streamer',
                        rotation: 0,
                        rotationSpeed: 0,
                        oscillation: Math.random() * Math.PI * 2,
                        oscillationSpeed: Math.random() * 0.1 + 0.05,
                        opacity: 1
                    });
                }

            } else if (type === 'rain') {
                // 1. Rain (300 count)
                for (let i = 0; i < 300; i++) {
                    tempParticles.push({
                        x: Math.random() * w,
                        y: Math.random() * h,
                        vx: 0.5,
                        vy: Math.random() * 15 + 15, // Fast rain
                        size: Math.random() * 2 + 1.5, // Thicker Rain (1.5px - 3.5px)
                        color: '#60A5FA',
                        type: 'rain',
                        rotation: 0,
                        rotationSpeed: 0,
                        oscillation: 0,
                        oscillationSpeed: 0,
                        opacity: Math.random() * 0.5 + 0.2
                    });
                }

                // 2. Clouds (8 count - procedural drift)
                for (let i = 0; i < 8; i++) {
                    const size = Math.random() * 60 + 40;
                    // Generate 3-5 sub-circles for fluffiness
                    const parts = [];
                    const partCount = Math.floor(Math.random() * 3) + 3;
                    for (let j = 0; j < partCount; j++) {
                        parts.push({
                            x: (Math.random() - 0.5) * size * 1.5,
                            y: (Math.random() - 0.5) * size * 0.5,
                            r: size * (Math.random() * 0.4 + 0.6)
                        });
                    }

                    tempParticles.push({
                        x: Math.random() * w,
                        y: Math.random() * (h / 3),
                        vx: (Math.random() * 0.2 + 0.05) * (Math.random() > 0.5 ? 1 : -1),
                        vy: 0,
                        size: size,
                        color: 'rgba(255,255,255,0.1)', // Base transparent white
                        type: 'cloud',
                        rotation: 0,
                        rotationSpeed: 0,
                        oscillation: 0,
                        oscillationSpeed: 0,
                        opacity: Math.random() * 0.3 + 0.1,
                        cloudParts: parts
                    });
                }
            }
            particlesRef.current = tempParticles;
        };

        const update = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const w = canvas.width;
            const h = canvas.height;

            particlesRef.current.forEach(p => {
                // MOVEMENT
                if (p.type === 'balloon') {
                    p.oscillation += p.oscillationSpeed;
                    p.x += Math.sin(p.oscillation) * 0.5; // Wobble
                    p.y += p.vy; // Float up
                    // Reset balloon
                    if (p.y < -50) {
                        p.y = h + 50;
                        p.x = Math.random() * w;
                    }
                } else if (p.type === 'streamer') {
                    p.oscillation += p.oscillationSpeed;
                    p.x += Math.sin(p.oscillation) * 2; // Spiral
                    p.y += p.vy;
                    if (p.y > h) { p.y = -100; p.x = Math.random() * w; }
                } else if (p.type === 'cloud') {
                    p.x += p.vx;
                    if (p.x > w + 200) p.x = -200;
                    if (p.x < -200) p.x = w + 200;
                } else {
                    // Standard gravity physics (Confetti/Rain)
                    p.x += p.vx;
                    p.y += p.vy;
                    p.rotation += p.rotationSpeed;

                    if (p.type === 'confetti') p.vy += 0.05; // Gravity acceleration

                    // Reset standard
                    if (p.y > h) {
                        p.y = -20;
                        p.x = Math.random() * w;
                        if (p.type === 'confetti') {
                            p.vy = Math.random() * 5 + 3;
                            p.vx = (Math.random() - 0.5) * 8;
                        }
                    }
                }

                // DRAWING
                ctx.save();
                ctx.globalAlpha = p.opacity;

                if (p.type === 'confetti') {
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);

                } else if (p.type === 'balloon') {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();
                    // String
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y + p.size);
                    ctx.quadraticCurveTo(p.x + Math.sin(p.oscillation) * 5, p.y + p.size + 15, p.x, p.y + p.size + 30);
                    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    // Shine
                    ctx.beginPath();
                    ctx.arc(p.x - p.size / 3, p.y - p.size / 3, p.size / 4, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255,255,255,0.3)';
                    ctx.fill();

                } else if (p.type === 'streamer') {
                    ctx.beginPath();
                    // Draw sine wave tail
                    for (let j = 0; j < 20; j++) {
                        const sy = p.y - j * 5;
                        const sx = p.x + Math.sin(p.oscillation + j * 0.5) * 10;
                        if (j === 0) ctx.moveTo(sx, sy);
                        else ctx.lineTo(sx, sy);
                    }
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = p.size;
                    ctx.stroke();

                } else if (p.type === 'rain') {
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = p.size;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x, p.y + 25); // Longer Rain drops
                    ctx.stroke();

                } else if (p.type === 'cloud' && p.cloudParts) {
                    // Soft, multi-layered cloud drawing
                    ctx.save();
                    ctx.translate(p.x, p.y);

                    p.cloudParts.forEach(part => {
                        const grad = ctx.createRadialGradient(part.x, part.y, 0, part.x, part.y, part.r);
                        grad.addColorStop(0, `rgba(255, 255, 255, ${p.opacity})`);
                        grad.addColorStop(0.6, `rgba(220, 230, 240, ${p.opacity * 0.5})`);
                        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                        ctx.fillStyle = grad;
                        ctx.beginPath();
                        ctx.arc(part.x, part.y, part.r, 0, Math.PI * 2);
                        ctx.fill();
                    });

                    ctx.restore();
                }

                ctx.restore();
            });

            requestRef.current = requestAnimationFrame(update);
        };

        if (type) {
            initParticles();
            requestRef.current = requestAnimationFrame(update);
        }

        return () => {
            window.removeEventListener('resize', resize);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };

    }, [type]);

    if (!type) return null;

    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[50]" />;
};

export const WeatherEffect = memo(WeatherEffectComponent);
