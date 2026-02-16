import React, { useState, useEffect } from 'react';
import {
    Heart, Pizza, Moon, Sun,
    Sparkles, Zap, ChevronLeft,
    Gamepad2, RefreshCw, Cpu
} from 'lucide-react';
import { User, Lumina } from '../../types';
import { PetService } from '../../services/petService';
import PetCanvas from './PetCanvas';
import { useToast } from '../common/Toast';
import { UserService } from '../../services/userService';

interface LuminaViewProps {
    user: User;
    onClose: () => void;
}

const LuminaView: React.FC<LuminaViewProps> = ({ user, onClose }) => {
    const [pet, setPet] = useState<Lumina | null>(null);
    const [emotion, setEmotion] = useState<'idle' | 'happy' | 'hungry' | 'sleeping' | 'sad' | 'eating'>('idle');
    const [loading, setLoading] = useState(true);
    const [showSelection, setShowSelection] = useState(false);
    const [selectedSpecies, setSelectedSpecies] = useState<'Holo-Hamu' | 'Digi-Dino' | 'Neo-Shiba' | 'Zen-Sloth'>('Holo-Hamu');
    const [petName, setPetName] = useState('');
    const [intensity, setIntensity] = useState<1 | 2 | 3>(1); // 1m, 2m, 3m
    const [trick, setTrick] = useState<'spin' | 'magic' | null>(null);
    const [canvasSize, setCanvasSize] = useState(500);
    const [isCreating, setIsCreating] = useState(false);

    const { showToast } = useToast();
    const COST = intensity;

    // Resize Handler
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const size = width < 768 ? Math.min(width - 32, 360) : 500;
            setCanvasSize(size);
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
                setIsSummoning(false);
                setTrick(null);
            }, 3000);
        }
    };

    const handleAction = async (action: 'feed' | 'play' | 'clean' | 'sleep') => {
        if (!pet || (pet.isSleeping && action !== 'sleep')) return;
        if (action !== 'sleep' && user.balance < COST) {
            showToast(`INSUFFICIENT_FUNDS: REQ ${COST}m`, "error");
            return;
        }

        if (action !== 'sleep' && !await UserService.deductBalance(COST, `Lumina ${action}`)) return;

        let updated = { ...pet };
        let newEmotion: typeof emotion = 'happy';

        // Stats Logic
        const statGain = intensity * 15;

        switch (action) {
            case 'feed':
                updated.hunger = Math.min(100, pet.hunger + statGain);
                newEmotion = 'eating';
                showToast(`SATURATION INCREASED`, "success");
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
                break;
        }

        // XP & Level Up
        if (action !== 'sleep') updated.experience += intensity * 5;
        if (updated.experience >= updated.level * 100) {
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

    if (loading) return <div className="fixed inset-0 bg-black text-cyan-500 flex items-center justify-center font-mono">INITIALIZING LINK...</div>;

    if (showSelection) {
        return (
            <div className="fixed inset-0 z-[120] bg-gray-950 text-cyan-400 font-mono flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-md bg-black/80 border border-cyan-500/30 p-8 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.2)]">
                    <h2 className="text-2xl font-bold mb-8 text-center tracking-[0.2em] animate-pulse">CHOOSE COMPANION</h2>

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
                        <div className="bg-cyan-950/50 p-6 rounded-2xl border border-cyan-800/50 backdrop-blur-sm">
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
                                    className="w-full bg-black/50 border-2 border-cyan-700/50 rounded-xl px-4 py-3 text-center text-cyan-100 placeholder-cyan-700/50 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 transition-all font-bold tracking-widest uppercase"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Sparkles className="w-4 h-4 text-cyan-500 animate-pulse" />
                                </div>
                            </div>

                            <div className="relative z-[150]">
                                <button
                                    onClick={handleCreatePet}
                                    disabled={!petName.trim() || isCreating}
                                    className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-900 disabled:text-cyan-700 text-black font-bold p-4 rounded-xl tracking-widest hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all cursor-pointer relative z-50 flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 z-[120] bg-[#050505] text-cyan-500 font-mono tracking-wider overflow-hidden">

            {/* --- CYBER BACKGROUND --- */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/10 via-transparent to-transparent pointer-events-none" />

            {/* --- ORACLE OVERLAY --- */}
            {oracleMessage && (
                <div onClick={() => setOracleMessage(null)} className="absolute inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center cursor-pointer animate-in fade-in">
                    <div className="max-w-xl p-10 border border-purple-500/50 bg-purple-900/10 shadow-[0_0_100px_rgba(168,85,247,0.2)] text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 animate-[loading_2s_ease-in-out_infinite]" />
                        <Cpu className="w-16 h-16 text-purple-400 mx-auto mb-6 animate-pulse" />
                        <h3 className="text-3xl font-black text-purple-400 mb-6 font-mono">ORACLE_OUTPUT</h3>
                        <p className="text-xl text-white/90 leading-relaxed type-writer-effect">"{oracleMessage}"</p>
                        <p className="mt-8 text-xs text-purple-500/50 blink">TAP_TO_DISMISS</p>
                    </div>
                </div>
            )}

            {/* --- HUD HEADER --- */}
            <header className="relative z-10 px-6 py-4 flex justify-between items-end border-b border-cyan-500/20 bg-black/40 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="hover:text-white transition-colors"><ChevronLeft /></button>
                    <div>
                        <h1 className="text-2xl font-black italic transform -skew-x-12">{pet.name.toUpperCase()}</h1>
                        <div className="text-[10px] text-cyan-500/60 flex gap-2">
                            <span>LVL_0{pet.level}</span>
                            <span>//</span>
                            <span>{pet.species.toUpperCase()}</span>
                        </div>
                    </div>
                </div>

                {/* Visualizer Bars */}
                <div className="flex gap-1 items-end h-8">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-1 bg-cyan-500/40 animate-[bounce_${0.5 + i * 0.1}s_infinite]`} style={{ height: `${20 + Math.random() * 80}%` }} />
                    ))}
                </div>
            </header>

            {/* --- MAIN PORTAL --- */}
            <main className="flex-1 relative flex flex-col items-center justify-center p-4">

                {/* CONTAINER */}
                <div className="relative group perspective-1000">

                    {/* Ring System */}
                    <div className={`absolute inset-0 -m-12 border border-cyan-500/20 rounded-full animate-[spin_20s_linear_infinite] ${isSummoning ? 'border-purple-500/40 speed-up' : ''}`} />
                    <div className="absolute inset-0 -m-6 border-t border-b border-cyan-400/40 rounded-full animate-[spin_5s_linear_infinite_reverse]" />

                    {/* Character Canvas */}
                    <div className={`relative transition-all duration-1000 ${isSummoning ? 'scale-110 -translate-y-10 brightness-150' : ''}`}>
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

            </main>

            {/* --- CONTROL DECK --- */}
            <footer className="relative z-20 bg-black/80 border-t border-cyan-500/20 p-6">

                {/* Power Level Selector */}
                <div className="flex justify-center mb-6">
                    <div className="flex bg-black border border-cyan-500/30 rounded p-1">
                        {[1, 2, 3].map(lvl => (
                            <button
                                key={lvl}
                                onClick={() => setIntensity(lvl as 1 | 2 | 3)}
                                className={`px-4 py-1 text-xs font-bold ${intensity === lvl ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'text-cyan-500/40 hover:text-cyan-400'}`}
                            >
                                PWR_{lvl}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-4 flex-wrap">
                    <CyberBtn icon={Pizza} label="FEED" onClick={() => handleAction('feed')} />
                    <CyberBtn icon={Gamepad2} label="PLAY" onClick={() => handleAction('play')} />
                    <CyberBtn icon={Sparkles} label="ORACLE" onClick={handleOracleConsult} color="purple" />
                    <CyberBtn icon={RefreshCw} label="CLEAN" onClick={() => handleAction('clean')} />
                    <CyberBtn
                        icon={pet.isSleeping ? Sun : Moon}
                        label={pet.isSleeping ? "WAKE" : "SLEEP"}
                        onClick={() => handleAction('sleep')}
                        color={pet.isSleeping ? "yellow" : "cyan"}
                    />
                </div>
            </footer>
        </div>
    );
};

const StatusHolo: React.FC<{ icon: any, value: number, label: string, compact?: boolean }> = ({ icon: Icon, value, label, compact }) => (
    <div className="flex flex-col items-center gap-1 group">
        <div className="relative">
            <Icon className={`w-5 h-5 text-cyan-400 ${value < 30 ? 'animate-pulse text-red-500' : ''}`} />
            <div className="absolute inset-0 blur-sm bg-cyan-400/20" />
        </div>
        {!compact && <span className="text-[9px] font-bold text-cyan-500/70">{label}</span>}
        <div className="w-1 h-8 bg-gray-900 rounded-full overflow-hidden mt-1">
            <div className={`w-full bg-cyan-400 transition-all duration-1000`} style={{ height: `${value}%`, marginTop: `${100 - value}%` }} />
        </div>
    </div>
);

const CyberBtn: React.FC<{ icon: any, label: string, onClick: () => void, color?: string }> = ({ icon: Icon, label, onClick, color = "cyan" }) => {
    const colorClass = color === "purple" ? "text-purple-400 border-purple-500/50 hover:bg-purple-900/20" :
        color === "yellow" ? "text-yellow-400 border-yellow-500/50 hover:bg-yellow-900/20" :
            "text-cyan-400 border-cyan-500/50 hover:bg-cyan-900/20";
    return (
        <button
            onClick={onClick}
            className={`
                group relative px-6 py-4 border ${colorClass} 
                clip-path-polygon flex flex-col items-center gap-2
                transition-all active:scale-95 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]
            `}
        >
            <Icon className="w-6 h-6" />
            <span className="text-[10px] font-bold tracking-[0.2em]">{label}</span>
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-current opacity-50" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-current opacity-50" />
        </button>
    );
};

export default LuminaView;
