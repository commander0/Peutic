
import React, { useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
    Users, DollarSign, Activity, LogOut, Settings, Video, 
    Search, Ban, Zap, ShieldAlert, 
    Clock, Server, LayoutGrid, List, Trash2, Gift, Menu, X, Megaphone
} from 'lucide-react';
import { Database, STABLE_AVATAR_POOL } from '../services/database';
import { User, Companion, Transaction, GlobalSettings, SystemLog } from '../types';

// --- STAT CARD ---
const StatCard = ({ title, value, icon: Icon, subValue, subLabel, progress, color = "yellow" }: any) => (
  <div className={`bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-6 rounded-2xl shadow-lg hover:border-${color}-500/30 transition-all group relative overflow-hidden`}>
      <div className="flex justify-between items-start mb-4">
          <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{title}</p>
              <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl bg-black border border-gray-800 group-hover:text-${color}-500 transition-colors`}>
              <Icon className={`w-5 h-5 text-gray-400 group-hover:text-${color}-500 transition-colors`} />
          </div>
      </div>
      {subValue && (
          <div className="flex items-center gap-2 text-xs">
              <span className={`font-bold ${subValue.toString().includes('FULL') || subValue.toString().includes('-') ? 'text-red-500' : subValue.toString().includes('+') ? 'text-green-500' : 'text-gray-300'}`}>{subValue}</span>
              <span className="text-gray-600">{subLabel}</span>
          </div>
      )}
      {progress !== undefined && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800">
            <div className={`h-full transition-all duration-700 ease-out ${progress >= 90 ? 'bg-red-500' : `bg-${color}-500`}`} style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      )}
  </div>
);

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

const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'safety' | 'users' | 'specialists' | 'financials' | 'settings'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({
        pricePerMinute: 1.59,
        saleMode: true,
        maintenanceMode: false,
        allowSignups: true,
        siteName: 'Peutic',
        maxConcurrentSessions: 15,
        multilingualMode: true
  });
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [waitingCount, setWaitingCount] = useState(0);
  
  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [specialistView, setSpecialistView] = useState<'grid' | 'list'>('list');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  
  // Computed
  const MAX_CONCURRENT_CAPACITY = settings.maxConcurrentSessions || 15;
  const WAITING_ROOM_CAPACITY = 35;
  const totalRevenue = transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + (t.cost || 0), 0);
  
  // Revenue Data for Chart
  const revenueData = [
      { name: 'Mon', amount: 1200 },
      { name: 'Tue', amount: 1500 },
      { name: 'Wed', amount: 1800 },
      { name: 'Thu', amount: 2200 },
      { name: 'Fri', amount: 1600 },
      { name: 'Sat', amount: 2500 },
      { name: 'Sun', amount: 2100 },
  ];

  // Sync Data
  useEffect(() => {
    const fetchData = async () => {
        setUsers(await Database.getAllUsers());
        setCompanions(await Database.getCompanions());
        setTransactions(await Database.getAllTransactions());
        const s = await Database.getSettings();
        setSettings(s);
        setBroadcastMsg(s.broadcastMessage || '');
        setLogs(await Database.getSystemLogs());
        try {
            const count = await Database.getActiveSessionCount();
            setActiveCount(count);
            const queue = await Database.getQueueLength();
            setWaitingCount(queue);
        } catch (e) {}
    };
    fetchData();
    const interval = setInterval(fetchData, 3000); 
    return () => clearInterval(interval);
  }, []);

  const handleToggleStatus = async (id: string, current: string) => {
      const comp = companions.find(c => c.id === id);
      if (comp) {
          const next = current === 'AVAILABLE' ? 'BUSY' : current === 'BUSY' ? 'OFFLINE' : 'AVAILABLE';
          const updated = {...comp, status: next as any};
          await Database.updateCompanion(updated);
          setCompanions(prev => prev.map(c => c.id === id ? updated : c));
      }
  };

  const handleDeleteUser = async (userId: string, idx: number) => {
      if (idx === 0) { alert("SECURITY ALERT: Cannot delete Root Admin account."); return; }
      if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
          await Database.deleteUser(userId);
          setUsers(users.filter(u => u.id !== userId));
      }
  };

  const handleTopUp = (userId: string) => {
      const amount = prompt("Enter minutes to add:");
      if (amount && !isNaN(parseInt(amount))) {
          Database.topUpWallet(parseInt(amount), 0, userId); // 0 cost for admin grant
          alert("Credits added successfully.");
      }
  };

  const handleBroadcast = async () => {
      const updated = { ...settings, broadcastMessage: broadcastMsg };
      await Database.saveSettings(updated);
      setSettings(updated);
      alert("Broadcast updated for all users.");
  };

  const clearBroadcast = async () => {
      const updated = { ...settings, broadcastMessage: '' };
      await Database.saveSettings(updated);
      setSettings(updated);
      setBroadcastMsg('');
  };

  const handleSettingChange = async (key: keyof GlobalSettings, value: any) => {
      const updated = { ...settings, [key]: value };
      setSettings(updated);
      await Database.saveSettings(updated);
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-black text-white font-sans flex overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`fixed md:static inset-y-0 left-0 w-72 bg-gray-950 border-r border-gray-800 z-50 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col`}>
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                      <Activity className="w-6 h-6 text-black" />
                  </div>
                  <div>
                      <h1 className="font-black text-xl tracking-tight">PEUTIC<span className="text-gray-500 font-medium">OS</span></h1>
                      <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">System Optimal</span>
                      </div>
                  </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500"><X className="w-6 h-6"/></button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {[
                  { id: 'overview', icon: LayoutGrid, label: 'Mission Control' },
                  { id: 'safety', icon: ShieldAlert, label: 'Safety HQ' },
                  { id: 'users', icon: Users, label: 'User Database' },
                  { id: 'specialists', icon: Video, label: 'Specialist Grid' },
                  { id: 'financials', icon: DollarSign, label: 'Financial Intelligence' },
                  { id: 'settings', icon: Settings, label: 'Configuration' },
              ].map((item) => (
                  <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id as any); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                          activeTab === item.id 
                          ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' 
                          : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                      }`}
                  >
                      <item.icon className="w-4 h-4" /> {item.label}
                  </button>
              ))}
          </nav>

          <div className="p-4 border-t border-gray-800">
              <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-900/10 text-red-500 hover:bg-red-900/30 border border-red-900/30 font-bold text-xs uppercase tracking-widest transition-all">
                  <LogOut className="w-4 h-4" /> Terminate Session
              </button>
          </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-black relative">
          <div className="md:hidden sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4 flex justify-between items-center z-40">
              <span className="font-black text-lg">ADMIN</span>
              <button onClick={() => setSidebarOpen(true)}><Menu className="w-6 h-6 text-white" /></button>
          </div>

          <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8">
              
              {/* --- OVERVIEW (MISSION CONTROL) --- */}
              {activeTab === 'overview' && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                      <div>
                          <h2 className="text-3xl font-black tracking-tight mb-1">System Overview</h2>
                          <p className="text-gray-500 text-sm">Real-time command center.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <StatCard title="Active Sessions" value={activeCount} icon={Video} subValue={`${MAX_CONCURRENT_CAPACITY} Max`} subLabel="Capacity" progress={(activeCount / MAX_CONCURRENT_CAPACITY) * 100} color="purple" />
                          <StatCard title="Waiting Room" value={waitingCount} icon={Clock} subValue={`${WAITING_ROOM_CAPACITY} Max`} subLabel="Capacity" progress={(waitingCount / WAITING_ROOM_CAPACITY) * 100} color="yellow" />
                          <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} subValue="+8.4%" subLabel="MoM" color="green" />
                          <StatCard title="Total Users" value={users.length} icon={Users} subValue="+12" subLabel="Today" color="blue" />
                      </div>
                  </div>
              )}

              {/* --- USERS TAB --- */}
              {activeTab === 'users' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                      <div className="flex justify-between items-center">
                          <h2 className="text-3xl font-black">User Database</h2>
                          <input 
                              className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-sm focus:border-yellow-500 outline-none w-64" 
                              placeholder="Search users..." 
                              value={searchTerm}
                              onChange={e => setSearchTerm(e.target.value)}
                          />
                      </div>
                      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                          <table className="w-full text-left">
                              <thead className="bg-black text-xs font-bold text-gray-500 uppercase">
                                  <tr>
                                      <th className="p-4">User</th>
                                      <th className="p-4">Role</th>
                                      <th className="p-4">Credits</th>
                                      <th className="p-4 text-right">Joined</th>
                                      <th className="p-4 text-right">Actions</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-800">
                                  {filteredUsers.map((user, idx) => (
                                      <tr key={user.id} className="hover:bg-gray-800/50">
                                          <td className="p-4 font-bold text-white text-sm">{user.name} <span className="text-gray-500 font-normal ml-1">({user.email})</span></td>
                                          <td className="p-4 text-xs text-gray-400">{user.role}</td>
                                          <td className="p-4 text-green-400 font-mono font-bold text-sm">{user.balance}m</td>
                                          <td className="p-4 text-right text-gray-500 text-xs font-mono">{new Date(user.joinedAt).toLocaleDateString()}</td>
                                          <td className="p-4 text-right flex justify-end gap-2">
                                              <button onClick={() => handleTopUp(user.id)} className="text-blue-500 hover:text-blue-400 p-2 transition-colors bg-blue-500/10 rounded-lg" title="Top Up Credits">
                                                  <Gift className="w-4 h-4"/>
                                              </button>
                                              <button onClick={() => handleDeleteUser(user.id, idx)} className={`p-2 transition-colors rounded-lg ${idx === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-red-500 hover:text-red-400 bg-red-500/10'}`} title={idx === 0 ? "Cannot delete Root Admin" : "Delete User"}>
                                                  <Trash2 className="w-4 h-4"/>
                                              </button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}
          </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
