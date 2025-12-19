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
    Star
} from 'lucide-react';
import { Database, STABLE_AVATAR_POOL } from '../services/database';
import { User, UserRole, Companion, Transaction, GlobalSettings, SystemLog, ServerMetric, PromoCode, SessionFeedback } from '../types';

// --- STAT CARD COMPONENT ---
const StatCard = ({ title, value, icon: Icon, subValue, subLabel, progress }: any) => (
  <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-6 rounded-2xl shadow-lg hover:border-yellow-500/30 transition-all group relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
          <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
              <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
          </div>
          <div className="p-3 rounded-xl bg-black border border-gray-800 group-hover:text-yellow-500 transition-colors">
              <Icon className="w-5 h-5 text-gray-400 group-hover:text-yellow-500" />
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
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gray-800/50">
            <div 
                className={`h-full transition-all duration-700 ease-out ${progress >= 100 ? 'bg-red-500' : 'bg-green-500'}`} 
                style={{ width: `${Math.min(progress, 100)}%` }} 
            />
        </div>
      )}
  </div>
);

// --- ADMIN AVATAR ---
const AvatarImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (src && src.length > 10) { 
            setImgSrc(src);
            setHasError(false);
        } else {
            setHasError(true);
        }
    }, [src]);

    if (hasError || !imgSrc) {
        let hash = 0;
        for (let i = 0; i < alt.length; i++) hash = alt.charCodeAt(i) + ((hash << 5) - hash);
        const index = Math.abs(hash) % STABLE_AVATAR_POOL.length;
        return <img src={STABLE_AVATAR_POOL[index]} alt={alt} className={className} />;
    }

    return <img src={imgSrc} alt={alt} className={className} onError={() => setHasError(true)} />;
};

