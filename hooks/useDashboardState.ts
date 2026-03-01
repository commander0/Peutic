import { useState, useEffect } from 'react';
import { User, Companion, Transaction, GlobalSettings } from '../types';
import { UserService } from '../services/userService';
import { AdminService } from '../services/adminService';
import { useGlobalState } from '../contexts/GlobalStateContext';

export const useDashboardState = (initialUser: User) => {
    const { userProfile } = useGlobalState();
    const dashboardUser = userProfile || initialUser;
    const balance = dashboardUser.balance;

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [companions, setCompanions] = useState<Companion[]>([]);
    const [loadingCompanions, setLoadingCompanions] = useState(true);
    const [weeklyGoal, setWeeklyGoal] = useState(0);
    const [weeklyMessage, setWeeklyMessage] = useState("Start your journey.");
    const [settings, setSettings] = useState<GlobalSettings | null>(null);

    const refreshData = async () => {
        AdminService.syncGlobalSettings().then(setSettings);
        if (dashboardUser) {
            UserService.getUserTransactions(dashboardUser.id).then(setTransactions);
            UserService.getWeeklyProgress(dashboardUser.id).then(prog => {
                setWeeklyGoal(prog.current);
                setWeeklyMessage(prog.message);
            });
        }
        AdminService.getCompanions().then(setCompanions);
    };

    useEffect(() => {
        const pollSettings = async () => {
            const s = await AdminService.syncGlobalSettings();
            setSettings(s);
        };

        const loadWeeklyGoal = async () => {
            if (dashboardUser.id) {
                const progress = await UserService.getWeeklyProgress(dashboardUser.id);
                setWeeklyGoal(progress.current);
                setWeeklyMessage(progress.message);
            }
        };

        pollSettings();
        loadWeeklyGoal();

        const interval = setInterval(() => {
            pollSettings();
            loadWeeklyGoal();
        }, 60000); // Changed from 10s to 60s to reduce excessive network requests and component re-renders

        return () => clearInterval(interval);
    }, [dashboardUser.id]);

    useEffect(() => {
        refreshData();

        const handleBalanceUpdate = () => {
            refreshData();
        };
        window.addEventListener('balance-updated', handleBalanceUpdate);

        AdminService.getCompanions().then((comps) => {
            setCompanions(comps);
            setLoadingCompanions(false);
            comps.slice(0, 10).forEach(c => {
                if (c.imageUrl) (new Image()).src = c.imageUrl;
            });
        });

        // Split-Brain logic removed - Core user details now managed exclusively by GlobalStateContext Realtime Pipeline
        return () => {
            window.removeEventListener('balance-updated', handleBalanceUpdate);
        };
    }, []);

    return {
        dashboardUser,
        setDashboardUser: () => { console.warn("V2: setDashboardUser is deprecated. Realtime takes precedence."); },
        balance,
        setBalance: () => { console.warn("V2: setBalance is deprecated. Use transactions/realtime."); },
        transactions,
        companions,
        loadingCompanions,
        weeklyGoal,
        weeklyMessage,
        settings,
        refreshData
    };
};
