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
    const currentScoreRef = useRef(0);
    const playerRef = useRef({ x: 150, y: 300, vx: 0, vy: 0, width: 30, height: 30 });
    const platformsRef = useRef<any[]>([]);
    const particlesRef = useRef<any[]>([]);

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
        const cloudGap = isMobile ? 60 : (W > 800 ? 50 : 70); // denser on desktop
        while (py > -8000) { // go much higher!
            const typeRand = Math.random();
            const platformType = typeRand > 0.98 ? 'jetpack' : (typeRand > 0.82 ? 'spring' : (typeRand > 0.65 ? 'moving' : 'cloud'));

            platformsRef.current.push({
                x: Math.random() * (W - basePlatW),
                y: py,
                w: basePlatW + Math.random() * (isMobile ? 20 : 30),
                h: isMobile ? 12 : 15,
                type: platformType,
                vx: Math.random() > 0.5 ? 1 : -1,
                hasStar: Math.random() > 0.8,
                starCollected: false
            });

            // Spawn extra parallel clouds on wide screens for density
            if (W > 800 && Math.random() > 0.3) {
                const typeRand2 = Math.random();
                platformsRef.current.push({
                    x: Math.random() * (W - basePlatW),
                    y: py + (Math.random() * 30 - 15),
                    w: basePlatW + Math.random() * 30,
                    h: 15,
                    type: typeRand2 > 0.98 ? 'jetpack' : (typeRand2 > 0.82 ? 'spring' : (typeRand2 > 0.65 ? 'moving' : 'cloud')),
                    vx: Math.random() > 0.5 ? 1 : -1,
                    hasStar: Math.random() > 0.8,
                    starCollected: false
                });
            }
            py -= cloudGap + Math.random() * 25;
        }
        playerRef.current = { x: W / 2 - (pSize / 2), y: H - 80, vx: 0, vy: 0, width: pSize, height: pSize };
        particlesRef.current = [];
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
        const drawCloud = (x: number, y: number, w: number, h: number, type: string) => {
            if (type === 'spring') ctx.fillStyle = '#4ade80'; // brighter green
            else if (type === 'moving') ctx.fillStyle = '#E0F2FE';
            else if (type === 'jetpack') ctx.fillStyle = '#f43f5e'; // red rocket boost
            else ctx.fillStyle = 'white';

            if (type === 'moving') ctx.shadowColor = '#38BDF8';
            if (type === 'spring') ctx.shadowColor = '#22c55e';
            if (type === 'jetpack') ctx.shadowColor = '#fb7185';
            ctx.fillRect(x, y, w, h);

            // Jetpack visual
            if (type === 'jetpack') {
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath(); ctx.arc(x + w / 2, y - 10, 10, 0, Math.PI * 2); ctx.fill();
                ctx.shadowColor = 'transparent';
                return;
            }

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
                currentScoreRef.current += diff;
                setScore(Math.floor(currentScoreRef.current));
                platformsRef.current.forEach(pl => {
                    pl.y += diff;
                    if (pl.y > H + 50) {
                        pl.y = -20;
                        pl.x = Math.random() * (W - (isMobile ? 50 : 70));
                        const typeRand = Math.random();
                        pl.type = typeRand > 0.98 ? 'jetpack' : (typeRand > 0.82 ? 'spring' : (typeRand > 0.65 ? 'moving' : 'cloud'));
                        pl.hasStar = Math.random() > 0.8;
                        pl.starCollected = false;
                    }
                });
            }

            // Star Collection Logic
            platformsRef.current.forEach(pl => {
                if (pl.hasStar && !pl.starCollected) {
                    const sx = pl.x + pl.w / 2;
                    const sy = pl.y - 25;
                    const dist = Math.hypot(p.x + p.width / 2 - sx, p.y + p.height / 2 - sy);
                    if (dist < 35) { // Collect radius
                        pl.starCollected = true;
                        currentScoreRef.current += 500;
                        setScore(Math.floor(currentScoreRef.current));
                        for (let k = 0; k < 12; k++) {
                            particlesRef.current.push({
                                x: sx, y: sy,
                                vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
                                life: 1, color: '#fcd34d'
                            });
                        }
                    }
                }
            });

            if (p.vy > 0) {
                platformsRef.current.forEach(pl => {
                    if (p.y + p.height > pl.y && p.y + p.height < pl.y + 40 && p.x + p.width > pl.x && p.x < pl.x + pl.w) {
                        p.vy = pl.type === 'jetpack' ? JUMP_FORCE * 2.5 : (pl.type === 'spring' ? JUMP_FORCE * 1.6 : JUMP_FORCE);
                        const cColor = pl.type === 'jetpack' ? '#f43f5e' : (pl.type === 'spring' ? '#4ade80' : '#ffffff');
                        // Spawn bounce particles
                        for (let k = 0; k < (pl.type === 'jetpack' ? 15 : 6); k++) {
                            particlesRef.current.push({
                                x: p.x + p.width / 2,
                                y: p.y + p.height,
                                vx: (Math.random() - 0.5) * 8,
                                vy: Math.random() * (pl.type === 'jetpack' ? -8 : -3),
                                life: 1, color: cColor
                            });
                        }
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

            const currentScore = currentScoreRef.current;
            let cTop = '#0EA5E9', cBot = '#BAE6FD'; // Default Sky Blue
            if (currentScore > 5000) {
                cTop = '#0f172a'; cBot = '#312e81'; // Deep Space
            } else if (currentScore > 2000) {
                cTop = '#db2777'; cBot = '#fcd34d'; // Sunset Pink/Amber
            }

            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, cTop);
            grad.addColorStop(1, cBot);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            for (let i = 0; i < 10; i++) ctx.fillRect((i * 50 + Date.now() / 50) % W, (i * 30 + Date.now() / 20) % H, 2, 2);
            platformsRef.current.forEach(pl => {
                if (pl.type === 'ground') { ctx.fillStyle = '#4ade80'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h); }
                else { drawCloud(pl.x, pl.y, pl.w, pl.h, pl.type); }

                if (pl.hasStar && !pl.starCollected && pl.type !== 'ground') {
                    ctx.fillStyle = '#fde047'; // Star color
                    ctx.shadowColor = '#fcd34d';
                    ctx.shadowBlur = 15;
                    ctx.beginPath();
                    ctx.arc(pl.x + pl.w / 2, pl.y - 25, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            });
            const drawPlayer = () => {
                ctx.save();
                ctx.translate(p.x + p.width / 2, p.y + p.height / 2);

                // Tilt based on velocity
                ctx.rotate(p.vx * 0.1);

                // Draw rounded square avatar or circle
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#a5f3fc';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.roundRect(-p.width / 2, -p.height / 2, p.width, p.height, p.width * 0.4);
                ctx.fill();

                // Cute face
                ctx.fillStyle = '#0891b2';
                ctx.shadowBlur = 0;
                // Eyes
                ctx.beginPath(); ctx.arc(-6, -4, 3, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(6, -4, 3, 0, Math.PI * 2); ctx.fill();
                // Mouth depending on velocity
                ctx.beginPath();
                if (p.vy < -8) { // Surprised when rocketing
                    ctx.arc(0, 4, 3, 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.vy < 0) { // Happy jump
                    ctx.arc(0, 2, 4, 0, Math.PI);
                    ctx.stroke();
                } else { // Neutral falling
                    ctx.moveTo(-3, 4); ctx.lineTo(3, 4);
                    ctx.stroke();
                }

                ctx.restore();
            };
            drawPlayer();
            ctx.shadowBlur = 0;

            // Draw particles
            for (let i = particlesRef.current.length - 1; i >= 0; i--) {
                const part = particlesRef.current[i];
                part.x += part.vx;
                part.y += part.vy;
                part.life -= 0.05;
                if (part.life <= 0) {
                    particlesRef.current.splice(i, 1);
                } else {
                    ctx.fillStyle = part.color || `rgba(255, 255, 255, ${part.life})`;
                    ctx.beginPath();
                    ctx.arc(part.x, part.y, 4 * part.life, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

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
        if (clientX - rect.left < rect.width / 2) playerRef.current.vx = -4.5; else playerRef.current.vx = 4.5;
    };
    const handleRelease = () => { playerRef.current.vx = 0; };

    // DYNAMIC BACKGROUND HSL CYCLING based on score
    // Base hue is sky blue (around 200), shift by score
    const hue = (200 + score / 50) % 360;
    // Lightness decreases as score goes up, creating sunset -> night -> space
    // Oscillation equation: 50 + 40 * cos(score / 2000)
    const lightness = 10 + 40 * (1 + Math.cos(score / 500));
    const saturation = 60 + 20 * Math.sin(score / 1000); // 60-80%

    const bgGradient = `linear-gradient(to bottom, hsl(${hue}, ${saturation}%, ${Math.max(5, lightness - 10)}%), hsl(${hue}, ${saturation}%, ${Math.max(10, lightness + 20)}%))`;

    return (
        <div
            className="w-full h-full min-h-[500px] flex flex-col items-center rounded-3xl overflow-hidden relative shadow-[0_0_30px_rgba(56,189,248,0.2)] transition-colors duration-1000"
            style={{ background: bgGradient }}
            onMouseDown={handleTap} onMouseUp={handleRelease} onTouchStart={handleTap} onTouchEnd={handleRelease}
        >
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
