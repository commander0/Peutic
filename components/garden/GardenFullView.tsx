import React, { useState } from 'react';
import { X, Droplets, Leaf, Sprout, Wind, Heart, Info, ChevronLeft } from 'lucide-react';
import GardenCanvas from './GardenCanvas';
import { GardenState } from '../../types';
import { GardenService } from '../../services/gardenService';
import { useToast } from '../common/Toast';

interface GardenFullViewProps {
    garden: GardenState;
    onClose: () => void;
    onUpdate: () => void;
}

const GardenFullView: React.FC<GardenFullViewProps> = ({ garden, onClose, onUpdate }) => {
    const [localGarden, setLocalGarden] = useState(garden);
    const [isWatering, setIsWatering] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const { showToast } = useToast();

    const handleWater = async () => {
        setIsWatering(true);
        try {
            const updated = await GardenService.waterPlant(garden.userId);
            if (updated) {
                setLocalGarden(updated);
                onUpdate();
                showToast("Garden Watered! +1 Vitality", "success");
            }
        } catch (e) {
            showToast("Failed to water garden.", "error");
        } finally {
            setTimeout(() => setIsWatering(false), 2000);
        }
    };

    const handleFertilize = () => {
        showToast("Fertilized! Growth speed boosted visually.", "success");
        // Mocking local level jump for visual feedback
        setLocalGarden(prev => ({ ...prev, level: Math.min(5, prev.level + 1) }));
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#081508] text-white flex flex-col animate-in fade-in duration-500 overflow-hidden">
            {/* AMBIENT BACKGROUND */}
            <div className="absolute inset-0 bg-gradient-to-b from-green-950 via-[#081508] to-black pointer-events-none"></div>
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] pointer-events-none"></div>

            {/* OVERLAY GLOWS */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full animate-pulse delay-1000"></div>

            {/* HEADER */}
            <header className="relative z-10 p-6 flex items-center justify-between">
                <button onClick={onClose} className="flex items-center gap-2 text-green-400 font-bold hover:text-green-300 transition-colors">
                    <ChevronLeft className="w-5 h-5" /> Back to Sanctuary
                </button>
                <div className="text-center">
                    <h1 className="text-xl md:text-3xl font-black uppercase tracking-[0.3em] text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]">
                        Inner Garden
                    </h1>
                    <p className="text-[10px] md:text-xs font-bold text-green-600 uppercase tracking-widest mt-1">Level {localGarden.level} &bull; {localGarden.currentPlantType} Ecosystem</p>
                </div>
                <button onClick={() => setShowInfo(!showInfo)} className="p-2 border border-green-500/30 rounded-full hover:bg-green-500/10 transition-colors">
                    <Info className="w-5 h-5 text-green-500" />
                </button>
            </header>

            {/* MAIN GARDEN AREA */}
            <main className="flex-1 relative flex flex-col items-center justify-center p-4">
                <div className="relative group">
                    {/* RING AURA */}
                    <div className="absolute inset-0 -m-12 border border-green-500/10 rounded-full animate-[spin_20s_linear_infinite]"></div>
                    <div className="absolute inset-0 -m-20 border border-green-500/5 rounded-full animate-[spin_30s_linear_infinite_reverse]"></div>

                    {/* RAIN EFFECT DURING WATERING */}
                    {isWatering && (
                        <div className="absolute inset-0 z-20 pointer-events-none">
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute bg-blue-400/60 w-0.5 h-4 animate-fall"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `-50px`,
                                        animationDelay: `${Math.random() * 2}s`,
                                        animationDuration: '0.8s'
                                    }}
                                ></div>
                            ))}
                        </div>
                    )}

                    <div className="relative z-10 transition-transform duration-1000 transform hover:scale-105">
                        <GardenCanvas garden={localGarden} width={500} height={500} />
                    </div>
                </div>

                {/* INTERACTIVE CONTROLS */}
                <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 relative z-10">
                    <ActionButton icon={Droplets} label="Water" onClick={handleWater} active={isWatering} />
                    <ActionButton icon={Leaf} label="Fertilize" onClick={handleFertilize} color="emerald" />
                    <ActionButton icon={Wind} label="Breath" onClick={() => showToast("Deep breath taken with the garden.", "info")} color="blue" />
                    <ActionButton icon={Heart} label="Care" onClick={() => showToast("Sent love to your sanctuary.", "success")} color="pink" />
                </div>
            </main>

            {/* FOOTER STATS */}
            <footer className="relative z-10 p-8 grid grid-cols-3 gap-4 border-t border-green-500/10 bg-black/40 backdrop-blur-md">
                <StatBox label="Streak" value={`${localGarden.streakCurrent} Days`} />
                <StatBox label="Vitality" value="98%" />
                <StatBox label="Next Bloom" value="4 Days" />
            </footer>

            {/* INFO PANEL */}
            {showInfo && (
                <div className="absolute inset-0 z-[110] bg-black/95 p-10 flex flex-col items-center justify-center animate-in slide-in-from-right duration-500">
                    <button onClick={() => setShowInfo(false)} className="absolute top-10 right-10 text-white/50 hover:text-white"><X className="w-8 h-8" /></button>
                    <div className="max-w-xl text-center space-y-6">
                        <Sprout className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-3xl font-black uppercase">Garden Wisdom</h2>
                        <p className="text-gray-400 leading-relaxed">
                            Your inner garden reflects your daily presence. By checking in, watering, and caring for this space, you harmonize your mental state. As the plant evolves, so does your capacity for resilience and mindfulness.
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-left">
                            <div className="p-4 bg-white/5 rounded-2xl">
                                <h4 className="font-bold text-green-400 text-sm mb-1">Watering</h4>
                                <p className="text-xs text-gray-500">Maintain your streak to help the plant evolve through its 5 growth stages.</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl">
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
        <div className={`p-5 rounded-full border-2 border-${color}-500/30 bg-${color}-500/10 group-hover:bg-${color}-500/20 group-hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all`}>
            <Icon className={`w-6 h-6 text-${color}-400 group-hover:scale-110 transition-transform`} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">{label}</span>
    </button>
);

const StatBox: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div className="text-center">
        <p className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm md:text-xl font-black text-green-400">{value}</p>
    </div>
);

export default GardenFullView;
