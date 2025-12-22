
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User, Companion, Transaction, JournalEntry, ArtEntry } from '../types';
import { 
  Video, Clock, Settings, LogOut, 
  LayoutDashboard, Plus, Search, X, Lock, CheckCircle, AlertTriangle, ShieldCheck, Heart,
  Wind, BookOpen, Save, Sparkles, Activity, Info, Flame, Trophy, Target,
  Sun, Cloud, Feather, Anchor, Gamepad2, RefreshCw, Play, Zap, Star, Edit2, Trash2, Bell,
  CloudRain, Image as ImageIcon, Download, ChevronDown, ChevronUp, Lightbulb, User as UserIcon, Shield, Moon,
  Twitter, Instagram, Linkedin, LifeBuoy, Volume2, VolumeX, Minimize2, Maximize2, Music, Radio, Flame as Fire
} from 'lucide-react';
import { Database, STABLE_AVATAR_POOL } from '../services/database';
import { generateAffirmation, generateDailyInsight } from '../services/geminiService';
import TechCheck from './TechCheck'; 
import GroundingMode from './GroundingMode';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onStartSession: (companion: Companion) => void;
}

// PRODUCTION SECURITY: Use Environment Variable for Stripe
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_KEY || "pk_live_51MZuG0BUviiBIU4d81PC3BDlYgxuUszLu1InD0FFWOcGwQyNYgn5jjNOYi5a0uic9iuG8FdMjZBqpihTxK7oH0W600KfPZFZwp";

declare global {
  interface Window {
    Stripe?: any;
    webkitAudioContext?: typeof AudioContext;
  }
}

// ==========================================
// UTILITY COMPONENTS
// ==========================================

const AvatarImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
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
        <div className="bg-[#FFFBEB] dark:bg-gray-900 border border-yellow-200 dark:border-gray-800 rounded-3xl overflow-hidden mb-4 md:mb-6 transition-colors shadow-sm">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 md:p-6 hover:bg-yellow-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-gray-800 rounded-lg"><Icon className="w-4 h-4 md:w-5 md:h-5 text-yellow-600 dark:text-yellow-500" /></div>
                    <span className="font-bold text-base md:text-lg dark:text-white">{title}</span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-gray-400" /> : <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />}
            </button>
            {isOpen && <div className="p-4 md:p-6 pt-0 border-t border-yellow-100 dark:border-gray-800 animate-in slide-in-from-top-2">{children}</div>}
        </div>
    );
};

// ==========================================
// FEATURE COMPONENTS
// ==========================================

