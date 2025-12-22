import React, { useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    AreaChart, Area, Line, ComposedChart, Legend, PieChart, Pie, Cell
} from 'recharts';
import { 
    Users, DollarSign, Activity, LogOut, Settings, Video, 
    Search, Edit2, Ban, Zap, ShieldAlert, 
    Terminal, Globe, AlertOctagon, Megaphone, Menu, X, Gift, Download, Tag,
    Clock, Wifi, WifiOff, Server, Cpu, HardDrive, Eye, Heart, Lock, CheckCircle, AlertTriangle, 
    FileText, MessageSquare, Repeat, Shield, Plus, Trash2, Send, Power, Image as ImageIcon, RefreshCw, ToggleLeft, ToggleRight,
    Star, LayoutGrid, List
} from 'lucide-react';
import { Database, STABLE_AVATAR_POOL } from '../services/database';
import { User, UserRole, Companion, Transaction, GlobalSettings, SystemLog, ServerMetric, PromoCode, SessionFeedback } from '../types';

// --- STAT CARD COMPONENT ---
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
      {/* Visual Capacity Bar */}
      {progress !== undefined && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800">
            <div 
                className={`h-full transition-all duration-700 ease-out ${progress >= 90 ? 'bg-red-500' : `bg-${color}-500`}`} 
                style={{ width: `${Math.min(progress, 100)}%` }} 
            />
        </div>
      )}
  </div>
);

// --- LIVE SESSION GRID COMPONENT ---
const LiveSessionGrid: React.FC<{ totalSlots: number, activeCount: number }> = ({ totalSlots, activeCount }) => {
    return (
        <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-15 gap-2 my-4">
            {Array.from({ length: totalSlots }).map((_, i) => {
                const isActive = i < activeCount;
                return (
                    <div 
                        key={i} 
                        className={`h-8 rounded-md flex items-center justify-center border transition-all duration-500 ${
                            isActive 
                            ? 'bg-green-500/20 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                            : 'bg-gray-800/30 border-gray-700/30'
                        }`}
                        title={isActive ? "Session Active" : "Slot Available"}
                    >
                        {isActive && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                    </div>
                )
            })}
        </div>
    );
};

// --- AVATAR COMPONENT ---
const AvatarImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (src && src.length > 10) { setImgSrc(src); setHasError(false); } else { setHasError(true); }
    }, [src]);

    if (hasError || !imgSrc) {
        let hash = 0; for (let i = 0; i < alt.length; i++) hash = alt.charCodeAt(i) + ((hash << 5) - hash);
        const index = Math.abs(hash) % STABLE_AVATAR_POOL.length;
        return <img src={STABLE_AVATAR_POOL[index]} alt={alt} className={className} />;
    }
    return <img src={imgSrc} alt={alt} className={className} onError={() => setHasError(true)} />;
};

