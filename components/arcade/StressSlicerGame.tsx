import React, { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import { User } from '../../types';
import { UserService } from '../../services/userService';

interface StressSlicerProps {
    dashboardUser: User;
}

const StressSlicerGame: React.FC<StressSlicerProps> = ({ dashboardUser }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [highScore, setHighScore] = useState(() => dashboardUser?.gameScores?.slicer || 0);
    const [lives, setLives] = useState(3);

    const requestRef = useRef<number | undefined>(undefined);
    const targetsRef = useRef<any[]>([]);
    const particlesRef = useRef<any[]>([]);
    const trailsRef = useRef<{ x: number, y: number, life: number }[]>([]);
    const isDrawingRef = useRef(false);
    const lastMouseRef = useRef({ x: 0, y: 0 });
    const slowModeRef = useRef(false);

    const NEGATIVE_WORDS = ["ANXIETY", "DOUBT", "FEAR", "STRESS", "OVERWHELM", "PANIC", "WORRY", "FATIGUE"];
    const POSITIVE_WORDS = ["CALM", "PEACE", "HOPE", "REST", "BREATHE", "CLARITY"];
    const POWERUP_WORDS = ["SLOW-MO", "FREEZE", "ZEN"];

    const initGame = () => {
        setScore(0);
        setLives(3);
        setGameOver(false);
        setGameStarted(true);
        targetsRef.current = [];
        particlesRef.current = [];
        trailsRef.current = [];
    };

    useEffect(() => {
        if (gameOver && score > highScore) {
            setHighScore(score);
            if (dashboardUser?.id) {
                UserService.updateGameScore(dashboardUser.id, 'slicer', score);
            }
        }
    }, [gameOver, score, highScore, dashboardUser]);

    useEffect(() => {
        if (!gameStarted || gameOver) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Retina resize
        const resize = () => {
            const rect = canvas.parentElement?.getBoundingClientRect();
            if (rect) {
                const dpr = window.devicePixelRatio || 1;
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                ctx.scale(dpr, dpr);
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${rect.height}px`;
            }
        };
        resize();
        window.addEventListener('resize', resize);

        let frames = 0;

        const getDprWidth = () => canvas.width / (window.devicePixelRatio || 1);
        const getDprHeight = () => canvas.height / (window.devicePixelRatio || 1);

        const spawnTarget = () => {
            const W = getDprWidth();
            const H = getDprHeight();
            const rand = Math.random();
            let type: 'negative' | 'positive' | 'powerup' = 'negative';
            if (rand > 0.9) type = 'powerup';
            else if (rand > 0.45) type = 'positive';

            let word = "";
            if (type === 'negative') word = NEGATIVE_WORDS[Math.floor(Math.random() * NEGATIVE_WORDS.length)];
            else if (type === 'positive') word = POSITIVE_WORDS[Math.floor(Math.random() * POSITIVE_WORDS.length)];
            else word = POWERUP_WORDS[Math.floor(Math.random() * POWERUP_WORDS.length)];

            targetsRef.current.push({
                x: W * 0.2 + Math.random() * (W * 0.6),
                y: H + 50,
                vx: (Math.random() - 0.5) * 4,
                vy: -(Math.random() * 4 + 10), // Jump force
                word,
                type,
                radius: type === 'powerup' ? 30 : 40,
                rotation: Math.random() * Math.PI,
                vrot: (Math.random() - 0.5) * 0.1,
                sliced: false
            });
        };

        const createParticles = (x: number, y: number, color: string) => {
            for (let i = 0; i < 15; i++) {
                particlesRef.current.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 12,
                    vy: (Math.random() - 0.5) * 12,
                    life: 1,
                    color
                });
            }
        };

        const checkSlice = (p1: { x: number, y: number }, p2: { x: number, y: number }) => {
            targetsRef.current.forEach(t => {
                if (t.sliced) return;
                // Simple distance from line segment to target center
                const l2 = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
                let dt = 0;
                if (l2 === 0) dt = Math.hypot(t.x - p1.x, t.y - p1.y);
                else {
                    let t_proj = ((t.x - p1.x) * (p2.x - p1.x) + (t.y - p1.y) * (p2.y - p1.y)) / l2;
                    t_proj = Math.max(0, Math.min(1, t_proj));
                    dt = Math.hypot(
                        t.x - (p1.x + t_proj * (p2.x - p1.x)),
                        t.y - (p1.y + t_proj * (p2.y - p1.y))
                    );
                }

                if (dt < t.radius) {
                    t.sliced = true;
                    if (t.type === 'positive') {
                        setLives(l => {
                            if (l <= 1) setGameOver(true);
                            return l - 1;
                        });
                        createParticles(t.x, t.y, '#fcd34d');
                    } else if (t.type === 'powerup') {
                        slowModeRef.current = true;
                        setTimeout(() => slowModeRef.current = false, 5000);
                        setScore(s => s + 100);
                        createParticles(t.x, t.y, '#a855f7');
                    } else {
                        setScore(s => s + 50);
                        createParticles(t.x, t.y, '#ef4444');
                    }
                }
            });
        };

        const handlePointerDown = (e: PointerEvent) => {
            isDrawingRef.current = true;
            const rect = canvas.getBoundingClientRect();
            lastMouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            trailsRef.current.push({ x: lastMouseRef.current.x, y: lastMouseRef.current.y, life: 1 });
        };

        const handlePointerMove = (e: PointerEvent) => {
            if (!isDrawingRef.current) return;
            const rect = canvas.getBoundingClientRect();
            const currentMouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };

            checkSlice(lastMouseRef.current, currentMouse);

            lastMouseRef.current = currentMouse;
            trailsRef.current.push({ x: currentMouse.x, y: currentMouse.y, life: 1 });
        };

        const handlePointerUp = () => { isDrawingRef.current = false; };

        canvas.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);

        const update = () => {
            const W = getDprWidth();
            const H = getDprHeight();

            // Clear
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, 0, W, H);

            frames++;
            const spawnRate = Math.max(30, 80 - Math.floor(score / 200));
            if (frames % (slowModeRef.current ? Math.floor(spawnRate * 1.5) : spawnRate) === 0) {
                spawnTarget();
            }

            // Draw Trails
            if (trailsRef.current.length > 1) {
                ctx.beginPath();
                ctx.moveTo(trailsRef.current[0].x, trailsRef.current[0].y);
                ctx.strokeStyle = '#22d3ee';
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.shadowColor = '#22d3ee';
                ctx.shadowBlur = 15;

                for (let i = 1; i < trailsRef.current.length; i++) {
                    ctx.lineTo(trailsRef.current[i].x, trailsRef.current[i].y);
                }
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            // Update trails
            for (let i = trailsRef.current.length - 1; i >= 0; i--) {
                trailsRef.current[i].life -= 0.05;
                if (trailsRef.current[i].life <= 0) trailsRef.current.splice(i, 1);
            }

            // Update & Draw targets
            for (let i = targetsRef.current.length - 1; i >= 0; i--) {
                const t = targetsRef.current[i];
                if (t.sliced) {
                    targetsRef.current.splice(i, 1);
                    continue;
                }

                const speedMult = slowModeRef.current ? 0.4 : 1;
                t.x += t.vx * speedMult;
                t.vy += 0.2 * speedMult; // Gravity
                t.y += t.vy * speedMult;
                t.rotation += t.vrot * speedMult;

                ctx.save();
                ctx.translate(t.x, t.y);
                ctx.rotate(t.rotation);

                // Body colors based on type
                let fillStyle = 'rgba(239,68,68,0.2)';
                let strokeStyle = '#ef4444';
                if (t.type === 'positive') {
                    fillStyle = 'rgba(252,211,77,0.2)';
                    strokeStyle = '#fcd34d';
                } else if (t.type === 'powerup') {
                    fillStyle = 'rgba(168,85,247,0.2)';
                    strokeStyle = '#a855f7';
                }

                ctx.fillStyle = fillStyle;
                ctx.strokeStyle = strokeStyle;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Text
                ctx.fillStyle = strokeStyle;
                ctx.font = 'bold 16px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(t.word, 0, 0);

                ctx.restore();

                // Miss penalty
                if (t.y > H + 100 && t.type === 'negative' && !t.sliced) {
                    setLives(l => {
                        if (l <= 1) setGameOver(true);
                        return l - 1;
                    });
                    targetsRef.current.splice(i, 1);
                }
            }

            // Particles
            for (let i = particlesRef.current.length - 1; i >= 0; i--) {
                const p = particlesRef.current[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
                if (p.life <= 0) {
                    particlesRef.current.splice(i, 1);
                    continue;
                }
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;

            requestRef.current = requestAnimationFrame(update);
        };
        requestRef.current = requestAnimationFrame(update);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            window.removeEventListener('resize', resize);
            if (canvas) canvas.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [gameStarted, gameOver]);

    return (
        <div className="w-full h-full min-h-[500px] flex flex-col items-center bg-black rounded-3xl overflow-hidden relative font-mono shadow-[0_0_30px_rgba(239,68,68,0.2)]">

            {/* HUD */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 pointer-events-none">
                <div className="space-y-1">
                    <div className="text-xl font-bold font-mono text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">SCORE: {score}</div>
                    <div className="text-sm font-mono text-cyan-500/60">HIGH: {highScore}</div>
                </div>
                <div className="flex gap-2 text-2xl">
                    {[...Array(3)].map((_, i) => (
                        <span key={i} className={i < lives ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "text-gray-800"}>❤️</span>
                    ))}
                </div>
            </div>

            <canvas ref={canvasRef} className="w-full h-full absolute inset-0 touch-none cursor-crosshair" />

            {!gameStarted && !gameOver && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-8 text-center z-20 backdrop-blur-md">
                    <h2 className="text-4xl font-black text-red-500 tracking-widest mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] font-mono">STRESS SLICER</h2>
                    <p className="text-gray-400 max-w-sm mb-8">Drag or swipe to slice negative thoughts. Avoid slicing the golden positive orbs! Missing a negative thought costs a life.</p>
                    <button
                        onClick={initGame}
                        className="px-8 py-4 bg-red-500 hover:bg-red-400 text-black font-black rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] flex items-center gap-3 font-mono"
                    >
                        <Play className="w-6 h-6 fill-current" />
                        INITIATE SLICE
                    </button>
                </div>
            )}

            {gameOver && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-8 text-center z-20 backdrop-blur-md">
                    <h2 className="text-5xl font-black text-white mb-2 font-mono drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">OVERWHELMED</h2>
                    <div className="text-2xl text-cyan-400 mb-8 font-mono">FINAL SCORE: {score}</div>
                    <button
                        onClick={initGame}
                        className="px-8 py-4 bg-transparent border-2 border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black font-black font-mono rounded-xl transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] flex items-center gap-2"
                    >
                        <Play className="w-5 h-5 fill-current" />
                        RE-ENTER FOCUS
                    </button>
                </div>
            )}
        </div>
    );
};

export default StressSlicerGame;
