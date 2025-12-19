import React, { useState } from 'react';
import { Database } from '../services/database';
import { UserRole } from '../types';
import { Lock, AlertCircle, Shield, ArrowRight, PlusCircle, Check } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (user: any) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [showRegister, setShowRegister] = useState(false);
  const [masterKey, setMasterKey] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState('');

  const lockout = Database.checkAdminLockout();

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (lockout) {
        setError(`System Locked. Try again in ${lockout} minutes.`);
        return;
    }
    setLoading(true);
    setTimeout(() => {
        const user = Database.getUserByEmail(email);
        if (user && user.role === UserRole.ADMIN) {
            Database.resetAdminFailure();
            onLogin(user);
        } else {
             Database.recordAdminFailure();
             setError("Access Denied. Incident reported.");
        }
        setLoading(false);
    }, 1000);
  };

  const handleRegisterAdmin = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccessMsg('');

      if (masterKey.trim() !== 'PEUTIC-MASTER-2025') {
          setError("Invalid Master Key.");
          return;
      }
      if (newAdminPassword !== newAdminConfirmPassword) {
          setError("Passwords do not match.");
          return;
      }
      if (newAdminPassword.length < 6) {
          setError("Password must be at least 6 characters.");
          return;
      }

      Database.createUser('System Admin', newAdminEmail, 'email', undefined, UserRole.ADMIN);
      setSuccessMsg("Root Admin Created Successfully. Please Login.");
      
      setTimeout(() => {
          setShowRegister(false);
          setSuccessMsg('');
          setEmail(newAdminEmail);
          setMasterKey('');
          setNewAdminPassword('');
          setNewAdminConfirmPassword('');
      }, 2000);
  };

  const hasAdmin = Database.hasAdmin();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-yellow-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                    <Shield className="w-8 h-8 text-black fill-black" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">COMMAND CENTER</h1>
                <p className="text-gray-500 font-mono text-xs mt-2 tracking-widest uppercase">Restricted Access Level 5</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
                {lockout ? (
                    <div className="text-center py-12">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-red-500">TERMINAL LOCKED</h3>
                        <p className="text-white font-mono mt-4">Unlock in: {lockout}m</p>
                    </div>
                ) : (
                    <>
                        {error && <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-400 text-sm rounded-xl flex items-center gap-2 font-bold">{error}</div>}
                        {successMsg && <div className="mb-6 p-4 bg-green-900/30 border border-green-800 text-green-400 text-sm rounded-xl flex items-center gap-2 font-bold">{successMsg}</div>}

                        {showRegister ? (
                             <form onSubmit={handleRegisterAdmin} className="space-y-4">
                                <div className="text-center mb-4">
                                    <h3 className="text-white font-bold text-lg">Initialize Root Admin</h3>
                                </div>
                                <input type="password" className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none" placeholder="Master Key" value={masterKey} onChange={e => setMasterKey(e.target.value)} />
                                <input type="email" required className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none" placeholder="New Admin Email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="password" required className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none" placeholder="Password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} />
                                    <input type="password" required className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none" placeholder="Confirm" value={newAdminConfirmPassword} onChange={e => setNewAdminConfirmPassword(e.target.value)} />
                                </div>
                                <button className="w-full bg-yellow-500 text-black font-black py-4 rounded-xl hover:bg-yellow-400 transition-colors mt-4">INITIALIZE SYSTEM</button>
                                <button type="button" onClick={() => setShowRegister(false)} className="text-gray-500 text-sm w-full text-center hover:text-white py-2">Cancel</button>
                             </form>
                        ) : (
                            <form onSubmit={handleAdminLogin} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Admin Identifier</label>
                                    <input type="email" className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none transition-colors" placeholder="admin@peutic.com" value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Secure Key</label>
                                    <input type="password" className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none transition-colors" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2">
                                    {loading ? <span className="animate-pulse">Authenticating...</span> : <><Lock className="w-4 h-4" /> ACCESS TERMINAL</>}
                                </button>
                                {!hasAdmin && (
                                    <button type="button" onClick={() => setShowRegister(true)} className="w-full border border-gray-800 text-gray-500 py-3 rounded-xl text-xs font-bold hover:bg-gray-900 hover:text-white transition-colors flex items-center justify-center gap-2 mt-4">
                                        <PlusCircle className="w-3 h-3" /> INITIALIZE SYSTEM (First Run)
                                    </button>
                                )}
                            </form>
                        )}
                    </>
                )}
            </div>
            <div className="mt-8 text-center">
                <a href="/" className="text-gray-600 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors">Return to Public Site <ArrowRight className="w-3 h-3" /></a>
            </div>
        </div>
    </div>
  );
};

export default AdminLogin;