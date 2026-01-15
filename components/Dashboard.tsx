import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User, Companion, Transaction, JournalEntry, ArtEntry } from '../types';
import {
    Video, Clock, Settings, LogOut,
    LayoutDashboard, Plus, X, Lock, CheckCircle, AlertTriangle, ShieldCheck, Heart,
    BookOpen, Save, Sparkles, Flame, Trophy,
    Sun, Cloud, Feather, Anchor, Gamepad2, RefreshCw, Play, Zap, Star, Edit2, Trash2, Bell,
    CloudRain, Download, ChevronDown, ChevronUp, Lightbulb, User as UserIcon, Moon,
    Twitter, Instagram, Linkedin, LifeBuoy, Volume2, Music, Smile, Trees,
    Mail, StopCircle, Eye, Minimize2, Flame as Fire
} from 'lucide-react';
import { Database, STABLE_AVATAR_POOL } from '../services/database';
import { generateAffirmation, generateDailyInsight } from '../services/geminiService';
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

const CollapsibleSection: React.FC<{ title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon: Icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-[#FFFBEB] dark:bg-gray-900 border border-yellow-200 dark:border-gray-800 rounded-3xl overflow-hidden mb-4 transition-colors shadow-sm">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-yellow-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-gray-800 rounded-lg"><Icon className="w-4 h-4 md:w-5 md:h-5 text-yellow-600 dark:text-yellow-500" /></div>
                    <span className="font-bold text-base dark:text-white">{title}</span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-gray-400" /> : <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />}
            </button>
            {isOpen && <div className="p-4 md:p-5 pt-0 border-t border-yellow-100 dark:border-gray-800 animate-in slide-in-from-top-2">{children}</div>}
        </div>
    );
};

