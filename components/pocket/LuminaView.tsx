import React, { useState, useEffect } from 'react';
import {
    Heart, Pizza, Moon, Sun,
    Sparkles, Zap, ChevronLeft,
    Gamepad2, RefreshCw
} from 'lucide-react';
import { User, Lumina } from '../../types';
import { PetService } from '../../services/petService';
import PetCanvas from './PetCanvas';
import { useToast } from '../common/Toast';
import { UserService } from '../../services/userService';

// --- HELPER COMPONENTS ---

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
    const [feedingItem, setFeedingItem] = useState<string | null>(null);

    const { showToast } = useToast();
    const COST = intensity;

    // Load Pet
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            const p = await PetService.getPet(user.id);
            if (mounted) {
                if (p) {
                    setPet(p);
                } else {
                    // Only show selection if we are sure there is no pet
                    // But PetService.getPet returns null if no pet.
                    // We might want to try to create one or show selection.
                    // The logic below was:
                    // setPet(p) if exists, else setShowSelection(true).
                    // However, we want to allow the "Initialize" flow if null.
                    // So we just set pet to null, which renders the fallback UI.
                }
                setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [user.id]);

    const handleCreatePet = async () => {
        if (!petName.trim()) return;
        setIsCreating(true);
        try {
            const p = await PetService.createPet(user.id, petName, 'glimmer');
            setPet(p);
            showToast("Lumina Link Established!", "success");
        } catch (e) {
            showToast("Link Failed. Try again.", "error");
        } finally {
            setIsCreating(false);
        }
    };

    const handleFeed = async (food: string) => {
        if (!pet) return;
        if (user.balance < 10) {
            showToast("Need 10m to feed.", "error");
            return;
        }

        setFeedingItem(food);
        setEmotion('eating');

        const deducted = await UserService.deductBalance(10, `Fed Lumina ${food}`);
        if (!deducted) return;

        const updated = await PetService.feedPet(pet.id, 10);
        if (updated) setPet(updated);

        setTimeout(() => {
            setFeedingItem(null);
            setEmotion('happy');
        }, 3000);
    };

    const handlePettingComplete = async () => {
        if (!pet) return;
        showToast("Lumina feels loved!", "success");
        setEmotion('happy');
        setTimeout(() => setEmotion('idle'), 2000);
    };

    const handleAction = async (action: 'feed' | 'play' | 'clean' | 'sleep') => {
        if (!pet || (pet.isSleeping && action !== 'sleep')) return;
        if (action !== 'sleep' && user.balance < COST) {
            showToast(`INSUFFICIENT_FUNDS: REQ ${COST}m`, "error");
            return;
        }

        if (action !== 'sleep') {
            const deducted = await UserService.deductBalance(COST, `Lumina ${action}`);
            if (!deducted) return;
        }

        let updated = { ...pet };
        let newEmotion: typeof emotion = 'happy';
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

        if (action !== 'sleep') updated.experience += intensity * 5;
        if (updated.experience >= updated.level * 100) {
            updated.level++;
            updated.experience = 0;
            showToast(`SYSTEM UPGRADE: LEVEL ${updated.level}`, "success");
        }

        setPet(updated);
        setEmotion(newEmotion);
        if (action !== 'sleep') { // Don't persist sleep state change immediately if not needed or maybe we do?
            // Actually we should persist all changes
        }
        PetService.updatePet(updated);

        if (newEmotion !== 'sleeping') {
            setTimeout(() => {
                setEmotion('idle');
                setTrick(null);
            }, 2500);
        }
    };

    if (loading) return <div className="fixed inset-0 bg-black text-cyan-500 flex items-center justify-center font-mono">INITIALIZING LINK...</div>;

    if (!pet) {
        return (
            <div className="fixed inset-0 z-[120] bg-black text-cyan-500 font-mono tracking-wider flex flex-col items-center justify-center">
                <div className="max-w-md w-full p-8 border border-cyan-500/30 bg-cyan-900/10 backdrop-blur-md rounded-3xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                    <h2 className="text-3xl font-black italic mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        INIT_LUMINA
                    </h2>
                    <p className="text-xs text-center text-cyan-500/60 mb-8">ESTABLISH NEURAL LINK</p>

                    <div className="space-y-6">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="ENTER_DESIGNATION..."
                                value={petName}
                                onChange={(e) => setPetName(e.target.value.toUpperCase())}
                                maxLength={12}
                                className="w-full bg-black/50 border-2 border-cyan-800 focus:border-cyan-400 rounded-xl p-4 text-center text-xl font-bold tracking-[0.2em] outline-none transition-all placeholder:text-cyan-900"
                            />
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
        );
    }

    return (
        <div className="fixed inset-0 z-[120] bg-[#050505] text-cyan-500 font-mono tracking-wider overflow-hidden">
            {/* --- CYBER BACKGROUND --- */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/10 via-transparent to-transparent pointer-events-none" />

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
                    <div className={`absolute inset-0 -m-12 border border-cyan-500/20 rounded-full animate-[spin_20s_linear_infinite]`} />
                    <div className="absolute inset-0 -m-6 border-t border-b border-cyan-400/40 rounded-full animate-[spin_5s_linear_infinite_reverse]" />

                    {/* Character Canvas */}
                    <div className={`relative transition-all duration-1000`}>
                        <div className="relative">
                            <PetCanvas
                                pet={pet}
                                width={canvasSize}
                                height={canvasSize}
                                emotion={emotion}
                                trick={trick}
                                feedingItem={feedingItem}
                                onPet={handlePettingComplete}
                            />

                            {/* Status Overlays */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                {/* ... status bars if needed ... */}
                            </div>
                        </div>
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

export default LuminaView;
