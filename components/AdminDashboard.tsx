import React, { useState, useEffect, useRef } from 'react';
import {
    Users, DollarSign, Activity, LogOut, Settings, Video,
    Ban, Zap, ShieldAlert,
    Megaphone, Menu, X, Gift,
    Clock, Server, Shield, CheckCircle, Lock, Crown, AlertTriangle, LayoutGrid, List, Trash2,
    ShoppingBag, CreditCard, ShieldCheck
} from 'lucide-react';
import { STABLE_AVATAR_POOL } from '../services/database';

import { AdminService } from '../services/adminService';
import { UserService } from '../services/userService';
import { User, Companion, Transaction, GlobalSettings, SystemLog, UserRole } from '../types';
import { useToast } from './common/Toast';
import { useLanguage } from './common/LanguageContext';
import StatCard from './admin/StatCard';
import { StatSkeleton, TableSkeleton } from './common/SkeletonLoader';








// --- AVATAR COMPONENT ---
const AvatarImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [hasError, setHasError] = useState(false);
    useEffect(() => { if (src && src.length > 10) { setImgSrc(src); setHasError(false); } else { setHasError(true); } }, [src]);
    if (hasError || !imgSrc) {
        let hash = 0; for (let i = 0; i < alt.length; i++) hash = alt.charCodeAt(i) + ((hash << 5) - hash);
        const index = Math.abs(hash) % STABLE_AVATAR_POOL.length;
        return <img src={STABLE_AVATAR_POOL[index]} alt={alt} className={className} />;
    }
    return <img src={imgSrc} alt={alt} className={className} onError={() => setHasError(true)} />;
};

