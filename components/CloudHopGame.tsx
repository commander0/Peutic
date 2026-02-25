import { Play } from 'lucide-react';
import { User } from '../types';
import { UserService } from '../services/userService';
import ArcadeAudio from '../services/arcadeAudio';

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
    const particlesRef = useRef<any[]>([]);

    // Parallax background elements
    const parallaxRef = useRef<{ x: number, y: number, size: number, speed: number, type: 'star' | 'cloud' }[]>([]);

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
        const cloudGap = isMobile ? 60 : (W > 800 ? 50 : 70);

        while (py > -12000) {
            const typeRand = Math.random();
            const platformType = typeRand > 0.98 ? 'jetpack' : (typeRand > 0.82 ? 'spring' : (typeRand > 0.65 ? 'moving' : 'cloud'));

            platformsRef.current.push({
                x: Math.random() * (W - basePlatW),
                y: py,
                w: basePlatW + Math.random() * (isMobile ? 20 : 30),
                h: isMobile ? 12 : 15,
                type: platformType,
                vx: Math.random() > 0.5 ? 1 : -1,
                hasStar: Math.random() > 0.85,
                starCollected: false
            });

            if (W > 800 && Math.random() > 0.3) {
                const typeRand2 = Math.random();
                platformsRef.current.push({
                    x: Math.random() * (W - basePlatW),
                    y: py + (Math.random() * 30 - 15),
                    w: basePlatW + Math.random() * 30,
                    h: 15,
                    type: typeRand2 > 0.98 ? 'jetpack' : (typeRand2 > 0.82 ? 'spring' : (typeRand2 > 0.65 ? 'moving' : 'cloud')),
                    vx: Math.random() > 0.5 ? 1 : -1,
                    hasStar: Math.random() > 0.85,
                    starCollected: false
                });
            }
            py -= cloudGap + Math.random() * 25;
        }

        // Init Parallax
        parallaxRef.current = [];
        for (let i = 0; i < 30; i++) {
            parallaxRef.current.push({
                x: Math.random() * W,
                y: Math.random() * H,
                size: 1 + Math.random() * 3,
                speed: 0.1 + Math.random() * 0.3,
                type: Math.random() > 0.5 ? 'star' : 'cloud'
            });
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
            if (type === 'spring') ctx.fillStyle = '#4ade80';
            else if (type === 'moving') ctx.fillStyle = '#E0F2FE';
            else if (type === 'jetpack') ctx.fillStyle = '#f43f5e';
            else ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

            if (type === 'moving') ctx.shadowColor = '#38BDF8';
            if (type === 'spring') ctx.shadowColor = '#22c55e';
            if (type === 'jetpack') ctx.shadowColor = '#fb7185';
            else ctx.shadowColor = 'rgba(255,255,255,0.4)';
            ctx.shadowBlur = 10;

            ctx.fillRect(x, y, w, h);

            if (type === 'jetpack') {
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath(); ctx.arc(x + w / 2, y - 10, 10, 0, Math.PI * 2); ctx.fill();
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                return;
            }

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

            // LERP CAMERA SMOOTHING
            const targetY = H * 0.45; // camera target height
            if (p.y < targetY) {
                const diff = (targetY - p.y) * 0.15; // smooth lerp factor
                p.y += diff;
                currentScoreRef.current += diff;
                setScore(Math.floor(currentScoreRef.current));

                platformsRef.current.forEach(pl => {
                    pl.y += diff;
                    // Recycle platforms out of bounds
                    if (pl.y > H + 50) {
                        pl.y = -20;
                        pl.x = Math.random() * (W - (isMobile ? 50 : 70));
                        const typeRand = Math.random();
                        pl.type = typeRand > 0.98 ? 'jetpack' : (typeRand > 0.82 ? 'spring' : (typeRand > 0.65 ? 'moving' : 'cloud'));
                        pl.hasStar = Math.random() > 0.85;
                        pl.starCollected = false;
                    }
                });

                // Move Parallax Layers
                parallaxRef.current.forEach(pr => {
                    pr.y += diff * pr.speed;
                    if (pr.y > H) {
                        pr.y = -10;
                        pr.x = Math.random() * W;
                    }
                });
            }

            // Star Collection
            platformsRef.current.forEach(pl => {
                if (pl.hasStar && !pl.starCollected) {
                    const sx = pl.x + pl.w / 2;
                    const sy = pl.y - 25;
                    const dist = Math.hypot(p.x + p.width / 2 - sx, p.y + p.height / 2 - sy);
                    if (dist < 35) {
                        pl.starCollected = true;
                        currentScoreRef.current += 500;
                        setScore(Math.floor(currentScoreRef.current));
                        ArcadeAudio.playCollect();
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

            // Jumping Physics
            if (p.vy > 0) {
                platformsRef.current.forEach(pl => {
                    if (p.y + p.height >= pl.y && p.y + p.height <= pl.y + 40 && p.x + p.width > pl.x && p.x < pl.x + pl.w) {
                        p.vy = pl.type === 'jetpack' ? JUMP_FORCE * 2.8 : (pl.type === 'spring' ? JUMP_FORCE * 1.6 : JUMP_FORCE);
                        p.y = pl.y - p.height; // Lock to platform exactly for visual snappiness
                        ArcadeAudio.playJump();

                        const cColor = pl.type === 'jetpack' ? '#f43f5e' : (pl.type === 'spring' ? '#4ade80' : '#ffffff');
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

            if (p.y > H + p.height) {
                setGameOver(true);
                setGameStarted(false);
                ArcadeAudio.playFail();
                if (requestRef.current !== undefined) cancelAnimationFrame(requestRef.current);
                return;
            }

            // DYNAMIC HSL BACKGROUND
            const currentScore = currentScoreRef.current;
            let hue = (200 + currentScore / 50) % 360;
            let lightnessTop = Math.max(5, 60 - currentScoreRef.current / 150);
            let lightnessBot = Math.max(10, 80 - currentScoreRef.current / 150);
            let saturation = 60 + 20 * Math.sin(currentScore / 1000);

            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightnessTop}%)`);
            grad.addColorStop(1, `hsl(${hue}, ${saturation}%, ${lightnessBot}%)`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            // Draw Parallax
            parallaxRef.current.forEach(pr => {
                ctx.fillStyle = pr.type === 'star' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.15)';
                ctx.beginPath();
                if (pr.type === 'star') {
                    ctx.arc(pr.x, pr.y, pr.size, 0, Math.PI * 2);
                } else {
                    ctx.arc(pr.x, pr.y, pr.size * 10, 0, Math.PI * 2);
                    ctx.arc(pr.x + 10, pr.y + 5, pr.size * 8, 0, Math.PI * 2);
                }
                ctx.fill();
            });

            // Draw Platforms
            platformsRef.current.forEach(pl => {
                if (pl.type === 'ground') { ctx.fillStyle = '#4ade80'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h); }
                else { drawCloud(pl.x, pl.y, pl.w, pl.h, pl.type); }

                if (pl.hasStar && !pl.starCollected && pl.type !== 'ground') {
                    ctx.fillStyle = '#fde047';
                    ctx.shadowColor = '#fcd34d';
                    ctx.shadowBlur = 15;
                    ctx.beginPath();
                    // Draw Star Polygon
                    const cx = pl.x + pl.w / 2;
                    const cy = pl.y - 25;
                    const rot = Math.PI / 2 * 3;
                    let x = cx, y = cy;
                    const step = Math.PI / 5;
                    ctx.moveTo(cx, cy - 8);
                    for (let i = 0; i < 5; i++) {
                        x = cx + Math.cos(rot + step * i * 2) * 8;
                        y = cy + Math.sin(rot + step * i * 2) * 8;
                        ctx.lineTo(x, y);
                        x = cx + Math.cos(rot + step * (i * 2 + 1)) * 4;
                        y = cy + Math.sin(rot + step * (i * 2 + 1)) * 4;
                        ctx.lineTo(x, y);
                    }
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            });

            // Draw Player Context (Lumina Pet)
            const drawPlayer = () => {
                ctx.save();
                ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
                ctx.rotate(p.vx * 0.08);

                // Glow Aura
                ctx.shadowColor = '#60a5fa';
                ctx.shadowBlur = 20;

                // Lumina Core
                const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.width / 2);
                coreGradient.addColorStop(0, '#ffffff');
                coreGradient.addColorStop(0.5, '#bae6fd');
                coreGradient.addColorStop(1, '#0ea5e9');

                ctx.fillStyle = coreGradient;
                ctx.beginPath();
                ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
                ctx.fill();

                // Adorable Pet Face
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#082f49'; // Dark navy for eyes

                // Eyes
                const lookOffsetX = p.vx * 0.5;
                const lookOffsetY = p.vy < 0 ? -2 : 2;
                ctx.beginPath(); ctx.arc(-5 + lookOffsetX, -3 + lookOffsetY, 2.5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(5 + lookOffsetX, -3 + lookOffsetY, 2.5, 0, Math.PI * 2); ctx.fill();

                // Cute little mouth
                ctx.beginPath();
                if (p.vy < -8) { // Jetpacking - wide mouth
                    ctx.arc(lookOffsetX, 3 + lookOffsetY, 3, 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.vy < 0) { // Happy jump - smile
                    ctx.arc(lookOffsetX, 1 + lookOffsetY, 4, 0, Math.PI);
                    ctx.stroke();
                } else { // Falling/Neutral - straight dash
                    ctx.moveTo(-2 + lookOffsetX, 3 + lookOffsetY);
                    ctx.lineTo(2 + lookOffsetX, 3 + lookOffsetY);
                    ctx.lineWidth = 1.5;
                    ctx.strokeStyle = '#082f49';
                    ctx.stroke();
                }

                // If jetpacking, add thruster flames beneath
                if (p.vy < -15) {
                    ctx.fillStyle = '#f97316';
                    ctx.beginPath();
                    ctx.moveTo(-6, p.height / 2);
                    ctx.lineTo(6, p.height / 2);
                    ctx.lineTo(0, p.height / 2 + 15 + Math.random() * 10); // flickering tip
                    ctx.fill();
                }

                ctx.restore();
            };
            drawPlayer();

            // Draw Particles
            for (let i = particlesRef.current.length - 1; i >= 0; i--) {
                const part = particlesRef.current[i];
                part.x += part.vx;
                part.y += part.vy;
                part.life -= 0.05;
                if (part.life <= 0) {
                    particlesRef.current.splice(i, 1);
                } else {
                    ctx.fillStyle = part.color || `rgba(255, 255, 255, ${part.life})`;
                    ctx.globalAlpha = part.life;
                    ctx.beginPath();
                    ctx.arc(part.x, part.y, 4 * part.life, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
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
