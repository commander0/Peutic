import React, { useRef, useState, useEffect } from 'react';
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
    const [highScore, setHighScore] = useState(() => dashboardUser?.gameScores?.cloud || 0);

    const currentScoreRef = useRef(0);
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
        if (gameOver && score > highScore) {
            setHighScore(score);
            if (dashboardUser?.id) UserService.updateGameScore(dashboardUser.id, 'cloud', score);
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
        const cloudGap = isMobile ? 60 : 70;

        while (py > -12000) {
            platformsRef.current.push({
                x: Math.random() * (W - basePlatW),
                y: py,
                w: basePlatW + Math.random() * 20,
                h: 15,
                type: 'cloud'
            });
            py -= cloudGap + Math.random() * 20;
        }

        playerRef.current = { x: W / 2 - (pSize / 2), y: H - 80, vx: 0, vy: 0, width: pSize, height: pSize };
        currentScoreRef.current = 0;
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

        const drawCloud = (x: number, y: number, w: number, h: number) => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.shadowColor = 'rgba(255,255,255,0.4)';
            ctx.shadowBlur = 10;
            ctx.fillRect(x, y, w, h);
            const bumpSize = h * 0.8;
            ctx.beginPath(); ctx.arc(x + 10, y, bumpSize, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + w - 10, y, bumpSize, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + w / 2, y - 5, bumpSize * 1.2, 0, Math.PI * 2); ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        };

        const update = () => {
            const p = playerRef.current;
            p.x += p.vx;
            if (p.x < -p.width) p.x = W;
            if (p.x > W) p.x = -p.width;
            p.vy += GRAVITY;
            p.y += p.vy;

            const targetY = H * 0.45;
            if (p.y < targetY) {
                const diff = (targetY - p.y) * 0.15;
                p.y += diff;
                currentScoreRef.current += diff;
                setScore(Math.floor(currentScoreRef.current));

                platformsRef.current.forEach((pl: any) => {
                    pl.y += diff;
                    if (pl.y > H + 50) {
                        pl.y = -20;
                        pl.x = Math.random() * (W - (isMobile ? 50 : 70));
                    }
                });
            }

            if (p.vy > 0) {
                platformsRef.current.forEach((pl: any) => {
                    if (p.y + p.height >= pl.y && p.y + p.height <= pl.y + 40 && p.x + p.width > pl.x && p.x < pl.x + pl.w) {
                        p.vy = JUMP_FORCE;
                        p.y = pl.y - p.height;
                    }
                });
            }

            if (p.y > H + p.height) {
                setGameOver(true);
                setGameStarted(false);
                if (requestRef.current !== undefined) cancelAnimationFrame(requestRef.current);
                return;
            }

            const currentScore = currentScoreRef.current;
            let hue = 200;
            let lightnessTop = Math.max(20, 60 - currentScoreRef.current / 150);
            let lightnessBot = Math.max(30, 80 - currentScoreRef.current / 150);

            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, `hsl(${hue}, 60%, ${lightnessTop}%)`);
            grad.addColorStop(1, `hsl(${hue}, 60%, ${lightnessBot}%)`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            platformsRef.current.forEach((pl: any) => {
                if (pl.type === 'ground') { ctx.fillStyle = '#4ade80'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h); }
                else { drawCloud(pl.x, pl.y, pl.w, pl.h); }
            });

            const drawPlayer = () => {
                ctx.save();
                ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
                ctx.rotate(p.vx * 0.08);

                ctx.shadowColor = '#60a5fa';
                ctx.shadowBlur = 15;

                const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.width / 2);
                coreGradient.addColorStop(0, '#ffffff');
                coreGradient.addColorStop(1, '#0ea5e9');

                ctx.fillStyle = coreGradient;
                ctx.beginPath();
                ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
                ctx.fill();

                ctx.shadowBlur = 0;
                ctx.fillStyle = '#082f49';

                const lookOffsetX = p.vx * 0.5;
                const lookOffsetY = p.vy < 0 ? -2 : 2;
                ctx.beginPath(); ctx.arc(-5 + lookOffsetX, -3 + lookOffsetY, 2.5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(5 + lookOffsetX, -3 + lookOffsetY, 2.5, 0, Math.PI * 2); ctx.fill();

                ctx.beginPath();
                if (p.vy < 0) {
                    ctx.arc(lookOffsetX, 1 + lookOffsetY, 4, 0, Math.PI);
                    ctx.stroke();
                } else {
                    ctx.moveTo(-2 + lookOffsetX, 3 + lookOffsetY);
                    ctx.lineTo(2 + lookOffsetX, 3 + lookOffsetY);
                    ctx.lineWidth = 1.5;
                    ctx.strokeStyle = '#082f49';
                    ctx.stroke();
                }

                ctx.restore();
            };
            drawPlayer();

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
        if (!canvasRef.current || !gameStarted) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const rect = canvasRef.current.getBoundingClientRect();
        if (clientX - rect.left < rect.width / 2) playerRef.current.vx = -4.5; else playerRef.current.vx = 4.5;
    };
    const handleRelease = () => { playerRef.current.vx = 0; };

    return (
        <div
            className="w-full h-full min-h-[500px] flex flex-col items-center rounded-3xl overflow-hidden relative shadow-[0_0_50px_rgba(56,189,248,0.15)] bg-slate-900 border border-slate-700/50"
            onMouseDown={handleTap} onMouseUp={handleRelease} onTouchStart={handleTap} onTouchEnd={handleRelease}
        >
            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full font-black text-white text-base md:text-lg z-10 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center gap-2">
                <span className="text-sky-300 tracking-widest text-xs uppercase">Altitude</span> {score}m
            </div>
            {highScore > 0 && (
                <div className="absolute top-4 left-4 bg-yellow-400/10 backdrop-blur-md px-4 py-1.5 rounded-full font-black text-yellow-300 text-xs md:text-sm z-10 border border-yellow-400/30 flex items-center gap-2 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                    <span className="tracking-widest uppercase">Apex</span> {highScore}m
                </div>
            )}

            <canvas ref={canvasRef} className="w-full h-full block cursor-pointer touch-none" />

            {(!gameStarted || gameOver) && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-md z-20 animate-in fade-in">
                    <div className="text-center">
                        {gameOver && (
                            <div className="mb-8">
                                <h3 className="text-sky-400 text-sm font-black tracking-[0.3em] uppercase mb-2">Descent Complete</h3>
                                <p className="text-white font-black text-5xl mb-4 drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">{score}m</p>
                            </div>
                        )}
                        <button onClick={initGame} className="bg-sky-500 hover:bg-sky-400 text-slate-900 px-8 py-4 rounded-full font-black text-sm md:text-base shadow-[0_0_30px_rgba(56,189,248,0.4)] hover:scale-105 transition-all flex items-center gap-3 tracking-widest uppercase">
                            <Play className="w-5 h-5 fill-current" /> {gameOver ? 'Take Flight Again' : 'Initiate Launch'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CloudHopGame;
