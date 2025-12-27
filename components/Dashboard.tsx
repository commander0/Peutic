
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User, Companion, Transaction, JournalEntry, ArtEntry, BreathLog, MoodEntry } from '../types';
import { 
  Video, Clock, Settings, LogOut, 
  LayoutDashboard, Plus, Search, X, Lock, CheckCircle, AlertTriangle, ShieldCheck, Heart,
  Wind, BookOpen, Save, Sparkles, Activity, Info, Flame, Trophy, Target,
  Sun, Cloud, Feather, Anchor, Gamepad2, RefreshCw, Play, Zap, Star, Edit2, Trash2, Bell,
  CloudRain, Image as ImageIcon, Download, ChevronDown, ChevronUp, Lightbulb, User as UserIcon, Shield, Moon,
  Twitter, Instagram, Linkedin, LifeBuoy, Volume2, VolumeX, Minimize2, Maximize2, Music, Radio, Flame as Fire, Smile, Trees,
  Mail, Smartphone, Globe, CreditCard, ToggleLeft, ToggleRight, StopCircle, ArrowRight, FileText, Filter
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
// COMPONENT DEFINITIONS
// ==========================================

const WeatherEffect: React.FC<{ type: 'confetti' | 'rain' }> = ({ type }) => {
    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {type === 'confetti' && Array.from({ length: 50 }).map((_, i) => (
                <div key={i} className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ left: `${Math.random() * 100}%`, top: `-10px`, animationDuration: `${Math.random() * 3 + 2}s` }}></div>
            ))}
            {type === 'rain' && Array.from({ length: 100 }).map((_, i) => (
                <div key={i} className="absolute w-0.5 h-4 bg-blue-400/50" style={{ left: `${Math.random() * 100}%`, top: `-20px`, animationDuration: `${Math.random() * 1 + 0.5}s`, animationName: 'rain' }}></div>
            ))}
            <style>{`@keyframes rain { 0% { transform: translateY(0); } 100% { transform: translateY(100vh); } }`}</style>
        </div>
    );
};

const SoundscapePlayer: React.FC = () => {
    const [playing, setPlaying] = useState(false);
    const toggle = () => setPlaying(!playing);
    return (
        <div className="fixed bottom-4 right-4 z-40 hidden md:flex items-center gap-2 bg-black/80 text-white p-2 rounded-full">
            <button onClick={toggle} className="p-2 hover:bg-white/20 rounded-full">
                {playing ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <span className="text-xs font-bold pr-2">Zen Mode</span>
        </div>
    );
};

const MoodTracker: React.FC<{ onMoodSelect: (m: 'confetti' | 'rain' | null) => void }> = ({ onMoodSelect }) => {
    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-yellow-100 dark:border-gray-800 shadow-sm">
            <h3 className="font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest mb-4">Daily Check-in</h3>
            <div className="flex justify-between gap-2">
                <button onClick={() => onMoodSelect('confetti')} className="flex-1 p-3 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 rounded-xl transition-colors text-2xl">☀️</button>
                <button onClick={() => onMoodSelect('rain')} className="flex-1 p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-colors text-2xl">🌧️</button>
                <button onClick={() => onMoodSelect(null)} className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-2xl">😐</button>
            </div>
        </div>
    );
};

const MindfulMatchGame: React.FC = () => {
    return (
        <div className="w-full h-full flex items-center justify-center bg-sky-50 dark:bg-gray-800 p-4">
             <div className="text-center">
                 <Gamepad2 className="w-12 h-12 text-sky-500 mx-auto mb-2" />
                 <p className="text-sm font-bold text-gray-500">Mindful Match</p>
                 <button className="mt-2 px-4 py-2 bg-sky-500 text-white rounded-full text-xs font-bold">Play</button>
             </div>
        </div>
    );
};

const CloudHopGame: React.FC = () => {
    return (
        <div className="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-gray-800 p-4">
             <div className="text-center">
                 <Cloud className="w-12 h-12 text-indigo-500 mx-auto mb-2" />
                 <p className="text-sm font-bold text-gray-500">Cloud Hop</p>
                 <button className="mt-2 px-4 py-2 bg-indigo-500 text-white rounded-full text-xs font-bold">Play</button>
             </div>
        </div>
    );
};

