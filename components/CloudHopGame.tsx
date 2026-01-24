import React, { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import { User } from '../types';
import { UserService } from '../services/userService';

interface CloudHopGameProps {
    dashboardUser: User;
}

const CloudHopGame: React.FC<CloudHopGameProps> = ({ dashboardUser }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | undefined>(undefined);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [highScore, setHighScore] = useState(() => {
        return dashboardUser?.gameScores?.cloud || 0;
    });
    const playerRef = useRef({ x: 150, y: 300, vx: 0, vy: 0, width: 30, height: 30 });
    const platformsRef = useRef<any[]>([]);

    useEffect(() => {
        const resizeCanvas = () => {
            const canvas = canvasRef.current;
            if (canvas && canvas.parentElement) {
                const dpr = window.devicePixelRatio || 1;
                const rect = canvas.parentElement.getBoundingClientRect();
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${rect.height}px`;
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                const ctx = canvas.getContext('2d');
                if (ctx) ctx.scale(dpr, dpr);
                if (gameStarted) { setGameOver(true); setGameStarted(false); }
            }
        };
        window.addEventListener('resize', resizeCanvas);
        setTimeout(resizeCanvas, 100);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    useEffect(() => {
        if (gameOver) {
            if (score > highScore) {
                setHighScore(score);
                if (dashboardUser && dashboardUser.id) {
                    UserService.updateGameScore(dashboardUser.id, 'cloud', score);
                }
            }
        }
    }, [gameOver, score, highScore]);

    const initGame = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const W = canvas.width / dpr;
        const H = canvas.height / dpr;
        const isMobile = W < 600;
        const pSize = isMobile ? 24 : 32;
        const basePlatW = isMobile ? 80 : 100;
        platformsRef.current = [{ x: 0, y: H - 30, w: W, h: 30, type: 'ground' }];
        let py = H - 80;
        while (py > -2000) {
            platformsRef.current.push({
                x: Math.random() * (W - basePlatW),
                y: py,
                w: basePlatW + Math.random() * (isMobile ? 20 : 30),
                h: isMobile ? 12 : 15,
                type: Math.random() > 0.9 ? 'moving' : 'cloud',
                vx: Math.random() > 0.5 ? 1 : -1
            });
            py -= (isMobile ? 60 : 70) + Math.random() * 25;
        }
        playerRef.current = { x: W / 2 - (pSize / 2), y: H - 80, vx: 0, vy: 0, width: pSize, height: pSize };
        setScore(0);
        setGameOver(false);
        setGameStarted(true);
    };

    useEffect(() => {
        if (!gameStarted) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const W = canvas.width / dpr;
        const H = canvas.height / dpr;
        const isMobile = W < 600;
        const GRAVITY = H > 400 ? 0.4 : 0.35;
        const JUMP_FORCE = H > 400 ? -9 : -8;
        const MOVE_SPEED = isMobile ? 3.5 : 4.5;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') playerRef.current.vx = -MOVE_SPEED;
            if (e.key === 'ArrowRight') playerRef.current.vx = MOVE_SPEED;
        };
        const handleKeyUp = () => { playerRef.current.vx = 0; };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        const drawCloud = (x: number, y: number, w: number, h: number, type: string) => {
            ctx.fillStyle = type === 'moving' ? '#E0F2FE' : 'white';
            if (type === 'moving') ctx.shadowColor = '#38BDF8';
            ctx.fillRect(x, y, w, h);
            const bumpSize = h * 0.8;
            ctx.beginPath(); ctx.arc(x + 10, y, bumpSize, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + w - 10, y, bumpSize, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + w / 2, y - 5, bumpSize * 1.2, 0, Math.PI * 2); ctx.fill();
            ctx.shadowColor = 'transparent';
        };
        const update = () => {
            const p = playerRef.current;
            p.x += p.vx;
            if (p.x < -p.width) p.x = W;
            if (p.x > W) p.x = -p.width;
            p.vy += GRAVITY;
            p.y += p.vy;
            if (p.y < H / 2) {
                const diff = (H / 2) - p.y;
                p.y = H / 2;
                setScore(s => s + Math.floor(diff));
                platformsRef.current.forEach(pl => {
                    pl.y += diff;
                    if (pl.y > H + 50) {
                        pl.y = -20;
                        pl.x = Math.random() * (W - (isMobile ? 50 : 70));
                        pl.type = Math.random() > 0.85 ? 'moving' : 'cloud';
                    }
                });
            }
            if (p.vy > 0) {
                platformsRef.current.forEach(pl => {
                    if (p.y + p.height > pl.y && p.y + p.height < pl.y + 40 && p.x + p.width > pl.x && p.x < pl.x + pl.w) {
                        p.vy = JUMP_FORCE;
                    }
                });
            }
            platformsRef.current.forEach(pl => {
                if (pl.type === 'moving') {
                    pl.x += pl.vx;
                    if (pl.x < 0 || pl.x + pl.w > W) pl.vx *= -1;
                }
            });
            if (p.y > H + 50) {
                setGameOver(true);
                setGameStarted(false);
                if (requestRef.current !== undefined) cancelAnimationFrame(requestRef.current);
                return;
            }

            // --- HIGH FIDELITY RENDERING ---

            // --- HYPER REALISTIC RENDER ---

            // 1. SKY & STARFIELD
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, '#020617'); // Dark Slate
            grad.addColorStop(1, '#1e293b'); // Dark Slate lighter
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            // Parallax Stars
            const time = Date.now() / 1000;
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            for (let i = 0; i < 30; i++) {
                const sx = (i * 90 + time * 10) % W;
                const sy = (i * 70 + time * 5) % H;
                const size = Math.random() * 2;
                ctx.beginPath(); ctx.arc(sx, sy, size, 0, Math.PI * 2); ctx.fill();
            }

            // 2. PLATFORMS (Glass/Holographic)
            platformsRef.current.forEach(pl => {
                if (pl.type === 'ground') {
                    // Cyber Ground
                    const gGrad = ctx.createLinearGradient(0, pl.y, 0, pl.y + pl.h);
                    gGrad.addColorStop(0, '#10b981');
                    gGrad.addColorStop(1, '#059669');
                    ctx.fillStyle = gGrad;
                    ctx.shadowColor = '#34d399'; ctx.shadowBlur = 10;
                    ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
                    ctx.shadowBlur = 0;
                } else {
                    // Holographic Clouds
                    const isMoving = pl.type === 'moving';
                    const cGrad = ctx.createLinearGradient(pl.x, pl.y, pl.x, pl.y + pl.h);
                    cGrad.addColorStop(0, isMoving ? 'rgba(56,189,248,0.8)' : 'rgba(255,255,255,0.8)');
                    cGrad.addColorStop(1, isMoving ? 'rgba(14,165,233,0.4)' : 'rgba(255,255,255,0.1)');

                    ctx.save();
                    ctx.fillStyle = cGrad;
                    ctx.shadowColor = isMoving ? '#0ea5e9' : 'white';
                    ctx.shadowBlur = 15;
                    // Rounded Rect
                    const r = 4;
                    ctx.beginPath();
                    ctx.roundRect(pl.x, pl.y, pl.w, pl.h, r);
                    ctx.fill();

                    // Top Highlight
                    ctx.fillStyle = 'white';
                    ctx.globalAlpha = 0.5;
                    ctx.fillRect(pl.x, pl.y, pl.w, 2);
                    ctx.restore();
                }
            });

            // 3. PLAYER (Gradient Sphere with Glow)
            // Shadow
            ctx.beginPath();
            ctx.ellipse(p.x + p.width / 2, p.y + p.height + 5, p.width / 2.5, 3, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fill();

            // Body Gradient
            const pGrad = ctx.createRadialGradient(p.x + p.width / 3, p.y + p.height / 3, 2, p.x + p.width / 2, p.y + p.height / 2, p.width / 2);
            pGrad.addColorStop(0, '#facc15'); // Yellow-400
            pGrad.addColorStop(1, '#eab308'); // Yellow-500

            ctx.save();
            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 20;
            ctx.fillStyle = pGrad;
            ctx.beginPath(); ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width / 2, 0, Math.PI * 2); ctx.fill();
            ctx.restore();

            // Face
            ctx.fillStyle = '#422006';
            const eyeOff = p.width * 0.25;
            const eyeSize = p.width * 0.12;
            ctx.beginPath(); ctx.arc(p.x + p.width / 2 - eyeOff, p.y + p.height / 2 - eyeOff, eyeSize, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(p.x + p.width / 2 + eyeOff, p.y + p.height / 2 - eyeOff, eyeSize, 0, Math.PI * 2); ctx.fill();

            // Smile
            ctx.beginPath();
            ctx.arc(p.x + p.width / 2, p.y + p.height / 2 + eyeOff / 2, eyeOff, 0, Math.PI);
            ctx.lineWidth = 3; ctx.strokeStyle = '#422006'; ctx.stroke();
        };
        update();
        return () => {
            if (requestRef.current !== undefined) cancelAnimationFrame(requestRef.current);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameStarted]);

    const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
        if (!canvasRef.current) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const rect = canvasRef.current.getBoundingClientRect();
        if (clientX - rect.left < rect.width / 2) playerRef.current.vx = -3; else playerRef.current.vx = 3;
    };
    const handleRelease = () => { playerRef.current.vx = 0; };

    return (
        <div className="relative h-full w-full bg-sky-300 overflow-hidden rounded-2xl border-4 border-white dark:border-gray-700 shadow-inner cursor-pointer"
            onMouseDown={handleTap} onMouseUp={handleRelease} onTouchStart={handleTap} onTouchEnd={handleRelease}>
            <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-black text-white text-base md:text-lg z-10">{score}m</div>
            {highScore > 0 && <div className="absolute top-2 left-2 bg-yellow-400/20 backdrop-blur-sm px-3 py-1 rounded-full font-black text-white text-xs md:text-sm z-10 border border-yellow-400/50">Best: {highScore}</div>}
            <canvas ref={canvasRef} className="w-full h-full block" />
            {(!gameStarted || gameOver) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20 animate-in fade-in">
                    <div className="text-center">
                        {gameOver && <p className="text-white font-black text-2xl mb-4 drop-shadow-md">Fall!</p>}
                        <button onClick={initGame} className="bg-yellow-400 text-yellow-900 px-6 py-2 md:px-8 md:py-3 rounded-full font-black text-sm md:text-lg shadow-xl hover:scale-110 transition-transform flex items-center gap-2">
                            <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" /> {gameOver ? 'Try Again' : 'Play'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CloudHopGame;
