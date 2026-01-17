import React, { useState, useEffect, useRef } from 'react';
import { User, Companion, Transaction, JournalEntry, ArtEntry } from '../types';
import {
    Video, Clock, Settings, LogOut,
    LayoutDashboard, Plus, X, Lock, CheckCircle, AlertTriangle, ShieldCheck, Heart,
    BookOpen, Save, Sparkles, Flame, Trophy,
    Sun, Cloud, Feather, Anchor, RefreshCw, Play, Zap, Star, Edit2, Trash2, Bell,
    CloudRain, Download, Lightbulb, Moon,
    LifeBuoy, Volume2, Music, Smile, Trees,
    StopCircle, Minimize2, Flame as Fire
} from 'lucide-react';
import { STABLE_AVATAR_POOL } from '../services/database';
import { UserService } from '../services/userService';
import { AdminService } from '../services/adminService';
import { useToast } from './common/Toast';
import { CompanionSkeleton } from './common/SkeletonLoader';

import { NameValidator } from '../services/nameValidator';

import { generateDailyInsight } from '../services/geminiService';

import { WisdomEngine } from '../services/wisdomEngine';
import TechCheck from './TechCheck';
import GroundingMode from './GroundingMode';

interface DashboardProps {
    user: User;
    onLogout: () => void;
    onStartSession: (companion: Companion) => void;
}

// Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY || '';

declare global {
    interface Window {
        Stripe?: any;
        webkitAudioContext?: typeof AudioContext;
    }
}

const INSPIRATIONAL_SAYINGS = [
    "The only way out is through.",
    "You are stronger than you think.",
    "Small steps lead to big changes.",
    "Peace is a journey, not a destination.",
    "Be kind to your mind.",
    "You deserve to take up space.",
    "Rest is not a luxury, it's a necessity.",
    "Your feelings are valid.",
    "You are worthy of love and respect.",
    "Breathe. You are here.",
    "You don't have to be perfect to be amazing.",
    "Growth takes time. Be patient with yourself.",
    "Your potential is limitless.",
    "Today is a new opportunity for peace.",
    "Kindness starts with you."
];

const AvatarImage: React.FC<{ src: string; alt: string; className?: string; isUser?: boolean }> = ({ src, alt, className, isUser = false }) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (src && src.length > 10) {
            setImgSrc(src);
            setHasError(false);
        } else {
            setHasError(true);
        }
    }, [src]);

    if (hasError || !imgSrc) {
        if (isUser) {
            return (
                <div className={`bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center ${className}`}>
                    <Smile className="w-3/5 h-3/5 text-yellow-600 dark:text-yellow-400" />
                </div>
            );
        }
        let hash = 0;
        for (let i = 0; i < alt.length; i++) hash = alt.charCodeAt(i) + ((hash << 5) - hash);
        const index = Math.abs(hash) % STABLE_AVATAR_POOL.length;
        return <img src={STABLE_AVATAR_POOL[index]} alt={alt} className={className} loading="lazy" />;
    }

    return <img src={imgSrc} alt={alt} className={className} onError={() => setHasError(true)} loading="lazy" />;
};



