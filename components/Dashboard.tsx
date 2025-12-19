import React, { useState, useEffect, useRef } from 'react';
import { User, Companion, Transaction, JournalEntry, ArtEntry } from '../types';
import { 
  Video, CreditCard, Clock, Settings, LogOut, 
  LayoutDashboard, Plus, Search, Filter, X, Lock, CheckCircle, AlertTriangle, ShieldCheck, Heart, Calendar,
  Smile, PenTool, Wind, BookOpen, Save, Sparkles, Activity, Info, Flame, Trophy, Target, Hourglass, Coffee,
  Sun, Cloud, Umbrella, Music, Feather, Anchor, Gamepad2, RefreshCw, Play, Zap, Star, Ghost, Edit2, Camera, Droplets, Users, Trash2, Bell,
  CloudRain, Image as ImageIcon, Wand2, Download, ChevronDown, ChevronUp, ChevronRight, Lightbulb, User as UserIcon, Shield, Moon
} from 'lucide-react';
import { Database, STABLE_AVATAR_POOL } from '../services/database';
import { generateAffirmation } from '../services/geminiService';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onStartSession: (companion: Companion) => void;
}

const STRIPE_PUBLISHABLE_KEY = "pk_live_51MZuG0BUviiBIU4d81PC3BDlYgxuUszLu1InD0FFWOcGwQyNYgn5jjNOYi5a0uic9iuG8FdMjZBqpihTxK7oH0W600KfPZFZwp";

declare global {
  interface Window {
    Stripe?: any;
    webkitAudioContext?: typeof AudioContext;
  }
}

// --- HELPER: COLLAPSIBLE SECTION ---
const CollapsibleSection: React.FC<{ title: string; icon?: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon: Icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-[#FFFBEB] dark:bg-gray-900 border border-yellow-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm transition-all mb-6">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-6 hover:bg-yellow-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                    {Icon && <div className="p-2 bg-yellow-100 dark:bg-gray-800 rounded-lg"><Icon className="w-5 h-5 text-yellow-700 dark:text-yellow-500" /></div>}
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{title}</h3>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {isOpen && <div className="p-6 pt-0 animate-in slide-in-from-top-2 duration-300">{children}</div>}
        </div>
    );
};

// --- ROUND ROBIN AVATAR COMPONENT ---
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

// --- LOCAL WISDOM CARD GENERATOR (Canvas API) ---
const renderWisdomCard = (text: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // 1. Background
    const hue = Math.floor(Math.random() * 360);
    const grd = ctx.createLinearGradient(0, 0, 1080, 1080);
    grd.addColorStop(0, `hsl(${hue}, 40%, 95%)`);
    grd.addColorStop(1, `hsl(${(hue + 40) % 360}, 30%, 90%)`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 1080, 1080);

    // 2. Decorative Circle
    ctx.fillStyle = `hsla(${hue}, 60%, 80%, 0.2)`;
    ctx.beginPath();
    ctx.arc(540, 540, 400, 0, Math.PI * 2);
    ctx.fill();

    // 3. Text Configuration
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Quote logic
    const words = text.split(' ');
    let fontSize = 80;
    if (words.length > 15) fontSize = 60;
    
    ctx.font = `bold ${fontSize}px Manrope, sans-serif`;
    
    // Word Wrap
    const maxWidth = 800;
    const lineHeight = fontSize * 1.4;
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + ' ' + words[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth) {
            lines.push(currentLine);
            currentLine = words[i];
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine);

    // Render Text
    let y = 540 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach(line => {
        ctx.fillText(line, 540, y);
        y += lineHeight;
    });

    // Footer
    ctx.font = '500 30px Manrope, sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText('PEUTIC • DAILY WISDOM', 540, 980);

    return canvas.toDataURL('image/png');
};

