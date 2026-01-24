import React, { useState } from 'react';
import { X, Droplets, Leaf, Sprout, Wind, Heart, Info, ChevronLeft } from 'lucide-react';
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
    const [isWatering, setIsWatering] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [intensity, setIntensity] = useState<1 | 2 | 3>(1); // 1m, 2m, 3m
    const { showToast } = useToast();
    const COST = intensity;

    const handleWater = async () => {
        if (isWatering) return;

        // Strict local check
        if (user.balance < COST) {
            showToast(`Not enough minutes. Need ${COST}m.`, "error");
            return;
        }

        setIsWatering(true);
        try {
            const success = await UserService.deductBalance(COST, "Garden Water");

            if (success) {
                // Scaled Water effect
                const updated = await GardenService.waterPlant(garden.userId);
                if (updated) {
                    setLocalGarden(updated);
                    onUpdate();
                    showToast(`Garden Watered! (-${COST}m)`, "success");
                }
            } else {
                showToast(`Transaction failed. Check balance.`, "error");
            }
        } catch (e) {
            showToast("Network error during transaction.", "error");
        } finally {
            // Delay re-enabling button to match animation
            setTimeout(() => setIsWatering(false), 2000);
        }
    };

    const handleHarvest = async () => {
        const harvestCost = 5;
        if (user.balance < harvestCost) {
            showToast(`Need ${harvestCost}m to harvest.`, "error");
            return;
        }

        try {
            const success = await UserService.deductBalance(harvestCost, "Garden Harvest");
            if (success) {
                showToast(`Harvested! +50 XP (-${harvestCost}m)`, "success");
            } else {
                showToast(`Harvest failed. Check balance.`, "error");
            }
        } catch (e) {
            showToast("Transaction error.", "error");
        }
    };

    const handleNurture = async (action: 'breath' | 'sing') => {
        if (user.balance < COST) {
            showToast(`Not enough minutes. Need ${COST}m.`, "error");
            return;
        }

        try {
            const success = await UserService.deductBalance(COST, action === 'breath' ? "Garden Breath" : "Garden Song");
            if (success) {
                showToast(action === 'breath' ? `Deep breath taken. (-${COST}m)` : `Sang to the garden. (-${COST}m)`, "success");
            } else {
                showToast(`Nurture failed. Check balance.`, "error");
            }
        } catch (e) {
            showToast("Transaction error.", "error");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#081508] text-white flex flex-col animate-in fade-in duration-500 overflow-hidden">
            {/* AMBIENT BACKGROUND */}
            <div className="absolute inset-0 bg-gradient-to-b from-green-900 via-emerald-950 to-black pointer-events-none"></div>
            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] pointer-events-none mix-blend-overlay"></div>

            {/* OVERLAY GLOWS */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-green-500/20 blur-[150px] rounded-full animate-pulse pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-400/10 blur-[150px] rounded-full animate-pulse delay-1000 pointer-events-none"></div>

            {/* HEADER */}
            <header className="relative z-10 p-6 flex items-center justify-between">
                <button onClick={onClose} className="flex items-center gap-2 text-green-400 font-bold hover:text-green-300 transition-colors bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-green-500/20">
                    <ChevronLeft className="w-5 h-5" /> Back to Sanctuary
                </button>
                <div className="text-center">
                    <h1 className="text-xl md:text-3xl font-black uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-200 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]">
                        Inner Garden
                    </h1>
                    <p className="text-[10px] md:text-xs font-bold text-green-500 uppercase tracking-widest mt-1">Level {localGarden.level} &bull; {localGarden.currentPlantType} Ecosystem</p>
                </div>
                <button onClick={() => setShowInfo(!showInfo)} className="p-2 border border-green-500/30 bg-black/40 rounded-full hover:bg-green-500/10 transition-colors backdrop-blur-md">
                    <Info className="w-5 h-5 text-green-500" />
                </button>
            </header>

            {/* MAIN GARDEN AREA */}
            <main className="flex-1 relative flex flex-col items-center justify-center p-4">
                <div className="relative group">
                    {/* Ring Aura - Enhanced - Four Fledged Representation */}
                    <div className="absolute inset-0 -m-12 border-4 border-green-500/10 rounded-full animate-[spin_20s_linear_infinite]"></div>
                    <div className="absolute inset-0 -m-16 border-2 border-emerald-400/20 rounded-full animate-[spin_25s_linear_infinite_reverse] border-dashed"></div>
                    <div className="absolute inset-0 -m-24 border border-teal-300/10 rounded-full animate-[spin_40s_linear_infinite]"></div>

                    {/* Seasonal/Atmospheric Overlay */}
                    <div className="absolute inset-0 z-0 bg-gradient-radial from-green-500/5 to-transparent blur-3xl rounded-full"></div>

                    {/* Particles */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="absolute w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${i * 0.5}s` }}></div>
                        ))}
                    </div>

                    {/* RAIN EFFECT DURING WATERING */}
                    {isWatering && (
                        <div className="absolute inset-0 z-20 pointer-events-none">
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute bg-blue-300 w-0.5 h-6 animate-fall shadow-[0_0_5px_rgba(147,197,253,0.8)]"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `-50px`,
                                        animationDelay: `${Math.random() * 0.5}s`,
                                        animationDuration: '0.6s'
                                    }}
                                ></div>
                            ))}
                        </div>
                    )}

                    <div className="relative z-10 transition-transform duration-1000 transform hover:scale-105 filter drop-shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                        <GardenCanvas garden={localGarden} width={500} height={500} />
                    </div>
                </div>

                {/* INTENSITY TOGGLE */}
                <div className="relative z-20 flex justify-center pb-8 mt-8">
                    <div className="bg-black/80 backdrop-blur-xl border border-green-500/30 rounded-full p-1.5 flex items-center gap-1 shadow-2xl">
                        <span className="text-[9px] font-black uppercase text-green-500 px-3 tracking-widest hidden md:block">Nurture Level</span>
                        {[1, 2, 3].map((level) => (
                            <button
                                key={level}
                                onClick={() => setIntensity(level as 1 | 2 | 3)}
                                className={`w-10 h-8 md:w-12 md:h-10 rounded-full flex items-center justify-center text-[10px] md:text-xs font-black transition-all ${intensity === level ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'text-green-500/50 hover:bg-green-500/10'}`}
                            >
                                {level}m
                            </button>
                        ))}
                    </div>
                </div>

                {/* INTERACTIVE CONTROLS - "Four Fledged" (4 distinct actions) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 relative z-10 px-6 pb-8">
                    <ActionButton icon={Droplets} label={`Hydrate (-${COST}m)`} onClick={handleWater} active={isWatering} />
                    <ActionButton icon={Wind} label={`Breath (-${COST}m)`} onClick={() => handleNurture('breath')} color="blue" />
                    <ActionButton icon={Heart} label={`Sing (-${COST}m)`} onClick={() => handleNurture('sing')} color="pink" />
                    <ActionButton icon={Leaf} label="Harvest (-5m)" onClick={handleHarvest} color="emerald" />
                </div>
            </main>

            {/* FOOTER STATS */}
            <footer className="relative z-10 p-6 md:p-8 grid grid-cols-3 gap-4 border-t border-green-500/20 bg-black/80 backdrop-blur-xl">
                <StatBox label="Streak" value={`${localGarden.streakCurrent} Days`} />
                <StatBox label="Vitality" value="98%" />
                <StatBox label="Phase" value="Bloom" />
            </footer>

            {/* INFO PANEL */}
            {showInfo && (
                <div className="absolute inset-0 z-[110] bg-black/95 p-10 flex flex-col items-center justify-center animate-in slide-in-from-right duration-500">
                    <button onClick={() => setShowInfo(false)} className="absolute top-10 right-10 text-white/50 hover:text-white"><X className="w-8 h-8" /></button>
                    <div className="max-w-xl text-center space-y-6">
                        <Sprout className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-3xl font-black uppercase text-green-400">Garden Wisdom</h2>
                        <p className="text-gray-400 leading-relaxed">
                            Your inner garden reflects your daily presence. By checking in, watering, and caring for this space, you harmonize your mental state. As the plant evolves, so does your capacity for resilience and mindfulness.
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-left">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <h4 className="font-bold text-green-400 text-sm mb-1">Watering</h4>
                                <p className="text-xs text-gray-500">Maintain your streak to help the plant evolve through its 5 growth stages.</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <h4 className="font-bold text-green-400 text-sm mb-1">Spirit Wisp</h4>
                                <p className="text-xs text-gray-500">The floating wisp represents your focus. It becomes more stable as you spend time here.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ActionButton: React.FC<{ icon: any, label: string, onClick: () => void, color?: string, active?: boolean }> = ({ icon: Icon, label, onClick, color = 'green', active }) => (
    <button
        onClick={onClick}
        disabled={active}
        className={`group flex flex-col items-center gap-2 transition-all hover:-translate-y-2 ${active ? 'opacity-50 grayscale' : ''}`}
    >
        <div className={`p-4 md:p-5 rounded-3xl border-2 border-${color}-500/30 bg-black/60 shadow-lg backdrop-blur-md group-hover:bg-${color}-500/20 group-hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] group-hover:border-${color}-500/60 transition-all`}>
            <Icon className={`w-6 h-6 text-${color}-400 group-hover:scale-110 transition-transform`} />
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-white drop-shadow-md group-hover:text-${color}-300 bg-black/40 px-2 py-0.5 rounded-md">{label}</span>
    </button>
);

const StatBox: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div className="text-center">
        <p className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm md:text-xl font-black text-green-400">{value}</p>
    </div>
);

export default GardenFullView;