const WisdomGenerator: React.FC<{ userId: string, onUpdate?: () => void }> = ({ userId, onUpdate }) => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [gallery, setGallery] = useState<ArtEntry[]>([]);
    const { showToast } = useToast();


    const refreshGallery = async () => {
        const art = await UserService.getUserArt(userId);
        setGallery(art);
    };


    useEffect(() => { refreshGallery(); }, [userId]);

    const handleGenerate = async () => {
        if (!input.trim()) return;
        setLoading(true);
        try {
            // Simulated delay for premium feel
            await new Promise(resolve => setTimeout(resolve, 800));

            // Use internal WisdomEngine instead of external API
            const wisdom = WisdomEngine.generate(input);

            const canvas = document.createElement('canvas');
            canvas.width = 1080; canvas.height = 1080;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const hue = Math.floor(Math.random() * 360);
                const grd = ctx.createLinearGradient(0, 0, 1080, 1080);
                grd.addColorStop(0, `hsl(${hue}, 40%, 95%)`);
                grd.addColorStop(1, `hsl(${(hue + 40) % 360}, 30%, 90%)`);
                ctx.fillStyle = grd; ctx.fillRect(0, 0, 1080, 1080);
                ctx.fillStyle = `hsla(${hue}, 60%, 80%, 0.2)`;
                ctx.beginPath(); ctx.arc(540, 540, 400, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#1a1a1a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                const words = wisdom.split(' ');
                let fontSize = 80; if (words.length > 15) fontSize = 60;
                ctx.font = `bold ${fontSize}px Manrope, sans-serif`;
                const maxWidth = 800; const lineHeight = fontSize * 1.4;
                let lines = []; let currentLine = words[0];
                for (let i = 1; i < words.length; i++) {
                    const testLine = currentLine + ' ' + words[i];
                    if (ctx.measureText(testLine).width > maxWidth) { lines.push(currentLine); currentLine = words[i]; } else { currentLine = testLine; }
                }
                lines.push(currentLine);
                let y = 540 - ((lines.length - 1) * lineHeight) / 2;
                lines.forEach(line => { ctx.fillText(line, 540, y); y += lineHeight; });
                ctx.font = '500 30px Manrope, sans-serif'; ctx.fillStyle = '#666'; ctx.fillText('PEUTIC • DAILY WISDOM', 540, 980);

                const imageUrl = canvas.toDataURL('image/jpeg', 0.4);
                // Use simple random ID generation for browser compatibility if crypto.randomUUID isn't available in all contexts
                const newId = `wisdom_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

                const newEntry: ArtEntry = { id: newId, userId: userId, imageUrl: imageUrl, prompt: input, createdAt: new Date().toISOString(), title: "Wisdom Card" };

                await UserService.saveArt(newEntry);
                await refreshGallery();
                if (onUpdate) onUpdate();
                setInput('');
            }

        } catch (e: any) {
            console.error("Critical Generation Error:", e);
            showToast("Failed to save Wisdom Art: " + (e.message || "Unknown error"), "error");

        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm("Delete this card?")) { await UserService.deleteArt(id); await refreshGallery(); }
    };


    return (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-yellow-100 dark:border-gray-800 p-4 md:p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg"><Lightbulb className="w-4 h-4 text-purple-600 dark:text-purple-400" /></div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Get Clarity</h3>
            </div>
            <div className="space-y-3">
                <textarea className="w-full h-20 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-sm focus:border-purple-400 dark:text-white outline-none resize-none transition-all" placeholder="What's weighing on your mind?" value={input} onChange={(e) => setInput(e.target.value)} />
                <button onClick={handleGenerate} disabled={loading || !input} className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${loading || !input ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-purple-600 text-white hover:bg-purple-500 hover:shadow-md'}`}>
                    {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} {loading ? 'Finding Clarity...' : 'Reframe Thought'}
                </button>
                {gallery.length > 0 && (
                    <div className="mt-4 space-y-3">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Cards ({gallery.length})</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {gallery.map((art: ArtEntry) => (
                                <div key={art.id} className="relative group aspect-square bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm animate-in zoom-in duration-300">
                                    <img src={art.imageUrl} alt="Wisdom Card" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button onClick={(e) => handleDelete(e, art.id)} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors" title="Delete"><Trash2 className="w-3 h-3" /></button>
                                        <a href={art.imageUrl} download={`wisdom-${art.id}.jpg`} onClick={(e) => e.stopPropagation()} className="p-2 bg-white hover:bg-gray-100 text-black rounded-full shadow-lg transition-colors" title="Download"><Download className="w-3 h-3" /></a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const SoundscapePlayer: React.FC = () => {
    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(0.4);
    const [track, setTrack] = useState<'rain' | 'forest' | 'ocean' | 'fire'>('rain');
    const [minimized, setMinimized] = useState(true);
    const audioRef = useRef<HTMLAudioElement>(null);
    const SOUND_URLS = {
        rain: 'https://assets.mixkit.co/active_storage/sfx/2393/2393-preview.mp3',
        forest: 'https://assets.mixkit.co/active_storage/sfx/1210/1210-preview.mp3',
        ocean: 'https://assets.mixkit.co/active_storage/sfx/1196/1196-preview.mp3',
        fire: 'https://assets.mixkit.co/active_storage/sfx/1330/1330-preview.mp3'
    };

    useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (playing) { audio.play().catch(console.warn); }
        else { audio.pause(); }
    }, [playing]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.load();
        if (playing) audio.play().catch(console.warn);
    }, [track]);

    return (
        <div className={`fixed bottom-6 right-6 z-[80] transition-all duration-500 ease-in-out bg-[#FFFBEB] dark:bg-gray-900 border border-yellow-300 dark:border-yellow-600 shadow-2xl overflow-hidden ${minimized ? 'w-12 h-12 rounded-full' : 'w-72 rounded-3xl p-4'}`}>
            <audio ref={audioRef} src={SOUND_URLS[track]} loop crossOrigin="anonymous" />
            {minimized ? (
                <button onClick={() => setMinimized(false)} className={`w-full h-full flex items-center justify-center text-black hover:scale-110 transition-transform ${playing ? 'bg-yellow-400 animate-pulse' : 'bg-yellow-500'}`}>
                    <Music className="w-5 h-5" />
                </button>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-yellow-400 dark:bg-yellow-600 rounded-lg flex items-center justify-center shadow-sm">
                                <Music className="w-4 h-4 text-black dark:text-white" />
                            </div>
                            <span className="font-black text-sm text-gray-900 dark:text-white tracking-tight">SOUNDSCAPE</span>
                        </div>
                        <button onClick={() => setMinimized(true)} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"><Minimize2 className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { key: 'rain', label: 'Rain', icon: CloudRain }, { key: 'forest', label: 'Nature', icon: Trees },
                            { key: 'ocean', label: 'Ocean', icon: Anchor }, { key: 'fire', label: 'Fire', icon: Fire }
                        ].map((item) => (
                            <button key={item.key} onClick={() => setTrack(item.key as any)} className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${track === item.key ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg scale-105' : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-yellow-100 dark:hover:bg-gray-700 border border-yellow-100 dark:border-gray-700'}`}>
                                <item.icon className={`w-4 h-4 mb-1 ${track === item.key ? 'text-yellow-400 dark:text-yellow-600' : ''}`} />
                                <span className="text-[9px] font-bold uppercase">{item.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setPlaying(!playing)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${playing ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300'}`}>{playing ? <Volume2 className="w-6 h-6" /> : <Play className="w-5 h-5 ml-1" />}</button>
                        <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className="flex-1 h-2 bg-yellow-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-black dark:accent-yellow-500" />
                    </div>
                </div>
            )}
        </div>
    );
};

const WeatherEffect: React.FC<{ type: 'confetti' | 'rain' }> = ({ type }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
        const particles: any[] = []; const particleCount = type === 'confetti' ? 150 : 400;
        const CONFETTI_COLORS = ['#FACC15', '#FFD700', '#F87171', '#60A5FA', '#4ADE80']; const RAIN_COLOR = '#60A5FA';
        for (let i = 0; i < particleCount; i++) {
            particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height - canvas.height, vx: type === 'confetti' ? (Math.random() - 0.5) * 10 : 0, vy: type === 'confetti' ? Math.random() * 5 + 2 : Math.random() * 15 + 10, color: type === 'confetti' ? CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] : RAIN_COLOR, size: type === 'confetti' ? Math.random() * 8 + 4 : Math.random() * 2 + 1, length: type === 'rain' ? Math.random() * 20 + 10 : 0, rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 10 });
        }
        let animationFrameId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => {
                p.x += p.vx; p.y += p.vy;
                if (type === 'confetti') { p.vy += 0.1; p.rotation += p.rotationSpeed; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.rotation * Math.PI) / 180); ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); ctx.restore(); }
                else { ctx.strokeStyle = p.color; ctx.lineWidth = p.size; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + p.length); ctx.stroke(); }
                if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; if (type === 'confetti') { p.vy = Math.random() * 5 + 2; p.vx = (Math.random() - 0.5) * 10; } }
            });
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();
        return () => { cancelAnimationFrame(animationFrameId); };
    }, [type]);
    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[50]" />;
};