// --- WISDOM & CLARITY GENERATOR ---
const WisdomGenerator: React.FC<{ userId: string }> = ({ userId }) => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [gallery, setGallery] = useState<ArtEntry[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setGallery(Database.getUserArt(userId));
    }, [userId]);

    const handleGenerate = async () => {
        if (!input.trim()) return;
        setLoading(true);
        
        try {
            // 1. Get text affirmation (AI or Local)
            const wisdom = await generateAffirmation(input);
            
            // 2. Render to image locally
            const imageUrl = renderWisdomCard(wisdom);

            if (imageUrl) {
                const newEntry: ArtEntry = {
                    id: `wisdom_${Date.now()}`,
                    userId: userId,
                    imageUrl: imageUrl,
                    prompt: input, // Store the worry/input
                    createdAt: new Date().toISOString(),
                    title: "Wisdom Card"
                };
                
                Database.saveArt(newEntry); // Persist
                setGallery(prev => [newEntry, ...prev]);
                
                // Auto Download
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = `peutic_wisdom_${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                setInput('');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if(confirm("Delete this card?")) {
            Database.deleteArt(id);
            setGallery(prev => prev.filter(g => g.id !== id));
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
                    <textarea 
                        className="w-full h-20 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-sm focus:border-purple-400 dark:text-white outline-none resize-none transition-all mb-2"
                        placeholder="What's weighing on your mind?"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button 
                        onClick={handleGenerate}
                        disabled={loading || !input}
                        className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${loading || !input ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-purple-600 text-white hover:bg-purple-500 hover:shadow-md'}`}
                    >
                        {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {loading ? 'Finding Clarity...' : 'Reframe Thought'}
                    </button>
                    
                    {/* Gallery */}
                    {gallery.length > 0 && (
                        <div className="mt-6 space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Cards</h4>
                            {gallery.map((art) => (
                                <div key={art.id} className="bg-gray-50 dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative group">
                                    <img src={art.imageUrl} alt="Wisdom Card" className="w-full rounded-xl shadow-sm" />
                                    <div className="absolute top-3 right-3 flex gap-2">
                                         <button onClick={(e) => handleDelete(e, art.id)} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors" title="Delete">
                                             <Trash2 className="w-3 h-3"/>
                                         </button>
                                    </div>
                                </div>
                            ))}
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
    const [track, setTrack] = useState('rain');
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Reliable Mixkit Sources
    const TRACKS = {
        rain: "https://assets.mixkit.co/active_storage/sfx/2393/2393-preview.mp3",
        forest: "https://assets.mixkit.co/active_storage/sfx/2434/2434-preview.mp3",
        white: "https://assets.mixkit.co/active_storage/sfx/2513/2513-preview.mp3", // Cafe
        lofi: "https://assets.mixkit.co/active_storage/sfx/1196/1196-preview.mp3"  // Ocean
    };

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        
        const audio = new Audio();
        audio.src = TRACKS[track as keyof typeof TRACKS];
        audio.loop = true;
        audio.volume = volume;
        
        audio.onerror = (e) => {
            console.error("Audio Load Error:", e);
            setPlaying(false);
        };

        audioRef.current = audio;

        if (playing) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Auto-play blocked or failed:", error);
                    setPlaying(false);
                });
            }
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [track]);

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (playing) {
            audioRef.current.pause();
            setPlaying(false);
        } else {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setPlaying(true))
                    .catch(e => {
                        console.error("Play failed:", e);
                        setPlaying(false);
                    });
            }
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[80] flex items-center gap-2 bg-yellow-500/90 dark:bg-yellow-600/90 backdrop-blur-md p-2 rounded-full border border-yellow-300 dark:border-yellow-500 shadow-xl transition-all hover:bg-yellow-400 animate-in fade-in slide-in-from-bottom-10">
            <button onClick={togglePlay} className={`p-3 rounded-full transition-colors ${playing ? 'bg-black text-white' : 'bg-white/20 text-black dark:text-white'}`}>
                {playing ? <Music className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            {playing && (
                <div className="flex items-center gap-2 px-2 animate-in zoom-in fade-in duration-300 origin-left">
                    <select 
                        value={track} 
                        onChange={e => setTrack(e.target.value)}
                        className="bg-transparent text-xs font-bold text-black dark:text-white outline-none w-20 cursor-pointer"
                    >
                        <option value="rain">Rain</option>
                        <option value="forest">Nature</option>
                        <option value="white">Cafe</option>
                        <option value="lofi">Ocean</option>
                    </select>
                    <input 
                        type="range" min="0" max="1" step="0.1" 
                        value={volume} onChange={e => setVolume(parseFloat(e.target.value))}
                        className="w-16 h-1 bg-black/20 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
                    />
                </div>
            )}
        </div>
    );
};

// --- WEATHER ENGINE ---
const WeatherEffect: React.FC<{ type: 'confetti' | 'rain' }> = ({ type }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const particles: any[] = [];
        const particleCount = type === 'confetti' ? 150 : 400; 
        
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                vx: type === 'confetti' ? (Math.random() - 0.5) * 10 : 0,
                vy: type === 'confetti' ? Math.random() * 5 + 2 : Math.random() * 15 + 10, 
                color: type === 'confetti' 
                    ? ['#FACC15', '#FFD700', '#FF0000', '#00FF00', '#0000FF'][Math.floor(Math.random() * 5)]
                    : '#60A5FA', 
                size: type === 'confetti' ? Math.random() * 8 + 4 : Math.random() * 2 + 1,
                length: type === 'rain' ? Math.random() * 20 + 10 : 0
            });
        }
        
        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                if (type === 'confetti') { p.vy += 0.1; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); } 
                else { ctx.strokeStyle = p.color; ctx.lineWidth = p.size; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + p.length); ctx.stroke(); }
                if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; if (type === 'confetti') p.vy = Math.random() * 5 + 2; }
            });
            requestAnimationFrame(animate);
        };
        animate();
    }, [type]);
    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[50]" />;
};

