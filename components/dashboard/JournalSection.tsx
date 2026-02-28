import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, Trash2, CheckCircle, Save } from 'lucide-react';
import { User, JournalEntry } from '../../types';
import { useToast } from '../common/Toast';
import { UserService } from '../../services/userService';
import { GardenService } from '../../services/gardenService';

export const JournalSection: React.FC<{ user: User, onUpdate?: () => void }> = ({ user, onUpdate }) => {
    const { showToast } = useToast();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [content, setContent] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        UserService.getJournals(user.id).then(setEntries);
    }, [user.id]);

    const handleSave = () => {
        if (!content.trim()) return;
        const entry: JournalEntry = {
            id: crypto.randomUUID(),
            userId: user.id,
            date: new Date().toISOString(),
            content: content
        };
        UserService.saveJournal(entry).then(async () => {
            await GardenService.waterPlant(user.id);
            setEntries([entry, ...entries]);
            setContent('');
            setSaved(true);
            if (onUpdate) onUpdate();
            setTimeout(() => setSaved(false), 2000);
        });
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await UserService.deleteJournal(id);
            setEntries(prev => prev.filter(e => e.id !== id));
            showToast("Entry deleted", "success");
        } catch (error) {
            showToast("Failed to delete", "error");
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 h-[450px]">
            <div className="flex flex-col h-full bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-2xl p-5 border-0 shadow-glass relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400 opacity-50"></div>
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Entry: {new Date().toLocaleDateString()}</span>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
                <textarea
                    className="flex-1 w-full bg-transparent dark:text-gray-200 p-0 border-none focus:ring-0 outline-none resize-none text-base leading-relaxed placeholder:text-gray-300 dark:placeholder:text-gray-700 font-medium"
                    placeholder="What's on your mind today? Start writing..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    style={{ backgroundImage: 'linear-gradient(transparent 95%, #e5e7eb 95%)', backgroundSize: '100% 2rem', lineHeight: '2rem' }}
                ></textarea>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleSave}
                        className={`bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full font-bold text-xs hover:scale-105 transition-all shadow-lg flex items-center gap-2 ${!content.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!content.trim()}
                    >
                        {saved ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Save className="w-3 h-3" />}
                        {saved ? "Saved" : "Save Note"}
                    </button>
                </div>
            </div>
            <div className="flex flex-col h-full bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-2xl border-0 shadow-glass overflow-hidden">
                <div className="p-4 bg-transparent flex justify-between items-center">
                    <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider flex items-center gap-2"><Clock className="w-3 h-3" /> Timeline</h3>
                    <span className="text-[10px] font-bold bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300">{entries.length} Entries</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-yellow-200 dark:scrollbar-thumb-gray-700">
                    {entries.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                            <BookOpen className="w-10 h-10 mb-2 stroke-1" />
                            <p className="text-xs">Your story begins here.</p>
                        </div>
                    )}
                    {entries.map(entry => (
                        <div key={entry.id} className="group p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-yellow-400 dark:hover:border-yellow-600 transition-all cursor-default shadow-sm hover:shadow-md relative">
                            <div className="flex justify-between items-start mb-1.5">
                                <span className="text-[9px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-wide bg-yellow-50 dark:bg-yellow-900/20 px-1.5 py-0.5 rounded-md">{new Date(entry.date).toLocaleDateString()}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] text-gray-400 font-mono">{new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <button onClick={(e) => handleDelete(entry.id, e)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-0.5">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed font-medium group-hover:text-black dark:group-hover:text-white transition-colors">{entry.content}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
};