const MindfulMatchGame: React.FC<{ dashboardUser: User }> = ({ dashboardUser }) => {
    const [cards, setCards] = useState<any[]>([]);
    const [flipped, setFlipped] = useState<number[]>([]);
    const [solved, setSolved] = useState<number[]>([]);
    const [won, setWon] = useState(false);
    const [moves, setMoves] = useState(0);
    const [bestScore, setBestScore] = useState(() => {
        return dashboardUser?.gameScores?.match || 0;
    });
    const ICONS = [Sun, Heart, Music, Zap, Star, Anchor, Feather, Cloud];
    useEffect(() => { initGame(); }, []);
    const initGame = () => {
        const duplicated = [...ICONS, ...ICONS];
        const shuffled = duplicated.sort(() => Math.random() - 0.5).map((icon, i) => ({ id: i, icon }));
        setCards(shuffled);
        setFlipped([]);
        setSolved([]);
        setWon(false);
        setMoves(0);
    };
    const handleCardClick = (index: number) => {
        if (flipped.length === 2 || solved.includes(index) || flipped.includes(index)) return;
        const newFlipped = [...flipped, index];
        setFlipped(newFlipped);
        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            const card1 = cards[newFlipped[0]];
            const card2 = cards[newFlipped[1]];
            if (card1.icon === card2.icon) {
                setSolved([...solved, newFlipped[0], newFlipped[1]]);
                setFlipped([]);
            } else {
                setTimeout(() => setFlipped([]), 1000);
            }
        }
    };
    useEffect(() => {
        if (cards.length > 0 && solved.length === cards.length) {
            setWon(true);
            if (bestScore === 0 || moves < bestScore) {
                setBestScore(moves);
                if (dashboardUser && dashboardUser.id) {
                    UserService.updateGameScore(dashboardUser.id, 'match', moves);
                }

            }
        }
    }, [solved]);
    return (
        <div className="bg-gradient-to-br from-yellow-50/50 to-white dark:from-gray-800 dark:to-gray-900 w-full h-full flex flex-col rounded-2xl p-4 border border-yellow-100 dark:border-gray-700 overflow-hidden relative shadow-inner items-center justify-center">
            <div className="absolute top-3 left-4 z-20 flex gap-2"><span className="text-[10px] font-bold bg-white/50 dark:bg-black/50 px-2 py-1 rounded-full text-gray-500">Moves: {moves}</span>{bestScore > 0 && <span className="text-[10px] font-bold bg-yellow-100 dark:bg-yellow-900/50 px-2 py-1 rounded-full text-yellow-700 dark:text-yellow-500">Best: {bestScore}</span>}</div>
            <button onClick={initGame} className="absolute top-3 right-3 p-2 hover:bg-yellow-100 dark:hover:bg-gray-700 rounded-full transition-colors z-20"><RefreshCw className="w-4 h-4 text-yellow-600 dark:text-yellow-400" /></button>
            {won ? (<div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in"><Trophy className="w-16 h-16 text-yellow-500 mb-4 animate-bounce" /><p className="font-black text-2xl text-yellow-900 dark:text-white">Zen Master!</p><p className="text-sm text-gray-500 mb-6">Completed in {moves} moves</p><button onClick={initGame} className="bg-black dark:bg-white dark:text-black text-white px-8 py-3 rounded-full font-bold text-sm hover:scale-105 transition-transform">Replay</button></div>) : (
                <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-px p-0.5">
                    {cards.map((card, i) => { const isVisible = flipped.includes(i) || solved.includes(i); const Icon = card.icon; return (<div key={i} className="perspective-1000 w-full h-full"><button onClick={() => handleCardClick(i)} className={`w-full h-full rounded-xl flex items-center justify-center transition-all duration-500 transform-style-3d ${isVisible ? 'bg-white dark:bg-gray-700 border-2 border-yellow-400 shadow-lg rotate-y-180' : 'bg-gray-900 dark:bg-gray-800 shadow-md'}`}>{isVisible ? <Icon className="w-5 h-5 md:w-8 md:h-8 text-yellow-500 animate-in zoom-in" /> : <div className="w-2 h-2 bg-gray-700 rounded-full"></div>}</button></div>); })}
                </div>
            )}
        </div>
    );
};

const CloudHopGame: React.FC<{ dashboardUser: User }> = ({ dashboardUser }) => {
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
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, '#0EA5E9');
            grad.addColorStop(1, '#BAE6FD');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            for (let i = 0; i < 10; i++) ctx.fillRect((i * 50 + Date.now() / 50) % W, (i * 30 + Date.now() / 20) % H, 2, 2);
            platformsRef.current.forEach(pl => {
                if (pl.type === 'ground') { ctx.fillStyle = '#4ade80'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h); }
                else { drawCloud(pl.x, pl.y, pl.w, pl.h, pl.type); }
            });
            ctx.shadowBlur = 10; ctx.shadowColor = 'white';
            ctx.fillStyle = '#FACC15';
            ctx.beginPath(); ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width / 2, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0; ctx.fillStyle = 'black';
            const eyeOff = p.width * 0.2;
            const eyeSize = p.width * 0.1;
            // Left Eye
            ctx.beginPath(); ctx.arc(p.x + p.width / 2 - eyeOff, p.y + p.height / 2 - eyeOff, eyeSize, 0, Math.PI * 2); ctx.fill();
            // Right Eye
            ctx.beginPath(); ctx.arc(p.x + p.width / 2 + eyeOff, p.y + p.height / 2 - eyeOff, eyeSize, 0, Math.PI * 2); ctx.fill();
            // Mouth
            ctx.beginPath(); ctx.arc(p.x + p.width / 2, p.y + p.height / 2 + eyeOff / 2, eyeOff * 0.8, 0, Math.PI);
            ctx.lineWidth = 2; ctx.strokeStyle = 'black'; ctx.stroke();
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
        <div className="relative h-full w-full bg-sky-300 overflow-hidden rounded-2xl border-4 border-white dark:border-gray-700 shadow-inner cursor-pointer" onMouseDown={handleTap} onMouseUp={handleRelease} onTouchStart={handleTap} onTouchEnd={handleRelease}><div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-black text-white text-base md:text-lg z-10">{score}m</div>
            {highScore > 0 && <div className="absolute top-2 left-2 bg-yellow-400/20 backdrop-blur-sm px-3 py-1 rounded-full font-black text-white text-xs md:text-sm z-10 border border-yellow-400/50">Best: {highScore}</div>}
            <canvas ref={canvasRef} className="w-full h-full block" />{(!gameStarted || gameOver) && (<div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20 animate-in fade-in"><div className="text-center">{gameOver && <p className="text-white font-black text-2xl mb-4 drop-shadow-md">Fall!</p>}<button onClick={initGame} className="bg-yellow-400 text-yellow-900 px-6 py-2 md:px-8 md:py-3 rounded-full font-black text-sm md:text-lg shadow-xl hover:scale-110 transition-transform flex items-center gap-2"><Play className="w-4 h-4 md:w-5 md:h-5 fill-current" /> {gameOver ? 'Try Again' : 'Play'}</button></div></div>)}</div>
    );
};

const MoodTracker: React.FC<{ onMoodSelect: (m: 'confetti' | 'rain' | null) => void }> = ({ onMoodSelect }) => {
    return (
        <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-yellow-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
            <div>
                <h3 className="font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest mb-1">Current Vibe</h3>
                <p className="text-gray-900 dark:text-white font-bold text-base mb-3">How does the world feel?</p>
            </div>
            <div className="flex gap-2">
                <button onClick={() => onMoodSelect('confetti')} className="flex-1 py-2.5 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 rounded-xl font-bold text-xs md:text-sm transition-colors flex flex-col items-center justify-center gap-1 group">
                    <Sun className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                    <span className="md:hidden lg:inline">Celebration</span>
                </button>
                <button onClick={() => onMoodSelect(null)} className="py-2.5 px-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors flex items-center justify-center group" title="Reset">
                    <StopCircle className="w-4 h-4 text-gray-500 group-hover:text-black dark:group-hover:text-white" />
                </button>
                <button onClick={() => onMoodSelect('rain')} className="flex-1 py-2.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-xs md:text-sm transition-colors flex flex-col items-center justify-center gap-1 group">
                    <CloudRain className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="md:hidden lg:inline">Melancholy</span>
                </button>
            </div>
        </div>
    );
};