const WisdomGenerator: React.FC<{ userId: string, onUpdate?: () => void }> = ({ userId, onUpdate }) => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [gallery, setGallery] = useState<ArtEntry[]>([]);

    const refreshGallery = async () => {
        const art = await Database.getUserArt(userId);
        setGallery(art);
    };

    useEffect(() => { refreshGallery(); }, [userId]);

    const handleGenerate = async () => {
        if (!input.trim()) return;
        setLoading(true);
        try {
            let wisdom;
            try {
                wisdom = await generateAffirmation(input);
            } catch (apiError) {
                console.warn("API failed, using WisdomEngine fallback:", apiError);
                wisdom = WisdomEngine.generate(input);
            }

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

                await Database.saveArt(newEntry);
                await refreshGallery();
                if (onUpdate) onUpdate();
                setInput('');
            }

        } catch (e: any) {
            console.error("Critical Generation Error:", e);
            alert("Failed to save Wisdom Art: " + (e.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Delete this card?")) { await Database.deleteArt(id); await refreshGallery(); }
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
                            {gallery.map((art) => (
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
                    Database.updateGameScore(dashboardUser.id, 'match', moves);
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
                    Database.updateGameScore(dashboardUser.id, 'cloud', score);
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
        Database.getJournals(user.id).then(setEntries);
    }, [user.id]);
    const handleSave = () => { if (!content.trim()) return; const entry: JournalEntry = { id: `j_${Date.now()}`, userId: user.id, date: new Date().toISOString(), content: content }; Database.saveJournal(entry).then(() => { setEntries([entry, ...entries]); setContent(''); setSaved(true); if (onUpdate) onUpdate(); setTimeout(() => setSaved(false), 2000); }); };
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
    const settings = Database.getSettings();
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
                setError(`Payment system unavailable (${e.message || "Init Error"}). Please retry in a moment.`);
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
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700"><div ref={setMountNode} className="p-2" /></div>
                        <button type="submit" disabled={processing || !window.Stripe || (amount <= 0) || !!error} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${processing || (amount <= 0) || !!error ? 'bg-gray-800 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-yellow-500 text-black hover:bg-yellow-400 hover:scale-[1.02]'}`}>
                            {processing ? <span className="animate-pulse">Processing Securely...</span> : <><Lock className="w-5 h-5" /> Pay ${(amount || 0).toFixed(2)}</>}
                        </button>
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
        const timer = setInterval(() => { setTimeLeft(t => { if (t <= 1) { setIsActive(false); Database.recordBreathSession(userId, 60); return 0; } return t - 1; }); }, 1000);
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
    const handleSave = () => { setLoading(true); Database.updateUser({ ...user, name }).then(() => { onUpdate(); onClose(); }); };
    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-8 border border-yellow-200 dark:border-gray-800 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Edit Profile</h2>
                <div className="space-y-4 mb-8">
                    <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Display Name</label><input className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-yellow-500 outline-none dark:text-white" value={name} onChange={e => setName(e.target.value)} /></div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Email</label><input className="w-full p-3 bg-gray-100 dark:bg-gray-800/50 border border-transparent rounded-xl text-gray-500 cursor-not-allowed" value={user.email} disabled /></div>
                </div>
                <button onClick={handleSave} disabled={loading} className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-80 transition-opacity">{loading ? 'Saving...' : 'Save Changes'}</button>
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onStartSession }) => {
    const [activeTab, setActiveTab] = useState<'hub' | 'history' | 'settings'>('hub');

    // Default to Light Mode
    const [darkMode, setDarkMode] = useState(() => {
        return user.themePreference === 'dark';
    });

    const [balance, setBalance] = useState(user.balance);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [companions, setCompanions] = useState<Companion[]>([]);
    const [loadingCompanions, setLoadingCompanions] = useState(true);
    const [weeklyGoal, setWeeklyGoal] = useState(0);
    const weeklyTarget = 10;
    const [weeklyMessage, setWeeklyMessage] = useState("Start your journey.");
    const [dailyInsight, setDailyInsight] = useState<string>(() => INSPIRATIONAL_SAYINGS[Math.floor(Math.random() * INSPIRATIONAL_SAYINGS.length)]);
    const [dashboardUser, setDashboardUser] = useState(user);
    const [showPayment, setShowPayment] = useState(false);
    const [paymentError, setPaymentError] = useState<string | undefined>(undefined);
    const [showBreathing, setShowBreathing] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showCookies, setShowCookies] = useState(false);
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

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        refreshData();
        generateDailyInsight(user.name).then(insight => {
            if (insight) setDailyInsight(insight);
        });
        setTimeout(() => {
            Database.getCompanions().then((comps) => {
                setCompanions(comps);
                setLoadingCompanions(false);
            });
        }, 500);

        const interval = setInterval(async () => {
            await Database.syncUser(user.id);
            refreshData();
        }, 5000);
        return () => clearInterval(interval);
    }, [darkMode]);

    const refreshData = async () => {
        const u = Database.getUser();
        if (u) {
            setDashboardUser(u);
            setBalance(u.balance);
            Database.getUserTransactions(u.id).then(setTransactions);
            const prog = await Database.getWeeklyProgress(u.id);
            setWeeklyGoal(prog.current);
            setWeeklyMessage(prog.message);
            setEditName(u.name);
            setEditEmail(u.email);
            setEmailNotifications(u.emailPreferences?.updates ?? true);
        }
        Database.getCompanions().then(setCompanions);
    };

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        Database.updateUser({ ...dashboardUser, themePreference: newMode ? 'dark' : 'light' });
    };

    const handleMoodSelect = (m: 'confetti' | 'rain' | null) => {
        setMood(m);
        if (m) Database.saveMood(user.id, m).then(() => refreshData());
    };
    const handlePaymentSuccess = async (minutesAdded: number, cost: number, token?: string) => {
        try {
            await Database.topUpWallet(minutesAdded, cost, user.id, token);
            refreshData();
            setShowPayment(false);
            alert("Payment successful! Credits added.");
        } catch (e: any) {
            setPaymentError(e.message || "Payment verification failed.");
        }
    };
    const handleStartConnection = (c: Companion) => {
        if (dashboardUser.balance <= 0) { setPaymentError("Insufficient credits. Please add funds to start a session."); setShowPayment(true); return; }
        setPendingCompanion(c);
        setShowTechCheck(true);
    };
    const confirmSession = () => { setShowTechCheck(false); if (pendingCompanion) onStartSession(pendingCompanion); };
    const saveProfileChanges = () => {
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
            Database.updateUser(updatedUser);
            setDashboardUser(updatedUser);
            setIsSavingProfile(false);
        }, 500);
    };
    const handleDeleteAccount = () => { Database.deleteUser(user.id); onLogout(); };
    const filteredCompanions = specialtyFilter === 'All' ? companions : companions.filter(c => c.specialty.includes(specialtyFilter) || c.specialty === specialtyFilter);
    const uniqueSpecialties = Array.from(new Set(companions.map(c => c.specialty))).sort();

    return (
        <div className={`min-h-screen transition-colors duration-500 font-sans ${darkMode ? 'dark bg-[#0A0A0A] text-white' : 'bg-[#FFFBEB] text-black'}`}>
            {mood && <WeatherEffect type={mood} />}
            <SoundscapePlayer />

            <div className="md:hidden sticky top-8 bg-[#FFFBEB]/90 dark:bg-black/90 backdrop-blur-md border-b border-yellow-200 dark:border-gray-800 p-4 flex justify-between items-center z-40">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center shadow-md">
                        <Heart className="w-5 h-5 text-black fill-black" />
                    </div>
                    <span className="font-black tracking-tight text-lg">Peutic</span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-gray-600" />}
                    </button>
                    <button onClick={() => setShowGrounding(true)} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors animate-pulse" title="Panic Relief">
                        <LifeBuoy className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowPayment(true)} className="bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1 active:scale-95 transition-transform">
                        <span>{balance}m</span>
                        <Plus className="w-3 h-3 text-yellow-400" />
                    </button>
                    <button onClick={() => setShowProfile(true)} className="w-8 h-8 rounded-full overflow-hidden border border-gray-300 dark:border-gray-700">
                        <AvatarImage src={dashboardUser.avatar || ''} alt="User" className="w-full h-full object-cover" isUser={true} />
                    </button>
                    <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors" title="Sign Out">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="flex h-screen overflow-hidden pt-[60px] md:pt-0">
                <aside className="hidden md:flex w-20 lg:w-64 flex-col border-r border-yellow-200 dark:border-gray-800 bg-[#FFFBEB]/50 dark:bg-black/50 backdrop-blur-xl">
                    <div className="p-6 lg:p-8 flex items-center justify-center lg:justify-start gap-3">
                        <div className="w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg group hover:scale-110 transition-transform">
                            <Heart className="w-5 h-5 text-black fill-black" />
                        </div>
                        <span className="hidden lg:block text-xl font-black tracking-tight dark:text-white">Peutic</span>
                    </div>
                    <nav className="flex-1 px-3 lg:px-4 py-6 lg:py-8 space-y-2 lg:space-y-3">
                        {[{ id: 'hub', icon: LayoutDashboard, label: 'Sanctuary' }, { id: 'history', icon: Clock, label: 'Journey' }, { id: 'settings', icon: Settings, label: 'Config' }].map((item) => (
                            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 lg:p-4 rounded-xl transition-all duration-300 group ${activeTab === item.id ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg' : 'text-gray-500 hover:bg-yellow-100 dark:hover:bg-gray-800 dark:text-gray-400'}`}>
                                <item.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${activeTab === item.id ? 'text-yellow-400 dark:text-yellow-600' : 'group-hover:text-yellow-600 dark:group-hover:text-white'}`} />
                                <span className="hidden lg:block font-bold text-xs lg:text-sm tracking-wide">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                    <div className="p-4 lg:p-6 border-t border-yellow-200 dark:border-gray-800">
                        <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 p-3 lg:p-4 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-bold text-xs lg:text-sm">
                            <LogOut className="w-5 h-5" /><span className="hidden lg:block">Disconnect</span>
                        </button>
                    </div>
                </aside>
                <main className="flex-1 overflow-y-auto relative scroll-smooth">
                    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-10 pb-24">
                        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div className="flex-1">
                                <p className="text-gray-500 dark:text-gray-400 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-1">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-2">
                                    <h1 className="text-3xl md:text-4xl font-black tracking-tight dark:text-white">{activeTab === 'hub' ? `Hello, ${user.name.split(' ')[0]}.` : activeTab === 'history' ? 'Your Journey' : 'Settings'}</h1>
                                    {activeTab === 'hub' && (<button onClick={() => setShowGrounding(true)} className="hidden md:flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 px-4 py-1.5 rounded-full font-bold text-xs transition-all hover:scale-105 animate-pulse"><LifeBuoy className="w-3.5 h-3.5" /> Panic Relief</button>)}
                                </div>
                                {activeTab === 'hub' && dailyInsight && (<p className="text-gray-600 dark:text-gray-400 mt-2 max-w-lg text-sm font-medium leading-relaxed border-l-4 border-yellow-400 pl-3 italic">"{dailyInsight}"</p>)}
                            </div>
                            <div className="hidden md:flex items-center gap-4">
                                <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">{darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}</button>
                                <button onClick={() => setShowPayment(true)} className={`px-5 py-2.5 rounded-2xl font-black shadow-lg transition-transform hover:scale-105 flex items-center gap-2 text-sm ${balance < 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-black dark:bg-white text-white dark:text-black'}`}>
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>{balance} mins<Plus className="w-3 h-3 ml-1 opacity-50" />
                                </button>
                                <button onClick={() => setShowProfile(true)} className="w-12 h-12 rounded-xl overflow-hidden border-2 border-yellow-400 shadow-xl hover:rotate-3 transition-transform"><AvatarImage src={dashboardUser.avatar || ''} alt={dashboardUser.name} className="w-full h-full object-cover" isUser={true} /></button>
                            </div>
                        </header>
                        {activeTab === 'hub' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                                    <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-yellow-100 dark:border-gray-800 shadow-sm col-span-1 md:col-span-2 relative overflow-hidden group">
                                        {weeklyGoal >= weeklyTarget ? (<div className="absolute top-0 right-0 p-4 z-20"><div className="relative flex items-center justify-center"><div className="absolute w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div><div className="absolute w-16 h-16 bg-blue-500/30 rounded-full blur-xl animate-pulse"></div><div className="absolute w-full h-full bg-blue-400/10 rounded-full animate-ping"></div><div className="absolute w-10 h-10 bg-blue-400/50 rounded-full blur-lg animate-pulse"></div><Flame className="w-12 h-12 text-blue-500 fill-blue-500 drop-shadow-[0_0_20px_rgba(59,130,246,1)] animate-bounce relative z-10" /></div></div>) : (<div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Trophy className="w-20 h-20 text-yellow-500" /></div>)}
                                        <div className="relative z-10"><h3 className="font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest mb-1">Weekly Wellness Goal</h3><div className="flex items-end gap-2 mb-3"><span className="text-3xl md:text-4xl font-black dark:text-white">{weeklyGoal}</span><span className="text-gray-400 text-xs md:text-sm font-bold mb-1">/ {weeklyTarget} activities</span></div><div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-3"><div className={`h-full rounded-full transition-all duration-1000 ease-out ${weeklyGoal >= weeklyTarget ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse' : 'bg-yellow-400'}`} style={{ width: `${Math.min(100, (weeklyGoal / weeklyTarget) * 100)}%` }}></div></div><p className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300">{weeklyGoal >= weeklyTarget ? "🔥 You are on a hot streak!" : weeklyMessage}</p></div>
                                    </div>
                                    <MoodTracker onMoodSelect={handleMoodSelect} />
                                </div>
                                <CollapsibleSection title="Mindful Arcade" icon={Gamepad2}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                                        <div className="relative w-full h-[320px] md:h-[300px] xl:h-[360px] rounded-3xl overflow-hidden border border-yellow-100 dark:border-gray-700 shadow-sm flex flex-col bg-sky-50 dark:bg-gray-800"><div className="absolute top-3 left-0 right-0 text-center z-10 pointer-events-none"><span className="text-[9px] font-black uppercase tracking-widest text-gray-500 bg-white/90 dark:bg-black/90 px-3 py-1.5 rounded-full shadow-sm">Mindful Match</span></div><MindfulMatchGame dashboardUser={dashboardUser} /></div>
                                        <div className="relative w-full h-[320px] md:h-[300px] xl:h-[360px] rounded-3xl overflow-hidden border border-yellow-100 dark:border-gray-700 shadow-sm flex flex-col"><div className="absolute top-3 left-0 right-0 text-center z-10 pointer-events-none"><span className="text-[9px] font-black uppercase tracking-widest text-gray-500 bg-white/90 dark:bg-black/90 px-3 py-1.5 rounded-full shadow-sm">Cloud Hop</span></div><CloudHopGame dashboardUser={dashboardUser} /></div>
                                    </div>
                                </CollapsibleSection>
                                <CollapsibleSection title="Inner Sanctuary" icon={Feather}><div className="space-y-6"><JournalSection user={user} /><div className="border-t border-dashed border-yellow-200 dark:border-gray-700" /><WisdomGenerator userId={user.id} /></div></CollapsibleSection>
                                <div>
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-5"><div><h2 className="text-xl md:text-2xl font-black dark:text-white">Available Specialists</h2><p className="text-gray-500 text-xs md:text-sm">Select a guide to begin your session.</p></div><div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide"><button onClick={() => setSpecialtyFilter('All')} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${specialtyFilter === 'All' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>All</button>{uniqueSpecialties.map(spec => (<button key={spec} onClick={() => setSpecialtyFilter(spec)} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${specialtyFilter === spec ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{spec}</button>))}</div></div>
                                    {loadingCompanions ? (<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-60 bg-gray-100 dark:bg-gray-900 rounded-3xl animate-pulse"></div>)}</div>) : (<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">{filteredCompanions.map((companion) => (<div key={companion.id} onClick={() => handleStartConnection(companion)} className="group relative bg-white dark:bg-gray-900 rounded-[1.8rem] overflow-hidden border border-yellow-100 dark:border-gray-800 hover:border-yellow-400 dark:hover:border-yellow-600 transition-all duration-300 hover:shadow-2xl cursor-pointer flex flex-col h-full"><div className="aspect-[4/5] relative overflow-hidden bg-gray-100 dark:bg-gray-800"><AvatarImage src={companion.imageUrl} alt={companion.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-5 flex flex-col justify-center text-center">
                                            <p className="text-yellow-400 text-[10px] font-black uppercase tracking-widest mb-2">About {companion.name}</p>
                                            <p className="text-white text-xs leading-relaxed mb-3">"{companion.bio}"</p>
                                            <div className="grid grid-cols-2 gap-2 text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-3"><div className="bg-white/10 p-1.5 rounded-lg">{companion.yearsExperience} Yrs Exp</div><div className="bg-white/10 p-1.5 rounded-lg">{companion.degree}</div></div>
                                            <button className="bg-white text-black px-4 py-2 rounded-full font-bold text-[10px] flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors"><Video className="w-3 h-3" /> Connect Now</button>
                                        </div>
                                        <div className="absolute top-3 left-3 flex gap-2"><div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md ${companion.status === 'AVAILABLE' ? 'bg-green-500/90 text-white shadow-lg shadow-green-500/20' : 'bg-gray-500/90 text-white'}`}>{companion.status === 'AVAILABLE' ? 'Online' : 'Busy'}</div></div><div className="absolute bottom-3 left-3 right-3 group-hover:opacity-0 transition-opacity"><h3 className="text-white font-black text-lg leading-tight mb-0.5 shadow-sm drop-shadow-md">{companion.name}</h3><p className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider truncate">{companion.specialty}</p></div></div><div className="p-3 bg-white dark:bg-gray-900 flex justify-between items-center border-t border-gray-100 dark:border-gray-800"><div className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /><span className="text-gray-500 dark:text-gray-400 text-xs font-bold">{companion.rating}</span></div><button className="bg-gray-100 dark:bg-gray-800 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black rounded-lg p-2 transition-colors"><Eye className="w-3.5 h-3.5" /></button></div></div>))}</div>)}
                                    {filteredCompanions.length === 0 && (<div className="text-center py-16 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800"><p className="text-gray-500 font-bold text-sm">No specialists found in this category.</p><button onClick={() => setSpecialtyFilter('All')} className="text-yellow-600 text-xs font-bold mt-2 hover:underline">View All</button></div>)}
                                </div>
                            </div>
                        )}
                        {activeTab === 'history' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-500">
                                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-yellow-100 dark:border-gray-800 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider"><tr><th className="p-4 md:p-5">Date</th><th className="p-4 md:p-5">Description</th><th className="p-4 md:p-5 text-right">Amount</th><th className="p-4 md:p-5 text-right">Status</th></tr></thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {transactions.length === 0 ? (<tr><td colSpan={4} className="p-8 text-center text-gray-400 text-sm">No history found.</td></tr>) : (transactions.map((tx) => (<tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"><td className="p-4 md:p-5 text-sm dark:text-gray-300 font-mono">{new Date(tx.date).toLocaleDateString()}</td><td className="p-4 md:p-5 text-sm font-bold dark:text-white">{tx.description}</td><td className={`p-4 md:p-5 text-sm text-right font-mono font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount}m</td><td className="p-4 md:p-5 text-right"><span className="px-2 py-1 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase tracking-wide">{tx.status}</span></td></tr>)))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {activeTab === 'settings' && (
                            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-5 duration-500">
                                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-yellow-200 dark:border-gray-800 overflow-hidden shadow-sm">
                                    <div className="p-5 md:p-6 border-b border-yellow-100 dark:border-gray-800"><h3 className="font-black text-lg md:text-xl dark:text-white mb-1">Profile & Identity</h3><p className="text-gray-500 text-xs">Manage your personal information.</p></div>
                                    <div className="p-5 md:p-6 space-y-5">
                                        <div className="flex items-center gap-5"><div className="relative"><div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-4 border-yellow-100 dark:border-gray-800"><AvatarImage src={dashboardUser.avatar || ''} alt="Profile" className="w-full h-full object-cover" isUser={true} /></div><button onClick={() => setShowProfile(true)} className="absolute bottom-0 right-0 p-1.5 bg-black text-white rounded-full hover:bg-gray-800 transition-colors shadow-lg"><Edit2 className="w-3 h-3" /></button></div><div className="flex-1 space-y-3"><div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Display Name</label><div className="relative"><UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-yellow-500 outline-none transition-colors text-sm font-bold dark:text-white" /></div></div><div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Email Address</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-yellow-500 outline-none transition-colors text-sm font-bold dark:text-white" /></div></div></div></div>
                                        <div className="flex justify-end pt-2"><button onClick={saveProfileChanges} disabled={isSavingProfile} className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold text-xs hover:opacity-80 transition-opacity flex items-center gap-2">{isSavingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save Changes</button></div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-yellow-200 dark:border-gray-800 overflow-hidden shadow-sm">
                                    <div className="p-5 md:p-6 border-b border-yellow-100 dark:border-gray-800"><h3 className="font-black text-lg md:text-xl dark:text-white mb-1">Preferences</h3><p className="text-gray-500 text-xs">Customize your sanctuary experience.</p></div>
                                    <div className="p-5 md:p-6 space-y-5">
                                        <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"><Moon className="w-4 h-4 text-gray-600 dark:text-gray-400" /></div><div><p className="font-bold text-gray-900 dark:text-white text-sm">Dark Mode</p><p className="text-[10px] text-gray-500">Reduce eye strain.</p></div></div><button onClick={toggleDarkMode} className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${darkMode ? 'bg-yellow-500' : 'bg-gray-200'}`}><span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-1'}`} /></button></div>
                                        <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"><Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" /></div><div><p className="font-bold text-gray-900 dark:text-white text-sm">Email Notifications</p><p className="text-[10px] text-gray-500">Receive session summaries and insights.</p></div></div><button onClick={() => {
                                            const newVal = !emailNotifications;
                                            setEmailNotifications(newVal);
                                            const updated: User = {
                                                ...dashboardUser,
                                                emailPreferences: {
                                                    updates: newVal,
                                                    marketing: dashboardUser.emailPreferences?.marketing ?? true
                                                }
                                            };
                                            Database.updateUser(updated);
                                        }} className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${emailNotifications ? 'bg-yellow-500' : 'bg-gray-200'}`}>
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${emailNotifications ? 'translate-x-5' : 'translate-x-1'}`} /></button></div>
                                    </div>
                                </div>
                                <div className="bg-red-50 dark:bg-red-950/20 rounded-3xl border border-red-100 dark:border-red-900 overflow-hidden shadow-sm">
                                    <div className="p-5 md:p-6 border-b border-red-100 dark:border-red-900"><h3 className="font-black text-lg md:text-xl text-red-900 dark:text-red-400 mb-1">Danger Zone</h3><p className="text-red-600/70 dark:text-red-400/60 text-xs">Permanent actions for your data.</p></div>
                                    <div className="p-5 md:p-6">
                                        {showDeleteConfirm ? (<div className="bg-white dark:bg-black p-5 rounded-2xl border border-red-200 dark:border-red-900 text-center animate-in zoom-in duration-200"><AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" /><h4 className="font-bold text-base mb-1 dark:text-white">Are you absolutely sure?</h4><p className="text-gray-500 text-xs mb-4">This action cannot be undone. This will permanently delete your account, journal entries, and remaining balance.</p><div className="flex gap-3 justify-center"><button onClick={() => setShowDeleteConfirm(false)} className="px-5 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-bold text-xs hover:bg-gray-200">Cancel</button><button onClick={handleDeleteAccount} className="px-5 py-2 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-700 shadow-lg">Yes, Delete Everything</button></div></div>) : (<div className="flex items-center justify-between"><div><p className="font-bold text-red-900 dark:text-red-400 text-sm">Delete Account</p><p className="text-[10px] text-red-700/60 dark:text-red-400/50">Remove all data and access.</p></div><button onClick={() => setShowDeleteConfirm(true)} className="px-5 py-2.5 bg-white dark:bg-transparent border border-red-200 dark:border-red-800 text-red-600 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Delete Account</button></div>)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-8 mb-4 max-w-4xl mx-auto px-4"><div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 p-3 rounded-xl text-center"><p className="text-[9px] md:text-[10px] font-bold text-yellow-800 dark:text-yellow-500 uppercase tracking-wide leading-relaxed">Note: Specialist availability is subject to change frequently due to high demand. If your selected specialist is unavailable, a specialist of equal or greater qualifications will be automatically substituted to ensure immediate support.</p></div></div>
                    <footer className="bg-[#FFFBEB] dark:bg-[#0A0A0A] text-black dark:text-white py-10 md:py-12 px-6 border-t border-yellow-200 dark:border-gray-800 transition-colors">
                        <div className="max-w-7xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-8 md:mb-10">
                                <div className="md:col-span-5 space-y-4"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-yellow-400 rounded-xl flex items-center justify-center"><Heart className="w-4 h-4 fill-black text-black" /></div><span className="text-xl font-black tracking-tight">Peutic</span></div><p className="text-gray-800 dark:text-gray-500 text-xs leading-relaxed max-w-md">Connecting the disconnected through elite-level human specialists and cutting-edge secure technology.</p><div className="flex gap-4">{[Twitter, Instagram, Linkedin].map((Icon, i) => (<button key={i} className="text-gray-800 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors hover:scale-110 transform"><Icon className="w-4 h-4" /></button>))}</div></div>
                                <div className="grid grid-cols-2 md:grid-cols-1 gap-6 md:col-span-2"><div><h4 className="font-black mb-3 text-[9px] uppercase tracking-[0.3em] text-gray-700 dark:text-gray-400">Global</h4><ul className="space-y-2 text-xs font-bold text-gray-800 dark:text-gray-500"><li><Link to="/about" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors">About</Link></li><li><Link to="/press" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors">Media</Link></li></ul></div></div>
                                <div className="grid grid-cols-2 md:grid-cols-1 gap-6 md:col-span-2"><div><h4 className="font-black mb-3 text-[9px] uppercase tracking-[0.3em] text-gray-700 dark:text-gray-400">Support</h4><ul className="space-y-2 text-xs font-bold text-gray-800 dark:text-gray-500"><li><Link to="/support" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors">Help Center</Link></li><li><Link to="/safety" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors">Safety Standards</Link></li><li><Link to="/crisis" className="text-red-600 hover:text-red-700 transition-colors">Crisis Hub</Link></li></ul></div></div>
                                <div className="md:col-span-3"><h4 className="font-black mb-3 text-[9px] uppercase tracking-[0.3em] text-gray-700 dark:text-gray-400">Regulatory</h4><ul className="space-y-2 text-xs font-bold text-gray-800 dark:text-gray-500"><li><Link to="/privacy" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors">Privacy Policy</Link></li><li><Link to="/terms" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors">Terms of Service</Link></li><li><button onClick={() => setShowCookies(true)} className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors">Cookie Controls</button></li></ul></div>
                            </div>
                            <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-yellow-100 dark:border-yellow-900/20">
                                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-500 font-bold text-xs">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Not a Medical Service. For entertainment & companionship only.</span>
                                </div>
                                <Link to="/crisis" className="bg-red-100 text-red-600 hover:bg-red-200 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-colors">
                                    In Crisis?
                                </Link>
                            </div>
                            <div className="pt-6 flex flex-col md:flex-row justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-gray-700 dark:text-gray-600 gap-3 md:gap-0 border-t border-yellow-200/50 dark:border-gray-800">
                                <p>&copy; 2025 Peutic Global Inc. | ISO 27001 Certified</p>
                                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div><span>Network Optimal</span></div>
                            </div>
                        </div>
                    </footer>
                </main>
            </div>
            {showPayment && <PaymentModal onClose={() => { setShowPayment(false); setPaymentError(undefined); }} onSuccess={handlePaymentSuccess} initialError={paymentError} />}
            {showBreathing && <BreathingExercise userId={user.id} onClose={() => setShowBreathing(false)} />}
            {showProfile && <ProfileModal user={dashboardUser} onClose={() => setShowProfile(false)} onUpdate={refreshData} />}
            {showGrounding && <GroundingMode onClose={() => setShowGrounding(false)} />}
            {showTechCheck && (<TechCheck onConfirm={confirmSession} onCancel={() => setShowTechCheck(false)} />)}
        </div>
    );
};

export default Dashboard;