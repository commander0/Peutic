import { useState, useEffect } from 'react';
import { User, Companion, Transaction, GlobalSettings } from '../types';
import { UserService } from '../services/userService';
import { AdminService } from '../services/adminService';

export const useDashboardState = (initialUser: User) => {
    const [dashboardUser, setDashboardUser] = useState<User>(initialUser);
    const [balance, setBalance] = useState(initialUser.balance);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [companions, setCompanions] = useState<Companion[]>([]);
    const [loadingCompanions, setLoadingCompanions] = useState(true);
    const [weeklyGoal, setWeeklyGoal] = useState(0);
    const [weeklyMessage, setWeeklyMessage] = useState("Start your journey.");
    const [settings, setSettings] = useState<GlobalSettings | null>(null);

    const refreshData = async () => {
        AdminService.syncGlobalSettings().then(setSettings);
        const u = UserService.getUser();
        if (u) {
            setDashboardUser(u);
            setBalance(u.balance);

            // Fetch secondary data in background without blocking
            UserService.getUserTransactions(u.id).then(setTransactions);
            UserService.getWeeklyProgress(u.id).then(prog => {
                setWeeklyGoal(prog.current);
                setWeeklyMessage(prog.message);
            });
        }
        AdminService.getCompanions().then(setCompanions);
    };

    // BROADCAST FIX: Poll for global settings updates
    useEffect(() => {
        const pollSettings = async () => {
            const s = await AdminService.syncGlobalSettings();
            setSettings(s);
        };

        const loadWeeklyGoal = async () => {
            if (initialUser.id) {
                const progress = await UserService.getWeeklyProgress(initialUser.id);
                setWeeklyGoal(progress.current);
                setWeeklyMessage(progress.message);
            }
        };

        pollSettings(); // Initial sync
        loadWeeklyGoal();

        const interval = setInterval(() => {
            pollSettings();
            loadWeeklyGoal();
        }, 10000); // 10s poll

        return () => clearInterval(interval);
    }, [initialUser.id]);

    useEffect(() => {
        // Kick off all data fetching in parallel
        refreshData();

        // Get companions immediately without delay
        AdminService.getCompanions().then((comps) => {
            setCompanions(comps);
            setLoadingCompanions(false);

            // PRE-FETCH: Smooth loading for specialist avatars
            comps.slice(0, 10).forEach(c => {
                if (c.imageUrl) (new Image()).src = c.imageUrl;
            });
        });

        // REALTIME: Subscribe to changes instantly instead of polling
        const subscription = UserService.subscribeToUserChanges(initialUser.id, (updatedUser) => {
            setDashboardUser(updatedUser);
            setBalance(updatedUser.balance);

            // Refresh dependent data if needed
            UserService.getWeeklyProgress(updatedUser.id).then(prog => {
                setWeeklyGoal(prog.current);
                setWeeklyMessage(prog.message);
            });
        });

        // Backup slow poll (every 60s) just for drift correction
        const interval = setInterval(async () => {
            await UserService.syncUser(initialUser.id);
            refreshData();
        }, 60000);

        return () => {
            clearInterval(interval);
            subscription.unsubscribe();
        };
    }, []);

    return {
        dashboardUser,
        setDashboardUser,
        balance,
        setBalance,
        transactions,
        companions,
        loadingCompanions,
        weeklyGoal,
        weeklyMessage,
        settings,
        refreshData
    };
};
