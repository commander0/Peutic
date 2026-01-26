import React, { useState, useEffect } from 'react';
import { Lightbulb, RefreshCw, Sparkles, Trash2, Download } from 'lucide-react';
import { ArtEntry } from '../../types';
import { useToast } from '../common/Toast';
import { UserService } from '../../services/userService';
import { GardenService } from '../../services/gardenService';
import { WisdomEngine } from '../../services/wisdomEngine';

export const WisdomGenerator: React.FC<{ userId: string, onUpdate?: () => void }> = ({ userId, onUpdate }) => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [gallery, setGallery] = useState<ArtEntry[]>([]);
    const { showToast } = useToast();


    const refreshGallery = async () => {
        const art = await UserService.getUserArt(userId);
        setGallery(art);
    };


    useEffect(() => { refreshGallery(); }, [userId]);

    const handleGenerate = async () => {
        if (!input.trim()) return;
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            const wisdom = WisdomEngine.generate(input);

            const canvas = document.createElement('canvas');
            canvas.width = 1080; canvas.height = 1080;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const hue = Math.floor(Math.random() * 360);
                const grd = ctx.createLinearGradient(0, 0, 1080, 1080);
                grd.addColorStop(0, `hsl(${hue}, 40%, 95%)`);
                grd.addColorStop(1, `hsl(${(hue + 40) % 360}, 30%, 90%)`);
                ctx.fillStyle = grd; ctx.fillRect(0, 0, 1080, 1080);
                ctx.fillStyle = `hsla(${hue}, 60%, 80%, 0.2)`;
                ctx.beginPath(); ctx.arc(540, 540, 400, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#1a1a1a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                const words = wisdom.split(' ');
                let fontSize = 80; if (words.length > 15) fontSize = 60;
                ctx.font = `bold ${fontSize}px Manrope, sans-serif`;
                const maxWidth = 800; const lineHeight = fontSize * 1.4;
                let lines = []; let currentLine = words[0];
                for (let i = 1; i < words.length; i++) {
                    const testLine = currentLine + ' ' + words[i];
                    if (ctx.measureText(testLine).width > maxWidth) { lines.push(currentLine); currentLine = words[i]; } else { currentLine = testLine; }
                }
                lines.push(currentLine);
                let y = 540 - ((lines.length - 1) * lineHeight) / 2;
                lines.forEach(line => { ctx.fillText(line, 540, y); y += lineHeight; });
                ctx.font = '500 30px Manrope, sans-serif'; ctx.fillStyle = '#666'; ctx.fillText('PEUTIC • DAILY WISDOM', 540, 980);

                const imageUrl = canvas.toDataURL('image/jpeg', 0.4);
                // Use simple random ID generation for browser compatibility if crypto.randomUUID isn't available in all contexts
                const newId = crypto.randomUUID();

                const newEntry: ArtEntry = { id: newId, userId: userId, imageUrl: imageUrl, prompt: input, createdAt: new Date().toISOString(), title: "Wisdom Card" };

                await UserService.saveArt(newEntry);
                // Water the garden on creation
                await GardenService.waterPlant(userId);

                setGallery(prev => [newEntry, ...prev]); // Instant State Update
                if (onUpdate) onUpdate();
                setInput('');
            }

        } catch (e: any) {
            console.error("Critical Generation Error:", e);
            showToast("Failed to save Wisdom Art: " + (e.message || "Unknown error"), "error");

        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm("Delete this card?")) { await UserService.deleteArt(id); await refreshGallery(); }
    };


    return (
        <div className="bg-transparent p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg"><Lightbulb className="w-4 h-4 text-purple-600 dark:text-purple-400" /></div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Get Clarity</h3>
            </div>
            <div className="space-y-3">
                <textarea className="w-full h-20 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-sm focus:border-purple-400 dark:text-white outline-none resize-none transition-all" placeholder="What's weighing on your mind?" value={input} onChange={(e) => setInput(e.target.value)} />
                <button onClick={handleGenerate} disabled={loading || !input} className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${loading || !input ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-purple-600 text-white hover:bg-purple-500 hover:shadow-md'}`}>
                    {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} {loading ? 'Finding Clarity...' : 'Reframe Thought'}
                </button>
                {gallery.length > 0 && (
                    <div className="mt-4 space-y-3">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Cards ({gallery.length})</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {gallery.map((art) => (
                                <div key={art.id} className="relative group aspect-square bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm animate-in zoom-in duration-300">
                                    <img src={art.imageUrl} alt="Wisdom Card" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button onClick={(e) => handleDelete(e, art.id)} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors" title="Delete"><Trash2 className="w-3 h-3" /></button>
                                        <a href={art.imageUrl} download={`wisdom-${art.id}.jpg`} onClick={(e) => e.stopPropagation()} className="p-2 bg-white hover:bg-gray-100 text-black rounded-full shadow-lg transition-colors" title="Download"><Download className="w-3 h-3" /></a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
