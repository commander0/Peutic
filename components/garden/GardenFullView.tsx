import React, { useState, useEffect } from 'react';
import { Droplets, Wind, Info, ChevronLeft, Music, Scissors } from 'lucide-react';
import GardenCanvas from './GardenCanvas';
import { UserService } from '../../services/userService';
import { GardenState, User } from '../../types';
import { GardenService } from '../../services/gardenService';
import { useToast } from '../common/Toast';

interface GardenFullViewProps {
    garden: GardenState;
    user: User;
    onClose: () => void;
    onUpdate: () => void;
}

const GardenFullView: React.FC<GardenFullViewProps> = ({ garden, user, onClose, onUpdate }) => {
    const [localGarden, setLocalGarden] = useState(garden);
    const [interaction, setInteraction] = useState<'water' | 'breath' | 'sing' | 'harvest' | null>(null);
    const [showInfo, setShowInfo] = useState(false);
    const [intensity, setIntensity] = useState<1 | 2 | 3>(1); // 1m, 2m, 3m
    const { showToast } = useToast();
    const COST = intensity;

    // Eliminate Cached Ghosts: Always fetch fresh state on mount
    useEffect(() => {
        let mounted = true;
        const fetchFreshState = async () => {
            const freshData = await GardenService.getGarden(user.id);
            if (freshData && mounted) {
                setLocalGarden(freshData);
            }
        };
        fetchFreshState();
        return () => { mounted = false; };
    }, [user.id]);

    const handleAction = async (type: 'water' | 'breath' | 'sing' | 'harvest') => {
        // Cost Logic
        const actionCost = type === 'harvest' ? 1 : COST;

        if (user.balance < actionCost) {
            showToast(`Need ${actionCost}m to ${type}.`, "error");
            return;
        }

        // Trigger Visuals
        if (type !== 'harvest') {
            setInteraction(type);
            setTimeout(() => setInteraction(null), 4000); // Effect duration
        }

        // Deduct Balance
        const success = await UserService.deductBalance(actionCost, `Garden ${type}`);
        if (!success) return;

        // Perform Service Action
        if (type === 'water') {
            await GardenService.waterPlant(garden.userId, intensity);
            await GardenService.addFocusMinutes(garden.userId, actionCost);
            showToast("Garden Watered", "success");
        } else if (type === 'harvest') {
            const result = await GardenService.clipPlant(garden.userId);
            if (result.success) {
                showToast(`Harvested! ${result.reward ? `"${result.reward}"` : ''}`, "success");
            } else {
                showToast(result.message || "Failed to harvest.", "error");
            }
        } else {
            // Breath / Sing
            await GardenService.addFocusMinutes(garden.userId, actionCost);
            showToast(`Shared ${type} with garden.`, "success");
        }

        // Fetch fresh state to reflect growth
        const freshData = await GardenService.getGarden(user.id);
        if (freshData) setLocalGarden(freshData);

        onUpdate();
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden bg-[#050a05] text-white animate-in fade-in duration-700">

            {/* --- ATMOSPHERIC LAYERS --- */}

            {/* 1. Deep Space / Night Sky Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#064e3b] to-[#022c22] opacity-80 pointer-events-none" />

            {/* 2. Moving Fog / Mist */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/foggy-birds.png')] opacity-30 animate-[pulse_10s_ease-in-out_infinite] pointer-events-none mix-blend-overlay" />

            {/* 3. Ambient Particles (CSS Fireflies) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(15)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-yellow-100 rounded-full blur-[1px] animate-[ping_4s_ease-in-out_infinite]"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            opacity: Math.random() * 0.5 + 0.2
                        }}
                    />
                ))}
            </div>

            {/* --- INTERACTION OVERLAYS --- */}

            {/* Rain Effect */}
            {interaction === 'water' && (
                <div className="absolute inset-0 z-20 pointer-events-none flex justify-center overflow-hidden">
                    {/* CSS Rain */}
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent mix-blend-overlay" />
                </div>
            )}

            {/* Wind/Breath Effect */}
            {interaction === 'breath' && (
                <div className="absolute inset-0 z-20 pointer-events-none bg-white/5 backdrop-blur-[2px] animate-[pulse_2s_ease-in-out_infinite]" />
            )}

            {/* Sing/Music Effect */}
            {interaction === 'sing' && (
                <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                    <div className="w-[500px] h-[500px] rounded-full border border-pink-500/20 animate-[ping_2s_linear_infinite]" />
                    <div className="absolute w-[300px] h-[300px] rounded-full border border-purple-500/30 animate-[ping_2s_linear_infinite_reverse]" />
                </div>
            )}

            {/* --- HEADER --- */}
            <header className="relative z-30 p-6 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
                <button onClick={onClose} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group">
                    <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10">
                        <ChevronLeft className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium tracking-widest uppercase">Sanctuary</span>
                </button>

                <div className="text-center">
                    <h1 className="text-2xl font-light tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                        {localGarden.currentPlantType.toUpperCase()}
                    </h1>
                    <div className="flex items-center justify-center gap-2 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold tracking-widest text-emerald-400/80">LEVEL {localGarden.level}</span>
                    </div>
                </div>

                <button onClick={() => setShowInfo(!showInfo)} className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <Info className="w-5 h-5 text-emerald-300" />
                </button>
            </header>

            {/* --- MAIN STAGE --- */}
            <main className="relative z-10 flex-1 h-[60vh] flex items-center justify-center">
                {/* Aura Ring backing the canvas */}
                <div className="absolute w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="w-full max-w-4xl h-full flex items-center justify-center p-4">
                    <GardenCanvas
                        garden={localGarden}
                        width={600}
                        height={500}
                        interactionType={interaction}
                    />
                </div>
            </main>

            {/* --- CONTROLS --- */}
            <footer className="relative z-30 pb-10 px-6 flex flex-col items-center gap-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent">

                {/* Intensity Slider (Abstracted) */}
                <div className="flex items-center gap-4 p-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md">
                    {[1, 2, 3].map((lvl) => (
                        <button
                            key={lvl}
                            onClick={() => setIntensity(lvl as 1 | 2 | 3)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${intensity === lvl
                                ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                                : 'text-white/30 hover:bg-white/5'
                                }`}
                        >
                            {lvl}m
                        </button>
                    ))}
                </div>

                {/* Action Dock */}
                <div className="flex items-center gap-6 md:gap-12">
                    <ControlBtn
                        icon={Droplets}
                        label="Nourish"
                        sub={`-${COST}m`}
                        active={interaction === 'water'}
                        onClick={() => handleAction('water')}
                        color="cyan"
                    />
                    <ControlBtn
                        icon={Wind}
                        label="Breathe"
                        sub={`-${COST}m`}
                        active={interaction === 'breath'}
                        onClick={() => handleAction('breath')}
                        color="teal"
                    />
                    <ControlBtn
                        icon={Music}
                        label="Sing"
                        sub={`-${COST}m`}
                        active={interaction === 'sing'}
                        onClick={() => handleAction('sing')}
                        color="purple"
                    />
                    <ControlBtn
                        icon={Scissors}
                        label="Harvest"
                        sub="-1m"
                        active={interaction === 'harvest'}
                        onClick={() => handleAction('harvest')}
                        color="amber"
                    />
                </div>

                {/* Stats Minimal */}
                <div className="flex gap-8 text-[10px] font-bold tracking-widest text-white/40 uppercase">
                    <div className="flex items-center gap-2">
                        <span className="text-pink-400">{localGarden.focusMinutes} Focus Mins</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-emerald-500">{localGarden.streakCurrent} Day Streak</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-blue-400">{localGarden.waterLevel}% Hydration</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// Sub-component for buttons
const ControlBtn: React.FC<{
    icon: any,
    label: string,
    sub: string,
    onClick: () => void,
    active: boolean,
    color: string
}> = ({ icon: Icon, label, sub, onClick, active, color }) => (
    <button
        onClick={onClick}
        disabled={active}
        className={`group relative flex flex-col items-center gap-3 transition-all duration-300 ${active ? 'scale-95 opacity-50' : 'hover:-translate-y-1'}`}
    >
        <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center
            bg-white/5 border border-white/10 backdrop-blur-md
            shadow-[0_4px_20px_rgba(0,0,0,0.3)]
            group-hover:bg-white/10 group-hover:border-${color}-400/30
            group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]
            transition-all
        `}>
            <Icon className={`w-7 h-7 text-gray-400 group-hover:text-${color}-300 transition-colors`} />
        </div>
        <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/70 group-hover:text-white">{label}</div>
            <div className={`text-[9px] font-medium text-${color}-400/50`}>{sub}</div>
        </div>
    </button>
);

export default GardenFullView;