// --- WISDOM GENERATOR ---
const WisdomGenerator: React.FC<{ userId: string }> = ({ userId }) => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [gallery, setGallery] = useState<ArtEntry[]>([]);
    const [isOpen, setIsOpen] = useState(true);

    const refreshGallery = async () => {
        const art = await Database.getUserArt(userId);
        setGallery(art);
    };

    useEffect(() => {
        refreshGallery();
    }, [userId]);

    const handleGenerate = async () => {
        if (!input.trim()) return;
        setLoading(true);
        try {
            const wisdom = await generateAffirmation(input);
            const canvas = document.createElement('canvas');
            canvas.width = 1080; canvas.height = 1080;
            const ctx = canvas.getContext('2d');
            if(ctx) {
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
                const newEntry: ArtEntry = { id: `wisdom_${Date.now()}`, userId: userId, imageUrl: imageUrl, prompt: input, createdAt: new Date().toISOString(), title: "Wisdom Card" };
                
                await Database.saveArt(newEntry);
                await refreshGallery();
                
                // Auto-download option could be added here
                setInput('');
            }
        } catch (e) { console.error("Generation Error:", e); } finally { setLoading(false); }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => { 
        e.stopPropagation(); 
        if(confirm("Delete this card?")) { 
            await Database.deleteArt(id); 
            await refreshGallery();
        } 
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm border border-yellow-100 dark:border-gray-800 mb-6">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                 <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg"><Lightbulb className="w-4 h-4 text-purple-600 dark:text-purple-400" /></div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Get Clarity</h3>
                 </div>
                 {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {isOpen && (
                <div className="p-4 pt-0">
                    <textarea className="w-full h-20 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-sm focus:border-purple-400 dark:text-white outline-none resize-none transition-all mb-2" placeholder="What's weighing on your mind?" value={input} onChange={(e) => setInput(e.target.value)} />
                    <button onClick={handleGenerate} disabled={loading || !input} className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${loading || !input ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-purple-600 text-white hover:bg-purple-500 hover:shadow-md'}`}>
                        {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} {loading ? 'Finding Clarity...' : 'Reframe Thought'}
                    </button>
                    {gallery.length > 0 && (
                        <div className="mt-6 space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Cards ({gallery.length})</h4>
                            <div className="flex flex-col gap-4">
                                {gallery.map((art) => (
                                    <div key={art.id} className="bg-gray-50 dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative group animate-in slide-in-from-top-2 fade-in">
                                        <img src={art.imageUrl} alt="Wisdom Card" className="w-full rounded-xl shadow-sm" />
                                        <div className="absolute top-3 right-3 flex gap-2"><button onClick={(e) => handleDelete(e, art.id)} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors" title="Delete"><Trash2 className="w-3 h-3"/></button></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- SOUNDSCAPE PLAYER ---
const SoundscapePlayer: React.FC = () => {
    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(0.4);
    const [track, setTrack] = useState<'rain' | 'forest' | 'ocean' | 'fire'>('rain');
    const [minimized, setMinimized] = useState(true);
    
    const audioRef = useRef<HTMLAudioElement>(null);

    const SOUND_URLS = {
        rain: 'https://assets.mixkit.co/active_storage/sfx/2496/2496-preview.mp3',
        forest: 'https://assets.mixkit.co/active_storage/sfx/1483/1483-preview.mp3',
        ocean: 'https://assets.mixkit.co/active_storage/sfx/1194/1194-preview.mp3',
        fire: 'https://assets.mixkit.co/active_storage/sfx/1169/1169-preview.mp3'
    };

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (playing) {
            audio.play().catch(console.warn);
        } else {
            audio.pause();
        }
    }, [playing]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.load(); 
        if (playing) audio.play().catch(console.warn);
    }, [track]);

    return (
        <div className={`fixed bottom-6 right-6 z-[80] transition-all duration-500 ease-in-out bg-[#FFFBEB] dark:bg-gray-900 border border-yellow-300 dark:border-yellow-600 shadow-2xl overflow-hidden ${minimized ? 'w-12 h-12 rounded-full' : 'w-72 rounded-3xl p-4'}`}>
            <audio ref={audioRef} src={SOUND_URLS[track]} loop crossOrigin="anonymous" onEnded={() => { if(playing && audioRef.current) audioRef.current.play(); }} />
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
                        <button onClick={() => setMinimized(true)} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                            <Minimize2 className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { key: 'rain', label: 'Rain', icon: CloudRain },
                            { key: 'forest', label: 'Wind', icon: Feather }, 
                            { key: 'ocean', label: 'Ocean', icon: Anchor },
                            { key: 'fire', label: 'Fire', icon: Fire }
                        ].map((item) => {
                            const isActive = track === item.key;
                            return (
                                <button key={item.key} onClick={() => setTrack(item.key as any)} className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${isActive ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg scale-105' : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-yellow-100 dark:hover:bg-gray-700 border border-yellow-100 dark:border-gray-700'}`}>
                                    <item.icon className={`w-4 h-4 mb-1 ${isActive ? 'text-yellow-400 dark:text-yellow-600' : ''}`} />
                                    <span className="text-[9px] font-bold uppercase">{item.label}</span>
                                </button>
                            )
                        })}
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setPlaying(!playing)} 
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${playing ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300'}`}
                            title={playing ? "Pause Audio" : "Play Audio"}
                        >
                            {playing ? <Volume2 className="w-6 h-6" /> : <Play className="w-5 h-5 ml-1" />}
                        </button>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.01" 
                            value={volume} 
                            onChange={e => setVolume(parseFloat(e.target.value))} 
                            className="flex-1 h-2 bg-yellow-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-black dark:accent-yellow-500" 
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

// --- WEATHER ENGINE ---
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
                if (type === 'confetti') { p.vy += 0.1; p.rotation += p.rotationSpeed; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.rotation * Math.PI) / 180); ctx.fillStyle = p.color; ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size); ctx.restore(); } 
                else { ctx.strokeStyle = p.color; ctx.lineWidth = p.size; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + p.length); ctx.stroke(); } 
                if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; if (type === 'confetti') { p.vy = Math.random() * 5 + 2; p.vx = (Math.random() - 0.5) * 10; } } 
            });
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();
        const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        window.addEventListener('resize', handleResize);
        return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', handleResize); };
    }, [type]);
    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[50]" />;
};

// --- MINDFUL MATCH GAME ---
const MindfulMatchGame: React.FC = () => {
    const [cards, setCards] = useState<any[]>([]); const [flipped, setFlipped] = useState<number[]>([]); const [solved, setSolved] = useState<number[]>([]); const [won, setWon] = useState(false); const [moves, setMoves] = useState(0); const [bestScore, setBestScore] = useState(parseInt(localStorage.getItem('mindful_best') || '0'));
    const ICONS = [Sun, Heart, Music, Zap, Star, Anchor, Feather, Cloud];
    useEffect(() => { initGame(); }, []);
    const initGame = () => { const duplicated = [...ICONS, ...ICONS]; const shuffled = duplicated.sort(() => Math.random() - 0.5).map((icon, i) => ({ id: i, icon })); setCards(shuffled); setFlipped([]); setSolved([]); setWon(false); setMoves(0); };
    const handleCardClick = (index: number) => { if (flipped.length === 2 || solved.includes(index) || flipped.includes(index)) return; const newFlipped = [...flipped, index]; setFlipped(newFlipped); if (newFlipped.length === 2) { setMoves(m => m + 1); const card1 = cards[newFlipped[0]]; const card2 = cards[newFlipped[1]]; if (card1.icon === card2.icon) { setSolved([...solved, newFlipped[0], newFlipped[1]]); setFlipped([]); } else { setTimeout(() => setFlipped([]), 1000); } } };
    useEffect(() => { if (cards.length > 0 && solved.length === cards.length) { setWon(true); if (bestScore === 0 || moves < bestScore) { setBestScore(moves); localStorage.setItem('mindful_best', moves.toString()); } } }, [solved]);
    return (
        <div className="bg-gradient-to-br from-yellow-50/50 to-white dark:from-gray-800 dark:to-gray-900 w-full h-full flex flex-col rounded-2xl p-2 md:p-0.5 lg:p-2 border border-yellow-100 dark:border-gray-700 overflow-hidden relative shadow-inner">
            <div className="absolute top-2 left-2 z-20 flex gap-2"><span className="text-[10px] font-bold bg-white/50 px-2 py-1 rounded-full text-gray-500">Moves: {moves}</span>{bestScore > 0 && <span className="text-[10px] font-bold bg-yellow-100 px-2 py-1 rounded-full text-yellow-700">Best: {bestScore}</span>}</div>
            <button onClick={initGame} className="absolute top-2 right-2 p-1.5 hover:bg-yellow-100 dark:hover:bg-gray-700 rounded-full transition-colors z-20"><RefreshCw className="w-3 h-3 md:w-4 md:h-4 text-yellow-600 dark:text-yellow-400" /></button>
            {won ? (<div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in"><Trophy className="w-12 h-12 md:w-16 md:h-16 text-yellow-500 mb-2 animate-bounce" /><p className="font-black text-lg md:text-2xl text-yellow-900 dark:text-white">Zen Master!</p><p className="text-xs text-gray-500 mb-4">Completed in {moves} moves</p><button onClick={initGame} className="mt-2 bg-black dark:bg-white dark:text-black text-white px-4 py-1.5 md:px-6 md:py-2 rounded-full font-bold text-xs md:text-sm hover:scale-105 transition-transform">Replay</button></div>) : (<div className="flex-1 flex items-center justify-center min-h-0"><div className="grid grid-cols-4 grid-rows-4 gap-1.5 md:gap-0.5 lg:gap-2 w-full aspect-square p-2">{cards.map((card, i) => { const isVisible = flipped.includes(i) || solved.includes(i); const Icon = card.icon; return (<div key={i} className="w-full h-full perspective-1000"><button onClick={() => handleCardClick(i)} className={`w-full h-full rounded-md md:rounded-lg flex items-center justify-center transition-all duration-500 transform-style-3d ${isVisible ? 'bg-white dark:bg-gray-700 border-2 border-yellow-400 shadow-lg rotate-y-180' : 'bg-gray-900 dark:bg-gray-800 shadow-md'}`}>{isVisible ? <Icon className="w-6 h-6 md:w-10 md:h-10 text-yellow-500 animate-in zoom-in" /> : <div className="w-2 h-2 bg-gray-700 rounded-full"></div>}</button></div>); })}</div></div>)}
        </div>
    );
};

// --- CLOUD HOP GAME ---
const CloudHopGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null); const requestRef = useRef<number | undefined>(undefined); const [score, setScore] = useState(0); const [gameOver, setGameOver] = useState(false); const [gameStarted, setGameStarted] = useState(false); 
    const GRAVITY = 0.4; const JUMP_FORCE = -9; const MOVE_SPEED = 4; const playerRef = useRef({ x: 150, y: 300, vx: 0, vy: 0, width: 30, height: 30 }); const platformsRef = useRef<any[]>([]);
    useEffect(() => {
        if (!gameStarted) return; const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
        platformsRef.current = [{x: 0, y: 380, w: 400, h: 40, type: 'ground'}]; let py = 300; while (py > -2000) { platformsRef.current.push({ x: Math.random() * 300, y: py, w: 70 + Math.random() * 30, h: 15, type: Math.random() > 0.9 ? 'moving' : 'cloud', vx: Math.random() > 0.5 ? 1 : -1 }); py -= 70 + Math.random() * 40; }
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') playerRef.current.vx = -MOVE_SPEED; if (e.key === 'ArrowRight') playerRef.current.vx = MOVE_SPEED; }; const handleKeyUp = () => { playerRef.current.vx = 0; }; window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
        const drawCloud = (x: number, y: number, w: number, h: number, type: string) => { ctx.fillStyle = type === 'moving' ? '#E0F2FE' : 'white'; if (type === 'moving') ctx.shadowColor = '#38BDF8'; ctx.fillRect(x, y, w, h); ctx.beginPath(); ctx.arc(x+10, y, 15, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+w-10, y, 15, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+w/2, y-5, 20, 0, Math.PI*2); ctx.fill(); ctx.shadowColor = 'transparent'; };
        const update = () => {
            const p = playerRef.current; p.x += p.vx; if (p.x < -p.width) p.x = 400; if (p.x > 400) p.x = -p.width; p.vy += GRAVITY; p.y += p.vy;
            if (p.y < 200) { const diff = 200 - p.y; p.y = 200; setScore(s => s + Math.floor(diff)); platformsRef.current.forEach(pl => { pl.y += diff; if (pl.y > 450) { pl.y = -20; pl.x = Math.random() * 340; pl.type = Math.random() > 0.85 ? 'moving' : 'cloud'; } }); }
            if (p.vy > 0) { platformsRef.current.forEach(pl => { if (p.y + p.height > pl.y && p.y + p.height < pl.y + 40 && p.x + p.width > pl.x && p.x < pl.x + pl.w) { p.vy = JUMP_FORCE; } }); }
            platformsRef.current.forEach(pl => { if (pl.type === 'moving') { pl.x += pl.vx; if (pl.x < 0 || pl.x + pl.w > 400) pl.vx *= -1; } });
            if (p.y > 450) { setGameOver(true); setGameStarted(false); if (requestRef.current !== undefined) cancelAnimationFrame(requestRef.current); return; }
            const grad = ctx.createLinearGradient(0,0,0,400); grad.addColorStop(0,'#0EA5E9'); grad.addColorStop(1,'#BAE6FD'); ctx.fillStyle = grad; ctx.fillRect(0,0,400,400); ctx.fillStyle = 'rgba(255,255,255,0.3)'; for(let i=0; i<10; i++) ctx.fillRect((i*50 + Date.now()/50)%400, (i*30 + Date.now()/20)%400, 2, 2);
            platformsRef.current.forEach(pl => { if(pl.type==='ground') { ctx.fillStyle='#4ade80'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h); } else { drawCloud(pl.x, pl.y, pl.w, pl.h, pl.type); } });
            ctx.shadowBlur = 15; ctx.shadowColor = 'white'; ctx.fillStyle = '#FACC15'; ctx.beginPath(); ctx.arc(p.x+15, p.y+15, 15, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(p.x+10, p.y+12, 2, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(p.x+20, p.y+12, 2, 0, Math.PI*2); ctx.fill();
            requestRef.current = requestAnimationFrame(update);
        }; update();
        return () => { if (requestRef.current !== undefined) cancelAnimationFrame(requestRef.current); window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, [gameStarted]);
    const handleTap = (e: React.MouseEvent | React.TouchEvent) => { if (!canvasRef.current) return; const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX; const rect = canvasRef.current.getBoundingClientRect(); if (clientX - rect.left < rect.width / 2) playerRef.current.vx = -MOVE_SPEED; else playerRef.current.vx = MOVE_SPEED; }; const handleRelease = () => { playerRef.current.vx = 0; };
    return (<div className="relative h-full w-full bg-sky-300 overflow-hidden rounded-2xl border-4 border-white dark:border-gray-700 shadow-inner cursor-pointer" onMouseDown={handleTap} onMouseUp={handleRelease} onTouchStart={handleTap} onTouchEnd={handleRelease}><div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-black text-white text-base md:text-lg z-10">{score}m</div><canvas ref={canvasRef} width={400} height={400} className="w-full h-full object-contain" />{(!gameStarted || gameOver) && (<div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20 animate-in fade-in"><div className="text-center">{gameOver && <p className="text-white font-black text-2xl mb-4 drop-shadow-md">Fall!</p>}<button onClick={() => { setGameStarted(true); setGameOver(false); setScore(0); playerRef.current = {x:150,y:300,vx:0,vy:0,width:30,height:30}; }} className="bg-yellow-400 text-yellow-900 px-6 py-2 md:px-8 md:py-3 rounded-full font-black text-sm md:text-lg shadow-xl hover:scale-110 transition-transform flex items-center gap-2"><Play className="w-4 h-4 md:w-5 md:h-5 fill-current" /> {gameOver ? 'Try Again' : 'Play'}</button></div></div>)}</div>);
};

// --- BREATHING EXERCISE ---
const BreathingExercise: React.FC<{ userId: string; onClose: () => void }> = ({ userId, onClose }) => {
    const [phase, setPhase] = useState('Inhale');
    const [secondsLeft, setSecondsLeft] = useState(4);
    const [totalSeconds, setTotalSeconds] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Web Audio Refs for Breath Sound
    const audioCtxRef = useRef<AudioContext | null>(null);
    const nodesRef = useRef<AudioNode[]>([]);
    const gainRef = useRef<GainNode | null>(null);

    const toggleSound = () => {
        if (isPlaying) {
            nodesRef.current.forEach(node => {
                try { (node as any).stop(); } catch(e) {}
                try { node.disconnect(); } catch(e) {}
            });
            nodesRef.current = [];
            setIsPlaying(false);
        } else {
            // Updated: Ethereal "Choir Pad" Sound
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContextClass();
            audioCtxRef.current = ctx;
            
            const masterGain = ctx.createGain();
            masterGain.gain.value = 0;
            masterGain.connect(ctx.destination);
            gainRef.current = masterGain;

            // 3 Oscillators for rich texture (Chord/Pad)
            const freqs = [196.00, 246.94, 293.66]; // G3, B3, D4 (G Major chord)
            
            freqs.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                osc.type = i === 0 ? 'sine' : 'triangle';
                osc.frequency.value = freq;
                
                // Slight detune for thickness
                osc.detune.value = Math.random() * 10 - 5; 

                const oscGain = ctx.createGain();
                oscGain.gain.value = 0.15;

                osc.connect(oscGain);
                oscGain.connect(masterGain);
                osc.start();
                nodesRef.current.push(osc, oscGain);
            });
            nodesRef.current.push(masterGain);
            
            setIsPlaying(true);
        }
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setSecondsLeft(prev => { if (prev <= 1) { if (phase === 'Inhale') { setPhase('Hold'); return 4; } if (phase === 'Hold') { setPhase('Exhale'); return 4; } if (phase === 'Exhale') { setPhase('Inhale'); return 4; } } return prev - 1; });
            setTotalSeconds(s => s + 1);
        }, 1000);
        
        // Modulate Breath Sound (Pad Swell)
        if (gainRef.current && audioCtxRef.current) {
            const now = audioCtxRef.current.currentTime;
            
            if (phase === 'Inhale') {
                // Swell Up
                gainRef.current.gain.cancelScheduledValues(now);
                gainRef.current.gain.linearRampToValueAtTime(0.4, now + 4);
            } else if (phase === 'Hold') {
                // Sustain
                gainRef.current.gain.setTargetAtTime(0.35, now, 0.5);
            } else if (phase === 'Exhale') {
                // Fade Down
                gainRef.current.gain.cancelScheduledValues(now);
                gainRef.current.gain.linearRampToValueAtTime(0.05, now + 4);
            }
        }

        return () => clearInterval(timer);
    }, [phase]);

    useEffect(() => {
        return () => {
            nodesRef.current.forEach(node => { try{ (node as any).stop() }catch(e){} node.disconnect() });
            if (audioCtxRef.current) audioCtxRef.current.close();
        }
    }, []);

    const handleFinish = () => { Database.recordBreathSession(userId, totalSeconds); Database.setBreathingCooldown(Date.now() + 5 * 60 * 1000); onClose(); };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
             <button onClick={handleFinish} className="absolute top-6 right-6 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10"><X className="w-8 h-8"/></button>
             <div className="flex flex-col items-center">
                 <div className={`relative w-64 h-64 rounded-full flex items-center justify-center transition-all duration-[4000ms] ease-in-out border-4 border-white/20 mb-8 ${phase === 'Inhale' ? 'scale-125 bg-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.5)]' : phase === 'Exhale' ? 'scale-75 bg-blue-900/30' : 'scale-100 bg-blue-400/30'}`}>
                     <div className="text-center relative z-10"><div className="text-3xl font-black text-white mb-2">{phase}</div><div className="text-xl font-mono text-blue-200">{secondsLeft}s</div></div>
                     <div className="absolute inset-0 rounded-full animate-spin-slow border-t-2 border-white/20"></div>
                 </div>
                 <button onClick={toggleSound} className={`mb-6 px-4 py-2 font-bold rounded-full text-xs animate-pulse transition-colors ${isPlaying ? 'bg-white text-black' : 'bg-yellow-500 text-black'}`}>{isPlaying ? 'Mute Guide' : 'Play Guide Sound'}</button>
                 <p className="text-gray-400 text-sm font-medium tracking-wider uppercase">Session Time: {Math.floor(totalSeconds / 60)}:{String(totalSeconds % 60).padStart(2, '0')}</p>
                 <button onClick={handleFinish} className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white font-bold transition-colors">End Session</button>
             </div>
        </div>
    );
}