const ConfirmModal: React.FC<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'danger' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', type = 'info', onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {type === 'danger' ? <AlertTriangle className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">{title}</h3>
                    <p className="text-gray-400 text-[10px] mb-6 leading-relaxed px-4 uppercase tracking-widest font-bold opacity-60">{message}</p>
                    <div className="flex gap-3">
                        <button onClick={onCancel} className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-gray-400 font-bold rounded-xl transition-colors text-[10px] uppercase tracking-widest">{cancelLabel}</button>
                        <button onClick={() => { onConfirm(); onCancel(); }} className={`flex-1 py-3 font-bold rounded-xl transition-transform hover:scale-105 text-[10px] uppercase tracking-widest ${type === 'danger' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'}`}>{confirmLabel}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InputModal: React.FC<{
    isOpen: boolean;
    title: string;
    placeholder: string;
    onConfirm: (val: string) => void;
    onCancel: () => void;
}> = ({ isOpen, title, placeholder, onConfirm, onCancel }) => {
    const [val, setVal] = useState('');
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                <div className="p-6">
                    <h3 className="text-xl font-black text-white mb-4 text-center">{title}</h3>
                    <input
                        type="number"
                        value={val}
                        onChange={e => setVal(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white mb-6 focus:border-yellow-500 outline-none text-center font-mono"
                        autoFocus
                    />
                    <div className="flex gap-3">
                        <button onClick={onCancel} className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-gray-400 font-bold rounded-xl transition-colors text-[10px] uppercase tracking-widest">Cancel</button>
                        <button onClick={() => { onConfirm(val); onCancel(); setVal(''); }} className="flex-1 py-3 bg-yellow-500 text-black font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-yellow-500/20 text-[10px] uppercase tracking-widest">Grant Credits</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'safety' | 'users' | 'specialists' | 'financials' | 'settings' | 'claim'>('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { showToast } = useToast();
    const { t } = useLanguage();


    // Data States
    const [users, setUsers] = useState<User[]>([]);
    const [companions, setCompanions] = useState<Companion[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [settings, setSettings] = useState<GlobalSettings>(AdminService.getSettings());
    const [loading, setLoading] = useState(true);


    // SECURITY: Double-check admin status on mount
    // This prevents a user from accessing this component if they somehow bypassed the router guard
    useEffect(() => {
        const verifyAdmin = async () => {
            const currentUser = UserService.getUser();
            if (!currentUser || currentUser.role !== UserRole.ADMIN) {
                console.warn("Security Violation: Non-admin attempted to access dashboard.");
                onLogout(); // Force kick
            }
        };
        verifyAdmin();
    }, []);

    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [activeCount, setActiveCount] = useState(0);
    const [waitingCount, setWaitingCount] = useState(0);

    // UI States
    const [searchTerm, setSearchTerm] = useState('');
    const [specialistView, setSpecialistView] = useState<'grid' | 'list'>('list');
    const [broadcastMsg, setBroadcastMsg] = useState('');

    // Modal States
    const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; message: string; type: 'danger' | 'info'; action: () => void }>({ open: false, title: '', message: '', type: 'info', action: () => { } });
    const [inputState, setInputState] = useState<{ open: boolean; title: string; placeholder: string; userId: string }>({ open: false, title: '', placeholder: '', userId: '' });

    // Financial Intelligence States
    const [stripeStats, setStripeStats] = useState<any>(null);
    const [loadingFinancials, setLoadingFinancials] = useState(false);
    const [safetyAlerts, setSafetyAlerts] = useState<any[]>([]);
    const lastStripeFetch = useRef<number>(0);
    const [dashboardBroadcastMsg, setDashboardBroadcastMsg] = useState(AdminService.getSettings().dashboardBroadcastMessage || '');
    const [isEditingPublic, setIsEditingPublic] = useState(false);
    const [isEditingDashboard, setIsEditingDashboard] = useState(false);

    // Refs to bypass closure staleness in setInterval
    const isEditingPublicRef = useRef(false);
    const isEditingDashboardRef = useRef(false);
    const isEditingConcurrencyRef = useRef(false);

    // Sync refs with state
    useEffect(() => { isEditingPublicRef.current = isEditingPublic; }, [isEditingPublic]);
    useEffect(() => { isEditingDashboardRef.current = isEditingDashboard; }, [isEditingDashboard]);

    // Draft comparison to prevent overwriting local work
    const broadcastDraftRef = useRef(broadcastMsg);
    const dashboardDraftRef = useRef(dashboardBroadcastMsg);
    useEffect(() => { broadcastDraftRef.current = broadcastMsg; }, [broadcastMsg]);
    useEffect(() => { dashboardDraftRef.current = dashboardBroadcastMsg; }, [dashboardBroadcastMsg]);


    // Computed
    const MAX_CONCURRENT_CAPACITY = settings.maxConcurrentSessions || 15;
    const WAITING_ROOM_CAPACITY = 35;
    const totalRevenue = transactions.filter(t => t.cost && t.cost > 0).reduce((acc, t) => acc + (t.cost || 0), 0);

    const fetchStripeStats = async () => {
        setLoadingFinancials(true);
        const stats = await AdminService.getStripeStats();
        if (stats) setStripeStats(stats);
        setLoadingFinancials(false);
        lastStripeFetch.current = Date.now();
    };

    const fetchSafetyAlerts = async () => {
        try {
            const alerts = await AdminService.getSafetyAlerts();
            setSafetyAlerts(alerts || []);
        } catch (e) {
            console.warn("Safety alerts fetch failed", e);
        }
    };

    const fetchData = async (isInitial = false) => {
        if (isInitial) setLoading(true);

        try {
            const s = await AdminService.syncGlobalSettings();
            setSettings(s);

            // SYNC POLICY: Only overwrite if NOT currently focused AND local differs from previous sync
            if (!isEditingPublicRef.current) {
                setBroadcastMsg(s.broadcastMessage || '');
            }
            if (!isEditingDashboardRef.current) {
                setDashboardBroadcastMsg(s.dashboardBroadcastMessage || '');
            }
            setLogs(await AdminService.getSystemLogs());
            setUsers(await AdminService.getAllUsers());
            setCompanions(await AdminService.getCompanions());
            setTransactions(await AdminService.getAllTransactions());
            fetchSafetyAlerts(); // Fetch safety alerts

            if (activeTab === 'financials') {
                const now = Date.now();
                if (now - lastStripeFetch.current > 30000 || !stripeStats) {
                    fetchStripeStats();
                }
            }


            try {
                const count = await AdminService.getActiveSessionCount();
                setActiveCount(count);
                const queue = await AdminService.getQueueLength();
                setWaitingCount(queue);
            } catch (e) { }

        } catch (e) {
            console.error("Fetch failed", e);
        } finally {
            if (isInitial) setLoading(false);
        }
    };


    useEffect(() => {
        fetchData(true);
        const interval = setInterval(() => {
            if (!isEditingPublicRef.current && !isEditingDashboardRef.current && !isEditingConcurrencyRef.current) {
                fetchData(false);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, []);



    const handleToggleStatus = async (id: string, current: string) => {
        const comp = companions.find(c => c.id === id);
        if (comp) {
            const next = current === 'AVAILABLE' ? 'BUSY' : current === 'BUSY' ? 'OFFLINE' : 'AVAILABLE';
            const updated = { ...comp, status: next as any };
            await AdminService.updateCompanion(updated);

            // Optimistic update
            setCompanions(prev => prev.map(c => c.id === id ? updated : c));
        }
    };

    const handleDeleteUser = async (userId: string, role: string) => {
        if (role === 'ADMIN') {
            showToast("SECURITY ALERT: Cannot delete Administrator accounts.", "error");
            return;
        }
        setConfirmState({
            open: true,
            title: "Delete User?",
            message: "This action is permanent and will purge the account and all associated data from the system.",
            type: 'danger',
            action: async () => {
                try {
                    await AdminService.deleteUser(userId);
                    setUsers(users.filter(u => u.id !== userId));
                    showToast("User successfully purged", "success");
                } catch (e: any) {
                    showToast(e.message || "Deletion failed", "error");
                }
            }
        });
    };



    const handleTopUpCredit = async (userId: string, amount: string) => {
        if (amount && !isNaN(parseInt(amount))) {
            try {
                await AdminService.addCredits(userId, parseInt(amount));
                showToast(`Successfully granted ${amount} minutes`, "success");
                setUsers(await AdminService.getAllUsers());
            } catch (e: any) {
                showToast(e.message || "Top-up failed", "error");
            }
        }
    };

    const handleTopUpPrompt = (userId: string) => {
        setInputState({
            open: true,
            title: "Grant Credits",
            placeholder: "Enter minutes...",
            userId: userId
        });
    };


    const handleBroadcast = async () => {
        await AdminService.broadcastMessage(broadcastMsg);
        setSettings({ ...settings, broadcastMessage: broadcastMsg });
        showToast("Public broadcast deployed", "success");
    };

    const handleDashboardBroadcast = async () => {
        await AdminService.broadcastDashboardMessage(dashboardBroadcastMsg);
        setSettings({ ...settings, dashboardBroadcastMessage: dashboardBroadcastMsg });
        showToast("Member announcement deployed", "success");
    };

    const clearBroadcast = async () => {
        await AdminService.broadcastMessage('');
        setSettings({ ...settings, broadcastMessage: '' });
        setBroadcastMsg('');
        showToast("Public broadcast terminated", "info");
    };

    const clearDashboardBroadcast = async () => {
        await AdminService.broadcastDashboardMessage('');
        setSettings({ ...settings, dashboardBroadcastMessage: '' });
        setDashboardBroadcastMsg('');
        showToast("Member announcement terminated", "info");
    };

    const handleSettingChange = async (key: keyof GlobalSettings, value: any) => {
        const updated = { ...settings, [key]: value };
        setSettings(updated);
        await AdminService.saveSettings(updated);
        showToast("Configuration updated", "info");
    };


    const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="min-h-screen bg-black text-white font-sans flex overflow-hidden">

            {/* SIDEBAR */}
            <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-gray-950 border-r border-gray-800 z-50 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col`}>
                <div className="p-5 border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-yellow-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                            <Activity className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <h1 className="font-black text-lg tracking-tight">PEUTIC<span className="text-gray-500 font-medium">OS</span></h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">System Optimal</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500"><X className="w-6 h-6" /></button>
                </div>

                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {[
                        { id: 'overview', icon: LayoutGrid, label: t('admin_mission_control') },
                        { id: 'safety', icon: ShieldAlert, label: t('admin_safety_hq') },
                        { id: 'users', icon: Users, label: t('admin_user_db') },
                        { id: 'specialists', icon: Video, label: t('admin_spec_grid') },
                        { id: 'financials', icon: DollarSign, label: t('admin_fin_intel') },
                        { id: 'claim', icon: Shield, label: t('admin_sys_claim') },
                        { id: 'settings', icon: Settings, label: t('admin_config') },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id as any); setSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === item.id
                                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                                : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                                }`}
                        >
                            <item.icon className="w-3.5 h-3.5" /> {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-3 border-t border-gray-800">
                    <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-900/10 text-red-500 hover:bg-red-900/30 border border-red-900/30 font-bold text-[10px] uppercase tracking-widest transition-all">
                        <LogOut className="w-3.5 h-3.5" /> {t('admin_terminate')}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 overflow-y-auto bg-black relative">
                <div className="md:hidden sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4 flex justify-between items-center z-40">
                    <span className="font-black text-lg">ADMIN</span>
                    <button onClick={() => setSidebarOpen(true)}><Menu className="w-6 h-6 text-white" /></button>
                </div>

                <div className="p-5 md:p-8 max-w-[1600px] mx-auto space-y-6">

                    {/* --- OVERVIEW (MISSION CONTROL) --- */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight mb-1">{t('admin_mission_control')}</h2>
                                <p className="text-gray-500 text-xs">Real-time command center.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                {loading ? (
                                    <>
                                        <StatSkeleton />
                                        <StatSkeleton />
                                        <StatSkeleton />
                                        <StatSkeleton />
                                    </>
                                ) : (
                                    <>
                                        <StatCard title="Active Sessions" value={activeCount} icon={Video} subValue={`${MAX_CONCURRENT_CAPACITY} Max`} subLabel="Capacity" progress={(activeCount / MAX_CONCURRENT_CAPACITY) * 100} color="purple" />
                                        <StatCard title="Waiting Room" value={waitingCount} icon={Clock} subValue={`${WAITING_ROOM_CAPACITY} Max`} subLabel="Capacity" progress={(waitingCount / WAITING_ROOM_CAPACITY) * 100} color="yellow" />
                                        <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} subValue="Real-Time" subLabel="Gross" color="green" />
                                        <StatCard title="Total Users" value={users.length} icon={Users} subValue="+12" subLabel="Today" color="blue" />
                                    </>
                                )}
                            </div>


                            <div className="grid lg:grid-cols-3 gap-6">
                                {/* Live Concurrency & Waiting Meters */}
                                <div className="lg:col-span-2 space-y-6">

                                    {/* 1. Active Concurrency */}
                                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                                        <h3 className="font-bold text-white mb-5 flex items-center gap-2 text-sm"><Server className="w-4 h-4 text-purple-500" /> Real-time Concurrency</h3>

                                        {/* Dynamic Block Meter based on Capacity */}
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {Array.from({ length: MAX_CONCURRENT_CAPACITY }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-7 h-7 md:w-8 md:h-8 rounded-lg transition-all duration-500 border border-black/20 ${i < activeCount ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-gray-800/50'}`}
                                                ></div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                                            <span>0 Sessions</span>
                                            <span>{activeCount} Active</span>
                                            <span>{MAX_CONCURRENT_CAPACITY} Max</span>
                                        </div>
                                    </div>

                                    {/* 2. Waiting Room */}
                                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                                        <h3 className="font-bold text-white mb-5 flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-yellow-500" /> Waiting Room</h3>

                                        {/* 35 Block Meter */}
                                        <div className="grid grid-cols-7 gap-2 mb-3">
                                            {Array.from({ length: 35 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`aspect-square rounded-lg transition-all duration-500 border border-black/20 ${i < waitingCount ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)] animate-pulse' : 'bg-gray-800/50'}`}
                                                ></div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                                            <span>0 Waiting</span>
                                            <span>{waitingCount} Queued</span>
                                            <span>35 Max</span>
                                        </div>
                                    </div>

                                    {/* Global Broadcaster */}
                                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Megaphone className="w-20 h-20 text-white" /></div>
                                        <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm"><Megaphone className="w-4 h-4 text-blue-500" /> Multi-Channel Broadcast System</h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[9px] text-gray-500 font-black uppercase mb-2 block">Landing Page (Public)</label>
                                                <div className="flex gap-3">
                                                    <input
                                                        value={broadcastMsg}
                                                        onChange={(e) => setBroadcastMsg(e.target.value)}
                                                        onFocus={() => { setIsEditingPublic(true); isEditingPublicRef.current = true; }}
                                                        onBlur={() => { setIsEditingPublic(false); isEditingPublicRef.current = false; }}
                                                        placeholder="Public message (Login/Landing)..."
                                                        className="flex-1 bg-black border border-gray-700 rounded-xl px-4 py-2 text-xs text-white focus:border-yellow-500 outline-none"
                                                    />
                                                    <button onClick={handleBroadcast} className="bg-yellow-600 hover:bg-yellow-700 text-black px-5 py-2 rounded-xl font-bold transition-colors text-xs">Deploy</button>
                                                    {settings.broadcastMessage && <button onClick={clearBroadcast} className="bg-gray-800 hover:bg-gray-700 text-gray-400 px-3 py-2 rounded-xl font-bold transition-colors text-xs">Clear</button>}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[9px] text-gray-500 font-black uppercase mb-2 block">Developer/Member Dashboard</label>
                                                <div className="flex gap-3">
                                                    <input
                                                        value={dashboardBroadcastMsg}
                                                        onChange={(e) => setDashboardBroadcastMsg(e.target.value)}
                                                        onFocus={() => { setIsEditingDashboard(true); isEditingDashboardRef.current = true; }}
                                                        onBlur={() => { setIsEditingDashboard(false); isEditingDashboardRef.current = false; }}
                                                        placeholder="Sanctuary message (Logged-in Users)..."
                                                        className="flex-1 bg-black border border-gray-700 rounded-xl px-4 py-2 text-xs text-white focus:border-blue-500 outline-none"
                                                    />
                                                    <button onClick={handleDashboardBroadcast} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold transition-colors text-xs">Deploy</button>
                                                    {settings.dashboardBroadcastMessage && <button onClick={clearDashboardBroadcast} className="bg-gray-800 hover:bg-gray-700 text-gray-400 px-3 py-2 rounded-xl font-bold transition-colors text-xs">Clear</button>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Live Feed */}
                                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                                    <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm"><Activity className="w-4 h-4 text-yellow-500" /> Activity Log</h3>
                                    <div className="space-y-2">
                                        {loading ? (
                                            [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-10 bg-gray-800/30 rounded-lg animate-pulse border border-gray-800/50" />)
                                        ) : logs.slice(0, 8).map(log => (
                                            <div key={log.id} className="flex justify-between items-center bg-black/50 p-2.5 rounded-lg border border-gray-800/50">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${log.type === 'ERROR' ? 'bg-red-500' : log.type === 'WARNING' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                                    <span className="text-[10px] text-gray-300 font-mono line-clamp-1">{log.event}</span>
                                                </div>
                                                <span className="text-[9px] text-gray-600 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        ))}
                                    </div>

                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- SAFETY HQ --- */}
                    {activeTab === 'safety' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <h2 className="text-2xl font-black mb-1">Safety Headquarters</h2>
                            <p className="text-gray-500 text-xs mb-6">Monitor high-risk interactions and flagged journals.</p>

                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="col-span-2 bg-red-950/10 border border-red-900/30 p-5 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-5">
                                        <ShieldAlert className="w-5 h-5 text-red-500" />
                                        <h3 className="font-bold text-white text-sm">Keyword Watchlist</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {["self-harm", "suicide", "kill myself", "end my life", "hurt myself", "danger", "weapon", "abuse", "emergency", "drug", "illegal", "die"].map(word => (
                                            <span key={word} className="px-3 py-1 bg-red-900/40 border border-red-800 text-red-300 rounded-full text-[10px] font-bold uppercase tracking-wide">{word}</span>
                                        ))}
                                    </div>
                                    <p className="text-gray-500 text-[9px] mt-3 italic">System triggers alerts when these keywords appear in journals or AI interactions.</p>
                                </div>

                                <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
                                    <h3 className="font-bold text-white mb-4 text-sm">Security Summary</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-gray-800">
                                            <span className="text-xs text-gray-400">Total Alerts</span>
                                            <span className="text-sm font-black text-red-500">{safetyAlerts.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-gray-800">
                                            <span className="text-xs text-gray-400">Banned Users</span>
                                            <span className="text-sm font-black text-yellow-500">{users.filter(u => u.subscriptionStatus === 'BANNED').length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Real-time Alerts List */}
                            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                                <h3 className="p-5 font-bold text-white text-sm border-b border-gray-800 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-red-500" /> Safety Alert Stream
                                </h3>
                                {safetyAlerts.length === 0 ? (
                                    <div className="text-center py-20 text-gray-500 text-xs">No safety alerts triggered yet.</div>
                                ) : (
                                    <div className="divide-y divide-gray-800">
                                        {safetyAlerts.map(alert => (
                                            <div key={alert.id} className="p-5 hover:bg-red-950/5 transition-colors group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-red-500/10 rounded-lg">
                                                            <AlertTriangle className="w-4 h-4 text-red-500" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-black text-white">{alert.users?.name || 'Unknown User'}</div>
                                                            <div className="text-[10px] text-gray-500">{alert.users?.email}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-[9px] text-gray-600 font-mono">{new Date(alert.created_at).toLocaleString()}</div>
                                                </div>
                                                <div className="bg-black/40 p-3 rounded-xl border border-red-900/20 mb-3">
                                                    <div className="text-[10px] uppercase font-bold text-red-400 mb-1 tracking-widest">{alert.content_type} FLAG</div>
                                                    <p className="text-xs text-gray-300 leading-relaxed">"{alert.content}"</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex gap-2">
                                                        {alert.flagged_keywords?.map((kw: string) => (
                                                            <span key={kw} className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded text-[9px] font-bold uppercase">{kw}</span>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={() => setConfirmState({
                                                            open: true,
                                                            title: "Ban High-Risk User?",
                                                            message: `Restrict access for ${alert.users?.email} immediately?`,
                                                            type: 'danger',
                                                            action: async () => {
                                                                await AdminService.updateUserStatus(alert.user_id, 'BANNED');
                                                                showToast("User successfully banned", "success");
                                                                fetchSafetyAlerts();
                                                                setUsers(await AdminService.getAllUsers());
                                                            }
                                                        })}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-red-500 border border-red-500/30 px-3 py-1 rounded-md hover:bg-red-500 hover:text-white"
                                                    >
                                                        Ban User
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
                                <h3 className="font-bold text-white mb-4 text-sm">Banned Users</h3>
                                <div className="space-y-2">
                                    {users.filter(u => u.subscriptionStatus === 'BANNED').length === 0 ? (
                                        <div className="text-gray-500 text-xs">No banned users.</div>
                                    ) : (
                                        users.filter(u => u.subscriptionStatus === 'BANNED').map(u => (
                                            <div key={u.id} className="flex justify-between items-center bg-black p-3 rounded-lg border border-red-900/30">
                                                <span className="text-red-400 font-bold text-xs">{u.email}</span>
                                                <button
                                                    onClick={() => setConfirmState({
                                                        open: true,
                                                        title: "Unban User?",
                                                        message: `Restore system access for ${u.email}?`,
                                                        type: 'info',
                                                        action: async () => {
                                                            try {
                                                                await AdminService.updateUserStatus(u.id, 'ACTIVE');
                                                                showToast("User access restored", "success");
                                                                setUsers(await AdminService.getAllUsers());
                                                            } catch (e: any) {
                                                                showToast(e.message || "Unban failed", "error");
                                                            }
                                                        }
                                                    })}
                                                    className="text-gray-500 hover:text-white text-[10px] uppercase font-bold"
                                                >
                                                    Unban
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>
                    )}

                    {/* --- USERS TAB --- */}
                    {activeTab === 'users' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-black">{t('admin_user_db')}</h2>
                                <input
                                    className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs focus:border-yellow-500 outline-none w-64"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-black text-[10px] font-bold text-gray-500 uppercase">
                                        <tr>
                                            <th className="p-4">User</th>
                                            <th className="p-4">Role</th>
                                            <th className="p-4">Credits</th>
                                            <th className="p-4 text-right">Joined</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {loading ? (
                                            <tr><td colSpan={5} className="p-0"><TableSkeleton rows={8} cols={5} /></td></tr>
                                        ) : filteredUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-800/50">
                                                <td className="p-4 font-bold text-white text-xs">{user.name} <span className="text-gray-500 font-normal ml-1">({user.email})</span></td>
                                                <td className="p-4 text-[10px] text-gray-400">{user.role}</td>
                                                <td className="p-4 text-green-400 font-mono font-bold text-xs">{user.balance}m</td>
                                                <td className="p-4 text-right text-gray-500 text-[10px] font-mono">{new Date(user.joinedAt).toLocaleDateString()}</td>
                                                <td className="p-4 text-right flex justify-end gap-2">
                                                    <button onClick={() => handleTopUpPrompt(user.id)} className="text-blue-500 hover:text-blue-400 p-1.5 transition-colors bg-blue-500/10 rounded-lg" title="Top Up Credits">
                                                        <Gift className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => handleDeleteUser(user.id, user.role)} className={`p-1.5 transition-colors rounded-lg ${user.role === 'ADMIN' ? 'text-gray-600 cursor-not-allowed' : 'text-red-500 hover:text-red-400 bg-red-500/10'}`} title={user.role === 'ADMIN' ? "Cannot delete Administrator" : "Delete User"}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>

                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- FINANCIAL INTELLIGENCE --- */}
                    {activeTab === 'financials' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <h2 className="text-2xl font-black mb-1">{t('admin_fin_intel')}</h2>
                            <p className="text-gray-500 text-xs mb-6">Real-time insights from your Stripe account.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                {loadingFinancials ? (
                                    <>
                                        <StatSkeleton />
                                        <StatSkeleton />
                                        <StatSkeleton />
                                        <StatSkeleton />
                                    </>
                                ) : stripeStats ? (
                                    <>
                                        <StatCard title="Available Balance" value={`$${stripeStats.balance.available.toFixed(2)}`} icon={DollarSign} subValue={stripeStats.balance.currency.toUpperCase()} subLabel="Currency" color="green" />
                                        <StatCard title="Pending Balance" value={`$${stripeStats.balance.pending.toFixed(2)}`} icon={Activity} subValue={stripeStats.balance.currency.toUpperCase()} subLabel="Currency" color="yellow" />
                                        <StatCard title="Recent Sales" value={stripeStats.recentSales.length} icon={ShoppingBag} subValue="Last 10" subLabel="Volume" color="blue" />
                                        <StatCard title="Payouts" value={stripeStats.recentPayouts.length} icon={CreditCard} subValue="Pending/Paid" subLabel="Transfers" color="purple" />
                                    </>
                                ) : (
                                    <div className="col-span-full text-center py-10 bg-gray-900/50 border border-dashed border-gray-800 rounded-2xl">
                                        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                                        <p className="text-red-400 font-bold">Failed to load Stripe data.</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Detailed Transaction History */}
                                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                                        <h3 className="p-5 font-bold text-white text-sm border-b border-gray-800 flex items-center gap-2">
                                            <List className="w-4 h-4 text-green-500" /> All Balance Transactions
                                        </h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-black text-[10px] font-bold text-gray-500 uppercase">
                                                    <tr>
                                                        <th className="p-4">Date</th>
                                                        <th className="p-4">Type</th>
                                                        <th className="p-4">Description</th>
                                                        <th className="p-4 text-right">Amount</th>
                                                        <th className="p-4 text-right">Fee</th>
                                                        <th className="p-4 text-right font-black">Net</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-800">
                                                    {loadingFinancials ? (
                                                        <tr><td colSpan={6} className="p-0"><TableSkeleton rows={10} cols={6} /></td></tr>
                                                    ) : stripeStats?.transactions.map((tx: any) => (
                                                        <tr key={tx.id} className="hover:bg-gray-800/30 transition-colors">
                                                            <td className="p-4 text-[10px] font-mono text-gray-500">{new Date(tx.created).toLocaleDateString()}</td>
                                                            <td className="p-4">
                                                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${tx.type === 'charge' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                                    {tx.type}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-xs text-gray-400 truncate max-w-[200px]">{tx.description || tx.id}</td>
                                                            <td className="p-4 text-right text-xs text-gray-300 font-mono">${tx.amount.toFixed(2)}</td>
                                                            <td className="p-4 text-right text-xs text-red-400/50 font-mono">-${tx.fee.toFixed(2)}</td>
                                                            <td className="p-4 text-right text-xs font-black text-white font-mono">${tx.net.toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Recent Payouts */}
                                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                                        <h3 className="font-bold text-white mb-5 flex items-center gap-2 text-sm"><CreditCard className="w-4 h-4 text-purple-500" /> Recent Payouts</h3>
                                        <div className="space-y-3">
                                            {loadingFinancials ? (
                                                <TableSkeleton rows={5} cols={1} />
                                            ) : stripeStats?.recentPayouts.map((payout: any) => (
                                                <div key={payout.id} className="bg-black/40 border border-gray-800 p-3 rounded-xl">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-xs font-black text-white">${payout.amount.toFixed(2)}</span>
                                                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${payout.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                            {payout.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px] text-gray-500">
                                                        <span>{payout.bankName}</span>
                                                        <span>{new Date(payout.arrivalDate).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Financial Context */}
                                    <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-2xl p-5">
                                        <h3 className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-4">Financial Policy</h3>
                                        <p className="text-[10px] text-gray-400 leading-relaxed mb-4">
                                            Payouts are automatically initiated according to your Stripe schedule. Charges typically clear to "Available" within 2 business days.
                                        </p>
                                        <div className="flex items-center gap-2 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                            <ShieldCheck className="w-4 h-4 text-indigo-400" />
                                            <span className="text-[9px] text-indigo-300 font-bold uppercase">Stripe Secure Connection Active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- SPECIALISTS --- */}
                    {activeTab === 'specialists' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black">Specialist Roster</h2>
                                    <p className="text-gray-500 text-xs">{companions.length} Active Specialists</p>
                                </div>
                                <div className="flex gap-2 bg-gray-900 p-1 rounded-lg">
                                    <button onClick={() => setSpecialistView('list')} className={`p-1.5 rounded-md transition-colors ${specialistView === 'list' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}><List className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => setSpecialistView('grid')} className={`p-1.5 rounded-md transition-colors ${specialistView === 'grid' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>

                            {specialistView === 'list' ? (
                                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-black text-[10px] font-bold text-gray-500 uppercase">
                                            <tr>
                                                <th className="p-4">Specialist</th>
                                                <th className="p-4">Specialty</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4 text-right">Rating</th>
                                                <th className="p-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {loading ? (
                                                <tr><td colSpan={5} className="p-0"><TableSkeleton rows={6} cols={5} /></td></tr>
                                            ) : companions.map((comp) => (
                                                <tr key={comp.id} className="hover:bg-gray-800/50">
                                                    <td className="p-4 flex items-center gap-3">
                                                        <AvatarImage src={comp.imageUrl} alt={comp.name} className="w-7 h-7 rounded-full object-cover" />
                                                        <span className="font-bold text-xs text-white">{comp.name}</span>
                                                    </td>
                                                    <td className="p-4 text-[10px] text-gray-400">{comp.specialty}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${comp.status === 'AVAILABLE' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                                                            {comp.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right text-xs font-mono text-yellow-500">{comp.rating}</td>
                                                    <td className="p-4 text-right">
                                                        <button onClick={() => handleToggleStatus(comp.id, comp.status)} className="text-[10px] font-bold text-blue-500 hover:text-blue-400">Toggle Status</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>

                                    </table>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {loading ? (
                                        [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                            <div key={i} className="bg-gray-950 border border-gray-900 p-4 rounded-xl flex flex-col items-center gap-3 animate-pulse">
                                                <div className="w-12 h-12 rounded-full bg-gray-900" />
                                                <div className="h-3 w-20 bg-gray-900 rounded" />
                                                <div className="h-2 w-16 bg-gray-900 rounded" />
                                            </div>
                                        ))
                                    ) : companions.map((comp) => (
                                        <div key={comp.id} className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex flex-col items-center text-center">
                                            <AvatarImage src={comp.imageUrl} alt={comp.name} className="w-12 h-12 rounded-full object-cover mb-2" />
                                            <h3 className="font-bold text-white text-xs">{comp.name}</h3>
                                            <p className="text-[10px] text-gray-500 mb-2">{comp.specialty}</p>
                                            <button onClick={() => handleToggleStatus(comp.id, comp.status)} className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase ${comp.status === 'AVAILABLE' ? 'bg-green-500 text-black' : 'bg-gray-700 text-gray-400'}`}>
                                                {comp.status}
                                            </button>
                                        </div>
                                    ))}
                                </div>

                            )}
                        </div>
                    )}

                    {/* --- SYSTEM CLAIM PAGE --- */}
                    {activeTab === 'claim' && (
                        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                                    <Shield className="w-6 h-6 text-black" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black">{t('admin_sys_claim')}</h2>
                                    <p className="text-gray-500 text-xs uppercase tracking-widest font-mono">Verification Level: Maximum</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 hover:opacity-10 transition-opacity"><Crown className="w-24 h-24 text-white" /></div>
                                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Ownership Verified</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                        This system is currently claimed by a verified Root Administrator.
                                        Critical operations are locked behind Level 5 authentication.
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center bg-black/50 p-3 rounded-xl border border-gray-800">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Primary Owner</span>
                                            <span className="text-xs text-white font-mono">{users.find(u => u.role === 'ADMIN')?.email || 'Root Admin'}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-black/50 p-3 rounded-xl border border-gray-800">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Claim Date</span>
                                            <span className="text-xs text-white font-mono">Jan 13, 2026</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl">
                                    <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm"><Lock className="w-4 h-4 text-red-500" /> Reclamation Protocol</h3>
                                    <p className="text-gray-400 text-xs mb-6">
                                        In the event of lost access, the system can be reclaimed using the <span className="text-red-400 font-bold">Master Security Key</span> set in the environment configuration.
                                    </p>
                                    <div className="p-4 bg-black rounded-xl border border-gray-800 border-dashed">
                                        <label className="text-[9px] text-gray-600 font-black uppercase mb-2 block">Safety Key Status</label>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 w-full animate-pulse"></div>
                                            </div>
                                            <span className="text-[10px] text-blue-400 font-bold">ACTIVE</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-gray-600 mt-4 italic text-center">Protocol 99: Master Key Reset will terminate all current sessions.</p>
                                </div>
                            </div>

                            <div className="bg-yellow-500/5 border border-yellow-500/20 p-6 rounded-3xl">
                                <h3 className="text-yellow-500 font-bold mb-4 flex items-center gap-2 text-sm"><AlertTriangle className="w-4 h-4" /> Admin Security Best Practices</h3>
                                <ul className="grid md:grid-cols-2 gap-4">
                                    {[
                                        "Rotate Master Security Key every 90 days.",
                                        "Never share admin credentials via unencrypted channels.",
                                        "Monitor the Incident Feed for unauthorized access attempts.",
                                        "Keep at least one backup Root Administrator email verified."
                                    ].map((item, i) => (
                                        <li key={i} className="flex gap-3 items-start">
                                            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                            <span className="text-xs text-gray-400 leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* --- SETTINGS --- */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <h2 className="text-2xl font-black">{t('admin_config')}</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl space-y-4">
                                    <h3 className="font-bold text-white mb-2 text-sm">Pricing Control</h3>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-400">Active Sale ($1.59/m)</span>
                                        <button
                                            onClick={() => handleSettingChange('saleMode', !settings.saleMode)}
                                            className={`w-10 h-5 rounded-full p-0.5 transition-colors ${settings.saleMode ? 'bg-green-500' : 'bg-gray-700'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${settings.saleMode ? 'translate-x-5' : ''}`}></div>
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl space-y-4">
                                    <h3 className="font-bold text-white mb-2 text-sm">System Access</h3>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Ban className="w-3.5 h-3.5 text-red-500" />
                                            <span className="text-xs text-gray-400">Maintenance Mode</span>
                                        </div>
                                        <button
                                            onClick={() => handleSettingChange('maintenanceMode', !settings.maintenanceMode)}
                                            className={`w-10 h-5 rounded-full p-0.5 transition-colors ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-700'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${settings.maintenanceMode ? 'translate-x-5' : ''}`}></div>
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl space-y-4">
                                    <h3 className="font-bold text-white mb-2 text-sm">Concurrency Limit</h3>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Server className="w-3.5 h-3.5 text-purple-500" />
                                                <span className="text-xs text-gray-400">Capacity</span>
                                            </div>
                                            <span className="font-mono font-bold text-white text-sm">{settings.maxConcurrentSessions}</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-black p-1.5 rounded-xl border border-gray-800">
                                            <button
                                                onClick={() => handleSettingChange('maxConcurrentSessions', 3)}
                                                className={`py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${settings.maxConcurrentSessions === 3 ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'text-gray-500 hover:bg-gray-800'}`}
                                            >
                                                <Shield className="w-3 h-3" /> Low (3)
                                            </button>
                                            <button
                                                onClick={() => handleSettingChange('maxConcurrentSessions', 15)}
                                                className={`py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${settings.maxConcurrentSessions === 15 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'text-gray-500 hover:bg-gray-800'}`}
                                            >
                                                <Zap className="w-3 h-3" /> Std (15)
                                            </button>
                                            <div className="relative flex items-center">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className={`w-full bg-transparent border-0 text-center font-bold text-xs outline-none transition-colors ${settings.maxConcurrentSessions > 15 ? 'text-green-400' : 'text-gray-500'}`}
                                                    value={settings.maxConcurrentSessions}
                                                    onChange={(e) => handleSettingChange('maxConcurrentSessions', Math.min(1000000, Math.max(1, parseInt(e.target.value) || 1)))}
                                                    onFocus={() => { isEditingConcurrencyRef.current = true; }}
                                                    onBlur={() => { isEditingConcurrencyRef.current = false; }}
                                                    placeholder="Custom"
                                                />
                                                {settings.maxConcurrentSessions > 1000 && <span className="absolute right-2 text-[8px] text-green-500 font-black uppercase">MAX</span>}
                                            </div>
                                        </div>
                                        <div className="text-[9px] text-gray-500 text-center font-mono">
                                            {settings.maxConcurrentSessions > 9999 ? 'Ready for High Traffic Event' : 'Standard Operations Pattern'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <ConfirmModal
                isOpen={confirmState.open}
                title={confirmState.title}
                message={confirmState.message}
                type={confirmState.type}
                onConfirm={confirmState.action}
                onCancel={() => setConfirmState({ ...confirmState, open: false })}
            />

            <InputModal
                isOpen={inputState.open}
                title={inputState.title}
                placeholder={inputState.placeholder}
                onConfirm={(val) => handleTopUpCredit(inputState.userId, val)}
                onCancel={() => setInputState({ ...inputState, open: false })}
            />
        </div>
    );
};


export default AdminDashboard;
