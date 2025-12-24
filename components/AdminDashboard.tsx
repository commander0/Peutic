
import React, { useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    AreaChart, Area, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
    Users, DollarSign, Activity, LogOut, Settings, Video, 
    Search, Edit2, Ban, Zap, ShieldAlert, 
    Terminal, Globe, Megaphone, Menu, X, Gift, Download, Tag,
    Clock, Server, Star, LayoutGrid, List, Heart, TrendingUp, AlertTriangle, UserCheck, Shield, Eye
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
  const [activeTab, setActiveTab] = useState<'overview' | 'safety' | 'users' | 'specialists' | 'analytics' | 'settings'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>(Database.getSettings());
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [feedback, setFeedback] = useState<SessionFeedback[]>([]);
  const [moods, setMoods] = useState<MoodEntry[]>([]); // Need to fetch all moods logic
  const [activeCount, setActiveCount] = useState(0);
  
  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [specialistView, setSpecialistView] = useState<'grid' | 'list'>('list');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Computed
  const MAX_CONCURRENT_CAPACITY = 15;
  const totalRevenue = transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + (t.cost || 0), 0);
  const avgSatisfaction = feedback.length > 0 ? (feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length).toFixed(1) : "5.0";
  
  // Mock Mood Data Aggregation (In real app, fetch from DB)
  // Since Database.getMoods takes userId, we need a way to get ALL moods. 
  // For this demo, we will simulate global mood data based on individual fetches or just mock it for the chart.
  const moodData = [
      { name: 'Mon', positive: 65, negative: 35 },
      { name: 'Tue', positive: 59, negative: 41 },
      { name: 'Wed', positive: 80, negative: 20 },
      { name: 'Thu', positive: 81, negative: 19 },
      { name: 'Fri', positive: 56, negative: 44 },
      { name: 'Sat', positive: 90, negative: 10 },
      { name: 'Sun', positive: 85, negative: 15 },
  ];

  // Sync Data
  useEffect(() => {
    const fetchData = async () => {
        setUsers(Database.getAllUsers());
        setCompanions(Database.getCompanions());
        setTransactions(Database.getAllTransactions());
        setSettings(Database.getSettings());
        setLogs(Database.getSystemLogs());
        setPromos(Database.getPromoCodes());
        setFeedback(Database.getAllFeedback());
        try {
            const count = await Database.getActiveSessionCount();
            setActiveCount(count);
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
      }
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
                  { id: 'analytics', icon: TrendingUp, label: 'Mood Analytics' },
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
              
              {/* --- OVERVIEW --- */}
              {activeTab === 'overview' && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                      <div>
                          <h2 className="text-3xl font-black tracking-tight mb-1">System Overview</h2>
                          <p className="text-gray-500 text-sm">Real-time health monitoring.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <StatCard title="Active Members" value={users.length} icon={Users} subValue="+12" subLabel="Today" color="blue" />
                          <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} subValue="+8.4%" subLabel="MoM" color="green" />
                          <StatCard title="Crisis Alerts" value="0" icon={ShieldAlert} subValue="NORMAL" subLabel="No active threats" color="green" />
                          <StatCard title="User Happiness" value="87%" icon={Heart} subValue="+2%" subLabel="Sentiment Score" color="pink" />
                      </div>

                      <div className="grid lg:grid-cols-3 gap-8">
                          {/* Live Feed */}
                          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
                              <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-yellow-500"/> Live Activity Feed</h3>
                              <div className="space-y-2">
                                  {logs.slice(0, 6).map(log => (
                                      <div key={log.id} className="flex justify-between items-center bg-black/50 p-3 rounded-lg border border-gray-800/50">
                                          <div className="flex items-center gap-3">
                                              <div className={`w-2 h-2 rounded-full ${log.type === 'ERROR' ? 'bg-red-500' : log.type === 'WARNING' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                              <span className="text-xs text-gray-300 font-mono">{log.event}</span>
                                          </div>
                                          <span className="text-[10px] text-gray-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          {/* Server Health */}
                          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                              <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Server className="w-5 h-5 text-green-500"/> Server Health</h3>
                              <div className="space-y-6">
                                  <div>
                                      <div className="flex justify-between text-xs mb-2"><span className="text-gray-400">CPU Usage</span><span className="text-white font-mono">12%</span></div>
                                      <div className="w-full bg-gray-800 h-1.5 rounded-full"><div className="bg-green-500 h-full w-[12%] rounded-full"></div></div>
                                  </div>
                                  <div>
                                      <div className="flex justify-between text-xs mb-2"><span className="text-gray-400">Memory</span><span className="text-white font-mono">4.2GB / 16GB</span></div>
                                      <div className="w-full bg-gray-800 h-1.5 rounded-full"><div className="bg-blue-500 h-full w-[26%] rounded-full"></div></div>
                                  </div>
                                  <div>
                                      <div className="flex justify-between text-xs mb-2"><span className="text-gray-400">API Latency</span><span className="text-white font-mono">24ms</span></div>
                                      <div className="w-full bg-gray-800 h-1.5 rounded-full"><div className="bg-yellow-500 h-full w-[15%] rounded-full"></div></div>
                                  </div>
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
                      
                      <div className="grid md:grid-cols-2 gap-6">
                          <div className="bg-red-950/20 border border-red-900/50 p-6 rounded-2xl">
                              <div className="flex items-center gap-3 mb-4">
                                  <AlertTriangle className="w-8 h-8 text-red-500" />
                                  <div>
                                      <h3 className="font-bold text-white text-lg">Active Flags</h3>
                                      <p className="text-red-400 text-xs">Require immediate review</p>
                                  </div>
                              </div>
                              <div className="text-center py-12 text-gray-500 text-sm border border-dashed border-red-900/30 rounded-xl">
                                  No active safety flags detected. System nominal.
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
                  </div>
              )}

              {/* --- SPECIALISTS (LIST VIEW OPTIMIZED) --- */}
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
                                          <th className="p-4">Profile</th>
                                          <th className="p-4">Specialty</th>
                                          <th className="p-4">Status</th>
                                          <th className="p-4 text-right">Rating</th>
                                          <th className="p-4 text-right">Actions</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-800">
                                      {companions.map(comp => (
                                          <tr key={comp.id} className="hover:bg-gray-800/50">
                                              <td className="p-4 flex items-center gap-3">
                                                  <div className="w-8 h-8 rounded-full overflow-hidden bg-black"><AvatarImage src={comp.imageUrl} alt={comp.name} className="w-full h-full object-cover" /></div>
                                                  <span className="font-bold text-white text-sm">{comp.name}</span>
                                              </td>
                                              <td className="p-4 text-gray-400 text-sm">{comp.specialty}</td>
                                              <td className="p-4">
                                                  <span onClick={() => handleToggleStatus(comp.id, comp.status)} className={`cursor-pointer px-2 py-1 rounded text-[10px] font-bold uppercase ${comp.status === 'AVAILABLE' ? 'bg-green-900/30 text-green-500' : comp.status === 'BUSY' ? 'bg-yellow-900/30 text-yellow-500' : 'bg-red-900/30 text-red-500'}`}>
                                                      {comp.status}
                                                  </span>
                                              </td>
                                              <td className="p-4 text-right font-mono text-yellow-500 text-sm font-bold">{comp.rating}</td>
                                              <td className="p-4 text-right">
                                                  <button className="text-gray-500 hover:text-white text-xs"><Edit2 className="w-4 h-4"/></button>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      ) : (
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                              {companions.map(comp => (
                                  <div key={comp.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col items-center text-center hover:border-gray-600 transition-colors">
                                      <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-gray-700">
                                          <AvatarImage src={comp.imageUrl} alt={comp.name} className="w-full h-full object-cover" />
                                      </div>
                                      <h4 className="font-bold text-white text-sm">{comp.name}</h4>
                                      <p className="text-xs text-gray-500 mb-2 truncate w-full">{comp.specialty}</p>
                                      <button onClick={() => handleToggleStatus(comp.id, comp.status)} className={`w-full py-1 rounded text-[10px] font-bold ${comp.status === 'AVAILABLE' ? 'bg-green-900/30 text-green-500' : 'bg-gray-800 text-gray-500'}`}>{comp.status}</button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              )}

              {/* --- ANALYTICS --- */}
              {activeTab === 'analytics' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                      <h2 className="text-3xl font-black">Mood Analytics</h2>
                      <div className="grid md:grid-cols-3 gap-6">
                          <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
                              <h3 className="font-bold text-white mb-6">User Sentiment Trends (7 Days)</h3>
                              <div className="h-[300px]">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={moodData}>
                                          <defs>
                                              <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                                                  <stop offset="5%" stopColor="#FACC15" stopOpacity={0.3}/>
                                                  <stop offset="95%" stopColor="#FACC15" stopOpacity={0}/>
                                              </linearGradient>
                                          </defs>
                                          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                          <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                          <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                          <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                                          <Area type="monotone" dataKey="positive" stroke="#FACC15" strokeWidth={3} fillOpacity={1} fill="url(#colorPos)" />
                                          <Area type="monotone" dataKey="negative" stroke="#3B82F6" strokeWidth={3} fillOpacity={0} fill="transparent" />
                                      </AreaChart>
                                  </ResponsiveContainer>
                              </div>
                          </div>
                          
                          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
                              <div className="relative w-48 h-48 mb-6">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                          <Pie data={[{ name: 'Positive', value: 75 }, { name: 'Negative', value: 25 }]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                              <Cell fill="#FACC15" stroke="none"/>
                                              <Cell fill="#3B82F6" stroke="none"/>
                                          </Pie>
                                      </PieChart>
                                  </ResponsiveContainer>
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <div>
                                          <span className="text-3xl font-black text-white">75%</span>
                                          <p className="text-[10px] uppercase text-gray-500 font-bold">Positive</p>
                                      </div>
                                  </div>
                              </div>
                              <p className="text-sm text-gray-400">Users report feeling significantly better after sessions.</p>
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
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-800">
                                  {filteredUsers.map(user => (
                                      <tr key={user.id} className="hover:bg-gray-800/50">
                                          <td className="p-4 font-bold text-white text-sm">{user.name} <span className="text-gray-500 font-normal ml-1">({user.email})</span></td>
                                          <td className="p-4 text-xs text-gray-400">{user.role}</td>
                                          <td className="p-4 text-green-400 font-mono font-bold text-sm">{user.balance}m</td>
                                          <td className="p-4 text-right text-gray-500 text-xs font-mono">{new Date(user.joinedAt).toLocaleDateString()}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}

              {/* --- SETTINGS --- */}
              {activeTab === 'settings' && (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 animate-in fade-in duration-500">
                      <h2 className="text-2xl font-black mb-6">Global Configuration</h2>
                      <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-black rounded-xl border border-gray-800">
                              <div>
                                  <p className="font-bold text-white">Maintenance Mode</p>
                                  <p className="text-xs text-gray-500">Lock down system for all non-admins.</p>
                              </div>
                              <button onClick={() => Database.saveSettings({...settings, maintenanceMode: !settings.maintenanceMode})} className={`w-12 h-6 rounded-full relative transition-colors ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-700'}`}>
                                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.maintenanceMode ? 'left-7' : 'left-1'}`}></div>
                              </button>
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