const JournalSection: React.FC<{ user: User, onUpdate?: () => void }> = ({ user, onUpdate }) => {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [content, setContent] = useState('');
    const [saved, setSaved] = useState(false);
    useEffect(() => {
        UserService.getJournals(user.id).then(setEntries);
    }, [user.id]);
    const handleSave = () => { if (!content.trim()) return; const entry: JournalEntry = { id: `j_${Date.now()}`, userId: user.id, date: new Date().toISOString(), content: content }; UserService.saveJournal(entry).then(() => { setEntries([entry, ...entries]); setContent(''); setSaved(true); if (onUpdate) onUpdate(); setTimeout(() => setSaved(false), 2000); }); };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 h-[450px]">
            <div className="flex flex-col h-full bg-[#fdfbf7] dark:bg-[#1a1a1a] rounded-2xl p-5 border border-yellow-200 dark:border-gray-800 shadow-inner relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400 opacity-50"></div>
                <div className="flex items-center justify-between mb-4"><span className="text-xs font-black text-gray-400 uppercase tracking-widest">Entry: {new Date().toLocaleDateString()}</span><div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div></div>
                <textarea className="flex-1 w-full bg-transparent dark:text-gray-200 p-0 border-none focus:ring-0 outline-none resize-none text-base leading-relaxed placeholder:text-gray-300 dark:placeholder:text-gray-700 font-medium" placeholder="What's on your mind today? Start writing..." value={content} onChange={e => setContent(e.target.value)} style={{ backgroundImage: 'linear-gradient(transparent 95%, #e5e7eb 95%)', backgroundSize: '100% 2rem', lineHeight: '2rem' }}></textarea>
                <div className="mt-4 flex justify-end"><button onClick={handleSave} className={`bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full font-bold text-xs hover:scale-105 transition-all shadow-lg flex items-center gap-2 ${!content.trim() ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!content.trim()}>{saved ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Save className="w-3 h-3" />}{saved ? "Saved" : "Save Note"}</button></div>
            </div>
            <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex justify-between items-center"><h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider flex items-center gap-2"><Clock className="w-3 h-3" /> Timeline</h3><span className="text-[10px] font-bold bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300">{entries.length} Entries</span></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-yellow-200 dark:scrollbar-thumb-gray-700">
                    {entries.length === 0 && (<div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50"><BookOpen className="w-10 h-10 mb-2 stroke-1" /><p className="text-xs">Your story begins here.</p></div>)}
                    {entries.map(entry => (<div key={entry.id} className="group p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-yellow-400 dark:hover:border-yellow-600 transition-all cursor-default shadow-sm hover:shadow-md"><div className="flex justify-between items-start mb-1.5"><span className="text-[9px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-wide bg-yellow-50 dark:bg-yellow-900/20 px-1.5 py-0.5 rounded-md">{new Date(entry.date).toLocaleDateString()}</span><span className="text-[9px] text-gray-400 font-mono">{new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div><p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed font-medium group-hover:text-black dark:group-hover:text-white transition-colors">{entry.content}</p></div>))}
                </div>
            </div>
        </div >
    );
};

const PaymentModal: React.FC<{ onClose: () => void, onSuccess: (mins: number, cost: number, token?: string) => void, initialError?: string }> = ({ onClose, onSuccess, initialError }) => {
    const [amount, setAmount] = useState(20);
    const [isCustom, setIsCustom] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(initialError || '');
    const settings = AdminService.getSettings();

    const pricePerMin = settings.saleMode ? 1.59 : 1.99;
    const stripeRef = useRef<any>(null);
    const elementsRef = useRef<any>(null);
    const cardElementRef = useRef<any>(null);
    const mountNodeRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY.startsWith('sk_')) {
            console.error("CRITICAL: VITE_STRIPE_PUBLISHABLE_KEY is missing or invalid. Must start with pk_");
            setError("Payment system not configured. Add VITE_STRIPE_PUBLISHABLE_KEY (starts with pk_) to .env file.");
            return;
        }
        if (!window.Stripe) {
            console.error("CRITICAL: Stripe.js script not loaded in window.");
            setError("Stripe failed to load. Please check your internet connection and refresh.");
            return;
        }
        if (!stripeRef.current) {
            try {
                console.log("Initializing Stripe with key:", STRIPE_PUBLISHABLE_KEY.substring(0, 8) + "...");
                stripeRef.current = window.Stripe(STRIPE_PUBLISHABLE_KEY);
                elementsRef.current = stripeRef.current.elements();
                const style = { base: { color: "#32325d", fontFamily: '"Manrope", sans-serif', fontSmoothing: "antialiased", fontSize: "16px", "::placeholder": { color: "#aab7c4" } } };
                if (!cardElementRef.current) {
                    cardElementRef.current = elementsRef.current.create("card", { style: style, hidePostalCode: true });
                    if (mountNodeRef.current) cardElementRef.current.mount(mountNodeRef.current);
                }
            } catch (e: any) {
                console.error("Stripe Initialization Failed:", e);
                setError(`Secure Channel Unavailable (${e.message || "Init Error"}). Retrying...`);
            }
        }
    }, []);
    const setMountNode = (node: HTMLDivElement | null) => {
        mountNodeRef.current = node;
        if (node && cardElementRef.current) {
            try { cardElementRef.current.mount(node); } catch (e) { }
        }
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setError('');
        if (!amount || amount <= 0) { setError("Please enter a valid amount."); setProcessing(false); return; }
        if (!stripeRef.current || !cardElementRef.current) { setError("Payment system not initialized. Please try again later."); setProcessing(false); return; }
        try {
            const result = await stripeRef.current.createToken(cardElementRef.current);
            if (result.error) {
                setError(result.error.message);
                setProcessing(false);
            } else {
                const paymentToken = result.token.id;
                const minutesAdded = Math.floor(amount / pricePerMin);
                setTimeout(() => {
                    setProcessing(false);
                    onSuccess(minutesAdded, amount, paymentToken);
                }, 500);
            }
        } catch (err: any) {
            setError(err.message || "Payment failed.");
            setProcessing(false);
        }
    };
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-gray-100 dark:border-gray-800">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                        <span className="font-bold text-gray-700 dark:text-white">Secure Checkout</span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"><X className="w-5 h-5 dark:text-white" /></button>
                </div>
                <div className="p-8">
                    <div className="mb-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 font-medium">Select Amount to Add</p>
                        {!isCustom && <h2 className="text-5xl font-extrabold tracking-tight mb-6 dark:text-white">${amount.toFixed(2)}</h2>}
                        <div className="flex justify-center gap-2 mb-6 flex-wrap">
                            {[20, 50, 100, 250].map((val) => (
                                <button key={val} type="button" onClick={() => { setAmount(val); setIsCustom(false); }} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!isCustom && amount === val ? 'bg-black dark:bg-white dark:text-black text-white shadow-lg transform scale-105' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>${val}</button>
                            ))}
                            <button type="button" onClick={() => { setIsCustom(true); setAmount(0); }} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isCustom ? 'bg-black dark:bg-white dark:text-black text-white shadow-lg transform scale-105' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Custom</button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Adds approx. <span className="font-bold text-black dark:text-white">{Math.floor((amount || 0) / pricePerMin)} mins</span> of talk time.</p>
                    </div>
                    {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0" /><span>{error}</span></div>}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 relative group transition-all focus-within:ring-2 focus-within:ring-yellow-400">
                            <div className="absolute top-0 right-0 p-2 opacity-50"><Lock className="w-3 h-3 text-gray-400" /></div>
                            <div ref={setMountNode} className="p-2" />
                        </div>
                        <button type="submit" disabled={processing || !window.Stripe || (amount <= 0) || !!error} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${processing || (amount <= 0) || !!error ? 'bg-gray-800 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-yellow-500 text-black hover:bg-yellow-400 hover:scale-[1.02]'}`}>
                            {processing ? <span className="animate-pulse">Establishing Secure Tunnel...</span> : <><ShieldCheck className="w-5 h-5" /> Pay ${(amount || 0).toFixed(2)}</>}
                        </button>
                        <div className="flex justify-center items-center gap-2 opacity-60 grayscale hover:grayscale-0 transition-all">
                            <span className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1"><Lock className="w-3 h-3" /> Ends-to-End Encrypted via Stripe</span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const BreathingExercise: React.FC<{ userId: string, onClose: () => void }> = ({ userId, onClose }) => {
    const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
    const [timeLeft, setTimeLeft] = useState(60);
    const [isActive, setIsActive] = useState(true);
    useEffect(() => {
        if (!isActive) return;
        const timer = setInterval(() => { setTimeLeft(t => { if (t <= 1) { setIsActive(false); UserService.recordBreathSession(userId, 60); return 0; } return t - 1; }); }, 1000);

        const cycle = setInterval(() => { setPhase(p => { if (p === 'Inhale') return 'Hold'; if (p === 'Hold') return 'Exhale'; return 'Inhale'; }); }, 4000);
        return () => { clearInterval(timer); clearInterval(cycle); };
    }, [isActive, userId]);
    return (
        <div className="fixed inset-0 bg-black/90 z-[70] flex flex-col items-center justify-center backdrop-blur-md animate-in fade-in">
            <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white"><X className="w-6 h-6" /></button>
            {timeLeft > 0 ? (
                <>
                    <div className="relative mb-12">
                        <div className={`w-64 h-64 rounded-full border-4 border-white/20 flex items-center justify-center transition-all duration-[4000ms] ease-in-out ${phase === 'Inhale' ? 'scale-125 bg-white/10' : phase === 'Exhale' ? 'scale-75 bg-transparent' : 'scale-100 bg-white/5'}`}><span className="text-3xl font-black text-white tracking-widest uppercase">{phase}</span></div>
                        <div className="absolute inset-0 rounded-full border border-white/10 animate-ping opacity-20"></div>
                    </div>
                    <div className="text-center"><p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2">Time Remaining</p><p className="text-4xl font-mono text-white">{timeLeft}s</p></div>
                </>
            ) : (
                <div className="text-center animate-in zoom-in"><CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" /><h2 className="text-3xl font-black text-white mb-2">Session Complete</h2><p className="text-gray-400 mb-8">You've centered your mind.</p><button onClick={onClose} className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform">Return</button></div>
            )}
        </div>
    );
};

