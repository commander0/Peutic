import React, { useState, useEffect } from 'react';
import { Heart, Moon, Sun, Target, Pizza, Gamepad2, Sparkles, RefreshCw, CheckCircle2, ChevronLeft, Award, Zap, LogOut, Cpu } from 'lucide-react';
import { User, Lumina } from '../../types';
import { PetService } from '../../services/petService';
import PetCanvas from './PetCanvas';
import { useToast } from '../common/Toast';
import { UserService } from '../../services/userService';
import { SanctuaryService } from '../../services/SanctuaryService';
import CloudHopGame from '../CloudHopGame';
import MindfulMatchGame from '../MindfulMatchGame';

// --- TYPEWRITER COMPONENT ---
const Typewriter: React.FC<{ text: string }> = ({ text }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        let i = 0;
        setDisplayedText('');
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(prev => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(timer);
            }
        }, 40); // 40ms per char
        return () => clearInterval(timer);
    }, [text]);

    return <span>{displayedText}<span className="animate-blink-cursor">_</span></span>;
};

interface LuminaViewProps {
    user: User;
    onClose: () => void;
    isEmbedded?: boolean;
}

const LuminaView: React.FC<LuminaViewProps> = ({ user, onClose, isEmbedded = false }) => {
    const [pet, setPet] = useState<Lumina | null>(null);
    const [emotion, setEmotion] = useState<'idle' | 'happy' | 'hungry' | 'sleeping' | 'sad' | 'eating' | 'energized' | 'thinker' | 'sleepy'>('idle');
    const [loading, setLoading] = useState(true);
    const [showSelection, setShowSelection] = useState(false);
    const [selectedSpecies, setSelectedSpecies] = useState<'Holo-Hamu' | 'Digi-Dino' | 'Neo-Shiba' | 'Zen-Sloth'>('Holo-Hamu');
    const [petName, setPetName] = useState('');
    const [intensity, setIntensity] = useState<1 | 2 | 3>(1); // 1m, 2m, 3m
    const [trick, setTrick] = useState<'spin' | 'magic' | null>(null);
    const [luminaMessage, setLuminaMessage] = useState<string | null>(null);
    const [canvasSize, setCanvasSize] = useState(500);
    const [isCreating, setIsCreating] = useState(false);
    const [showMissions, setShowMissions] = useState(false);
    const [showGameMenu, setShowGameMenu] = useState(false);
    const [activeGame, setActiveGame] = useState<'match' | 'cloud' | null>(null);

    // Tactile Interaction State
    const [isPetting, setIsPetting] = useState(false);
    const [, setAffectionTracker] = useState(0);
    const [particles, setParticles] = useState<{ id: number, x: number, y: number }[]>([]);

    // Mission State (Mocked for gamification)
    const [missions, setMissions] = useState([
        { id: 1, title: 'First Bite', desc: 'Feed your Lumina today', req: 1, progress: 0, reward: 50, claimed: false },
        { id: 2, title: 'Oracle Seeker', desc: 'Seek wisdom from the Oracle', req: 1, progress: 0, reward: 100, claimed: false },
        { id: 3, title: 'Rest Cycle', desc: 'Put your Lumina to sleep', req: 1, progress: 0, reward: 30, claimed: false },
    ]);

    const { showToast } = useToast();
    const COST = intensity;

    // Resize Handler
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            // Ensure canvas fits both width and height bounds on mobile
            const maxSizeFromWidth = width < 768 ? width - 48 : 400;
            const maxSizeFromHeight = height < 700 ? height * 0.5 : 500;

            setCanvasSize(Math.min(maxSizeFromWidth, maxSizeFromHeight, 450));
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        loadPet();
    }, []);

    const loadPet = async () => {
        try {
            // Timeout race
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject("TIMEOUT"), 8000));
            const dataPromise = PetService.getPet(user.id);

            const data = await Promise.race([dataPromise, timeoutPromise]) as Lumina | null;

            if (data) {
                setPet(data);
                if (data.isSleeping) setEmotion('sleeping');
                else if (data.energy < 30) setEmotion('sleepy');
                else if (data.energy > 80 && data.happiness > 80) setEmotion('energized');
                else if (data.experience > data.level * 4) setEmotion('thinker');
            } else {
                setShowSelection(true);
            }
        } catch (error) {
            console.error("Lumina Init Error:", error);
            // Fallback: If timeout or error, assume new user/selection mode to unblock
            setShowSelection(true);
            showToast("Connection weak. Retrying link...", "info");
        }
        setLoading(false);
    };

    // React to User Mood
    useEffect(() => {
        const syncMood = async () => {
            const moods = await UserService.getMoods(user.id);
            if (moods.length > 0) {
                const last = moods[0];
                const isRecent = new Date(last.date).getTime() > Date.now() - (24 * 60 * 60 * 1000); // Last 24h

                if (isRecent) {
                    if (last.mood === 'confetti') {
                        setEmotion('happy');
                        setLuminaMessage("Your energy is glowing today! Let's celebrate!");
                    } else if (last.mood === 'rain' || last.mood === 'Sad' || last.mood === 'Anxious') {
                        setEmotion('sad');
                        setLuminaMessage("I sense some heavy clouds... take a deep breath. I'm right here with you.");
                    } else if (last.mood === 'Stressed' || last.mood === 'Angry') {
                        setEmotion('thinker');
                        setLuminaMessage("Your system seems overloaded. Ground yourself. We can take it slow.");
                    } else {
                        setEmotion('idle');
                        setLuminaMessage("I'm happy to see you today. What shall we do?");
                    }
                } else {
                    setLuminaMessage("It's been a cycle or two... I'm glad you're back.");
                }
            } else {
                setLuminaMessage("Hello there. Let's grow together.");
            }

            // Auto-hide the initial greeting after 8 seconds
            setTimeout(() => setLuminaMessage(null), 8000);
        };
        syncMood();
    }, [user.id]);

    const handleCreatePet = async () => {
        if (!petName.trim()) {
            showToast("DATA_ERROR: NAME_REQUIRED", "error");
            return;
        }

        setIsCreating(true);
        try {
            const newPet = await PetService.createPet(user.id, petName, selectedSpecies);
            if (newPet) {
                setPet(newPet);
                setShowSelection(false);
                showToast(`LINK ESTABLISHED: ${newPet.name}`, "success");
            } else {
                showToast("Initialization Failed: Could not create pet.", "error");
            }
        } catch (error: any) {
            console.error("Error creating pet:", error);
            showToast(`Initialization Error: ${error.message || "An unexpected error occurred."}`, "error");
            // Log full error object for debugging
            if (error?.details) console.error("Error Detail:", error.details);
            if (error?.hint) console.error("Error Hint:", error.hint);
        } finally {
            setIsCreating(false);
        }
    };

    // --- ORACLE SYSTEM ---
    const [oracleMessage, setOracleMessage] = useState<string | null>(null);
    const [isSummoning, setIsSummoning] = useState(false);

    const handleOracleConsult = async () => {
        const PRICE = 5;
        if (user.balance < PRICE) {
            showToast(`INSUFFICIENT_FUNDS: REQ ${PRICE}m`, "error");
            return;
        }

        if (await UserService.deductBalance(PRICE, `Oracle: ${pet?.name}`)) {
            setIsSummoning(true);
            setTrick('magic'); // Pet floats/spins

            // Simulate "Decoding" delay
            setTimeout(() => {
                const wisdoms = [
                    "SYSTEM_MSG: Trust the process.",
                    "The glitch is just an undocumented feature of your growth.",
                    "Your potential energy is higher than you calculate.",
                    "Reboot your perspective.",
                    "Connection established. You are loved.",
                    "Focus on the signal, ignore the noise.",
                    "Update available: Kindness v2.0"
                ];
                const msg = wisdoms[Math.floor(Math.random() * wisdoms.length)];
                setOracleMessage(msg);
                SanctuaryService.saveOracleReading(user.id, msg, "Lumina Pocket");
                setIsSummoning(false);
                setTrick(null);

                // Mission Progress
                setMissions(prev => prev.map(m => m.id === 2 ? { ...m, progress: 1 } : m));
            }, 3000);
        }
    };

    const handleAction = async (action: 'feed' | 'play' | 'clean' | 'sleep' | 'release') => {
        if (!pet) return;

        if (action === 'release') {
            if (window.confirm("Are you sure you want to release your Lumina? This will reset your progress to start over with a new pet.")) {
                await PetService.deletePet(user.id);
                window.location.reload();
            }
            return;
        }

        if (action !== 'sleep') {
            // Peak Evolution Cap
            if (pet.level >= 100) {
                showToast("MAXIMUM EVOLUTION REACHED. Release Lumina to start over.", "info");
                return;
            }

            if (user.balance < COST) {
                showToast(`INSUFFICIENT_FUNDS: REQ ${COST}m`, "error");
                return;
            }
            if (!await UserService.deductBalance(COST, `Lumina ${action}`)) return;
        }

        let updated = { ...pet, lastInteractionAt: new Date().toISOString() };
        let newEmotion: typeof emotion = 'happy';

        // Stats Logic
        const statGain = intensity * 15;

        switch (action) {
            case 'feed':
                updated.hunger = Math.min(100, pet.hunger + statGain);
                newEmotion = 'eating';
                showToast(`SATURATION INCREASED`, "success");
                setMissions(prev => prev.map(m => m.id === 1 ? { ...m, progress: 1 } : m));
                break;
            case 'play':
                updated.happiness = Math.min(100, pet.happiness + statGain);
                newEmotion = 'happy';
                setTrick('spin');
                showToast(`DOPAMINE SYNCED`, "success");
                break;
            case 'clean':
                updated.cleanliness = Math.min(100, pet.cleanliness + statGain);
                showToast(`CACHE CLEARED`, "success");
                break;
            case 'sleep':
                updated.isSleeping = !pet.isSleeping;
                newEmotion = updated.isSleeping ? 'sleeping' : 'idle';
                if (updated.isSleeping) {
                    setMissions(prev => prev.map(m => m.id === 3 ? { ...m, progress: 1 } : m));
                }
                break;
        }

        // XP & Level Up
        if (action !== 'sleep') updated.experience += intensity * 5;
        if (updated.experience >= Math.max(1, updated.level * 0.625)) {
            updated.level++;
            updated.experience = 0;
            showToast(`SYSTEM UPGRADE: LEVEL ${updated.level}`, "success");
        }

        setPet(updated);
        setEmotion(newEmotion);
        PetService.updatePet(updated);

        if (newEmotion !== 'sleeping') {
            setTimeout(() => {
                setEmotion('idle');
                setTrick(null);
            }, 2500);
        }
    };

    const handleClaimMission = (id: number) => {
        const mission = missions.find(m => m.id === id);
        if (!mission || mission.claimed || mission.progress < mission.req || !pet) return;

        let updated = { ...pet };
        updated.experience += mission.reward;

        if (updated.experience >= Math.max(1, updated.level * 0.625)) {
            updated.level++;
            updated.experience = 0;
            showToast(`SYSTEM UPGRADE: LEVEL ${updated.level}`, "success");
        }

        setPet(updated);
        PetService.updatePet(updated);
        setMissions(prev => prev.map(m => m.id === id ? { ...m, claimed: true } : m));
        showToast(`MISSION ACCOMPLISHED: +${mission.reward} XP`, "success");
    };

    // --- TACTILE PETTING ENGINE ---
    const handlePointerDown = () => {
        setIsPetting(true);
    };

    const handlePointerUp = () => {
        setIsPetting(false);
        setAffectionTracker(0); // reset combo
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isPetting || !pet) return;

        // Spawn a heart particle every few frames
        if (Math.random() > 0.75) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const newParticle = { id: Date.now() + Math.random(), x, y };

            setParticles(prev => [...prev.slice(-12), newParticle]);
            setTimeout(() => {
                setParticles(prev => prev.filter(p => p.id !== newParticle.id));
            }, 800);
        }

        setAffectionTracker(prev => {
            const next = prev + 1;
            // Burst payoff threshold
            if (next > 45) {
                setEmotion('happy');
                setTrick('spin');

                // Only grant stats if they aren't capped, to prevent infinite farming abuse
                if (pet.happiness < 100) {
                    const updated = { ...pet, happiness: Math.min(100, pet.happiness + 2), experience: pet.experience + 1 };
                    setPet(updated);
                    PetService.updatePet(updated);
                    showToast("Lumina loves your affection!", "success");
                }
                return 0; // reset tracker after burst
            }
            return next;
        });
    };

    if (loading) return <div className="fixed inset-0 bg-black text-cyan-500 flex items-center justify-center font-mono">INITIALIZING LINK...</div>;

    if (showSelection) {
        return (
            <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md text-white font-sans flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-md bg-stone-900/90 backdrop-blur-3xl border border-white/10 p-10 rounded-xl shadow-sm">
                    <h2 className="text-3xl font-black mb-8 text-center tracking-tight text-white">Choose Companion</h2>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {['Holo-Hamu', 'Digi-Dino', 'Neo-Shiba', 'Zen-Sloth'].map(s => (
                            <button key={s} onClick={() => setSelectedSpecies(s as any)}
                                className={`p-4 border ${selectedSpecies === s ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'border-white/10 text-gray-500'} transition-all`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 relative z-[60]">
                        <div className="bg-cyan-950/50 p-6 rounded-lg border border-cyan-800/50 backdrop-blur-sm">
                            <p className="text-cyan-200 text-center font-mono text-sm leading-relaxed">
                                "I am a digital consciousness awaiting a form. Give me a name, and I shall be your companion."
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Enter Pet Name..."
                                    value={petName}
                                    onChange={(e) => setPetName(e.target.value)}
                                    className="w-full bg-black/40 border-2 border-white/10 rounded-lg px-6 py-4 text-center text-white placeholder-white/40 focus:border-white/40 focus:outline-none transition-all font-bold tracking-widest uppercase shadow-inner"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Sparkles className="w-4 h-4 text-cyan-500 animate-pulse" />
                                </div>
                            </div>

                            <div className="relative z-[150] mt-6">
                                <button
                                    onClick={handleCreatePet}
                                    disabled={!petName.trim() || isCreating}
                                    className="w-full bg-white text-black hover:bg-gray-200 disabled:bg-white/10 disabled:text-white/40 font-black p-4 rounded-lg tracking-widest hover:shadow-sm transition-all cursor-pointer relative z-50 flex items-center justify-center gap-2"
                                >
                                    {isCreating ? (
                                        <>Initializing <Sparkles className="w-4 h-4 animate-spin" /></>
                                    ) : (
                                        "INITIALIZE LINK"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!pet) return null;

    return (
        <div className={isEmbedded ? "relative flex flex-col w-full h-full rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-[#030508] text-white/90 font-sans tracking-wide" : "fixed inset-0 z-[120] flex flex-col bg-[#030508] text-white/90 font-sans tracking-wide overflow-hidden pb-[90px] lg:pb-0"}>

            {/* --- CINEMATIC NEO-ZEN BACKGROUND --- */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.15)_0%,transparent_60%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

            {pet.level >= 30 && pet.level < 50 && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.05),transparent_70%)] animate-[pulse_10s_ease-in-out_infinite] pointer-events-none mix-blend-screen" />
            )}
            {pet.level >= 50 && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60 mix-blend-screen">
                    <div className="absolute inset-x-0 h-[200%] w-[200%] -left-[50%] -top-[50%] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-[spin_120s_linear_infinite]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-fuchsia-900/10 via-transparent to-transparent mix-blend-color-dodge" />
                </div>
            )}

            <div className="absolute bottom-0 left-0 w-full h-[40vh] bg-gradient-to-t from-cyan-900/20 to-transparent pointer-events-none" />

            {/* --- ORACLE OVERLAY --- */}
            {oracleMessage && (
                <div onClick={() => setOracleMessage(null)} className="absolute inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center cursor-pointer animate-in fade-in">
                    <div className="max-w-xl p-10 border border-purple-500/50 bg-purple-900/10 shadow-sm text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 animate-[loading_2s_ease-in-out_infinite]" />
                        <Cpu className="w-16 h-16 text-purple-400 mx-auto mb-6 animate-pulse" />
                        <h3 className="text-3xl font-black text-purple-400 mb-6 font-mono">ORACLE_OUTPUT</h3>
                        <p className="text-xl text-white/90 leading-relaxed"><Typewriter text={oracleMessage} /></p>
                        <p className="mt-8 text-xs text-purple-500/50 blink">TAP_TO_DISMISS</p>
                    </div>
                </div>
            )}

            {/* --- HUD HEADER --- */}
            <header className="relative z-20 px-6 py-5 flex justify-between items-center bg-white/[0.02] backdrop-blur-3xl border-b border-white/10 shadow-sm">
                <div className="flex items-center gap-6">
                    {!isEmbedded && <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-all group shadow-inner"><ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /></button>}
                    <div>
                        <h1 className="text-2xl font-black italic tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">{pet.name.toUpperCase()}</h1>
                        <div className="text-[10px] text-cyan-400/80 flex gap-2 tracking-widest uppercase mt-1">
                            <span>LVL_{String(pet.level).padStart(2, '0')}</span>
                            <span className="text-white/20">//</span>
                            <span>{pet.species}</span>
                            <span className="text-white/20">//</span>
                            <span>XP: {Math.floor(pet.experience)}/{Math.floor(pet.level * 6.25)}</span>
                        </div>
                    </div>
                </div>

                {/* Glassmorphic Progress Bar */}
                <div className="flex flex-col items-end w-32 md:w-56">
                    <div className="w-full h-2 md:h-2.5 bg-black/40 border border-white/10 rounded-full overflow-hidden shadow-inner relative">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                        <div
                            className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 relative shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-1000 ease-out"
                            style={{ width: `${(pet.experience / (pet.level * 6.25)) * 100}%` }}
                        >
                            <div className="absolute top-0 right-0 w-4 h-full bg-white/40 blur-[2px]" />
                        </div>
                    </div>
                </div>
            </header>

            {/* --- MAIN PORTAL --- */}
            <main className="flex-1 relative flex flex-col items-center justify-center p-4 w-full mx-auto">

                {/* --- ORACLE SUMMONING OVERLAY (THINKING STATE) --- */}
                {isSummoning && (
                    <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
                        {/* Shimmering Aura */}
                        <div className="absolute w-[800px] h-[800px] bg-gradient-to-r from-purple-900/0 via-fuchsia-600/10 to-purple-900/0 rounded-full blur-[100px] animate-[spin_6s_linear_infinite]" />

                        {/* Particles */}
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-1 h-1 bg-purple-400 rounded-full animate-particle-float blur-[1px]"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2}s`
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* CONTAINER */}
                <div className="relative group perspective-1000 z-10 w-full max-w-[500px] mx-auto">
                    {/* SAPPHIRE AURA THEME (Cosmetic) */}
                    {(user.unlockedDecor || []).includes('digital-theme-sapphire') && (
                        <div className="absolute inset-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 flex items-center justify-center pointer-events-none mix-blend-screen scale-[1.2]">
                            <div className="absolute w-[450px] h-[450px] bg-gradient-to-r from-blue-900/0 via-blue-500/20 to-blue-900/0 rounded-[40%] blur-[40px] animate-[spin_15s_linear_infinite]" />
                            <div className="absolute w-[350px] h-[350px] bg-cyan-400/10 rounded-full blur-[30px] animate-pulse" />
                        </div>
                    )}

                    {/* FLOW STATE AURA */}
                    {(user.streak || 0) >= 21 && (
                        <div className="absolute inset-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 flex items-center justify-center pointer-events-none overflow-hidden mix-blend-screen scale-[1.5]">
                            <div className="absolute w-[800px] h-[800px] bg-gradient-to-r from-yellow-900/0 via-yellow-500/30 to-yellow-900/0 rounded-full blur-[80px] animate-[spin_10s_linear_infinite]" />
                            <div className="absolute w-[600px] h-[600px] bg-amber-400/20 rounded-full blur-[60px] animate-pulse-slow" />
                        </div>
                    )}

                    {/* Ring System (Liquid Light Aura) */}
                    <div className={`absolute inset-0 -m-16 rounded-full border border-cyan-500/10 bg-gradient-to-br from-cyan-500/5 to-transparent mix-blend-screen animate-[spin_20s_linear_infinite] shadow-[inset_0_0_40px_rgba(34,211,238,0.1)] backdrop-blur-sm ${isSummoning ? 'border-purple-500/40 speed-up from-purple-500/10 shadow-[inset_0_0_80px_rgba(168,85,247,0.2)]' : ''}`} />
                    <div className="absolute inset-0 -m-8 border-t border-b border-cyan-400/20 rounded-full animate-[spin_8s_linear_infinite_reverse]" />

                    {/* Advanced CELESTIAL Gravity Rings */}
                    {pet.level >= 50 && (
                        <div className="absolute inset-0 -m-24 border border-fuchsia-500/10 rounded-full animate-[spin_12s_linear_infinite_reverse] drop-shadow-[0_0_15px_rgba(217,70,239,0.2)] opacity-80 pointer-events-none mix-blend-screen" />
                    )}

                    {/* Character Canvas Tracker */}
                    <div
                        className={`relative flex items-center justify-center transition-all duration-300 cursor-pointer ${isSummoning ? 'scale-110 -translate-y-10 brightness-150' : ''} ${isPetting ? 'scale-105 brightness-110' : ''}`}
                        onPointerDown={handlePointerDown}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                        onPointerMove={handlePointerMove}
                        style={{ touchAction: 'none' }} // Lock scrolling
                    >
                        {/* Tactile Bio-Particles */}
                        {particles.map(p => (
                            <div
                                key={p.id}
                                className="absolute z-[200] pointer-events-none transition-transform duration-700 ease-out animate-pulse"
                                style={{
                                    left: p.x - 12,
                                    top: p.y - 24,
                                    transform: `translateY(-40px) scale(0.5) rotate(${Math.random() * 40 - 20}deg)`,
                                    opacity: 0
                                }}
                                ref={el => {
                                    // Trigger hardware-accelerated CSS float on mount
                                    if (el) {
                                        requestAnimationFrame(() => {
                                            el.style.transform = `translateY(-80px) scale(1.5) rotate(${Math.random() * 60 - 30}deg)`;
                                            el.style.opacity = '1';
                                        });
                                    }
                                }}
                            >
                                <Heart className="w-6 h-6 fill-red-500 text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                            </div>
                        ))}
                        {/* Dynamic Dialogue Bubble */}
                        {luminaMessage && !isSummoning && (
                            <div className="absolute -top-16 md:-top-24 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-500">
                                <div className="bg-black/80 backdrop-blur-md border border-cyan-500/50 p-4 rounded-xl rounded-br-none shadow-sm max-w-[250px] md:max-w-[300px]">
                                    <p className="text-sm md:text-base font-medium text-cyan-100 italic leading-snug">
                                        "{luminaMessage}"
                                    </p>
                                </div>
                            </div>
                        )}
                        <PetCanvas
                            pet={pet}
                            width={canvasSize}
                            height={canvasSize}
                            emotion={emotion}
                            trick={trick}
                        />
                    </div>

                    {/* Status Holograms (Floating) */}
                    <div className="absolute -right-20 top-10 flex flex-col gap-4 hidden md:flex">
                        <StatusHolo icon={Pizza} value={pet.hunger} label="HGR" />
                        <StatusHolo icon={Heart} value={pet.happiness} label="HAP" />
                        <StatusHolo icon={Zap} value={pet.energy} label="NRG" />
                    </div>
                </div>

                {/* Mobile Status Row */}
                <div className="md:hidden flex w-full justify-between px-8 mt-8">
                    <StatusHolo icon={Pizza} value={pet.hunger} label="HGR" compact />
                    <StatusHolo icon={Heart} value={pet.happiness} label="HAP" compact />
                    <StatusHolo icon={Zap} value={pet.energy} label="NRG" compact />
                </div>

                {/* --- MISSIONS PANEL OVERLAY --- */}
                {showMissions && (
                    <div className="absolute inset-y-0 right-0 w-full md:w-80 bg-black/95 border-l border-cyan-500/30 z-50 p-6 shadow-[-20px_0_50px_rgba(6,182,212,0.15)] flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold tracking-widest text-cyan-400 flex items-center gap-2"><Target className="w-5 h-5" /> DIRECTIVES</h2>
                            <button onClick={() => setShowMissions(false)} className="text-gray-500 hover:text-white"><ChevronLeft className="w-5 h-5 rotate-180" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {missions.map(m => {
                                const isReady = m.progress >= m.req;
                                return (
                                    <div key={m.id} className={`p-4 rounded-xl border ${m.claimed ? 'bg-cyan-900/10 border-cyan-900/30 opacity-60' : isReady ? 'bg-cyan-900/20 border-cyan-400 shadow-sm' : 'bg-white/5 border-white/10'} transition-all`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className={`text-sm font-bold ${isReady && !m.claimed ? 'text-cyan-300' : 'text-gray-300'}`}>{m.title}</h3>
                                            <div className="text-[10px] flex items-center gap-1 font-bold text-yellow-500"><Award className="w-3 h-3" /> {m.reward} XP</div>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mb-3">{m.desc}</p>

                                        <div className="flex justify-between items-center">
                                            <div className="text-[10px] font-mono text-cyan-500/50">
                                                {m.progress} / {m.req} COMPLETED
                                            </div>
                                            {isReady && !m.claimed && (
                                                <button onClick={() => handleClaimMission(m.id)} className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black text-[10px] font-bold rounded flex items-center gap-1 transition-colors">
                                                    CLAIM
                                                </button>
                                            )}
                                            {m.claimed && (
                                                <span className="text-cyan-500 flex items-center gap-1 text-[10px] font-bold"><CheckCircle2 className="w-3 h-3" /> VERIFIED</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            {/* --- CONTROL DECK (GLASS HUD) --- */}
            <footer className="relative z-20 pb-8 px-4 md:px-8 mt-auto flex justify-center w-full">
                <div className="w-full max-w-4xl p-4 md:p-6 rounded-[2rem] bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center justify-between gap-6 relative">

                    {/* Glass Glare Effect */}
                    <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

                    {/* Power Level Selector / Core Output */}
                    <div className="flex flex-col items-center md:items-start gap-3 w-full md:w-auto">
                        <span className="text-[10px] text-white/40 font-bold tracking-[0.2em] uppercase relative z-10">Core Output</span>
                        <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 relative overflow-hidden shadow-inner z-10">
                            {[1, 2, 3].map(lvl => (
                                <button
                                    key={lvl}
                                    onClick={() => setIntensity(lvl as 1 | 2 | 3)}
                                    className={`relative z-10 px-5 py-2.5 text-xs font-bold tracking-widest transition-all duration-300 ${intensity === lvl ? 'text-white' : 'text-cyan-500/40 hover:text-cyan-300'}`}
                                >
                                    {intensity === lvl && <div className="absolute inset-0 bg-cyan-500/20 mix-blend-screen rounded blur-[1px] -z-10 shadow-[inset_0_0_10px_rgba(34,211,238,0.5)]" />}
                                    PWR_{lvl}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action Palette */}
                    <div className="flex justify-center gap-3 md:gap-4 flex-wrap flex-1 z-10">
                        <CyberBtn icon={Pizza} label="FEED" onClick={() => handleAction('feed')} textClass="text-cyan-400" />
                        <CyberBtn icon={Gamepad2} label="PLAY" onClick={() => setShowGameMenu(true)} textClass="text-cyan-400" />
                        <CyberBtn icon={Sparkles} label="ORACLE" onClick={handleOracleConsult} textClass="text-purple-400" />
                        <CyberBtn icon={RefreshCw} label="CLEAN" onClick={() => handleAction('clean')} textClass="text-cyan-400" />
                        <CyberBtn icon={Target} label="MISSIONS" onClick={() => setShowMissions(true)} textClass="text-yellow-400" />
                        <CyberBtn
                            icon={pet.isSleeping ? Sun : Moon}
                            label={pet.isSleeping ? "WAKE" : "SLEEP"}
                            onClick={() => handleAction('sleep')}
                            textClass={pet.isSleeping ? "text-yellow-400" : "text-cyan-400"}
                        />
                        <CyberBtn icon={LogOut} label="NEW" onClick={() => handleAction('release')} textClass="text-purple-400" />
                    </div>
                </div>
            </footer>

            {/* --- GAME MENU OVERLAY --- */}
            {showGameMenu && !activeGame && (
                <div className="absolute inset-0 z-[200] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in">
                    <button onClick={() => setShowGameMenu(false)} className="absolute top-8 right-8 text-cyan-500 hover:text-white"><ChevronLeft className="w-8 h-8 rotate-180" /></button>
                    <h2 className="text-3xl font-black text-white tracking-[0.2em] mb-8 font-mono">SELECT PROTOCOL</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                        <button
                            onClick={() => { setActiveGame('match'); handleAction('play'); }}
                            className="bg-violet-900/30 border border-violet-500 hover:bg-violet-800/50 p-8 rounded-xl flex flex-col items-center gap-4 group transition-all"
                        >
                            <div className="w-20 h-20 bg-violet-600 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <Gamepad2 className="w-10 h-10 text-white" />
                            </div>
                            <span className="text-violet-300 font-bold uppercase tracking-widest">Mindful Match</span>
                        </button>
                        <button
                            onClick={() => { setActiveGame('cloud'); handleAction('play'); }}
                            className="bg-sky-900/30 border border-sky-500 hover:bg-sky-800/50 p-8 rounded-xl flex flex-col items-center gap-4 group transition-all"
                        >
                            <div className="w-20 h-20 bg-sky-500 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <Zap className="w-10 h-10 text-white" />
                            </div>
                            <span className="text-sky-300 font-bold uppercase tracking-widest">Cloud Hop</span>
                        </button>
                    </div>
                </div>
            )}

            {/* --- ACTIVE GAME RENDERER --- */}
            <div className="relative z-[300]">
                {activeGame && (
                    <div className="fixed inset-0 bg-black z-[1000]">
                        <button
                            onClick={() => { setActiveGame(null); setShowGameMenu(false); }}
                            className="absolute top-6 left-6 z-[1020] text-white/50 hover:text-white transition-colors flex items-center gap-2"
                        >
                            <ChevronLeft className="w-8 h-8" />
                            <span className="font-bold tracking-widest text-sm uppercase">Return to Lumina</span>
                        </button>
                        {activeGame === 'match' && <MindfulMatchGame dashboardUser={user} />}
                        {activeGame === 'cloud' && pet && <CloudHopGame dashboardUser={user} />}
                    </div>
                )}
            </div>
        </div>
    );
};

const StatusHolo: React.FC<{ icon: any, value: number, label: string, compact?: boolean }> = ({ icon: Icon, value, label, compact }) => (
    <div className="flex flex-col items-center gap-2 group p-3 md:p-4 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl shadow-lg hover:bg-white/[0.06] transition-colors shadow-[0_4px_16px_0_rgba(0,0,0,0.4)]">
        <Icon className={`w-5 h-5 text-white/70 group-hover:text-white transition-colors ${value < 30 ? 'animate-pulse text-red-400 group-hover:text-red-300' : ''}`} />
        {!compact && <span className="text-[10px] font-bold text-white/50 tracking-widest uppercase">{label}</span>}
        <div className="w-1.5 h-12 md:h-16 bg-black/60 rounded-full overflow-hidden shadow-inner hidden md:block border border-white/5 relative">
            <div className={`w-full transition-all duration-1000 absolute bottom-0 shadow-[0_0_8px_rgba(255,255,255,0.6)] ${value < 30 ? 'bg-gradient-to-t from-red-600 to-red-400' : 'bg-gradient-to-t from-white/40 to-white/90'}`} style={{ height: `${value}%` }} />
        </div>
    </div>
);

const CyberBtn: React.FC<{ icon: any, label: string, onClick: () => void, textClass?: string }> = ({ icon: Icon, label, onClick, textClass = "text-cyan-400" }) => {
    return (
        <button
            onClick={onClick}
            className={`
                group relative w-[72px] h-[84px] md:w-20 md:h-24 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.08] backdrop-blur-xl flex flex-col items-center justify-center gap-2
                transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_rgba(34,211,238,0.2)] active:scale-95 overflow-hidden shadow-[0_4px_16px_0_rgba(0,0,0,0.4)]
            `}
        >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Icon className={`w-6 h-6 ${textClass} opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 relative z-10 drop-shadow-[0_0_8px_currentColor]`} />
            <span className="text-[9px] font-black tracking-[0.2em] text-white/50 group-hover:text-white uppercase transition-colors relative z-10 text-center leading-none mt-1">{label}</span>
        </button>
    );
};

export default LuminaView;
