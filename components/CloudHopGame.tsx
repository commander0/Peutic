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
        ctx.shadowColor = 'transparent';

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

            // --- VOID RENDER (THEMED) ---

            // 1. COSMOS
            ctx.fillStyle = '#020617'; // Deep space
            ctx.fillRect(0, 0, W, H);

            // Stars
            ctx.fillStyle = 'white';
            for (let i = 0; i < 50; i++) {
                const sx = (Math.sin(i * 123) * 0.5 + 0.5) * W;
                const sy = (Math.cos(i * 456) * 0.5 + 0.5) * H;
                ctx.globalAlpha = Math.random() * 0.5 + 0.2;
                ctx.fillRect(sx, sy, 1.5, 1.5);
            }
            ctx.globalAlpha = 1.0;

            // 2. PLATFORMS (Digital Blocks)
            platformsRef.current.forEach(pl => {
                if (pl.type === 'ground') {
                    ctx.fillStyle = '#1e1b4b'; // Dark Navy
                    ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
                    ctx.strokeStyle = '#4f46e5';
                    ctx.strokeRect(pl.x, pl.y, pl.w, pl.h);
                } else {
                    ctx.fillStyle = pl.type === 'moving' ? '#1e293b' : '#0f172a';
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = pl.type === 'moving' ? '#38bdf8' : '#6366f1';
                    ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
                    ctx.strokeStyle = pl.type === 'moving' ? '#38bdf8' : '#6366f1';
                    ctx.strokeRect(pl.x, pl.y, pl.w, pl.h);
                    ctx.shadowBlur = 0;
                }
            });

            // 3. PLAYER (Cyber Pulse)
            ctx.fillStyle = '#818cf8';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#818cf8';
            ctx.beginPath();
            ctx.roundRect(p.x, p.y, p.width, p.height, 4);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Face
            ctx.fillStyle = 'black';
            ctx.beginPath(); ctx.arc(p.x + 8, p.y + 10, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(p.x + p.width - 8, p.y + 10, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.beginPath(); ctx.arc(p.x + p.width / 2, p.y + 16, 4, 0, Math.PI); ctx.stroke();

            requestRef.current = requestAnimationFrame(update);
        };

        requestRef.current = requestAnimationFrame(update);

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
        <div className="relative h-full w-full bg-slate-950 overflow-hidden rounded-2xl border-4 border-white/5 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] cursor-pointer"
            onMouseDown={handleTap} onMouseUp={handleRelease} onTouchStart={handleTap} onTouchEnd={handleRelease}>
            <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full font-black text-indigo-300 text-base md:text-lg z-10 border border-white/10">{score}m</div>
            {highScore > 0 && <div className="absolute top-2 left-2 bg-yellow-400/10 backdrop-blur-md px-3 py-1 rounded-full font-black text-yellow-500 text-xs md:text-sm z-10 border border-yellow-500/30">Best: {highScore}</div>}
            <canvas ref={canvasRef} className="w-full h-full block" />
            {(!gameStarted || gameOver) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-20 animate-in fade-in">
                    <div className="text-center">
                        {gameOver && <p className="text-white font-black text-2xl mb-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">Signal Lost</p>}
                        <button onClick={initGame} className="bg-indigo-600 text-white px-6 py-2 md:px-8 md:py-3 rounded-full font-black text-sm md:text-lg shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:scale-110 transition-transform flex items-center gap-2">
                            <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" /> {gameOver ? 'Retry' : 'Enter Void'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CloudHopGame;
