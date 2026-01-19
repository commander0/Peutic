import React, { useState, useEffect } from 'react';
import { TimeCapsuleService } from '../../services/timeCapsuleService';
import { TimeCapsule } from '../../types';
import { Clock, Lock, Unlock, Send, Trash2 } from 'lucide-react';

interface TimeCapsuleProps {
    userId: string;
}

const TimeCapsuleComponent: React.FC<TimeCapsuleProps> = ({ userId }) => {
    const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
    const [content, setContent] = useState('');
    const [unlockDate, setUnlockDate] = useState('');
    const [loading, setLoading] = useState(false);

    const loadCapsules = () => {
        TimeCapsuleService.getCapsules(userId).then(setCapsules);
    };

    useEffect(() => {
        loadCapsules();
    }, [userId]);

    const handleCreate = async () => {
        if (!content || !unlockDate) return;
        setLoading(true);
        try {
            await TimeCapsuleService.createCapsule(userId, content, new Date(unlockDate).toISOString());
            setContent('');
            setUnlockDate('');
            loadCapsules();
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Delete this capsule?")) {
            await TimeCapsuleService.deleteCapsule(id);
            loadCapsules();
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-indigo-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-xl">
                    <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Time Capsule</h3>
                    <p className="text-xs text-gray-500">Send a message to your future self.</p>
                </div>
            </div>

            {/* CREATION FORM */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 mb-6">
                <textarea
                    className="w-full bg-transparent border-none resize-none focus:ring-0 text-sm mb-3 dark:text-white"
                    placeholder="Dear Future Me, today I felt..."
                    rows={3}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <div className="flex items-center justify-between">
                    <input
                        type="date"
                        className="bg-white dark:bg-gray-700 text-xs p-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:text-white"
                        min={new Date().toISOString().split('T')[0]}
                        value={unlockDate}
                        onChange={(e) => setUnlockDate(e.target.value)}
                    />
                    <button
                        onClick={handleCreate}
                        disabled={!content || !unlockDate || loading}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Send className="w-3 h-3" /> Seal
                    </button>
                </div>
            </div>

            {/* CAPSULE LIST */}
            <div className="space-y-3">
                {capsules.length === 0 && <p className="text-center text-xs text-gray-400 italic py-4">No capsules sealed yet.</p>}
                {capsules.map(c => {
                    const isLocked = new Date(c.unlockDate) > new Date();
                    return (
                        <div key={c.id} className="flex items-center gap-3 p-3 bg-indigo-50/50 dark:bg-gray-800 rounded-xl group relative">
                            <div className={`p-2 rounded-full ${isLocked ? 'bg-orange-100 text-orange-500' : 'bg-green-100 text-green-500'}`}>
                                {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] uppercase font-bold text-gray-400">
                                        {isLocked ? `Unlocks ${new Date(c.unlockDate).toLocaleDateString()}` : `Unlocked ${new Date(c.unlockDate).toLocaleDateString()}`}
                                    </span>
                                </div>
                                <p className={`text-sm ${isLocked ? 'font-serif italic text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                    {isLocked ? "• • • Content Sealed • • •" : c.content}
                                </p>
                            </div>
                            <button onClick={() => handleDelete(c.id)} className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TimeCapsuleComponent;