const JournalSection: React.FC<{ user: User }> = ({ user }) => {
    const [entry, setEntry] = useState('');
    const save = () => {
        if(entry.trim()) {
            alert("Journal saved to encrypted storage.");
            setEntry('');
        }
    };
    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-yellow-100 dark:border-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-yellow-500"/> Private Journal</h3>
            <textarea 
                className="w-full h-32 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border-none resize-none focus:ring-2 focus:ring-yellow-400 dark:text-white" 
                placeholder="Write your thoughts here..."
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
            ></textarea>
            <div className="flex justify-end mt-4">
                <button onClick={save} className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-bold">Save Entry</button>
            </div>
        </div>
    );
};

const WisdomGenerator: React.FC<{ userId: string }> = ({ userId }) => {
    const [wisdom, setWisdom] = useState<string>('');
    useEffect(() => {
        generateAffirmation().then(setWisdom);
    }, []);
    return (
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-3xl text-white relative overflow-hidden">
            <Sparkles className="w-8 h-8 absolute top-4 right-4 opacity-50" />
            <h3 className="font-bold text-sm uppercase tracking-widest opacity-80 mb-2">Daily Wisdom</h3>
            <p className="text-xl md:text-2xl font-serif italic leading-relaxed">"{wisdom || 'Loading...'}"</p>
            <button onClick={() => generateAffirmation().then(setWisdom)} className="mt-4 text-xs font-bold uppercase tracking-wider hover:opacity-80">New Affirmation</button>
        </div>
    );
};

const BreathingExercise: React.FC<{ userId: string, onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="text-center">
                <div className="w-48 h-48 rounded-full border-4 border-white/20 animate-pulse mx-auto mb-8 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">Breathe</span>
                </div>
                <button onClick={onClose} className="px-8 py-3 bg-white text-black rounded-full font-bold">Close</button>
            </div>
        </div>
    );
};

const ProfileModal: React.FC<{ user: User, onClose: () => void, onUpdate: () => void }> = ({ user, onClose, onUpdate }) => {
    const [name, setName] = useState(user.name);
    const save = async () => {
        await Database.updateUser({ ...user, name });
        onUpdate();
        onClose();
    };
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl w-full max-w-md">
                <h3 className="text-2xl font-bold mb-4 dark:text-white">Edit Profile</h3>
                <input className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4 dark:text-white" value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-500">Cancel</button>
                    <button onClick={save} className="px-4 py-2 bg-yellow-500 text-black rounded-xl font-bold">Save</button>
                </div>
            </div>
        </div>
    );
};

