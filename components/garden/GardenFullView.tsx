import React, { useState, useEffect, useMemo } from 'react';
import { Droplets, Wind, Info, ChevronLeft, Music, Scissors, X, Sprout, Sparkles } from 'lucide-react';
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
    const [showPlantSelection, setShowPlantSelection] = useState(false);
    const [selectedNewPlant, setSelectedNewPlant] = useState<string | null>(null);
    const [intensity, setIntensity] = useState<1 | 2 | 3>(1); // 1m, 2m, 3m
    const { showToast } = useToast();
    const [availablePlants, setAvailablePlants] = useState<string[]>(['Lotus', 'Rose', 'Sunflower', 'Fern', 'Sakura', 'Oak', 'Willow', 'Bonsai']);
    const [weather, setWeather] = useState<'sun' | 'rain'>('sun');

    // Weather/Day gamification injection
    useEffect(() => {
        const basePlants = ['Lotus', 'Rose', 'Sunflower', 'Fern', 'Sakura', 'Oak', 'Willow', 'Bonsai'];
        const day = new Date().getDay();
        const rand = Math.random();

        // Inject Rare Phenotypes based on conditions
        if (day === 0 || rand > 0.8) basePlants.push('Sunlight Spire'); // Sunday or 20% chance
        if (day === 6 || rand > 0.9) basePlants.push('Storm Oak'); // Saturday or 10% chance
        if (day === 1 || rand > 0.85) basePlants.push('Lunar Fern'); // Monday or 15% chance
        if (rand > 0.95) basePlants.push('Crystal Lotus'); // 5% flat chance for the ultra-rare

        setAvailablePlants([...new Set(basePlants)]); // Ensure uniqueness
    }, [showPlantSelection]); // Re-calculate luck every time the selection screen opens

    // Map the current garden minutes to a Gamification Stage
    const stage = useMemo(() => {
        const fm = localGarden.focusMinutes || 0;
        if (fm >= 6) return 6; // Ethereal Entity
        if (fm >= 5) return 5;  // Mystic Guardian
        if (fm >= 4) return 4;  // Ancient Tree
        if (fm >= 3) return 3;  // Mature Tree
        if (fm >= 2) return 2;  // Sapling
        if (fm >= 1) return 1;  // Sprout
        return 0; // Seed
    }, [localGarden.focusMinutes]);

    const isRare = useMemo(() => ['Crystal Lotus', 'Lunar Fern', 'Storm Oak', 'Sunlight Spire'].includes(localGarden.currentPlantType), [localGarden.currentPlantType]);

    // Generate stable random particle positions to prevent DOM jitter during re-renders
    const particles = useMemo(() => {
        const count = stage >= 5 ? 30 : stage >= 3 ? 20 : 10;
        return Array.from({ length: count }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            delay: `${Math.random() * 5}s`,
            duration: `${Math.random() * 3 + 2}s`,
            opacity: Math.random() * 0.5 + 0.2,
            scale: Math.random() * 0.5 + 0.5,
            isLeaf: Math.random() > 0.7 && stage >= 3
        }));
    }, [stage]);

    // Eliminate Cached Ghosts: Always fetch fresh state on mount
    useEffect(() => {
        let mounted = true;
        const fetchFreshState = async () => {
            const freshData = await GardenService.getGarden(user.id);
            if (freshData && mounted) {
                setLocalGarden(freshData);
            }
            // Fetch Weather Sync based on recent moods
            const moods = await UserService.getMoods(user.id);
            if (moods.length > 0 && mounted) {
                const sunCount = moods.filter(x => ['Happy', 'Calm', 'confetti', 'sun'].includes(x.mood as any)).length;
                setWeather((sunCount / moods.length) >= 0.5 ? 'sun' : 'rain');
            }
        };
        fetchFreshState();
        return () => { mounted = false; };
    }, [user.id]);

    const handleAction = async (type: 'water' | 'breath' | 'sing' | 'harvest') => {
        // Trigger Visuals
        if (type !== 'harvest') {
            setInteraction(type);
            setTimeout(() => setInteraction(null), 4000); // Effect duration
        }

        // Perform Service Action
        if (type === 'water') {
            const hasEnough = await UserService.deductBalance(intensity, "Watering Garden");
            if (!hasEnough) {
                showToast(`Not enough focus minutes to water (-${intensity}m required).`, "error");
                setInteraction(null);
                return;
            }
            await GardenService.waterPlant(garden.userId, intensity);
            await GardenService.addFocusMinutes(garden.userId, intensity);
            showToast(`You watered your sanctuary (-${intensity}m).`, "success");
        } else if (type === 'harvest') {
            const isMighty = stage === 6; // Stage 6 is Ethereal Entity (6+ minutes)
            const result = await GardenService.clipPlant(garden.userId);
            if (result.success) {
                if (isMighty) {
                    const updatedUser = {
                        ...user,
                        balance: (user.balance || 0) + 100,
                        oracleTokens: (user.oracleTokens || 0) + 1
                    };
                    await UserService.updateUser(updatedUser);
                    showToast(`Ascended! You received an Oracle Token and 100 Serenity Coins!`, "success");
                    setShowPlantSelection(true);
                } else {
                    showToast(`Harvested! The seed returns to the earth.`, "success");
                    setShowPlantSelection(true);
                }
            } else {
                showToast(result.message || "Failed to harvest.", "error");
            }
        } else {
            // Breath / Sing are now free ambient interactions
            showToast(`Shared ${type} with garden.`, "success");
        }

        // Fetch fresh state to reflect growth
        const freshData = await GardenService.getGarden(user.id);
        if (freshData) setLocalGarden(freshData);

        onUpdate();
    };

    const [hasWeeds, setHasWeeds] = useState(() => {
        // Weeds appear if the user lost their streak and their garden had progressed somewhat (e.g. at least level 2/3)
        return user.streak === 0 && localGarden.focusMinutes >= 3;
    });

    const handleClearWeeds = async () => {
        const cost = 5;
        const hasEnough = await UserService.deductBalance(cost, "Cleared Garden Weeds");
        if (!hasEnough) {
            showToast(`Not enough focus to clear weeds (-${cost}m required).`, "error");
            return;
        }
        setHasWeeds(false);
        showToast("Weeds cleared! Your garden can breathe again.", "success");
        onUpdate();
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden bg-[#050a05] text-white animate-in fade-in duration-700">

            {/* --- ATMOSPHERIC LAYERS --- */}

            {/* 1. Deep Space / Night Sky Gradient OR Dark Rain Layer */}
            {weather === 'sun' ? (
                <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#064e3b] to-[#022c22] opacity-80 pointer-events-none" />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-950 opacity-90 pointer-events-none" />
            )}

            {/* 2. Moving Fog / Mist */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/foggy-birds.png')] opacity-30 animate-[pulse_10s_ease-in-out_infinite] pointer-events-none mix-blend-overlay" />

            {/* Automatic Background Rain if weather is 'rain' */}
            {weather === 'rain' && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
                    {[...Array(30)].map((_, i) => (
                        <div key={i} className="absolute w-[1px] h-16 bg-blue-300/40 animate-[particle-float-up_1s_linear_infinite]"
                            style={{ left: `${Math.random() * 100}%`, top: `-20%`, animationDelay: `${Math.random()}s`, animationDuration: `${0.4 + Math.random() * 0.4}s` }} />
                    ))}
                </div>
            )}

            {/* 3. Dynamic Ambient Particles (CSS Fireflies & Leaves) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className={`absolute ${p.isLeaf ? 'w-2 h-2 rounded-[50%_0_50%_50%] rotate-45 animate-[bounce_5s_infinite]' : 'w-1.5 h-1.5 rounded-full blur-[1px] animate-[ping_4s_ease-in-out_infinite]'} ${isRare ? 'bg-fuchsia-200 shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'bg-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}
                        style={{
                            left: p.left,
                            top: p.top,
                            animationDelay: p.delay,
                            opacity: p.opacity,
                            transform: `scale(${p.scale})`
                        }}
                    />
                ))}

                {/* Advanced Stage Atmospheric Overlays */}
                {stage >= 4 && (
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/30 to-transparent mix-blend-overlay pointer-events-none animate-[pulse_6s_ease-in-out_infinite]" />
                )}
                {stage >= 5 && (
                    <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-900/20 via-transparent to-transparent mix-blend-color-dodge pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />
                )}
                {stage === 6 && (
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none animate-[spin_30s_linear_infinite]" />
                )}
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
            <main className="relative z-10 flex-1 h-[60vh] flex items-center justify-center p-4">
                {/* Aura Ring backing the canvas */}
                <div className="absolute w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-emerald-900/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="w-full max-w-4xl h-full flex items-center justify-center">
                    <GardenCanvas
                        garden={localGarden}
                        width={600}
                        height={500}
                        interactionType={interaction}
                        hasWeeds={hasWeeds}
                    />
                </div>
            </main>

            {/* --- SEED SELECTION MODAL --- */}
            {showPlantSelection && (
                <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
                    <div className="bg-stone-900/90 backdrop-blur-3xl border border-white/10 p-8 rounded-3xl max-w-lg w-full text-center relative shadow-premium">
                        <button onClick={() => setShowPlantSelection(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-stone-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <Sprout className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-serif text-white mb-2">Plant a New Seed</h2>
                        <p className="text-stone-400 text-sm mb-6">Choose your next journey. Each plant type blossoms differently in your inner sanctuary.</p>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {availablePlants.map(plant => {
                                const isRare = ['Crystal Lotus', 'Lunar Fern', 'Storm Oak', 'Sunlight Spire'].includes(plant);
                                return (
                                    <button
                                        key={plant}
                                        onClick={() => setSelectedNewPlant(plant)}
                                        className={`p-3 rounded-xl border transition-all text-sm font-bold tracking-wider uppercase relative overflow-hidden group
                                            ${selectedNewPlant === plant
                                                ? (isRare ? 'bg-fuchsia-500/20 border-fuchsia-500/80 text-fuchsia-300' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400')
                                                : (isRare ? 'bg-stone-800/80 border-fuchsia-900/50 text-fuchsia-400/70 hover:bg-stone-800 hover:border-fuchsia-500/50' : 'bg-stone-800/50 border-stone-700 text-stone-400 hover:bg-stone-800 hover:border-stone-600')
                                            }
                                        `}
                                    >
                                        {isRare && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />}
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {plant}
                                            {isRare && <Sparkles className="w-3 h-3 text-fuchsia-400" />}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            disabled={!selectedNewPlant}
                            onClick={async () => {
                                if (selectedNewPlant) {
                                    const res = await GardenService.resetGarden(user.id, selectedNewPlant);
                                    if (res.success) {
                                        showToast(`Planted a new ${selectedNewPlant} seed!`, "success");
                                        const freshData = await GardenService.getGarden(user.id);
                                        if (freshData) setLocalGarden(freshData);
                                        setShowPlantSelection(false);
                                        setSelectedNewPlant(null);
                                        onUpdate();
                                    } else {
                                        showToast(res.message || "Failed to plant", "error");
                                    }
                                }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                        >
                            Confirm Selection
                        </button>
                    </div>
                </div>
            )}

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
                <div className="flex flex-wrap justify-center items-center gap-4 md:gap-12">
                    {hasWeeds ? (
                        <ControlBtn
                            icon={Scissors}
                            label="Clear Weeds"
                            sub="-5m"
                            active={false}
                            onClick={handleClearWeeds}
                            color="red"
                        />
                    ) : (
                        <ControlBtn
                            icon={Droplets}
                            label="Nourish"
                            sub={`-${intensity}m`}
                            active={interaction === 'water'}
                            onClick={() => handleAction('water')}
                            color="cyan"
                        />
                    )}
                    <ControlBtn
                        icon={Wind}
                        label="Breathe"
                        sub={`Free`}
                        active={interaction === 'breath'}
                        onClick={() => handleAction('breath')}
                        color="teal"
                    />
                    <ControlBtn
                        icon={Music}
                        label="Sing"
                        sub={`Free`}
                        active={interaction === 'sing'}
                        onClick={() => handleAction('sing')}
                        color="purple"
                    />
                    <ControlBtn
                        icon={Scissors}
                        label={stage === 6 ? "Ascend" : "Harvest"}
                        sub={stage === 6 ? "+1 Token, +100 Coins" : "Reset"}
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