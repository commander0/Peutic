
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User, Companion, Transaction, JournalEntry, ArtEntry } from '../types';
import { 
  Video, Clock, Settings, LogOut, LayoutDashboard, Plus, Search, X, Lock, CheckCircle, AlertTriangle, ShieldCheck, Heart,
  Wind, BookOpen, Save, Sparkles, Activity, Info, Flame, Trophy, Target,
  Sun, Moon, StopCircle, ArrowRight, LifeBuoy, CreditCard, ChevronDown, ChevronUp, Lightbulb, User as UserIcon, Mail, Trash2, Download, RefreshCw, Gamepad2, Feather, Anchor, Music, Play, Volume2, Minimize2, CloudRain, Trees, Fire, Smile, Bell
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

const STRIPE_PUBLISHABLE_KEY = "pk_live_51MZuG0BUviiBIU4d81PC3BDlYgxuUszLu1InD0FFWOcGwQyNYgn5jjNOYi5a0uic9iuG8FdMjZBqpihTxK7oH0W600KfPZFZwp";

declare global {
  interface Window {
    Stripe?: any;
  }
}

// --- HELPER COMPONENTS ---

const AvatarImage: React.FC<{ src: string; alt: string; className?: string; isUser?: boolean }> = ({ src, alt, className, isUser = false }) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [hasError, setHasError] = useState(false);
    useEffect(() => { if (src && src.length > 10) { setImgSrc(src); setHasError(false); } else { setHasError(true); } }, [src]);
    if (hasError || !imgSrc) {
        if (isUser) {
            return (
                <div className={`bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center ${className}`}>
                    <Smile className="w-3/5 h-3/5 text-yellow-600 dark:text-yellow-400" />
                </div>
            );
        }
        let hash = 0; for (let i = 0; i < alt.length; i++) hash = alt.charCodeAt(i) + ((hash << 5) - hash);
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

const WisdomGenerator: React.FC<{ userId: string }> = ({ userId }) => {
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
                setInput('');
            }
        } catch (e) { console.error("Generation Error:", e); } finally { setLoading(false); }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => { 
        e.stopPropagation(); 
        if(confirm("Delete this card?")) { await Database.deleteArt(id); await refreshGallery(); } 
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-yellow-100 dark:border-gray-800 p-4 md:p-6 shadow-sm">
             <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg"><Lightbulb className="w-4 h-4 text-purple-600 dark:text-purple-400" /></div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Get Clarity</h3>
             </div>
            <div className="space-y-4">
                <textarea className="w-full h-24 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-sm focus:border-purple-400 dark:text-white outline-none resize-none transition-all" placeholder="What's weighing on your mind?" value={input} onChange={(e) => setInput(e.target.value)} />
                <button onClick={handleGenerate} disabled={loading || !input} className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${loading || !input ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-purple-600 text-white hover:bg-purple-500 hover:shadow-md'}`}>
                    {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} {loading ? 'Finding Clarity...' : 'Reframe Thought'}
                </button>
                {gallery.length > 0 && (
                    <div className="mt-6 space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Cards ({gallery.length})</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {gallery.map((art) => (
                                <div key={art.id} className="relative group aspect-square bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm animate-in zoom-in duration-300">
                                    <img src={art.imageUrl} alt="Wisdom Card" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button onClick={(e) => handleDelete(e, art.id)} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors" title="Delete"><Trash2 className="w-3 h-3"/></button>
                                        <a href={art.imageUrl} download={`wisdom-${art.id}.jpg`} onClick={(e) => e.stopPropagation()} className="p-2 bg-white hover:bg-gray-100 text-black rounded-full shadow-lg transition-colors" title="Download"><Download className="w-3 h-3"/></a>
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

const JournalSection: React.FC<{ user: User }> = ({ user }) => {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [content, setContent] = useState('');
    const [saved, setSaved] = useState(false);
    
    useEffect(() => { 
        const load = async () => {
             const data = await Database.getJournals(user.id);
             setEntries(data);
        };
        load();
    }, [user.id]);

    const handleSave = async () => { 
        if (!content.trim()) return; 
        const entry: JournalEntry = { id: `j_${Date.now()}`, userId: user.id, date: new Date().toISOString(), content: content }; 
        await Database.saveJournal(entry); 
        setEntries([entry, ...entries]); 
        setContent(''); 
        setSaved(true); 
        setTimeout(() => setSaved(false), 2000); 
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 h-[500px]">
            <div className="flex flex-col h-full bg-[#fdfbf7] dark:bg-[#1a1a1a] rounded-2xl p-6 border border-yellow-200 dark:border-gray-800 shadow-inner relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400 opacity-50"></div>
                <div className="flex items-center justify-between mb-4"><span className="text-xs font-black text-gray-400 uppercase tracking-widest">Entry: {new Date().toLocaleDateString()}</span><div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div></div>
                <textarea className="flex-1 w-full bg-transparent dark:text-gray-200 p-0 border-none focus:ring-0 outline-none resize-none text-lg leading-relaxed placeholder:text-gray-300 dark:placeholder:text-gray-700 font-medium" placeholder="What's on your mind today? Start writing..." value={content} onChange={e => setContent(e.target.value)} style={{ backgroundImage: 'linear-gradient(transparent 95%, #e5e7eb 95%)', backgroundSize: '100% 2rem', lineHeight: '2rem' }}></textarea>
                <div className="mt-4 flex justify-end"><button onClick={handleSave} className={`bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full font-bold text-sm hover:scale-105 transition-all shadow-lg flex items-center gap-2 ${!content.trim() ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!content.trim()}>{saved ? <CheckCircle className="w-4 h-4 text-green-500"/> : <Save className="w-4 h-4"/>}{saved ? "Saved" : "Save Note"}</button></div>
            </div>
            <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex justify-between items-center"><h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider flex items-center gap-2"><Clock className="w-3 h-3"/> Timeline</h3><span className="text-[10px] font-bold bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300">{entries.length} Entries</span></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-yellow-200 dark:scrollbar-thumb-gray-700">
                    {entries.length === 0 && (<div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50"><BookOpen className="w-12 h-12 mb-2 stroke-1"/><p className="text-sm">Your story begins here.</p></div>)}
                    {entries.map(entry => (<div key={entry.id} className="group p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-yellow-400 dark:hover:border-yellow-600 transition-all cursor-default shadow-sm hover:shadow-md"><div className="flex justify-between items-start mb-2"><span className="text-[10px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-wide bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md">{new Date(entry.date).toLocaleDateString()}</span><span className="text-[10px] text-gray-400 font-mono">{new Date(entry.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div><p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed font-medium group-hover:text-black dark:group-hover:text-white transition-colors">{entry.content}</p></div>))}
                </div>
            </div>
        </div>
    );
};

const PaymentModal: React.FC<{ onClose: () => void, onSuccess: (mins: number, cost: number) => void, initialError?: string }> = ({ onClose, onSuccess, initialError }) => {
    const [amount, setAmount] = useState(20); 
    const [isCustom, setIsCustom] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(initialError || '');
    const pricePerMin = 1.59;
    const stripeRef = useRef<any>(null); 
    const elementsRef = useRef<any>(null); 
    const cardElementRef = useRef<any>(null); 
    const mountNodeRef = useRef<HTMLDivElement>(null);

    useEffect(() => { 
        if (!window.Stripe) { setError("Stripe failed to load. Please refresh."); return; } 
        if (!stripeRef.current) { 
            try {
                stripeRef.current = window.Stripe(STRIPE_PUBLISHABLE_KEY); 
                elementsRef.current = stripeRef.current.elements(); 
                const style = { base: { color: "#32325d", fontFamily: '"Manrope", sans-serif', fontSmoothing: "antialiased", fontSize: "16px", "::placeholder": { color: "#aab7c4" } } }; 
                if (!cardElementRef.current) { 
                    cardElementRef.current = elementsRef.current.create("card", { style: style, hidePostalCode: true }); 
                    if (mountNodeRef.current) cardElementRef.current.mount(mountNodeRef.current);
                } 
            } catch (e) { setError("Payment system unavailable."); }
        } 
    }, []);

    const setMountNode = (node: HTMLDivElement | null) => {
        mountNodeRef.current = node;
        if (node && cardElementRef.current) { try { cardElementRef.current.mount(node); } catch(e) {} }
    };

    const handleSubmit = async (e: React.FormEvent) => { 
        e.preventDefault(); 
        setProcessing(true); 
        setError(''); 
        if (!amount || amount <= 0) { setError("Please enter a valid amount."); setProcessing(false); return; } 
        try { 
            const result = await stripeRef.current.createToken(cardElementRef.current); 
            if (result.error) { setError(result.error.message); setProcessing(false); } 
            else { setTimeout(() => { setProcessing(false); onSuccess(Math.floor(amount / pricePerMin), amount); }, 1500); } 
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
                            {[20, 50, 100, 250].map((val) => (<button key={val} type="button" onClick={() => { setAmount(val); setIsCustom(false); }} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!isCustom && amount === val ? 'bg-black dark:bg-white dark:text-black text-white shadow-lg transform scale-105' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>${val}</button>))} 
                            <button type="button" onClick={() => { setIsCustom(true); setAmount(0); }} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isCustom ? 'bg-black dark:bg-white dark:text-black text-white shadow-lg transform scale-105' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Custom</button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Adds approx. <span className="font-bold text-black dark:text-white">{Math.floor((amount || 0) / pricePerMin)} mins</span> of talk time.</p>
                    </div>
                    {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0" /><span>{error}</span></div>}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700"><div ref={setMountNode} className="p-2" /></div>
                        <button type="submit" disabled={processing || !window.Stripe || (amount <= 0)} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${processing || (amount <= 0) ? 'bg-gray-800 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-yellow-500 text-black hover:bg-yellow-400 hover:scale-[1.02]'}`}>
                            {processing ? <span className="animate-pulse">Processing Securely...</span> : <><Lock className="w-5 h-5" /> Pay ${(amount || 0).toFixed(2)}</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const ProfileModal: React.FC<{ user: User, onClose: () => void, onUpdate: () => void }> = ({ user, onClose, onUpdate }) => {
    const [name, setName] = useState(user.name);
    const [loading, setLoading] = useState(false);
    const handleSave = async () => { 
        setLoading(true); 
        await Database.updateUser({ ...user, name }); 
        onUpdate(); 
        setLoading(false);
        onClose(); 
    };
    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-8 border border-yellow-200 dark:border-gray-800 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5"/></button>
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
  const [darkMode, setDarkMode] = useState(false); 
  const [balance, setBalance] = useState(user.balance);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [loadingCompanions, setLoadingCompanions] = useState(true);
  const [dashboardUser, setDashboardUser] = useState(user);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | undefined>(undefined);
  const [showProfile, setShowProfile] = useState(false);
  const [showGrounding, setShowGrounding] = useState(false);
  const [mood, setMood] = useState<'confetti' | 'rain' | null>(null);
  const [showTechCheck, setShowTechCheck] = useState(false);
  const [pendingCompanion, setPendingCompanion] = useState<Companion | null>(null);
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('All');

  useEffect(() => {
    const savedTheme = localStorage.getItem('peutic_theme');
    if (savedTheme === 'dark') { setDarkMode(true); document.documentElement.classList.add('dark'); }
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
      const u = await Database.getUserByEmail(user.email);
      if (u) {
          setDashboardUser(u);
          setBalance(u.balance);
          const tx = await Database.getUserTransactions(u.id);
          setTransactions(tx);
      }
      
      const compList = await Database.getCompanions();
      setCompanions(compList);
      setLoadingCompanions(false);
  };

  const toggleDarkMode = () => {
      if (darkMode) { document.documentElement.classList.remove('dark'); localStorage.setItem('peutic_theme', 'light'); setDarkMode(false); } 
      else { document.documentElement.classList.add('dark'); localStorage.setItem('peutic_theme', 'dark'); setDarkMode(true); }
  };

  const handleMoodSelect = (m: 'confetti' | 'rain' | null) => { setMood(m); if (m) Database.saveMood(user.id, m); };
  const handlePaymentSuccess = (minutesAdded: number, cost: number) => { Database.topUpWallet(minutesAdded, cost, user.id); refreshData(); setShowPayment(false); };
  const handleStartConnection = (c: Companion) => {
      if (dashboardUser.balance <= 0) { setPaymentError("Insufficient credits. Please add funds to start a session."); setShowPayment(true); return; }
      setPendingCompanion(c);
      setShowTechCheck(true);
  };
  const confirmSession = () => { setShowTechCheck(false); if (pendingCompanion) onStartSession(pendingCompanion); };
  const handleDeleteAccount = async () => { await Database.deleteUser(user.id); onLogout(); };
  const filteredCompanions = specialtyFilter === 'All' ? companions : companions.filter(c => c.specialty.includes(specialtyFilter) || c.specialty === specialtyFilter);
  const uniqueSpecialties = Array.from(new Set(companions.map(c => c.specialty))).sort();

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${darkMode ? 'dark bg-[#0A0A0A] text-white' : 'bg-[#FFFBEB] text-black'}`}>
      
      {/* --- MOBILE TOP BAR --- */}
      <div className="md:hidden sticky top-0 bg-[#FFFBEB]/90 dark:bg-black/90 backdrop-blur-md border-b border-yellow-200 dark:border-gray-800 p-4 flex justify-between items-center z-40">
          <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center shadow-md">
                  <Heart className="w-5 h-5 text-black fill-black" />
              </div>
              <span className="font-black tracking-tight text-lg">Peutic</span>
          </div>
          <div className="flex items-center gap-3">
              <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                  {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
              </button>
              <button 
                  onClick={() => setShowPayment(true)} 
                  className="bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1 active:scale-95 transition-transform"
                  title="Top Up Credits"
              >
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
          {/* --- SIDEBAR (Desktop) --- */}
          <aside className="hidden md:flex w-24 lg:w-72 flex-col border-r border-yellow-200 dark:border-gray-800 bg-[#FFFBEB]/50 dark:bg-black/50 backdrop-blur-xl">
              <div className="p-6 lg:p-8 flex items-center justify-center lg:justify-start gap-3">
                  <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg group hover:scale-110 transition-transform">
                      <Heart className="w-6 h-6 text-black fill-black" />
                  </div>
                  <span className="hidden lg:block text-2xl font-black tracking-tight dark:text-white">Peutic</span>
              </div>
              <nav className="flex-1 px-4 py-8 space-y-4">
                  {[{ id: 'hub', icon: LayoutDashboard, label: 'Sanctuary' }, { id: 'history', icon: Clock, label: 'Journey' }, { id: 'settings', icon: Settings, label: 'Config' }].map((item) => (
                      <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center justify-center lg:justify-start gap-4 p-4 rounded-2xl transition-all duration-300 group ${activeTab === item.id ? 'bg-black text-white dark:bg-white dark:text-black shadow-xl' : 'text-gray-500 hover:bg-yellow-100 dark:hover:bg-gray-800 dark:text-gray-400'}`}>
                          <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'text-yellow-400 dark:text-yellow-600' : 'group-hover:text-yellow-600 dark:group-hover:text-white'}`} />
                          <span className="hidden lg:block font-bold text-sm tracking-wide">{item.label}</span>
                      </button>
                  ))}
              </nav>
              <div className="p-4 lg:p-8 border-t border-yellow-200 dark:border-gray-800">
                  <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-bold text-sm">
                      <LogOut className="w-5 h-5" /><span className="hidden lg:block">Disconnect</span>
                  </button>
              </div>
          </aside>

          {/* --- MAIN CONTENT --- */}
          <main className="flex-1 overflow-y-auto relative scroll-smooth">
              <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12 pb-32">
                  <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                      <div className="flex-1">
                          <p className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                              <h1 className="text-3xl md:text-5xl font-black tracking-tight dark:text-white">{activeTab === 'hub' ? `Hello, ${user.name.split(' ')[0]}.` : activeTab === 'history' ? 'Your Journey' : 'Settings'}</h1>
                              {activeTab === 'hub' && (<button onClick={() => setShowGrounding(true)} className="hidden md:flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 px-4 py-2 rounded-full font-bold text-sm transition-all hover:scale-105 animate-pulse"><LifeBuoy className="w-4 h-4" /> Panic Relief</button>)}
                          </div>
                      </div>
                      <div className="hidden md:flex items-center gap-4">
                          <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">{darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}</button>
                          <button onClick={() => setShowPayment(true)} className={`px-6 py-3 rounded-2xl font-black shadow-lg transition-transform hover:scale-105 flex items-center gap-2 ${balance < 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-black dark:bg-white text-white dark:text-black'}`}>
                             <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>{balance} mins<Plus className="w-4 h-4 ml-1 opacity-50" />
                          </button>
                          <button onClick={() => setShowProfile(true)} className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-yellow-400 shadow-xl hover:rotate-3 transition-transform"><AvatarImage src={dashboardUser.avatar || ''} alt={dashboardUser.name} className="w-full h-full object-cover" isUser={true} /></button>
                      </div>
                  </header>

                  {/* --- TAB CONTENT --- */}
                  {activeTab === 'hub' && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                          <CollapsibleSection title="Inner Sanctuary" icon={Feather}><div className="space-y-8"><JournalSection user={user} /><div className="border-t border-dashed border-yellow-200 dark:border-gray-700" /><WisdomGenerator userId={user.id} /></div></CollapsibleSection>
                          <div>
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6"><div><h2 className="text-2xl font-black dark:text-white">Available Specialists</h2><p className="text-gray-500 text-sm">Select a guide to begin your session.</p></div><div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide"><button onClick={() => setSpecialtyFilter('All')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${specialtyFilter === 'All' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>All</button>{uniqueSpecialties.map(spec => (<button key={spec} onClick={() => setSpecialtyFilter(spec)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${specialtyFilter === spec ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{spec}</button>))}</div></div>
                              {loadingCompanions ? (<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">{[1,2,3,4,5].map(i => <div key={i} className="h-64 bg-gray-100 dark:bg-gray-900 rounded-3xl animate-pulse"></div>)}</div>) : (<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">{filteredCompanions.map((companion) => (<div key={companion.id} onClick={() => handleStartConnection(companion)} className="group relative bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden border border-yellow-100 dark:border-gray-800 hover:border-yellow-400 dark:hover:border-yellow-600 transition-all duration-300 hover:shadow-2xl cursor-pointer flex flex-col h-full"><div className="aspect-[4/5] relative overflow-hidden bg-gray-100 dark:bg-gray-800"><AvatarImage src={companion.imageUrl} alt={companion.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div><div className="absolute top-3 left-3 flex gap-2"><div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md ${companion.status === 'AVAILABLE' ? 'bg-green-500/90 text-white shadow-lg shadow-green-500/20' : 'bg-gray-500/90 text-white'}`}>{companion.status === 'AVAILABLE' ? 'Online' : 'Busy'}</div></div><div className="absolute bottom-3 left-3 right-3"><h3 className="text-white font-black text-lg leading-tight mb-0.5 shadow-sm drop-shadow-md">{companion.name}</h3><p className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider truncate">{companion.specialty}</p></div></div></div>))}</div>)}
                          </div>
                      </div>
                  )}

                  {activeTab === 'history' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-500">
                          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-yellow-100 dark:border-gray-800 overflow-hidden">
                              <table className="w-full text-left">
                                  <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider"><tr><th className="p-4 md:p-6">Date</th><th className="p-4 md:p-6">Description</th><th className="p-4 md:p-6 text-right">Amount</th><th className="p-4 md:p-6 text-right">Status</th></tr></thead>
                                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                      {transactions.length === 0 ? (<tr><td colSpan={4} className="p-8 text-center text-gray-400">No history found.</td></tr>) : (transactions.map((tx) => (<tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"><td className="p-4 md:p-6 text-sm dark:text-gray-300 font-mono">{new Date(tx.date).toLocaleDateString()}</td><td className="p-4 md:p-6 text-sm font-bold dark:text-white">{tx.description}</td><td className={`p-4 md:p-6 text-sm text-right font-mono font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount}m</td><td className="p-4 md:p-6 text-right"><span className="px-2 py-1 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase tracking-wide">{tx.status}</span></td></tr>)))}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  )}

                  {activeTab === 'settings' && (
                      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-5 duration-500">
                          <div className="bg-red-50 dark:bg-red-950/20 rounded-3xl border border-red-100 dark:border-red-900 overflow-hidden shadow-sm">
                              <div className="p-6 md:p-8 border-b border-red-100 dark:border-red-900"><h3 className="font-black text-xl md:text-2xl text-red-900 dark:text-red-400 mb-2">Danger Zone</h3><p className="text-red-600/70 dark:text-red-400/60 text-sm">Permanent actions for your data.</p></div>
                              <div className="p-6 md:p-8">
                                  <div className="flex items-center justify-between"><div><p className="font-bold text-red-900 dark:text-red-400 text-sm">Delete Account</p><p className="text-xs text-red-700/60 dark:text-red-400/50">Remove all data and access.</p></div><button onClick={handleDeleteAccount} className="px-6 py-3 bg-white dark:bg-transparent border border-red-200 dark:border-red-800 text-red-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Delete Account</button></div>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </main>
      </div>
      {showPayment && <PaymentModal onClose={() => { setShowPayment(false); setPaymentError(undefined); }} onSuccess={handlePaymentSuccess} initialError={paymentError} />}
      {showProfile && <ProfileModal user={dashboardUser} onClose={() => setShowProfile(false)} onUpdate={refreshData} />}
      {showGrounding && <GroundingMode onClose={() => setShowGrounding(false)} />}
      {showTechCheck && (<TechCheck onConfirm={confirmSession} onCancel={() => setShowTechCheck(false)} />)}
    </div>
  );
};

export default Dashboard;
