import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { User, Companion, Transaction, JournalEntry, ArtEntry, VoiceJournalEntry } from '../types';
import { LanguageSelector } from './common/LanguageSelector';
import { useLanguage } from './common/LanguageContext';
import {
    Video, Clock, Settings, LogOut,
    LayoutDashboard, Plus, X, Mic, Lock, CheckCircle, AlertTriangle, ShieldCheck, Heart,
    BookOpen, Save, Sparkles, Flame, Trophy,
    Sun, Feather, Anchor, Gamepad2, RefreshCw, Play, Star, Edit2, Trash2,
    CloudRain, Download, ChevronDown, ChevronUp, Lightbulb, User as UserIcon, Moon,

    Twitter, Instagram, Linkedin, Volume2, Music, Trees,
    Mail, StopCircle, Eye, Minimize2, Flame as Fire, EyeOff, Megaphone
} from 'lucide-react';
import { UserService } from '../services/userService';
import { AdminService } from '../services/adminService';
import { useToast } from './common/Toast';
import { CompanionSkeleton, StatSkeleton } from './common/SkeletonLoader';

import { NameValidator } from '../services/nameValidator';

import { generateDailyInsight } from '../services/geminiService';

import { WisdomEngine } from '../services/wisdomEngine';
import TechCheck from './TechCheck';
import GroundingMode from './GroundingMode';
import { GardenState } from '../types';
import { GardenService } from '../services/gardenService';

// LAZY LOAD HEAVY COMPONENTS
const GardenCanvas = lazy(() => import('./garden/GardenCanvas'));
const MindfulMatchGame = lazy(() => import('./MindfulMatchGame').catch(() => ({ default: () => <div className="p-10 text-center text-gray-400">Loading Game Engine...</div> })));
const CloudHopGame = lazy(() => import('./CloudHopGame').catch(() => ({ default: () => <div className="p-10 text-center text-gray-400">Loading Cloud Engine...</div> })));
const PaymentModal = lazy(() => import('./PaymentModal').catch(() => ({ default: () => <div className="p-10 text-center text-gray-400">Loading Payment Secure Node...</div> })));
const ProfileModal = lazy(() => import('./ProfileModal').catch(() => ({ default: () => <div className="p-10 text-center text-gray-400">Loading Profile Experience...</div> })));

import EmergencyOverlay from './safety/EmergencyOverlay';
import Confetti from './common/Confetti';

import { VoiceRecorder, VoiceEntryItem } from './journal/VoiceRecorder';

// Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY || '';
console.log("Stripe Key Loaded:", STRIPE_PUBLISHABLE_KEY ? "Yes" : "No");

declare global {
    interface Window {
        Stripe?: any;
        webkitAudioContext?: typeof AudioContext;
    }
}

interface DashboardProps {
    user: User;
    onLogout: () => void;
    onStartSession: (companion: Companion) => void;
}


const AvatarImage = React.memo(({ src, alt, className, isUser = false }: { src?: string, alt?: string, className?: string, isUser?: boolean }) => (
    <div className={`relative ${className || ''} overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
        {src ? (
            <img
                src={src}
                alt={alt || 'Avatar'}
                className="w-full h-full object-cover"
                onError={(e) => {
                    // Fallback to Dicebear if image fails to load
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/lorelei/svg?seed=${alt || 'anonymous'}&backgroundColor=FCD34D`;
                }}
            />
        ) : (
            <div className="w-full h-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                {isUser ? (
                    <UserIcon className="w-1/2 h-1/2 text-yellow-600 dark:text-yellow-500" />
                ) : (
                    <Sparkles className="w-1/2 h-1/2 text-yellow-600 dark:text-yellow-500" />
                )}
            </div>
        )}
        {isUser && <div className="absolute inset-0 ring-1 ring-inset ring-black/10"></div>}
    </div>
));
AvatarImage.displayName = 'AvatarImage';

const CollapsibleSection = React.memo(({ title, icon: Icon, children, defaultOpen = false }: { title: string, icon: any, children: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-white/40 dark:bg-gray-900/40 rounded-3xl border border-yellow-100/50 dark:border-gray-800/50 overflow-hidden backdrop-blur-md shadow-sm transition-all duration-300">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full p-4 lg:p-6 flex items-center justify-between hover:bg-yellow-50/50 dark:hover:bg-gray-800/30 transition-colors bg-[#FFFBEB] dark:bg-gray-900">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-gray-800 rounded-lg text-yellow-600 dark:text-yellow-500"><Icon className="w-5 h-5" /></div>
                    <span className="font-bold text-base dark:text-white">{title}</span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-gray-400" /> : <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />}
            </button>
            {isOpen && <div className="p-4 lg:p-6 pt-0 animate-in slide-in-from-top-2 duration-300 dark:bg-gray-900">{children}</div>}
        </div>
    );
});
CollapsibleSection.displayName = 'CollapsibleSection';

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

            console.log("Generating wisdom locally...");

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
                const newId = crypto.randomUUID();

                const newEntry: ArtEntry = { id: newId, userId: userId, imageUrl: imageUrl, prompt: input, createdAt: new Date().toISOString(), title: "Wisdom Card" };

                await UserService.saveArt(newEntry);
                // Water the garden on creation
                await GardenService.waterPlant(userId);

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
                            <span className="font-black text-sm text-gray-900 dark:text-yellow-400 tracking-tight">SOUNDSCAPE</span>
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

