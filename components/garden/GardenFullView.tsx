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
    const [tierEffect, setTierEffect] = useState<'growth' | 'ecosystem' | null>(null);
    const [showInfo, setShowInfo] = useState(false);
    const [intensity, setIntensity] = useState<1 | 2 | 3>(1); // 1m, 2m, 3m
    const { showToast } = useToast();
    const COST = intensity;

    const handleWater = async () => {
        setIsWatering(true);

        // Tier Effect Logic
        if (intensity === 2) setTierEffect('growth');
        if (intensity === 3) setTierEffect('ecosystem');

        if (user.balance < COST) {
            showToast(`Not enough minutes. Need ${COST}m.`, "error");
            setIsWatering(false);
            setTierEffect(null);
            return;
        }
        const success = await UserService.deductBalance(COST, "Garden Water");

        if (success) {
            try {
                // Scaled Water effect
                const updated = await GardenService.waterPlant(garden.userId);
                if (updated) {
                    setLocalGarden(updated);
                    onUpdate();
                    showToast(`Garden Watered! (-${COST}m)`, "success");
                }
            } catch (e) {
                // Refund conceptually, but for now just show error
                showToast("Failed to sync garden state.", "error");
            }
        } else {
            showToast(`Not enough minutes. Need ${COST}m.`, "error");
        }
        setTimeout(() => { setIsWatering(false); setTierEffect(null); }, 2000);
    };

    const handleHarvest = async () => {
        const harvestCost = 5;
        const success = await UserService.deductBalance(harvestCost, "Garden Harvest");
        if (success) {
            // Logic for harvest (XP gain would go here)
            // For now, visual feedback
            showToast(`Harvested! +50 XP (-${harvestCost}m)`, "success");
            // Optionally reset plant or evolve
        } else {
            showToast(`Harvest requires ${harvestCost}m.`, "error");
        }
    };

    const handleNurture = async (action: 'breath' | 'sing') => {
        const success = await UserService.deductBalance(COST, action === 'breath' ? "Garden Breath" : "Garden Song");
        if (success) {
            showToast(action === 'breath' ? `Deep breath taken. (-${COST}m)` : `Sang to the garden. (-${COST}m)`, "success");
        } else {
            showToast(`Not enough minutes. Need ${COST}m.`, "error");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#0c1f13] text-white flex flex-col animate-in fade-in duration-500 overflow-hidden">
            {/* NATURE AMBIENT BACKGROUND */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-900/50 to-[#0c1f13] pointer-events-none"></div>
            {/* Fireflies/Particles */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.6)]"
                        style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s`, opacity: 0.6 }}></div>
                ))}
            </div>

            {/* Natural Glow Orbs */}
            <div className="absolute top-[-20%] left-1/4 w-[500px] h-[500px] bg-green-500/20 blur-[150px] rounded-full pointer-events-none mix-blend-screen"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen"></div>

            {/* HEADER */}
            <header className="relative z-10 p-6 flex items-center justify-between">
                <button onClick={onClose} className="flex items-center gap-2 text-emerald-100 font-bold hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 backdrop-blur-md">
                    <ChevronLeft className="w-5 h-5" /> Back to Dashboard
                </button>
                <div className="text-center">
                    <h1 className="text-xl md:text-3xl font-black uppercase tracking-[0.3em] text-emerald-100 drop-shadow-md">
                        Inner Garden
                    </h1>
                    <p className="text-[10px] md:text-xs font-bold text-yellow-200 uppercase tracking-widest mt-1">Level {localGarden.level} &bull; {localGarden.currentPlantType}</p>
                </div>
                <button onClick={() => setShowInfo(!showInfo)} className="p-2 border border-white/20 bg-white/10 hover:bg-white/20 transition-colors rounded-full text-emerald-100">
                    <Info className="w-5 h-5" />
                </button>
            </header>

            {/* MAIN GARDEN AREA */}
            <main className="flex-1 relative flex flex-col items-center justify-center p-4">
                <div className="relative group">
                    {/* Natural Glow Halo */}
                    <div className="absolute inset-0 -m-12 bg-white/5 rounded-full blur-3xl animate-pulse"></div>

                    {/* RAIN EFFECT DURING WATERING */}
                    {isWatering && (
                        <div className="absolute inset-0 z-20 pointer-events-none">
                            {[...Array(intensity * 15)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`absolute w-[1px] h-6 animate-fall bg-blue-300/60`}
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

                    {/* TIER 2: GROWTH GLOW */}
                    {tierEffect === 'growth' && (
                        <div className="absolute inset-0 z-10 bg-yellow-400/20 blur-3xl animate-pulse pointer-events-none mix-blend-overlay"></div>
                    )}

                    {/* TIER 3: ECOSYSTEM (BUTTERFLIES) */}
                    {tierEffect === 'ecosystem' && (
                        <div className="absolute inset-0 z-20 pointer-events-none">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="absolute w-2 h-2 bg-yellow-300 rounded-full blur-[1px] animate-float shadow-[0_0_10px_rgba(253,224,71,0.5)]"
                                    style={{
                                        left: `${20 + Math.random() * 60}%`,
                                        top: `${40 + Math.random() * 40}%`,
                                        animationDuration: `${2 + Math.random()}s`
                                    }}
                                ></div>
                            ))}
                        </div>
                    )}

                    <div className="relative z-10 transition-transform duration-1000 transform hover:scale-105 filter drop-shadow-2xl">
                        <GardenCanvas garden={localGarden} width={500} height={500} />
                    </div>
                </div>

                {/* INTENSITY TOGGLE */}
                <div className="relative z-20 flex justify-center pb-8 mt-8">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-1.5 flex items-center gap-1 rounded-full">
                        <span className="text-[9px] font-black uppercase text-emerald-100 px-3 tracking-widest hidden md:block">Nurture Depth</span>
                        {[1, 2, 3].map((level) => (
                            <button
                                key={level}
                                onClick={() => setIntensity(level as 1 | 2 | 3)}
                                className={`w-10 h-8 md:w-12 md:h-10 flex items-center justify-center text-[10px] md:text-xs font-black transition-all border border-transparent rounded-full ${intensity === level ? 'bg-emerald-500 text-white shadow-lg' : 'text-emerald-100/70 hover:bg-white/10'}`}
                            >
                                {level}m
                            </button>
                        ))}
                    </div>
                </div>

                {/* INTERACTIVE CONTROLS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 relative z-10 px-6 pb-8">
                    <ActionButton icon={Droplets} label={`Hydrate (-${COST}m)`} onClick={handleWater} active={isWatering} />
                    <ActionButton icon={Wind} label={`Breath (-${COST}m)`} onClick={() => handleNurture('breath')} />
                    <ActionButton icon={Heart} label={`Sing (-${COST}m)`} onClick={() => handleNurture('sing')} />
                    <ActionButton icon={Leaf} label="Harvest (-5m)" onClick={handleHarvest} />
                </div>
            </main>

            {/* FOOTER STATS */}
            <footer className="relative z-10 p-6 md:p-8 grid grid-cols-3 gap-4 border-t border-white/10 bg-black/40 backdrop-blur-md">
                <StatBox label="Streak" value={`${localGarden.streakCurrent} Days`} />
                <StatBox label="Vitality" value="98%" />
                <StatBox label="Phase" value="Bloom" />
            </footer>

            {/* INFO PANEL */}
            {showInfo && (
                <div className="absolute inset-0 z-[110] bg-[#0c1f13]/95 p-10 flex flex-col items-center justify-center animate-in slide-in-from-right duration-500 backdrop-blur-xl">
                    <button onClick={() => setShowInfo(false)} className="absolute top-10 right-10 text-white/50 hover:text-white"><X className="w-8 h-8" /></button>
                    <div className="max-w-xl text-center space-y-6">
                        <Sprout className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                        <h2 className="text-3xl font-black uppercase text-white tracking-widest">Natural Balance</h2>
                        <p className="text-gray-300 leading-relaxed font-sans text-sm">
                            Your inner garden interprets your daily data. Consistent input harmonizes the system. Evolution is inevitable with persistence.
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-left">
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                <h4 className="font-bold text-emerald-400 text-sm mb-1 uppercase tracking-wider">Watering</h4>
                                <p className="text-xs text-gray-400">Maintain streak to evolve through 5 stages.</p>
                            </div>
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                <h4 className="font-bold text-emerald-400 text-sm mb-1 uppercase tracking-wider">Growth</h4>
                                <p className="text-xs text-gray-400">Spend time to nurture deeper roots.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ActionButton: React.FC<{ icon: any, label: string, onClick: () => void, active?: boolean }> = ({ icon: Icon, label, onClick, active }) => (
    <button
        onClick={onClick}
        disabled={active}
        className={`group flex flex-col items-center gap-2 transition-all hover:-translate-y-2 ${active ? 'opacity-50 grayscale' : ''}`}
    >
        <div className={`p-4 md:p-5 rounded-[2rem] border-2 border-white/10 bg-white/5 shadow-lg group-hover:bg-white/10 group-hover:border-white/30 transition-all`}>
            <Icon className={`w-6 h-6 text-white group-hover:scale-110 transition-transform`} />
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-100 drop-shadow-md bg-black/40 px-3 py-1 rounded-full border border-white/10">{label}</span>
    </button>
);

const StatBox: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div className="text-center border-r border-white/10 last:border-0">
        <p className="text-[8px] md:text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm md:text-xl font-black text-white">{value}</p>
    </div>
);

export default GardenFullView;