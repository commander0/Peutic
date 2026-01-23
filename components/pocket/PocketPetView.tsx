import React, { useState, useEffect } from 'react';
import {
    X, Heart, Pizza, Bath, Moon, Sun,
    Sparkles, Zap, ChevronLeft, Save,
    Gamepad2, RefreshCw, AlertCircle
} from 'lucide-react';
import { User, Anima } from '../../types';
import { PetService } from '../../services/petService';
import PetCanvas from './PetCanvas';
import { useToast } from '../common/Toast';
import { UserService } from '../../services/userService';

interface PocketPetViewProps {
    user: User;
    onClose: () => void;
}

const PocketPetView: React.FC<PocketPetViewProps> = ({ user, onClose }) => {
    const [pet, setPet] = useState<Anima | null>(null);
    const [loading, setLoading] = useState(true);
    const [emotion, setEmotion] = useState<'idle' | 'happy' | 'hungry' | 'sleeping' | 'sad' | 'eating'>('idle');
    const [showSelection, setShowSelection] = useState(false);
    const [petName, setPetName] = useState('');
    const [selectedSpecies, setSelectedSpecies] = useState<Anima['species']>('Holo-Hamu');
    const [localBalance, setLocalBalance] = useState(user.balance);
    const { showToast } = useToast();

    useEffect(() => {
        loadPet();
    }, [user.id]);

    const loadPet = async () => {
        setLoading(true);
        const p = await PetService.getPet(user.id);
        if (p) {
            setPet(p);
        } else {
            setShowSelection(true);
        }
        setLoading(false);
    };

    const handleCreatePet = async () => {
        if (!petName.trim()) {
            showToast("Give your friend a name!", "error");
            return;
        }
        try {
            const newPet = await PetService.createPet(user.id, petName, selectedSpecies);
            setPet(newPet);
            setShowSelection(false);
            showToast(`${petName} has arrived!`, "success");
        } catch (e) {
            showToast("Summoning failed. Try again.", "error");
        }
    };

    const handleAction = async (action: 'feed' | 'play' | 'clean' | 'sleep') => {
        if (!pet || (pet.isSleeping && action !== 'sleep')) return;

        // --- ECONOMY LOGIC ---
        // Basic costs: Sleep is free, others cost 1 min
        const COST = action === 'sleep' ? 0 : 1;

        if (localBalance < COST) {
            showToast(`Not enough credits! Need ${COST}m.`, "error");
            return;
        }

        if (COST > 0) {
            const success = await UserService.deductBalance(COST, `Pet Care: ${action}`);
            if (!success) {
                showToast("Transaction failed.", "error");
                return;
            }
            setLocalBalance(prev => prev - COST);
        }

        // --- GAMEPLAY LOGIC ---
        let updatedPet = { ...pet, lastInteractionAt: new Date().toISOString() };
        let newEmotion: typeof emotion = 'happy';

        switch (action) {
            case 'feed':
                if (pet.hunger >= 100) {
                    showToast(`${pet.name} is full!`, "info");
                    return;
                }
                updatedPet.hunger = Math.min(100, pet.hunger + 30);
                updatedPet.experience += 5;
                newEmotion = 'eating';
                break;
            case 'play':
                if (pet.energy < 20) {
                    showToast(`${pet.name} is too tired to play.`, "info");
                    return;
                }
                updatedPet.happiness = Math.min(100, pet.happiness + 25);
                updatedPet.energy = Math.max(0, pet.energy - 15);
                updatedPet.experience += 10;
                newEmotion = 'happy';
                break;
            case 'clean':
                updatedPet.cleanliness = 100;
                updatedPet.experience += 2;
                newEmotion = 'happy';
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
            setTimeout(() => setEmotion('idle'), 3000);
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
                        <Sparkles className="w-6 h-6 text-cyan-400" /> Summon Your Pet
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
            <header className="relative z-10 px-6 py-4 flex justify-between items-center border-b border-gray-200 dark:border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-white/5 rounded-xl transition-colors">
                        <ChevronLeft className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                    </button>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white">{pet.name}</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Level {pet.level} {pet.species}</span>
                            <div className="w-24 h-1 bg-gray-300 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" style={{ width: `${pet.experience % 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-xs font-black text-gray-900 dark:text-white">{localBalance}m</span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-red-500/20 rounded-xl transition-colors text-gray-500 hover:text-red-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {/* MAIN PORTAL */}
            <main className="flex-1 relative flex items-center justify-center p-4">
                <div className="relative w-full max-w-lg aspect-square">
                    {/* HOLOGRAPHIC RING */}
                    <div className="absolute inset-0 border-[20px] border-cyan-500/5 rounded-full animate-[spin_10s_linear_infinite]"></div>
                    <div className="absolute inset-[10%] border-2 border-dashed border-cyan-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>

                    {/* PET CANVAS */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <PetCanvas pet={pet} width={400} height={400} emotion={emotion} />
                    </div>

                    {/* STATUS BARS (FLOATING) */}
                    <div className="absolute top-0 right-0 md:-right-32 space-y-4 w-48 bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-5 rounded-3xl animate-in slide-in-from-right duration-1000 shadow-xl">
                        <StatusIndicator icon={Pizza} label="Hunger" val={pet.hunger} color="bg-orange-500" />
                        <StatusIndicator icon={Heart} label="Happiness" val={pet.happiness} color="bg-rose-500" />
                        <StatusIndicator icon={Bath} label="Clean" val={pet.cleanliness} color="bg-blue-400" />
                        <StatusIndicator icon={Zap} label="Energy" val={pet.energy} color="bg-yellow-400" />
                    </div>
                </div>
            </main>

            {/* INTERACTION TRAY */}
            <footer className="relative z-10 p-8 pb-12 flex justify-center gap-4 md:gap-8">
                <ActionButton
                    icon={Pizza}
                    label="Feed (1m)"
                    color="cyan"
                    onClick={() => handleAction('feed')}
                    disabled={pet.isSleeping}
                />
                <ActionButton
                    icon={Gamepad2}
                    label="Play (1m)"
                    color="cyan"
                    onClick={() => handleAction('play')}
                    disabled={pet.isSleeping || pet.energy < 20}
                />
                <ActionButton
                    icon={Bath}
                    label="Wash (1m)"
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

const StatusIndicator: React.FC<{ icon: any, label: string, val: number, color: string }> = ({ icon: Icon, label, val, color }) => (
    <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
            <div className="flex items-center gap-1.5">
                <Icon className="w-3 h-3" /> {label}
            </div>
            <span>{Math.floor(val)}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full ${color} transition-all duration-1000 shadow-[0_0_8px_rgba(0,0,0,0.5)]`} style={{ width: `${val}%` }}></div>
        </div>
    </div>
);

const ActionButton: React.FC<{ icon: any, label: string, color: 'cyan' | 'yellow' | 'red', onClick: () => void, disabled?: boolean }> = ({ icon: Icon, label, color, onClick, disabled }) => {
    // Light mode friendly colors
    const colorClass = color === 'cyan' 
        ? 'bg-white dark:bg-transparent text-cyan-600 dark:text-cyan-400 border-gray-200 dark:border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/20' 
        : color === 'yellow' 
            ? 'bg-white dark:bg-transparent text-yellow-600 dark:text-yellow-400 border-gray-200 dark:border-yellow-500/30 hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-500/20' 
            : 'bg-white dark:bg-transparent text-red-600 dark:text-red-400 border-gray-200 dark:border-red-500/30 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-500/20';

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`group relative flex flex-col items-center gap-2 p-4 md:p-6 rounded-[2rem] border backdrop-blur-xl transition-all active:scale-90 shadow-sm hover:shadow-md ${disabled ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-transparent border-gray-200 dark:border-white/5 text-gray-400' : colorClass}`}
        >
            <div className="relative">
                <Icon className="w-6 h-6 md:w-8 md:h-8" />
                <div className="absolute -inset-4 bg-current opacity-0 group-hover:opacity-10 blur-xl transition-opacity"></div>
            </div>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
        </button>
    );
};

export default PocketPetView;