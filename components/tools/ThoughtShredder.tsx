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
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Clean up animation on unmount
    useEffect(() => {
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
        const stripCount = 40;
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
                setText('');
                showToast("Thoughts Released into the Void.", "success");
            }
        };

        render();
    };

    const reset = () => {
        setShredded(false);
        setText('');
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
                                className="w-full flex-1 min-h-[200px] bg-stone-100 dark:bg-[#1a1c1e] text-stone-900 dark:text-stone-200 p-4 rounded-xl border border-stone-200 dark:border-stone-800 resize-none outline-none focus:border-red-500/50 transition-colors font-handwriting text-lg leading-relaxed shadow-inner"
                                placeholder="I am feeling anxious about..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                autoFocus
                            />
                            <div className="mt-6">
                                <button
                                    onClick={handleShred}
                                    disabled={!text.trim()}
                                    className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                                >
                                    <Wind className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                    Shred This Thought
                                </button>
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
                            <div className="w-20 h-20 bg-stone-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <RefreshCw className="w-10 h-10 text-green-500" />
                            </div>
                            <h4 className="text-2xl font-black text-white mb-2">Gone.</h4>
                            <p className="text-stone-500 text-sm mb-8 max-w-[200px]">Your thought has been shredded and released.</p>

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
