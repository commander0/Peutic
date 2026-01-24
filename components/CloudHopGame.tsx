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

            // --- STANDARD FLAT RENDER (UNTAMPERED) ---

            // 1. SKY
            ctx.fillStyle = '#BAE6FD'; // Sky blue
            ctx.fillRect(0, 0, W, H);

            // 2. PLATFORMS (Simple Cloud Shapes)
            platformsRef.current.forEach(pl => {
                if (pl.type === 'ground') {
                    ctx.fillStyle = '#86EFAC'; // Light Green
                    ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
                } else {
                    ctx.fillStyle = pl.type === 'moving' ? '#E0F2FE' : 'white';
                    if (pl.type === 'moving') ctx.shadowColor = '#38BDF8';

                    // Simple Round Rect for cloud
                    const r = 15;
                    ctx.beginPath();
                    ctx.roundRect(pl.x, pl.y, pl.w, pl.h, r);
                    ctx.fill();

                    // Fluff
                    ctx.beginPath(); ctx.arc(pl.x + 10, pl.y, r, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(pl.x + pl.w - 10, pl.y, r, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(pl.x + pl.w / 2, pl.y - 10, r * 1.5, 0, Math.PI * 2); ctx.fill();
                    ctx.shadowColor = 'transparent';
                }
            });

            // 3. PLAYER (Standard Blob Character)
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.beginPath();
            ctx.ellipse(p.x + p.width / 2, p.y + p.height + 2, p.width / 2, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Body
            ctx.fillStyle = '#FACC15'; // Yellow
            ctx.beginPath();
            ctx.roundRect(p.x, p.y, p.width, p.height, 8);
            ctx.fill();

            // Face
            ctx.fillStyle = 'black';
            // Eyes
            ctx.beginPath(); ctx.arc(p.x + 8, p.y + 10, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(p.x + p.width - 8, p.y + 10, 3, 0, Math.PI * 2); ctx.fill();
            // Smile
            ctx.beginPath();
            ctx.arc(p.x + p.width / 2, p.y + 15, 6, 0, Math.PI);
            ctx.stroke();

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