const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'specialists' | 'financials' | 'marketing' | 'settings' | 'logs'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>(Database.getSettings());
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [feedback, setFeedback] = useState<SessionFeedback[]>([]);
  const [queue, setQueue] = useState<string[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  
  // Modals & UI
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('ALL');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [fundAmount, setFundAmount] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedCompanion, setSelectedCompanion] = useState<Companion | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  
  // Marketing State
  const [newPromo, setNewPromo] = useState({ code: '', discount: 10 });
  const [broadcastSent, setBroadcastSent] = useState(false);

  const MAX_CONCURRENT_CAPACITY = 15;

  // Real-time Data Sync
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
            const queueList = await Database.getQueueList();
            setQueue(queueList);
            const count = await Database.getActiveSessionCount();
            setActiveCount(count);
        } catch (e) { console.error("Sync Error", e); }
    };
    fetchData();
    const interval = setInterval(fetchData, 3000); 
    return () => clearInterval(interval);
  }, []);

  // --- DERIVED METRICS ---
  const totalRevenue = transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + (t.cost || 0), 0);
  const revenueByDate = transactions.reduce((acc: any, t) => {
      if (t.amount > 0) {
          const date = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          acc[date] = (acc[date] || 0) + (t.cost || 0);
      }
      return acc;
  }, {});
  const revenueChartData = Object.entries(revenueByDate).map(([name, value]) => ({ name, value })).slice(-14); // Last 14 days

  const avgSatisfaction = feedback.length > 0 ? (feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length).toFixed(1) : "5.0";
  const capacityPercentage = (activeCount / MAX_CONCURRENT_CAPACITY) * 100;

  // --- HANDLERS ---
  const handleUpdateCompanion = (c: Companion, status: 'AVAILABLE' | 'BUSY' | 'OFFLINE') => {
      Database.updateCompanion({ ...c, status });
  };

  const handleFundUser = () => {
      if (selectedUser && fundAmount > 0) {
          Database.topUpWallet(fundAmount, 0, selectedUser.id);
          Database.logSystemEvent('WARNING', 'Admin Grant', `Granted ${fundAmount}m to ${selectedUser.email}`);
          setShowUserModal(false);
          setFundAmount(0);
      }
  };

  const handleCreatePromo = (e: React.FormEvent) => {
      e.preventDefault();
      if (newPromo.code && newPromo.discount) {
          Database.createPromoCode(newPromo.code, newPromo.discount);
          setNewPromo({ code: '', discount: 10 });
      }
  };

  const handleDeleteUser = (id: string) => {
      if(confirm("Are you sure you want to permanently delete this user? This cannot be undone.")) {
          Database.deleteUser(id);
          setUsers(Database.getAllUsers());
      }
  };

  const filteredUsers = users.filter(u => {
      const s = searchTerm.toLowerCase();
      const match = u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
      if (userFilter === 'BANNED') return match && u.subscriptionStatus === 'BANNED';
      if (userFilter === 'ADMIN') return match && u.role === UserRole.ADMIN;
      return match;
  });

  return (
    <div className="min-h-screen bg-black text-white font-sans flex overflow-hidden">
      
      {/* SIDEBAR NAVIGATION */}
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
                          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">v2.4.0 Live</span>
                      </div>
                  </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500"><X className="w-6 h-6"/></button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {[
                  { id: 'overview', icon: LayoutGrid, label: 'Mission Control' },
                  { id: 'users', icon: Users, label: 'User Database' },
                  { id: 'specialists', icon: Video, label: 'Specialist Grid' },
                  { id: 'financials', icon: DollarSign, label: 'Revenue & Growth' },
                  { id: 'marketing', icon: Megaphone, label: 'Marketing Ops' },
                  { id: 'settings', icon: Settings, label: 'System Config' },
                  { id: 'logs', icon: Terminal, label: 'Event Logs' },
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

      {/* MAIN VIEWPORT */}
      <main className="flex-1 overflow-y-auto bg-black relative">
          {/* Mobile Header */}
          <div className="md:hidden sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4 flex justify-between items-center z-40">
              <span className="font-black text-lg">ADMIN</span>
              <button onClick={() => setSidebarOpen(true)}><Menu className="w-6 h-6 text-white" /></button>
          </div>

          <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8">
              
              {/* --- OVERVIEW TAB --- */}
              {activeTab === 'overview' && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                      <div>
                          <h2 className="text-3xl font-black tracking-tight mb-1">System Overview</h2>
                          <p className="text-gray-500 text-sm">Real-time telemetry and performance metrics.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <StatCard 
                              title="Total Revenue" 
                              value={`$${totalRevenue.toLocaleString()}`} 
                              icon={DollarSign} 
                              subValue="+12.5%" 
                              subLabel="vs last month"
                              color="green"
                          />
                          <StatCard 
                              title="Active Users" 
                              value={users.length} 
                              icon={Users} 
                              subValue={`+${users.filter(u => new Date(u.joinedAt).toDateString() === new Date().toDateString()).length}`} 
                              subLabel="New today"
                              color="blue"
                          />
                          <StatCard 
                              title="Session Load" 
                              value={`${activeCount}/${MAX_CONCURRENT_CAPACITY}`} 
                              icon={Activity} 
                              subValue={activeCount >= MAX_CONCURRENT_CAPACITY ? "CRITICAL" : "NORMAL"} 
                              subLabel="Concurrency"
                              progress={capacityPercentage}
                              color="yellow"
                          />
                          <StatCard 
                              title="Platform Rating" 
                              value={avgSatisfaction} 
                              icon={Star} 
                              subValue="EXCELLENT" 
                              subLabel="Based on feedback"
                              color="purple"
                          />
                      </div>

                      <div className="grid lg:grid-cols-3 gap-8">
                          {/* Live Monitor */}
                          <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
                              <div className="flex justify-between items-center mb-6">
                                  <h3 className="font-bold text-white flex items-center gap-2"><Server className="w-5 h-5 text-yellow-500" /> Live Session Grid</h3>
                                  <div className="flex gap-2">
                                      <span className="text-[10px] font-bold text-green-500 flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Active</span>
                                      <span className="text-[10px] font-bold text-gray-600 flex items-center gap-1"><div className="w-2 h-2 bg-gray-700 rounded-full border border-gray-600"></div> Idle</span>
                                  </div>
                              </div>
                              <LiveSessionGrid totalSlots={MAX_CONCURRENT_CAPACITY} activeCount={activeCount} />
                              <div className="mt-6 pt-6 border-t border-gray-800">
                                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Waiting Room Queue</h4>
                                  {queue.length === 0 ? (
                                      <div className="text-center py-8 text-gray-600 border border-dashed border-gray-800 rounded-xl text-sm">Queue is currently empty.</div>
                                  ) : (
                                      <div className="space-y-2">
                                          {queue.map((uid, idx) => (
                                              <div key={uid} className="flex justify-between items-center bg-black p-3 rounded-lg border border-gray-800">
                                                  <span className="text-sm font-mono text-gray-300">#{idx+1} {uid.substring(0, 12)}...</span>
                                                  <button onClick={() => Database.leaveQueue(uid)} className="text-red-500 hover:text-red-400 text-xs font-bold uppercase">Force Remove</button>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col">
                              <h3 className="font-bold text-white mb-6 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500"/> Quick Actions</h3>
                              <div className="space-y-3 flex-1">
                                  <button onClick={() => Database.setAllCompanionsStatus('AVAILABLE')} className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-gray-700">
                                      <RefreshCw className="w-4 h-4" /> Reset All Specialists
                                  </button>
                                  <button onClick={() => { if(confirm("Enable Emergency Lockdown?")) Database.saveSettings({...settings, maintenanceMode: true}); }} className="w-full py-4 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                                      <ShieldAlert className="w-4 h-4" /> Enable Lockdown
                                  </button>
                                  <button onClick={() => Database.exportData('USERS')} className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-gray-700">
                                      <Download className="w-4 h-4" /> Backup User Data
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* --- USERS TAB --- */}
              {activeTab === 'users' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                          <h2 className="text-3xl font-black">User Database</h2>
                          <div className="flex gap-4">
                              <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                  <input 
                                      className="bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-yellow-500 outline-none w-64" 
                                      placeholder="Search users..." 
                                      value={searchTerm}
                                      onChange={e => setSearchTerm(e.target.value)}
                                  />
                              </div>
                              <select className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-sm outline-none" value={userFilter} onChange={e => setUserFilter(e.target.value)}>
                                  <option value="ALL">All Users</option>
                                  <option value="ADMIN">Admins</option>
                                  <option value="BANNED">Banned</option>
                              </select>
                          </div>
                      </div>

                      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                          <table className="w-full text-left">
                              <thead className="bg-black text-gray-500 text-xs uppercase font-bold">
                                  <tr>
                                      <th className="p-4">User Identity</th>
                                      <th className="p-4">Role</th>
                                      <th className="p-4">Credits</th>
                                      <th className="p-4">Status</th>
                                      <th className="p-4 text-right">Controls</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-800">
                                  {filteredUsers.map(user => (
                                      <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                                          <td className="p-4">
                                              <div className="flex items-center gap-3">
                                                  <div className="w-10 h-10 rounded-full bg-black overflow-hidden border border-gray-700">
                                                      <AvatarImage src={user.avatar || ''} alt={user.name} className="w-full h-full object-cover" />
                                                  </div>
                                                  <div>
                                                      <p className="font-bold text-white text-sm">{user.name}</p>
                                                      <p className="text-gray-500 text-xs">{user.email}</p>
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="p-4">
                                              <span className={`text-[10px] font-bold px-2 py-1 rounded border ${user.role === UserRole.ADMIN ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                                                  {user.role}
                                              </span>
                                          </td>
                                          <td className="p-4 font-mono text-sm text-green-400 font-bold">{user.balance}m</td>
                                          <td className="p-4">
                                              {user.subscriptionStatus === 'BANNED' 
                                                  ? <span className="text-red-500 text-xs font-bold flex items-center gap-1"><Ban className="w-3 h-3"/> BANNED</span> 
                                                  : <span className="text-green-500 text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> ACTIVE</span>
                                              }
                                          </td>
                                          <td className="p-4 text-right">
                                              <div className="flex justify-end gap-2">
                                                  <button onClick={() => { setSelectedUser(user); setShowUserModal(true); }} className="p-2 bg-gray-800 hover:bg-green-900/30 text-green-500 rounded-lg transition-colors" title="Grant Credits"><Plus className="w-4 h-4"/></button>
                                                  <button onClick={() => { if(confirm("Ban/Unban User?")) { const s = user.subscriptionStatus === 'BANNED' ? 'ACTIVE' : 'BANNED'; Database.updateUser({...user, subscriptionStatus: s as any}); }}} className="p-2 bg-gray-800 hover:bg-yellow-900/30 text-yellow-500 rounded-lg transition-colors"><ShieldAlert className="w-4 h-4"/></button>
                                                  {user.role !== UserRole.ADMIN && (
                                                      <button onClick={() => handleDeleteUser(user.id)} className="p-2 bg-gray-800 hover:bg-red-900/30 text-red-500 rounded-lg transition-colors" title="Delete User"><Trash2 className="w-4 h-4"/></button>
                                                  )}
                                              </div>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                          {filteredUsers.length === 0 && <div className="p-12 text-center text-gray-500 text-sm">No users found.</div>}
                      </div>
                  </div>
              )}

              {/* --- SPECIALISTS TAB --- */}
              {activeTab === 'specialists' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                      <h2 className="text-3xl font-black">Specialist Grid</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {companions.map(comp => (
                              <div key={comp.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition-all group relative overflow-hidden">
                                  <button onClick={() => { setSelectedCompanion(comp); setNewImageUrl(comp.imageUrl); setShowImageModal(true); }} className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-white text-white hover:text-black rounded-lg transition-colors z-10 backdrop-blur-md opacity-0 group-hover:opacity-100">
                                      <ImageIcon className="w-4 h-4" />
                                  </button>
                                  <div className="flex items-center gap-4 mb-4">
                                      <div className="w-16 h-16 rounded-xl bg-black border border-gray-800 overflow-hidden shrink-0">
                                          <AvatarImage src={comp.imageUrl} alt={comp.name} className="w-full h-full object-cover" />
                                      </div>
                                      <div className="min-w-0">
                                          <h3 className="font-bold text-white truncate">{comp.name}</h3>
                                          <p className="text-xs text-gray-500 truncate">{comp.specialty}</p>
                                          <div className="flex items-center gap-1 mt-1">
                                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500"/>
                                              <span className="text-xs font-bold text-gray-400">{comp.rating}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                      <button onClick={() => handleUpdateCompanion(comp, 'AVAILABLE')} className={`py-2 rounded-lg text-[10px] font-bold transition-all ${comp.status === 'AVAILABLE' ? 'bg-green-600 text-white' : 'bg-black text-gray-500 hover:bg-gray-800'}`}>ONLINE</button>
                                      <button onClick={() => handleUpdateCompanion(comp, 'BUSY')} className={`py-2 rounded-lg text-[10px] font-bold transition-all ${comp.status === 'BUSY' ? 'bg-yellow-600 text-white' : 'bg-black text-gray-500 hover:bg-gray-800'}`}>BUSY</button>
                                      <button onClick={() => handleUpdateCompanion(comp, 'OFFLINE')} className={`py-2 rounded-lg text-[10px] font-bold transition-all ${comp.status === 'OFFLINE' ? 'bg-red-600 text-white' : 'bg-black text-gray-500 hover:bg-gray-800'}`}>OFF</button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* --- FINANCIALS TAB --- */}
              {activeTab === 'financials' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                      <h2 className="text-3xl font-black">Financial Metrics</h2>
                      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                          <h3 className="font-bold text-white mb-6">Revenue Trend (14 Days)</h3>
                          <div className="h-[400px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={revenueChartData}>
                                      <defs>
                                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="5%" stopColor="#FACC15" stopOpacity={0.3}/>
                                              <stop offset="95%" stopColor="#FACC15" stopOpacity={0}/>
                                          </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                      <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                      <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                      <Tooltip 
                                          contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }} 
                                          itemStyle={{ color: '#fff' }}
                                      />
                                      <Area type="monotone" dataKey="value" stroke="#FACC15" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                  </AreaChart>
                              </ResponsiveContainer>
                          </div>
                      </div>
                  </div>
              )}

              {/* --- SETTINGS TAB --- */}
              {activeTab === 'settings' && (
                  <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
                      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
                          <h3 className="font-bold text-white text-xl mb-6 flex items-center gap-2"><Settings className="w-5 h-5 text-yellow-500" /> Configuration</h3>
                          <div className="space-y-4">
                              <div className="flex items-center justify-between p-4 bg-black rounded-xl border border-gray-800">
                                  <div>
                                      <p className="font-bold text-white">Sale Mode Pricing</p>
                                      <p className="text-xs text-gray-500">{settings.saleMode ? 'Active: $1.49/min' : 'Inactive: $1.99/min'} - Dynamic Pricing Engine</p>
                                  </div>
                                  <button onClick={() => Database.saveSettings({...settings, saleMode: !settings.saleMode})} className={`w-12 h-6 rounded-full relative transition-colors ${settings.saleMode ? 'bg-green-500' : 'bg-gray-700'}`}>
                                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.saleMode ? 'left-7' : 'left-1'}`}></div>
                                  </button>
                              </div>
                              <div className="flex items-center justify-between p-4 bg-black rounded-xl border border-gray-800">
                                  <div>
                                      <p className="font-bold text-white">Maintenance Lockdown</p>
                                      <p className="text-xs text-gray-500">Deny all non-admin access immediately.</p>
                                  </div>
                                  <button onClick={() => Database.saveSettings({...settings, maintenanceMode: !settings.maintenanceMode})} className={`w-12 h-6 rounded-full relative transition-colors ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-700'}`}>
                                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.maintenanceMode ? 'left-7' : 'left-1'}`}></div>
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* --- LOGS TAB --- */}
              {activeTab === 'logs' && (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden animate-in fade-in duration-500">
                      <div className="p-6 border-b border-gray-800 font-bold text-white flex items-center gap-2"><Terminal className="w-5 h-5" /> System Events</div>
                      <div className="h-[600px] overflow-y-auto p-4 bg-black">
                          <div className="space-y-2 font-mono text-xs">
                              {logs.map(log => (
                                  <div key={log.id} className="flex gap-4 p-2 hover:bg-gray-900 rounded border-b border-gray-900">
                                      <span className="text-gray-500 w-32 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                      <span className={`w-20 font-bold shrink-0 ${
                                          log.type === 'ERROR' ? 'text-red-500' : 
                                          log.type === 'WARNING' ? 'text-yellow-500' : 
                                          log.type === 'SUCCESS' ? 'text-green-500' : 
                                          'text-blue-500'
                                      }`}>{log.type}</span>
                                      <span className="text-gray-300 font-bold w-40 shrink-0">{log.event}</span>
                                      <span className="text-gray-500">{log.details}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}

          </div>
      </main>

      {/* MODALS */}
      {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in zoom-in duration-200">
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
                   <h3 className="text-xl font-bold text-white mb-2">Admin Grant</h3>
                   <p className="text-gray-400 text-sm mb-6">Adding credits to <span className="text-yellow-500">{selectedUser.email}</span></p>
                   <input type="number" className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white text-xl font-mono mb-6 focus:border-green-500 outline-none" value={fundAmount} onChange={e => setFundAmount(parseInt(e.target.value) || 0)} placeholder="0" />
                   <div className="flex gap-3">
                       <button onClick={() => setShowUserModal(false)} className="flex-1 py-3 bg-gray-800 rounded-xl font-bold text-gray-400 hover:bg-gray-700">Cancel</button>
                       <button onClick={handleFundUser} className="flex-1 py-3 bg-green-600 rounded-xl font-bold text-white hover:bg-green-500">Confirm</button>
                   </div>
              </div>
          </div>
      )}

      {showImageModal && selectedCompanion && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in zoom-in duration-200">
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
                   <h3 className="text-xl font-bold text-white mb-4">Update Visuals</h3>
                   <div className="w-full aspect-square bg-black rounded-xl border border-gray-800 mb-4 overflow-hidden">
                       <AvatarImage src={newImageUrl} alt="Preview" className="w-full h-full object-cover" />
                   </div>
                   <input className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white text-xs mb-6 outline-none focus:border-yellow-500" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} />
                   <div className="flex gap-3">
                       <button onClick={() => setShowImageModal(false)} className="flex-1 py-3 bg-gray-800 rounded-xl font-bold text-gray-400 hover:bg-gray-700">Cancel</button>
                       <button onClick={() => { Database.updateCompanion({...selectedCompanion, imageUrl: newImageUrl}); setShowImageModal(false); }} className="flex-1 py-3 bg-yellow-500 rounded-xl font-bold text-black hover:bg-yellow-400">Save</button>
                   </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default AdminDashboard;