// --- MOOD TRACKER ---
const MoodTracker: React.FC<{ onMoodSelect: (mood: 'confetti' | 'rain' | null) => void }> = ({ onMoodSelect }) => {
    return (
        <div className="bg-[#FFFBEB] dark:bg-gray-900 border border-yellow-200 dark:border-gray-800 p-4 md:p-6 rounded-3xl mb-4 hover:shadow-md transition-all">
            <h4 className="font-bold text-base md:text-lg text-gray-900 dark:text-white mb-2 flex items-center gap-2"><Activity className="w-4 h-4 md:w-5 md:h-5 text-yellow-600 dark:text-yellow-500"/> How are you feeling?</h4>
            <div className="flex gap-2">
                <button onClick={() => onMoodSelect('confetti')} className="flex-1 py-3 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-300 rounded-xl flex items-center justify-center transition-colors group"><Sun className="w-5 h-5 md:w-6 md:h-6 text-yellow-600 dark:text-yellow-400 group-hover:rotate-180 transition-transform" /></button>
                <button onClick={() => onMoodSelect(null)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"><div className="w-3 h-3 md:w-4 md:h-4 bg-gray-400 rounded-full"></div></button>
                <button onClick={() => onMoodSelect('rain')} className="flex-1 py-3 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-300 rounded-xl flex items-center justify-center transition-colors group"><CloudRain className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" /></button>
            </div>
        </div>
    );
};

// --- PAYMENT MODAL (Z-9999) ---
const PaymentModal: React.FC<{ onClose: () => void; onSuccess: (amount: number, cost: number) => void; initialError?: string }> = ({ onClose, onSuccess, initialError }) => {
    const [amount, setAmount] = useState(20); const [isCustom, setIsCustom] = useState(false); const [processing, setProcessing] = useState(false); const [error, setError] = useState<string | null>(initialError || null);
    const stripeRef = useRef<any>(null); const elementsRef = useRef<any>(null); const cardElementRef = useRef<any>(null); const mountNodeRef = useRef<HTMLDivElement>(null); const settings = Database.getSettings(); const pricePerMin = settings.pricePerMinute;
    useEffect(() => { if (!window.Stripe) { setError("Stripe failed to load. Please refresh."); return; } if (!stripeRef.current) { stripeRef.current = window.Stripe(STRIPE_PUBLISHABLE_KEY); elementsRef.current = stripeRef.current.elements(); const style = { base: { color: "#32325d", fontFamily: '"Manrope", sans-serif', fontSmoothing: "antialiased", fontSize: "16px", "::placeholder": { color: "#aab7c4" } } }; if (!cardElementRef.current) { cardElementRef.current = elementsRef.current.create("card", { style: style, hidePostalCode: true }); setTimeout(() => { if (mountNodeRef.current) cardElementRef.current.mount(mountNodeRef.current); }, 100); } } }, []);
    const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setProcessing(true); setError(null); if (!amount || amount <= 0) { setError("Please enter a valid amount."); setProcessing(false); return; } if (!stripeRef.current || !cardElementRef.current) { setError("Stripe not initialized."); setProcessing(false); return; } try { const result = await stripeRef.current.createToken(cardElementRef.current); if (result.error) { setError(result.error.message); setProcessing(false); } else { setTimeout(() => { setProcessing(false); const minutesAdded = Math.floor(amount / pricePerMin); onSuccess(minutesAdded, amount); }, 1500); } } catch (err: any) { setError(err.message || "Payment failed."); setProcessing(false); } };
    return (<div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4"><div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-gray-100 dark:border-gray-800"><div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800"><div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-green-600" /><span className="font-bold text-gray-700 dark:text-white">Secure Checkout</span></div><button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"><X className="w-5 h-5 dark:text-white" /></button></div><div className="p-8"><div className="mb-8 text-center"><p className="text-gray-500 dark:text-gray-400 text-sm mb-4 font-medium">Select Amount to Add</p>{!isCustom && <h2 className="text-5xl font-extrabold tracking-tight mb-6 dark:text-white">${amount.toFixed(2)}</h2>}<div className="flex justify-center gap-2 mb-6 flex-wrap">{[20, 50, 100, 250].map((val) => (<button key={val} type="button" onClick={() => { setAmount(val); setIsCustom(false); }} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!isCustom && amount === val ? 'bg-black dark:bg-white dark:text-black text-white shadow-lg transform scale-105' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>${val}</button>))} <button type="button" onClick={() => { setIsCustom(true); setAmount(0); }} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isCustom ? 'bg-black dark:bg-white dark:text-black text-white shadow-lg transform scale-105' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Custom</button></div>{isCustom && (<div className="mb-6 animate-in fade-in zoom-in duration-300"><div className="relative max-w-[180px] mx-auto"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">$</span><input type="number" min="1" step="1" value={amount === 0 ? '' : amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none text-2xl font-bold text-center" placeholder="0.00" autoFocus /></div></div>)}<p className="text-xs text-gray-400 mt-2">Adds approx. <span className="font-bold text-black dark:text-white">{Math.floor((amount || 0) / pricePerMin)} mins</span> of talk time.</p></div>{error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0" /><span>{error}</span></div>}<form onSubmit={handleSubmit} className="space-y-6"><div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700"><div ref={mountNodeRef} className="p-2" /></div><button type="submit" disabled={processing || !window.Stripe || (amount <= 0)} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${processing || (amount <= 0) ? 'bg-gray-800 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-yellow-500 text-black hover:bg-yellow-400 hover:scale-[1.02]'}`}>{processing ? <span className="animate-pulse">Processing Securely...</span> : <><Lock className="w-5 h-5" /> Pay ${(amount || 0).toFixed(2)}</>}</button></form></div></div></div>);
};

// --- PROFILE MODAL (Z-9999) ---
const ProfileModal: React.FC<{ user: User; onClose: () => void; onUpdate: () => void }> = ({ user, onClose, onUpdate }) => {
    const [url, setUrl] = useState(user.avatar || ''); const [name, setName] = useState(user.name);
    const save = () => { if (url) { const u = Database.getUser(); if (u) { u.avatar = url; u.name = name; Database.updateUser(u); onUpdate(); onClose(); } } };
    return (<div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4"><div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm text-center border border-gray-100 dark:border-gray-800"><h3 className="font-bold text-lg mb-4 dark:text-white">Update Profile</h3><div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-yellow-400"><AvatarImage src={url} alt="Preview" className="w-full h-full object-cover" /></div><input className="w-full p-3 border rounded-xl mb-4 dark:bg-gray-800 dark:border-gray-700 dark:text-white" placeholder="Display Name" value={name} onChange={e => setName(e.target.value)} /><input className="w-full p-3 border rounded-xl mb-4 dark:bg-gray-800 dark:border-gray-700 dark:text-white" placeholder="Avatar URL..." value={url} onChange={e => setUrl(e.target.value)} /><div className="flex gap-2"><button onClick={onClose} className="flex-1 py-2 border rounded font-bold dark:border-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button><button onClick={save} className="flex-1 py-2 bg-black dark:bg-white dark:text-black text-white rounded font-bold hover:opacity-80">Save</button></div></div></div>);
};

// --- LIVE JOURNAL MODAL (Z-9999) ---
const JournalModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [content, setContent] = useState(''); const [saved, setSaved] = useState(false); const [history, setHistory] = useState<JournalEntry[]>([]);
    useEffect(() => { const u = Database.getUser(); if (u) setHistory(Database.getJournals(u.id)); }, []);
    const handleSave = () => { if (!content.trim()) return; const u = Database.getUser(); if (u) { const entry: JournalEntry = { id: `j_${Date.now()}`, userId: u.id, date: new Date().toISOString(), content }; Database.saveJournal(entry); setHistory([entry, ...history]); setContent(''); setSaved(true); setTimeout(() => setSaved(false), 2000); } };
    return (<div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4"><div className="bg-[#FFFBEB] dark:bg-gray-900 rounded-3xl w-full max-w-3xl h-[700px] flex flex-col shadow-2xl relative border-4 border-white dark:border-gray-800 overflow-hidden"><div className="bg-yellow-400 dark:bg-yellow-600 p-4 md:p-6 flex justify-between items-center"><h2 className="text-xl md:text-2xl font-black text-black flex items-center gap-2"><BookOpen className="w-5 h-5 md:w-6 md:h-6"/> Live Journal</h2><button onClick={onClose} className="p-2 hover:bg-black/10 rounded-full"><X className="w-6 h-6 text-black"/></button></div><div className="flex-1 flex flex-col md:flex-row overflow-hidden"><div className="flex-1 p-4 md:p-6 flex flex-col border-r border-yellow-200 dark:border-gray-800"><textarea className="flex-1 w-full bg-white dark:bg-gray-800 dark:text-white p-4 rounded-xl border border-yellow-200 dark:border-gray-700 focus:border-yellow-500 outline-none resize-none shadow-inner text-sm md:text-base leading-relaxed" placeholder="Write your thoughts freely. Everything is encrypted locally..." value={content} onChange={e => setContent(e.target.value)}></textarea><button onClick={handleSave} className="mt-4 w-full bg-black dark:bg-white dark:text-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">{saved ? <CheckCircle className="w-5 h-5 text-green-500"/> : <Save className="w-5 h-5"/>}{saved ? "Entry Secured" : "Save Entry"}</button></div><div className="w-full md:w-80 bg-white dark:bg-gray-800 p-6 overflow-y-auto hidden md:block border-l border-gray-100 dark:border-gray-700"><h3 className="font-bold text-gray-400 text-xs uppercase mb-4 tracking-wider">Previous Entries</h3><div className="space-y-4">{history.length === 0 && <p className="text-gray-400 text-sm">No entries yet.</p>}{history.map(entry => (<div key={entry.id} className="p-4 bg-yellow-50 dark:bg-gray-700/50 rounded-xl border border-yellow-100 dark:border-gray-600 hover:border-yellow-300 transition-colors cursor-default"><p className="text-xs text-gray-400 font-bold mb-2 uppercase tracking-wide">{new Date(entry.date).toLocaleDateString()} • {new Date(entry.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p><p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-4 leading-relaxed font-medium">{entry.content}</p></div>))}</div></div></div></div></div>);
};

// ==========================================
// DASHBOARD MAIN
// ==========================================

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onStartSession }) => {
  const [activeTab, setActiveTab] = useState<'hub' | 'history' | 'settings'>('hub');
  const [darkMode, setDarkMode] = useState(false); 
  const [balance, setBalance] = useState(user.balance);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [loadingCompanions, setLoadingCompanions] = useState(true);
  const [weeklyGoal, setWeeklyGoal] = useState(0);
  const [weeklyTarget, setWeeklyTarget] = useState(10);
  const [weeklyMessage, setWeeklyMessage] = useState("Start your journey.");
  const [dailyInsight, setDailyInsight] = useState<string>('');
  const [dashboardUser, setDashboardUser] = useState(user);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | undefined>(undefined);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showGrounding, setShowGrounding] = useState(false);
  const [mood, setMood] = useState<'confetti' | 'rain' | null>(null);

  // Tech Check & Connection State
  const [showTechCheck, setShowTechCheck] = useState(false);
  const [pendingCompanion, setPendingCompanion] = useState<Companion | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    // Sync Theme
    const savedTheme = localStorage.getItem('peutic_theme');
    if (savedTheme === 'dark') {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
    }

    refreshData();
    
    // Generate Insight
    generateDailyInsight(user.name).then(setDailyInsight);

    // Companions with slight delay for effect
    setTimeout(() => {
        setCompanions(Database.getCompanions());
        setLoadingCompanions(false);
    }, 500);

    // Periodic Refresh
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
      const u = Database.getUser();
      if (u) {
          setDashboardUser(u);
          setBalance(u.balance);
          const txs = Database.getUserTransactions(u.id);
          setTransactions(txs);
          const prog = Database.getWeeklyProgress(u.id);
          setWeeklyGoal(prog.current);
          setWeeklyMessage(prog.message);
      }
      setCompanions(Database.getCompanions());
  };

  const handleMoodSelect = (m: 'confetti' | 'rain' | null) => {
      setMood(m);
      if (m) {
          Database.saveMood(user.id, m);
          if (m === 'confetti') {
              // Confetti logic handled by Effect component
          }
      }
  };

  const handlePaymentSuccess = (minutesAdded: number, cost: number) => {
      Database.topUpWallet(minutesAdded, cost, user.id);
      refreshData();
      setShowPayment(false);
  };

  const handleStartConnection = (c: Companion) => {
      setPendingCompanion(c);
      setShowTechCheck(true);
  };

  const confirmSession = () => {
      setShowTechCheck(false);
      if (pendingCompanion) {
          onStartSession(pendingCompanion);
      }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${darkMode ? 'dark bg-[#0A0A0A] text-white' : 'bg-[#FFFBEB] text-black'}`}>
      
      {/* Global Effects */}
      {mood && <WeatherEffect type={mood} />}
      <SoundscapePlayer />

      {/* --- MOBILE TOP BAR --- */}
      <div className="md:hidden sticky top-0 bg-[#FFFBEB]/90 dark:bg-black/90 backdrop-blur-md border-b border-yellow-200 dark:border-gray-800 p-4 flex justify-between items-center z-40">
          <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-400 dark:bg-yellow-600 rounded-lg flex items-center justify-center shadow-md">
                  <Heart className="w-5 h-5 text-black dark:text-white fill-black dark:fill-white" />
              </div>
              <span className="font-black tracking-tight text-lg">Peutic</span>
          </div>
          <div className="flex items-center gap-3">
              <button onClick={() => setShowPayment(true)} className="bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-full text-xs font-bold shadow-md">{balance}m</button>
              <button onClick={() => setShowProfile(true)} className="w-8 h-8 rounded-full overflow-hidden border border-gray-300 dark:border-gray-700">
                  <AvatarImage src={dashboardUser.avatar || ''} alt="User" className="w-full h-full object-cover" />
              </button>
          </div>
      </div>

      <div className="flex h-screen overflow-hidden pt-[60px] md:pt-0">
          
          {/* --- SIDEBAR (Desktop) --- */}
          <aside className="hidden md:flex w-24 lg:w-72 flex-col border-r border-yellow-200 dark:border-gray-800 bg-[#FFFBEB]/50 dark:bg-black/50 backdrop-blur-xl">
              <div className="p-6 lg:p-8 flex items-center justify-center lg:justify-start gap-3">
                  <div className="w-10 h-10 bg-yellow-400 dark:bg-yellow-600 rounded-xl flex items-center justify-center shadow-lg group hover:scale-110 transition-transform">
                      <Heart className="w-6 h-6 text-black dark:text-white fill-black dark:fill-white" />
                  </div>
                  <span className="hidden lg:block text-2xl font-black tracking-tight">Peutic</span>
              </div>

              <nav className="flex-1 px-4 py-8 space-y-4">
                  {[
                      { id: 'hub', icon: LayoutDashboard, label: 'Sanctuary' },
                      { id: 'history', icon: Clock, label: 'Journey' },
                      { id: 'settings', icon: Settings, label: 'Config' }
                  ].map((item) => (
                      <button 
                          key={item.id}
                          onClick={() => setActiveTab(item.id as any)}
                          className={`w-full flex items-center justify-center lg:justify-start gap-4 p-4 rounded-2xl transition-all duration-300 group ${activeTab === item.id ? 'bg-black text-white dark:bg-white dark:text-black shadow-xl' : 'text-gray-500 hover:bg-yellow-100 dark:hover:bg-gray-800 dark:text-gray-400'}`}
                      >
                          <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'text-yellow-400 dark:text-yellow-600' : 'group-hover:text-yellow-600 dark:group-hover:text-white'}`} />
                          <span className="hidden lg:block font-bold text-sm tracking-wide">{item.label}</span>
                      </button>
                  ))}
              </nav>

              <div className="p-4 lg:p-8 border-t border-yellow-200 dark:border-gray-800">
                  <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-bold text-sm">
                      <LogOut className="w-5 h-5" />
                      <span className="hidden lg:block">Disconnect</span>
                  </button>
              </div>
          </aside>

          {/* --- MAIN CONTENT --- */}
          <main className="flex-1 overflow-y-auto relative scroll-smooth">
              <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12 pb-32">
                  
                  {/* --- HEADER SECTION --- */}
                  <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                      <div>
                          <p className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                          <h1 className="text-3xl md:text-5xl font-black tracking-tight dark:text-white">
                              {activeTab === 'hub' ? `Hello, ${user.name.split(' ')[0]}.` : activeTab === 'history' ? 'Your Journey' : 'Settings'}
                          </h1>
                          {activeTab === 'hub' && dailyInsight && (
                              <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-lg text-sm md:text-base font-medium leading-relaxed border-l-4 border-yellow-400 pl-4 italic">
                                  "{dailyInsight}"
                              </p>
                          )}
                      </div>

                      <div className="hidden md:flex items-center gap-4">
                          <button 
                              onClick={() => setShowPayment(true)}
                              className={`px-6 py-3 rounded-2xl font-black shadow-lg transition-transform hover:scale-105 flex items-center gap-2 ${balance < 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-black dark:bg-white text-white dark:text-black'}`}
                          >
                             <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                             {balance} mins
                             <Plus className="w-4 h-4 ml-1 opacity-50" />
                          </button>
                          <button onClick={() => setShowProfile(true)} className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-yellow-400 shadow-xl hover:rotate-3 transition-transform">
                              <AvatarImage src={dashboardUser.avatar || ''} alt={dashboardUser.name} className="w-full h-full object-cover" />
                          </button>
                      </div>
                  </header>

                  {/* --- TAB CONTENT --- */}
                  
                  {activeTab === 'hub' && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                          
                          {/* Top Row: Weekly Progress & Mood */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-yellow-100 dark:border-gray-800 shadow-sm col-span-1 md:col-span-2 relative overflow-hidden group">
                                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Trophy className="w-24 h-24 text-yellow-500" /></div>
                                  <div className="relative z-10">
                                      <h3 className="font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest mb-1">Weekly Wellness Goal</h3>
                                      <div className="flex items-end gap-2 mb-4">
                                          <span className="text-4xl font-black dark:text-white">{weeklyGoal}</span>
                                          <span className="text-gray-400 text-sm font-bold mb-1">/ {weeklyTarget} activities</span>
                                      </div>
                                      <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-3">
                                          <div className="h-full bg-yellow-400 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, (weeklyGoal / weeklyTarget) * 100)}%` }}></div>
                                      </div>
                                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{weeklyMessage}</p>
                                  </div>
                              </div>
                              <MoodTracker onMoodSelect={handleMoodSelect} />
                          </div>

                          {/* Tools Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <button onClick={() => setShowBreathing(true)} className="p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-2xl border border-blue-100 dark:border-blue-900/50 transition-all text-left group">
                                  <Wind className="w-6 h-6 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                                  <p className="font-bold text-sm dark:text-blue-100">Breathe</p>
                              </button>
                              <button onClick={() => setShowGrounding(true)} className="p-4 bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/40 rounded-2xl border border-teal-100 dark:border-teal-900/50 transition-all text-left group">
                                  <Anchor className="w-6 h-6 text-teal-500 mb-3 group-hover:scale-110 transition-transform" />
                                  <p className="font-bold text-sm dark:text-teal-100">Grounding</p>
                              </button>
                              <button onClick={() => setShowJournal(true)} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 rounded-2xl border border-yellow-100 dark:border-yellow-900/50 transition-all text-left group">
                                  <BookOpen className="w-6 h-6 text-yellow-600 mb-3 group-hover:scale-110 transition-transform" />
                                  <p className="font-bold text-sm dark:text-yellow-100">Journal</p>
                              </button>
                              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-900/50 text-left relative overflow-hidden">
                                  <Gamepad2 className="w-6 h-6 text-purple-500 mb-3" />
                                  <p className="font-bold text-sm dark:text-purple-100">Mini Games</p>
                                  <span className="absolute top-2 right-2 text-[8px] font-black bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-white px-1.5 py-0.5 rounded">BETA</span>
                              </div>
                          </div>

                          {/* Wisdom Generator */}
                          <WisdomGenerator userId={user.id} />

                          {/* Mini Games Section */}
                          <div className="grid md:grid-cols-2 gap-6">
                              <CollapsibleSection title="Mindful Match" icon={Gamepad2}>
                                  <div className="h-64 md:h-80 w-full"><MindfulMatchGame /></div>
                              </CollapsibleSection>
                              <CollapsibleSection title="Cloud Hop" icon={Cloud}>
                                  <div className="h-64 md:h-80 w-full"><CloudHopGame /></div>
                              </CollapsibleSection>
                          </div>

                          {/* COMPANION GRID */}
                          <div>
                              <div className="flex justify-between items-end mb-6">
                                  <div>
                                      <h2 className="text-2xl font-black dark:text-white">Available Specialists</h2>
                                      <p className="text-gray-500 text-sm">Select a guide to begin your session.</p>
                                  </div>
                                  <div className="flex gap-2">
                                      <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><Search className="w-4 h-4 text-gray-500"/></button>
                                  </div>
                              </div>

                              {loadingCompanions ? (
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                      {[1,2,3,4].map(i => <div key={i} className="h-64 bg-gray-100 dark:bg-gray-900 rounded-3xl animate-pulse"></div>)}
                                  </div>
                              ) : (
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                      {companions.map((companion) => (
                                          <div 
                                              key={companion.id} 
                                              onClick={() => handleStartConnection(companion)}
                                              className="group relative bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden border border-yellow-100 dark:border-gray-800 hover:border-yellow-400 dark:hover:border-yellow-600 transition-all duration-300 hover:shadow-2xl cursor-pointer"
                                          >
                                              <div className="aspect-[4/5] relative overflow-hidden">
                                                  <AvatarImage src={companion.imageUrl} alt={companion.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                                                  
                                                  <div className="absolute top-3 left-3 flex gap-2">
                                                      <div className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md ${companion.status === 'AVAILABLE' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                                                          {companion.status === 'AVAILABLE' ? 'Online' : 'Busy'}
                                                      </div>
                                                  </div>
                                              </div>
                                              
                                              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 translate-y-2 group-hover:translate-y-0 transition-transform">
                                                  <p className="text-yellow-400 text-[10px] font-black uppercase tracking-widest mb-1">{companion.specialty}</p>
                                                  <h3 className="text-white text-xl md:text-2xl font-black mb-1">{companion.name}</h3>
                                                  <div className="flex items-center gap-1 mb-3 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                                                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                      <span className="text-white text-xs font-bold">{companion.rating}</span>
                                                  </div>
                                                  <button className="w-full py-3 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-yellow-400 transition-colors opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 duration-300">
                                                      Start Session
                                                  </button>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>
                  )}

                  {activeTab === 'history' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-500">
                          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-yellow-100 dark:border-gray-800 overflow-hidden">
                              <table className="w-full text-left">
                                  <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                      <tr>
                                          <th className="p-4 md:p-6">Date</th>
                                          <th className="p-4 md:p-6">Description</th>
                                          <th className="p-4 md:p-6 text-right">Amount</th>
                                          <th className="p-4 md:p-6 text-right">Status</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                      {transactions.length === 0 ? (
                                          <tr><td colSpan={4} className="p-8 text-center text-gray-400">No history found.</td></tr>
                                      ) : (
                                          transactions.map((tx) => (
                                              <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                  <td className="p-4 md:p-6 text-sm dark:text-gray-300 font-mono">{new Date(tx.date).toLocaleDateString()}</td>
                                                  <td className="p-4 md:p-6 text-sm font-bold dark:text-white">{tx.description}</td>
                                                  <td className={`p-4 md:p-6 text-sm text-right font-mono font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                                                      {tx.amount > 0 ? '+' : ''}{tx.amount}m
                                                  </td>
                                                  <td className="p-4 md:p-6 text-right">
                                                      <span className="px-2 py-1 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase tracking-wide">
                                                          {tx.status}
                                                      </span>
                                                  </td>
                                              </tr>
                                          ))
                                      )}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  )}

                  {activeTab === 'settings' && (
                      <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-5 duration-500">
                          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-yellow-100 dark:border-gray-800 space-y-6">
                              <h3 className="font-bold text-lg dark:text-white mb-4">Preferences</h3>
                              <div className="flex items-center justify-between">
                                  <span className="text-gray-600 dark:text-gray-400 font-medium">Dark Mode</span>
                                  <button onClick={() => { setDarkMode(!darkMode); if(!darkMode) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); localStorage.setItem('peutic_theme', !darkMode ? 'dark' : 'light'); }} className={`w-12 h-6 rounded-full relative transition-colors ${darkMode ? 'bg-yellow-500' : 'bg-gray-300'}`}>
                                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${darkMode ? 'left-7' : 'left-1'}`}></div>
                                  </button>
                              </div>
                              <div className="flex items-center justify-between">
                                  <span className="text-gray-600 dark:text-gray-400 font-medium">Email Notifications</span>
                                  <button className="w-12 h-6 rounded-full relative bg-yellow-500"><div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow-sm"></div></button>
                              </div>
                              <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                                  <button className="text-red-500 font-bold text-sm hover:text-red-600">Delete Account Data</button>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </main>
      </div>

      {/* MODALS */}
      {showPayment && <PaymentModal onClose={() => { setShowPayment(false); setPaymentError(undefined); }} onSuccess={handlePaymentSuccess} initialError={paymentError} />}
      {showBreathing && <BreathingExercise userId={user.id} onClose={() => setShowBreathing(false)} />}
      {showProfile && <ProfileModal user={dashboardUser} onClose={() => setShowProfile(false)} onUpdate={refreshData} />}
      {showJournal && <JournalModal onClose={() => setShowJournal(false)} />}
      {showGrounding && <GroundingMode onClose={() => setShowGrounding(false)} />}
      
      {/* TECH CHECK OVERLAY */}
      {showTechCheck && (
          <TechCheck 
              onConfirm={confirmSession}
              onCancel={() => setShowTechCheck(false)}
          />
      )}

    </div>
  );
};

export default Dashboard;
