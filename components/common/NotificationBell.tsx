import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    timestamp: Date;
}

interface NotificationBellProps {
    notifications: Notification[];
    onClear: (id: string) => void;
    onClearAll: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ notifications, onClear, onClearAll }) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-2xl bg-white dark:bg-gray-800 border border-yellow-100 dark:border-gray-800 shadow-sm hover:scale-105 transition-all flex items-center justify-center"
            >
                <Bell className={`w-5 h-5 text-gray-600 dark:text-gray-300 ${unreadCount > 0 ? 'animate-swing' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-black animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-14 w-80 md:w-96 bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 z-[100] animate-in slide-in-from-top-2 duration-200 overflow-hidden origin-top-right">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                        <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">Notifications</h3>
                        {notifications.length > 0 && (
                            <button onClick={onClearAll} className="text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-red-500 transition-colors">
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest">Quiet in the Sanctuary</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50 dark:divide-gray-800">
                                {notifications.map(n => (
                                    <div key={n.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex gap-4 group relative">
                                        <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${n.type === 'success' ? 'bg-green-100 text-green-600' :
                                                n.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                                    n.type === 'error' ? 'bg-red-100 text-red-600' :
                                                        'bg-blue-100 text-blue-600'
                                            }`}>
                                            {n.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                                                n.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                                                    n.type === 'error' ? <AlertTriangle className="w-4 h-4" /> :
                                                        <Info className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 pr-6">
                                            <h4 className="text-sm font-black text-gray-800 dark:text-gray-200 mb-1">{n.title}</h4>
                                            <p className="text-xs text-gray-500 leading-relaxed font-medium">{n.message}</p>
                                            <p className="text-[9px] text-gray-400 mt-2 font-mono uppercase">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onClear(n.id); }}
                                            className="absolute top-4 right-4 p-1.5 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};