import React, { useState, useEffect } from 'react';
import {
    X, Heart, Pizza, Bath, Moon, Sun,
    Sparkles, Zap, ChevronLeft, Save,
    Gamepad2, RefreshCw
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

    // Dynamic canvas sizing for responsive pet
    const [canvasSize, setCanvasSize] = useState(500);

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

    const handleCreatePet = async () => {
        if (!petName.trim()) {
            showToast("Please give your friend a name!", "error");
            return;
        }

        const newPet = await PetService.createPet(user.id, selectedSpecies as 'Holo-Hamu' | 'Digi-Dino' | 'Neo-Shiba' | 'Zen-Sloth', petName);
        if (newPet) {
            setPet(newPet);
            setShowSelection(false);
            showToast(`Welcome, ${newPet.name}! (+50 XP)`, "success");
        }
    };

    const [trick, setTrick] = useState<'spin' | 'flip' | 'magic' | null>(null);

    // ... (logic)

    const handleAction = async (action: 'feed' | 'play' | 'clean' | 'sleep') => {
        // ... (existing checks)
        if (!pet || (pet.isSleeping && action !== 'sleep')) return;

        // Check if user has enough balance
        if (action !== 'sleep' && user.balance < COST) {
            showToast(`You need ${COST}m to care for ${pet.name}.`, "error");
            return;
        }

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

        switch (action) {
            case 'feed':
                if (pet.hunger >= 100) { showToast(`${pet.name} is full!`, "info"); return; }
                if (await UserService.deductBalance(COST, `Fed ${pet.name}`)) {
                    updatedPet.hunger = Math.min(100, pet.hunger + statGain);
                    updatedPet.experience += xpGain;
                    newEmotion = 'eating';
                    showToast(`Fed ${pet.name}! (+${statGain} Saturation, -${COST}m)`, "success");
                }
                break;
            case 'play':
                if (pet.energy < 20) { showToast(`${pet.name} is too tired to play.`, "info"); return; }
                if (await UserService.deductBalance(COST, `Played with ${pet.name}`)) {
                    updatedPet.happiness = Math.min(100, pet.happiness + statGain);
                    updatedPet.energy = Math.max(0, pet.energy - (10 * intensity));
                    updatedPet.experience += xpGain * 1.5;
                    newEmotion = 'happy';

                    // TRICK LOGIC
                    if (intensity === 2) setTrick('spin');
                    if (intensity === 3) setTrick('magic');

                    showToast(`Played with ${pet.name}! (+${statGain} Joy, -${COST}m)`, "success");
                }
                break;
            case 'clean':
                if (await UserService.deductBalance(COST, `Cleaned ${pet.name}`)) {
                    updatedPet.cleanliness = Math.min(100, pet.cleanliness + (statGain * 2));
                    updatedPet.experience += xpGain;
                    newEmotion = 'happy';
                    showToast(`Cleaned ${pet.name}! (-${COST}m)`, "success");
                }
                break;
            case 'sleep':
                updatedPet.isSleeping = !pet.isSleeping;
                newEmotion = updatedPet.isSleeping ? 'sleeping' : 'idle';
                break;
        }

        // Evolution logic
        if (updatedPet.experience >= updatedPet.level * 100) {
            updatedPet.level += 1;
            updatedPet.experience = 0;
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
        <div className="fixed inset-0 z-[120] bg-gray-50 dark:bg-[#0a0f0d] text-gray-900 dark:text-white flex flex-col animate-in fade-in duration-700 overflow-hidden">
            {/* GRID BACKGROUND */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 via-transparent to-transparent pointer-events-none"></div>

            {/* HEADER */}
            <header className="relative z-10 px-6 py-4 flex justify-between items-center border-b border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                        <ChevronLeft className="w-6 h-6 text-cyan-400" />
                    </button>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-[0.2em]">{pet.name}</h2>
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
                    {/* HOLOGRAPHIC RING */}
                    <div className="absolute inset-0 -m-4 md:-m-12 border-[10px] md:border-[20px] border-cyan-500/5 rounded-full animate-[spin_10s_linear_infinite]"></div>
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
            {/* INTENSITY TOGGLE - VISUAL PROGRESSION */}
            <div className="relative z-20 flex justify-center pb-4 animate-in slide-in-from-bottom duration-700">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-2 flex items-center gap-3">
                    <span className="text-[9px] font-black uppercase text-gray-500 px-3 tracking-widest hidden md:block">Investment Tier</span>

                    {/* Tier 1: Bronze/Common */}
                    <button
                        onClick={() => setIntensity(1)}
                        className={`w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all border-2 ${intensity === 1 ? 'bg-[#cd7f32] border-white text-white shadow-[0_0_15px_#cd7f32] scale-110' : 'bg-black/40 border-[#cd7f32]/50 text-[#cd7f32] hover:bg-[#cd7f32]/20'}`}
                    >
                        <span className="text-xs font-black">1m</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#cd7f32] mt-0.5 shadow-sm"></div>
                    </button>

                    {/* Tier 2: Silver/Rare */}
                    <button
                        onClick={() => setIntensity(2)}
                        className={`w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all border-2 ${intensity === 2 ? 'bg-[#c0c0c0] border-white text-black shadow-[0_0_15px_#c0c0c0] scale-110' : 'bg-black/40 border-[#c0c0c0]/50 text-[#c0c0c0] hover:bg-[#c0c0c0]/20'}`}
                    >
                        <span className="text-xs font-black">2m</span>
                        <div className="flex gap-0.5 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#c0c0c0] shadow-sm"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-[#c0c0c0] shadow-sm"></div>
                        </div>
                    </button>

                    {/* Tier 3: Gold/Legendary */}
                    <button
                        onClick={() => setIntensity(3)}
                        className={`w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all border-2 ${intensity === 3 ? 'bg-[#ffd700] border-white text-black shadow-[0_0_20px_#ffd700] scale-110' : 'bg-black/40 border-[#ffd700]/50 text-[#ffd700] hover:bg-[#ffd700]/20'}`}
                    >
                        <span className="text-xs font-black">3m</span>
                        <div className="flex gap-0.5 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#ffd700] shadow-sm"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-[#ffd700] shadow-sm"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-[#ffd700] shadow-sm"></div>
                        </div>
                    </button>
                </div>
            </div>

            {/* INTERACTION TRAY */}
            <footer className="relative z-10 p-8 pb-12 flex justify-center gap-4 md:gap-8">
                <ActionButton
                    icon={Pizza}
                    label="Feed"
                    color="cyan"
                    onClick={() => handleAction('feed')}
                    disabled={pet.isSleeping}
                />
                <ActionButton
                    icon={Gamepad2}
                    label="Play"
                    color="cyan"
                    onClick={() => handleAction('play')}
                    disabled={pet.isSleeping || pet.energy < 20}
                />
                <ActionButton
                    icon={Bath}
                    label="Wash"
                    color="cyan"
                    onClick={() => handleAction('clean')}
                    disabled={pet.isSleeping}
                />
                <ActionButton
                    icon={pet.isSleeping ? Sun : Moon}
                    label={pet.isSleeping ? "Wake" : "Sleep"}
                    color={pet.isSleeping ? "yellow" : "cyan"}
                    onClick={() => handleAction('sleep')}
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

const StatusIndicator: React.FC<{ icon: any, label: string, val: number, color: string, compact?: boolean }> = ({ icon: Icon, label, val, color, compact }) => (
    <div className={`space-y-1.5 ${compact ? 'flex-1' : ''}`}>
        <div className="flex justify-between items-center text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-500">
            <div className={`flex items-center ${compact ? 'justify-center w-full mb-1' : 'gap-1.5'}`}>
                <Icon className="w-3 h-3 md:mr-1" /> {!compact && label}
            </div>
            {!compact && <span>{Math.floor(val)}%</span>}
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full ${color} transition-all duration-1000 shadow-[0_0_8px_rgba(0,0,0,0.5)]`} style={{ width: `${val}%` }}></div>
        </div>
    </div>
);

const ActionButton: React.FC<{ icon: any, label: string, color: 'cyan' | 'yellow' | 'red', onClick: () => void, disabled?: boolean }> = ({ icon: Icon, label, color, onClick, disabled }) => {
    const colorClass = color === 'cyan' ? 'hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
        color === 'yellow' ? 'hover:bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
            'hover:bg-red-500/20 text-red-400 border-red-500/30';

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`group relative flex flex-col items-center gap-2 p-4 md:p-6 rounded-[2rem] border backdrop-blur-xl transition-all active:scale-90 ${disabled ? 'opacity-20 cursor-not-allowed border-white/5 text-gray-700' : colorClass}`}
        >
            <div className="relative">
                <Icon className="w-6 h-6 md:w-8 md:h-8" />
                <div className="absolute -inset-4 bg-current opacity-0 group-hover:opacity-10 blur-xl transition-opacity"></div>
            </div>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
        </button>
    );
};

export default LuminaView;
