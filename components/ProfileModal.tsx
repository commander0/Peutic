import React, { useState } from 'react';
import { X, RefreshCw, Download, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User } from '../types';
import { UserService } from '../services/userService';
import { NameValidator } from '../services/nameValidator';

interface ProfileModalProps {
    user: User;
    onClose: () => void;
    onUpdate: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdate }) => {
    const [name, setName] = useState(user.name);
    const [avatarLocked, setAvatarLocked] = useState(user.avatarLocked || false);
    const [previewAvatar, setPreviewAvatar] = useState(user.avatar || `https://api.dicebear.com/7.x/lorelei/svg?seed=${user.id}&backgroundColor=FCD34D`);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = () => {
        setError(null);
        const check = NameValidator.validateFullName(name);
        if (!check.valid) {
            setError(check.error || "Invalid name.");
            return;
        }
        setLoading(true);
        UserService.updateUser({ ...user, name, avatar: previewAvatar, avatarLocked }).then(() => {
            onUpdate();
            onClose();
        });
    };

    const randomizeAvatar = () => {
        const seed = Math.random().toString(36).substring(7);
        setPreviewAvatar(`https://api.dicebear.com/7.x/lorelei/svg?seed=${seed}&backgroundColor=FCD34D`);
    };

    const handleExport = async () => {
        const journals = await UserService.getJournals(user.id);
        const moods = await UserService.getMoods(user.id);
        const data = {
            meta: { exportedAt: new Date().toISOString(), user: { name: user.name, email: user.email } },
            journals, moods
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `peutic-journey-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-8 border border-yellow-200 dark:border-gray-800 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Edit Profile</h2>
                {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">{error}</div>}
                <div className="space-y-4 mb-8">
                    {/* AVATAR CUSTOMIZER */}
                    <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                        <img src={previewAvatar} alt="Avatar" className="w-16 h-16 rounded-full bg-white shadow-sm" />
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase text-gray-500">Avatar</span>
                                <button onClick={randomizeAvatar} className="text-[10px] font-bold bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3" /> New Look
                                </button>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <div className={`w-8 h-4 rounded-full transition-colors relative ${avatarLocked ? 'bg-green-500' : 'bg-gray-300'}`} onClick={() => setAvatarLocked(!avatarLocked)}>
                                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${avatarLocked ? 'left-4.5 translate-x-3.5' : 'left-0.5'}`}></div>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{avatarLocked ? 'Saved as Default' : 'Auto-Rotate on Login'}</span>
                            </label>
                        </div>
                    </div>

                    <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Display Name</label><input className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-yellow-500 outline-none dark:text-white" value={name} onChange={e => setName(e.target.value)} /></div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Email</label><input className="w-full p-3 bg-gray-100 dark:bg-gray-800/50 border border-transparent rounded-xl text-gray-500 cursor-not-allowed" value={user.email} disabled /></div>
                </div>
                <button onClick={handleSave} disabled={loading} className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-80 transition-opacity mb-4">{loading ? 'Saving...' : 'Save Changes'}</button>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-4 grid grid-cols-2 gap-3">
                    <button onClick={handleExport} className="py-3 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-black dark:hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Download className="w-4 h-4 mb-1" /> Export Data
                    </button>
                    <Link to="/book-of-you" target="_blank" className="py-3 flex flex-col items-center justify-center gap-1 text-yellow-600 hover:text-yellow-700 dark:text-yellow-500 dark:hover:text-yellow-400 transition-colors text-[10px] font-bold uppercase tracking-wider bg-yellow-50 dark:bg-yellow-900/20 rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-900/40">
                        <BookOpen className="w-4 h-4 mb-1" /> Print Book
                    </Link>
                </div>
                <p className="text-center text-[9px] text-gray-400 mt-3">Export raw data or print your journey as a PDF.</p>
            </div>
        </div>
    );
};

export default ProfileModal;
