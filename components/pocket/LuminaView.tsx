import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, Zap, Heart, Pizza, Gamepad2, Sparkles, Bath, Moon, Sun, Save, RefreshCw } from 'lucide-react';
import { PetService } from '../../services/petService';
import { Lumina } from '../../types';
import { UserService } from '../../services/userService';
import { PetCanvas } from './PetCanvas';
import { useToast } from '../common/Toast';

interface LuminaViewProps {
    user: any;
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

    // VISUAL FX STATE
    const [shake, setShake] = useState(false);
    const [flash, setFlash] = useState(false);

    // Dynamic canvas sizing for responsive pet
    const [canvasSize, setCanvasSize] = useState(500);
    const [isProcessing, setIsProcessing] = useState(false);

    // Responsive Canvas Listener
    useEffect(() => {
        const handleResize = () => {
            // Dynamic sizing based on available width/height ratio to prevent "square" skewing
            const width = window.innerWidth;
            const size = width < 768 ? Math.min(width - 32, 360) : 500;
            setCanvasSize(size);
        };
        handleResize(); // Init
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const { showToast } = useToast();
    const COST = intensity; // 1m, 2m, or 3m

    useEffect(() => {
        loadPet();
    }, []);

    const loadPet = async () => {
        const data = await PetService.getPet(user.id);
        if (data) {
            setPet(data);
            if (data.isSleeping) setEmotion('sleeping');
        } else {
            setShowSelection(true);
        }
        setLoading(false);
    };

    const triggerImpact = () => {
        setShake(true);
        setFlash(true);
        setTimeout(() => setShake(false), 500);
        setTimeout(() => setFlash(false), 150);
    };

    const handleCreatePet = async () => {
        if (!petName.trim()) {
            showToast("Please give your friend a name!", "error");
            return;
        }

        // @ts-ignore
        const newPet = await PetService.createPet(user.id, selectedSpecies as any, petName);
        if (newPet) {
            setPet(newPet);
            setShowSelection(false);
            triggerImpact();
            showToast(`Welcome, ${newPet.name}! (+50 XP)`, "success");
        }
    };

    // ORACLE STATE
    const [oracleMessage, setOracleMessage] = useState<string | null>(null);

    const handleOracleConsult = async () => {
        if (isProcessing) return;
        const PRICE = 5;

        if (user.balance < PRICE) {
            showToast(`The Oracle requires ${PRICE}m offering.`, "error");
            return;
        }

        setIsProcessing(true);
        try {
            if (await UserService.deductBalance(PRICE, `Oracle: ${pet?.name}`)) {
                // Trigger Magic Animation
                setTrick('magic');
                triggerImpact();

                // Generate Wisdom (Mock for now, could be AI)
                const wisdoms = [
                    "The stars align for your success today.",
                    "Patience is not simply the ability to wait - it's how we behave while we're waiting.",
                    "Your inner garden is blooming, even if you cannot see the roots yet.",
                    "A friend will reach out to you soon.",
                    "Focus on the present moment; the future will take care of itself.",
                    "You are stronger than you think.",
                    "Breathe. Just breathe."
                ];
                const msg = wisdoms[Math.floor(Math.random() * wisdoms.length)];

                setTimeout(() => {
                    setOracleMessage(msg);
                    showToast("The Oracle has spoken (-5m)", "success");
                }, 1500); // Wait for spin up
            }
        } finally {
            setTimeout(() => setIsProcessing(false), 1500);
        }
    };

    const handleAction = async (action: 'feed' | 'play' | 'clean' | 'sleep') => {
        if (isProcessing) return;
        // ... (existing checks)
        if (!pet || (pet.isSleeping && action !== 'sleep')) return;

        // Check if user has enough balance
        if (action !== 'sleep' && user.balance < COST) {
            showToast(`You need ${COST}m to care for ${pet.name}.`, "error");
            return;
        }

        setIsProcessing(true);
        try {
            let updatedPet = { ...pet, lastInteractionAt: new Date().toISOString() };
            let newEmotion: typeof emotion = 'happy';

            let statGain = 0;
            let xpGain = 0;

            // Scale rewards based on intensity (Time Investment)
            switch (intensity) {
                case 1: statGain = 10; xpGain = 2; break;
                case 2: statGain = 25; xpGain = 5; break;
                case 3: statGain = 45; xpGain = 10; break;
            }

            let success = false;

            switch (action) {
                case 'feed':
                    if (pet.hunger >= 100) { showToast(`${pet.name} is full!`, "info"); setIsProcessing(false); return; }
                    if (await UserService.deductBalance(COST, `Fed ${pet.name}`)) {
                        updatedPet.hunger = Math.min(100, pet.hunger + statGain);
                        updatedPet.experience += xpGain;
                        newEmotion = 'eating';
                        triggerImpact();
                        showToast(`Fed ${pet.name}! (+${statGain} Saturation, -${COST}m)`, "success");
                        success = true;
                    }
                    break;
                case 'play':
                    if (pet.energy < 20) { showToast(`${pet.name} is too tired to play.`, "info"); setIsProcessing(false); return; }
                    if (await UserService.deductBalance(COST, `Played with ${pet.name}`)) {
                        updatedPet.happiness = Math.min(100, pet.happiness + statGain);
                        updatedPet.energy = Math.max(0, pet.energy - (10 * intensity));
                        updatedPet.experience += xpGain * 1.5;
                        newEmotion = 'happy';

                        // TRICK LOGIC
                        if (intensity === 2) setTrick('spin');
                        if (intensity === 3) setTrick('magic');

                        triggerImpact();
                        showToast(`Played with ${pet.name}! (+${statGain} Joy, -${COST}m)`, "success");
                        success = true;
                    }
                    break;
                case 'clean':
                    if (await UserService.deductBalance(COST, `Cleaned ${pet.name}`)) {
                        updatedPet.cleanliness = Math.min(100, pet.cleanliness + (statGain * 2));
                        updatedPet.experience += xpGain;
                        newEmotion = 'happy';
                        showToast(`Cleaned ${pet.name}! (-${COST}m)`, "success");
                        success = true;
                    }
                    break;
                case 'sleep':
                    updatedPet.isSleeping = !pet.isSleeping;
                    newEmotion = updatedPet.isSleeping ? 'sleeping' : 'idle';
                    success = true;
                    break;
            }

            if (!success) return;

            // Evolution logic
            if (updatedPet.experience >= updatedPet.level * 100) {
                updatedPet.level += 1;
                updatedPet.experience = 0;
                triggerImpact();
                showToast(`${pet.name} leveled up to Lvl ${updatedPet.level}!`, "success");
            }

            setPet(updatedPet);
            setEmotion(newEmotion);
            await PetService.updatePet(updatedPet);

            if (newEmotion !== 'sleeping') {
                setTimeout(() => {
                    setEmotion('idle');
                    setTrick(null);
                }, 3000);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[120] bg-black flex flex-col items-center justify-center text-white font-black uppercase tracking-[0.3em]">
                <RefreshCw className="w-12 h-12 mb-4 animate-spin text-cyan-400" />
                Initializing Link...
            </div>
        );
    }

    if (showSelection) {
        return (
            <div className="fixed inset-0 z-[120] bg-gray-950 text-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
                <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 shadow-2xl">
                    <h2 className="text-2xl font-black uppercase tracking-widest text-center mb-8 flex items-center justify-center gap-3">
                        <Sparkles className="w-6 h-6 text-cyan-400" /> Summon Your Lumina
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2 block">Choose Species</label>
                            <div className="grid grid-cols-2 gap-3">
                                {(['Holo-Hamu', 'Digi-Dino', 'Neo-Shiba', 'Zen-Sloth'] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSelectedSpecies(s)}
                                        className={`p-4 rounded-2xl border transition-all text-xs font-bold uppercase tracking-widest ${selectedSpecies === s ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2 block">Name Your Friend</label>
                            <input
                                type="text"
                                value={petName}
                                onChange={(e) => setPetName(e.target.value)}
                                placeholder="E.g. Pixel, Sparky..."
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-gray-700 focus:border-cyan-400 outline-none transition-all font-bold"
                                maxLength={12}
                            />
                        </div>

                        <button
                            onClick={handleCreatePet}
                            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            Establish Link <Save className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!pet) return null;

    return (
        <div className={`fixed inset-0 z-[120] bg-gray-50 dark:bg-[#0a0f0d] text-gray-900 dark:text-white flex flex-col animate-in fade-in duration-700 overflow-hidden ${shake ? 'animate-shake' : ''}`}>

            {/* FLASH EFFECT */}
            {flash && <div className="absolute inset-0 z-[150] bg-white pointer-events-none animate-flash-fade"></div>}

            {/* GRID BACKGROUND */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 via-transparent to-transparent pointer-events-none"></div>

            {/* CHROMATIC ABERRATION OVERLAY */}
            <div className="absolute inset-0 opacity-30 pointer-events-none bg-repeat animate-noise mix-blend-overlay"></div>

            {/* ORACLE OVERLAY */}
            {oracleMessage && (
                <div onClick={() => setOracleMessage(null)} className="absolute inset-0 z-[130] flex items-center justify-center bg-black/80 backdrop-blur-md cursor-pointer animate-in fade-in">
                    <div className="max-w-md p-8 text-center border border-purple-500/30 rounded-3xl bg-black/50 shadow-[0_0_50px_rgba(168,85,247,0.2)]">
                        <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-spin-slow" />
                        <h3 className="text-2xl font-black text-purple-400 mb-4 tracking-widest uppercase">Oracle Wisdom</h3>
                        <p className="text-xl text-white font-serif italic leading-relaxed">"{oracleMessage}"</p>
                        <p className="text-xs text-gray-500 mt-8 font-black uppercase tracking-widest">Click to dismiss</p>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <header className="relative z-10 px-6 py-4 flex justify-between items-center border-b border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                        <ChevronLeft className="w-6 h-6 text-cyan-400" />
                    </button>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">{pet.name}</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Level {pet.level} {pet.species}</span>
                            <div className="w-24 h-1 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" style={{ width: `${pet.experience % 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs font-black">{user.balance}m</span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-red-500/20 rounded-xl transition-colors text-gray-500 hover:text-red-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {/* MAIN PORTAL */}
            <main className="flex-1 relative flex items-center justify-center p-4 min-h-0 overflow-visible">
                <div className="relative w-full md:max-w-lg aspect-square flex items-center justify-center">
                    {/* HOLOGRAPHIC RING - Fixed */}
                    <div className="absolute inset-0 -m-4 md:-m-12 border-[4px] md:border-[8px] border-cyan-500/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
                    <div className="absolute inset-0 -m-4 md:-m-12 border-t-[4px] md:border-t-[8px] border-cyan-400 rounded-full animate-[spin_3s_linear_infinite] shadow-[0_0_20px_rgba(34,211,238,0.4)]"></div>
                    <div className="absolute inset-[10%] border-2 border-dashed border-cyan-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>

                    {/* Ambient Particles */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="absolute w-1 h-1 bg-cyan-400/40 rounded-full animate-pulse"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${i * 0.5}s`
                                }}></div>
                        ))}
                    </div>

                    {/* PET CANVAS */}
                    <div className="absolute inset-0 flex items-center justify-center filter drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        <PetCanvas pet={pet} width={canvasSize} height={canvasSize} emotion={emotion} trick={trick} />
                    </div>

                    {/* STATUS BARS (Responsive: Bottom row on mobile, Right column on desktop) */}
                    <div className="absolute -bottom-16 left-0 right-0 md:top-0 md:bottom-auto md:-right-32 md:left-auto md:w-48 bg-black/40 backdrop-blur-xl border border-white/10 p-3 md:p-5 rounded-3xl flex md:flex-col justify-between gap-2 md:gap-4 animate-in slide-in-from-bottom md:slide-in-from-right duration-1000 z-20">
                        <StatusIndicator icon={Pizza} label="Hunger" val={pet.hunger} color="bg-orange-500" compact />
                        <StatusIndicator icon={Heart} label="Happiness" val={pet.happiness} color="bg-rose-500" compact />
                        <StatusIndicator icon={Bath} label="Clean" val={pet.cleanliness} color="bg-blue-400" compact />
                        <StatusIndicator icon={Zap} label="Energy" val={pet.energy} color="bg-yellow-400" compact />
                    </div>
                </div>
            </main>

            {/* INTENSITY TOGGLE */}
            <div className="relative z-20 flex justify-center pb-4 animate-in slide-in-from-bottom duration-700">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-1 flex items-center gap-1">
                    <span className="text-[9px] font-black uppercase text-gray-500 px-3 tracking-widest hidden md:block">Investment</span>
                    {[1, 2, 3].map((level) => (
                        <button
                            key={level}
                            onClick={() => setIntensity(level as 1 | 2 | 3)}
                            className={`w-10 h-8 md:w-12 md:h-10 rounded-full flex items-center justify-center text-[10px] md:text-xs font-black transition-all ${intensity === level ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.6)]' : 'text-gray-500 hover:bg-white/10'}`}
                        >
                            {level}m
                        </button>
                    ))}
                </div>
            </div>

            {/* INTERACTION TRAY */}
            <footer className="relative z-10 p-8 pb-12 flex justify-center gap-4 md:gap-8 flex-wrap">
                <ActionButton
                    icon={Pizza}
                    label="Feed"
                    color="cyan"
                    onClick={() => handleAction('feed')}
                    disabled={pet.isSleeping || isProcessing}
                />
                <ActionButton
                    icon={Gamepad2}
                    label="Play"
                    color="cyan"
                    onClick={() => handleAction('play')}
                    disabled={pet.isSleeping || pet.energy < 20 || isProcessing}
                />
                <ActionButton
                    icon={Sparkles}
                    label="Oracle"
                    color="purple"
                    onClick={handleOracleConsult}
                    disabled={pet.isSleeping || isProcessing}
                />
                <ActionButton
                    icon={Bath}
                    label="Wash"
                    color="cyan"
                    onClick={() => handleAction('clean')}
                    disabled={pet.isSleeping || isProcessing}
                />
                <ActionButton
                    icon={pet.isSleeping ? Sun : Moon}
                    label={pet.isSleeping ? "Wake" : "Sleep"}
                    color={pet.isSleeping ? "yellow" : "cyan"}
                    onClick={() => handleAction('sleep')}
                    disabled={isProcessing}
                />
            </footer>

            {pet.isSleeping && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none flex items-center justify-center">
                    <div className="text-white font-black text-4xl animate-pulse tracking-[1em] opacity-30">ZZZZZ</div>
                </div>
            )}
        </div>
    );
};

// Helper Components
const StatusIndicator: React.FC<{ icon: any, label: string, val: number, color: string, compact?: boolean }> = ({ icon: Icon, label, val, color, compact }) => (
    <div className={`flex items-center gap-3 ${compact ? 'flex-col md:flex-row' : ''}`}>
        <div className={`p-2 rounded-full ${color} text-white shadow-[0_0_10px_rgba(0,0,0,0.3)]`}>
            <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 w-full">
            {!compact && <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 mb-1"><span>{label}</span><span>{val}%</span></div>}
            <div className={`h-1.5 md:h-2 bg-gray-800 rounded-full overflow-hidden border border-white/5`}>
                <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${val}%` }}></div>
            </div>
            {compact && <span className="hidden md:block text-[8px] text-gray-500 uppercase mt-1">{label}</span>}
        </div>
    </div>
);

const ActionButton: React.FC<{ icon: any, label: string, color: 'cyan' | 'purple' | 'yellow', onClick: () => void, disabled?: boolean }> = ({ icon: Icon, label, color, onClick, disabled }) => {
    const colors = {
        cyan: 'hover:bg-cyan-500 hover:text-black border-cyan-500/30 text-cyan-400',
        purple: 'hover:bg-purple-500 hover:text-white border-purple-500/30 text-purple-400',
        yellow: 'hover:bg-yellow-400 hover:text-black border-yellow-400/30 text-yellow-400',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex flex-col items-center gap-3 group ${disabled ? 'opacity-30 pointer-events-none grayscale' : ''}`}
        >
            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl border border-white/10 bg-white/5 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] ${colors[color]}`}>
                <Icon className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">
                {label}
            </span>
        </button>
    );
};

export default LuminaView;
