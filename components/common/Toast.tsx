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
            <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center justify-between gap-3 p-3 rounded-xl shadow-lg border min-w-[200px] max-w-[320px] animate-in slide-in-from-right-5 duration-300 backdrop-blur-md 
                        ${toast.type === 'success' ? 'bg-green-50/90 border-green-100 text-green-800' :
                                toast.type === 'error' ? 'bg-red-50/90 border-red-100 text-red-800' :
                                    'bg-white/90 dark:bg-gray-800/90 border-gray-100 dark:border-gray-700 dark:text-gray-200'}`}
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
