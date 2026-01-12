
import React, { useState, useEffect, useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
    Users, DollarSign, Activity, LogOut, Settings, Video, 
    Ban, Zap, ShieldAlert, 
    Menu, X, Gift,
    Clock, Server, Star, LayoutGrid, List, Trash2, Shield, Eye
} from 'lucide-react';
import { Database, STABLE_AVATAR_POOL } from '../services/database';
import { User, Companion, Transaction, GlobalSettings, SystemLog } from '../types';

// --- STAT CARD ---
const StatCard = ({ title, value, icon: Icon, subValue, subLabel, progress, color = "yellow" }: any) => (
  <div className={`bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-5 rounded-2xl shadow-lg hover:border-${color}-500/30 transition-all group relative overflow-hidden`}>
      <div className="flex justify-between items-start mb-3">
          <div>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">{title}</p>
              <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
          </div>
          <div className={`p-2.5 rounded-xl bg-black border border-gray-800 group-hover:text-${color}-500 transition-colors`}>
              <Icon className={`w-4 h-4 text-gray-400 group-hover:text-${color}-500 transition-colors`} />
          </div>
      </div>
      {subValue && (
          <div className="flex items-center gap-2 text-[10px]">
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
  const [settings, setSettings] = useState<GlobalSettings>(Database.getSettings());
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
  const totalRevenue = transactions.filter(t => t.cost && t.cost > 0).reduce((acc, t) => acc + (t.cost || 0), 0);
  
  // Calculate Real Revenue Data (Last 7 Days)
  const revenueData = useMemo(() => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      const last7Days = Array.from({length: 7}, (_, i) => {
          const d = new Date(today);
          d.setDate(today.getDate() - (6 - i));
          return d;
      });

      return last7Days.map(date => {
          const dayName = days[date.getDay()];
          const dateStr = date.toDateString();
          const dailyTotal = transactions
              .filter(t => t.cost && t.cost > 0 && new Date(t.date).toDateString() === dateStr)
              .reduce((acc, t) => acc + (t.cost || 0), 0);
          return { name: dayName, amount: dailyTotal };
      });
  }, [transactions]);

  // Sync Data
  useEffect(() => {
    const fetchData = async () => {
        setUsers(await Database.getAllUsers());
        const comps = await Database.getCompanions();
        setCompanions(comps);
        setTransactions(await Database.getAllTransactions());
        const s = await Database.syncGlobalSettings();
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
          // Optimistic update
          setCompanions(prev => prev.map(c => c.id === id ? updated : c));
      }
  };

  const handleDeleteUser = async (userId: string, idx: number) => {
      if (idx === 0) {
          alert("SECURITY ALERT: Cannot delete Root Admin account.");
          return;
      }
      if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
          await Database.deleteUser(userId);
          setUsers(users.filter(u => u.id !== userId));
      }
  };

  const handleTopUp = async (userId: string) => {
      const amount = prompt("Enter minutes to add:");
      if (amount && !isNaN(parseInt(amount))) {
          await Database.topUpWallet(parseInt(amount), 0, userId); 
          alert("Credits added successfully.");
          setUsers(await Database.getAllUsers()); 
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
      // Optimistic Update
      const updated = { ...settings, [key]: value };
      setSettings(updated);
      // Async Save
      await Database.saveSettings(updated);
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
              <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500"><X className="w-6 h-6"/></button>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
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
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                          activeTab === item.id 
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
                  <LogOut className="w-3.5 h-3.5" /> Terminate Session
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
              
              {activeTab === 'overview' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                      <div>
                          <h2 className="text-2xl font-black tracking-tight mb-1">System Overview</h2>
                          <p className="text-gray-500 text-xs">Real-time command center.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                          <StatCard title="Active Sessions" value={activeCount} icon={Video} subValue={`${MAX_CONCURRENT_CAPACITY} Max`} subLabel="Capacity" progress={(activeCount / MAX_CONCURRENT_CAPACITY) * 100} color="purple" />
                          <StatCard title="Waiting Room" value={waitingCount} icon={Clock} subValue={`${WAITING_ROOM_CAPACITY} Max`} subLabel="Capacity" progress={(waitingCount / WAITING_ROOM_CAPACITY) * 100} color="yellow" />
                          <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} subValue="Real-Time" subLabel="Gross" color="green" />
                          <StatCard title="Total Users" value={users.length} icon={Users} subValue="+12" subLabel="Today" color="blue" />
                      </div>
                  </div>
              )}

              {activeTab === 'specialists' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                      <div className="flex justify-between items-center">
                          <div>
                              <h2 className="text-2xl font-black">Specialist Roster</h2>
                              <p className="text-gray-500 text-xs">{companions.length} Active Specialists</p>
                          </div>
                          <div className="flex gap-2 bg-gray-900 p-1 rounded-lg">
                              <button onClick={() => setSpecialistView('list')} className={`p-1.5 rounded-md transition-colors ${specialistView === 'list' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}><List className="w-3.5 h-3.5"/></button>
                              <button onClick={() => setSpecialistView('grid')} className={`p-1.5 rounded-md transition-colors ${specialistView === 'grid' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}><LayoutGrid className="w-3.5 h-3.5"/></button>
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
                                      {companions.map((comp) => (
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
                              {companions.map((comp) => (
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

              {/* --- SETTINGS (FIXED TOGGLES) --- */}
              {activeTab === 'settings' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                      <h2 className="text-2xl font-black">System Configuration</h2>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl space-y-4">
                              <h3 className="font-bold text-white mb-2 text-sm">Pricing Control</h3>
                              <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-400">Active Sale ($1.59/m)</span>
                                  <button 
                                    onClick={() => handleSettingChange('saleMode', !settings.saleMode)}
                                    className={`w-10 h-5 rounded-full p-0.5 transition-colors ${settings.saleMode ? 'bg-green-500' : 'bg-gray-700'}`}
                                  >
                                      <div className={`w-4 h-4 bg-white rounded-full transform transition-transform shadow-sm ${settings.saleMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                  </button>
                              </div>
                          </div>

                          <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl space-y-4">
                              <h3 className="font-bold text-white mb-2 text-sm">System Access</h3>
                              <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                      <Ban className="w-3.5 h-3.5 text-red-500"/>
                                      <span className="text-xs text-gray-400">Maintenance Mode</span>
                                  </div>
                                  <button 
                                    onClick={() => handleSettingChange('maintenanceMode', !settings.maintenanceMode)}
                                    className={`w-10 h-5 rounded-full p-0.5 transition-colors ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-700'}`}
                                  >
                                      <div className={`w-4 h-4 bg-white rounded-full transform transition-transform shadow-sm ${settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                  </button>
                              </div>
                          </div>

                          <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl space-y-4">
                              <h3 className="font-bold text-white mb-2 text-sm">Concurrency Limit</h3>
                              <div className="flex flex-col gap-3">
                                  <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                          <Server className="w-3.5 h-3.5 text-purple-500"/>
                                          <span className="text-xs text-gray-400">Capacity</span>
                                      </div>
                                      <span className="font-mono font-bold text-white text-sm">{settings.maxConcurrentSessions}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 bg-black p-1 rounded-xl border border-gray-800">
                                       <button 
                                          onClick={() => handleSettingChange('maxConcurrentSessions', 3)}
                                          className={`py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${settings.maxConcurrentSessions === 3 ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'text-gray-500 hover:bg-gray-800'}`}
                                       >
                                          <Shield className="w-3 h-3" /> Low (3)
                                       </button>
                                       <button 
                                          onClick={() => handleSettingChange('maxConcurrentSessions', 15)}
                                          className={`py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${settings.maxConcurrentSessions === 15 ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'text-gray-500 hover:bg-gray-800'}`}
                                       >
                                          <Zap className="w-3 h-3" /> Std (15)
                                       </button>
                                  </div>
                                  <div className="relative">
                                     <input 
                                        type="number" 
                                        min="1"
                                        max="50"
                                        className="w-full bg-black border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500 transition-colors text-center"
                                        value={settings.maxConcurrentSessions}
                                        onChange={(e) => handleSettingChange('maxConcurrentSessions', parseInt(e.target.value) || 1)}
                                        placeholder="Custom Limit"
                                     />
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
