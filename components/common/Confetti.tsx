import React, { useEffect, useRef } from 'react';

const Confetti: React.FC<{ active: boolean }> = ({ active }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!active || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: any[] = [];
        const colors = ['#FACC15', '#4ADE80', '#60A5FA', '#F87171', '#C084FC'];

        for (let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                size: Math.random() * 6 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                velocity: {
                    x: (Math.random() - 0.5) * 5,
                    y: Math.random() * 3 + 2
                },
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 10 - 5
            });
        }

        let animationFrame: number;

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p, i) => {
                p.x += p.velocity.x;
                p.y += p.velocity.y;
                p.rotation += p.rotationSpeed;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();

                if (p.y > canvas.height) {
                    particles[i].y = -20;
                    particles[i].x = Math.random() * canvas.width;
                }
            });

            animationFrame = requestAnimationFrame(render);
        };

        render();

        const timer = setTimeout(() => {
            cancelAnimationFrame(animationFrame);
        }, 5000);

        return () => {
            cancelAnimationFrame(animationFrame);
            clearTimeout(timer);
        };
    }, [active]);

    if (!active) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[1000]"
            style={{ width: '100%', height: '100%' }}
        />
    );
};

export default Confetti;