const ProfileModal: React.FC<{ user: User, onClose: () => void, onUpdate: () => void }> = ({ user, onClose, onUpdate }) => {
    const [name, setName] = useState(user.name);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const handleSave = () => {
        setError(null);
        const check = NameValidator.validateFullName(name);
        if (!check.valid) {
            setError(check.error || "Invalid name.");
            return;
        }
        setLoading(true);
        UserService.updateUser({ ...user, name }).then(() => { onUpdate(); onClose(); });
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-8 border border-yellow-200 dark:border-gray-800 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Edit Profile</h2>
                {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">{error}</div>}
                <div className="space-y-4 mb-8">

                    <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Display Name</label><input className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-yellow-500 outline-none dark:text-white" value={name} onChange={e => setName(e.target.value)} /></div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Email</label><input className="w-full p-3 bg-gray-100 dark:bg-gray-800/50 border border-transparent rounded-xl text-gray-500 cursor-not-allowed" value={user.email} disabled /></div>
                </div>
                <button onClick={handleSave} disabled={loading} className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-80 transition-opacity">{loading ? 'Saving...' : 'Save Changes'}</button>
            </div>
        </div>
    );
};

// --- VISUAL OVERHAUL COMPONENTS ---
const GlassCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
    <div onClick={onClick} className={`bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/40 dark:border-gray-800 shadow-xl shadow-yellow-500/5 dark:shadow-none rounded-[2rem] transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl ${className}`}>
        {children}
    </div>
);



const DashboardMobileHeader: React.FC<{
    darkMode: boolean;
    toggleDarkMode: () => void;
    setShowGrounding: (v: boolean) => void;
    setShowPayment: (v: boolean) => void;
    setShowProfile: (v: boolean) => void;
    dashboardUser: User
}> = ({ darkMode, toggleDarkMode, setShowGrounding, setShowPayment, setShowProfile, dashboardUser }) => (
    <div className="md:hidden fixed top-0 left-0 right-0 h-[70px] bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-800 z-50 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-400/20">
                <Heart className="w-5 h-5 text-black fill-black" />
            </div>
            <span className="text-xl font-black tracking-tighter dark:text-white">Peutic</span>
        </div>
        <div className="flex items-center gap-3 pl-4">
            <button onClick={toggleDarkMode} className="p-2.5 rounded-full bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                {darkMode ? <Sun className="w-4 h-4 text-yellow-600" /> : <Moon className="w-4 h-4 text-gray-600" />}
            </button>
            <button onClick={() => setShowGrounding(true)} className="p-2.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors animate-pulse border border-red-100">
                <LifeBuoy className="w-4 h-4" />
            </button>
            <button onClick={() => setShowPayment(true)} className="bg-black dark:bg-white text-white dark:text-black w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-lg">
                <Plus className="w-4 h-4" />
            </button>
            <button onClick={() => setShowProfile(true)} className="w-9 h-9 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-md">
                <AvatarImage src={dashboardUser.avatar || ''} alt="User" className="w-full h-full object-cover" isUser={true} />
            </button>
        </div>
    </div>
);

const DashboardSidebar: React.FC<{
    activeTab: 'hub' | 'history' | 'settings';
    setActiveTab: (t: 'hub' | 'history' | 'settings') => void;
    onLogout: () => void
}> = ({ activeTab, setActiveTab, onLogout }) => (
    <aside className="hidden md:flex fixed left-6 top-6 bottom-6 w-24 flex-col bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-white/20 dark:border-gray-800 rounded-[2.5rem] shadow-2xl z-40 items-center py-8">
        <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-400/20 mb-12 hover:scale-110 transition-transform cursor-pointer">
            <Heart className="w-6 h-6 text-black fill-black" />
        </div>
        <nav className="flex-1 flex flex-col gap-6 w-full px-4">
            {[{ id: 'hub', icon: LayoutDashboard }, { id: 'history', icon: Clock }, { id: 'settings', icon: Settings }].map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 group relative ${activeTab === item.id ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg scale-110' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                    <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'text-yellow-400 dark:text-yellow-600' : 'group-hover:text-black dark:group-hover:text-white'}`} />
                    {activeTab === item.id && <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-yellow-400 rounded-l-full md:hidden"></div>}
                </button>
            ))}
        </nav>
        <div className="mt-auto">
            <button onClick={onLogout} className="p-4 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-colors">
                <LogOut className="w-6 h-6" />
            </button>
        </div>
    </aside>
);

