import React, { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import { User } from '../../types';
import { UserService } from '../../services/userService';
import ArcadeAudio from '../../services/arcadeAudio';

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

    // Wave Management State (Visuals only, true state in refs for the loop)
    const [currentWave, setCurrentWave] = useState(1);
    const [waveName, setWaveName] = useState("THE DRIFT");

    const requestRef = useRef<number | undefined>(undefined);
    const targetsRef = useRef<any[]>([]);
    const particlesRef = useRef<any[]>([]);
    const trailsRef = useRef<{ x: number, y: number, life: number }[]>([]);
    const isDrawingRef = useRef(false);
    const lastMouseRef = useRef({ x: 0, y: 0 });
    const slowModeRef = useRef(false);

    // Combo System refs
    const currentComboRef = useRef(0);
    const floatingTextsRef = useRef<{ x: number, y: number, text: string, life: number, color: string }[]>([]);

    // Wave System refs
    const waveIndexRef = useRef(1);
    const framesRef = useRef(0);
    const waveTickRef = useRef(0); // For batch spawning

    const NEGATIVE_WORDS = ["ANXIETY", "DOUBT", "FEAR", "STRESS", "OVERWHELM", "PANIC", "WORRY", "FATIGUE", "BURN OUT", "RUSH"];
    const POSITIVE_WORDS = ["CALM", "PEACE", "HOPE", "REST", "BREATHE", "CLARITY", "ZEN", "FLOW"];
    const POWERUP_WORDS = ["SLOW-MO", "FREEZE", "ZEN"];

    const initGame = () => {
        setScore(0);
        setLives(3);
        setGameOver(false);
        setGameStarted(true);
        setCurrentWave(1);
        setWaveName("THE DRIFT");
        targetsRef.current = [];
        particlesRef.current = [];
        trailsRef.current = [];
        floatingTextsRef.current = [];
        waveIndexRef.current = 1;
        framesRef.current = 0;
        waveTickRef.current = 0;
        currentComboRef.current = 0;
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

        const getDprWidth = () => canvas.width / (window.devicePixelRatio || 1);
        const getDprHeight = () => canvas.height / (window.devicePixelRatio || 1);

        const spawnTarget = (forcedType?: 'negative' | 'positive' | 'powerup', customWord?: string, customVelocityY?: number, isSmall?: boolean) => {
            const W = getDprWidth();
            const H = getDprHeight();
            const rand = Math.random();
            let type: 'negative' | 'positive' | 'powerup';

            if (forcedType) {
                type = forcedType;
            } else {
                const typeRoll = Math.random();
                if (rand > 0.95) type = 'powerup';
                else type = typeRoll > 0.6 ? 'positive' : 'negative'; // Heavy negative bias
            }

            let word = customWord || "";
            if (!word) {
                if (type === 'negative') word = NEGATIVE_WORDS[Math.floor(Math.random() * NEGATIVE_WORDS.length)];
                else if (type === 'positive') word = POSITIVE_WORDS[Math.floor(Math.random() * POSITIVE_WORDS.length)];
                else word = POWERUP_WORDS[Math.floor(Math.random() * POWERUP_WORDS.length)];
            }

            targetsRef.current.push({
                x: W * 0.15 + Math.random() * (W * 0.7),
                y: H + 50,
                vx: (Math.random() - 0.5) * 5,
                vy: customVelocityY || -(Math.random() * 5 + 10), // Jump force
                word,
                type,
                radius: isSmall ? 25 : (type === 'powerup' ? 30 : 40),
                rotation: Math.random() * Math.PI,
                vrot: (Math.random() - 0.5) * 0.1,
                sliced: false
            });
        };

        const createParticles = (x: number, y: number, color: string, intensity: number = 15) => {
            for (let i = 0; i < intensity; i++) {
                particlesRef.current.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 15,
                    vy: (Math.random() - 0.5) * 15,
                    life: 1,
                    color
                });
            }
        };

        const checkSlice = (p1: { x: number, y: number }, p2: { x: number, y: number }) => {
            targetsRef.current.forEach(t => {
                if (t.sliced) return;

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
                        // Penalty
                        setLives(l => {
                            if (l <= 1) setGameOver(true);
                            return l - 1;
                        });
                        currentComboRef.current = 0; // Break combo
                        createParticles(t.x, t.y, '#fcd34d', 20);
                        floatingTextsRef.current.push({ x: t.x, y: t.y, text: "BROKEN", life: 1, color: '#ef4444' });
                        ArcadeAudio.playFail();
                    }
                    else if (t.type === 'powerup') {
                        slowModeRef.current = true;
                        setTimeout(() => slowModeRef.current = false, 5000);
                        setScore(s => s + 100);
                        createParticles(t.x, t.y, '#a855f7', 30);
                        floatingTextsRef.current.push({ x: t.x, y: t.y, text: t.word + "!", life: 1, color: '#c084fc' });
                        ArcadeAudio.playCollect();
                    }
                    else {
                        // Negative hit - Combo builder!
                        currentComboRef.current += 1;
                        const combo = currentComboRef.current;
                        const multi = combo > 4 ? 4 : combo;
                        const pointsEarned = 50 * multi;

                        setScore(s => s + pointsEarned);
                        createParticles(t.x, t.y, combo > 2 ? '#fbbf24' : '#ef4444', 15 + combo * 5);
                        ArcadeAudio.playSlice();

                        if (combo > 1) {
                            floatingTextsRef.current.push({
                                x: t.x, y: t.y,
                                text: `${combo}x COMBO! (+${pointsEarned})`,
                                life: 1,
                                color: combo > 3 ? '#fcd34d' : '#f87171'
                            });
                        }
                    }
                }
            });
        };

        const handlePointerDown = (e: PointerEvent) => {
            isDrawingRef.current = true;
            // Only reset combo if they lifted their finger, so combos require a single stroke
            currentComboRef.current = 0;
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

        const handlePointerUp = () => {
            isDrawingRef.current = false;
        };

        canvas.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);

        // WAVE SYSTEM LOGIC
        const manageWaves = () => {
            const wave = waveIndexRef.current;
            const wTick = waveTickRef.current;

            // Advance Wave based on score thresholds roughly
            if (wave === 1 && score > 1500) {
                waveIndexRef.current = 2;
                setCurrentWave(2);
                setWaveName("THE SWARM");
            } else if (wave === 2 && score > 4000) {
                waveIndexRef.current = 3;
                setCurrentWave(3);
                setWaveName("THE VOID");
            } else if (wave === 3 && score > 8000) {
                waveIndexRef.current = 4;
                setCurrentWave(4);
                setWaveName("ZENITH");
            }

            // Wave Behaviours
            const spawnBase = slowModeRef.current ? 2 : 1;

            if (wave === 1) {
                // The Drift: Relaxed, standard pacing
                if (wTick % (80 * spawnBase) === 0) spawnTarget();
            }
            else if (wave === 2) {
                // The Swarm: Bursts of small negative words
                if (wTick % (120 * spawnBase) === 0) {
                    for (let i = 0; i < 5; i++) spawnTarget('negative', '', -(Math.random() * 4 + 10), true);
                    spawnTarget('positive'); // 1 positive mixed in
                }
                if (wTick % (90 * spawnBase) === 0) spawnTarget(); // Random normal spawner
            }
            else if (wave === 3) {
                // The Void: Fast, Heavy words. 
                if (wTick % (60 * spawnBase) === 0) spawnTarget('negative', 'DOUBT', -16); // Fast jump
                if (wTick % (100 * spawnBase) === 0) spawnTarget('powerup');
            }
            else {
                // Zenith: Pure Chaos
                if (wTick % (40 * spawnBase) === 0) spawnTarget();
                if (wTick % (150 * spawnBase) === 0) {
                    spawnTarget('positive', 'BREATHE', -18);
                    spawnTarget('negative', 'PANIC', -18);
                    spawnTarget('negative', 'PANIC', -18);
                }
            }

            waveTickRef.current++;
        };

        const update = () => {
            const W = getDprWidth();
            const H = getDprHeight();
            framesRef.current++;
            manageWaves(); // Spawning logic

            // Dynamic Synthwave Background shifting per wave
            const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
            if (waveIndexRef.current === 1) {
                bgGrad.addColorStop(0, 'rgba(5, 5, 20, 0.8)');
                bgGrad.addColorStop(1, 'rgba(20, 5, 15, 0.8)');
            } else if (waveIndexRef.current === 2) {
                bgGrad.addColorStop(0, 'rgba(15, 0, 5, 0.8)');
                bgGrad.addColorStop(1, 'rgba(30, 0, 10, 0.9)');
            } else {
                bgGrad.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
                bgGrad.addColorStop(1, 'rgba(10, 0, 15, 0.9)'); // Deep void
            }
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, W, H);

            // Animated Scrolling Grid
            ctx.beginPath();
            ctx.strokeStyle = slowModeRef.current ? 'rgba(168, 85, 247, 0.2)' : 'rgba(34, 211, 238, 0.15)';
            ctx.lineWidth = 1;
            const gridSize = 60;
            const scrollSpeed = slowModeRef.current ? 0.1 : 0.4 + (waveIndexRef.current * 0.1);
            const offsetX = (framesRef.current * scrollSpeed) % gridSize;
            const offsetY = (framesRef.current * scrollSpeed * 2) % gridSize;

            for (let x = -gridSize + offsetX; x < W; x += gridSize) {
                ctx.moveTo(x, 0); ctx.lineTo(x, H);
            }
            for (let y = -gridSize + offsetY; y < H; y += gridSize) {
                ctx.moveTo(0, y); ctx.lineTo(W, y);
            }
            ctx.stroke();

            // Draw Trails with Dynamic Combo Styling
            if (trailsRef.current.length > 1) {
                ctx.beginPath();
                ctx.moveTo(trailsRef.current[0].x, trailsRef.current[0].y);

                // Blade Color based on Combo
                let bladeColor = '#22d3ee'; // Default Cyan
                let shadowColor = '#22d3ee';
                let thickness = 4;

                if (currentComboRef.current === 2) { bladeColor = '#f472b6'; shadowColor = '#db2777'; thickness = 6; } // Pink
                else if (currentComboRef.current === 3) { bladeColor = '#fbbf24'; shadowColor = '#d97706'; thickness = 8; } // Gold
                else if (currentComboRef.current > 3) { bladeColor = '#ffffff'; shadowColor = '#fcd34d'; thickness = 12; } // White/Gold Super

                ctx.strokeStyle = bladeColor;
                ctx.lineWidth = thickness;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.shadowColor = shadowColor;
                ctx.shadowBlur = thickness * 3;

                for (let i = 1; i < trailsRef.current.length; i++) {
                    ctx.lineTo(trailsRef.current[i].x, trailsRef.current[i].y);
                }
                ctx.stroke();

                // Add inner core for high combos
                if (currentComboRef.current > 2) {
                    ctx.beginPath();
                    ctx.moveTo(trailsRef.current[0].x, trailsRef.current[0].y);
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 0;
                    for (let i = 1; i < trailsRef.current.length; i++) ctx.lineTo(trailsRef.current[i].x, trailsRef.current[i].y);
                    ctx.stroke();
                }
                ctx.shadowBlur = 0;
            }

            // Update trails lifecycle
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

                const speedMult = slowModeRef.current ? 0.3 : 1;
                t.x += t.vx * speedMult;
                t.vy += 0.2 * speedMult; // Gravity
                t.y += t.vy * speedMult;
                t.rotation += t.vrot * speedMult;

                ctx.save();
                ctx.translate(t.x, t.y);
                ctx.rotate(t.rotation);

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

                ctx.fillStyle = strokeStyle;
                ctx.font = `bold ${t.radius < 30 ? 12 : 16}px monospace`;
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
                    currentComboRef.current = 0;
                    targetsRef.current.splice(i, 1);
                    ArcadeAudio.playFail();
                } else if (t.y > H + 100) {
                    // Safe cleanup for positive/powerup that pass screen
                    targetsRef.current.splice(i, 1);
                }
            }

            // Draw Floating Texts
            for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
                const ft = floatingTextsRef.current[i];
                ft.y -= 1; // Float up
                ft.life -= 0.02;

                if (ft.life <= 0) {
                    floatingTextsRef.current.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.globalAlpha = ft.life;
                ctx.fillStyle = ft.color;
                ctx.font = 'bold 24px monospace';
                ctx.textAlign = 'center';
                ctx.shadowColor = ft.color;
                ctx.shadowBlur = 10;
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.restore();
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
        <div className="w-full h-full min-h-[500px] flex flex-col items-center bg-black rounded-3xl overflow-hidden relative font-mono shadow-[0_0_50px_rgba(239,68,68,0.1)]">
            {/* HUD */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 pointer-events-none">
                <div className="space-y-1">
                    <div className="text-xl font-bold font-mono text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">SCORE: {score}</div>
                    <div className="text-sm font-mono text-cyan-500/60">HIGH: {highScore}</div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-2 text-2xl">
                        {[...Array(3)].map((_, i) => (
                            <span key={i} className={`transition-all duration-300 ${i < lives ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "text-gray-800 scale-75"}`}>❤️</span>
                        ))}
                    </div>
                    {gameStarted && (
                        <div className="text-xs tracking-widest text-white/50 bg-black/50 px-3 py-1 rounded-full border border-white/10 mt-2">
                            {waveName}
                        </div>
                    )}
                </div>
            </div>

            <canvas ref={canvasRef} className="w-full h-full absolute inset-0 touch-none cursor-crosshair" />

            {!gameStarted && !gameOver && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-8 text-center z-20 backdrop-blur-md">
                    <h2 className="text-5xl font-black text-red-500 tracking-widest mb-2 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] font-mono">STRESS SLICER</h2>
                    <h3 className="text-sky-400 tracking-[0.5em] text-sm mb-6 uppercase">Wave Edition</h3>
                    <p className="text-gray-400 max-w-sm mb-8 leading-relaxed">
                        Stroke aggressively to slice anxiety. <br />
                        <span className="text-cyan-400 font-bold">Build combos</span> in a single slice for multipliers. <br />
                        Avoid the golden flow orbs to survive.
                    </p>
                    <button
                        onClick={initGame}
                        className="px-8 py-4 bg-red-500 hover:bg-red-400 text-black font-black rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] flex items-center gap-3 font-mono tracking-widest"
                    >
                        <Play className="w-6 h-6 fill-current" />
                        ENGAGE
                    </button>
                </div>
            )}

            {gameOver && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-8 text-center z-20 backdrop-blur-lg">
                    <h2 className="text-6xl font-black text-white mb-2 font-mono drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]">FRAGMENTED</h2>
                    <div className="text-sm tracking-[0.3em] text-red-500 uppercase mb-6">Wave Reached: {currentWave} ({waveName})</div>

                    <div className="text-3xl text-cyan-400 mb-10 font-mono font-bold bg-cyan-950/30 px-8 py-4 rounded-2xl border border-cyan-500/30">
                        FINAL SCORE: {score}
                    </div>

                    <button
                        onClick={initGame}
                        className="px-8 py-4 bg-transparent border-2 border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black font-black font-mono tracking-widest rounded-xl transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] flex items-center gap-3 hover:scale-105"
                    >
                        <Play className="w-5 h-5 fill-current" />
                        RE-ENTER FLOW
                    </button>
                </div>
            )}
        </div>
    );
};

export default StressSlicerGame;
