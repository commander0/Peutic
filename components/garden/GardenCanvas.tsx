import React, { useEffect, useRef } from 'react';
import { GardenState } from '../../types';

interface GardenCanvasProps {
    garden: GardenState;
    width?: number;
    height?: number;
}

interface Node {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    pulse: number;
    pulseSpeed: number;
    type: 'core' | 'satellite' | 'dust';
}

const GardenCanvas: React.FC<GardenCanvasProps> = ({ garden, width = 300, height = 300 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const nodesRef = useRef<Node[]>([]);
    const frameRef = useRef(0);
    const animationRef = useRef<number>();

    // Init Nodes based on Level
    useEffect(() => {
        const nodes: Node[] = [];
        const centerX = width / 2;
        const centerY = height / 2;

        // Core Node (The "Void Pet" or Soul)
        const coreColor = garden.level > 5 ? '#a78bfa' : '#34d399'; // Purple if high level, Green default
        nodes.push({
            x: centerX,
            y: centerY,
            vx: 0,
            vy: 0,
            radius: 20 + garden.level * 2,
            color: coreColor,
            pulse: 0,
            pulseSpeed: 0.05,
            type: 'core'
        });

        // Satellite Nodes (Memories/Growth)
        const satelliteCount = Math.min(15, garden.level + 3);
        for (let i = 0; i < satelliteCount; i++) {
            nodes.push({
                x: centerX + (Math.random() - 0.5) * 100,
                y: centerY + (Math.random() - 0.5) * 100,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: 4 + Math.random() * 6,
                color: Math.random() > 0.5 ? '#60a5fa' : '#f472b6',
                pulse: Math.random() * Math.PI,
                pulseSpeed: 0.02 + Math.random() * 0.04,
                type: 'satellite'
            });
        }

        // Ambient Dust
        for (let i = 0; i < 40; i++) {
            nodes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.1,
                vy: (Math.random() - 0.5) * 0.1,
                radius: Math.random() * 1.5,
                color: '#ffffff',
                pulse: Math.random() * Math.PI,
                pulseSpeed: 0.01 + Math.random() * 0.05,
                type: 'dust'
            });
        }

        nodesRef.current = nodes;
    }, [garden.level, width, height]);

    useEffect(() => {
        const render = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // VOID BACKGROUND
            // Deep, organic darkness with subtle gradient
            const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
            bgGrad.addColorStop(0, '#121212'); // Deep Gray
            bgGrad.addColorStop(1, '#000000'); // Pure Black
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            // Update & Draw Nodes
            nodesRef.current.forEach((node, i) => {
                // Physics Update
                node.x += node.vx;
                node.y += node.vy;
                node.pulse += node.pulseSpeed;

                // Bounds Wrap
                if (node.x < -20) node.x = width + 20;
                if (node.x > width + 20) node.x = -20;
                if (node.y < -20) node.y = height + 20;
                if (node.y > height + 20) node.y = -20;

                // Core Physics: Mouse attraction could go here, for now simpler hover float
                if (node.type === 'core') {
                    node.y += Math.sin(frameRef.current * 0.02) * 0.2;
                }

                // Tethering (Draw interactions)
                if (node.type === 'satellite') {
                    // Connect to core
                    const core = nodesRef.current[0];
                    const dist = Math.hypot(node.x - core.x, node.y - core.y);
                    if (dist < 150) {
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - dist / 150)})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(core.x, core.y);
                        ctx.lineTo(node.x, node.y);
                        ctx.stroke();
                    }
                }

                // Drawing
                ctx.save();
                const pulseScale = 1 + Math.sin(node.pulse) * 0.1;
                const r = node.radius * pulseScale;

                // Glow
                if (node.type !== 'dust') {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = node.color;
                }

                ctx.fillStyle = node.color;
                ctx.globalAlpha = node.type === 'dust' ? 0.3 + Math.sin(node.pulse) * 0.2 : 0.9;

                ctx.beginPath();
                ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // Overlay Text (Optional, minimal)
            // ctx.fillStyle = 'rgba(255,255,255,0.1)';
            // ctx.font = '10px monospace';
            // ctx.fillText(`VOID DEPTH: ${garden.level}`, 10, height - 10);

            frameRef.current++;
            animationRef.current = requestAnimationFrame(render);
        };

        render();
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [width, height]);

    return <canvas ref={canvasRef} width={width} height={height} className="w-full h-full animate-in fade-in duration-1000" />;
};

export default GardenCanvas;