const HubTab: React.FC<{
    user: User;
    weeklyGoal: number;
    weeklyTarget: number;
    handleMoodSelect: (m: 'confetti' | 'rain' | null) => void;
    setShowGrounding: (v: boolean) => void;
    dashboardUser: User;
    uniqueSpecialties: string[];
    specialtyFilter: string;
    setSpecialtyFilter: (v: string) => void;
    loadingCompanions: boolean;
    filteredCompanions: Companion[];
    handleStartConnection: (c: Companion) => void;
    refreshData: () => void;
}> = ({ user, weeklyGoal, weeklyTarget, handleMoodSelect, setShowGrounding, dashboardUser, uniqueSpecialties, specialtyFilter, setSpecialtyFilter, loadingCompanions, filteredCompanions, handleStartConnection, refreshData }) => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <GlassCard className="col-span-1 md:col-span-2 row-span-2 relative overflow-hidden group p-8 flex flex-col justify-between min-h-[300px]">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-bl from-yellow-400 to-transparent w-full h-full"></div>
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2"><Flame className="w-5 h-5 text-orange-500" /><span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Weekly Goal</span></div>
                        <h2 className="text-5xl font-black text-gray-900 dark:text-white mb-2">{weeklyGoal}<span className="text-2xl text-gray-400">/{weeklyTarget}</span></h2>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-xs">{weeklyGoal >= weeklyTarget ? "You are absolutely crushing it! 🔥" : "Keep going, every step counts toward your peace."}</p>
                    </div>
                    <div className="w-24 h-24 relative">
                        <svg className="w-full h-full transform -rotate-90"><circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-gray-800" /><circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * Math.min(100, (weeklyGoal / weeklyTarget) * 100)) / 100} className="text-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)] transition-all duration-1000" /></svg>
                    </div>
                </div>
                <div className="relative z-10 mt-6">
                    <button className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-full font-bold text-sm shadow-lg hover:translate-y-[-2px] transition-transform">View Progress</button>
                </div>
            </GlassCard>

            <GlassCard className="col-span-1 p-6 flex flex-col justify-center items-center text-center bg-blue-50/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
                <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4">Mood Check-in</h3>
                <MoodTracker onMoodSelect={handleMoodSelect} />
            </GlassCard>

            <GlassCard onClick={() => setShowGrounding(true)} className="col-span-1 p-6 flex flex-col justify-center items-center text-center bg-red-50/50 dark:bg-red-900/20 border-red-100 dark:border-red-800 cursor-pointer group">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <LifeBuoy className="w-8 h-8 text-red-500 animate-pulse" />
                </div>
                <h3 className="text-lg font-black text-red-600 dark:text-red-400">Panic Relief</h3>
                <p className="text-xs text-red-400 dark:text-red-500/70 font-bold mt-1">Tap for Grounding</p>
            </GlassCard>

            <GlassCard className="col-span-1 md:col-span-3 lg:col-span-2 p-1 relative overflow-hidden h-[240px]">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-50"></div>
                <div className="grid grid-cols-2 h-full gap-1">
                    <div className="relative rounded-l-[1.8rem] overflow-hidden bg-sky-100/50 dark:bg-sky-900/20 group cursor-pointer">
                        <div className="absolute top-4 left-4 z-10"><span className="bg-white/90 dark:bg-black/90 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">Card Match</span></div>
                        <MindfulMatchGame dashboardUser={dashboardUser} />
                    </div>
                    <div className="relative rounded-r-[1.8rem] overflow-hidden bg-indigo-100/50 dark:bg-indigo-900/20 group cursor-pointer">
                        <div className="absolute top-4 left-4 z-10"><span className="bg-white/90 dark:bg-black/90 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">Cloud Hop</span></div>
                        <CloudHopGame dashboardUser={dashboardUser} />
                    </div>
                </div>
            </GlassCard>
        </div>

        <section>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-400" /> Specialist Sanctuary</h2>
                    <p className="text-gray-500 text-sm mt-1">Select a guide to begin your journey.</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 max-w-full">
                    {['All', ...uniqueSpecialties].map(spec => (
                        <button key={spec} onClick={() => setSpecialtyFilter(spec)} className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${specialtyFilter === spec ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'}`}>{spec}</button>
                    ))}
                </div>
            </div>
            {loadingCompanions ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {[1, 2, 3, 4, 5].map(i => <CompanionSkeleton key={i} />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {filteredCompanions.map((companion: Companion) => (
                        <div key={companion.id} onClick={() => handleStartConnection(companion)} className="group relative aspect-[3/4] rounded-[2.5rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                            <AvatarImage src={companion.imageUrl} alt={companion.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                            <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-2 h-2 rounded-full ${companion.status === 'AVAILABLE' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">{companion.status === 'AVAILABLE' ? 'Live Now' : 'Busy'}</span>
                                </div>
                                <h3 className="text-2xl font-black text-white leading-none mb-1">{companion.name}</h3>
                                <p className="text-yellow-400 font-bold text-xs uppercase tracking-wider mb-3">{companion.specialty}</p>
                                <div className="h-0 group-hover:h-auto overflow-hidden transition-all opacity-0 group-hover:opacity-100">
                                    <button className="w-full bg-white text-black py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors">
                                        <Video className="w-3 h-3" /> Connect
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
            <GlassCard className="p-8">
                <h3 className="font-black text-xl text-gray-900 dark:text-white flex items-center gap-2 mb-6"><BookOpen className="w-5 h-5 text-blue-500" /> Journal</h3>
                <JournalSection user={user} />
            </GlassCard>
            <GlassCard className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-xl text-gray-900 dark:text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500" /> Wisdom Art</h3>
                    <button onClick={() => refreshData()} className="text-xs font-bold text-gray-400 hover:text-black">Refresh</button>
                </div>
                <WisdomGenerator userId={user.id} />
            </GlassCard>
        </div>
    </div>
);

const HistoryTab: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => (
    <div className="animate-in fade-in slide-in-from-right-5 duration-500">
        <GlassCard className="p-8 overflow-hidden">
            <h3 className="font-black text-2xl text-gray-900 dark:text-white mb-6">Transaction History</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-xs font-bold text-gray-500 uppercase tracking-wider"><tr><th className="p-4 rounded-l-xl">Date</th><th className="p-4">Description</th><th className="p-4 text-right">Amount</th><th className="p-4 text-right rounded-r-xl">Status</th></tr></thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {transactions.length === 0 ? (<tr><td colSpan={4} className="p-8 text-center text-gray-400 text-sm">No history found.</td></tr>) : (transactions.map((tx) => (<tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"><td className="p-4 text-sm dark:text-gray-300 font-mono">{new Date(tx.date).toLocaleDateString()}</td><td className="p-4 text-sm font-bold dark:text-white">{tx.description}</td><td className={`p-4 text-sm text-right font-mono font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount}m</td><td className="p-4 text-right"><span className="px-2 py-1 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase tracking-wide">{tx.status}</span></td></tr>)))}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    </div>
);

const SettingsTab: React.FC<{
    editName: string;
    setEditName: (v: string) => void;
    editEmail: string;
    setEditEmail: (v: string) => void;
    saveProfileChanges: () => void;
    isSavingProfile: boolean;
    darkMode: boolean;
    toggleDarkMode: () => void;
    emailNotifications: boolean;
    setEmailNotifications: (v: boolean) => void;
    dashboardUser: User;
    setShowDeleteConfirm: (v: boolean) => void;
    showDeleteConfirm: boolean;
    handleDeleteAccount: () => void;
}> = ({ editName, setEditName, editEmail, setEditEmail, saveProfileChanges, isSavingProfile, darkMode, toggleDarkMode, emailNotifications, setEmailNotifications, dashboardUser, setShowDeleteConfirm, showDeleteConfirm, handleDeleteAccount }) => (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-5 duration-500">
        <GlassCard className="p-8">
            <h3 className="font-black text-xl dark:text-white mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">Profile & Identity</h3>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative group cursor-pointer">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-800 group-hover:border-yellow-400 transition-colors">
                            <AvatarImage src={dashboardUser.avatar || ''} alt="Profile" className="w-full h-full object-cover" isUser={true} />
                        </div>
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit2 className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="flex-1 w-full space-y-4">
                        <div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Display Name</label><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-yellow-500 outline-none font-bold" /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Email</label><input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-yellow-500 outline-none font-bold" /></div>
                    </div>
                </div>
                <div className="flex justify-end"><button onClick={saveProfileChanges} disabled={isSavingProfile} className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2">{isSavingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Updates</button></div>
            </div>
        </GlassCard>

        <GlassCard className="p-8">
            <h3 className="font-black text-xl dark:text-white mb-6">Preferences</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/30 rounded-2xl">
                    <div className="flex items-center gap-4"><div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm"><Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" /></div><div><p className="font-bold dark:text-white text-sm">Dark Mode</p><p className="text-[10px] text-gray-500">Easier on the eyes.</p></div></div>
                    <button onClick={toggleDarkMode} className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${darkMode ? 'bg-yellow-500' : 'bg-gray-300'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-7' : 'translate-x-1'}`} /></button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/30 rounded-2xl">
                    <div className="flex items-center gap-4"><div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm"><Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" /></div><div><p className="font-bold dark:text-white text-sm">Email Alerts</p><p className="text-[10px] text-gray-500">Session summaries.</p></div></div>
                    <button onClick={() => { const newVal = !emailNotifications; setEmailNotifications(newVal); const updated: User = { ...dashboardUser, emailPreferences: { updates: newVal, marketing: true } }; UserService.updateUser(updated); }} className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${emailNotifications ? 'bg-yellow-500' : 'bg-gray-300'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotifications ? 'translate-x-7' : 'translate-x-1'}`} /></button>
                </div>
                <div className="pt-6">
                    <button onClick={() => setShowDeleteConfirm(true)} className="text-red-500 font-bold text-xs hover:text-red-600 transition-colors uppercase tracking-widest flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete Account</button>
                    {showDeleteConfirm && (
                        <div className="mt-4 p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/50 text-center animate-in zoom-in">
                            <p className="text-red-600 font-bold mb-4 text-sm">Are you sure? This is permanent.</p>
                            <div className="flex gap-4 justify-center">
                                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-white rounded-lg text-xs font-bold shadow-sm">Cancel</button>
                                <button onClick={handleDeleteAccount} className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-red-700">Yes, Goodbye</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </GlassCard>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onStartSession }) => {
    const [activeTab, setActiveTab] = useState<'hub' | 'history' | 'settings'>('hub');

    // Universal Theme Sync: Prioritize LocalStorage -> User Preference -> System
    const [darkMode, setDarkMode] = useState(() => {
        const local = localStorage.getItem('peutic_theme');
        if (local) return local === 'dark';
        if (user.themePreference) return user.themePreference === 'dark';
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    const [balance, setBalance] = useState(user.balance);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [companions, setCompanions] = useState<Companion[]>([]);
    const [loadingCompanions, setLoadingCompanions] = useState(true);
    const [weeklyGoal, setWeeklyGoal] = useState(0);
    const weeklyTarget = 10;
    const [dailyInsight, setDailyInsight] = useState<string>(() => INSPIRATIONAL_SAYINGS[Math.floor(Math.random() * INSPIRATIONAL_SAYINGS.length)]);
    const [dashboardUser, setDashboardUser] = useState(user);
    const [showPayment, setShowPayment] = useState(false);
    const [paymentError, setPaymentError] = useState<string | undefined>(undefined);
    const [showBreathing, setShowBreathing] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    const [showGrounding, setShowGrounding] = useState(false);
    const [mood, setMood] = useState<'confetti' | 'rain' | null>(null);
    const [emailNotifications, setEmailNotifications] = useState(user.emailPreferences?.updates ?? true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editName, setEditName] = useState(user.name);
    const [editEmail, setEditEmail] = useState(user.email);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [showTechCheck, setShowTechCheck] = useState(false);
    const [pendingCompanion, setPendingCompanion] = useState<Companion | null>(null);
    const [specialtyFilter, setSpecialtyFilter] = useState<string>('All');
    const { showToast } = useToast();


    // Theme Effect: Updates DOM, LocalStorage, and DB
    useEffect(() => {
        const root = document.documentElement;
        const themeStr = darkMode ? 'dark' : 'light';

        if (darkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('peutic_theme', themeStr);

        // Sync with DB if different (debounce could be added in production)
        if (user.themePreference !== themeStr) {
            UserService.updateUser({ ...dashboardUser, themePreference: themeStr as 'light' | 'dark' });
        }

    }, [darkMode]);

    useEffect(() => {
        refreshData();
        generateDailyInsight(user.name).then(insight => {
            if (insight) setDailyInsight(insight);
        });
        setTimeout(() => {
            AdminService.getCompanions().then((comps) => {
                setCompanions(comps);
                setLoadingCompanions(false);
            });
        }, 500);


        const interval = setInterval(async () => {
            await UserService.syncUser(user.id);
            refreshData();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const refreshData = async () => {
        const u = UserService.getUser();
        if (u) {
            setDashboardUser(u);
            setBalance(u.balance);
            UserService.getUserTransactions(u.id).then(setTransactions);
            const prog = await UserService.getWeeklyProgress(u.id);
            setWeeklyGoal(prog.current);

            setEditName(u.name);
            setEditEmail(u.email);
            setEmailNotifications(u.emailPreferences?.updates ?? true);
        }
        AdminService.getCompanions().then(setCompanions);
    };



    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    const handleMoodSelect = (m: 'confetti' | 'rain' | null) => {
        setMood(m);
        if (m) UserService.saveMood(user.id, m).then(() => refreshData());
    };

    const handlePaymentSuccess = async (minutesAdded: number, cost: number, token?: string) => {
        try {
            await UserService.topUpWallet(minutesAdded, cost, user.id, token);
            refreshData();

            setShowPayment(false);
            showToast("Payment successful! Credits added.", 'success');
        } catch (e: any) {
            setPaymentError(e.message || "Payment verification failed.");
            showToast(e.message || "Payment failed", 'error');
        }
    };

    const handleStartConnection = (c: Companion) => {
        if (dashboardUser.balance <= 0) { setPaymentError("Insufficient credits. Please add funds to start a session."); setShowPayment(true); return; }
        setPendingCompanion(c);
        setShowTechCheck(true);
    };
    const confirmSession = () => { setShowTechCheck(false); if (pendingCompanion) onStartSession(pendingCompanion); };
    const saveProfileChanges = () => {
        const check = NameValidator.validateFullName(editName);
        if (!check.valid) {
            showToast(check.error || "Invalid name", 'error');
            return;
        }

        setIsSavingProfile(true);
        setTimeout(() => {

            const updatedUser: User = {
                ...dashboardUser,
                name: editName,
                email: editEmail,
                emailPreferences: {
                    updates: emailNotifications,
                    marketing: dashboardUser.emailPreferences?.marketing ?? true
                }
            };
            UserService.updateUser(updatedUser).then(() => {
                showToast("Profile updated successfully", 'success');
                setDashboardUser(updatedUser);
                setIsSavingProfile(false);
            });
        }, 500);

    };
    const handleDeleteAccount = () => { UserService.deleteUser(user.id); onLogout(); };

    const filteredCompanions = specialtyFilter === 'All' ? companions : companions.filter(c => c.specialty.includes(specialtyFilter) || c.specialty === specialtyFilter);
    const uniqueSpecialties = Array.from(new Set(companions.map(c => c.specialty))).sort();

    return (
        <div className={`min-h-screen font-sans selection:bg-yellow-500/30 ${darkMode ? 'dark bg-[#050505] text-white' : 'bg-[#FDFBF7] text-black'}`}>
            {/* AMBIENT BACKGROUND */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-500/5 dark:bg-purple-900/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-500/5 dark:bg-yellow-900/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-blue-500/5 dark:bg-blue-900/10 rounded-full blur-[150px] animate-pulse delay-2000"></div>
            </div>

            {mood && <WeatherEffect type={mood} />}
            <SoundscapePlayer />

            {/* MOBILE HEADER */}
            <DashboardMobileHeader
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                setShowGrounding={setShowGrounding}
                setShowPayment={setShowPayment}
                setShowProfile={setShowProfile}
                dashboardUser={dashboardUser}
            />

            {/* SIDEBAR */}
            <DashboardSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLogout={onLogout}
            />

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 md:ml-32 min-h-screen pt-24 md:pt-10 px-4 md:px-8 pb-12 overflow-x-hidden relative z-10">
                <header className="max-w-[1600px] mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-full border border-gray-200 dark:border-gray-700 inline-flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{Math.floor(Math.random() * (450 - 320 + 1) + 320)} healing now</span>
                            </div>
                            {activeTab === 'hub' && <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</div>}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white">
                            {activeTab === 'hub' ? `Hello, ${user.name.split(' ')[0]}` : activeTab === 'history' ? 'Journey' : 'Settings'}
                            <span className="text-yellow-500">.</span>
                        </h1>
                        {activeTab === 'hub' && dailyInsight && <p className="text-gray-500 dark:text-gray-400 font-medium italic max-w-xl">"{dailyInsight}"</p>}
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <button onClick={toggleDarkMode} className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            {darkMode ? <Sun className="w-6 h-6 text-yellow-500" /> : <Moon className="w-6 h-6 text-gray-400" />}
                        </button>
                        <div onClick={() => setShowPayment(true)} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-2 pr-6 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md transition-all hover:scale-105">
                            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center font-black text-black text-xs shadow-inner">{balance}m</div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Balance</span>
                                <span className="text-sm font-black text-gray-900 dark:text-white">Add Credits</span>
                            </div>
                        </div>
                        <button onClick={() => setShowProfile(true)} className="w-14 h-14 rounded-full p-1 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-yellow-400 transition-colors">
                            <div className="w-full h-full rounded-full overflow-hidden">
                                <AvatarImage src={dashboardUser.avatar || ''} alt="User" className="w-full h-full object-cover" isUser={true} />
                            </div>
                        </button>
                    </div>
                </header>

                <div className="max-w-[1600px] mx-auto">
                    {activeTab === 'hub' && (
                        <HubTab
                            user={user}
                            weeklyGoal={weeklyGoal}
                            weeklyTarget={weeklyTarget}
                            handleMoodSelect={handleMoodSelect}
                            setShowGrounding={setShowGrounding}
                            dashboardUser={dashboardUser}
                            uniqueSpecialties={uniqueSpecialties}
                            specialtyFilter={specialtyFilter}
                            setSpecialtyFilter={setSpecialtyFilter}
                            loadingCompanions={loadingCompanions}
                            filteredCompanions={filteredCompanions}
                            handleStartConnection={handleStartConnection}
                            refreshData={refreshData}
                        />
                    )}

                    {activeTab === 'history' && <HistoryTab transactions={transactions} />}

                    {activeTab === 'settings' && (
                        <SettingsTab
                            editName={editName}
                            setEditName={setEditName}
                            editEmail={editEmail}
                            setEditEmail={setEditEmail}
                            saveProfileChanges={saveProfileChanges}
                            isSavingProfile={isSavingProfile}
                            darkMode={darkMode}
                            toggleDarkMode={toggleDarkMode}
                            emailNotifications={emailNotifications}
                            setEmailNotifications={setEmailNotifications}
                            dashboardUser={dashboardUser}
                            setShowDeleteConfirm={setShowDeleteConfirm}
                            showDeleteConfirm={showDeleteConfirm}
                            handleDeleteAccount={handleDeleteAccount}
                        />
                    )}
                </div>

                <footer className="mt-24 pt-12 border-t border-gray-200 dark:border-gray-800 text-center pb-8">
                    <div className="flex items-center justify-center gap-2 mb-4 opacity-50 dark:text-white"><Heart className="w-4 h-4" /><span className="font-black tracking-tight text-sm">Peutic Inc.</span></div>
                    <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">&copy; {new Date().getFullYear()} All Rights Reserved. ISO 27001 Certified.</p>
                </footer>
            </main>

            {/* MODALS */}
            {showPayment && <PaymentModal onClose={() => { setShowPayment(false); setPaymentError(undefined); }} onSuccess={handlePaymentSuccess} initialError={paymentError} />}
            {showBreathing && <BreathingExercise userId={user.id} onClose={() => setShowBreathing(false)} />}
            {showProfile && <ProfileModal user={dashboardUser} onClose={() => setShowProfile(false)} onUpdate={refreshData} />}
            {showGrounding && <GroundingMode onClose={() => setShowGrounding(false)} />}
            {showTechCheck && (<TechCheck onConfirm={confirmSession} onCancel={() => setShowTechCheck(false)} />)}
        </div>
    );
};

export default Dashboard;