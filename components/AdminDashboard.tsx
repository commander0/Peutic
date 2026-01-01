
import React, { useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    AreaChart, Area, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
    Users, DollarSign, Activity, LogOut, Settings, Video, 
    Search, Edit2, Ban, Zap, ShieldAlert, 
    Terminal, Globe, Megaphone, Menu, X, Gift, Download, Tag,
    Clock, Server, Star, LayoutGrid, List, Heart, TrendingUp, AlertTriangle, UserCheck, Shield, Eye, Trash2, PlusCircle, CheckCircle, Power, Lock
} from 'lucide-react';
import { Database, STABLE_AVATAR_POOL } from '../services/database';
import { User, UserRole, Companion, Transaction, GlobalSettings, SystemLog, PromoCode, SessionFeedback, MoodEntry } from '../types';

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
  const [settings, setSettings] = useState<GlobalSettings>(Database.getSettings());
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [waitingCount, setWaitingCount] = useState(0);
  
  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [specialistView, setSpecialistView] = useState<'grid' | 'list'>('list');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  
  // Computed
  const MAX_CONCURRENT_CAPACITY = 15;
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
        setUsers(Database.getAllUsers());
        setCompanions(Database.getCompanions());
        setTransactions(Database.getAllTransactions());
        const s = Database.getSettings();
        setSettings(s);
        setBroadcastMsg(s.broadcastMessage || '');
        setLogs(Database.getSystemLogs());
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

  const handleToggleStatus = (id: string, current: string) => {
      const comp = companions.find(c => c.id === id);
      if (comp) {
          const next = current === 'AVAILABLE' ? 'BUSY' : current === 'BUSY' ? 'OFFLINE' : 'AVAILABLE';
          Database.updateCompanion({...comp, status: next as any});
          // Optimistic update
          setCompanions(prev => prev.map(c => c.id === id ? {...c, status: next as any} : c));
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

  const handleTopUp = (userId: string) => {
      const amount = prompt("Enter minutes to add:");
      if (amount && !isNaN(parseInt(amount))) {
          Database.topUpWallet(parseInt(amount), 0, userId); // 0 cost for admin grant
          alert("Credits added successfully.");
          setUsers(Database.getAllUsers()); // Refresh immediately
      }
  };

  const handleBroadcast = () => {
      const updated = { ...settings, broadcastMessage: broadcastMsg };
      Database.saveSettings(updated);
      setSettings(updated);
      alert("Broadcast updated for all users.");
  };

  const clearBroadcast = () => {
      const updated = { ...settings, broadcastMessage: '' };
      Database.saveSettings(updated);
      setSettings(updated);
      setBroadcastMsg('');
  };

  const handleSettingChange = (key: keyof GlobalSettings, value: any) => {
      const updated = { ...settings, [key]: value };
      setSettings(updated);
      Database.saveSettings(updated);
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

                      <div className="grid lg:grid-cols-3 gap-8">
                          {/* Live Concurrency & Waiting Meters */}
                          <div className="lg:col-span-2 space-y-8">
                              
                              {/* 1. Active Concurrency */}
                              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                                  <h3 className="font-bold text-white mb-6 flex items-center gap-2"><Server className="w-5 h-5 text-purple-500"/> Real-time Concurrency</h3>
                                  
                                  {/* 15 Block Meter */}
                                  <div className="grid grid-cols-5 md:grid-cols-15 gap-2 md:gap-3 mb-4">
                                      {Array.from({ length: 15 }).map((_, i) => (
                                          <div 
                                              key={i} 
                                              className={`aspect-square rounded-lg transition-all duration-500 border border-black/20 ${i < activeCount ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-gray-800/50'}`}
                                          ></div>
                                      ))}
                                  </div>
                                  <div className="flex justify-between text-xs font-mono text-gray-500 uppercase tracking-widest">
                                      <span>0 Sessions</span>
                                      <span>{activeCount} Active</span>
                                      <span>15 Max</span>
                                  </div>
                              </div>

                              {/* 2. Waiting Room */}
                              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                                  <h3 className="font-bold text-white mb-6 flex items-center gap-2"><Clock className="w-5 h-5 text-yellow-500"/> Waiting Room</h3>
                                  
                                  {/* 35 Block Meter */}
                                  <div className="grid grid-cols-7 gap-2 md:gap-3 mb-4">
                                      {Array.from({ length: 35 }).map((_, i) => (
                                          <div 
                                              key={i} 
                                              className={`aspect-square rounded-lg transition-all duration-500 border border-black/20 ${i < waitingCount ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)] animate-pulse' : 'bg-gray-800/50'}`}
                                          ></div>
                                      ))}
                                  </div>
                                  <div className="flex justify-between text-xs font-mono text-gray-500 uppercase tracking-widest">
                                      <span>0 Waiting</span>
                                      <span>{waitingCount} Queued</span>
                                      <span>35 Max</span>
                                  </div>
                              </div>

                              {/* Global Broadcaster */}
                              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Megaphone className="w-24 h-24 text-white"/></div>
                                  <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Megaphone className="w-5 h-5 text-blue-500"/> Global Broadcast System</h3>
                                  <div className="flex gap-4">
                                      <input 
                                          value={broadcastMsg}
                                          onChange={(e) => setBroadcastMsg(e.target.value)}
                                          placeholder="Enter emergency or system message for all users..."
                                          className="flex-1 bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                                      />
                                      <button onClick={handleBroadcast} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">Send</button>
                                      {settings.broadcastMessage && <button onClick={clearBroadcast} className="bg-gray-800 hover:bg-gray-700 text-gray-400 px-6 py-3 rounded-xl font-bold transition-colors">Clear</button>}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-2 ml-1">Message appears on user dashboards immediately.</p>
                              </div>
                          </div>

                          {/* Live Feed */}
                          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                              <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-yellow-500"/> Activity Log</h3>
                              <div className="space-y-2">
                                  {logs.slice(0, 7).map(log => (
                                      <div key={log.id} className="flex justify-between items-center bg-black/50 p-3 rounded-lg border border-gray-800/50">
                                          <div className="flex items-center gap-3">
                                              <div className={`w-2 h-2 rounded-full ${log.type === 'ERROR' ? 'bg-red-500' : log.type === 'WARNING' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                              <span className="text-xs text-gray-300 font-mono line-clamp-1">{log.event}</span>
                                          </div>
                                          <span className="text-[10px] text-gray-600 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
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
                      <h2 className="text-3xl font-black mb-1">Safety Headquarters</h2>
                      <p className="text-gray-500 text-sm mb-6">Monitor high-risk interactions and flagged journals.</p>
                      
                      <div className="grid md:grid-cols-3 gap-6">
                          <div className="col-span-2 bg-red-950/10 border border-red-900/30 p-6 rounded-2xl">
                              <div className="flex items-center gap-3 mb-6">
                                  <ShieldAlert className="w-6 h-6 text-red-500" />
                                  <h3 className="font-bold text-white">Keyword Watchlist</h3>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                  {["Self-harm", "Suicide", "Danger", "Hurt", "Kill", "Weapon", "Emergency"].map(word => (
                                      <span key={word} className="px-3 py-1 bg-red-900/40 border border-red-800 text-red-300 rounded-full text-xs font-bold uppercase tracking-wide">{word}</span>
                                  ))}
                                  <button className="px-3 py-1 bg-gray-800 border border-gray-700 text-gray-400 rounded-full text-xs font-bold hover:text-white">+</button>
                              </div>
                          </div>

                          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                              <h3 className="font-bold text-white mb-4">Incident Reports</h3>
                              <div className="text-center py-8 text-gray-500 text-xs border border-dashed border-gray-800 rounded-xl">
                                  No active incidents reported in last 24h.
                              </div>
                          </div>
                      </div>

                      <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                          <h3 className="font-bold text-white mb-4">Banned Users</h3>
                          <div className="space-y-2">
                              {users.filter(u => u.subscriptionStatus === 'BANNED').length === 0 ? (
                                  <div className="text-gray-500 text-xs">No banned users.</div>
                              ) : (
                                  users.filter(u => u.subscriptionStatus === 'BANNED').map(u => (
                                      <div key={u.id} className="flex justify-between items-center bg-black p-3 rounded-lg border border-red-900/30">
                                          <span className="text-red-400 font-bold text-xs">{u.email}</span>
                                          <button onClick={() => { if(confirm("Unban?")) Database.updateUser({...u, subscriptionStatus: 'ACTIVE'}); }} className="text-gray-500 hover:text-white text-[10px] uppercase font-bold">Unban</button>
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

              {/* --- FINANCIAL INTELLIGENCE (Replaces Analytics) --- */}
              {activeTab === 'financials' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                      <h2 className="text-3xl font-black">Financial Intelligence</h2>
                      <div className="grid md:grid-cols-3 gap-6">
                          <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
                              <h3 className="font-bold text-white mb-6">Revenue Trend (7 Days)</h3>
                              <div className="h-[300px]">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={revenueData}>
                                          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                          <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                          <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                          <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                                          <Bar dataKey="amount" fill="#22C55E" radius={[4, 4, 0, 0]} />
                                      </BarChart>
                                  </ResponsiveContainer>
                              </div>
                          </div>
                          
                          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
                              <div className="p-6 bg-green-500/10 rounded-full mb-6 border border-green-500/30">
                                  <DollarSign className="w-12 h-12 text-green-500" />
                              </div>
                              <h3 className="text-3xl font-black text-white mb-2">${totalRevenue.toLocaleString()}</h3>
                              <p className="text-gray-500 text-sm uppercase tracking-widest">Total Gross Revenue</p>
                          </div>
                      </div>
                  </div>
              )}

              {/* --- SPECIALISTS --- */}
              {activeTab === 'specialists' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                      <div className="flex justify-between items-center">
                          <div>
                              <h2 className="text-3xl font-black">Specialist Roster</h2>
                              <p className="text-gray-500 text-sm">{companions.length} Active Specialists</p>
                          </div>
                          <div className="flex gap-2 bg-gray-900 p-1 rounded-lg">
                              <button onClick={() => setSpecialistView('list')} className={`p-2 rounded-md transition-colors ${specialistView === 'list' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}><List className="w-4 h-4"/></button>
                              <button onClick={() => setSpecialistView('grid')} className={`p-2 rounded-md transition-colors ${specialistView === 'grid' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}><LayoutGrid className="w-4 h-4"/></button>
                          </div>
                      </div>

                      {specialistView === 'list' ? (
                          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                              <table className="w-full text-left">
                                  <thead className="bg-black text-xs font-bold text-gray-500 uppercase">
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
                                                  <AvatarImage src={comp.imageUrl} alt={comp.name} className="w-8 h-8 rounded-full object-cover" />
                                                  <span className="font-bold text-sm text-white">{comp.name}</span>
                                              </td>
                                              <td className="p-4 text-xs text-gray-400">{comp.specialty}</td>
                                              <td className="p-4">
                                                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${comp.status === 'AVAILABLE' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                                                      {comp.status}
                                                  </span>
                                              </td>
                                              <td className="p-4 text-right text-sm font-mono text-yellow-500">{comp.rating}</td>
                                              <td className="p-4 text-right">
                                                   <button onClick={() => handleToggleStatus(comp.id, comp.status)} className="text-xs font-bold text-blue-500 hover:text-blue-400">Toggle Status</button>
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
                                      <AvatarImage src={comp.imageUrl} alt={comp.name} className="w-16 h-16 rounded-full object-cover mb-3" />
                                      <h3 className="font-bold text-white text-sm">{comp.name}</h3>
                                      <p className="text-xs text-gray-500 mb-2">{comp.specialty}</p>
                                      <button onClick={() => handleToggleStatus(comp.id, comp.status)} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${comp.status === 'AVAILABLE' ? 'bg-green-500 text-black' : 'bg-gray-700 text-gray-400'}`}>
                                          {comp.status}
                                      </button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              )}

              {/* --- SETTINGS --- */}
              {activeTab === 'settings' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                      <h2 className="text-3xl font-black">System Configuration</h2>
                      <div className="grid md:grid-cols-2 gap-6">
                          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl space-y-4">
                              <h3 className="font-bold text-white mb-4">Pricing Control</h3>
                              <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-400">Active Sale ($1.59/m)</span>
                                  <button 
                                    onClick={() => handleSettingChange('saleMode', !settings.saleMode)}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.saleMode ? 'bg-green-500' : 'bg-gray-700'}`}
                                  >
                                      <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${settings.saleMode ? 'translate-x-6' : ''}`}></div>
                                  </button>
                              </div>
                          </div>

                          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl space-y-4">
                              <h3 className="font-bold text-white mb-4">System Access</h3>
                              <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                      <Ban className="w-4 h-4 text-red-500"/>
                                      <span className="text-sm text-gray-400">Maintenance Mode</span>
                                  </div>
                                  <button 
                                    onClick={() => handleSettingChange('maintenanceMode', !settings.maintenanceMode)}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-700'}`}
                                  >
                                      <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${settings.maintenanceMode ? 'translate-x-6' : ''}`}></div>
                                  </button>
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
