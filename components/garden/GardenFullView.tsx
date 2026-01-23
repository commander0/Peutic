import React, { useState } from 'react';
import { X, Droplets, Leaf, Sprout, Wind, Heart, Info, ChevronLeft, Sparkles, Sun, CloudRain, Zap } from 'lucide-react';
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
    const [localBalance, setLocalBalance] = useState(user.balance);
    const [isWatering, setIsWatering] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [intensity, setIntensity] = useState<1 | 2 | 3>(1); // 1m, 2m, 3m
    const { showToast } = useToast();
    const COST = intensity;

    const handleAction = async (type: 'water' | 'harvest' | 'nurture' | 'song') => {
        const actionCost = type === 'harvest' ? 5 : intensity;
        
        if (localBalance < actionCost) {
            showToast(`Insufficient minutes! Need ${actionCost}m.`, "error");
            return;
        }

        const success = await UserService.deductBalance(actionCost, `Garden: ${type}`);
        if (!success) {
            showToast("Sync failed. Check connection.", "error");
            return;
        }

        setLocalBalance(prev => Math.max(0, prev - actionCost));

        if (type === 'water') {
            setIsWatering(true);
            try {
                const updated = await GardenService.waterPlant(garden.userId);
                if (updated) {
                    setLocalGarden(updated);
                    onUpdate();
                    showToast(`Nourished! (+${intensity * 5} Vitality, -${actionCost}m)`, "success");
                }
            } catch (e) {
                showToast("Garden state out of sync.", "error");
            }
            setTimeout(() => setIsWatering(false), 2000);
        } else if (type === 'harvest') {
            showToast(`Harvested! +100 XP added to resonance profile. (-5m)`, "success");
        } else {
            showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} complete. (+2 XP, -${actionCost}m)`, "info");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#FFFBEB] dark:bg-[#081508] text-gray-900 dark:text-white flex flex-col animate-in fade-in duration-500 overflow-hidden">
            {/* AMBIENT BACKGROUND */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 via-white to-green-100 dark:from-green-900 dark:via-emerald-950 dark:to-black pointer-events-none"></div>
            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] pointer-events-none mix-blend-multiply dark:mix-blend-overlay"></div>

            {/* HEADER */}
            <header className="relative z-10 p-6 flex items-center justify-between border-b border-green-200/30 dark:border-white/5 backdrop-blur-md">
                <button onClick={onClose} className="flex items-center gap-2 text-green-700 dark:text-green-400 font-black uppercase tracking-widest text-[10px] hover:text-green-900 dark:hover:text-green-300 transition-colors">
                    <ChevronLeft className="w-5 h-5" /> Sanctuary
                </button>
                <div className="text-center">
                    <h1 className="text-xl md:text-3xl font-black uppercase tracking-[0.3em] text-green-800 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-green-400 dark:to-emerald-200">
                        Inner Garden
                    </h1>
                    <p className="text-[9px] font-bold text-green-600 dark:text-green-500 uppercase tracking-widest mt-1">
                        Resonance Level {localGarden.level} &bull; {localGarden.currentPlantType}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-black/40 rounded-full border border-green-200 dark:border-green-500/20">
                         <Zap className="w-3 h-3 text-yellow-500" />
                         <span className="text-xs font-black text-green-700 dark:text-green-400">{localBalance}m</span>
                    </div>
                    <button onClick={() => setShowInfo(!showInfo)} className="p-2 border border-green-500/30 rounded-full hover:bg-green-500/10 transition-colors">
                        <Info className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </button>
                </div>
            </header>

            {/* MAIN GARDEN AREA */}
            <main className="flex-1 relative flex flex-col items-center justify-center p-4">
                <div className="relative group">
                    {/* Ring Aura */}
                    <div className="absolute inset-0 -m-12 border-2 border-green-500/10 rounded-full animate-[spin_25s_linear_infinite]"></div>
                    <div className="absolute inset-0 -m-20 border border-emerald-400/5 rounded-full animate-[spin_40s_linear_infinite_reverse]"></div>

                    {/* RAIN EFFECT */}
                    {isWatering && (
                        <div className="absolute inset-0 z-20 pointer-events-none">
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute bg-blue-400/60 w-0.5 h-8 animate-fall"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `-50px`,
                                        animationDelay: `${Math.random() * 0.5}s`
                                    }}
                                ></div>
                            ))}
                        </div>
                    )}

                    <div className="relative z-10 transition-transform duration-1000 transform hover:scale-105 filter drop-shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                        <GardenCanvas garden={localGarden} width={500} height={500} />
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="mt-8 flex flex-col items-center gap-6">
                    <div className="bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-green-200 dark:border-green-500/20 rounded-full p-1 flex items-center gap-1">
                        {[1, 2, 3].map((lvl) => (
                            <button
                                key={lvl}
                                onClick={() => setIntensity(lvl as 1|2|3)}
                                className={`w-12 h-9 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${intensity === lvl ? 'bg-green-600 text-white shadow-lg' : 'text-green-800/40 dark:text-green-500/30 hover:bg-green-50 dark:hover:bg-green-500/10'}`}
                            >
                                {lvl}m
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 px-6">
                        <ActionButton icon={Droplets} label={`Water`} subLabel={`-${intensity}m`} onClick={() => handleAction('water')} active={isWatering} />
                        <ActionButton icon={Leaf} label="Harvest" subLabel="-5m" onClick={() => handleAction('harvest')} color="emerald" />
                        <ActionButton icon={Wind} label="Breathe" subLabel={`-${intensity}m`} onClick={() => handleAction('nurture')} color="blue" />
                        <ActionButton icon={Sparkles} label="Tend" subLabel={`-${intensity}m`} onClick={() => handleAction('song')} color="purple" />
                    </div>
                </div>
            </main>

            {/* FOOTER STATS */}
            <footer className="relative z-10 p-8 grid grid-cols-3 gap-4 border-t border-green-200/30 dark:border-white/5 bg-white/40 dark:bg-black/40 backdrop-blur-md">
                <StatBox label="Soul Streak" value={`${localGarden.streakCurrent} Days`} />
                <StatBox label="Vitality" value="Optimum" />
                <StatBox label="Next Evolution" value="3 Days" />
            </footer>

            {/* INFO PANEL */}
            {showInfo && (
                <div className="absolute inset-0 z-[110] bg-white/95 dark:bg-black/95 p-10 flex flex-col items-center justify-center animate-in slide-in-from-right duration-500">
                    <button onClick={() => setShowInfo(false)} className="absolute top-10 right-10 text-gray-500 hover:text-black dark:text-white/50 dark:hover:text-white"><X className="w-8 h-8" /></button>
                    <div className="max-w-xl text-center space-y-6">
                        <Sprout className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto" />
                        <h2 className="text-3xl font-black uppercase text-green-800 dark:text-green-400">Zen Ecology</h2>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
                            Your garden evolves through daily consistency. By spending minutes of clarity here, you're not just watering a digital plant—you're building a habit of mindfulness that mirrors your emotional growth.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

const ActionButton: React.FC<{ icon: any, label: string, subLabel: string, onClick: () => void, color?: string, active?: boolean }> = ({ icon: Icon, label, subLabel, onClick, color = 'green', active }) => (
    <button
        onClick={onClick}
        disabled={active}
        className={`group flex flex-col items-center gap-2 transition-all hover:translate-y-[-4px] ${active ? 'opacity-50' : ''}`}
    >
        <div className={`p-4 md:p-5 rounded-[1.8rem] border-2 border-${color}-600/20 bg-white dark:bg-${color}-500/10 group-hover:bg-${color}-500/20 shadow-sm group-hover:shadow-lg transition-all`}>
            <Icon className={`w-6 h-6 text-${color}-700 dark:text-${color}-400 group-hover:scale-110 transition-transform`} />
        </div>
        <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-white">{label}</p>
            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500">{subLabel}</p>
        </div>
    </button>
);

const StatBox: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div className="text-center">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm md:text-xl font-black text-green-700 dark:text-green-400 uppercase">{value}</p>
    </div>
);

export default GardenFullView;