// Re-including PaymentModal for context of topUpWallet
const PaymentModal: React.FC<{ onClose: () => void, onSuccess: (mins: number, cost: number) => void, initialError?: string }> = ({ onClose, onSuccess, initialError }) => {
    const [amount, setAmount] = useState(20); 
    const [isCustom, setIsCustom] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(initialError || '');
    
    const pricePerMin = 1.49;
    const stripeRef = useRef<any>(null); 
    const elementsRef = useRef<any>(null); 
    const cardElementRef = useRef<any>(null); 
    const mountNodeRef = useRef<HTMLDivElement>(null);

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
        setError(''); 
        if (!amount || amount <= 0) { setError("Please enter a valid amount."); setProcessing(false); return; } 
        if (!stripeRef.current || !cardElementRef.current) { setError("Stripe not initialized."); setProcessing(false); return; } 
        try { 
            const result = await stripeRef.current.createToken(cardElementRef.current); 
            if (result.error) { 
                setError(result.error.message); 
                setProcessing(false); 
            } else { 
                setTimeout(() => { 
                    setProcessing(false); 
                    const minutesAdded = Math.floor(amount / pricePerMin); 
                    onSuccess(minutesAdded, amount); 
                }, 1500); 
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
                        {isCustom && (
                            <div className="mb-6 animate-in fade-in zoom-in duration-300">
                                <div className="relative max-w-[180px] mx-auto">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
                                    <input type="number" min="1" step="1" value={amount === 0 ? '' : amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none text-2xl font-bold text-center" placeholder="0.00" autoFocus />
                                </div>
                            </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">Adds approx. <span className="font-bold text-black dark:text-white">{Math.floor((amount || 0) / pricePerMin)} mins</span> of talk time.</p>
                    </div>
                    {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0" /><span>{error}</span></div>}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700"><div ref={mountNodeRef} className="p-2" /></div>
                        <button type="submit" disabled={processing || !window.Stripe || (amount <= 0)} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${processing || (amount <= 0) ? 'bg-gray-800 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-yellow-500 text-black hover:bg-yellow-400 hover:scale-[1.02]'}`}>
                            {processing ? <span className="animate-pulse">Processing Securely...</span> : <><Lock className="w-5 h-5" /> Pay ${(amount || 0).toFixed(2)}</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
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
  const [showGrounding, setShowGrounding] = useState(false);
  const [mood, setMood] = useState<'confetti' | 'rain' | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(user.emailPreferences?.updates ?? true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showTechCheck, setShowTechCheck] = useState(false);
  const [pendingCompanion, setPendingCompanion] = useState<Companion | null>(null);
  const [showCookies, setShowCookies] = useState(false);
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('All');

  const refreshData = async () => {
      // Fetch fresh user data from DB
      const freshUser = await Database.syncUser(user.id);
      if (freshUser) {
          setDashboardUser(freshUser);
          setBalance(freshUser.balance);
          // Fetch transactions from DB
          const txs = await Database.getUserTransactions(freshUser.id);
          setTransactions(txs);
          
          setEditName(freshUser.name);
          setEditEmail(freshUser.email);
          setEmailNotifications(freshUser.emailPreferences?.updates ?? true);
          
          const prog = Database.getWeeklyProgress(freshUser.id);
          setWeeklyGoal(prog.current);
          setWeeklyMessage(prog.message);
      }
      setCompanions(Database.getCompanions());
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('peutic_theme');
    if (savedTheme === 'dark') {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
    }
    refreshData();
    generateDailyInsight(user.name).then(setDailyInsight);
    setTimeout(() => {
        setCompanions(Database.getCompanions());
        setLoadingCompanions(false);
    }, 500);
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
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

  const handleMoodSelect = (m: 'confetti' | 'rain' | null) => {
      setMood(m);
      if (m) {
          Database.saveMood(user.id, m);
      }
  };

  const handlePaymentSuccess = async (minutesAdded: number, cost: number) => {
      await Database.topUpWallet(minutesAdded, cost, user.id);
      await refreshData();
      setShowPayment(false);
  };

  const handleStartConnection = (c: Companion) => {
      if (dashboardUser.balance <= 0) {
          setPaymentError("Insufficient credits. Please add funds to start a session.");
          setShowPayment(true);
          return;
      }
      setPendingCompanion(c);
      setShowTechCheck(true);
  };

  const confirmSession = () => {
      setShowTechCheck(false);
      if (pendingCompanion) {
          onStartSession(pendingCompanion);
      }
  };

  const saveProfileChanges = () => {
      setIsSavingProfile(true);
      setTimeout(async () => {
          const updatedUser = { 
              ...dashboardUser, 
              name: editName, 
              email: editEmail,
              emailPreferences: { ...dashboardUser.emailPreferences, updates: emailNotifications } 
          };
          await Database.updateUser(updatedUser);
          setDashboardUser(updatedUser);
          setIsSavingProfile(false);
      }, 500);
  };

  const handleDeleteAccount = async () => {
      await Database.deleteUser(user.id);
      onLogout();
  };

  const filteredCompanions = specialtyFilter === 'All' 
      ? companions 
      : companions.filter(c => c.specialty.includes(specialtyFilter) || c.specialty === specialtyFilter);

  const uniqueSpecialties = Array.from(new Set(companions.map(c => c.specialty))).sort();

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${darkMode ? 'dark bg-[#0A0A0A] text-white' : 'bg-[#FFFBEB] text-black'}`}>
      
      {mood && <WeatherEffect type={mood} />}
      <SoundscapePlayer />

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
              <button onClick={() => setShowGrounding(true)} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors animate-pulse" title="Panic Relief">
                  <LifeBuoy className="w-4 h-4" />
              </button>
              <button onClick={() => setShowPayment(true)} className="bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-full text-xs font-bold shadow-md">{balance}m</button>
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
                      <div className="flex-1">
                          <p className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                              <h1 className="text-3xl md:text-5xl font-black tracking-tight dark:text-white">
                                  {activeTab === 'hub' ? `Hello, ${user.name.split(' ')[0]}.` : activeTab === 'history' ? 'Your Journey' : 'Settings'}
                              </h1>
                              {activeTab === 'hub' && (
                                <button onClick={() => setShowGrounding(true)} className="hidden md:flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 px-4 py-2 rounded-full font-bold text-sm transition-all hover:scale-105 animate-pulse">
                                    <LifeBuoy className="w-4 h-4" /> Panic Relief
                                </button>
                              )}
                          </div>
                          {activeTab === 'hub' && dailyInsight && (
                              <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-lg text-sm md:text-base font-medium leading-relaxed border-l-4 border-yellow-400 pl-4 italic">
                                  "{dailyInsight}"
                              </p>
                          )}
                      </div>

                      <div className="hidden md:flex items-center gap-4">
                          <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
                          </button>
                          <button 
                              onClick={() => setShowPayment(true)}
                              className={`px-6 py-3 rounded-2xl font-black shadow-lg transition-transform hover:scale-105 flex items-center gap-2 ${balance < 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-black dark:bg-white text-white dark:text-black'}`}
                          >
                             <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                             {balance} mins
                             <Plus className="w-4 h-4 ml-1 opacity-50" />
                          </button>
                          <button onClick={() => setShowProfile(true)} className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-yellow-400 shadow-xl hover:rotate-3 transition-transform">
                              <AvatarImage src={dashboardUser.avatar || ''} alt={dashboardUser.name} className="w-full h-full object-cover" isUser={true} />
                          </button>
                      </div>
                  </header>

                  {activeTab === 'hub' && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                          {/* Top Row: Weekly Progress & Mood */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-yellow-100 dark:border-gray-800 shadow-sm col-span-1 md:col-span-2 relative overflow-hidden group">
                                  {weeklyGoal >= weeklyTarget ? (
                                      <div className="absolute top-0 right-0 p-4 z-20">
                                          <div className="relative flex items-center justify-center">
                                              <div className="absolute w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                                              <div className="absolute w-20 h-20 bg-blue-500/30 rounded-full blur-xl animate-pulse"></div>
                                              <div className="absolute w-full h-full bg-blue-400/10 rounded-full animate-ping"></div>
                                              <div className="absolute w-12 h-12 bg-blue-400/50 rounded-full blur-lg animate-pulse"></div>
                                              <Flame className="w-14 h-14 text-blue-500 fill-blue-500 drop-shadow-[0_0_20px_rgba(59,130,246,1)] animate-bounce relative z-10" />
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Trophy className="w-24 h-24 text-yellow-500" /></div>
                                  )}
                                  
                                  <div className="relative z-10">
                                      <h3 className="font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest mb-1">Weekly Wellness Goal</h3>
                                      <div className="flex items-end gap-2 mb-4">
                                          <span className="text-4xl font-black dark:text-white">{weeklyGoal}</span>
                                          <span className="text-gray-400 text-sm font-bold mb-1">/ {weeklyTarget} activities</span>
                                      </div>
                                      <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-3">
                                          <div className={`h-full rounded-full transition-all duration-1000 ease-out ${weeklyGoal >= weeklyTarget ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse' : 'bg-yellow-400'}`} style={{ width: `${Math.min(100, (weeklyGoal / weeklyTarget) * 100)}%` }}></div>
                                      </div>
                                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{weeklyGoal >= weeklyTarget ? "🔥 You are on a hot streak!" : weeklyMessage}</p>
                                  </div>
                              </div>
                              <MoodTracker onMoodSelect={handleMoodSelect} />
                          </div>

                          {/* Mindful Arcade - Moved Up - COMPRESSED HEIGHT FOR TABLET */}
                          <CollapsibleSection title="Mindful Arcade" icon={Gamepad2}>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                  {/* Mindful Match - Height adjusted to md:h-[340px] */}
                                  <div className="relative w-full h-[350px] md:h-[340px] xl:h-[400px] rounded-3xl overflow-hidden border border-yellow-100 dark:border-gray-700 shadow-sm flex flex-col bg-sky-50 dark:bg-gray-800">
                                       <div className="absolute top-3 left-0 right-0 text-center z-10 pointer-events-none">
                                           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white/90 dark:bg-black/90 px-3 py-1.5 rounded-full shadow-sm">Mindful Match</span>
                                       </div>
                                       <MindfulMatchGame />
                                  </div>
                                  
                                  {/* Cloud Hop - Height adjusted to md:h-[340px] */}
                                  <div className="relative w-full h-[350px] md:h-[340px] xl:h-[400px] rounded-3xl overflow-hidden border border-yellow-100 dark:border-gray-700 shadow-sm flex flex-col">
                                       <div className="absolute top-3 left-0 right-0 text-center z-10 pointer-events-none">
                                           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white/90 dark:bg-black/90 px-3 py-1.5 rounded-full shadow-sm">Cloud Hop</span>
                                       </div>
                                       <CloudHopGame />
                                  </div>
                              </div>
                          </CollapsibleSection>

                          {/* Unified Hub: Inner Sanctuary */}
                          <CollapsibleSection title="Inner Sanctuary" icon={Feather}>
                               <div className="space-y-8">
                                   <JournalSection user={user} />
                                   <div className="border-t border-dashed border-yellow-200 dark:border-gray-700" />
                                   <WisdomGenerator userId={user.id} />
                               </div>
                          </CollapsibleSection>

                          {/* COMPANION GRID */}
                          <div>
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
                                  <div>
                                      <h2 className="text-2xl font-black dark:text-white">Available Specialists</h2>
                                      <p className="text-gray-500 text-sm">Select a guide to begin your session.</p>
                                  </div>
                                  
                                  {/* CATEGORY FILTER */}
                                  <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                                      <button 
                                          onClick={() => setSpecialtyFilter('All')} 
                                          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${specialtyFilter === 'All' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
                                      >
                                          All
                                      </button>
                                      {uniqueSpecialties.map(spec => (
                                          <button 
                                              key={spec}
                                              onClick={() => setSpecialtyFilter(spec)}
                                              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${specialtyFilter === spec ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                          >
                                              {spec}
                                          </button>
                                      ))}
                                  </div>
                              </div>

                              {loadingCompanions ? (
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                      {[1,2,3,4,5].map(i => <div key={i} className="h-64 bg-gray-100 dark:bg-gray-900 rounded-3xl animate-pulse"></div>)}
                                  </div>
                              ) : (
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                                      {filteredCompanions.map((companion) => (
                                          <div 
                                              key={companion.id} 
                                              onClick={() => handleStartConnection(companion)}
                                              className="group relative bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden border border-yellow-100 dark:border-gray-800 hover:border-yellow-400 dark:hover:border-yellow-600 transition-all duration-300 hover:shadow-2xl cursor-pointer flex flex-col h-full"
                                          >
                                              {/* Image Section - Top */}
                                              <div className="aspect-[4/5] relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                  <AvatarImage src={companion.imageUrl} alt={companion.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                                  
                                                  <div className="absolute top-3 left-3 flex gap-2">
                                                      <div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md ${companion.status === 'AVAILABLE' ? 'bg-green-500/90 text-white shadow-lg shadow-green-500/20' : 'bg-gray-500/90 text-white'}`}>
                                                          {companion.status === 'AVAILABLE' ? 'Online' : 'Busy'}
                                                      </div>
                                                  </div>
                                                  
                                                  <div className="absolute bottom-3 left-3 right-3">
                                                      <h3 className="text-white font-black text-lg leading-tight mb-0.5 shadow-sm drop-shadow-md">{companion.name}</h3>
                                                      <p className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider truncate">{companion.specialty}</p>
                                                  </div>
                                              </div>
                                              
                                              {/* Info Section - Bottom */}
                                              <div className="p-3 bg-white dark:bg-gray-900 flex justify-between items-center border-t border-gray-100 dark:border-gray-800">
                                                  <div className="flex items-center gap-1">
                                                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                      <span className="text-gray-500 dark:text-gray-400 text-xs font-bold">{companion.rating}</span>
                                                  </div>
                                                  <button className="bg-gray-100 dark:bg-gray-800 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black rounded-lg p-2 transition-colors">
                                                      <ArrowRight className="w-4 h-4" />
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
                      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-5 duration-500">
                          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-yellow-200 dark:border-gray-800 overflow-hidden shadow-sm">
                              <div className="p-6 md:p-8 border-b border-yellow-100 dark:border-gray-800">
                                  <h3 className="font-black text-xl md:text-2xl dark:text-white mb-2">Profile & Identity</h3>
                                  <p className="text-gray-500 text-sm">Manage your personal information.</p>
                              </div>
                              <div className="p-6 md:p-8 space-y-6">
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Full Name</label>
                                      <input 
                                          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 font-bold dark:text-white focus:ring-2 focus:ring-yellow-400 outline-none" 
                                          value={editName}
                                          onChange={(e) => setEditName(e.target.value)}
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Address</label>
                                      <input 
                                          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 font-bold dark:text-white focus:ring-2 focus:ring-yellow-400 outline-none" 
                                          value={editEmail}
                                          onChange={(e) => setEditEmail(e.target.value)}
                                      />
                                  </div>
                                  <div className="flex justify-end pt-4">
                                      <button 
                                          onClick={saveProfileChanges}
                                          disabled={isSavingProfile}
                                          className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold text-sm hover:opacity-80 transition-opacity flex items-center gap-2"
                                      >
                                          {isSavingProfile ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                                          Save Changes
                                      </button>
                                  </div>
                              </div>
                          </div>
                          
                          <div className="bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/30 overflow-hidden">
                               <div className="p-6 md:p-8 flex items-start gap-4">
                                   <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                                       <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
                                   </div>
                                   <div className="flex-1">
                                       <h3 className="font-black text-lg text-red-700 dark:text-red-400 mb-1">Danger Zone</h3>
                                       <p className="text-sm text-red-600/70 dark:text-red-400/70 mb-4">Permanently delete your account and all data.</p>
                                       {showDeleteConfirm ? (
                                           <div className="flex items-center gap-2 animate-in fade-in">
                                               <button onClick={handleDeleteAccount} className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-700">Yes, Delete</button>
                                               <button onClick={() => setShowDeleteConfirm(false)} className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-xs font-bold">Cancel</button>
                                           </div>
                                       ) : (
                                           <button onClick={() => setShowDeleteConfirm(true)} className="text-red-600 hover:text-red-700 text-xs font-bold underline">Delete Account</button>
                                       )}
                                   </div>
                               </div>
                          </div>
                      </div>
                  )}
              </div>
              
              <div className="mt-8 mb-4 max-w-4xl mx-auto px-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 p-4 rounded-xl text-center">
                      <p className="text-[10px] md:text-xs font-bold text-yellow-800 dark:text-yellow-500 uppercase tracking-wide leading-relaxed">
                          Note: Specialist availability is subject to change.
                      </p>
                  </div>
              </div>
          </main>
      </div>

      {showPayment && <PaymentModal onClose={() => { setShowPayment(false); setPaymentError(undefined); }} onSuccess={handlePaymentSuccess} initialError={paymentError} />}
      {showBreathing && <BreathingExercise userId={user.id} onClose={() => setShowBreathing(false)} />}
      {showProfile && <ProfileModal user={dashboardUser} onClose={() => setShowProfile(false)} onUpdate={refreshData} />}
      {showGrounding && <GroundingMode onClose={() => setShowGrounding(false)} />}
      
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
