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
        <div className="fixed inset-0 z-[100] bg-[#081508] text-white flex flex-col animate-in fade-in duration-500 overflow-hidden">
            {/* CYBERPUNK AMBIENT BACKGROUND */}
            <div className="absolute inset-0 bg-[#050505] pointer-events-none"></div>
            {/* Dark Grid with Neon Glow */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,127,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,127,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none perspective-500 transform-gpu opacity-60"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#00ff80]/10 via-transparent to-transparent pointer-events-none"></div>

            {/* CYBERPUNK OVERLAYS */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black to-transparent pointer-events-none z-0"></div>

            {/* Neon Orbs */}
            <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-[#00ff80]/10 blur-[100px] rounded-full animate-pulse-slow pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#d946ef]/10 blur-[120px] rounded-full animate-pulse-slow delay-1000 pointer-events-none"></div>

            {/* HEADER */}
            <header className="relative z-10 p-6 flex items-center justify-between">
                <button onClick={onClose} className="flex items-center gap-2 text-[#00ff80] font-bold hover:text-[#50ffb0] transition-colors bg-black/60 px-4 py-2 rounded-none border border-[#00ff80]/30 hover:border-[#00ff80]/80 shadow-[0_0_10px_rgba(0,255,128,0.2)]">
                    <ChevronLeft className="w-5 h-5" /> Back to Matrix
                </button>
                <div className="text-center">
                    <h1 className="text-xl md:text-3xl font-black uppercase tracking-[0.3em] text-[#00ff80] drop-shadow-[0_0_10px_rgba(0,255,128,0.8)] glitch-text">
                        Inner Garden
                    </h1>
                    <p className="text-[10px] md:text-xs font-bold text-[#d946ef] uppercase tracking-widest mt-1 drop-shadow-[0_0_5px_rgba(217,70,239,0.8)]">Level {localGarden.level} &bull; {localGarden.currentPlantType} Node</p>
                </div>
                <button onClick={() => setShowInfo(!showInfo)} className="p-2 border border-[#00ff80]/30 bg-black/60 hover:bg-[#00ff80]/20 transition-colors shadow-[0_0_10px_rgba(0,255,128,0.2)]">
                    <Info className="w-5 h-5 text-[#00ff80]" />
                </button>
            </header>

            {/* MAIN GARDEN AREA */}
            <main className="flex-1 relative flex flex-col items-center justify-center p-4">
                <div className="relative group perspective-1000">
                    {/* Cyber Rings */}
                    <div className="absolute inset-0 -m-12 border-2 border-[#00ff80]/20 rounded-full animate-[spin_20s_linear_infinite] shadow-[0_0_20px_rgba(0,255,128,0.1)]"></div>
                    <div className="absolute inset-0 -m-16 border border-[#d946ef]/30 rounded-full animate-[spin_25s_linear_infinite_reverse] border-dashed shadow-[0_0_15px_rgba(217,70,239,0.2)]"></div>
                    <div className="absolute inset-0 -m-24 border border-cyan-500/20 rounded-full animate-[spin_40s_linear_infinite]"></div>

                    {/* Digital Particles */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="absolute w-1 h-1 bg-[#00ff80] shadow-[0_0_5px_#00ff80] animate-pulse" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${i * 0.5}s` }}></div>
                        ))}
                    </div>

                    {/* RAIN EFFECT DURING WATERING */}
                    {isWatering && (
                        <div className="absolute inset-0 z-20 pointer-events-none">
                            {[...Array(intensity * 15)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`absolute w-[1px] h-8 animate-fall shadow-[0_0_8px_rgba(0,255,255,0.8)] ${tierEffect === 'ecosystem' ? 'bg-cyan-400' : 'bg-[#00ff80]'}`}
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `-50px`,
                                        animationDelay: `${Math.random() * 0.5}s`,
                                        animationDuration: '0.4s'
                                    }}
                                ></div>
                            ))}
                        </div>
                    )}

                    {/* TIER 2: GROWTH GLOW */}
                    {tierEffect === 'growth' && (
                        <div className="absolute inset-0 z-10 bg-[#00ff80]/10 blur-3xl animate-pulse pointer-events-none mix-blend-screen"></div>
                    )}

                    {/* TIER 3: ECOSYSTEM (DIGITAL BUTTERFLIES) */}
                    {tierEffect === 'ecosystem' && (
                        <div className="absolute inset-0 z-20 pointer-events-none">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="absolute w-2 h-2 border border-[#d946ef] bg-[#d946ef]/50 blur-[1px] animate-float shadow-[0_0_10px_#d946ef]"
                                    style={{
                                        left: `${20 + Math.random() * 60}%`,
                                        top: `${40 + Math.random() * 40}%`,
                                        animationDuration: `${2 + Math.random()}s`
                                    }}
                                ></div>
                            ))}
                        </div>
                    )}

                    <div className="relative z-10 transition-transform duration-1000 transform hover:scale-105 filter drop-shadow-[0_0_20px_rgba(0,255,128,0.3)]">
                        <GardenCanvas garden={localGarden} width={500} height={500} />
                    </div>
                </div>

                {/* INTENSITY TOGGLE */}
                <div className="relative z-20 flex justify-center pb-8 mt-8">
                    <div className="bg-black/80 backdrop-blur-xl border border-[#00ff80]/30 p-1.5 flex items-center gap-1 shadow-[0_0_20px_rgba(0,255,128,0.1)] clip-path-polygon">
                        <span className="text-[9px] font-black uppercase text-[#00ff80] px-3 tracking-widest hidden md:block">Nurture Protocol</span>
                        {[1, 2, 3].map((level) => (
                            <button
                                key={level}
                                onClick={() => setIntensity(level as 1 | 2 | 3)}
                                className={`w-10 h-8 md:w-12 md:h-10 flex items-center justify-center text-[10px] md:text-xs font-black transition-all border border-transparent ${intensity === level ? 'bg-[#00ff80] text-black shadow-[0_0_15px_#00ff80]' : 'text-[#00ff80]/50 hover:bg-[#00ff80]/10 hover:border-[#00ff80]/30'}`}
                            >
                                {level}m
                            </button>
                        ))}
                    </div>
                </div>

                {/* INTERACTIVE CONTROLS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 relative z-10 px-6 pb-8">
                    <ActionButton icon={Droplets} label={`Hydrate (-${COST}m)`} onClick={handleWater} active={isWatering} />
                    <ActionButton icon={Wind} label={`Breath (-${COST}m)`} onClick={() => handleNurture('breath')} color="blue" />
                    <ActionButton icon={Heart} label={`Sing (-${COST}m)`} onClick={() => handleNurture('sing')} color="pink" />
                    <ActionButton icon={Leaf} label="Harvest (-5m)" onClick={handleHarvest} color="emerald" />
                </div>
            </main>

            {/* FOOTER STATS */}
            <footer className="relative z-10 p-6 md:p-8 grid grid-cols-3 gap-4 border-t border-[#00ff80]/20 bg-black/90 backdrop-blur-xl">
                <StatBox label="Streak" value={`${localGarden.streakCurrent} Days`} />
                <StatBox label="Vitality" value="98%" />
                <StatBox label="Phase" value="Bloom" />
            </footer>

            {/* INFO PANEL (Cyberpunk) */}
            {showInfo && (
                <div className="absolute inset-0 z-[110] bg-black/95 p-10 flex flex-col items-center justify-center animate-in slide-in-from-right duration-500 border-l-2 border-[#00ff80]">
                    <button onClick={() => setShowInfo(false)} className="absolute top-10 right-10 text-[#00ff80]/50 hover:text-[#00ff80]"><X className="w-8 h-8" /></button>
                    <div className="max-w-xl text-center space-y-6">
                        <Sprout className="w-16 h-16 text-[#00ff80] mx-auto mb-4 drop-shadow-[0_0_15px_#00ff80]" />
                        <h2 className="text-3xl font-black uppercase text-[#00ff80] tracking-widest">System Wisdom</h2>
                        <p className="text-gray-400 leading-relaxed font-mono text-sm">
                            Your inner garden interprets your daily data. Consistent input harmonizes the system. Evolution is inevitable with persistence.
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-left">
                            <div className="p-4 bg-[#00ff80]/5 border border-[#00ff80]/20">
                                <h4 className="font-bold text-[#00ff80] text-sm mb-1 uppercase tracking-wider">Watering Protocol</h4>
                                <p className="text-xs text-gray-500 font-mono">Maintain streak to evolve through 5 stages.</p>
                            </div>
                            <div className="p-4 bg-[#00ff80]/5 border border-[#00ff80]/20">
                                <h4 className="font-bold text-[#00ff80] text-sm mb-1 uppercase tracking-wider">Spirit Node</h4>
                                <p className="text-xs text-gray-500 font-mono">The floating wisp represents focus stability.</p>
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
        <div className={`p-4 md:p-5 border-2 border-[#00ff80]/30 bg-black/80 shadow-[0_0_15px_rgba(0,255,128,0.1)] group-hover:bg-[#00ff80]/10 group-hover:shadow-[0_0_30px_rgba(0,255,128,0.3)] group-hover:border-[#00ff80] transition-all clip-path-polygon`}>
            <Icon className={`w-6 h-6 text-[#00ff80] group-hover:scale-110 transition-transform`} />
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-[#00ff80] drop-shadow-md bg-black/80 px-2 py-0.5 border border-[#00ff80]/20">{label}</span>
    </button>
);

const StatBox: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div className="text-center border-r border-[#00ff80]/10 last:border-0">
        <p className="text-[8px] md:text-[10px] font-black text-[#d946ef] uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm md:text-xl font-black text-[#00ff80] drop-shadow-[0_0_5px_rgba(0,255,128,0.5)]">{value}</p>
    </div>
);

export default GardenFullView;