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

            // 1. NEBULA BACKGROUND
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, '#0f172a'); // Slate 900
            grad.addColorStop(1, '#312e81'); // Indigo 900
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            // Procedural Nebula Clouds
            const time = Date.now() / 3000;
            ctx.globalCompositeOperation = 'screen';
            for (let i = 0; i < 3; i++) {
                const nx = (Math.sin(time + i) * W / 2) + W / 2;
                const ny = (Math.cos(time * 0.5 + i) * H / 2) + H / 2;
                const nGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, W * 0.8);
                nGrad.addColorStop(0, i === 0 ? 'rgba(79, 70, 229, 0.2)' : i === 1 ? 'rgba(236, 72, 153, 0.15)' : 'rgba(34, 211, 238, 0.15)');
                nGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = nGrad;
                ctx.fillRect(0, 0, W, H);
            }
            ctx.globalCompositeOperation = 'source-over';

            // Stars with Twinkle
            ctx.fillStyle = 'white';
            for (let i = 0; i < 40; i++) {
                const sx = (i * 90 + Date.now() / 50) % W;
                const sy = (i * 70) % H;
                const twinkle = Math.abs(Math.sin(Date.now() / 500 + i));
                ctx.globalAlpha = twinkle * 0.8 + 0.2;
                ctx.beginPath(); ctx.arc(sx, sy, Math.random() * 1.5, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1.0;

            // 2. GLASS PLATFORMS with Bloom
            platformsRef.current.forEach(pl => {
                const isMoving = pl.type === 'moving';

                // Glow
                ctx.shadowColor = isMoving ? '#0ea5e9' : '#a78bfa';
                ctx.shadowBlur = 20;

                const platGrad = ctx.createLinearGradient(pl.x, pl.y, pl.x, pl.y + pl.h);
                platGrad.addColorStop(0, isMoving ? 'rgba(56, 189, 248, 0.9)' : 'rgba(167, 139, 250, 0.9)');
                platGrad.addColorStop(1, isMoving ? 'rgba(3, 105, 161, 0.4)' : 'rgba(124, 58, 237, 0.4)');

                ctx.fillStyle = platGrad;
                // Rounded
                ctx.beginPath();
                ctx.roundRect(pl.x, pl.y, pl.w, pl.h, 6);
                ctx.fill();

                // Shine
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fillRect(pl.x + 5, pl.y + 2, pl.w - 10, 2);

                ctx.shadowBlur = 0;
            });

            // 3. PLAYER ORB (Energy Core)
            // Trail
            ctx.beginPath();
            ctx.ellipse(p.x + p.width / 2, p.y + p.height / 2, p.width * 0.8, p.height * 0.8, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(250, 204, 21, 0.2)'; // Yellow trail
            ctx.fill();

            // Core
            const pX = p.x + p.width / 2;
            const pY = p.y + p.height / 2;
            const pSize = p.width / 2;

            const orbGrad = ctx.createRadialGradient(pX, pY, 0, pX, pY, pSize);
            orbGrad.addColorStop(0, '#fef08a'); // Core White/Yellow
            orbGrad.addColorStop(0.4, '#eab308'); // Yellow 500
            orbGrad.addColorStop(1, '#a16207'); // Dark Gold

            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 25;
            ctx.fillStyle = orbGrad;
            ctx.beginPath(); ctx.arc(pX, pY, pSize, 0, Math.PI * 2); ctx.fill();

            // Eyes (Kawaii)
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#422006';
            const eyeOff = pSize * 0.5;
            const eyeS = pSize * 0.25;
            ctx.beginPath(); ctx.arc(pX - eyeOff, pY - 2, eyeS, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(pX + eyeOff, pY - 2, eyeS, 0, Math.PI * 2); ctx.fill();
            // Shine in eyes
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(pX - eyeOff - 2, pY - 4, eyeS * 0.4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(pX + eyeOff - 2, pY - 4, eyeS * 0.4, 0, Math.PI * 2); ctx.fill();

            requestRef.current = requestAnimationFrame(update);
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
