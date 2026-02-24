import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Wind, RefreshCw, X } from 'lucide-react';
import { useToast } from '../common/Toast';

interface ThoughtShredderProps {
    onClose: () => void;
}

const ThoughtShredder: React.FC<ThoughtShredderProps> = ({ onClose }) => {
    const { showToast } = useToast();
    const [text, setText] = useState('');
    const [isShredding, setIsShredding] = useState(false);
    const [shredded, setShredded] = useState(false);
    const [shredCount, setShredCount] = useState(0);

    // Milestone State
    const [showMilestone, setShowMilestone] = useState(false);
    const [milestoneNote, setMilestoneNote] = useState('');

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const POSITIVE_WORDS = ['love', 'peace', 'joy', 'happy', 'strong', 'brave', 'light', 'hope', 'growth', 'beautiful', 'calm', 'safe', 'good', 'kind', 'worth', 'healing'];
    const FALLBACK_AFFIRMATIONS = [
        "You are stronger than the sum of your fears.",
        "The very fact that you are trying means you are already succeeding.",
        "Your potential is endless, even when it feels hidden.",
        "Every day you survive is a victory worth celebrating."
    ];

    // Clean up animation on unmount
    useEffect(() => {
        setShredCount(parseInt(localStorage.getItem('peutic_shred_count') || '0', 10));

        return () => {
            const id = (window as any).shredderAnimId;
            if (id) cancelAnimationFrame(id);
        };
    }, []);

    const animateShredding = () => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize canvas to match container
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Create strips
        const strips: { x: number; y: number; w: number; h: number; vy: number; vx: number; rot: number; vRot: number; color: string }[] = [];
        const stripCount = 25; // User requested reduction from 40 to 25
        const stripWidth = canvas.width / stripCount;

        for (let i = 0; i < stripCount; i++) {
            strips.push({
                x: i * stripWidth,
                y: 0,
                w: stripWidth,
                h: canvas.height / 2, // Approximate height of the paper area
                vy: 5 + Math.random() * 10,
                vx: (Math.random() - 0.5) * 5,
                rot: 0,
                vRot: (Math.random() - 0.5) * 0.2,
                color: '#fef3c7' // paper color
            });
        }

        const render = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            let allGone = true;

            strips.forEach(strip => {
                strip.y += strip.vy;
                strip.x += strip.vx;
                strip.rot += strip.vRot;

                if (strip.y < canvas.height + 100) allGone = false;

                ctx.save();
                ctx.translate(strip.x + strip.w / 2, strip.y + strip.h / 2);
                ctx.rotate(strip.rot);

                // Draw Paper Strip
                ctx.fillStyle = strip.color;
                ctx.fillRect(-strip.w / 2, -strip.h / 2, strip.w, strip.h);

                // Add text-like lines
                ctx.fillStyle = '#000000';
                ctx.globalAlpha = 0.2;
                for (let j = 0; j < 10; j++) {
                    ctx.fillRect(-strip.w / 2 + 2, -strip.h / 2 + 10 + j * 10, strip.w - 4, 1);
                }
                ctx.globalAlpha = 1.0;

                ctx.restore();
            });

            if (!allGone) {
                (window as any).shredderAnimId = requestAnimationFrame(render);
            } else {
                setShredded(true);
                setIsShredding(false);

                // --- Milestone Logic (25 Shreds) ---
                const words = text.toLowerCase().split(/\W+/);
                const foundPositives = words.filter(w => POSITIVE_WORDS.includes(w));

                const storedWords = JSON.parse(localStorage.getItem('peutic_shredded_words') || '[]');
                const newWords = [...storedWords, ...foundPositives].slice(-20); // Keep last 20
                localStorage.setItem('peutic_shredded_words', JSON.stringify(newWords));

                let count = parseInt(localStorage.getItem('peutic_shred_count') || '0', 10) + 1;

                if (count >= 25) {
                    setShowMilestone(true);
                    if (newWords.length > 0) {
                        const uniqueWords = Array.from(new Set(newWords));
                        setMilestoneNote(`From the ashes of your doubts, remember the light of your own words: ${uniqueWords.join(', ')}. Keep walking forward.`);
                    } else {
                        setMilestoneNote(FALLBACK_AFFIRMATIONS[Math.floor(Math.random() * FALLBACK_AFFIRMATIONS.length)]);
                    }

                    // Leave shred count at 25 for UI visuals until they click continue
                    localStorage.setItem('peutic_shred_count', '25');
                    setShredCount(25);
                    localStorage.setItem('peutic_shredded_words', '[]'); // Wipe the history for the next round

                    // Note stays visible for 5 minutes
                    setTimeout(() => {
                        setShowMilestone(false);
                        // Make sure we auto-reset if they just let it time out
                        if (parseInt(localStorage.getItem('peutic_shred_count') || '0', 10) >= 25) {
                            localStorage.setItem('peutic_shred_count', '0');
                            setShredCount(0);
                        }
                    }, 5 * 60 * 1000);
                } else {
                    localStorage.setItem('peutic_shred_count', count.toString());
                    setShredCount(count);
                    showToast("Thoughts Released into the Void.", "success");
                }

                setText('');

                // Achievement Hook
                import('../../services/userService').then(({ UserService }) => {
                    const user = UserService.getUser();
                    if (user) {
                        UserService.unlockAchievement(user.id, 'CLEAR_MIND').then(ach => {
                            if (ach) showToast(`🏆 Unlocked: ${ach.title}`, "success");
                        });
                    }
                });
            }
        };

        render();
    };

    const reset = () => {
        setShredded(false);
        setText('');
        if (shredCount >= 25) {
            localStorage.setItem('peutic_shred_count', '0');
            setShredCount(0);
        }
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const handleShred = () => {
        if (!text.trim()) {
            showToast("Write something to shed first.", "error");
            return;
        }
        setIsShredding(true);
        animateShredding();
    };

    return (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-stone-900 border border-stone-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-5 border-b border-stone-800 flex justify-between items-center bg-stone-950">
                    <h3 className="font-black text-stone-200 uppercase tracking-widest flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-red-500" /> Thought Shredder
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-stone-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col relative" ref={containerRef}>

                    {!shredded && !isShredding && (
                        <>
                            <p className="text-stone-400 text-sm mb-4 font-medium">
                                Write down what's burdening you. When you're ready, shred it and let it go.
                            </p>
                            <textarea
                                className="w-full flex-1 min-h-[120px] md:min-h-[200px] bg-stone-100 dark:bg-[#1a1c1e] text-stone-900 dark:text-stone-200 p-4 rounded-xl border border-stone-200 dark:border-stone-800 resize-none outline-none focus:border-red-500/50 transition-colors font-handwriting text-base md:text-lg leading-relaxed shadow-inner"
                                placeholder="I am feeling anxious about..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                autoFocus
                            />
                            <div className="mt-4 md:mt-6">
                                <button
                                    onClick={handleShred}
                                    disabled={!text.trim()}
                                    className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                                >
                                    <Wind className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                    Shred This Thought
                                </button>
                            </div>

                            {/* Milestone Tracker Banner */}
                            <div className="mt-6 pt-4 border-t border-stone-800 text-center">
                                <p className="text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-2">Fragments Released: <span className="text-stone-300">{shredCount}</span> / 25</p>
                                <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden mb-2">
                                    <div className="h-full bg-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-500" style={{ width: `${Math.min(100, ((shredCount % 25) / 25) * 100)}%` }} />
                                </div>
                                <p className="text-[10px] text-stone-600 italic font-serif">
                                    Shred 25 thoughts to piece together a custom introspective note from your fragments.
                                </p>
                            </div>
                        </>
                    )}

                    {/* Canvas Overlay for Animation */}
                    <canvas
                        ref={canvasRef}
                        className={`absolute inset-0 pointer-events-none z-10 ${isShredding ? 'block' : 'hidden'}`}
                    />

                    {/* Success State */}
                    {shredded && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-10 animate-in zoom-in duration-500">
                            {showMilestone ? (
                                <div className="p-8 bg-amber-500/10 border border-amber-500/30 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.2)] animate-pulse-slow max-w-sm mb-8 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-transparent opacity-50"></div>
                                    <h4 className="text-xl font-serif font-bold text-amber-200 mb-4 drop-shadow-md relative z-10">A Gift From the Void</h4>
                                    <p className="text-amber-100/90 font-serif leading-relaxed italic text-sm relative z-10">{milestoneNote}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-stone-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                        <RefreshCw className="w-10 h-10 text-green-500" />
                                    </div>
                                    <h4 className="text-2xl font-black text-white mb-2">Gone.</h4>
                                    <p className="text-stone-500 text-sm mb-8 max-w-[200px]">Your thought has been shredded and released.</p>
                                </>
                            )}

                            <div className="flex gap-4 w-full">
                                <button
                                    onClick={reset}
                                    className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-white rounded-xl font-bold uppercase tracking-wide text-xs transition-colors"
                                >
                                    Shred Another
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 bg-stone-100 hover:bg-white text-black rounded-xl font-bold uppercase tracking-wide text-xs transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ThoughtShredder;
