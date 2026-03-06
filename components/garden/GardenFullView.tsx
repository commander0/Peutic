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
    isEmbedded?: boolean;
}

const GardenFullView: React.FC<GardenFullViewProps> = ({ garden, user, onClose, onUpdate, isEmbedded = false }) => {
    const [localGarden, setLocalGarden] = useState(garden);
    const [interaction, setInteraction] = useState<'water' | 'breath' | 'sing' | 'harvest' | null>(null);
    const [isMicListening, setIsMicListening] = useState(false);
    const [micVolume, setMicVolume] = useState(0);
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
        if (fm >= 24) return 8; // Cosmic Yggdrasil
        if (fm >= 21) return 7; // Astral Sovereign
        if (fm >= 18) return 6; // Ethereal Entity
        if (fm >= 15) return 5;  // Mystic Guardian
        if (fm >= 12) return 4;  // Ancient Tree
        if (fm >= 9) return 3;  // Mature Tree
        if (fm >= 6) return 2;  // Sapling
        if (fm >= 3) return 1;  // Sprout
        return 0; // Seed
    }, [localGarden.focusMinutes]);

    const isRare = useMemo(() => ['Crystal Lotus', 'Lunar Fern', 'Storm Oak', 'Sunlight Spire'].includes(localGarden.currentPlantType), [localGarden.currentPlantType]);

    // Generate stable random particle positions to prevent DOM jitter during re-renders
    const particles = useMemo(() => {
        const count = stage >= 7 ? 50 : stage >= 5 ? 30 : stage >= 3 ? 20 : 10;
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
        // Microphone Logic Override
        if (type === 'sing') {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setIsMicListening(true);
                setInteraction('sing');
                showToast("Sing or hum to your plant for 10 seconds...", "info");

                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const analyser = audioCtx.createAnalyser();
                const source = audioCtx.createMediaStreamSource(stream);
                source.connect(analyser);
                analyser.fftSize = 256;
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                let focusGained = 0;

                const checkAudio = setInterval(() => {
                    analyser.getByteFrequencyData(dataArray);
                    let sum = 0;
                    for (let i = 0; i < bufferLength; i++) {
                        sum += dataArray[i];
                    }
                    const average = sum / bufferLength;
                    setMicVolume(average);

                    if (average > 10) {
                        focusGained += 0.5; // Gain half a minute of focus per second of active humming
                    }
                }, 1000);

                setTimeout(async () => {
                    clearInterval(checkAudio);
                    stream.getTracks().forEach(track => track.stop());
                    audioCtx.close();
                    setIsMicListening(false);
                    setMicVolume(0);
                    setInteraction(null);

                    if (focusGained > 0) {
                        const earned = Math.floor(focusGained);
                        if (earned > 0) {
                            await GardenService.addFocusMinutes(user.id, earned);
                            showToast(`Your vibration nurtured the plant! (+${earned}m growth)`, "success");
                            const freshData = await GardenService.getGarden(user.id);
                            if (freshData) setLocalGarden(freshData);
                            onUpdate();
                        } else {
                            showToast("The plant enjoyed your presence.", "info");
                        }
                    } else {
                        showToast("The plant listened quietly.", "info");
                    }
                }, 10000);
            } catch (err) {
                showToast("Microphone access is required to sing to the plant.", "error");
            }
            return;
        }

        // Trigger Visuals for others
        if (type !== 'harvest') {
            setInteraction(type);
            setTimeout(() => setInteraction(null), 4000); // Effect duration
        }

        // Perform Service Action
        if (type === 'water') {
            if (stage >= 8) {
                showToast("Maximum growth reached. Harvest the tree to plant a new seed.", "info");
                setInteraction(null);
                return;
            }

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
            const isMighty = stage >= 8; // Stage 8 is the ultimate Ascension (24+ minutes)
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
        } else if (type === 'breath') {
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
        if (stage >= 8) {
            showToast("Maximum growth reached. Harvest the tree to plant a new seed.", "info");
            return;
        }

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
        <div className={isEmbedded ? "relative flex flex-col w-full h-full rounded-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden bg-[#050a05] text-white animate-in fade-in duration-700 group" : "fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#050a05] text-white animate-in fade-in duration-700 pb-[90px] lg:pb-0"}>

            {/* --- CINEMATIC ATMOSPHERIC LAYERS --- */}

            {/* Base Tone & Vignette */}
            <div className={`absolute inset-0 transition-colors duration-[3000ms] ${weather === 'sun' ? 'bg-[#020617]' : 'bg-[#0b0f19]'}`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none z-10" />

            {/* Deep Parallax Environment (Forest/Mystic background) - Changed mix-blend to opacity for performance and added will-change */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 will-change-transform transform-gpu">
                {/* Giant distant bokeh/moons */}
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-900/30 blur-[60px] md:blur-[100px] animate-pulse-slow will-change-transform transform-gpu" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-teal-900/20 blur-[80px] md:blur-[120px] will-change-transform transform-gpu" style={{ animationDuration: '15s', animationName: 'pulse', animationIterationCount: 'infinite' }} />
                <div className="absolute top-[20%] right-[10%] w-32 h-32 rounded-full bg-emerald-200/5 blur-[30px] md:blur-[40px] animate-[ping_10s_ease-in-out_infinite] will-change-transform transform-gpu" />
            </div>

            {/* Volumetric God Rays - Removed mix-blend and lowered blur magnitude slightly for mobile GPUs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-80 will-change-transform transform-gpu">
                {weather === 'sun' && (
                    <>
                        <div className="absolute -top-[20%] -left-[10%] w-[150%] h-[50%] bg-gradient-to-b from-emerald-400/10 via-teal-500/5 to-transparent blur-[40px] md:blur-[60px] rotate-[-15deg] transform origin-top animate-[pulse_8s_ease-in-out_infinite] will-change-transform transform-gpu" />
                        <div className="absolute -top-[10%] left-[20%] w-[100%] h-[70%] bg-gradient-to-b from-emerald-200/5 to-transparent blur-[50px] md:blur-[80px] rotate-[25deg] transform origin-top animate-[pulse_12s_ease-in-out_infinite_alternate] will-change-transform transform-gpu" />
                        <div className="absolute top-0 right-[-20%] w-[100%] h-[80%] bg-gradient-to-b from-blue-300/5 to-transparent blur-[60px] md:blur-[90px] rotate-[45deg] transform origin-top animate-[pulse_10s_ease-in-out_infinite] will-change-transform transform-gpu" />
                    </>
                )}
            </div>

            {/* High-Fidelity Rain */}
            {weather === 'rain' && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay animate-[cloud-pan-right_30s_linear_infinite]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/80 to-transparent" />
                    {/* Cinematic raindrops */}
                    {[...Array(60)].map((_, i) => {
                        const depth = Math.random();
                        return (
                            <div key={i} className={`absolute w-[1px] bg-gradient-to-b from-transparent via-blue-200/${Math.floor(depth * 50) + 10} to-transparent animate-[particle-float-up_1s_linear_infinite]`}
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `-20%`,
                                    height: `${Math.max(10, depth * 60)}px`,
                                    filter: `blur(${Math.max(0, (1 - depth) * 2)}px)`,
                                    animationDelay: `${Math.random()}s`,
                                    animationDuration: `${0.3 + depth * 0.4}s`
                                }} />
                        );
                    })}
                    {/* Distant Lightning */}
                    <div className="absolute inset-0 bg-blue-400/5 mix-blend-color-dodge opacity-0 animate-[lightning_9s_infinite_ease-out_2s]" />
                    <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-[radial-gradient(circle,rgba(255,255,255,0.8)_0%,transparent_60%)] opacity-0 animate-[lightning_14s_infinite_ease-out] blur-[50px] mix-blend-overlay" />
                </div>
            )}

            {/* Glowing Bioluminescence Particles (Fireflies / Spores) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 transition-opacity duration-1000 will-change-transform transform-gpu">
                {particles.map((p) => {
                    // Replaced heavy shadow computation with pseudo-elements, removed mix-blend-screen on mobile
                    const isRareColor = isRare ? 'text-fuchsia-300 bg-fuchsia-300' : 'text-emerald-300 bg-emerald-300';
                    return (
                        <div
                            key={p.id}
                            className={`absolute rounded-full opacity-90 will-change-transform transform-gpu ${p.isLeaf ? 'w-3 h-3 rounded-[50%_0_50%_50%] rotate-45 animate-[bounce_5s_infinite] bg-emerald-700/80 border border-emerald-400/30' : `w-1 h-1 animate-[ping_4s_ease-in-out_infinite] ${isRareColor}`}`}
                            style={{
                                left: p.left,
                                top: p.top,
                                animationDelay: p.delay,
                                opacity: p.isLeaf ? p.opacity : p.opacity * 2,
                                transform: `translateZ(0) scale(${p.scale})`
                                // Removed heavy drop-shadow filter entirely to save GPU
                            }}
                        >
                            {!p.isLeaf && <div className={`absolute -inset-1 rounded-full blur-[2px] opacity-70 ${isRare ? 'bg-fuchsia-400' : 'bg-emerald-400'}`} />}
                        </div>
                    )
                })}

                {/* Magical Stage Overlays - Removed heavy mix-blend on mobile */}
                {stage >= 4 && (
                    <div className="absolute bottom-0 w-full h-[60%] bg-gradient-to-t from-emerald-900/40 via-emerald-800/10 to-transparent pointer-events-none animate-[pulse_8s_ease-in-out_infinite] will-change-transform transform-gpu opacity-80" />
                )}
                {stage >= 6 && (
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)] pointer-events-none animate-[spin_40s_linear_infinite] will-change-transform transform-gpu opacity-60" />
                )}
                {stage >= 8 && (
                    <div className="absolute inset-0 z-0 will-change-transform transform-gpu">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-[spin_120s_linear_infinite_reverse] pointer-events-none will-change-transform transform-gpu" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(167,139,250,0.1)_90deg,transparent_180deg,rgba(52,211,153,0.1)_270deg,transparent_360deg)] animate-[spin_60s_linear_infinite] will-change-transform transform-gpu opacity-40" />
                    </div>
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

            {/* Sing/Music Effect (Fallback if mic inaccessible) */}
            {interaction === 'sing' && !isMicListening && (
                <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                    <div className="w-[500px] h-[500px] rounded-full border border-pink-500/20 animate-[ping_2s_linear_infinite]" />
                    <div className="absolute w-[300px] h-[300px] rounded-full border border-purple-500/30 animate-[ping_2s_linear_infinite_reverse]" />
                </div>
            )}

            {/* Live Mic Feedback Aura */}
            {isMicListening && (
                <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center transition-all duration-[50ms]">
                    <div
                        className="rounded-[40%] bg-gradient-to-r from-pink-500/30 to-fuchsia-500/30 blur-3xl transition-all duration-[100ms] animate-[spin_4s_linear_infinite]"
                        style={{
                            width: `${300 + (micVolume * 4)}px`,
                            height: `${300 + (micVolume * 4)}px`,
                            opacity: Math.min(1, 0.1 + (micVolume / 100))
                        }}
                    />
                </div>
            )}

            {/* --- HEADER --- */}
            <header className="relative z-30 p-4 md:p-6 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
                {!isEmbedded ? (
                    <button onClick={onClose} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group">
                        <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10">
                            <ChevronLeft className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium tracking-widest uppercase">Sanctuary</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-2 text-white/70">
                        <Sprout className="w-5 h-5" />
                        <span className="text-xs font-bold tracking-widest uppercase mt-0.5">Inner Garden</span>
                    </div>
                )}

                <div className="text-center">
                    <h1 className="text-2xl font-light tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-400 drop-shadow-sm">
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

                <div className="w-full max-w-4xl h-full flex items-center justify-center relative">
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
                    <div className="bg-stone-900/90 backdrop-blur-3xl border border-white/10 p-8 rounded-xl max-w-lg w-full text-center relative shadow-sm">
                        <button onClick={() => setShowPlantSelection(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-stone-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <Sprout className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-serif text-white mb-2">Plant a New Seed</h2>
                        <p className="text-stone-400 text-sm mb-6">Choose your next journey. Each plant type blossoms differently in your inner sanctuary.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
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
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full shadow-sm"
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
                                ? 'bg-emerald-500 text-black shadow-sm'
                                : 'text-white/30 hover:bg-white/5'
                                }`}
                        >
                            {lvl}m
                        </button>
                    ))}
                </div>

                {/* Action Dock */}
                <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 md:gap-12 w-full max-w-full px-2">
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
                        label={stage >= 8 ? "Ascend" : "Harvest"}
                        sub={stage >= 8 ? "+1 Token, +100 Coins" : "Reset"}
                        active={interaction === 'harvest'}
                        onClick={() => handleAction('harvest')}
                        color="amber"
                    />
                </div>

                {/* Stats Minimal */}
                <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-[10px] font-bold tracking-widest text-white/40 uppercase">
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
            w-14 h-14 md:w-16 md:h-16 rounded-lg flex items-center justify-center
            bg-white/5 border border-white/10 backdrop-blur-md
            shadow-[0_4px_20px_rgba(0,0,0,0.3)]
            group-hover:bg-white/10 group-hover:border-${color}-400/30
            group-hover:shadow-sm
            transition-all
        `}>
            <Icon className={`w-6 h-6 md:w-7 md:h-7 text-gray-400 group-hover:text-${color}-300 transition-colors`} />
        </div>
        <div className="text-center">
            <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/70 group-hover:text-white">{label}</div>
            <div className={`text-[8px] md:text-[9px] font-medium text-${color}-400/50`}>{sub}</div>
        </div>
    </button>
);

export default GardenFullView;