// MindfulMatchGame extracted to separate file

// CloudHopGame extracted to separate file

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
    const { showToast } = useToast();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [content, setContent] = useState('');
    const [saved, setSaved] = useState(false);
    useEffect(() => {
        UserService.getJournals(user.id).then(setEntries);
    }, [user.id]);
    const handleSave = () => { if (!content.trim()) return; const entry: JournalEntry = { id: crypto.randomUUID(), userId: user.id, date: new Date().toISOString(), content: content }; UserService.saveJournal(entry).then(async () => { await GardenService.waterPlant(user.id); setEntries([entry, ...entries]); setContent(''); setSaved(true); if (onUpdate) onUpdate(); setTimeout(() => setSaved(false), 2000); }); };
    const handleDelete = async (id: string, e: React.MouseEvent) => { e.stopPropagation(); try { await UserService.deleteJournal(id); setEntries(prev => prev.filter(e => e.id !== id)); showToast("Entry deleted", "success"); } catch (error) { showToast("Failed to delete", "error"); } };

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
                    {entries.map(entry => (
                        <div key={entry.id} className="group p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-yellow-400 dark:hover:border-yellow-600 transition-all cursor-default shadow-sm hover:shadow-md relative">
                            <div className="flex justify-between items-start mb-1.5">
                                <span className="text-[9px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-wide bg-yellow-50 dark:bg-yellow-900/20 px-1.5 py-0.5 rounded-md">{new Date(entry.date).toLocaleDateString()}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] text-gray-400 font-mono">{new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <button onClick={(e) => handleDelete(entry.id, e)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-0.5">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed font-medium group-hover:text-black dark:group-hover:text-white transition-colors">{entry.content}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
};

// PaymentModal extracted to separate file



// ProfileModal extracted to separate file

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onStartSession }) => {
    const { lang, setLang, t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'inner_sanctuary' | 'history' | 'settings'>('inner_sanctuary');

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
    const [weeklyMessage, setWeeklyMessage] = useState("Start your journey.");
    const [dashboardUser, setDashboardUser] = useState(user);
    const [settings, setSettings] = useState(AdminService.getSettings());
    const [showPayment, setShowPayment] = useState(false);
    const [paymentError, setPaymentError] = useState<string | undefined>(undefined);
    const [showBreathing, setShowBreathing] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    const [showGrounding, setShowGrounding] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [mood, setMood] = useState<'confetti' | 'rain' | null>(null);
    const [editName, setEditName] = useState(user.name);
    const [editEmail, setEditEmail] = useState(user.email);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isIdle, setIsIdle] = useState(false);
    const idleTimerRef = useRef<number | null>(null);





    const [showTechCheck, setShowTechCheck] = useState(false);
    const [isGhostMode, setIsGhostMode] = useState(() => localStorage.getItem('peutic_ghost_mode') === 'true');
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [isVaultOpen, setIsVaultOpen] = useState(false);


    const [pendingCompanion, setPendingCompanion] = useState<Companion | null>(null);
    const [specialtyFilter, setSpecialtyFilter] = useState<string>('All');
    const { showToast } = useToast();

    // --- NEW FEATURE: VOICE JOURNAL & MOOD PULSE ---
    const [showVoiceJournal, setShowVoiceJournal] = useState(false);
    const [voiceEntries, setVoiceEntries] = useState<VoiceJournalEntry[]>([]);
    const [moodRiskAlert, setMoodRiskAlert] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    const resetIdleTimer = () => {
        setIsIdle(false);
        if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = window.setTimeout(() => setIsIdle(true), 5 * 60 * 1000); // 5 minutes blur
    };

    useEffect(() => {
        const events = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
        events.forEach(e => window.addEventListener(e, resetIdleTimer));
        resetIdleTimer();
        return () => {
            events.forEach(e => window.removeEventListener(e, resetIdleTimer));
            if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
        };
    }, []);

    useEffect(() => {
        checkMoodPulse();
        loadVoiceJournals();
    }, []);

    const checkMoodPulse = async () => {
        if (!user) return;
        const risk = await UserService.predictMoodRisk(user.id);
        if (risk) setMoodRiskAlert(true);
    };

    const loadVoiceJournals = async () => {
        if (!user) return;
        const entries = await UserService.getVoiceJournals(user.id);
        setVoiceEntries(entries);
    };

    const handleVoiceCheckIn = () => {
        setShowVoiceJournal(true);
        setMoodRiskAlert(false);
    };

    const handleVoiceSave = async (entry: VoiceJournalEntry) => {
        try {
            await UserService.saveVoiceJournal(entry);
            setVoiceEntries(prev => [entry, ...prev]);
            showToast("Voice Journal Saved", "success");
        } catch (e) {
            showToast("Failed to save audio", "error");
        }
    };
    // -----------------------------------------------

    // Garden State
    const [garden, setGarden] = useState<GardenState | null>(null);
    const refreshGarden = async () => {
        if (!user.id) return;
        const g = await GardenService.getGarden(user.id);
        setGarden(g);
    };
    useEffect(() => { refreshGarden(); }, [user.id]);



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
        if (dashboardUser && user.themePreference !== themeStr) {
            UserService.updateUser({ ...dashboardUser, themePreference: themeStr as 'light' | 'dark' });
        }

    }, [darkMode]);

    useEffect(() => {
        // Kick off all data fetching in parallel
        refreshData();

        generateDailyInsight(user.name, user.id);

        // Get companions immediately without delay
        AdminService.getCompanions().then((comps) => {
            setCompanions(comps);
            setLoadingCompanions(false);

            // PRE-FETCH: Smooth loading for specialist avatars
            comps.slice(0, 10).forEach(c => {
                if (c.imageUrl) (new Image()).src = c.imageUrl;
            });
        });

        const interval = setInterval(async () => {
            await UserService.syncUser(user.id);
            refreshData();
        }, 5000);

        return () => clearInterval(interval);
    }, []);


    const refreshData = async () => {
        AdminService.syncGlobalSettings().then(setSettings);
        const u = UserService.getUser();
        if (u) {
            setDashboardUser(u);
            setBalance(u.balance);
            setEditName(u.name);
            setEditEmail(u.email);


            // Fetch secondary data in background without blocking
            UserService.getUserTransactions(u.id).then(setTransactions);
            UserService.getWeeklyProgress(u.id).then(prog => {
                setWeeklyGoal(prog.current);
                setWeeklyMessage(prog.message);
            });
        }
        AdminService.getCompanions().then(setCompanions);
    };




    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    const toggleGhostMode = () => {
        const newVal = !isGhostMode;
        setIsGhostMode(newVal);
        localStorage.setItem('peutic_ghost_mode', String(newVal));
        showToast(newVal ? "Ghost Mode Active: Identity Hidden" : "Ghost Mode Inactive", 'success');
        refreshData(); // Refresh to update greeting
    };

    const handleMoodSelect = (m: 'confetti' | 'rain' | null) => {
        setMood(m);
        if (m) {
            UserService.saveMood(user.id, m).then(async () => {
                await GardenService.waterPlant(user.id);
                refreshData();
                refreshGarden();
            });
        }
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
        if ((dashboardUser?.balance || 0) <= 0) { setPaymentError("Insufficient credits. Please add funds to start a session."); setShowPayment(true); return; }
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

            if (!dashboardUser) return;
            const updatedUser: User = {
                ...dashboardUser,
                name: editName,
                email: editEmail
            };

            UserService.updateUser(updatedUser).then(() => {
                showToast("Profile updated successfully", 'success');
                setDashboardUser(updatedUser);
                setIsSavingProfile(false);
            });
        }, 500);

    };
    const handleDeleteAccount = async () => {
        try {
            setIsDeletingAccount(true);
            await UserService.deleteUser(user.id);
            onLogout();
        } catch (e) {
            console.error(e);
            showToast("Failed to delete account. Please contact support.", "error");
            setIsDeletingAccount(false);
        }
    };

    const filteredCompanions = specialtyFilter === 'All' ? companions : companions.filter(c => c.specialty.includes(specialtyFilter) || c.specialty === specialtyFilter);
    const uniqueSpecialties = Array.from(new Set(companions.map(c => c.specialty))).sort();

    return (
        <div className={`min-h-screen transition-colors duration-500 font-sans ${darkMode ? 'dark bg-[#0A0A0A] text-white' : 'bg-[#FFFBEB] text-black'}`}>
            {mood && <WeatherEffect type={mood} />}
            {/* FLOATING CONTROLS: Separated for better ergonomics */}
            <div className="fixed bottom-6 left-6 z-[80] pointer-events-none">
                <div className="pointer-events-auto">
                    <button
                        onClick={handleVoiceCheckIn}
                        className="w-14 h-14 bg-yellow-400 dark:bg-yellow-500 rounded-full border-2 border-yellow-200 dark:border-yellow-600 shadow-[0_0_20px_rgba(250,204,21,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all group animate-float"
                        title="Daily Pulse Check"
                    >
                        <Sparkles className="w-6 h-6 text-black group-hover:rotate-12 transition-transform" />
                    </button>
                </div>
            </div>

            <div className="fixed bottom-6 right-6 z-[80] pointer-events-none">
                <div className="pointer-events-auto">
                    <SoundscapePlayer />
                </div>
            </div>

            {/* BROADCAST BANNER */}
            {settings.dashboardBroadcastMessage && (
                <div className="bg-blue-600 text-white py-2 px-4 shadow-lg animate-in slide-in-from-top duration-500 relative z-50 overflow-hidden group">
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-[-20deg]"></div>
                    <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
                        <Megaphone className="w-4 h-4 text-white/80 animate-bounce" />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-center shadow-sm">{settings.dashboardBroadcastMessage}</span>
                    </div>
                </div>
            )}


            <div className="flex h-screen overflow-hidden">
                <aside className="hidden md:flex w-20 lg:w-64 flex-col border-r border-yellow-200/30 dark:border-gray-800/50 bg-[#FFFBEB]/40 dark:bg-black/40 backdrop-blur-2xl transition-all duration-500 hover:w-24 lg:hover:w-72">
                    <div className="p-6 lg:p-8 flex items-center justify-center lg:justify-start gap-3">
                        <div className="w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg group hover:scale-110 transition-transform">
                            <Heart className="w-5 h-5 text-black fill-black" />
                        </div>
                        <span className="hidden lg:block text-xl font-black tracking-tight dark:text-white">Peutic</span>
                    </div>
                    <nav className="flex-1 px-3 lg:px-4 py-6 lg:py-8 space-y-2 lg:space-y-3">
                        {[
                            { id: 'inner_sanctuary', icon: LayoutDashboard, label: t('dash_hub') },
                            { id: 'history', icon: Clock, label: t('dash_journal') },
                            { id: 'settings', icon: Settings, label: t('dash_settings') }
                        ].map((item) => (
                            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 lg:p-4 rounded-xl transition-all duration-300 group ${activeTab === item.id ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg' : 'text-gray-500 hover:bg-yellow-100 dark:hover:bg-gray-800 dark:text-gray-400'}`}>
                                <item.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${activeTab === item.id ? 'text-yellow-400 dark:text-yellow-600' : 'group-hover:text-yellow-600 dark:group-hover:text-white'}`} />
                                <span className="hidden lg:block font-bold text-xs lg:text-sm tracking-wide">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                    <div className="p-4 lg:p-6 border-t border-yellow-200 dark:border-gray-800">
                        <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 p-3 lg:p-4 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-bold text-xs lg:text-sm">
                            <LogOut className="w-5 h-5" /><span className="hidden lg:block">{t('dash_logout')}</span>
                        </button>
                    </div>
                </aside>
                <main className={`flex-1 overflow-y-auto relative scroll-smooth transition-all duration-1000 will-change-transform ${isIdle ? 'blur-2xl grayscale brightness-50 pointer-events-none' : ''}`}>
                    {isIdle && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
                            <div className="bg-white/20 backdrop-blur-md p-8 rounded-3xl border border-white/30 text-center shadow-2xl">
                                <ShieldCheck className="w-16 h-16 text-white mx-auto mb-4 animate-pulse" />
                                <h2 className="text-2xl font-black text-white mb-2">Privacy Shield Active</h2>
                                <p className="text-white/80 text-sm">Move your mouse to unlock.</p>
                            </div>
                        </div>
                    )}
                    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-10 pb-24">
                        {/* CLEAN TOP BAR (SIDEBAR-CENTRIC) */}
                        <header className="mb-10 flex items-center justify-between">
                            <div className="flex flex-col">
                                <h1 className="text-2xl md:text-3xl font-black tracking-tight dark:text-white flex items-center gap-3">
                                    {activeTab === 'inner_sanctuary' ? `Hello, ${(dashboardUser?.name || 'Friend').split(' ')[0]}` : activeTab === 'history' ? t('sec_history') : t('dash_settings')}
                                    {activeTab === 'inner_sanctuary' && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>}
                                </h1>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                    {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 md:gap-3">
                                <LanguageSelector currentLanguage={lang} onLanguageChange={setLang} />

                                <button onClick={() => setShowGrounding(true)} className="p-2.5 rounded-2xl bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-700 shadow-sm hover:scale-105 transition-all text-blue-500" title="Grounding Mode">
                                    <Anchor className="w-5 h-5" />
                                </button>

                                <button onClick={toggleDarkMode} className="p-2.5 rounded-2xl bg-white dark:bg-gray-800 border border-yellow-100 dark:border-gray-700 shadow-sm hover:scale-105 transition-all">
                                    {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-400" />}
                                </button>

                                <button onClick={() => setShowPayment(true)} className="px-3 md:px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-[10px] md:text-xs">
                                    {balance}m <Plus className="w-3 h-3 md:w-3.5 md:h-3.5 opacity-50" />
                                </button>

                                <button onClick={() => setShowProfile(true)} className="w-10 h-10 md:w-11 md:h-11 rounded-2xl overflow-hidden border-2 border-yellow-400 shadow-premium transition-all hover:rotate-3 active:scale-90 flex-shrink-0">
                                    <AvatarImage src={isGhostMode ? '' : (dashboardUser?.avatar || '')} alt={isGhostMode ? 'Member' : (dashboardUser?.name || 'User')} className="w-full h-full object-cover" isUser={true} />
                                </button>

                                <button onClick={onLogout} className="md:hidden p-2.5 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-100 dark:border-red-900/50 shadow-sm hover:scale-105 transition-all">
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </header>
                        {activeTab === 'inner_sanctuary' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">

                                {/* THE PLAYGROUND (Collapsible 3-Column Tile Menu) */}
                                <div className="space-y-4">
                                    <button
                                        onClick={() => setIsVaultOpen(!isVaultOpen)}
                                        className="w-full flex items-center justify-between p-4 bg-white/40 dark:bg-gray-900/40 rounded-2xl border border-yellow-100/50 dark:border-gray-800/50 backdrop-blur-sm group hover:bg-white/60 dark:hover:bg-gray-900/60 transition-all shadow-[0_0_15px_rgba(0,0,0,0.05)]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-yellow-400 rounded-xl shadow-[0_4px_10px_rgba(250,204,21,0.3)]">
                                                <Gamepad2 className="w-4 h-4 text-black" />
                                            </div>
                                            <h2 className="text-sm font-black uppercase tracking-widest dark:text-white">The Playground</h2>
                                        </div>
                                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-500 ${isVaultOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isVaultOpen && (
                                        <div className="grid grid-cols-3 gap-2 md:gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                            {/* TILE 1: INNER GARDEN */}
                                            {garden && (
                                                <div className="group relative bg-[#081508] dark:bg-black rounded-2xl md:rounded-3xl border-2 border-green-500/30 dark:border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all overflow-hidden flex flex-col h-[140px] md:h-[220px]">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 pointer-events-none"></div>
                                                    <div className="flex-1 p-3 md:p-6 relative flex flex-col items-center justify-center">
                                                        <div className="absolute inset-0 bg-green-400/20 blur-3xl rounded-full scale-150 animate-pulse pointer-events-none"></div>
                                                        <Suspense fallback={<div className="w-12 h-12 md:w-20 md:h-20 rounded-full animate-pulse bg-green-100"></div>}>
                                                            <div className="w-16 h-16 md:w-24 md:h-24 mb-2 md:mb-3 transition-transform group-hover:scale-110 duration-700 relative z-10 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]">
                                                                <GardenCanvas garden={garden} width={100} height={100} />
                                                            </div>
                                                        </Suspense>
                                                        <h3 className="text-[8px] md:text-sm font-black text-green-400 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(34,197,94,0.8)] text-center">Inner Garden</h3>
                                                        <p className="hidden md:block text-[10px] font-bold text-green-500/80 uppercase tracking-tighter">Level {garden.level} &bull; Growing</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* TILE 2: BOOK OF YOU */}
                                            {(() => {
                                                const joinedDate = new Date(dashboardUser?.joinedAt || new Date().toISOString());
                                                const now = new Date();
                                                const diffTime = Math.abs(now.getTime() - joinedDate.getTime());
                                                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                                const isLocked = diffDays < 7;
                                                const daysRemaining = 7 - diffDays;

                                                return (
                                                    <div
                                                        onClick={() => {
                                                            if (!isLocked) {
                                                                setActiveTab('history');
                                                                setShowConfetti(true);
                                                                setTimeout(() => setShowConfetti(false), 5000);
                                                            } else {
                                                                showToast(`Locked for ${daysRemaining} more days.`, "info");
                                                            }
                                                        }}
                                                        className="group relative bg-[#1a1a1a] dark:bg-black rounded-2xl md:rounded-3xl border-2 border-white/20 dark:border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all overflow-hidden cursor-pointer h-[140px] md:h-[220px]"
                                                    >
                                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-[0.05] pointer-events-none"></div>
                                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                                                        <div className="flex flex-col items-center justify-center h-full p-3 md:p-6 text-center relative z-10">
                                                            <div className="relative mb-2 md:mb-4">
                                                                {isLocked && <div className="absolute -inset-2 md:-inset-4 border-2 border-white/20 rounded-full animate-aura-glow"></div>}
                                                                <div className={`w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl transition-all ${isLocked ? 'bg-black text-gray-700 border border-white/5' : 'bg-white text-black shadow-white/20'}`}>
                                                                    {isLocked ? <Lock className="w-5 h-5 md:w-8 md:h-8" /> : <BookOpen className="w-5 h-5 md:w-8 md:h-8" />}
                                                                </div>
                                                            </div>
                                                            <h3 className="text-[8px] md:text-sm font-black text-white uppercase tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] text-center">Book of You</h3>
                                                            <p className="hidden md:block text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{isLocked ? `Unlocks in ${daysRemaining}d` : 'Digital Legacy'}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* TILE 3: COMING SOON */}
                                            <div className="relative bg-white/50 dark:bg-gray-900/50 rounded-2xl md:rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 h-[140px] md:h-[220px] flex flex-col items-center justify-center grayscale opacity-60">
                                                <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2 md:mb-4">
                                                    <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-gray-300" />
                                                </div>
                                                <h3 className="text-[8px] md:text-sm font-black text-gray-400 uppercase tracking-widest text-center">Next Feature</h3>
                                                <div className="mt-1 md:mt-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                                                    <span className="text-[7px] md:text-[9px] font-black uppercase text-gray-500">Soon</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                                    {dashboardUser ? (
                                        <div className="bg-white dark:bg-gray-900 p-4 md:p-5 rounded-3xl border border-yellow-100 dark:border-gray-800 shadow-sm col-span-1 md:col-span-2 relative overflow-hidden group min-h-[120px] md:min-h-[140px]">
                                            {weeklyGoal >= weeklyTarget ? (<div className="absolute top-0 right-0 p-4 z-20"><div className="relative flex items-center justify-center"><div className="absolute w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div><div className="absolute w-16 h-16 bg-blue-500/30 rounded-full blur-xl animate-pulse"></div><div className="absolute w-full h-full bg-blue-400/10 rounded-full animate-ping"></div><div className="absolute w-10 h-10 bg-blue-400/50 rounded-full blur-lg animate-pulse"></div><Flame className="w-12 h-12 text-blue-500 fill-blue-500 drop-shadow-[0_0_20px_rgba(59,130,246,1)] animate-bounce relative z-10" /></div></div>) : (<div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Trophy className="w-20 h-20 text-yellow-500" /></div>)}
                                            <div className="relative z-10"><h3 className="font-bold text-gray-500 dark:text-gray-400 text-[10px] md:text-xs uppercase tracking-widest mb-1">Weekly Wellness Goal</h3><div className="flex items-end gap-2 mb-2 md:mb-3"><span className="text-2xl md:text-4xl font-black dark:text-yellow-400">{weeklyGoal}</span><span className="text-gray-400 text-[10px] md:text-sm font-bold mb-1">/ {weeklyTarget} activities</span></div><div className="w-full h-2 md:h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2 md:mb-3"><div className={`h-full rounded-full transition-all duration-1000 ease-out ${weeklyGoal >= weeklyTarget ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse' : 'bg-yellow-400'}`} style={{ width: `${Math.min(100, (weeklyGoal / weeklyTarget) * 100)}%` }}></div></div><p className="text-[10px] md:text-sm font-bold text-gray-700 dark:text-gray-300">{weeklyGoal >= weeklyTarget ? "🔥 You are on a hot streak!" : weeklyMessage}</p></div>
                                        </div>
                                    ) : <StatSkeleton />}
                                    <MoodTracker onMoodSelect={handleMoodSelect} />
                                </div>

                                <CollapsibleSection title={t('sec_games')} icon={Gamepad2}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                                        <div className="relative w-full h-[320px] md:h-[300px] xl:h-[360px] rounded-3xl overflow-hidden border border-yellow-100 dark:border-gray-700 shadow-sm flex flex-col bg-sky-50 dark:bg-gray-800">
                                            <div className="absolute top-3 left-0 right-0 text-center z-10 pointer-events-none">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 bg-white/90 dark:bg-black/90 px-3 py-1.5 rounded-full shadow-sm">Mindful Match</span>
                                            </div>
                                            <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs font-bold text-gray-400 animate-pulse">Initializing Neural Match...</div>}>
                                                <MindfulMatchGame dashboardUser={dashboardUser} />
                                            </Suspense>
                                        </div>
                                        <div className="relative w-full h-[320px] md:h-[300px] xl:h-[360px] rounded-3xl overflow-hidden border border-yellow-100 dark:border-gray-700 shadow-sm flex flex-col">
                                            <div className="absolute top-3 left-0 right-0 text-center z-10 pointer-events-none">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 bg-white/90 dark:bg-black/90 px-3 py-1.5 rounded-full shadow-sm">Cloud Hop</span>
                                            </div>
                                            <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs font-bold text-gray-400 animate-pulse">Launching Cloud Engine...</div>}>
                                                <CloudHopGame dashboardUser={dashboardUser} />
                                            </Suspense>
                                        </div>
                                    </div>
                                </CollapsibleSection>
                                <CollapsibleSection title={t('dash_hub')} icon={Feather}><div className="space-y-6"><JournalSection user={user} /><div className="border-t border-dashed border-yellow-200 dark:border-gray-700" /><WisdomGenerator userId={user.id} /></div></CollapsibleSection>
                                <div>
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-5"><div><h2 className="text-xl md:text-2xl font-black dark:text-yellow-400">{t('sec_specialists')}</h2><p className="text-gray-500 text-xs md:text-sm">{t('roster_heading')}</p></div><div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide"><button onClick={() => setSpecialtyFilter('All')} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${specialtyFilter === 'All' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>All</button>{uniqueSpecialties.map(spec => (<button key={spec} onClick={() => setSpecialtyFilter(spec)} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${specialtyFilter === spec ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{spec}</button>))}</div></div>
                                    {loadingCompanions ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                            {[1, 2, 3, 4, 5].map(i => <CompanionSkeleton key={i} />)}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                                            {filteredCompanions.map((companion) => (
                                                <div key={companion.id} onClick={() => handleStartConnection(companion)} className="group relative bg-white dark:bg-gray-900 rounded-[1.8rem] overflow-hidden border border-yellow-100 dark:border-gray-800 hover:border-yellow-400 dark:hover:border-yellow-600 transition-all duration-300 hover:shadow-2xl cursor-pointer flex flex-col h-full">
                                                    <div className="aspect-[4/5] relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                        <AvatarImage src={companion.imageUrl} alt={companion.name} className="w-full h-full object-cover group-hover:scale-110 group-hover:animate-breathing transition-transform duration-700" />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>


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
                                <div className="bg-white/70 dark:bg-gray-900/40 rounded-3xl border border-yellow-100/50 dark:border-gray-800/50 overflow-hidden backdrop-blur-md shadow-xl hover:shadow-2xl transition-shadow duration-500">
                                    <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                        <h3 className="font-black text-lg dark:text-yellow-400">{t('sec_history')}</h3>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Financials & Check-ins</span>
                                    </div>
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider"><tr><th className="p-4 md:p-5">Date</th><th className="p-4 md:p-5">Description</th><th className="p-4 md:p-5 text-right">Amount</th><th className="p-4 md:p-5 text-right">Status</th></tr></thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {transactions.length === 0 ? (<tr><td colSpan={4} className="p-8 text-center text-gray-400 text-sm italic">No records found.</td></tr>) : (transactions.map((tx) => (<tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"><td className="p-4 md:p-5 text-sm dark:text-gray-300 font-mono">{new Date(tx.date).toLocaleDateString()}</td><td className="p-4 md:p-5 text-sm font-bold dark:text-white">{tx.description}</td><td className={`p-4 md:p-5 text-sm text-right font-mono font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount}m</td><td className="p-4 md:p-5 text-right"><span className="px-2 py-1 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase tracking-wide">{tx.status}</span></td></tr>)))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="bg-white/70 dark:bg-gray-900/40 rounded-3xl border border-yellow-100/50 dark:border-gray-800/50 overflow-hidden backdrop-blur-md shadow-xl hover:shadow-2xl transition-shadow duration-500">
                                    <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-xl text-red-600 dark:text-red-400"><Mic className="w-5 h-5" /></div>
                                            <div>
                                                <h3 className="font-black text-lg dark:text-yellow-400 leading-tight">Voice Chronicles</h3>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Your spoken journey</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        {voiceEntries.length === 0 ? (
                                            <div className="py-12 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                                                <p className="text-gray-400 text-sm italic">You haven't left any voice notes yet.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {voiceEntries.map(entry => (
                                                    <div key={entry.id} className="p-4 border border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-800/50">
                                                        <VoiceEntryItem
                                                            entry={entry}
                                                            onDelete={async (id) => {
                                                                await UserService.deleteVoiceJournal(id);
                                                                setVoiceEntries(prev => prev.filter(e => e.id !== id));
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'settings' && (
                            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-5 duration-500">
                                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-yellow-200 dark:border-gray-800 overflow-hidden shadow-sm">
                                    <div className="p-5 md:p-6 border-b border-yellow-100 dark:border-gray-800"><h3 className="font-black text-lg md:text-xl dark:text-yellow-400 mb-1">{t('dash_settings')}</h3><p className="text-gray-500 text-xs">Manage your personal information.</p></div>
                                    <div className="p-5 md:p-6 space-y-5">
                                        <div className="flex items-center gap-5"><div className="relative"><div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-4 border-yellow-100 dark:border-gray-800"><AvatarImage src={dashboardUser?.avatar || ''} alt="Profile" className="w-full h-full object-cover" isUser={true} /></div><button onClick={() => setShowProfile(true)} className="absolute bottom-0 right-0 p-1.5 bg-black text-white rounded-full hover:bg-gray-800 transition-colors shadow-lg"><Edit2 className="w-3 h-3" /></button></div><div className="flex-1 space-y-3"><div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Display Name</label><div className="relative"><UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-yellow-500 outline-none transition-colors text-sm font-bold dark:text-white" /></div></div><div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Email Address</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-yellow-500 outline-none transition-colors text-sm font-bold dark:text-white" /></div></div></div></div>
                                        <div className="flex justify-end pt-2"><button onClick={saveProfileChanges} disabled={isSavingProfile} className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold text-xs hover:opacity-80 transition-opacity flex items-center gap-2">{isSavingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}{t('ui_save')}</button></div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-yellow-200 dark:border-gray-800 overflow-hidden shadow-sm">
                                    <div className="p-5 md:p-6 border-b border-yellow-100 dark:border-gray-800"><h3 className="font-black text-lg md:text-xl dark:text-yellow-400 mb-1">Preferences</h3><p className="text-gray-500 text-xs">Customize your sanctuary experience.</p></div>
                                    <div className="p-5 md:p-6 space-y-5">
                                        <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"><Moon className="w-4 h-4 text-gray-600 dark:text-gray-400" /></div><div><p className="font-bold text-gray-900 dark:text-white text-sm">Dark Mode</p><p className="text-[10px] text-gray-500">Reduce eye strain.</p></div></div><button onClick={toggleDarkMode} className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${darkMode ? 'bg-yellow-500' : 'bg-gray-200'}`}><span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-1'}`} /></button></div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"><EyeOff className="w-4 h-4 text-red-500" /></div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm">Ghost Mode</p>
                                                    <p className="text-[10px] text-gray-500">Hide name and photo for public browsing.</p>
                                                </div>
                                            </div>
                                            <button onClick={toggleGhostMode} className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${isGhostMode ? 'bg-red-500' : 'bg-gray-200'}`}>
                                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isGhostMode ? 'translate-x-5' : 'translate-x-1'}`} />
                                            </button>
                                        </div>

                                    </div>
                                </div>
                                <div className="bg-white/70 dark:bg-gray-900/40 rounded-3xl border border-yellow-200/50 dark:border-gray-800/50 overflow-hidden backdrop-blur-md shadow-sm">
                                    <div className="p-5 md:p-6 border-b border-yellow-100/30 dark:border-gray-800/50"><h3 className="font-black text-lg md:text-xl dark:text-yellow-400 mb-1">Security Health</h3><p className="text-gray-500 text-xs text-green-500 flex items-center gap-1 font-bold animate-pulse"><ShieldCheck className="w-3 h-3" /> All systems secured & encrypted</p></div>
                                    <div className="p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            { label: 'TLS Encryption', status: 'Active (256-bit)', icon: Lock },
                                            { label: 'Data Isolation', status: 'Bank-Grade RLS', icon: ShieldCheck },
                                            { label: 'Identity Protection', status: 'JWT Secure', icon: UserIcon },
                                            { label: 'Privacy Shield', status: 'Active (5m Idle)', icon: EyeOff }
                                        ].map((item, i) => (
                                            <div key={i} className="p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-gray-100/50 dark:border-gray-700/50 flex items-center gap-3">
                                                <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                                                    <item.icon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">{item.label}</p>
                                                    <p className="text-xs font-bold dark:text-gray-200">{item.status}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-red-50 dark:bg-red-950/20 rounded-3xl border border-red-100 dark:border-red-900 overflow-hidden shadow-sm">
                                    <div className="p-5 md:p-6 border-b border-red-100 dark:border-red-900"><h3 className="font-black text-lg md:text-xl text-red-900 dark:text-red-400 mb-1">Danger Zone</h3><p className="text-red-600/70 dark:text-red-400/60 text-xs">Permanent actions for your data.</p></div>
                                    <div className="p-5 md:p-6">
                                        {showDeleteConfirm ? (
                                            <div className="bg-white dark:bg-black p-5 rounded-2xl border border-red-200 dark:border-red-900 text-center animate-in zoom-in duration-200">
                                                <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                                                <h4 className="font-bold text-base mb-1 dark:text-yellow-400">Are you absolutely sure?</h4>
                                                <p className="text-gray-500 text-xs mb-4">This action cannot be undone. This will permanently delete your account, journal entries, and remaining balance.</p>

                                                {balance > 0 && (
                                                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-5 text-left flex items-start gap-3">
                                                        <div className="bg-red-500/20 p-2 rounded-lg">
                                                            <Plus className="w-4 h-4 text-red-500 rotate-45" />
                                                        </div>
                                                        <div>
                                                            <p className="text-red-900 dark:text-red-400 text-xs font-black uppercase tracking-widest mb-1">Impact Warning</p>
                                                            <p className="text-red-700/80 dark:text-red-400/70 text-[11px] font-bold leading-relaxed">You have <span className="text-red-600 dark:text-red-400 font-black">{balance} minutes</span> remaining. Deleting your account will forfeit these credits immediately without refund.</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex gap-3 justify-center">
                                                    <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeletingAccount} className="px-5 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-bold text-xs hover:bg-gray-200 disabled:opacity-50">{t('ui_cancel')}</button>
                                                    <button onClick={handleDeleteAccount} disabled={isDeletingAccount} className="px-5 py-2 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-700 shadow-lg flex items-center gap-2">
                                                        {isDeletingAccount ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Yes, Delete Everything'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-red-900 dark:text-red-400 text-sm">Delete Account</p>
                                                    <p className="text-[10px] text-red-700/60 dark:text-red-400/50">Remove all data and access.</p>
                                                </div>
                                                <button onClick={() => setShowDeleteConfirm(true)} className="px-5 py-2.5 bg-white dark:bg-transparent border border-red-200 dark:border-red-800 text-red-600 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Delete Account</button>
                                            </div>
                                        )}
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
                                <div className="md:col-span-3"><h4 className="font-black mb-3 text-[9px] uppercase tracking-[0.3em] text-gray-700 dark:text-gray-400">Regulatory</h4><ul className="space-y-2 text-xs font-bold text-gray-800 dark:text-gray-500"><li><Link to="/privacy" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors">Privacy Policy</Link></li><li><Link to="/terms" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors">Terms of Service</Link></li></ul></div>

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
                                <p>&copy; {new Date().getFullYear()} Peutic Inc. | ISO 27001 Certified</p>
                                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div><span>Network Optimal</span></div>
                            </div>
                        </div>
                    </footer>
                </main>
            </div >
            {showPayment && <PaymentModal onClose={() => { setShowPayment(false); setPaymentError(undefined); }} onSuccess={handlePaymentSuccess} initialError={paymentError} />}
            {showBreathing && <EmergencyOverlay userId={user.id} onClose={() => { setShowBreathing(false); refreshGarden(); }} />}
            {showProfile && <ProfileModal user={dashboardUser} onClose={() => setShowProfile(false)} onUpdate={refreshData} />}
            {showGrounding && <GroundingMode onClose={() => setShowGrounding(false)} />}
            {showTechCheck && (<TechCheck onConfirm={confirmSession} onCancel={() => setShowTechCheck(false)} />)}

            {/* MOOD PULSE ALERT */}
            {/* MOOD PULSE ALERT (Removed Banner, Logic Kept for Floating Button) */}
            {
                moodRiskAlert && (
                    // Hidden banner logic - now relying on user initiative or smaller cues
                    <></>
                )
            }

            <Confetti active={showConfetti} />


            {/* VOICE JOURNAL MODAL */}
            {
                showVoiceJournal && (
                    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black flex items-center gap-2 dark:text-yellow-400"><Mic className="w-5 h-5 text-red-500" /> Voice Journal</h2>
                                <button onClick={() => setShowVoiceJournal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X className="w-5 h-5" /></button>
                            </div>

                            <VoiceRecorder userId={user.id} onSave={handleVoiceSave} />

                            <div className="mt-8">
                                <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">Recent Voice Notes</h3>
                                <div className="space-y-3">
                                    {voiceEntries.length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">No recordings yet.</p>}
                                    {voiceEntries.map(entry => (
                                        <VoiceEntryItem
                                            key={entry.id}
                                            entry={entry}
                                            onDelete={async (id) => {
                                                await UserService.deleteVoiceJournal(id);
                                                setVoiceEntries(prev => prev.filter(e => e.id !== id));
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Dashboard;