// --- MINDFUL MATCH 3D ---
const MindfulMatchGame: React.FC<{ onWin?: () => void }> = ({ onWin }) => {
    const [cards, setCards] = useState<any[]>([]);
    const [flipped, setFlipped] = useState<number[]>([]);
    const [solved, setSolved] = useState<number[]>([]);
    const [won, setWon] = useState(false);
    const ICONS = [Sun, Heart, Music, Zap, Star, Anchor, Feather, Cloud];

    useEffect(() => { initGame(); }, []);

    const initGame = () => {
        const duplicated = [...ICONS, ...ICONS];
        const shuffled = duplicated.sort(() => Math.random() - 0.5).map((icon, i) => ({ id: i, icon }));
        setCards(shuffled); setFlipped([]); setSolved([]); setWon(false);
    };

    const handleCardClick = (index: number) => {
        if (flipped.length === 2 || solved.includes(index) || flipped.includes(index)) return;
        const newFlipped = [...flipped, index];
        setFlipped(newFlipped);
        if (newFlipped.length === 2) {
            if (cards[newFlipped[0]].icon === cards[newFlipped[1]].icon) {
                setSolved([...solved, newFlipped[0], newFlipped[1]]);
                setFlipped([]);
            } else {
                setTimeout(() => setFlipped([]), 1000);
            }
        }
    };

    useEffect(() => { if (cards.length > 0 && solved.length === cards.length) { setWon(true); onWin?.(); } }, [solved]);

    return (
        <div className="bg-gradient-to-br from-yellow-50/50 to-white dark:from-gray-800 dark:to-gray-900 h-full flex flex-col rounded-2xl p-1 border border-yellow-100 dark:border-gray-700 overflow-hidden relative shadow-inner">
            <div className="flex justify-between items-center mb-1 z-10 px-1 pt-1">
                <h3 className="font-black text-sm text-yellow-900 dark:text-yellow-500 uppercase tracking-widest">Mindful Match</h3>
                <button onClick={initGame} className="p-1 hover:bg-yellow-100 dark:hover:bg-gray-700 rounded-full transition-colors"><RefreshCw className="w-4 h-4 text-yellow-600 dark:text-yellow-400" /></button>
            </div>
            {won ? (
                <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in">
                    <Trophy className="w-16 h-16 text-yellow-500 mb-2 animate-bounce" />
                    <p className="font-black text-2xl text-yellow-900 dark:text-white">Zen Master!</p>
                    <button onClick={initGame} className="mt-4 bg-black dark:bg-white dark:text-black text-white px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform">Replay</button>
                </div>
            ) : (
                <div className="grid grid-cols-4 grid-rows-4 gap-1 h-full p-0 flex-1">
                    {cards.map((card, i) => {
                        const isVisible = flipped.includes(i) || solved.includes(i);
                        const Icon = card.icon;
                        return (
                            <div key={i} className="w-full h-full">
                                <button onClick={() => handleCardClick(i)} className={`w-full h-full rounded-lg flex items-center justify-center transition-all duration-300 ${isVisible ? 'bg-white dark:bg-gray-700 border-2 border-yellow-400 shadow-lg' : 'bg-gray-900 dark:bg-gray-800 shadow-md'}`}>
                                    {isVisible && <Icon className="w-6 h-6 text-yellow-500 animate-in zoom-in" />}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// --- CLOUD HOP ---
const CloudHopGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const playerRef = useRef({ x: 150, y: 300, vx: 0, vy: 0 });

    useEffect(() => {
        if (!gameStarted) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const GRAVITY = 0.4;
        let platforms = [{x: 0, y: 380, w: 400, h: 40, type: 'ground'}];
        let req: number;
        
        let py = 300;
        while (py > -2000) {
            platforms.push({ x: Math.random() * 300, y: py, w: 70, h: 15, type: 'cloud' });
            py -= 90;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') playerRef.current.vx = -4;
            if (e.key === 'ArrowRight') playerRef.current.vx = 4;
        };
        const handleKeyUp = () => { playerRef.current.vx = 0; };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        const drawCloud = (x: number, y: number, w: number, h: number) => {
             ctx.fillStyle = 'white';
             ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill();
             ctx.beginPath(); ctx.arc(x+10, y, 15, 0, Math.PI*2); ctx.fill();
             ctx.beginPath(); ctx.arc(x+w-10, y, 15, 0, Math.PI*2); ctx.fill();
             ctx.beginPath(); ctx.arc(x+w/2, y-5, 20, 0, Math.PI*2); ctx.fill();
        };

        const update = () => {
            const p = playerRef.current;
            p.x += p.vx;
            if (p.x < -20) p.x = 400; if (p.x > 400) p.x = -20;
            p.vy += GRAVITY; p.y += p.vy;

            if (p.y < 200) {
                p.y = 200;
                setScore(s => s + Math.floor(Math.abs(p.vy)));
                platforms.forEach(pl => {
                    pl.y += Math.abs(p.vy);
                    if (pl.y > 450) { pl.y = -20; pl.x = Math.random() * 340; }
                });
            }

            if (p.vy > 0) {
                platforms.forEach(pl => {
                    if (p.y + 20 > pl.y && p.y + 20 < pl.y + 40 && p.x + 20 > pl.x && p.x < pl.x + pl.w) {
                        p.vy = -10;
                    }
                });
            }

            if (p.y > 450) { setGameOver(true); setGameStarted(false); cancelAnimationFrame(req); return; }

            const grad = ctx.createLinearGradient(0,0,0,400); grad.addColorStop(0,'#38bdf8'); grad.addColorStop(1,'#bae6fd');
            ctx.fillStyle = grad; ctx.fillRect(0,0,400,400);
            
            ctx.fillStyle = 'white';
            for(let i=0; i<20; i++) ctx.fillRect(Math.random()*400, Math.random()*400, 2, 2);

            platforms.forEach(pl => {
                if(pl.type==='ground') { ctx.fillStyle='#4ade80'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h); }
                else drawCloud(pl.x, pl.y, pl.w, pl.h);
            });

            ctx.shadowBlur = 15; ctx.shadowColor = 'white';
            ctx.fillStyle = '#FACC15'; ctx.beginPath(); ctx.arc(p.x+15, p.y+15, 15, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'black'; 
            ctx.beginPath(); ctx.arc(p.x+10, p.y+12, 2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(p.x+20, p.y+12, 2, 0, Math.PI*2); ctx.fill();

            req = requestAnimationFrame(update);
        };
        update();

        return () => { 
            cancelAnimationFrame(req); 
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameStarted]);

    const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
        if (!canvasRef.current) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const rect = canvasRef.current.getBoundingClientRect();
        if (clientX - rect.left < rect.width / 2) playerRef.current.vx = -5;
        else playerRef.current.vx = 5;
    };
    
    const handleRelease = () => { playerRef.current.vx = 0; };

    return (
        <div 
            className="relative h-full w-full bg-sky-300 overflow-hidden rounded-2xl border-4 border-white dark:border-gray-700 shadow-inner cursor-pointer"
            onMouseDown={handleTap} onMouseUp={handleRelease}
            onTouchStart={handleTap} onTouchEnd={handleRelease}
        >
            <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-black text-white text-lg z-10">{score}m</div>
            <canvas ref={canvasRef} width={400} height={400} className="w-full h-full" />
            {(!gameStarted || gameOver) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                    <button onClick={() => { setGameStarted(true); setGameOver(false); setScore(0); playerRef.current = {x:150,y:300,vx:0,vy:0}; }} className="bg-yellow-400 text-yellow-900 px-8 py-3 rounded-full font-black text-lg shadow-xl hover:scale-110 transition-transform flex items-center gap-2">
                        <Play className="w-5 h-5 fill-current" /> {gameOver ? 'Try Again' : 'Play'}
                    </button>
                </div>
            )}
        </div>
    );
};

// --- BREATHING EXERCISE ---
const BreathingExercise: React.FC<{ onClose: () => void; userId: string }> = ({ onClose, userId }) => {
    const [text, setText] = useState("Inhale");
    const [timeLeft, setTimeLeft] = useState(120); 
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [duration, setDuration] = useState(0); // Track session length
    
    // Stable, high-quality ambient track from Mixkit CDN
    const AMBIENT_SONG_URL = "https://assets.mixkit.co/active_storage/sfx/1196/1196-preview.mp3"; 

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.5;
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsPlaying(true))
                    .catch(error => {
                        console.log("Autoplay blocked, waiting for interaction", error);
                        setIsPlaying(false);
                    });
            }
        }

        const steps = [{ text: "Inhale", delay: 4000 }, { text: "Hold", delay: 4000 }, { text: "Exhale", delay: 4000 }, { text: "Hold", delay: 4000 }];
        let stepIdx = 0;
        const loop = setInterval(() => { 
            setText(steps[stepIdx].text); 
            stepIdx = (stepIdx + 1) % steps.length; 
        }, 4000);

        const timer = setInterval(() => {
            setDuration(d => d + 1);
            setTimeLeft(p => { 
                if (p <= 1) { 
                    handleFinish();
                    return 0; 
                } 
                return p - 1; 
            });
        }, 1000);

        return () => { 
            clearInterval(loop); 
            clearInterval(timer); 
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, []);

    const handleFinish = () => {
        Database.recordBreathSession(userId, 120 - timeLeft + duration);
        Database.setBreathingCooldown(Date.now() + 5 * 60 * 1000); 
        onClose();
    };

    const manualPlay = () => {
        if (audioRef.current) {
            audioRef.current.play().then(() => setIsPlaying(true));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
             <audio ref={audioRef} src={AMBIENT_SONG_URL} loop />

             <div className="relative w-full max-w-md aspect-square flex items-center justify-center flex-col">
                <button onClick={handleFinish} className="absolute top-0 right-0 text-white/50 hover:text-white"><X className="w-8 h-8" /></button>
                <div className="absolute inset-0 bg-peutic-yellow/20 rounded-full animate-breathe"></div>
                <div className="absolute inset-12 bg-peutic-yellow/40 rounded-full animate-breathe" style={{ animationDelay: '1s' }}></div>
                <div className="relative z-10 text-center text-white">
                    <h2 className="text-4xl font-bold mb-2">{text}</h2>
                    <div className="inline-block px-4 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-mono">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</div>
                    
                    {!isPlaying ? (
                        <button onClick={manualPlay} className="mt-6 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-xs font-bold transition-colors">
                            <Play className="w-3 h-3 fill-current" /> Tap to Start Music
                        </button>
                    ) : (
                        <p className="mt-6 text-xs text-white/50 flex items-center justify-center gap-2 animate-pulse">
                            <Music className="w-3 h-3"/> Calming Audio Active
                        </p>
                    )}
                </div>
             </div>
        </div>
    );
};

// --- MOOD TRACKER COMPONENT ---
const MoodTracker: React.FC<{ onMoodSelect: (mood: 'confetti' | 'rain' | null) => void }> = ({ onMoodSelect }) => {
    return (
        <div className="bg-[#FFFBEB] dark:bg-gray-900 border border-yellow-200 dark:border-gray-800 p-6 rounded-3xl mb-4 hover:shadow-md transition-all">
            <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2 flex items-center gap-2"><Activity className="w-5 h-5 text-yellow-600 dark:text-yellow-500"/> How are you feeling?</h4>
            <div className="flex gap-2">
                <button onClick={() => onMoodSelect('confetti')} className="flex-1 py-3 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-300 rounded-xl flex items-center justify-center transition-colors">
                    <Sun className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </button>
                <button onClick={() => onMoodSelect(null)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
                    <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                </button>
                <button onClick={() => onMoodSelect('rain')} className="flex-1 py-3 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-300 rounded-xl flex items-center justify-center transition-colors">
                    <CloudRain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </button>
            </div>
        </div>
    );
};

// --- PAYMENT MODAL (Z-9999) ---
const PaymentModal: React.FC<{ onClose: () => void; onSuccess: (amount: number, cost: number) => void; initialError?: string }> = ({ onClose, onSuccess, initialError }) => {
    const [amount, setAmount] = useState(20);
    const [isCustom, setIsCustom] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(initialError || null);
    
    const stripeRef = useRef<any>(null);
    const elementsRef = useRef<any>(null);
    const cardElementRef = useRef<any>(null);
    const mountNodeRef = useRef<HTMLDivElement>(null);
    const settings = Database.getSettings();
    const pricePerMin = settings.pricePerMinute;

    useEffect(() => {
        if (!window.Stripe) { setError("Stripe failed to load. Please refresh."); return; }
        if (!stripeRef.current) {
            stripeRef.current = window.Stripe(STRIPE_PUBLISHABLE_KEY);
            elementsRef.current = stripeRef.current.elements();
            const style = { base: { color: "#32325d", fontFamily: '"Manrope", sans-serif', fontSmoothing: "antialiased", fontSize: "16px", "::placeholder": { color: "#aab7c4" } } };
            if (!cardElementRef.current) {
                cardElementRef.current = elementsRef.current.create("card", { style: style, hidePostalCode: true });
                setTimeout(() => { if (mountNodeRef.current) cardElementRef.current.mount(mountNodeRef.current); }, 100);
            }
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setError(null);
        if (!amount || amount <= 0) { setError("Please enter a valid amount."); setProcessing(false); return; }
        try {
            const result = await stripeRef.current.createToken(cardElementRef.current);
            if (result.error) { setError(result.error.message); setProcessing(false); } else {
                setTimeout(() => { 
                    setProcessing(false); 
                    const minutesAdded = Math.floor(amount / pricePerMin); 
                    onSuccess(minutesAdded, amount); 
                }, 1500);
            }
        } catch (err: any) { setError(err.message || "Payment failed."); setProcessing(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-gray-100 dark:border-gray-800">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-green-600" /><span className="font-bold text-gray-700 dark:text-white">Secure Checkout</span></div>
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
                        {isCustom && (
                            <div className="mb-6 animate-in fade-in zoom-in duration-300">
                                <div className="relative max-w-[180px] mx-auto">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
                                    <input type="number" min="1" step="1" value={amount === 0 ? '' : amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-peutic-yellow focus:ring-1 focus:ring-peutic-yellow outline-none text-2xl font-bold text-center" placeholder="0.00" autoFocus />
                                </div>
                            </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">Adds approx. <span className="font-bold text-black dark:text-white">{Math.floor((amount || 0) / pricePerMin)} mins</span> of talk time.</p>
                    </div>
                    {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0" /><span>{error}</span></div>}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700"><div ref={mountNodeRef} className="p-2" /></div>
                        <button type="submit" disabled={processing || !window.Stripe || (amount <= 0)} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${processing || (amount <= 0) ? 'bg-gray-800 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-peutic-yellow text-black hover:bg-yellow-400 hover:scale-[1.02]'}`}>
                            {processing ? <span className="animate-pulse">Processing Securely...</span> : <><Lock className="w-5 h-5" /> Pay ${(amount || 0).toFixed(2)}</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- PROFILE MODAL (Z-9999) ---
const ProfileModal: React.FC<{ user: User; onClose: () => void; onUpdate: () => void }> = ({ user, onClose, onUpdate }) => {
    const [url, setUrl] = useState(user.avatar || '');
    const save = () => {
        if (url) {
            const u = Database.getUser();
            if (u) { u.avatar = url; Database.updateUser(u); onUpdate(); onClose(); }
        }
    };
    return (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm text-center border border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-lg mb-4 dark:text-white">Update Profile Picture</h3>
                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-yellow-400">
                    <AvatarImage src={url} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <input className="w-full p-2 border rounded mb-4 dark:bg-gray-800 dark:border-gray-700 dark:text-white" placeholder="Image URL..." value={url} onChange={e => setUrl(e.target.value)} />
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2 border rounded font-bold dark:border-gray-700 dark:text-white">Cancel</button>
                    <button onClick={save} className="flex-1 py-2 bg-black dark:bg-white dark:text-black text-white rounded font-bold">Save</button>
                </div>
            </div>
        </div>
    );
};

// --- LIVE JOURNAL MODAL (Z-9999) ---
const JournalModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [content, setContent] = useState('');
    const [saved, setSaved] = useState(false);
    const [history, setHistory] = useState<JournalEntry[]>([]);

    useEffect(() => {
        const u = Database.getUser();
        if (u) setHistory(Database.getJournals(u.id));
    }, []);

    const handleSave = () => {
        if (!content.trim()) return;
        const u = Database.getUser();
        if (u) {
            const entry: JournalEntry = { id: `j_${Date.now()}`, userId: u.id, date: new Date().toISOString(), content };
            Database.saveJournal(entry);
            setHistory([entry, ...history]);
            setContent('');
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4">
            <div className="bg-[#FFFBEB] dark:bg-gray-900 rounded-3xl w-full max-w-2xl h-[600px] flex flex-col shadow-2xl relative border-4 border-white dark:border-gray-800 overflow-hidden">
                <div className="bg-yellow-400 dark:bg-yellow-600 p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-black text-black flex items-center gap-2"><BookOpen className="w-6 h-6"/> Live Journal</h2>
                    <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-full"><X className="w-6 h-6 text-black"/></button>
                </div>
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    <div className="flex-1 p-6 flex flex-col border-r border-yellow-200 dark:border-gray-800">
                        <textarea 
                            className="flex-1 w-full bg-white dark:bg-gray-800 dark:text-white p-4 rounded-xl border border-yellow-200 dark:border-gray-700 focus:border-yellow-500 outline-none resize-none shadow-inner"
                            placeholder="Write your thoughts..."
                            value={content}
                            onChange={e => setContent(e.target.value)}
                        ></textarea>
                        <button onClick={handleSave} className="mt-4 w-full bg-black dark:bg-white dark:text-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                            {saved ? <CheckCircle className="w-5 h-5 text-green-500"/> : <Save className="w-5 h-5"/>}
                            {saved ? "Saved" : "Save Entry"}
                        </button>
                    </div>
                    <div className="w-full md:w-64 bg-white dark:bg-gray-800 p-6 overflow-y-auto">
                        <h3 className="font-bold text-gray-400 text-xs uppercase mb-4 tracking-wider">Previous Entries</h3>
                        <div className="space-y-4">
                            {history.length === 0 && <p className="text-gray-400 text-sm">No entries yet.</p>}
                            {history.map(entry => (
                                <div key={entry.id} className="p-3 bg-yellow-50 dark:bg-gray-700 rounded-xl border border-yellow-100 dark:border-gray-600">
                                    <p className="text-xs text-gray-400 font-bold mb-1">{new Date(entry.date).toLocaleDateString()}</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-3">{entry.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- DASHBOARD MAIN ---
const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onStartSession }) => {
  const [activeTab, setActiveTab] = useState<'hub' | 'history' | 'settings'>('hub');
  const [darkMode, setDarkMode] = useState(false); // DEFAULT FALSE (Light Mode)
  const [balance, setBalance] = useState(user.balance);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [loadingCompanions, setLoadingCompanions] = useState(true);
  const [streak, setStreak] = useState(3);
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
  const [searchTerm, setSearchTerm] = useState('');
  const [nameEditMode, setNameEditMode] = useState(false);
  const [tempName, setTempName] = useState(user.name);
  const [weather, setWeather] = useState<'confetti' | 'rain' | null>(null);

  // Dark Mode Initialization
  useEffect(() => {
      const savedTheme = localStorage.getItem('peutic_theme');
      if (savedTheme === 'dark') {
          setDarkMode(true);
          document.documentElement.classList.add('dark');
      } else {
          setDarkMode(false);
          document.documentElement.classList.remove('dark');
      }
  }, []);

  const toggleDarkMode = () => {
      if (darkMode) {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('peutic_theme', 'light');
          setDarkMode(false);
      } else {
          document.documentElement.classList.add('dark');
          localStorage.setItem('peutic_theme', 'dark');
          setDarkMode(true);
      }
  };

  const refreshData = () => {
    const dbUser = Database.getUser();
    if (dbUser) { setBalance(dbUser.balance); setDashboardUser(dbUser); }
    
    // Refresh Transactions
    const txs = Database.getUserTransactions(user.id);
    setTransactions(txs);

    // Refresh Weekly Progress
    const progress = Database.getWeeklyProgress(user.id);
    setWeeklyGoal(progress.current);
    setWeeklyTarget(progress.target);
    setWeeklyMessage(progress.message);

    setCompanions(Database.getCompanions());
  };
  
  useEffect(() => {
      refreshData();
      const interval = setInterval(refreshData, 5000);
      setTimeout(() => setLoadingCompanions(false), 1000);
      
      const insights = [
          "Take a moment to breathe today.",
          "You are stronger than you think.",
          "Clarity comes in moments of calm.",
          "Your journey is valid.",
          "We are here for you, 24/7."
      ];
      setDailyInsight(insights[Math.floor(Math.random() * insights.length)]);

      return () => clearInterval(interval);
  }, [user.id]);

  const handlePaymentSuccess = (minutesAdded: number, cost: number) => {
      Database.topUpWallet(minutesAdded, cost);
      setBalance(prev => prev + minutesAdded);
      setShowPayment(false);
      setPaymentError(undefined);
      setWeather('confetti');
      // Auto-clear handled by effect
  };

  const handleConnectRequest = (companion: Companion) => {
      if (balance <= 0) { 
          setPaymentError("Please add funds to connect."); 
          setShowPayment(true);
          return; 
      } 
      onStartSession(companion);
  };

  const handleMoodSelect = (mood: 'confetti' | 'rain' | null) => {
      setWeather(mood);
      // Persist mood to database so it counts towards goals
      Database.saveMood(user.id, mood);
  };

  const handleDeleteAccount = () => {
      if (window.confirm("ARE YOU SURE? This will permanently delete your account and all remaining credits. This cannot be undone.")) {
          Database.deleteUser(dashboardUser.id);
          onLogout();
      }
  };

  const handleSaveName = () => {
    const updated = { ...dashboardUser, name: tempName };
    Database.updateUser(updated);
    setDashboardUser(updated);
    setNameEditMode(false);
  }

  const filteredCompanions = companions.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.specialty.toLowerCase().includes(searchTerm.toLowerCase()));

  const isGoalMet = weeklyGoal >= weeklyTarget;
  const progressPercent = Math.min(100, (weeklyGoal / weeklyTarget) * 100);

  return (
    <div className="min-h-screen bg-[#FFFBEB] dark:bg-black font-sans text-gray-900 dark:text-gray-100 selection:bg-yellow-200 transition-colors duration-500 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      
      {weather && <WeatherEffect type={weather} />}
      <SoundscapePlayer />
      
      {/* Navbar */}
      <nav className="bg-[#FFFBEB]/80 dark:bg-black/80 backdrop-blur-xl border-b border-yellow-100 dark:border-gray-800 sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-sm transition-colors">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-400/20"><Heart className="fill-black w-6 h-6 text-black" /></div>
              <span className="font-black text-xl tracking-tight dark:text-white">Peutic</span>
          </div>
          <div className="flex items-center gap-4">
              {/* Dark Mode Toggle */}
              <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                  {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>

              {/* STREAK INDICATOR */}
              <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 px-4 py-2 rounded-full border border-orange-100 dark:border-orange-900/50 shadow-sm">
                  <div className="p-1 bg-orange-500 rounded-full">
                      <Flame className="w-3 h-3 text-white fill-white animate-pulse" /> 
                  </div>
                  <span className="text-xs font-black text-orange-600 dark:text-orange-400 tracking-wide">{dashboardUser.streak || 1} Day Streak</span>
              </div>
              
              <div className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-full shadow-xl hover:scale-105 transition-transform cursor-pointer" onClick={() => setShowPayment(true)}>
                  <span className="font-mono font-bold text-yellow-400 dark:text-yellow-600">{Math.floor(balance)}m</span>
                  <Plus className="w-4 h-4" />
              </div>
              <button onClick={onLogout} className="p-2 hover:bg-yellow-100 dark:hover:bg-gray-800 rounded-full transition-colors"><LogOut className="w-5 h-5 dark:text-gray-400" /></button>
          </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 md:p-10 flex flex-col md:flex-row gap-10 relative z-10">
          {/* Sidebar */}
          <div className="w-full md:w-72 space-y-6">
              <div className="bg-[#FFFBEB] dark:bg-gray-900 p-8 rounded-3xl text-center relative group shadow-sm border border-yellow-200 dark:border-gray-800 transition-colors">
                  <button onClick={() => setShowProfile(true)} className="absolute top-4 right-4 p-2 bg-yellow-100 dark:bg-gray-800 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:scale-110"><Edit2 className="w-3 h-3 dark:text-white" /></button>
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full p-1 bg-gradient-to-br from-yellow-400 to-orange-300 shadow-lg">
                      <div className="w-full h-full rounded-full overflow-hidden border-4 border-white dark:border-gray-800">
                          <AvatarImage src={dashboardUser.avatar || ''} alt={dashboardUser.name} className="w-full h-full object-cover" />
                      </div>
                  </div>
                  <h3 className="font-black text-2xl dark:text-white">{dashboardUser.name}</h3>
                  <p className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-6">Premium Member</p>
                  
                  {/* WEEKLY GOAL CARD - ENHANCED */}
                  <div className={`p-6 rounded-3xl text-left border shadow-inner transition-all duration-500 relative overflow-hidden ${isGoalMet ? 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-900 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'bg-white dark:bg-gray-800 border-yellow-100 dark:border-gray-700'}`}>
                      {isGoalMet && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-500"></div>}
                      
                      <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 z-10 relative">
                          <span className="flex items-center gap-1">{isGoalMet ? <Trophy className="w-3 h-3 text-blue-500"/> : <Target className="w-3 h-3"/>} Weekly Goal</span>
                          <span className={`font-black ${isGoalMet ? 'text-blue-600 dark:text-blue-400' : 'text-black dark:text-white'}`}>{weeklyGoal}/{weeklyTarget}</span>
                      </div>
                      
                      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-visible mb-3 relative">
                          <div 
                             className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${isGoalMet ? 'bg-gradient-to-r from-blue-400 to-blue-600 shadow-[0_0_10px_#3b82f6]' : 'bg-green-500'}`} 
                             style={{ width: `${progressPercent}%` }}
                          >
                             {isGoalMet && (
                                <div className="absolute -right-2 -top-3 filter drop-shadow-md z-20">
                                    <Flame className="w-6 h-6 text-blue-500 fill-blue-400 animate-bounce" />
                                </div>
                             )}
                          </div>
                      </div>
                      <p className={`text-[10px] font-bold text-center italic transition-colors ${isGoalMet ? 'text-blue-500' : 'text-gray-400'}`}>
                          {isGoalMet ? "🔥 Goal Crushed! Amazing Work! 🔥" : weeklyMessage}
                      </p>
                  </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden p-2 space-y-1 shadow-sm border border-yellow-100 dark:border-gray-800 transition-colors">
                  {[{ id: 'hub', icon: LayoutDashboard, label: 'Wellness Hub' }, { id: 'history', icon: Clock, label: 'History' }, { id: 'settings', icon: Settings, label: 'Settings' }].map(item => (
                      <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === item.id ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-yellow-100 dark:hover:bg-gray-800'}`}>
                          <item.icon className="w-5 h-5" /> {item.label}
                      </button>
                  ))}
              </div>

              {/* NEW AI IMAGE GENERATOR WIDGET */}
              <WisdomGenerator userId={dashboardUser.id} />
          </div>

          {/* Main Content */}
          <div className="flex-1">
              {activeTab === 'hub' && (
                  <div className="space-y-8 animate-in fade-in">
                      {/* Insight */}
                      <div className="bg-[#FFFBEB] dark:bg-gray-900 border border-yellow-200 dark:border-gray-800 p-8 rounded-3xl relative overflow-hidden group shadow-sm transition-colors">
                          <div className="absolute -right-10 -top-10 w-40 h-40 bg-yellow-300 dark:bg-yellow-600 rounded-full blur-[80px] opacity-50 group-hover:opacity-80 transition-opacity"></div>
                          <h2 className="text-3xl font-black mb-2 text-gray-900 dark:text-white relative z-10">Hello, {dashboardUser.name.split(' ')[0]}.</h2>
                          <p className="text-gray-600 dark:text-gray-300 text-lg relative z-10 max-w-xl">"{dailyInsight}"</p>
                      </div>

                      {/* Games & Tools - COLLAPSIBLE - DEFAULT CLOSED */}
                      <CollapsibleSection title="Games & Tools" icon={Gamepad2} defaultOpen={false}>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                               {/* UPDATED: h-80 for compact flush fit */}
                               <div className="lg:col-span-2 bg-[#FFFBEB] dark:bg-gray-900 border border-yellow-200 dark:border-gray-700 p-1 rounded-3xl flex flex-col md:flex-row gap-1 h-auto md:h-80 shadow-sm overflow-hidden">
                                    <div className="w-full md:flex-1 relative rounded-2xl overflow-hidden group border border-yellow-100 dark:border-gray-800 h-80 md:h-full">
                                        <MindfulMatchGame />
                                    </div>
                                    <div className="w-full md:flex-1 relative rounded-2xl overflow-hidden group border border-yellow-100 dark:border-gray-800 h-80 md:h-full">
                                        <CloudHopGame />
                                    </div>
                               </div>
                               <div className="space-y-4">
                                   <MoodTracker onMoodSelect={handleMoodSelect} />
                                   <button onClick={() => setShowBreathing(true)} className="w-full h-[100px] bg-[#FFFBEB] dark:bg-gray-900 border border-yellow-200 dark:border-gray-700 p-6 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transition-transform cursor-pointer group hover:shadow-md">
                                       <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors shadow-sm"><Wind className="w-5 h-5 text-blue-600 dark:text-blue-300" /></div>
                                       <div className="text-left">
                                           <h4 className="font-bold text-md text-gray-900 dark:text-white">Breathe</h4>
                                           <p className="text-xs text-gray-500 dark:text-gray-400">2 min reset</p>
                                       </div>
                                   </button>
                                   <button onClick={() => setShowJournal(true)} className="w-full h-[100px] bg-[#FFFBEB] dark:bg-gray-900 border border-yellow-200 dark:border-gray-700 p-6 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transition-transform cursor-pointer group hover:shadow-md">
                                       <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors shadow-sm"><BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-300" /></div>
                                       <div className="text-left">
                                           <h4 className="font-bold text-md text-gray-900 dark:text-white">Journal</h4>
                                           <p className="text-xs text-gray-500 dark:text-gray-400">Log thoughts</p>
                                       </div>
                                   </button>
                               </div>
                          </div>
                      </CollapsibleSection>

                      {/* Specialists Grid */}
                      <div className="relative pb-20">
                          <div className="flex justify-between items-end mb-6 px-2">
                              <h3 className="font-black text-2xl text-gray-900 dark:text-white">Your Care Team</h3>
                              <span className="text-xs font-bold bg-white dark:bg-gray-800 dark:text-gray-300 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">Live 24/7</span>
                          </div>
                          {/* 2 Cols Mobile, 3 Cols Desktop */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                              {loadingCompanions ? [1,2,3].map(i => <div key={i} className="h-72 bg-gray-200/50 dark:bg-gray-800 rounded-3xl animate-pulse"></div>) : (
                                  filteredCompanions.map(c => (
                                      <div key={c.id} onClick={() => handleConnectRequest(c)} className="bg-[#FFFBEB] dark:bg-gray-900 border border-yellow-200 dark:border-gray-800 p-4 rounded-3xl hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden z-0">
                                          <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative bg-gray-100 dark:bg-gray-800 shadow-inner">
                                              <AvatarImage src={c.imageUrl} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                              <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md ${c.status === 'AVAILABLE' ? 'bg-green-500' : 'bg-gray-500'}`}>{c.status}</div>
                                          </div>
                                          <div className="flex justify-between items-center px-2">
                                              <div>
                                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{c.specialty}</p>
                                              </div>
                                              <div className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center group-hover:bg-yellow-400 group-hover:text-black transition-colors shadow-lg">
                                                  <Video className="w-5 h-5" />
                                              </div>
                                          </div>
                                      </div>
                                  ))
                              )}
                          </div>
                          
                          {/* AVAILABILITY BANNER */}
                          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-center animate-in slide-in-from-bottom-5 fade-in duration-700">
                              <div className="flex items-center justify-center gap-2 mb-1">
                                  <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />
                                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Service Notice</span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
                                  Due to high demand, your chosen specialist may be assisting another member. If unavailable, we will instantly connect you with a specialist of equal or greater experience to ensure you receive support without delay.
                              </p>
                          </div>
                      </div>
                  </div>
              )}
              {activeTab === 'history' && (
                  <div className="space-y-6">
                      <h2 className="text-2xl font-black mb-6 dark:text-white">Transaction History</h2>
                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
                          {transactions.length === 0 ? (
                              <div className="p-8 text-center text-gray-400">No transactions yet.</div>
                          ) : (
                              <table className="w-full text-left">
                                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                                      <tr>
                                          <th className="p-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                                          <th className="p-4 text-xs font-bold text-gray-500 uppercase">Description</th>
                                          <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Amount</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                      {transactions.map(t => (
                                          <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                              <td className="p-4 text-sm font-bold dark:text-gray-300">{new Date(t.date).toLocaleDateString()}</td>
                                              <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{t.description}</td>
                                              <td className={`p-4 text-sm font-bold text-right font-mono ${t.amount > 0 ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                                                  {t.amount > 0 ? '+' : ''}{t.amount}m {t.cost ? `($${t.cost.toFixed(2)})` : ''}
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          )}
                      </div>
                  </div>
              )}
              {activeTab === 'settings' && (
                  <div className="space-y-8 animate-in fade-in">
                      <h2 className="text-2xl font-black mb-6 dark:text-white">Account Settings</h2>
                      
                      {/* Profile Card */}
                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm">
                          <div className="flex justify-between items-center mb-6">
                              <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white"><UserIcon className="w-5 h-5"/> Profile</h3>
                              {!nameEditMode ? (
                                  <button onClick={() => setNameEditMode(true)} className="text-xs font-bold text-yellow-600 hover:text-yellow-700">Edit</button>
                              ) : (
                                  <button onClick={handleSaveName} className="text-xs font-bold text-green-600 hover:text-green-700">Save</button>
                              )}
                          </div>
                          <div className="space-y-4">
                               <div>
                                  <label className="text-xs font-bold text-gray-400 uppercase">Display Name</label>
                                  {nameEditMode ? (
                                      <input className="w-full p-2 border border-gray-200 rounded-lg mt-1 focus:outline-none focus:border-yellow-400 transition-colors dark:bg-gray-800 dark:text-white dark:border-gray-700" value={tempName} onChange={e => setTempName(e.target.value)} />
                                  ) : (
                                      <p className="font-bold text-gray-900 dark:text-gray-200">{dashboardUser.name}</p>
                                  )}
                               </div>
                               <div>
                                  <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
                                  <p className="font-bold text-gray-900 dark:text-gray-200">{dashboardUser.email}</p>
                               </div>
                               <div>
                                  <label className="text-xs font-bold text-gray-400 uppercase">Member ID</label>
                                  <p className="font-mono text-xs text-gray-500">{dashboardUser.id}</p>
                               </div>
                          </div>
                      </div>

                      {/* Privacy Card */}
                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm">
                           <h3 className="font-bold text-lg mb-6 flex items-center gap-2 dark:text-white"><Shield className="w-5 h-5"/> Privacy & Data</h3>
                           <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-gray-200">Export Personal Data</p>
                                    <p className="text-xs text-gray-500">Download a copy of your journal and session history.</p>
                                </div>
                                <button onClick={() => Database.exportData('USERS')} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors dark:text-white">
                                    <Download className="w-3 h-3"/> Export JSON
                                </button>
                           </div>
                      </div>

                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm">
                          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white"><Bell className="w-5 h-5"/> Notifications</h3>
                          <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                  <span className="text-gray-600 dark:text-gray-400">Email Marketing</span>
                                  <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                              </div>
                              <div className="flex justify-between items-center">
                                  <span className="text-gray-600 dark:text-gray-400">Session Reminders</span>
                                  <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                              </div>
                          </div>
                      </div>

                      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-3xl p-8 shadow-sm">
                          <h3 className="font-bold text-red-600 dark:text-red-400 text-lg mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Danger Zone</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                              Deleting your account is permanent. Any remaining credits ({Math.floor(balance)}m) will be lost immediately and cannot be refunded.
                          </p>
                          <button onClick={handleDeleteAccount} className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 flex items-center gap-2">
                              <Trash2 className="w-4 h-4"/> Delete Account
                          </button>
                      </div>
                  </div>
              )}
          </div>
      </div>
      
      {/* Modals - HIGHEST Z-INDEX */}
      {showPayment && <PaymentModal onClose={() => setShowPayment(false)} onSuccess={handlePaymentSuccess} initialError={paymentError} />}
      {showBreathing && <BreathingExercise userId={dashboardUser.id} onClose={() => setShowBreathing(false)} />}
      {showProfile && <ProfileModal user={dashboardUser} onClose={() => setShowProfile(false)} onUpdate={refreshData} />}
      {showJournal && <JournalModal onClose={() => setShowJournal(false)} />}
    </div>
  );
};

export default Dashboard;
