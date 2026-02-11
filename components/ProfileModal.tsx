import React, { useState } from 'react';
import { X, RefreshCw, Download, BookOpen, User as UserIcon, Palette, Trophy, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User } from '../types';
import { UserService } from '../services/userService';
import { NameValidator } from '../services/nameValidator';
import { useTheme } from '../contexts/ThemeContext';
import AchievementGrid from './profile/AchievementGrid';

interface ProfileModalProps {
    user: User;
    onClose: () => void;
    onUpdate: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdate }) => {
    if (!user) return null;

    const [activeTab, setActiveTab] = useState<'identity' | 'sanctuary' | 'journey'>('identity');
    const { theme, setTheme, mode, setMode: setThemeMode } = useTheme();

    const [name, setName] = useState(user.name || 'User');
    const [avatarLocked, setAvatarLocked] = useState(user.avatarLocked || false);
    const [previewAvatar, setPreviewAvatar] = useState(user.avatar || `https://api.dicebear.com/7.x/lorelei/svg?seed=${user.id || 'anonymous'}&backgroundColor=FCD34D`);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    const handleDeleteAccount = async () => {
        try {
            setLoading(true);
            await UserService.deleteUser(user.id);
            window.location.reload(); // Force reload to clear session
        } catch (e) {
            console.error(e);
            setError("Failed to delete account. Please contact support.");
            setLoading(false);
            setIsDeletingAccount(false);
        }
    };

    const handleSave = () => {
        setError(null);
        if (!name) {
            setError("Name is required.");
            return;
        }
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

    const ThemeButton = ({ id, color, label }: { id: string, color: string, label: string }) => (
        <button
            onClick={() => setTheme(id as any)}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${theme === id ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
        >
            <div className={`w-8 h-8 rounded-full shadow-lg ${color}`}></div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === id ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500'}`}>{label}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl h-[90vh] md:h-auto md:max-h-[85vh] rounded-[2rem] p-0 border border-yellow-200 dark:border-gray-800 shadow-2xl relative flex flex-col overflow-hidden">

                {/* HEADER */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <span className="text-yellow-500">Your Profile</span>
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                </div>

                {/* TABS */}
                <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-black/50 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
                    {[
                        { id: 'identity', label: 'Identity', icon: UserIcon },
                        { id: 'sanctuary', label: 'Sanctuary', icon: Palette },
                        { id: 'journey', label: 'Journey', icon: Trophy }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {activeTab === 'identity' && (
                        <div className="space-y-6 max-w-sm mx-auto animate-in slide-in-from-right-4 fade-in duration-300">
                            {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">{error}</div>}

                            {/* AVATAR CUSTOMIZER */}
                            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                <img src={previewAvatar} alt="Avatar" className="w-16 h-16 rounded-full bg-white shadow-sm" />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold uppercase text-gray-500">Avatar Design</span>
                                        <button onClick={randomizeAvatar} className="text-[10px] font-bold bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1">
                                            <RefreshCw className="w-3 h-3" /> Randomize
                                        </button>
                                    </div>
                                    <input
                                        className="w-full text-[10px] p-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-yellow-500 mb-3 font-mono"
                                        value={previewAvatar.split('seed=')[1]?.split('&')[0] || ''}
                                        onChange={(e) => setPreviewAvatar(`https://api.dicebear.com/7.x/lorelei/svg?seed=${e.target.value}&backgroundColor=FCD34D`)}
                                        placeholder="Enter Style Seed..."
                                    />
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <div className={`w-8 h-4 rounded-full transition-colors relative ${avatarLocked ? 'bg-green-500' : 'bg-gray-300'}`} onClick={() => setAvatarLocked(!avatarLocked)}>
                                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${avatarLocked ? 'left-5' : 'left-0.5'}`}></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{avatarLocked ? 'Layout Locked' : 'Auto-Rotate'}</span>
                                    </label>
                                </div>
                            </div>

                            <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Display Name</label><input className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-yellow-500 outline-none dark:text-white" value={name} onChange={e => setName(e.target.value)} /></div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Email</label><input className="w-full p-3 bg-gray-100 dark:bg-gray-800/50 border border-transparent rounded-xl text-gray-500 cursor-not-allowed" value={user.email} disabled /></div>

                            <button onClick={handleSave} disabled={loading} className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-80 transition-opacity flex items-center justify-center gap-2">
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-2 mb-3">
                                    <AlertCircle className="w-3 h-3" /> Zone of Danger
                                </h3>
                                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-4">
                                    <h4 className="font-bold text-red-700 dark:text-red-400 text-xs mb-1">Delete Account</h4>
                                    <p className="text-[10px] text-red-600/70 dark:text-red-400/70 mb-4 leading-relaxed">
                                        Permanently remove your identity.
                                        <br />
                                        <span className="font-black">Warning: User balance ({user.balance}m) will be forfeited.</span>
                                    </p>
                                    {isDeletingAccount ? (
                                        <div className="flex items-center gap-2 animate-in fade-in">
                                            <button
                                                onClick={handleDeleteAccount}
                                                disabled={loading}
                                                className="bg-red-600 text-white px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-700 transition-colors shadow-lg flex-1"
                                            >
                                                {loading ? 'Deleting...' : 'Confirm'}
                                            </button>
                                            <button
                                                onClick={() => setIsDeletingAccount(false)}
                                                disabled={loading}
                                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-[10px] font-bold uppercase tracking-wider px-2"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsDeletingAccount(true)}
                                            className="w-full text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-red-200 dark:border-red-800/50 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                        >
                                            Delete Account
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 grid grid-cols-2 gap-3">
                                <button onClick={handleExport} className="py-3 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-black dark:hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <Download className="w-4 h-4 mb-1" /> Export Data
                                </button>
                                <Link to="/book-of-you" target="_blank" className="py-3 flex flex-col items-center justify-center gap-1 text-yellow-600 hover:text-yellow-700 dark:text-yellow-500 dark:hover:text-yellow-400 transition-colors text-[10px] font-bold uppercase tracking-wider bg-yellow-50 dark:bg-yellow-900/20 rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-900/40">
                                    <BookOpen className="w-4 h-4 mb-1" /> Print Book
                                </Link>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sanctuary' && (
                        <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Palette className="w-5 h-5 text-yellow-500" /> Theme Intelligence
                            </h3>

                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
                                <button onClick={() => setThemeMode('light')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all shadow-sm ${mode === 'light' ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/50'}`}>
                                    ☀️ Light Mode
                                </button>
                                <button onClick={() => setThemeMode('dark')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all shadow-sm ${mode === 'dark' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}>
                                    🌙 Dark Mode
                                </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                                <ThemeButton id="amber" color="bg-yellow-400 border border-yellow-200" label="Gold" />
                                <ThemeButton id="rose" color="bg-rose-400 border border-rose-200" label="Rose" />
                                <ThemeButton id="ocean" color="bg-sky-400 border border-sky-200" label="Ocean" />
                                <ThemeButton id="forest" color="bg-emerald-500 border border-emerald-300" label="Forest" />
                                <ThemeButton id="sunset" color="bg-orange-400 border border-orange-200" label="Sunset" />
                                <ThemeButton id="lavender" color="bg-violet-400 border border-violet-200" label="Lavender" />
                                <ThemeButton id="cyberpunk" color="bg-cyan-400 border border-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.5)]" label="Cyberpunk" />
                                <ThemeButton id="midnight" color="bg-indigo-900 border border-indigo-700" label="Midnight" />
                                <ThemeButton id="coffee" color="bg-amber-800 border border-amber-900" label="Coffee" />
                                <ThemeButton id="royal" color="bg-purple-700 border border-purple-500" label="Royal" />
                                <ThemeButton id="mint" color="bg-teal-300 border border-teal-200" label="Mint" />
                                <ThemeButton id="berry" color="bg-pink-600 border border-pink-400" label="Berry" />
                                <ThemeButton id="steel" color="bg-slate-500 border border-slate-400" label="Steel" />
                                <ThemeButton id="blush" color="bg-pink-200 border border-pink-100" label="Blush" />
                                <ThemeButton id="cloud" color="bg-blue-100 border border-blue-50" label="Cloud" />
                                <ThemeButton id="fire" color="bg-red-500 border border-red-300" label="Fire" />
                                <ThemeButton id="earth" color="bg-stone-600 border border-stone-400" label="Earth" />
                                <ThemeButton id="obsidian" color="bg-gray-950 border border-gray-800" label="Obsidian" />
                                <ThemeButton id="peach" color="bg-orange-200 border border-orange-100" label="Peach" />
                                <ThemeButton id="ivory" color="bg-yellow-50 border border-yellow-100" label="Ivory" />
                            </div>
                            <p className="text-center text-xs text-gray-400">Themes seamlessly adapt the environment to your mood.</p>
                        </div>
                    )}

                    {activeTab === 'journey' && (
                        <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" /> Achievements
                            </h3>
                            <p className="text-xs text-gray-400 mb-6">Unlock badges by maintaining consistency and exploring the sanctuary.</p>
                            <AchievementGrid userId={user.id} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
