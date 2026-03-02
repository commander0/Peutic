import React from 'react';
import { useNavigate } from 'react-router-dom';

interface MaintenanceGuardProps {
    isActive: boolean;
    isAdmin: boolean;
    isAdminRoute: boolean;
    children: React.ReactNode;
}

export const MaintenanceGuard: React.FC<MaintenanceGuardProps> = ({ isActive, isAdmin, isAdminRoute, children }) => {
    const navigate = useNavigate();

    // MAINTENANCE MODE LOCK (Bypassed by Admins or if on an Admin route)
    if (isActive && !isAdmin && !isAdminRoute) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center text-white">
                <div className="w-20 h-20 bg-yellow-500/10 rounded-3xl flex items-center justify-center mb-6 animate-pulse">
                    <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h1 className="text-3xl font-black tracking-tight mb-4">SYSTEM MAINTENANCE</h1>
                <p className="text-gray-400 max-w-md mx-auto mb-8 text-sm leading-relaxed">
                    PeuticOS is currently undergoing scheduled upgrades to improve system stability and performance.
                    We will be back online shortly.
                </p>
                <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Expected Duration: &lt; 30 Minutes</div>

                {/* Secret Admin Entry */}
                <button onClick={() => navigate('/admin/login')} className="mt-20 opacity-0 hover:opacity-20 text-[9px] text-gray-500 uppercase tracking-widest">Admin Override</button>
            </div>
        );
    }

    return <>{children}</>;
};
