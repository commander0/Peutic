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
    const [localBalance, setLocalBalance] = useState(user.balance);
    const { showToast } = useToast();
    const COST = intensity;

    const handleWater = async () => {
        if (localBalance < COST) {
            showToast(`Not enough minutes. Need ${COST}m.`, "error");
            return;
        }

        setIsWatering(true);
        const success = await UserService.deductBalance(COST, "Garden Water");

        if (success) {
            setLocalBalance(prev => prev - COST);
            try {
                // Scaled Water effect
                const updated = await GardenService.waterPlant(garden.userId);
                if (updated) {
                    setLocalGarden(updated);
                    onUpdate();
                    showToast(`Garden Watered! (-${COST}m)`, "success");
                }
            } catch (e) {
                showToast("Failed to sync garden state.", "error");
            }
        } else {
            showToast(`Transaction failed.`, "error");
        }
        setTimeout(() => setIsWatering(false), 2000);
    };

    const handleHarvest = async () => {
        const harvestCost = 5;
        if (localBalance < harvestCost) {
            showToast(`Harvest requires ${harvestCost}m.`, "error");
            return;
        }

        const success = await UserService.deductBalance(harvestCost, "Garden Harvest");
        if (success) {
            setLocalBalance(prev => prev - harvestCost);
            showToast(`Harvested! +50 XP (-${harvestCost}m)`, "success");
        }
    };

    const handleNurture = async (action: 'breath' | 'sing') => {
        if (localBalance < COST) {
            showToast(`Not enough minutes. Need ${COST}m.`, "error");
            return;
        }

        const success = await UserService.deductBalance(COST, action === 'breath' ? "Garden Breath" : "Garden Song");
        if (success) {
            setLocalBalance(prev => prev - COST);
            showToast(action === 'breath' ? `Deep breath taken. (-${COST}m)` : `Sang to the garden. (-${COST}m)`, "success");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#FFFBEB] dark:bg-[#081508] text-gray-900 dark:text-white flex flex-col animate-in fade-in duration-500 overflow-hidden transition-colors">
            {/* AMBIENT BACKGROUND */}
            <div className="absolute inset-0 bg-gradient-to-b from-green-50 via-emerald-100 to-white dark:from-green-900 dark:via-emerald-950 dark:to-black pointer-events-none"></div>
            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] pointer-events-none mix-blend-multiply dark:mix-blend-overlay"></div>

            {/* OVERLAY GLOWS */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-green-400/20 dark:bg-green-500/20 blur-[150px] rounded-full animate-pulse pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-300/20 dark:bg-emerald-400/10 blur-[150px] rounded-full animate-pulse delay-1000 pointer-events-none"></div>

            {/* HEADER */}
            <header className="relative z-10 p-6 flex items-center justify-between">
                <button onClick={onClose} className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold hover:text-green-800 dark:hover:text-green-300 transition-colors">
                    <ChevronLeft className="w-5 h-5" /> Back to Sanctuary
                </button>
                <div className="text-center">
                    <h1 className="text-xl md:text-3xl font-black uppercase tracking-[0.3em] text-green-800 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-green-400 dark:to-emerald-200 drop-shadow-sm">
                        Inner Garden
                    </h1>
                    <p className="text-[10px] md:text-xs font-bold text-green-600 dark:text-green-500 uppercase tracking-widest mt-1">Level {localGarden.level} &bull; {localGarden.currentPlantType} Ecosystem</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-black/50 px-3 py-1 rounded-full">{localBalance}m</span>
                    <button onClick={() => setShowInfo(!showInfo)} className="p-2 border border-green-500/30 rounded-full hover:bg-green-500/10 transition-colors">
                        <Info className="w-5 h-5 text-green-600 dark:text-green-500" />
                    </button>
                </div>
            </header>

            {/* MAIN GARDEN AREA */}
            <main className="flex-1 relative flex flex-col items-center justify-center p-4">
                <div className="relative group">
                    {/* Ring Aura - Enhanced */}
                    <div className="absolute inset-0 -m-12 border-2 border-green-500/20 rounded-full animate-[spin_20s_linear_infinite]"></div>
                    <div className="absolute inset-0 -m-20 border border-emerald-400/10 rounded-full animate-[spin_30s_linear_infinite_reverse]"></div>

                    {/* Particles */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="absolute w-1 h-1 bg-green-400/40 dark:bg-white/40 rounded-full animate-pulse" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${i * 0.5}s` }}></div>
                        ))}
                    </div>

                    {/* RAIN EFFECT DURING WATERING */}
                    {isWatering && (
                        <div className="absolute inset-0 z-20 pointer-events-none">
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute bg-blue-400 dark:bg-blue-300 w-0.5 h-6 animate-fall shadow-[0_0_5px_rgba(147,197,253,0.8)]"
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
                <div className="relative z-20 flex justify-center pb-8">
                    <div className="bg-white/60 dark:bg-black/60 backdrop-blur-xl border border-green-500/20 rounded-full p-1 flex items-center gap-1">
                        <span className="text-[9px] font-black uppercase text-green-700 dark:text-green-500 px-3 tracking-widest hidden md:block">Investment</span>
                        {[1, 2, 3].map((level) => (
                            <button
                                key={level}
                                onClick={() => setIntensity(level as 1 | 2 | 3)}
                                className={`w-10 h-8 md:w-12 md:h-10 rounded-full flex items-center justify-center text-[10px] md:text-xs font-black transition-all ${intensity === level ? 'bg-green-600 text-white dark:bg-green-500 dark:text-black shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'text-green-700/50 dark:text-green-500/50 hover:bg-green-500/10'}`}
                            >
                                {level}m
                            </button>
                        ))}
                    </div>
                </div>

                {/* INTERACTIVE CONTROLS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 relative z-10 px-6 pb-8">
                    <ActionButton icon={Droplets} label={`Water (-${COST}m)`} onClick={handleWater} active={isWatering} />
                    <ActionButton icon={Leaf} label="Harvest (-5m)" onClick={handleHarvest} color="emerald" />
                    <ActionButton icon={Wind} label={`Breath (-${COST}m)`} onClick={() => handleNurture('breath')} color="blue" />
                    <ActionButton icon={Heart} label={`Sing (-${COST}m)`} onClick={() => handleNurture('sing')} color="pink" />
                </div>
            </main>

            {/* FOOTER STATS */}
            <footer className="relative z-10 p-8 grid grid-cols-3 gap-4 border-t border-green-500/10 bg-white/40 dark:bg-black/40 backdrop-blur-md text-gray-800 dark:text-white">
                <StatBox label="Streak" value={`${localGarden.streakCurrent} Days`} />
                <StatBox label="Vitality" value="98%" />
                <StatBox label="Next Bloom" value="4 Days" />
            </footer>

            {/* INFO PANEL */}
            {showInfo && (
                <div className="absolute inset-0 z-[110] bg-white/95 dark:bg-black/95 p-10 flex flex-col items-center justify-center animate-in slide-in-from-right duration-500 text-gray-900 dark:text-white">
                    <button onClick={() => setShowInfo(false)} className="absolute top-10 right-10 text-gray-400 hover:text-black dark:text-white/50 dark:hover:text-white"><X className="w-8 h-8" /></button>
                    <div className="max-w-xl text-center space-y-6">
                        <Sprout className="w-16 h-16 text-green-600 dark:text-green-500 mx-auto mb-4" />
                        <h2 className="text-3xl font-black uppercase text-green-700 dark:text-green-400">Garden Wisdom</h2>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            Your inner garden reflects your daily presence. By checking in, watering, and caring for this space, you harmonize your mental state. As the plant evolves, so does your capacity for resilience and mindfulness.
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-left">
                            <div className="p-4 bg-green-50 dark:bg-white/5 rounded-2xl border border-green-100 dark:border-white/10">
                                <h4 className="font-bold text-green-700 dark:text-green-400 text-sm mb-1">Watering</h4>
                                <p className="text-xs text-gray-500">Maintain your streak to help the plant evolve through its 5 growth stages.</p>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-white/5 rounded-2xl border border-green-100 dark:border-white/10">
                                <h4 className="font-bold text-green-700 dark:text-green-400 text-sm mb-1">Spirit Wisp</h4>
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
        <div className={`p-5 rounded-full border-2 border-${color}-500/30 bg-white dark:bg-${color}-500/10 shadow-sm group-hover:bg-${color}-50 dark:group-hover:bg-${color}-500/20 group-hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all`}>
            <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400 group-hover:scale-110 transition-transform`} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white">{label}</span>
    </button>
);

const StatBox: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div className="text-center">
        <p className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm md:text-xl font-black text-green-700 dark:text-green-400">{value}</p>
    </div>
);

export default GardenFullView;