const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'specialists' | 'financials' | 'marketing' | 'settings' | 'security' | 'quality'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Real Data States
  const [users, setUsers] = useState<User[]>([]);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>(Database.getSettings());
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [feedback, setFeedback] = useState<SessionFeedback[]>([]);
  const [queue, setQueue] = useState<string[]>([]);
  
  // Concurrency States
  const [activeCount, setActiveCount] = useState(0);
  
  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('ALL');
  const [newPromo, setNewPromo] = useState({ code: '', discount: 10 });
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);
  
  // User Edit Modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [fundAmount, setFundAmount] = useState(0);

  // Image Edit Modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedCompanion, setSelectedCompanion] = useState<Companion | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');

  // --- QUEUE SYSTEM CONFIGURATION ---
  const MAX_CONCURRENT_CAPACITY = 15;

  // Refresh Loop
  useEffect(() => {
    const refresh = async () => {
        setUsers(Database.getAllUsers());
        setCompanions(Database.getCompanions());
        setTransactions(Database.getAllTransactions());
        setSettings(Database.getSettings());
        setLogs(Database.getSystemLogs());
        setPromos(Database.getPromoCodes());
        setFeedback(Database.getAllFeedback());
        setQueue(Database.getQueueList());
        setActiveCount(Database.getActiveSessionCount());
    };
    refresh();
    const interval = setInterval(refresh, 2000); // 2s refresh for live monitoring
    return () => clearInterval(interval);
  }, []);

  const totalRevenue = transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + (t.cost || 0), 0);
  
  // Dynamic Revenue Growth Calculation
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const revenueLast30 = transactions
    .filter(t => t.amount > 0 && new Date(t.date) >= thirtyDaysAgo)
    .reduce((acc, t) => acc + (t.cost || 0), 0);
    
  const revenuePrev30 = transactions
    .filter(t => t.amount > 0 && new Date(t.date) >= sixtyDaysAgo && new Date(t.date) < thirtyDaysAgo)
    .reduce((acc, t) => acc + (t.cost || 0), 0);

  let growth = 0;
  if (revenuePrev30 === 0) {
      growth = revenueLast30 > 0 ? 100 : 0;
  } else {
      growth = ((revenueLast30 - revenuePrev30) / revenuePrev30) * 100;
  }
  const growthStr = `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;

  const avgSatisfaction = feedback.length > 0 
      ? (feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length).toFixed(1) 
      : "5.0";
  
  // LIVE Queue Calculations
  const capacityPercentage = (activeCount / MAX_CONCURRENT_CAPACITY) * 100;
  const isQueueActive = activeCount >= MAX_CONCURRENT_CAPACITY;
  
  const revenueByDate = transactions
    .filter(t => t.amount > 0)
    .reduce((acc: any, t) => {
        const date = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        acc[date] = (acc[date] || 0) + (t.cost || 0);
        return acc;
    }, {});
  const revenueChartData = Object.entries(revenueByDate).map(([name, value]) => ({ name, value })).slice(-7); 

  // --- ACTIONS ---

  const toggleUserBan = (user: User) => {
      if (confirm(`Are you sure you want to ${user.subscriptionStatus === 'BANNED' ? 'unban' : 'ban'} ${user.name}?`)) {
          const updated = { ...user, subscriptionStatus: user.subscriptionStatus === 'BANNED' ? 'ACTIVE' : 'BANNED' as any };
          Database.updateUser(updated);
      }
  };

  const handleDeleteUser = (user: User) => {
      if (confirm(`PERMANENT DELETE WARNING:\n\nAre you sure you want to delete ${user.name} (${user.email})?\n\nThis will remove all their data and history forever. This cannot be undone.`)) {
          Database.deleteUser(user.id);
          // Force refresh immediately
          setUsers(Database.getAllUsers());
      }
  };

  const handleAddFunds = () => {
      if (selectedUser && fundAmount > 0) {
          Database.topUpWallet(fundAmount, 0, selectedUser.id); 
          Database.logSystemEvent('WARNING', 'Admin Grant', `Granted ${fundAmount} mins to ${selectedUser.email}`);
          setShowUserModal(false);
          setFundAmount(0);
          setSelectedUser(null);
      }
  };

  const openFundModal = (user: User) => {
      setSelectedUser(user);
      setFundAmount(0);
      setShowUserModal(true);
  };

  const updateCompanionStatus = (id: string, status: 'AVAILABLE' | 'BUSY' | 'OFFLINE') => {
      const comp = companions.find(c => c.id === id);
      if (comp) {
          const updated = { ...comp, status };
          Database.updateCompanion(updated);
      }
  };

  const openImageModal = (companion: Companion) => {
      setSelectedCompanion(companion);
      setNewImageUrl(companion.imageUrl);
      setShowImageModal(true);
  };

  const handleUpdateImage = () => {
      if (selectedCompanion && newImageUrl) {
          const updated = { ...selectedCompanion, imageUrl: newImageUrl };
          Database.updateCompanion(updated);
          Database.logSystemEvent('INFO', 'Companion Update', `Updated image for ${selectedCompanion.name}`);
          setShowImageModal(false);
          setSelectedCompanion(null);
      }
  };

  const handleCreatePromo = (e: React.FormEvent) => {
      e.preventDefault();
      if (newPromo.code && newPromo.discount > 0) {
          Database.createPromoCode(newPromo.code, newPromo.discount);
          setNewPromo({ code: '', discount: 10 });
      }
  };

  const handleDeletePromo = (id: string) => {
      Database.deletePromoCode(id);
  };

  const toggleSetting = (key: keyof GlobalSettings) => {
      Database.saveSettings({ ...settings, [key]: !settings[key] });
  };
  
  const toggleSaleMode = () => {
      const newMode = !settings.saleMode;
      Database.saveSettings({ ...settings, saleMode: newMode, pricePerMinute: newMode ? 1.49 : 1.99 });
  };

  const handleBroadcast = () => {
      const msg = prompt("Enter broadcast message (leave empty to clear):", settings.broadcastMessage || "");
      if (msg !== null) {
          Database.saveSettings({ ...settings, broadcastMessage: msg });
          Database.logSystemEvent('INFO', 'Broadcast Update', `Message: ${msg || 'Cleared'}`);
      }
  };

  const handleSendEmailBlast = (e: React.FormEvent) => {
      e.preventDefault();
      if (!broadcastSubject || !broadcastBody) return;
      
      const recipientCount = users.length;
      Database.logSystemEvent('INFO', 'Email Marketing', `Email blast sent to ${recipientCount} users. Subject: ${broadcastSubject}`);
      
      setBroadcastSent(true);
      setBroadcastSubject('');
      setBroadcastBody('');
      
      setTimeout(() => {
          setBroadcastSent(false);
          alert(`Simulated email blast sent to ${recipientCount} users.`);
      }, 1000);
  };

  const handleMassReset = () => {
      if(confirm("Are you sure you want to reset all specialists to AVAILABLE?")) {
          Database.setAllCompanionsStatus('AVAILABLE');
          setCompanions(Database.getCompanions());
      }
  };

  const handleRemoveFromQueue = (userId: string) => {
      if(confirm("Remove this user from the waiting room?")) {
          Database.leaveQueue(userId);
          setQueue(Database.getQueueList());
      }
  };

  const filteredUsers = users.filter(u => {
      const s = searchTerm.toLowerCase();
      const matches = u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
      if (userFilter === 'BANNED') return matches && u.subscriptionStatus === 'BANNED';
      if (userFilter === 'ADMIN') return matches && u.role === UserRole.ADMIN;
      return matches;
  });

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans flex">
      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-black border-b border-gray-800 flex items-center justify-between px-4 z-50">
          <span className="font-bold text-white flex items-center gap-2"><Shield className="w-4 h-4 text-yellow-500"/> Admin</span>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}><Menu className="w-6 h-6" /></button>
      </div>

      {/* SIDEBAR */}
      <div className={`
          fixed md:static inset-y-0 left-0 w-64 bg-[#0A0A0A] border-r border-gray-800 z-40 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col
      `}>
          <div className="p-6 border-b border-gray-800">
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center"><Activity className="w-5 h-5 text-black"/></div>
                  PEUTIC<span className="text-gray-600">OS</span>
              </h1>
          </div>
          <div className="flex-1 py-6 space-y-1 px-3">
              {[
                  { id: 'overview', icon: Activity, label: 'Mission Control' },
                  { id: 'quality', icon: Star, label: 'Quality Control' },
                  { id: 'users', icon: Users, label: 'User Database' },
                  { id: 'specialists', icon: Video, label: 'Specialist Ops' },
                  { id: 'financials', icon: DollarSign, label: 'Financials' },
                  { id: 'marketing', icon: Megaphone, label: 'Marketing CMS' },
                  { id: 'settings', icon: Settings, label: 'Settings' },
                  { id: 'security', icon: ShieldAlert, label: 'Security Logs' }
              ].map((item) => (
                  <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id as any); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:bg-gray-900 hover:text-white'}`}
                  >
                      <item.icon className="w-4 h-4" /> {item.label}
                  </button>
              ))}
          </div>
          <div className="p-4 border-t border-gray-800">
              <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-red-500 hover:bg-red-900/20 font-bold text-xs uppercase tracking-wider transition-colors">
                  <LogOut className="w-4 h-4" /> Terminate Session
              </button>
          </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto h-screen p-4 md:p-8 pt-20 md:pt-8">
          
          <div className="flex justify-between items-end mb-8">
              <div>
                  <h2 className="text-3xl font-black text-white tracking-tight capitalize">{activeTab.replace('-', ' ')}</h2>
                  <p className="text-gray-500 text-sm mt-1">System Status: <span className="text-green-500 font-bold">Operational</span></p>
              </div>
              {activeTab === 'users' && (
                  <button onClick={() => Database.exportData('USERS')} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-bold transition-colors">
                      <Download className="w-3 h-3" /> Export CSV
                  </button>
              )}
          </div>

          {activeTab === 'overview' && (
              <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <StatCard title="Lifetime Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} subValue={growthStr} subLabel="vs last 30d" />
                      
                      {/* LIVE QUEUE MONITOR */}
                      <StatCard 
                          title="Live Session Monitor" 
                          value={`${activeCount} / ${MAX_CONCURRENT_CAPACITY}`} 
                          icon={Video} 
                          subValue={isQueueActive ? "CAPACITY FULL" : "OPEN"} 
                          subLabel="Active Seats"
                          progress={capacityPercentage}
                      />
                      
                      <StatCard title="Total Users" value={users.length} icon={Users} subValue={`+${users.filter(u => new Date(u.joinedAt).getDate() === new Date().getDate()).length}`} subLabel="today" />
                      <StatCard title="Avg Satisfaction" value={avgSatisfaction} icon={Star} subValue={avgSatisfaction >= "4.5" ? "EXCELLENT" : "GOOD"} subLabel="Rating" />
                  </div>

                  {/* QUEUE MANAGEMENT */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                      <h3 className="font-bold text-white text-xl mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-yellow-500" /> Live Waiting Room</h3>
                      {queue.length === 0 ? (
                          <div className="p-8 text-center text-gray-500 text-sm bg-black rounded-xl border border-gray-800 border-dashed">
                              Waiting Room Empty.
                          </div>
                      ) : (
                          <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                  <thead className="bg-black/50 text-gray-500 text-xs uppercase font-bold">
                                      <tr>
                                          <th className="p-3">Pos</th>
                                          <th className="p-3">User ID</th>
                                          <th className="p-3">Est. Wait</th>
                                          <th className="p-3 text-right">Actions</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-800 text-sm">
                                      {queue.map((uid, index) => (
                                          <tr key={uid}>
                                              <td className="p-3 font-mono font-bold text-yellow-500">#{index + 1}</td>
                                              <td className="p-3 text-gray-300 font-mono text-xs">{uid}</td>
                                              <td className="p-3 text-gray-400">~{index * 3} mins</td>
                                              <td className="p-3 text-right">
                                                  <button onClick={() => handleRemoveFromQueue(uid)} className="text-red-500 hover:text-white text-xs font-bold bg-red-900/20 px-2 py-1 rounded">Remove</button>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {activeTab === 'quality' && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                      <h3 className="font-bold text-white text-xl">Recent Session Feedback</h3>
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Last 50 Sessions</div>
                  </div>
                  {feedback.length === 0 ? (
                      <div className="p-12 text-center text-gray-500">No session feedback recorded yet.</div>
                  ) : (
                      <div className="divide-y divide-gray-800">
                          {feedback.map(item => (
                              <div key={item.id} className="p-6 hover:bg-black/20 transition-colors">
                                  <div className="flex justify-between items-start mb-2">
                                      <div>
                                          <div className="flex items-center gap-2">
                                              <span className="font-bold text-white">{item.userName}</span>
                                              <span className="text-gray-500 text-xs">with</span>
                                              <span className="font-bold text-yellow-500">{item.companionName}</span>
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">{new Date(item.date).toLocaleString()} • {item.duration} mins</div>
                                      </div>
                                      <div className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full">
                                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                          <span className="font-bold text-white">{item.rating}</span>
                                      </div>
                                  </div>
                                  <div className="flex gap-2 flex-wrap">
                                      {item.tags.map(tag => (
                                          <span key={tag} className="text-[10px] font-bold px-2 py-1 bg-gray-800 text-gray-300 rounded-md border border-gray-700">{tag}</span>
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'users' && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-gray-800 flex gap-4">
                      <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input type="text" placeholder="Search users by name or email..." className="w-full bg-black border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-300 focus:border-yellow-500 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                      </div>
                      <select className="bg-black border border-gray-800 rounded-xl px-4 py-2 text-sm text-gray-300 outline-none" value={userFilter} onChange={e => setUserFilter(e.target.value)}>
                          <option value="ALL">All Users</option>
                          <option value="ADMIN">Admins</option>
                          <option value="BANNED">Banned</option>
                      </select>
                  </div>
                  <table className="w-full text-left border-collapse">
                      <thead className="bg-black/50 text-gray-500 text-xs uppercase font-bold">
                          <tr>
                              <th className="p-4">User</th>
                              <th className="p-4">Role</th>
                              <th className="p-4">Balance</th>
                              <th className="p-4">Status</th>
                              <th className="p-4 text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                          {filteredUsers.map(user => (
                              <tr key={user.id} className="hover:bg-gray-800/50 transition-colors group">
                                  <td className="p-4 flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden">
                                          <AvatarImage src={user.avatar || ''} alt={user.name} className="w-full h-full object-cover" />
                                      </div>
                                      <div>
                                          <div className="font-bold text-gray-200 text-sm">{user.name}</div>
                                          <div className="text-xs text-gray-500">{user.email}</div>
                                      </div>
                                  </td>
                                  <td className="p-4"><span className={`text-xs font-bold px-2 py-1 rounded-md ${user.role === UserRole.ADMIN ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-800 text-gray-400'}`}>{user.role}</span></td>
                                  <td className="p-4 font-mono text-sm">{user.balance}m</td>
                                  <td className="p-4">
                                      {user.subscriptionStatus === 'BANNED' ? (
                                          <span className="flex items-center gap-1 text-red-500 text-xs font-bold"><Ban className="w-3 h-3" /> BANNED</span>
                                      ) : (
                                          <span className="flex items-center gap-1 text-green-500 text-xs font-bold"><CheckCircle className="w-3 h-3" /> ACTIVE</span>
                                      )}
                                  </td>
                                  <td className="p-4 text-right flex justify-end gap-2">
                                      <button onClick={() => openFundModal(user)} className="p-2 hover:bg-green-900/30 rounded-lg text-green-600 transition-colors" title="Add Funds"><Plus className="w-4 h-4" /></button>
                                      <button onClick={() => toggleUserBan(user)} className={`p-2 rounded-lg transition-colors ${user.subscriptionStatus === 'BANNED' ? 'hover:bg-green-900/30 text-green-600' : 'hover:bg-yellow-900/30 text-yellow-500'}`} title={user.subscriptionStatus === 'BANNED' ? 'Unban' : 'Ban User'}>
                                          {user.subscriptionStatus === 'BANNED' ? <Shield className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                      </button>
                                      <button onClick={() => handleDeleteUser(user)} className="p-2 hover:bg-red-900/30 rounded-lg text-red-600 transition-colors" title="Permanently Delete">
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  {filteredUsers.length === 0 && <div className="p-8 text-center text-gray-500 text-sm">No users found matching criteria.</div>}
              </div>
          )}

          {activeTab === 'specialists' && (
              <div className="space-y-6">
                  <div className="flex gap-4">
                       <button onClick={handleMassReset} className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/10 flex items-center gap-2">
                           <RefreshCw className="w-4 h-4" /> Reset All to Available
                       </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {companions.map(comp => (
                          <div key={comp.id} className="bg-gray-900 border border-gray-800 p-4 rounded-2xl relative group hover:border-gray-700 transition-all">
                               <button onClick={() => openImageModal(comp)} className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-yellow-500 hover:text-black rounded-lg text-white transition-all z-10"><ImageIcon className="w-4 h-4" /></button>
                               <div className="flex items-center gap-4 mb-4">
                                   <div className="w-16 h-16 rounded-xl bg-black overflow-hidden border border-gray-800">
                                       <AvatarImage src={comp.imageUrl} alt={comp.name} className="w-full h-full object-cover" />
                                   </div>
                                   <div>
                                       <h3 className="font-bold text-white">{comp.name}</h3>
                                       <p className="text-xs text-gray-500">{comp.specialty}</p>
                                   </div>
                               </div>
                               <div className="grid grid-cols-3 gap-2">
                                   <button onClick={() => updateCompanionStatus(comp.id, 'AVAILABLE')} className={`py-2 rounded-lg text-[10px] font-bold transition-all ${comp.status === 'AVAILABLE' ? 'bg-green-500 text-black' : 'bg-black text-gray-500 hover:bg-gray-800'}`}>ONLINE</button>
                                   <button onClick={() => updateCompanionStatus(comp.id, 'BUSY')} className={`py-2 rounded-lg text-[10px] font-bold transition-all ${comp.status === 'BUSY' ? 'bg-yellow-500 text-black' : 'bg-black text-gray-500 hover:bg-gray-800'}`}>BUSY</button>
                                   <button onClick={() => updateCompanionStatus(comp.id, 'OFFLINE')} className={`py-2 rounded-lg text-[10px] font-bold transition-all ${comp.status === 'OFFLINE' ? 'bg-red-500 text-white' : 'bg-black text-gray-500 hover:bg-gray-800'}`}>OFF</button>
                               </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'financials' && (
              <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                          <h3 className="text-lg font-bold text-white mb-6">Revenue Trend (7 Days)</h3>
                          <div className="h-64 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={revenueChartData}>
                                      <defs>
                                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="5%" stopColor="#FACC15" stopOpacity={0.3}/>
                                              <stop offset="95%" stopColor="#FACC15" stopOpacity={0}/>
                                          </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                      <XAxis dataKey="name" stroke="#666" fontSize={10} />
                                      <YAxis stroke="#666" fontSize={10} />
                                      <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                                      <Area type="monotone" dataKey="value" stroke="#FACC15" fillOpacity={1} fill="url(#colorRev)" />
                                  </AreaChart>
                              </ResponsiveContainer>
                          </div>
                      </div>
                      <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                           <h3 className="text-lg font-bold text-white mb-6">Recent Transactions</h3>
                           <div className="space-y-3 overflow-y-auto max-h-64 pr-2">
                               {transactions.slice().reverse().slice(0, 8).map(tx => (
                                   <div key={tx.id} className="flex justify-between items-center p-3 bg-black rounded-xl border border-gray-800">
                                       <div>
                                           <div className="text-sm font-bold text-gray-200">{tx.description}</div>
                                           <div className="text-xs text-gray-600">{new Date(tx.date).toLocaleDateString()} • {tx.userName}</div>
                                       </div>
                                       <div className={`text-sm font-bold font-mono ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                           {tx.amount > 0 ? '+' : ''}{tx.amount}m
                                       </div>
                                   </div>
                               ))}
                           </div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'marketing' && (
              <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
                      <h3 className="font-bold text-white text-xl mb-6 flex items-center gap-2"><Tag className="w-5 h-5 text-green-500" /> Active Promo Codes</h3>
                      <div className="space-y-4 mb-8">
                          {promos.length === 0 && <div className="text-gray-500 text-sm">No active codes.</div>}
                          {promos.map(p => (
                              <div key={p.id} className="flex justify-between items-center bg-black p-4 rounded-xl border border-gray-800">
                                  <div>
                                      <div className="font-black text-white text-lg tracking-widest">{p.code}</div>
                                      <div className="text-green-500 text-xs font-bold">{p.discountPercentage}% OFF</div>
                                  </div>
                                  <button onClick={() => handleDeletePromo(p.id)} className="p-2 hover:bg-red-900/30 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                              </div>
                          ))}
                      </div>
                      <form onSubmit={handleCreatePromo} className="flex gap-4 border-t border-gray-800 pt-6">
                          <input required placeholder="CODE2025" className="flex-1 bg-black border border-gray-800 rounded-xl px-4 text-white text-sm outline-none focus:border-green-500 uppercase" value={newPromo.code} onChange={e => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})} />
                          <input required type="number" min="1" max="100" className="w-20 bg-black border border-gray-800 rounded-xl px-4 text-white text-sm outline-none focus:border-green-500" value={newPromo.discount} onChange={e => setNewPromo({...newPromo, discount: parseInt(e.target.value)})} />
                          <button className="bg-green-500 text-black px-4 py-2 rounded-xl font-bold text-sm hover:bg-green-400">Add</button>
                      </form>
                  </div>

                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
                      <h3 className="font-bold text-white text-xl mb-6 flex items-center gap-2"><Megaphone className="w-5 h-5 text-blue-500" /> Email Blast</h3>
                      <form onSubmit={handleSendEmailBlast} className="space-y-4">
                           <input required placeholder="Subject Line" className="w-full bg-black border border-gray-800 rounded-xl p-4 text-white outline-none focus:border-blue-500" value={broadcastSubject} onChange={e => setBroadcastSubject(e.target.value)} />
                           <textarea required placeholder="Write your message here..." className="w-full h-32 bg-black border border-gray-800 rounded-xl p-4 text-white outline-none focus:border-blue-500 resize-none" value={broadcastBody} onChange={e => setBroadcastBody(e.target.value)}></textarea>
                           <button disabled={broadcastSent} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
                               {broadcastSent ? <CheckCircle className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                               {broadcastSent ? "Emails Queued" : "Send to All Users"}
                           </button>
                      </form>
                  </div>
              </div>
          )}

          {activeTab === 'settings' && (
              <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
                      <h3 className="font-bold text-white text-xl mb-6 flex items-center gap-2"><Settings className="w-5 h-5 text-yellow-500" /> Global Configuration</h3>
                      <div className="space-y-4">
                          
                          {/* SALE MODE TOGGLE */}
                          <div className="flex items-center justify-between p-4 bg-black rounded-xl border border-gray-800">
                              <div className="flex items-center gap-3">
                                  <Tag className={`w-5 h-5 ${settings.saleMode ? 'text-green-500' : 'text-gray-500'}`} />
                                  <div>
                                      <p className="font-bold text-white">Sale Pricing Mode</p>
                                      <p className="text-xs text-gray-500">
                                          {settings.saleMode ? 'Active: $1.49/min' : 'Inactive: $1.99/min'}
                                      </p>
                                  </div>
                              </div>
                              <button onClick={toggleSaleMode} className={`w-12 h-6 rounded-full relative transition-colors ${settings.saleMode ? 'bg-green-500' : 'bg-gray-700'}`}>
                                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.saleMode ? 'left-7' : 'left-1'}`}></div>
                              </button>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-black rounded-xl border border-gray-800">
                              <div className="flex items-center gap-3">
                                  <Power className={`w-5 h-5 ${settings.maintenanceMode ? 'text-red-500' : 'text-gray-500'}`} />
                                  <div><p className="font-bold text-white">Maintenance Mode</p><p className="text-xs text-gray-500">Emergency lockdown</p></div>
                              </div>
                              <button onClick={() => toggleSetting('maintenanceMode')} className={`w-12 h-6 rounded-full relative transition-colors ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.maintenanceMode ? 'left-7' : 'left-1'}`}></div></button>
                          </div>
                          
                          <div>
                              <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Broadcast Message</label>
                              <div className="flex gap-2">
                                  <input disabled value={settings.broadcastMessage || ''} className="flex-1 p-3 rounded-xl border border-gray-800 bg-black text-gray-300 text-sm" />
                                  <button onClick={handleBroadcast} className="px-4 bg-yellow-500 text-black rounded-xl font-bold text-sm">Edit</button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}
          
          {activeTab === 'security' && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-gray-800 font-bold text-white">System Logs</div>
                  <div className="max-h-[600px] overflow-y-auto">
                      <table className="w-full text-left">
                          <thead className="bg-black text-gray-500 text-xs uppercase font-bold sticky top-0">
                              <tr>
                                  <th className="p-4">Time</th>
                                  <th className="p-4">Type</th>
                                  <th className="p-4">Event</th>
                                  <th className="p-4">Details</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800 font-mono text-xs">
                              {logs.map(log => (
                                  <tr key={log.id} className="hover:bg-gray-800/50">
                                      <td className="p-4 text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                      <td className="p-4">
                                          <span className={`px-2 py-1 rounded ${
                                              log.type === 'ERROR' ? 'bg-red-900 text-red-400' :
                                              log.type === 'WARNING' ? 'bg-yellow-900 text-yellow-400' :
                                              log.type === 'SUCCESS' ? 'bg-green-900 text-green-400' :
                                              log.type === 'SECURITY' ? 'bg-purple-900 text-purple-400' :
                                              'bg-gray-800 text-gray-400'
                                          }`}>{log.type}</span>
                                      </td>
                                      <td className="p-4 font-bold text-gray-300">{log.event}</td>
                                      <td className="p-4 text-gray-400">{log.details}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}
      </div>

      {/* User Modal */}
      {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
                   <h3 className="text-xl font-bold text-white mb-2">Admin Top-Up</h3>
                   <p className="text-gray-400 text-sm mb-6">Granting credits to <span className="text-yellow-500 font-bold">{selectedUser.name}</span></p>
                   
                   <div className="mb-6">
                       <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Minutes to Add</label>
                       <div className="flex gap-2">
                           <input type="number" className="flex-1 bg-black border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-green-500 font-mono text-lg" value={fundAmount} onChange={e => setFundAmount(parseInt(e.target.value) || 0)} />
                       </div>
                   </div>

                   <div className="flex gap-3">
                       <button onClick={() => setShowUserModal(false)} className="flex-1 py-3 rounded-xl font-bold bg-gray-800 text-gray-400 hover:bg-gray-700">Cancel</button>
                       <button onClick={handleAddFunds} className="flex-1 py-3 rounded-xl font-bold bg-green-600 text-white hover:bg-green-500">Confirm Grant</button>
                   </div>
              </div>
          </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedCompanion && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
                   <h3 className="text-xl font-bold text-white mb-6">Update Avatar</h3>
                   <div className="w-full aspect-square rounded-xl bg-black border border-gray-800 mb-4 overflow-hidden">
                       <AvatarImage src={newImageUrl} alt="Preview" className="w-full h-full object-cover" />
                   </div>
                   <input className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white text-xs mb-6 outline-none focus:border-yellow-500" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} placeholder="https://..." />
                   <div className="flex gap-3">
                       <button onClick={() => setShowImageModal(false)} className="flex-1 py-3 rounded-xl font-bold bg-gray-800 text-gray-400 hover:bg-gray-700">Cancel</button>
                       <button onClick={handleUpdateImage} className="flex-1 py-3 rounded-xl font-bold bg-yellow-500 text-black hover:bg-yellow-400">Save</button>
                   </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;