import { useState, useEffect } from 'react';
import { AdminService } from '../services/adminService';
import { GlobalSettings } from '../types';

export function useSettingsPoller() {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [settings, setSettings] = useState<GlobalSettings | null>(null);

    useEffect(() => {
        // WIRE UP LOGGER SAFELY (Once on mount)
        if (typeof window !== 'undefined') {
            (window as any).PersistLog = AdminService.logSystemEvent;
        }

        let isMounted = true;
        let timeoutId: any;

        const syncSettings = async () => {
            try {
                const s = await AdminService.syncGlobalSettings();
                if (isMounted && s) {
                    setSettings(s);
                    setMaintenanceMode(s.maintenanceMode);
                }
            } catch (e) {
                console.error("Settings sync failed", e);
            } finally {
                if (isMounted) timeoutId = setTimeout(syncSettings, 5000); // Wait 5s AFTER finish
            }
        };

        syncSettings();

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, []);

    return { maintenanceMode, settings };
}
