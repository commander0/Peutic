import React, { useState, useEffect } from 'react';
import { WisdomService } from '../../services/wisdomService';
import { WisdomEntry } from '../../types';
import { Sparkles, Send, Heart, Quote } from 'lucide-react';
import { useToast } from '../common/Toast';

interface WisdomCircleProps {
    userId: string;
}

const WisdomCircle: React.FC<WisdomCircleProps> = ({ userId }) => {
    const [stream, setStream] = useState<WisdomEntry[]>([]);
    const [input, setInput] = useState('');
    const [category, setCategory] = useState('Hope');
    const [submitting, setSubmitting] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        loadStream();
    }, []);

    const loadStream = async () => {
        const data = await WisdomService.getGlobalStream();
        setStream(data);
    };

    const handleSubmit = async () => {
        if (!input.trim()) return;
        setSubmitting(true);
        try {
            await WisdomService.submitWisdom(userId, input, category);
            setInput('');
            showToast("Your thought has been sent to the stars.", "success");
        } catch (e: any) {
            showToast("Failed to share wisdom.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 p-6 shadow-sm overflow-hidden relative">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                    <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h3 className="font-black text-indigo-900 dark:text-indigo-300 text-lg">Wisdom Circle</h3>
                    <p className="text-indigo-700/60 dark:text-indigo-400/60 text-xs font-bold uppercase tracking-wider">You are not alone</p>
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-indigo-50 dark:border-gray-800 shadow-sm mb-8 relative z-10 transition-shadow focus-within:shadow-md focus-within:border-indigo-200">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Share a thought, a hope, or a kindness..."
                    className="w-full bg-transparent border-none focus:ring-0 outline-none p-0 text-sm min-h-[60px] resize-none dark:text-white placeholder:text-gray-400"
                    maxLength={480}
                />
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-800 border-none text-xs font-bold text-gray-500 rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <option>Hope</option>
                        <option>Resilience</option>
                        <option>Calm</option>
                        <option>Love</option>
                    </select>
                    <button
                        onClick={handleSubmit}
                        disabled={!input.trim() || submitting}
                        className={`bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all hover:bg-indigo-700 ${(!input.trim() || submitting) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 shadow-lg shadow-indigo-200 dark:shadow-none'}`}
                    >
                        {submitting ? 'Sending...' : <><Send className="w-3 h-3" /> Share</>}
                    </button>
                </div>
            </div>

            {/* Stream */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stream.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-gray-400 italic text-sm">
                        The circle is quiet. Be the first to speak.
                    </div>
                ) : (
                    stream.map((entry) => (
                        <div key={entry.id} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-5 rounded-2xl border border-indigo-50 dark:border-indigo-900/10 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group">
                            <Quote className="w-4 h-4 text-indigo-300 dark:text-gray-600 mb-2 fill-current" />
                            <p className="text-gray-700 dark:text-gray-300 text-sm font-medium leading-relaxed mb-4 line-clamp-4">
                                "{entry.content}"
                            </p>
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                <span className="bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded text-indigo-400">{entry.category}</span>
                                <div className="flex items-center gap-1 group-hover:text-pink-500 transition-colors cursor-pointer">
                                    <Heart className="w-3 h-3" />
                                    <span>{entry.likes}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        </div>
    );
};

export default WisdomCircle;
