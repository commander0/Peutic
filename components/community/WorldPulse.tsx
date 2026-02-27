import React, { useState, useEffect } from 'react';
import { X, Globe2, Heart, Sparkles, Navigation } from 'lucide-react';
import { User } from '../../types';

interface WorldPulseProps {
    user: User;
    onClose: () => void;
}

// Generates chaotic but majestic flowing paths
const generatePath = () => {
    return {
        left: `${Math.random() * 100}%`,
        bottom: `-${20 + Math.random() * 30}%`,
        scale: 0.5 + Math.random() * 1.5,
        duration: 15 + Math.random() * 25,
        delay: Math.random() * 5,
        sway: -20 + Math.random() * 40
    };
};

const WorldPulse: React.FC<WorldPulseProps> = ({ user, onClose }) => {
    const [orbs, setOrbs] = useState<any[]>([]);
    const [activeUsersCount, setActiveUsersCount] = useState<number>(0);
    const [totalEchoes, setTotalEchoes] = useState<number>(0);

    // Initial mock data generation
    useEffect(() => {
        // Base active users
        setActiveUsersCount(12045 + Math.floor(Math.random() * 500));
        setTotalEchoes(840291 + Math.floor(Math.random() * 1000));

        // Generate initial background orbs
        const initialOrbs = Array.from({ length: 40 }).map((_, i) => ({
            id: `initial-${i}`,
            ...generatePath(),
            color: Math.random() > 0.8 ? 'bg-yellow-400' : (Math.random() > 0.5 ? 'bg-cyan-400' : 'bg-fuchsia-400'),
            message: null
        }));
        setOrbs(initialOrbs);

        // Constant trickle of new active "echoes"
        const interval = setInterval(() => {
            const isSpecial = Math.random() > 0.8;

            const newOrb = {
                id: `dynamic-${Date.now()}`,
                ...generatePath(),
                color: isSpecial ? 'bg-yellow-400' : (Math.random() > 0.5 ? 'bg-cyan-400' : 'bg-fuchsia-400'),
                message: isSpecial ? ['Felt peace today.', 'Overcame a panic attack.', 'Letting go of the past...'][Math.floor(Math.random() * 3)] : null
            };

            setOrbs(prev => [...prev.slice(-60), newOrb]); // Keep max 60 orbs at a time

            if (isSpecial) setTotalEchoes(prev => prev + 1);
            if (Math.random() > 0.5) setActiveUsersCount(prev => prev + (Math.random() > 0.5 ? 1 : -1));

        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-[150] bg-black text-white flex flex-col font-sans overflow-hidden animate-in fade-in duration-1000">
            {/* CSS Animation for Swaying Ascent */}
            <style type="text/css">{`
                @keyframes floatUpSway {
                    0% { transform: translateY(120vh) translateX(0px); opacity: 0; }
                    10% { opacity: 0.8; }
                    50% { transform: translateY(50vh) translateX(var(--sway)); opacity: 1; }
                    90% { opacity: 0.6; }
                    100% { transform: translateY(-20vh) translateX(calc(var(--sway) * -1)); opacity: 0; }
                }
                .orb-float {
                    animation: floatUpSway linear forwards;
                }
            `}</style>

            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-[#020617] bg-[radial-gradient(ellipse_80%_80%_at_50%_120%,rgba(120,119,198,0.2),rgba(255,255,255,0))]"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-screen animate-pulse-slow"></div>

            <div className="absolute top-10 left-10 md:left-20 flex flex-col gap-2 z-20">
                <button onClick={onClose} className="p-3 w-fit rounded-full bg-white/5 hover:bg-white/10 uppercase tracking-widest text-xs font-bold text-indigo-300 transition-colors flex items-center gap-2 border border-white/5">
                    <X className="w-4 h-4" /> Close Gateway
                </button>
            </div>

            {/* HUD / Metrics */}
            <header className="absolute top-10 right-10 md:right-20 flex flex-col items-end gap-4 z-20 pointer-events-none">
                <div className="text-right">
                    <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-indigo-100 to-indigo-500 flex items-center gap-3 justify-end">
                        <Globe2 className="w-8 h-8 text-indigo-400" /> Pulse of the World
                    </h1>
                    <p className="text-indigo-300/60 font-mono text-sm tracking-widest uppercase mt-2">Global Consciousness Matrix</p>
                </div>

                <div className="flex gap-6 mt-4">
                    <div className="flex flex-col items-end backdrop-blur-md bg-white/5 px-6 py-4 rounded-3xl border border-white/10">
                        <span className="text-fuchsia-400 text-xs font-bold tracking-widest uppercase mb-1 flex items-center gap-2"><Heart className="w-3 h-3 animate-pulse" /> Active Entities</span>
                        <span className="text-3xl font-mono text-white">{activeUsersCount.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col items-end backdrop-blur-md bg-white/5 px-6 py-4 rounded-3xl border border-white/10 hidden md:flex">
                        <span className="text-cyan-400 text-xs font-bold tracking-widest uppercase mb-1 flex items-center gap-2"><Sparkles className="w-3 h-3" /> Ethereal Echoes</span>
                        <span className="text-3xl font-mono text-white">{totalEchoes.toLocaleString()}</span>
                    </div>
                </div>
            </header>

            {/* The River of Orbs */}
            <main className="absolute inset-0 pointer-events-none">
                {orbs.map(orb => (
                    <div
                        key={orb.id}
                        className="absolute flex flex-col items-center orb-float"
                        style={{
                            left: orb.left,
                            bottom: orb.bottom,
                            animationDuration: `${orb.duration}s`,
                            animationDelay: `${orb.delay}s`,
                            '--sway': `${orb.sway}px`
                        } as React.CSSProperties}
                    >
                        <div
                            className={`rounded-full ${orb.color} blur-[2px] shadow-[0_0_30px_rgba(255,255,255,0.8)]`}
                            style={{ width: `${orb.scale * 12}px`, height: `${orb.scale * 12}px` }}
                        />
                        {/* Glow halo */}
                        <div
                            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${orb.color} blur-xl opacity-40 mix-blend-screen`}
                            style={{ width: `${orb.scale * 60}px`, height: `${orb.scale * 60}px` }}
                        />

                        {orb.message && (
                            <div className="mt-4 px-4 py-2 bg-indigo-950/40 backdrop-blur-md border border-indigo-500/30 rounded-full text-indigo-100 text-[10px] md:text-xs font-mono tracking-widest whitespace-nowrap shadow-xl">
                                "{orb.message}"
                            </div>
                        )}
                    </div>
                ))}
            </main >

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center z-20 pointer-events-none">
                <p className="text-indigo-400/50 text-xs tracking-[0.3em] uppercase font-bold flex items-center justify-center gap-2">
                    <Navigation className="w-4 h-4 -rotate-45 block animate-bounce" />
                    You are not alone
                </p>
            </div>

            {/* Ambient Base Light */}
            <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-indigo-900/40 to-transparent mix-blend-screen pointer-events-none"></div>
        </div >
    );
};

export default WorldPulse;
