import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto-remove after 5 seconds
        setTimeout(() => removeToast(id), 5000);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-12 md:top-20 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-4 z-[9999] flex flex-col gap-2 pointer-events-none w-[90%] md:w-auto max-w-md items-center md:items-end">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center justify-between gap-3 p-3 rounded-xl shadow-2xl border w-full md:min-w-[200px] md:max-w-[320px] animate-in slide-in-from-top-5 md:slide-in-from-right-5 duration-300 backdrop-blur-xl 
                        ${toast.type === 'success' ? 'bg-green-50/95 dark:bg-green-900/90 border-green-200 dark:border-green-800 text-green-800 dark:text-green-100' :
                                toast.type === 'error' ? 'bg-red-50/95 dark:bg-red-900/90 border-red-200 dark:border-red-800 text-red-800 dark:text-red-100' :
                                    'bg-white/95 dark:bg-gray-800/95 border-gray-200 dark:border-gray-700 dark:text-gray-100'}`}
                    >
                        <div className="flex items-center gap-2">
                            {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                            <span className="text-xs font-bold leading-tight">{toast.message}</span>
                        </div>
                        <button onClick={() => removeToast(toast.id)} className="p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors">
                            <X className="w-3 h-3 opacity-50" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};
