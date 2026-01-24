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
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <Bell className={`w-6 h-6 text-gray-600 dark:text-gray-300 ${unreadCount > 0 ? 'animate-swing' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-black animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="fixed inset-x-4 top-16 md:absolute md:top-12 md:left-0 md:right-auto md:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 animate-in slide-in-from-top-2 duration-200 overflow-hidden origin-top-left">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                        <h3 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-2"><Bell className="w-4 h-4" /> Notifications</h3>
                        {notifications.length > 0 && (
                            <button onClick={onClearAll} className="text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-red-500 transition-colors">
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-xs">No new notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50 dark:divide-gray-800">
                                {notifications.map(n => (
                                    <div key={n.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex gap-3 group relative">
                                        <div className={`mt-1 p-1.5 rounded-full shrink-0 ${n.type === 'success' ? 'bg-green-100 text-green-600' :
                                            n.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                                n.type === 'error' ? 'bg-red-100 text-red-600' :
                                                    'bg-blue-100 text-blue-600'
                                            }`}>
                                            {n.type === 'success' ? <CheckCircle className="w-3 h-3" /> :
                                                n.type === 'warning' ? <AlertTriangle className="w-3 h-3" /> :
                                                    n.type === 'error' ? <AlertTriangle className="w-3 h-3" /> :
                                                        <Info className="w-3 h-3" />}
                                        </div>
                                        <div className="flex-1 pr-6">
                                            <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-0.5">{n.title}</h4>
                                            <p className="text-[11px] text-gray-500 leading-relaxed">{n.message}</p>
                                            <p className="text-[9px] text-gray-400 mt-2 font-mono">{n.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onClear(n.id); }}
                                            className="absolute top-2 right-2 p-1.5 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <X className="w-3 h-3" />
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
