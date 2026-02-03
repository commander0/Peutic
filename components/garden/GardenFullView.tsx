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

    // 3D TILT STATE
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        // Dampen the tilt
        setTilt({ x: x * 20, y: y * 20 });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };

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
        <div
            className="fixed inset-0 z-[100] bg-[#051105] text-white flex flex-col animate-in fade-in duration-700 overflow-hidden perspective-1000"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* AMBIENT BACKGROUND LAYERS (PARALLAX 1) */}
            <div
                className="absolute inset-0 bg-gradient-to-b from-[#0a1f0f] via-[#051006] to-black pointer-events-none transition-transform duration-200 ease-out"
                style={{ transform: `translateX(${tilt.x * -1}px) translateY(${tilt.y * -1}px) scale(1.05)` }}
            >
            </div>

            {/* NOISE OVERLAY */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none mix-blend-overlay"></div>

            {/* ATMOSPHERIC GLOWS (PARALLAX 2) */}
            <div
                className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-green-500/10 blur-[150px] rounded-full animate-pulse-slow pointer-events-none transition-transform duration-300 ease-out"
                style={{ transform: `translateX(${tilt.x * -2}px) translateY(${tilt.y * -2}px)` }}
            ></div>

            {/* HEADER */}
            <header className="relative z-50 p-6 flex items-center justify-between pointer-events-auto">
                <button onClick={onClose} className="flex items-center gap-2 text-green-400 font-bold hover:text-green-300 transition-colors bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-green-500/20 hover:border-green-400/50">
                    <ChevronLeft className="w-5 h-5" /> Sanctuary
                </button>
                <div className="text-center">
                    <h1 className="text-2xl md:text-4xl font-black uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-emerald-200 to-teal-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.6)]">
                        Inner Garden
                    </h1>
                    <p className="text-[10px] md:text-xs font-bold text-green-500/80 uppercase tracking-widest mt-1">Level {localGarden.level} &bull; {localGarden.currentPlantType} Life</p>
                </div>
                <button onClick={() => setShowInfo(!showInfo)} className="p-2 border border-green-500/30 bg-black/40 rounded-full hover:bg-green-500/10 transition-colors backdrop-blur-md">
                    <Info className="w-5 h-5 text-green-500" />
                </button>
            </header>

            {/* MAIN GARDEN AREA 3D CONTAINER */}
            <main className="flex-1 relative flex flex-col items-center justify-center p-4 perspective-container" ref={containerRef}>
                <div
                    className="relative group transition-transform duration-100 ease-out"
                    style={{
                        transform: `rotateX(${-tilt.y}deg) rotateY(${tilt.x}deg)`,
                        transformStyle: 'preserve-3d'
                    }}
                >
                    {/* Ring Aura - Back Layer */}
                    <div className="absolute inset-0 -m-12 border-4 border-green-500/5 rounded-full animate-[spin_30s_linear_infinite]" style={{ transform: 'translateZ(-50px)' }}></div>
                    <div className="absolute inset-0 -m-24 border border-teal-300/5 rounded-full animate-[spin_50s_linear_infinite]" style={{ transform: 'translateZ(-100px)' }}></div>

                    {/* Rain Effect */}
                    {isWatering && (
                        <div className="absolute inset-0 z-40 pointer-events-none" style={{ transform: 'translateZ(100px)' }}>
                            {[...Array(intensity * 20)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`absolute w-0.5 h-8 animate-fall shadow-[0_0_8px_rgba(147,197,253,0.9)] ${tierEffect === 'ecosystem' ? 'bg-cyan-300' : 'bg-blue-300'}`}
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `-100px`,
                                        animationDelay: `${Math.random() * 0.4}s`,
                                        animationDuration: '0.8s'
                                    }}
                                ></div>
                            ))}
                        </div>
                    )}

                    {/* Ecosystem Particles */}
                    {tierEffect === 'ecosystem' && (
                        <div className="absolute inset-0 z-30 pointer-events-none" style={{ transform: 'translateZ(50px)' }}>
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="absolute w-2 h-2 bg-yellow-300/80 rounded-full blur-[2px] animate-float shadow-[0_0_10px_rgba(253,224,71,0.6)]"
                                    style={{
                                        left: `${10 + Math.random() * 80}%`,
                                        top: `${20 + Math.random() * 60}%`,
                                        animationDuration: `${3 + Math.random() * 2}s`
                                    }}
                                ></div>
                            ))}
                        </div>
                    )}

                    {/* THE GARDEN CANVAS - Centerpiece */}
                    <div className="relative z-20 filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform-gpu">
                        <GardenCanvas garden={localGarden} width={550} height={550} interactionType={isWatering ? 'water' : null} />
                    </div>

                    {/* Foreground Elements (Floating Runes/Dust) */}
                    <div className="absolute inset-0 pointer-events-none" style={{ transform: 'translateZ(80px)' }}>
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${i * 0.5}s`
                                }}>
                            </div>
                        ))}
                    </div>
                </div>

                {/* INTENSITY SLIDER */}
                <div className="relative z-50 flex justify-center pb-8 mt-12">
                    <div className="bg-black/60 backdrop-blur-2xl border border-green-500/20 rounded-full p-2 flex items-center gap-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                        <span className="text-[10px] font-black uppercase text-green-500/70 px-3 tracking-widest hidden md:block">Investment</span>
                        {[1, 2, 3].map((level) => (
                            <button
                                key={level}
                                onClick={() => setIntensity(level as 1 | 2 | 3)}
                                className={`w-12 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${intensity === level ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)] scale-110' : 'text-green-500/40 hover:bg-green-500/10 hover:text-green-400'}`}
                            >
                                {level}m
                            </button>
                        ))}
                    </div>
                </div>

                {/* ACTION ARRAY */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 relative z-50 px-6 pb-8 w-full max-w-4xl">
                    <ActionButton icon={Droplets} label={`Hydrate (-${COST}m)`} onClick={handleWater} active={isWatering} />
                    <ActionButton icon={Wind} label={`Breath (-${COST}m)`} onClick={() => handleNurture('breath')} color="blue" />
                    <ActionButton icon={Heart} label={`Sing (-${COST}m)`} onClick={() => handleNurture('sing')} color="pink" />
                    <ActionButton icon={Leaf} label="Harvest (-5m)" onClick={handleHarvest} color="emerald" />
                </div>
            </main>

            {/* FOOTER STATS */}
            <footer className="relative z-50 p-6 md:p-8 grid grid-cols-3 gap-4 border-t border-green-500/10 bg-black/60 backdrop-blur-xl">
                <StatBox label="Streak" value={`${localGarden.streakCurrent} Days`} />
                <StatBox label="Vitality" value="98%" />
                <StatBox label="Bio-Phase" value="Bloom" />
            </footer>

            {/* INFO PANEL */}
            {showInfo && (
                <div className="absolute inset-0 z-[110] bg-black/95 p-10 flex flex-col items-center justify-center animate-in slide-in-from-right duration-500">
                    <button onClick={() => setShowInfo(false)} className="absolute top-10 right-10 text-white/50 hover:text-white"><X className="w-8 h-8" /></button>
                    <div className="max-w-xl text-center space-y-6">
                        <Sprout className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-3xl font-black uppercase text-green-400">Zen Logic</h2>
                        <p className="text-gray-400 leading-relaxed">
                            This space is a visual anchor for your mind. The 3D depth reacts to your presence, reminding you that your attention shapes your reality.
                        </p>
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