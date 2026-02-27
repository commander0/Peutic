import { useState, useEffect } from 'react';
import { User } from '../types';
import { Notification } from '../components/common/NotificationBell';
import { GardenService } from '../services/gardenService';
import { PetService } from '../services/petService';

export const useNotifications = (user: User | null | undefined) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        const checkNotifications = async () => {
            // Guarantee fresh notifications for current session
            if (user?.id) {
                localStorage.removeItem('peutic_cleared_notifs');
            }

            // Delay slightly to let data load references if needed
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (!user?.id) return;

            const clearedIds = JSON.parse(localStorage.getItem('peutic_cleared_notifs') || '[]');
            const newNotifs: Notification[] = [];

            const addIfNotCleared = (n: Notification) => {
                if (!clearedIds.includes(n.id)) {
                    newNotifs.push(n);
                }
            };

            // 1. Check Garden
            try {
                const g = await GardenService.getGarden(user.id);
                if (g && g.waterLevel < 30) {
                    addIfNotCleared({
                        id: 'garden-water-low',
                        title: 'Garden Needs Water',
                        message: 'Your plants are thirsty! Water them to keep your streak.',
                        type: 'warning',
                        read: false,
                        timestamp: new Date(),
                        action: 'open_garden'
                    });
                }
            } catch (err) {
                console.error("Error checking garden for notifs", err);
            }

            // 2. Check Pet
            try {
                const p = await PetService.getPet(user.id);
                if (p) {
                    if (p.hunger < 40) {
                        addIfNotCleared({
                            id: 'pet-hunger-low',
                            title: `${p.name} is Hungry`,
                            message: 'Time to feed your companion!',
                            type: 'info',
                            read: false,
                            timestamp: new Date(),
                            action: 'open_pet'
                        });
                    } else if (p.energy < 30 && !p.isSleeping) {
                        addIfNotCleared({
                            id: 'pet-energy-low',
                            title: `${p.name} is Tired`,
                            message: 'Maybe it is time for a nap?',
                            type: 'info',
                            read: false,
                            timestamp: new Date(),
                            action: 'open_pet'
                        });
                    }
                }
            } catch (err) {
                console.error("Error checking pet for notifs", err);
            }

            // 3. Check for Gamification & Tools Engagement
            const rand = Math.random();
            if (rand > 0.8) {
                addIfNotCleared({
                    id: 'explore-dojo',
                    title: 'Inner Stillness Awaits',
                    message: 'Take a powerful 1-minute breathing break in the Zen Dojo.',
                    type: 'success',
                    read: false,
                    timestamp: new Date(),
                    action: 'open_dojo'
                });
            } else if (rand > 0.6) {
                addIfNotCleared({
                    id: 'consult-oracle',
                    title: 'The Stars Are Aligning',
                    message: 'Consult the Oracle in the Observatory for guidance today.',
                    type: 'info',
                    read: false,
                    timestamp: new Date(),
                    action: 'open_observatory'
                });
            } else if (rand > 0.4) {
                addIfNotCleared({
                    id: 'play-minigames',
                    title: 'Mental Agility',
                    message: 'Keep your mind sharp with Mindful Match or Cloud Hop.',
                    type: 'warning',
                    read: false,
                    timestamp: new Date(),
                    action: 'open_games'
                });
            } else if (rand > 0.2) {
                addIfNotCleared({
                    id: 'use-shredder',
                    title: 'Heavy Thoughts?',
                    message: 'Use the Thought Shredder to physically let go of anxieties.',
                    type: 'error',
                    read: false,
                    timestamp: new Date(),
                    action: 'open_shredder'
                });
            }

            // 4. Daily Streak Hint (if nothing else)
            if (newNotifs.length === 0) {
                addIfNotCleared({
                    id: 'daily-streak-hint',
                    title: 'Daily Streak',
                    message: 'Complete 1 more activity to keep your streak alive!',
                    type: 'success',
                    read: false,
                    timestamp: new Date(),
                    action: 'check_streak'
                });
            }

            if (newNotifs.length > 0) {
                setNotifications(prev => {
                    const allNotifs = [...prev, ...newNotifs];
                    const getFeatureGroup = (id: string) => id.split('-')[0];
                    const stackedMap = new Map<string, Notification>();

                    allNotifs.forEach(n => {
                        const group = getFeatureGroup(n.id);
                        stackedMap.set(group, n);
                    });

                    const existingIds = new Set(JSON.parse(localStorage.getItem('peutic_cleared_notifs') || '[]'));
                    const filtered = Array.from(stackedMap.values()).filter(n => !existingIds.has(n.id));

                    return filtered;
                });
            }
        };

        checkNotifications();
    }, [user?.id]);

    const handleClearNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        const cleared = JSON.parse(localStorage.getItem('peutic_cleared_notifs') || '[]');
        if (!cleared.includes(id)) {
            localStorage.setItem('peutic_cleared_notifs', JSON.stringify([...cleared, id]));
        }
    };

    const handleClearAllNotifications = () => {
        const ids = notifications.map(n => n.id);
        const cleared = JSON.parse(localStorage.getItem('peutic_cleared_notifs') || '[]');
        const newCleared = [...new Set([...cleared, ...ids])];
        localStorage.setItem('peutic_cleared_notifs', JSON.stringify(newCleared));
        setNotifications([]);
    };

    const addNotification = (n: Notification) => {
        setNotifications(prev => [n, ...prev]);
    };

    return {
        notifications,
        addNotification,
        handleClearNotification,
        handleClearAllNotifications
    };
};
