import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { User, Companion, Transaction, VoiceJournalEntry, GardenState, Lumina } from '../types';
import { LanguageSelector } from './common/LanguageSelector';
import { useLanguage } from './common/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import {
    Clock, Settings, LogOut,
    LayoutDashboard, Plus, X, Mic, Lock, AlertTriangle, ShieldCheck, Heart,
    BookOpen, Flame, Trophy,
    Sun, Feather, LifeBuoy, RefreshCw, Star, Edit2, Zap, Gamepad2,
    ChevronDown, ChevronUp, User as UserIcon, Moon, Scissors,
    Twitter, Instagram, Linkedin,
    Mail, Eye, EyeOff, Megaphone, Sparkles, Save, Video
} from 'lucide-react';
import { NotificationBell, Notification } from './common/NotificationBell';
import { UserService } from '../services/userService';
import { AdminService } from '../services/adminService';
import { useToast } from './common/Toast';
import { CompanionSkeleton, StatSkeleton } from './common/SkeletonLoader';
import { InspirationQuote } from './common/InspirationQuote';

import { NameValidator } from '../services/nameValidator';
import { generateDailyInsight } from '../services/geminiService';

import TechCheck from './TechCheck';
import GroundingMode from './GroundingMode';
import { GardenService } from '../services/gardenService';
import { PetService } from '../services/petService';

// Extracted Components
import { JournalSection } from './dashboard/JournalSection';
import { WisdomGenerator } from './dashboard/WisdomGenerator';
import { MoodTracker } from './dashboard/MoodTracker';
import { SoundscapePlayer } from './dashboard/SoundscapePlayer';
import { WeatherEffect } from './dashboard/WeatherEffect';

// LAZY LOAD HEAVY COMPONENTS
const GardenCanvas = lazy(() => import('./garden/GardenCanvas'));
const MindfulMatchGame = lazy(() => import('./MindfulMatchGame').catch(() => ({ default: () => <div className="p-10 text-center text-gray-400">Loading Game Engine...</div> })));
const CloudHopGame = lazy(() => import('./CloudHopGame').catch(() => ({ default: () => <div className="p-10 text-center text-gray-400">Loading Cloud Engine...</div> })));
const PaymentModal = lazy(() => import('./PaymentModal').catch(() => ({ default: () => <div className="p-10 text-center text-gray-400">Loading Payment Secure Node...</div> })));
const ProfileModal = lazy(() => import('./ProfileModal').catch(() => ({ default: () => <div className="p-10 text-center text-gray-400">Loading Profile Experience...</div> })));
const GardenFullView = lazy(() => import('./garden/GardenFullView'));
const BookOfYouView = lazy(() => import('./retention/BookOfYouView'));
const LuminaView = lazy(() => import('./pocket/LuminaView'));
const ObservatoryView = lazy(() => import('./sanctuary/ObservatoryView'));
const DojoView = lazy(() => import('./sanctuary/DojoView'));


import EmergencyOverlay from './safety/EmergencyOverlay';
import { VoiceRecorder, VoiceEntryItem } from './journal/VoiceRecorder';

// ... (Existing code)

declare global {
    interface Window {
        Stripe?: any;
        webkitAudioContext?: typeof AudioContext;
    }
}

interface DashboardProps {
    user: User;
    onLogout: () => void;
    onStartSession: (companion: Companion) => void;
}

const AvatarImage = React.memo(({ src, alt, className, isUser = false }: { src?: string, alt?: string, className?: string, isUser?: boolean }) => {
    const [imgError, setImgError] = useState(false);
    return (
        <div className={`relative ${className || ''} overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
            {src && !imgError ? (
                <img
                    src={src}
                    alt={alt || 'Avatar'}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            ) : (
                <div className="w-full h-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    {isUser || (alt && alt.length > 0) ? (
                        <img
                            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(alt || 'user')}&backgroundColor=transparent`}
                            alt="Fallback Avatar"
                            className="w-full h-full object-cover bg-yellow-200 dark:bg-yellow-900"
                        />
                    ) : (
                        <Sparkles className="w-1/2 h-1/2 text-yellow-600 dark:text-yellow-500" />
                    )}
                </div>
            )}
            {isUser && <div className="absolute inset-0 ring-1 ring-inset ring-black/10"></div>}
        </div>
    );
});
AvatarImage.displayName = 'AvatarImage';

const CollapsibleSection = React.memo(({ title, icon: Icon, children, defaultOpen = false }: { title: string, icon: any, children: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-transparent rounded-3xl border border-[var(--color-primary-border)] overflow-hidden transition-all duration-300" style={{ borderColor: 'var(--color-primary-border)' }}>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full p-4 lg:p-6 flex items-center justify-between hover:bg-[var(--color-primary)]/10 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}><Icon className="w-5 h-5" /></div>
                    <span className="font-bold text-base dark:text-white">{title}</span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-gray-400" /> : <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />}
            </button>
            {isOpen && <div className="p-4 lg:p-6 pt-0 animate-in slide-in-from-top-2 duration-300 bg-transparent">{children}</div>}
        </div>
    );
});
CollapsibleSection.displayName = 'CollapsibleSection';

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onStartSession }) => {
    const { lang, setLang, t } = useLanguage();
    const { theme, mode, setTheme, toggleMode } = useTheme();
    const [activeTab, setActiveTab] = useState<'inner_sanctuary' | 'history' | 'settings'>('inner_sanctuary');

    // Derived boolean for simple UI toggles
    const isDark = mode === 'dark';

    const [balance, setBalance] = useState(user.balance);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [companions, setCompanions] = useState<Companion[]>([]);
    const [loadingCompanions, setLoadingCompanions] = useState(true);
    const [weeklyGoal, setWeeklyGoal] = useState(0);
    const weeklyTarget = 10;
    const [weeklyMessage, setWeeklyMessage] = useState("Start your journey.");
    const [dashboardUser, setDashboardUser] = useState(user);
    const [settings, setSettings] = useState(AdminService.getSettings());
    const [showPayment, setShowPayment] = useState(false);
    const [paymentError, setPaymentError] = useState<string | undefined>(undefined);
    const [showBreathing, setShowBreathing] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    const [showGrounding, setShowGrounding] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [mood, setMood] = useState<'confetti' | 'rain' | null>(null);
    const [editName, setEditName] = useState(user.name);
    const [editEmail, setEditEmail] = useState(user.email);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isIdle, setIsIdle] = useState(false);
    const idleTimerRef = useRef<number | null>(null);

    const [showTechCheck, setShowTechCheck] = useState(false);
    const [isGhostMode, setIsGhostMode] = useState(() => localStorage.getItem('peutic_ghost_mode') === 'true');
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [showBookFull, setShowBookFull] = useState(false);
    const [showGardenFull, setShowGardenFull] = useState(false);
    const [showPocketPet, setShowPocketPet] = useState(false);
    const [showObservatory, setShowObservatory] = useState(false);
    const [showDojo, setShowDojo] = useState(false);
    // Lumina state moved to grouped section
    const [isVaultOpen, setIsVaultOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const [pendingCompanion, setPendingCompanion] = useState<Companion | null>(null);
    const [specialtyFilter, setSpecialtyFilter] = useState<string>('All');
    const { showToast } = useToast();

    // --- NEW FEATURE: VOICE JOURNAL & MOOD PULSE ---
    const [showVoiceJournal, setShowVoiceJournal] = useState(false);
    const [voiceEntries, setVoiceEntries] = useState<VoiceJournalEntry[]>([]);
    const [moodRiskAlert, setMoodRiskAlert] = useState(false);

    const resetIdleTimer = () => {
        setIsIdle(false);
        if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = window.setTimeout(() => setIsIdle(true), 5 * 60 * 1000); // 5 minutes blur
    };

    useEffect(() => {
        const events = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
        events.forEach(e => window.addEventListener(e, resetIdleTimer));
        resetIdleTimer();
        return () => {
            events.forEach(e => window.removeEventListener(e, resetIdleTimer));
            if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
        };
    }, []);

    useEffect(() => {
        checkMoodPulse();
        loadVoiceJournals();
    }, []);

    const checkMoodPulse = async () => {
        if (!user) return;
        const risk = await UserService.predictMoodRisk(user.id);
        if (risk) setMoodRiskAlert(true);
    };

    const loadVoiceJournals = async () => {
        if (!user) return;
        const entries = await UserService.getVoiceJournals(user.id);
        setVoiceEntries(entries);
    };

    const handleVoiceCheckIn = () => {
        setShowVoiceJournal(true);
        setMoodRiskAlert(false);
    };

    const handleVoiceSave = async (entry: VoiceJournalEntry) => {
        try {
            await UserService.saveVoiceJournal(entry);
            setVoiceEntries(prev => [entry, ...prev]);
            showToast("Voice Journal Saved", "success");
        } catch (e) {
            showToast("Failed to save audio", "error");
        }
    };
    // -----------------------------------------------

    // Garden State
    const [garden, setGarden] = useState<GardenState | null>(null);
    // Lumina State
    const [lumina, setLumina] = useState<Lumina | null>(null);
    const [isClipping, setIsClipping] = useState(false);

    const refreshGarden = async () => {
        if (!user.id) return;
        const g = await GardenService.getGarden(user.id);
        setGarden(g);
    };

    const handleClipPlant = async () => {
        if (!user || isClipping) return;
        setIsClipping(true);
        const result = await GardenService.clipPlant(user.id);

        if (result.success) {
            showToast(result.message || "Clipped!", "success");
            if (result.reward) {
                // Show Quote Toast
                showToast(`"${result.reward}"`, "info");
            }
            if (result.prize && result.prize > 0) {
                await UserService.addBalance(result.prize, "Garden Prize");
                setBalance(prev => prev + (result.prize || 0));
                showToast(`Found ${result.prize}m hidden in the leaves!`, "success");
            }
            setTimeout(() => {
                setIsClipping(false);
                refreshGarden(); // Refresh stats if needed
            }, 2000);
        } else {
            showToast(result.message || "Cannot clip right now", "error");
            setIsClipping(false);
        }
    };

    const refreshPet = async () => {
        if (!user.id) return;
        const p = await PetService.getPet(user.id);
        setLumina(p);
    };

    const handleNotificationAction = (action: string) => {
        switch (action) {
            case 'open_pet': setShowPocketPet(true); break;
            case 'open_garden': setShowGardenFull(true); break;
            case 'check_streak': setShowBookFull(true); break;
            case 'open_community': showToast("Redirecting to Community Hub...", "info"); break;
        }
    };

    useEffect(() => {
        refreshGarden();
        refreshPet();

        // Smart Engagement Notifications (On Load)
        const checkNotifications = async () => {
            // Delay slightly to let data load references if needed, though we await below
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

            // 3. Daily Streak Hint (if nothing else)
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
                    // Avoid duplicates if React.StrictMode runs twice
                    const existingIds = new Set(prev.map(n => n.id));
                    const uniqueNew = newNotifs.filter(n => !existingIds.has(n.id));
                    return [...prev, ...uniqueNew];
                });
            }
        };

        checkNotifications();
    }, [user.id]);

    useEffect(() => {
        // Kick off all data fetching in parallel
        refreshData();

        generateDailyInsight(user.name, user.id);

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
        const subscription = UserService.subscribeToUserChanges(user.id, (updatedUser) => {
            setDashboardUser(updatedUser);
            setBalance(updatedUser.balance);
            if (updatedUser.name !== user.name) setEditName(updatedUser.name);
            // Refresh dependent data if needed
            UserService.getWeeklyProgress(updatedUser.id).then(prog => {
                setWeeklyGoal(prog.current);
                setWeeklyMessage(prog.message);
            });
        });

        // Backup slow poll (every 60s) just for drift correction
        const interval = setInterval(async () => {
            await UserService.syncUser(user.id);
            refreshData();
        }, 60000);

        return () => {
            clearInterval(interval);
            subscription.unsubscribe();
        };
    }, []);


    const refreshData = async () => {
        AdminService.syncGlobalSettings().then(setSettings);
        const u = UserService.getUser();
        if (u) {
            setDashboardUser(u);
            setBalance(u.balance);
            setEditName(u.name);
            setEditEmail(u.email);


            // Fetch secondary data in background without blocking
            UserService.getUserTransactions(u.id).then(setTransactions);
            UserService.getWeeklyProgress(u.id).then(prog => {
                setWeeklyGoal(prog.current);
                setWeeklyMessage(prog.message);
            });
        }
        AdminService.getCompanions().then(setCompanions);
    };



    const toggleDarkMode = () => {
        toggleMode();
    };

    const toggleGhostMode = () => {
        const newVal = !isGhostMode;
        setIsGhostMode(newVal);
        localStorage.setItem('peutic_ghost_mode', String(newVal));
        showToast(newVal ? "Ghost Mode Active: Identity Hidden" : "Ghost Mode Inactive", 'success');
        refreshData(); // Refresh to update greeting
    };

    // Sync state with User Preference when User loads (fixes login theme mismatch)
    useEffect(() => {
        if (user && user.themePreference) {
            // ThemeContext handles initialization parsing, this is just for reactive updates if needed
        }
    }, [user.themePreference]);

    const handleMoodSelect = (m: 'confetti' | 'rain' | null) => {
        setMood(m);
        if (m) {
            UserService.saveMood(user.id, m).then(async () => {
                await GardenService.waterPlant(user.id);
                refreshData();
                refreshGarden();
            });
        }
    };

    const handlePaymentSuccess = async (minutesAdded: number, cost: number, token?: string) => {
        try {
            await UserService.topUpWallet(minutesAdded, cost, user.id, token);
            refreshData();

            setShowPayment(false);
            showToast("Payment successful! Credits added.", 'success');
        } catch (e: any) {
            setPaymentError(e.message || "Payment verification failed.");
            showToast(e.message || "Payment failed", 'error');
        }
    };

    const handleStartConnection = (c: Companion) => {
        if ((dashboardUser?.balance || 0) <= 0) { setPaymentError("Insufficient credits. Please add funds to start a session."); setShowPayment(true); return; }
        setPendingCompanion(c);
        setShowTechCheck(true);
    };
    const confirmSession = () => { setShowTechCheck(false); if (pendingCompanion) onStartSession(pendingCompanion); };

    // Improved Profile Savings using DashboardUser state directly
    const saveProfileChanges = () => {
        const check = NameValidator.validateFullName(editName);
        if (!check.valid) {
            showToast(check.error || "Invalid name", 'error');
            return;
        }

        setIsSavingProfile(true);

        // Immediate update to UserService
        const updatedUser: User = {
            ...dashboardUser,
            name: editName,
            email: editEmail
        };

        UserService.updateUser(updatedUser).then(async () => {
            showToast("Profile updated successfully", 'success');
            setDashboardUser(updatedUser);
            // Verify by fetching fresh from DB
            await UserService.syncUser(updatedUser.id);
            setIsSavingProfile(false);
        }).catch(err => {
            console.error(err);
            showToast("Failed to save changes", "error");
            setIsSavingProfile(false);
        });
    };
    const handleDeleteAccount = async () => {
        try {
            setIsDeletingAccount(true);
            await UserService.deleteUser(user.id);
            onLogout();
        } catch (e) {
            console.error(e);
            showToast("Failed to delete account. Please contact support.", "error");
            setIsDeletingAccount(false);
        }
    };

    const handleRoomInteraction = async (roomId: string, cost: number) => {
        const currentRooms = dashboardUser.unlockedRooms || [];

        // If already unlocked, open the view
        if (currentRooms.includes(roomId)) {
            if (roomId === 'observatory') setShowObservatory(true);
            if (roomId === 'dojo') setShowDojo(true);
            return;
        }

        if (dashboardUser.balance < cost) {
            showToast(`You need ${cost}m to unlock this space.`, "error");
            setPaymentError(`Unlock ${roomId}: ${cost}m required`);
            setShowPayment(true);
            return;
        }

        if (await UserService.deductBalance(cost, `Unlock Sanctuary Room: ${roomId}`)) {
            const updatedUser = {
                ...dashboardUser,
                balance: dashboardUser.balance - cost,
                unlockedRooms: [...currentRooms, roomId]
            };
            setDashboardUser(updatedUser);
            await UserService.updateUser(updatedUser); // Persist
            showToast(`${roomId.replace(/^\w/, c => c.toUpperCase())} Unlocked!`, "success");

            // Open immediately
            if (roomId === 'observatory') setShowObservatory(true);
            if (roomId === 'dojo') setShowDojo(true);
        }
    };

    const filteredCompanions = specialtyFilter === 'All' ? companions : companions.filter(c => c.specialty.includes(specialtyFilter) || c.specialty === specialtyFilter);
    const uniqueSpecialties = Array.from(new Set(companions.map(c => c.specialty))).sort();

    // --- NOTIFICATION HANDLERS ---
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

    return (
        <div
            className="min-h-screen transition-all duration-1000 font-sans text-[var(--color-text-base)]"
            style={{
                backgroundColor: 'var(--color-bg-base)',
                backgroundImage: 'var(--color-bg-gradient)'
            }}
        >
            {mood && <WeatherEffect type={mood} />}
            {/* FLOATING CONTROLS: Separated for better ergonomics */}
            <div className="fixed bottom-6 left-6 z-[80] pointer-events-none">
                <div className="pointer-events-auto">
                    <button
                        onClick={handleVoiceCheckIn}
                        className="w-14 h-14 bg-yellow-400 dark:bg-yellow-500 rounded-full border-2 border-yellow-200 dark:border-yellow-600 shadow-[0_0_20px_rgba(250,204,21,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
                        title="Daily Pulse Check"
                    >
                        <Sparkles className="w-6 h-6 text-black group-hover:rotate-12 transition-transform" />
                    </button>
                </div>
            </div>

            <div className="fixed bottom-6 right-6 z-[80] pointer-events-none">
                <div className="pointer-events-auto">
                    <SoundscapePlayer />
                </div>
            </div>

            {/* BROADCAST BANNER */}
            {settings.dashboardBroadcastMessage && (
                <div className="bg-blue-600 text-white py-2 px-4 shadow-lg animate-in slide-in-from-top duration-500 relative z-50 overflow-hidden group">
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-[-20deg]"></div>
                    <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
                        <Megaphone className="w-4 h-4 text-white/80 animate-bounce" />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-center shadow-sm">{settings.dashboardBroadcastMessage}</span>
                    </div>
                </div>
            )}


            <div className="flex h-screen overflow-hidden">
                <aside className="hidden md:flex w-20 lg:w-64 flex-col border-r border-yellow-200/30 dark:border-gray-800/50 bg-[var(--color-bg-base)]/40 backdrop-blur-2xl transition-all duration-500 hover:w-24 lg:hover:w-72">
                    <div className="p-6 lg:p-8 flex items-center justify-center lg:justify-start gap-3">
                        <div className="w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg group hover:scale-110 transition-transform">
                            <Heart className="w-5 h-5 text-black fill-black" />
                        </div>
                        <span className="hidden lg:block text-xl font-black tracking-tight dark:text-white">Peutic</span>
                    </div>
                    <nav className="flex-1 px-3 lg:px-4 py-6 lg:py-8 space-y-2 lg:space-y-3">
                        {[
                            { id: 'inner_sanctuary', icon: LayoutDashboard, label: t('dash_hub') },
                            { id: 'history', icon: Clock, label: t('dash_journal') },
                            { id: 'settings', icon: Settings, label: t('dash_settings') }
                        ].map((item) => (
                            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 lg:p-4 rounded-xl transition-all duration-300 group ${activeTab === item.id ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg' : 'text-gray-500 hover:bg-yellow-100 dark:hover:bg-gray-800 dark:text-gray-400'}`}>
                                <item.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${activeTab === item.id ? 'text-yellow-400 dark:text-yellow-600' : 'group-hover:text-yellow-600 dark:group-hover:text-white'}`} />
                                <span className="hidden lg:block font-bold text-xs lg:text-sm tracking-wide">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                    <div className="p-4 lg:p-6 border-t border-transparent">
                        {/* Logout moved to header only */}
                    </div>
                </aside>
                <main className={`flex-1 overflow-y-auto relative scroll-smooth transition-all duration-1000 will-change-transform ${isIdle ? 'blur-2xl grayscale brightness-50 pointer-events-none' : ''}`}>
                    {isIdle && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
                            <div className="bg-white/20 backdrop-blur-md p-8 rounded-3xl border border-white/30 text-center shadow-2xl">
                                <ShieldCheck className="w-16 h-16 text-white mx-auto mb-4 animate-pulse" />
                                <h2 className="text-2xl font-black text-white mb-2">Privacy Shield Active</h2>
                                <p className="text-white/80 text-sm">Move your mouse to unlock.</p>
                            </div>
                        </div>
                    )}

                    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-10 pb-24">
                        <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center justify-between w-full md:w-auto">
                                <div className="flex items-center gap-4">
                                    <div className="hidden md:block">
                                        <NotificationBell
                                            notifications={notifications}
                                            onClear={handleClearNotification}
                                            onClearAll={handleClearAllNotifications}
                                            onAction={handleNotificationAction}
                                        />
                                    </div>
                                    <div className="md:hidden">
                                        {/* Mobile Notification Bell */}
                                        <NotificationBell
                                            notifications={notifications}
                                            onClear={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
                                            onClearAll={() => setNotifications(prev => prev.filter(n => !n.read))}
                                            onAction={handleNotificationAction}
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg md:text-xl font-black tracking-tight dark:text-white truncate max-w-[120px]">Peutic</span>
                                            <h1 className="hidden md:block text-2xl lg:text-3xl font-black tracking-tight dark:text-white leading-tight">
                                                {activeTab === 'inner_sanctuary' ? 'Sanctuary' : activeTab === 'history' ? t('sec_history') : t('dash_settings')}
                                            </h1>
                                        </div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none flex items-center gap-2 mt-1">
                                            <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <div className="flex-1 min-w-0">
                                                <InspirationQuote />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Desktop Title only */}
                                {/* Desktop Title Removed (Moved to Left) */}
                            </div>

                            <div className="flex items-center flex-wrap gap-2 md:gap-3">
                                <LanguageSelector currentLanguage={lang} onLanguageChange={setLang} />

                                {/* Desktop/Tablet Logout Button - next to globe */}
                                <button onClick={onLogout} className="hidden md:flex p-2.5 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-100 dark:border-red-900/50 shadow-sm hover:scale-105 transition-all" title="Logout">
                                    <LogOut className="w-5 h-5" />
                                </button>

                                <button onClick={() => setShowGrounding(true)} className="p-2.5 rounded-2xl bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-700 shadow-sm hover:scale-105 transition-all text-blue-500" title="Grounding Mode">
                                    <LifeBuoy className="w-5 h-5" />
                                </button>

                                <button onClick={toggleDarkMode} className="p-2.5 rounded-2xl bg-white dark:bg-gray-800 border border-yellow-100 dark:border-gray-700 shadow-sm hover:scale-105 transition-all">
                                    {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-400" />}
                                </button>

                                <button
                                    onClick={() => setShowPayment(true)}
                                    className={`h-[42px] px-4 rounded-2xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 text-[10px] md:text-xs border border-transparent ${balance === 0
                                        ? 'bg-red-500 text-white animate-pulse'
                                        : 'bg-emerald-500 text-white dark:bg-emerald-600'
                                        }`}
                                >
                                    <span className="md:inline">{balance}m</span>
                                    <Plus className="hidden md:block w-3.5 h-3.5 opacity-70" />
                                </button>

                                <button onClick={() => setShowProfile(true)} className="w-10 h-10 md:w-11 md:h-11 rounded-2xl overflow-hidden border-2 border-yellow-400 shadow-premium transition-all hover:rotate-3 active:scale-90 flex-shrink-0">
                                    <AvatarImage src={isGhostMode ? '' : (dashboardUser?.avatar || '')} alt={isGhostMode ? 'Member' : (dashboardUser?.name || 'User')} className="w-full h-full object-cover" isUser={true} />
                                </button>

                                {/* Mobile-only Logout Button */}
                                <button onClick={onLogout} className="md:hidden p-2.5 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-100 dark:border-red-900/50 shadow-sm hover:scale-105 transition-all">
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </header>
                        {activeTab === 'inner_sanctuary' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">

                                {/* THE PLAYGROUND (Collapsible 3-Column Tile Menu) */}
                                <div className="space-y-4">
                                    <button
                                        onClick={() => setIsVaultOpen(!isVaultOpen)}
                                        className="w-full flex items-center justify-between p-4 bg-transparent rounded-2xl border border-yellow-100/50 dark:border-gray-800/50 group transition-all shadow-none hover:bg-white/5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-yellow-100 dark:bg-gray-800 rounded-lg text-yellow-600 dark:text-yellow-500">
                                                <Zap className="w-5 h-5" />
                                            </div>
                                            <h2 className="text-sm font-black uppercase tracking-widest dark:text-white">The Hub</h2>
                                        </div>
                                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-500 ${isVaultOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isVaultOpen && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-500 space-y-4">
                                            {/* ROW 1: CORE TRIO */}
                                            <div className="grid grid-cols-3 gap-1 md:gap-4">
                                                {/* TILE 1: INNER GARDEN */}
                                                {garden && (
                                                    <div
                                                        onClick={() => setShowGardenFull(true)}
                                                        className="group relative bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-green-950 dark:via-black dark:to-emerald-950 rounded-xl md:rounded-3xl border border-green-400/30 dark:border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)] hover:shadow-[0_0_25px_rgba(34,197,94,0.4)] transition-all overflow-hidden flex flex-col h-[100px] md:h-[220px] cursor-pointer"
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 pointer-events-none"></div>
                                                        <div className="flex-1 p-2 md:p-6 relative flex flex-col items-center justify-center">
                                                            <div className="absolute inset-0 bg-green-400/10 md:bg-green-400/20 blur-2xl md:blur-3xl rounded-full scale-150 animate-pulse pointer-events-none"></div>
                                                            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pointer-events-none">
                                                                <div className="w-full h-24 md:h-32 mb-1 pointer-events-auto transition-transform group-hover:scale-105 duration-700">
                                                                    <GardenCanvas garden={garden} width={200} height={180} interactionType={isClipping ? 'clip' : null} />
                                                                </div>

                                                                {/* Overlay Controls */}
                                                                <div className="absolute top-2 right-2 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleClipPlant();
                                                                        }}
                                                                        className="p-2 bg-white/90 dark:bg-black/80 rounded-full shadow-lg hover:scale-110 active:scale-95 text-pink-500 transition-all"
                                                                        title="Clip for Inspiration"
                                                                    >
                                                                        <Scissors className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <h3 className="text-[7px] md:text-sm font-black text-green-700 dark:text-green-300 uppercase tracking-widest drop-shadow-sm text-center mt-[-10px] relative z-20">Zen Bonzai</h3>
                                                            <p className="hidden md:block text-[9px] font-bold text-green-600/70 dark:text-green-400/60 uppercase tracking-tighter">Lvl {garden.level} &bull; {garden.currentPlantType}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* TILE 2: BOOK OF YOU */}
                                                {(() => {
                                                    const joinedDate = new Date(dashboardUser?.joinedAt || new Date().toISOString());
                                                    const now = new Date();
                                                    const diffTime = Math.abs(now.getTime() - joinedDate.getTime());
                                                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                                    const isLocked = diffDays < 7;
                                                    const daysRemaining = 7 - diffDays;

                                                    return (
                                                        <div
                                                            onClick={() => {
                                                                if (!isLocked) {
                                                                    setShowBookFull(true);
                                                                } else {
                                                                    showToast(`Locked for ${daysRemaining} more days.`, "info");
                                                                }
                                                            }}
                                                            className="group relative bg-gradient-to-br from-fuchsia-50 via-purple-50 to-indigo-50 dark:from-purple-950 dark:via-black dark:to-indigo-950 rounded-xl md:rounded-3xl border border-purple-400/30 dark:border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all overflow-hidden cursor-pointer h-[100px] md:h-[220px]"
                                                        >
                                                            {/* Animated shimmer overlay */}
                                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_3s_infinite] pointer-events-none"></div>
                                                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-[0.15] pointer-events-none"></div>

                                                            <div className="flex flex-col items-center justify-center h-full p-2 md:p-6 text-center relative z-10">
                                                                <div className="relative mb-1 md:mb-4">
                                                                    {/* Pulsing glow ring */}
                                                                    <div className="absolute -inset-4 md:-inset-6 bg-purple-400/30 dark:bg-purple-500/20 blur-xl rounded-full animate-pulse"></div>
                                                                    <div className="absolute -inset-2 border border-purple-300/50 dark:border-purple-500/30 rounded-full animate-[spin_8s_linear_infinite]"></div>
                                                                    <div className="w-10 h-10 md:w-20 md:h-20 bg-gradient-to-br from-purple-600 to-indigo-700 border border-purple-400/50 rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] group-hover:scale-110 transition-transform">
                                                                        <BookOpen className="w-5 h-5 md:w-10 md:h-10" />
                                                                    </div>
                                                                    {isLocked && <div className="absolute -top-2 -right-2 bg-yellow-400 text-black p-1 rounded-lg shadow-lg"><Lock className="w-3 h-3" /></div>}
                                                                </div>
                                                                <h3 className="text-[7px] md:text-sm font-black text-purple-700 dark:text-purple-300 uppercase tracking-widest drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]">Book of You</h3>
                                                                <p className="hidden md:block text-[10px] font-bold text-purple-500/70 dark:text-purple-400/50 uppercase tracking-widest">
                                                                    {isLocked ? `Unlocked in ${daysRemaining}d` : 'Open Chronicle'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {/* TILE 3: ANIMA */}
                                                <div
                                                    onClick={() => setShowPocketPet(true)}
                                                    className="group relative bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 dark:from-cyan-950 dark:via-black dark:to-blue-950 rounded-xl md:rounded-3xl border border-cyan-400/30 dark:border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all overflow-hidden flex flex-col h-[100px] md:h-[220px] cursor-pointer"
                                                >
                                                    {/* Changed from mix-blend-multiply to simple transparency for better light mode visibility */}
                                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 pointer-events-none data-[mode=dark]:mix-blend-overlay"></div>
                                                    <div className="flex-1 p-2 md:p-6 relative flex flex-col items-center justify-center">
                                                        <div className="relative mb-1 md:mb-4">
                                                            <div className="absolute -inset-4 bg-cyan-500/20 blur-xl rounded-full animate-pulse"></div>
                                                            <div className="w-10 h-10 md:w-20 md:h-20 bg-white/10 dark:bg-black/40 border border-cyan-500/50 rounded-2xl flex items-center justify-center text-cyan-500 dark:text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)] group-hover:scale-110 transition-transform">
                                                                <Sparkles className="w-5 h-5 md:w-10 md:h-10 animate-bounce" />
                                                            </div>
                                                        </div>
                                                        {/* Text colors adjusted for better contrast in light mode */}
                                                        <h3 className="text-[7px] md:text-sm font-black text-cyan-700 dark:text-cyan-50 uppercase tracking-[0.2em] mb-1">Lumina</h3>
                                                        <p className="hidden md:block text-[10px] font-bold text-cyan-600/60 dark:text-cyan-400/50 uppercase tracking-widest">
                                                            {lumina ? `${lumina.name} Lvl ${lumina.level}` : 'Summon Friend'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ROW 2: OBSERVATORY & ZEN DOJO (2-Col Grid) */}
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* TILE 4: OBSERVATORY */}
                                                <div
                                                    onClick={() => handleRoomInteraction('observatory', 25)}
                                                    className={`group relative rounded-xl md:rounded-3xl border transition-all overflow-hidden flex flex-col h-[100px] md:h-[220px] cursor-pointer ${dashboardUser?.unlockedRooms?.includes('observatory')
                                                        ? 'bg-gradient-to-br from-indigo-900 to-black border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                                                        : 'bg-indigo-900/20 backdrop-blur-md border-dashed border-indigo-200/30 dark:border-gray-700/50 hover:bg-indigo-900/30'}`}
                                                >
                                                    <div className="flex-1 p-2 md:p-6 relative flex flex-col items-center justify-center text-center">
                                                        {dashboardUser?.unlockedRooms?.includes('observatory') ? (
                                                            <>
                                                                <div className="w-10 h-10 md:w-16 md:h-16 mb-2 rounded-full bg-indigo-950 flex items-center justify-center text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.5)] group-hover:scale-110 transition-transform"><Star className="w-5 h-5 md:w-8 md:h-8 fill-indigo-200" /></div>
                                                                <h3 className="text-[7px] md:text-xs font-black text-indigo-100 uppercase tracking-widest drop-shadow-lg">Observatory</h3>
                                                                <p className="hidden md:block text-[9px] text-indigo-300 mt-1">Track Dreams & Sleep</p>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="w-8 h-8 md:w-12 md:h-12 bg-black/20 rounded-full flex items-center justify-center mb-2"><Lock className="w-4 h-4 md:w-6 md:h-6 text-indigo-300" /></div>
                                                                <h3 className="text-[7px] md:text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-widest">Observatory</h3>
                                                                <div className="mt-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[8px] md:text-[10px] font-black px-3 py-1 rounded-full shadow-lg">25m</div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* ZEN DOJO */}
                                                <div
                                                    onClick={() => handleRoomInteraction('dojo', 15)}
                                                    className={`group relative rounded-xl md:rounded-3xl border transition-all overflow-hidden flex flex-col h-[100px] md:h-[220px] cursor-pointer ${dashboardUser?.unlockedRooms?.includes('dojo')
                                                        ? 'bg-gradient-to-br from-amber-900 to-stone-900 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                                                        : 'bg-amber-900/20 backdrop-blur-md border-dashed border-amber-200/30 dark:border-gray-700/50 hover:bg-amber-900/30'}`}
                                                >
                                                    <div className="flex-1 p-2 md:p-6 relative flex flex-col items-center justify-center text-center">
                                                        {dashboardUser?.unlockedRooms?.includes('dojo') ? (
                                                            <>
                                                                <div className="w-10 h-10 md:w-16 md:h-16 mb-2 rounded-full bg-stone-800 flex items-center justify-center text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] group-hover:scale-110 transition-transform"><Zap className="w-5 h-5 md:w-8 md:h-8 fill-amber-500" /></div>
                                                                <h3 className="text-[7px] md:text-xs font-black text-amber-100 uppercase tracking-widest drop-shadow-lg">Zen Dojo</h3>
                                                                <p className="hidden md:block text-[9px] text-amber-300 mt-1">Focus & Mastery</p>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="w-8 h-8 md:w-12 md:h-12 bg-black/20 rounded-full flex items-center justify-center mb-2"><Lock className="w-4 h-4 md:w-6 md:h-6 text-amber-700 dark:text-amber-500" /></div>
                                                                <h3 className="text-[7px] md:text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-widest">Zen Dojo</h3>
                                                                <div className="mt-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[8px] md:text-[10px] font-black px-3 py-1 rounded-full shadow-lg">15m</div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                                    {dashboardUser ? (
                                        <div className="bg-transparent dark:bg-transparent p-4 md:p-5 rounded-3xl border border-transparent shadow-none col-span-1 md:col-span-2 relative overflow-hidden group min-h-[120px] md:min-h-[140px]">
                                            {weeklyGoal >= weeklyTarget ? (<div className="absolute top-0 right-0 p-3 z-20"><div className="relative flex items-center justify-center"><div className="absolute w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div><div className="absolute w-10 h-10 bg-blue-500/30 rounded-full blur-xl animate-pulse"></div><div className="absolute w-full h-full bg-blue-400/10 rounded-full animate-ping"></div><div className="absolute w-6 h-6 bg-blue-400/50 rounded-full blur-lg animate-pulse"></div><Flame className="w-8 h-8 text-blue-500 fill-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,1)] animate-bounce relative z-10" /></div></div>) : (<div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Trophy className="w-20 h-20" style={{ color: 'var(--color-primary)' }} /></div>)}
                                            <div className="relative z-10"><h3 className="font-bold text-gray-500 dark:text-gray-400 text-[10px] md:text-xs uppercase tracking-widest mb-1">Weekly Wellness Goal</h3><div className="flex items-end gap-2 mb-2 md:mb-3"><span className="text-2xl md:text-4xl font-black" style={{ color: 'var(--color-primary)' }}>{weeklyGoal}</span><span className="text-gray-400 text-[10px] md:text-sm font-bold mb-1">/ {weeklyTarget} activities</span></div><div className="w-full h-2 md:h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2 md:mb-3"><div className={`h-full rounded-full transition-all duration-1000 ease-out ${weeklyGoal >= weeklyTarget ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse' : ''}`} style={{ width: `${Math.min(100, (weeklyGoal / weeklyTarget) * 100)}%`, backgroundColor: weeklyGoal >= weeklyTarget ? undefined : 'var(--color-primary)' }}></div></div><p className="text-[10px] md:text-sm font-bold text-gray-700 dark:text-gray-300">{weeklyGoal >= weeklyTarget ? "🔥 You are on a hot streak!" : weeklyMessage}</p></div>
                                        </div>
                                    ) : <StatSkeleton />}
                                    <MoodTracker onMoodSelect={handleMoodSelect} />
                                </div>

                                <CollapsibleSection title="Arcade" icon={Gamepad2}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                                        <div className="relative w-full h-[320px] md:h-[300px] xl:h-[360px] rounded-3xl overflow-hidden border border-white/20 dark:border-gray-700 shadow-sm flex flex-col bg-transparent">
                                            <div className="absolute top-3 left-0 right-0 text-center z-10 pointer-events-none">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 bg-white/90 dark:bg-black/90 px-3 py-1.5 rounded-full shadow-sm">Mindful Match</span>
                                            </div>
                                            <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs font-bold text-gray-400 animate-pulse">Initializing Neural Match...</div>}>
                                                <MindfulMatchGame dashboardUser={dashboardUser} />
                                            </Suspense>
                                        </div>
                                        <div className="relative w-full h-[320px] md:h-[300px] xl:h-[360px] rounded-3xl overflow-hidden border border-white/20 dark:border-gray-700 shadow-sm flex flex-col bg-transparent">
                                            <div className="absolute top-3 left-0 right-0 text-center z-10 pointer-events-none">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 bg-white/90 dark:bg-black/90 px-3 py-1.5 rounded-full shadow-sm">Cloud Hop</span>
                                            </div>
                                            <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs font-bold text-gray-400 animate-pulse">Launching Cloud Engine...</div>}>
                                                <CloudHopGame dashboardUser={dashboardUser} />
                                            </Suspense>
                                        </div>
                                    </div>
                                </CollapsibleSection>
                                <CollapsibleSection title={t('dash_hub')} icon={Feather}><div className="space-y-6"><JournalSection user={user} /><div className="border-t border-dashed border-yellow-200 dark:border-gray-700" /><WisdomGenerator userId={user.id} /></div></CollapsibleSection>
                                <div>
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-5"><div><h2 className="text-xl md:text-2xl font-black dark:text-yellow-400">{t('sec_specialists')}</h2><p className="text-gray-500 text-xs md:text-sm">{t('roster_heading')}</p></div><div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide"><button onClick={() => setSpecialtyFilter('All')} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${specialtyFilter === 'All' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>All</button>{uniqueSpecialties.map(spec => (<button key={spec} onClick={() => setSpecialtyFilter(spec)} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${specialtyFilter === spec ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{spec}</button>))}</div></div>
                                    {loadingCompanions ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                            {[1, 2, 3, 4, 5].map(i => <CompanionSkeleton key={i} />)}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                                            {filteredCompanions.map((companion) => (
                                                <div key={companion.id} onClick={() => handleStartConnection(companion)} className="group relative bg-white dark:bg-gray-900 rounded-[1.8rem] overflow-hidden border border-yellow-100 dark:border-gray-800 hover:border-yellow-400 dark:hover:border-yellow-600 transition-all duration-300 hover:shadow-2xl cursor-pointer flex flex-col h-full">
                                                    <div className="aspect-[4/5] relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                        <AvatarImage src={companion.imageUrl} alt={companion.name} className="w-full h-full object-cover group-hover:scale-110 group-hover:animate-breathing transition-transform duration-700" />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>


                                                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-5 flex flex-col justify-center text-center">
                                                            <p className="text-yellow-400 text-[10px] font-black uppercase tracking-widest mb-2">About {companion.name}</p>
                                                            <p className="text-white text-xs leading-relaxed mb-3">"{companion.bio}"</p>
                                                            <div className="grid grid-cols-2 gap-2 text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-3"><div className="bg-white/10 p-1.5 rounded-lg">{companion.yearsExperience} Yrs Exp</div><div className="bg-white/10 p-1.5 rounded-lg">{companion.degree}</div></div>
                                                            <button className="bg-white text-black px-4 py-2 rounded-full font-bold text-[10px] flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors"><Video className="w-3 h-3" /> Connect Now</button>
                                                        </div>
                                                        <div className="absolute top-3 left-3 flex gap-2"><div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md ${companion.status === 'AVAILABLE' ? 'bg-green-500/90 text-white shadow-lg shadow-green-500/20' : 'bg-gray-500/90 text-white'}`}>{companion.status === 'AVAILABLE' ? 'Online' : 'Busy'}</div></div><div className="absolute bottom-3 left-3 right-3 group-hover:opacity-0 transition-opacity"><h3 className="text-white font-black text-lg leading-tight mb-0.5 shadow-sm drop-shadow-md">{companion.name}</h3><p className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider truncate">{companion.specialty}</p></div></div><div className="p-3 bg-white dark:bg-gray-900 flex justify-between items-center border-t border-gray-100 dark:border-gray-800"><div className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /><span className="text-gray-500 dark:text-gray-400 text-xs font-bold">{companion.rating}</span></div><button className="bg-gray-100 dark:bg-gray-800 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black rounded-lg p-2 transition-colors"><Eye className="w-3.5 h-3.5" /></button></div></div>))}</div>)}
                                    {filteredCompanions.length === 0 && (<div className="text-center py-16 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800"><p className="text-gray-500 font-bold text-sm">No specialists found in this category.</p><button onClick={() => setSpecialtyFilter('All')} className="text-yellow-600 text-xs font-bold mt-2 hover:underline">View All</button></div>)}
                                </div>
                            </div>
                        )}
                        {activeTab === 'history' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-500">
                                <div className="bg-white/70 dark:bg-gray-900/40 rounded-3xl border border-yellow-100/50 dark:border-gray-800/50 overflow-hidden backdrop-blur-md shadow-xl hover:shadow-2xl transition-shadow duration-500">
                                    <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                        <h3 className="font-black text-lg dark:text-yellow-400">{t('sec_history')}</h3>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Financials & Check-ins</span>
                                    </div>
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider"><tr><th className="p-4 md:p-5">Date</th><th className="p-4 md:p-5">Description</th><th className="p-4 md:p-5 text-right">Amount</th><th className="p-4 md:p-5 text-right">Status</th></tr></thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {transactions.length === 0 ? (<tr><td colSpan={4} className="p-8 text-center text-gray-400 text-sm italic">No records found.</td></tr>) : (transactions.map((tx) => (<tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"><td className="p-4 md:p-5 text-sm dark:text-gray-300 font-mono">{new Date(tx.date).toLocaleDateString()}</td><td className="p-4 md:p-5 text-sm font-bold dark:text-white">{tx.description}</td><td className={`p-4 md:p-5 text-sm text-right font-mono font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount}m</td><td className="p-4 md:p-5 text-right"><span className="px-2 py-1 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase tracking-wide">{tx.status}</span></td></tr>)))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="bg-white/70 dark:bg-gray-900/40 rounded-3xl border border-yellow-100/50 dark:border-gray-800/50 overflow-hidden backdrop-blur-md shadow-xl hover:shadow-2xl transition-shadow duration-500">
                                    <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-xl text-red-600 dark:text-red-400"><Mic className="w-5 h-5" /></div>
                                            <div>
                                                <h3 className="font-black text-lg dark:text-yellow-400 leading-tight">Voice Chronicles</h3>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Your spoken journey</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        {voiceEntries.length === 0 ? (
                                            <div className="py-12 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                                                <p className="text-gray-400 text-sm italic">You haven't left any voice notes yet.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                                {voiceEntries.map(entry => (
                                                    <div key={entry.id} className="p-4 border border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-800/50">
                                                        <VoiceEntryItem
                                                            entry={entry}
                                                            onDelete={async (id) => {
                                                                await UserService.deleteVoiceJournal(id);
                                                                setVoiceEntries(prev => prev.filter(e => e.id !== id));
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'settings' && (
                            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-5 duration-500">
                                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-yellow-200 dark:border-gray-800 overflow-hidden shadow-sm">
                                    <div className="p-5 md:p-6 border-b border-yellow-100 dark:border-gray-800"><h3 className="font-black text-lg md:text-xl dark:text-yellow-400 mb-1">{t('dash_settings')}</h3><p className="text-gray-500 text-xs">Manage your personal information.</p></div>
                                    <div className="p-5 md:p-6 space-y-5">
                                        <div className="flex items-center gap-5"><div className="relative"><div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-4 border-yellow-100 dark:border-gray-800"><AvatarImage src={dashboardUser?.avatar || ''} alt="Profile" className="w-full h-full object-cover" isUser={true} /></div><button onClick={() => setShowProfile(true)} className="absolute bottom-0 right-0 p-1.5 bg-black text-white rounded-full hover:bg-gray-800 transition-colors shadow-lg"><Edit2 className="w-3 h-3" /></button></div><div className="flex-1 space-y-3"><div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Display Name</label><div className="relative"><UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-yellow-500 outline-none transition-colors text-sm font-bold dark:text-white" /></div></div><div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Email Address</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-yellow-500 outline-none transition-colors text-sm font-bold dark:text-white" /></div></div></div></div>
                                        <div className="flex justify-end pt-2"><button onClick={saveProfileChanges} disabled={isSavingProfile} className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold text-xs hover:opacity-80 transition-opacity flex items-center gap-2">{isSavingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}{t('ui_save')}</button></div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-yellow-200 dark:border-gray-800 overflow-hidden shadow-sm">
                                    <div className="p-5 md:p-6 border-b border-yellow-100 dark:border-gray-800"><h3 className="font-black text-lg md:text-xl dark:text-yellow-400 mb-1">Preferences</h3><p className="text-gray-500 text-xs">Customize your sanctuary experience.</p></div>
                                    <div className="p-5 md:p-6 space-y-5">
                                        <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"><Moon className="w-4 h-4 text-gray-600 dark:text-gray-400" /></div><div><p className="font-bold text-gray-900 dark:text-white text-sm">Dark Mode</p><p className="text-[10px] text-gray-500">Reduce eye strain.</p></div></div><button onClick={toggleDarkMode} className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${isDark ? 'bg-yellow-500' : 'bg-gray-200'}`}><span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-5' : 'translate-x-1'}`} /></button></div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"><EyeOff className="w-4 h-4 text-red-500" /></div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm">Ghost Mode</p>
                                                    <p className="text-[10px] text-gray-500">Hide name and photo for public browsing.</p>
                                                </div>
                                            </div>
                                            <button onClick={toggleGhostMode} className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${isGhostMode ? 'bg-red-500' : 'bg-gray-200'}`}>
                                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isGhostMode ? 'translate-x-5' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"><Zap className="w-4 h-4 text-purple-500" /></div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm">Gamification Mode</p>
                                                    <p className="text-[10px] text-gray-500">Enable points, XP, and streaks.</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newVal = !dashboardUser?.gamificationEnabled;
                                                    const updated = { ...dashboardUser, gamificationEnabled: newVal } as User;
                                                    setDashboardUser(updated);
                                                    UserService.updateUser(updated);
                                                    showToast(`Gamification ${newVal ? 'Enabled' : 'Disabled'}`, 'success');
                                                }}
                                                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${(dashboardUser?.gamificationEnabled !== false) ? 'bg-purple-500' : 'bg-gray-200'}`}
                                            >
                                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${(dashboardUser?.gamificationEnabled !== false) ? 'translate-x-5' : 'translate-x-1'}`} />
                                            </button>
                                        </div>

                                        {/* THEME SELECTOR */}
                                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                            <p className="font-bold text-gray-900 dark:text-white text-sm mb-3">App Theme</p>
                                            <div className="grid grid-cols-5 gap-3">
                                                {[
                                                    { id: 'default', color: '#FACC15', label: 'Gold' },
                                                    { id: 'rose', color: '#FB7185', label: 'Rose' },
                                                    { id: 'ocean', color: '#38bdf8', label: 'Ocean' },
                                                    { id: 'forest', color: '#10B981', label: 'Forest' },
                                                    { id: 'sunset', color: '#F97316', label: 'Sunset' },
                                                    { id: 'lavender', color: '#A78BFA', label: 'Lavender' },
                                                    { id: 'cyberpunk', color: '#06b6d4', label: 'Neon' },
                                                    { id: 'midnight', color: '#4F46E5', label: 'Night' },
                                                    { id: 'coffee', color: '#854d0e', label: 'Coffee' },
                                                    { id: 'royal', color: '#9333ea', label: 'Royal' }
                                                ].map((t) => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setTheme(t.id as any)}
                                                        className={`flex flex-col items-center gap-1 group ${theme === t.id ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                                                    >
                                                        <div
                                                            className={`w-8 h-8 rounded-full border-2 transition-all ${theme === t.id ? 'scale-110 border-black dark:border-white shadow-lg' : 'border-transparent'}`}
                                                            style={{ backgroundColor: t.color }}
                                                        ></div>
                                                        <span className="text-[9px] font-bold uppercase text-gray-500">{t.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                                <div className="bg-white/70 dark:bg-gray-900/40 rounded-3xl border border-yellow-200/50 dark:border-gray-800/50 overflow-hidden backdrop-blur-md shadow-sm">
                                    <div className="p-5 md:p-6 border-b border-yellow-100/30 dark:border-gray-800/50"><h3 className="font-black text-lg md:text-xl dark:text-yellow-400 mb-1">Security Health</h3><p className="text-gray-500 text-xs text-green-500 flex items-center gap-1 font-bold animate-pulse"><ShieldCheck className="w-3 h-3" /> All systems secured & encrypted</p></div>
                                    <div className="p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            { label: 'TLS Encryption', status: 'Active (256-bit)', icon: Lock },
                                            { label: 'Data Isolation', status: 'Bank-Grade RLS', icon: ShieldCheck },
                                            { label: 'Identity Protection', status: 'JWT Secure', icon: UserIcon },
                                            { label: 'Privacy Shield', status: 'Active (5m Idle)', icon: EyeOff }
                                        ].map((item, i) => (
                                            <div key={i} className="p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-gray-100/50 dark:border-gray-700/50 flex items-center gap-3">
                                                <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                                                    <item.icon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">{item.label}</p>
                                                    <p className="text-xs font-bold dark:text-gray-200">{item.status}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-red-50 dark:bg-red-950/20 rounded-3xl border border-red-100 dark:border-red-900 overflow-hidden shadow-sm">
                                    <div className="p-5 md:p-6 border-b border-red-100 dark:border-red-900"><h3 className="font-black text-lg md:text-xl text-red-900 dark:text-red-400 mb-1">Danger Zone</h3><p className="text-red-600/70 dark:text-red-400/60 text-xs">Permanent actions for your data.</p></div>
                                    <div className="p-5 md:p-6">
                                        {showDeleteConfirm ? (
                                            <div className="bg-white dark:bg-black p-5 rounded-2xl border border-red-200 dark:border-red-900 text-center animate-in zoom-in duration-200">
                                                <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                                                <h4 className="font-bold text-base mb-1 dark:text-yellow-400">Are you absolutely sure?</h4>
                                                <p className="text-gray-500 text-xs mb-4">This action cannot be undone. This will permanently delete your account, journal entries, and remaining balance.</p>

                                                {balance > 0 && (
                                                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-5 text-left flex items-start gap-3">
                                                        <div className="bg-red-500/20 p-2 rounded-lg">
                                                            <Plus className="w-4 h-4 text-red-500 rotate-45" />
                                                        </div>
                                                        <div>
                                                            <p className="text-red-900 dark:text-red-400 text-xs font-black uppercase tracking-widest mb-1">Impact Warning</p>
                                                            <p className="text-red-700/80 dark:text-red-400/70 text-[11px] font-bold leading-relaxed">You have <span className="text-red-600 dark:text-red-400 font-black">{balance} minutes</span> remaining. Deleting your account will forfeit these credits immediately without refund.</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex gap-3 justify-center">
                                                    <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeletingAccount} className="px-5 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-bold text-xs hover:bg-gray-200 disabled:opacity-50">{t('ui_cancel')}</button>
                                                    <button onClick={handleDeleteAccount} disabled={isDeletingAccount} className="px-5 py-2 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-700 shadow-lg flex items-center gap-2">
                                                        {isDeletingAccount ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Yes, Delete Everything'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-red-900 dark:text-red-400 text-sm">Delete Account</p>
                                                    <p className="text-[10px] text-red-700/60 dark:text-red-400/50">Remove all data and access.</p>
                                                </div>
                                                <button onClick={() => setShowDeleteConfirm(true)} className="px-5 py-2.5 bg-white dark:bg-transparent border border-red-200 dark:border-red-800 text-red-600 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Delete Account</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-8 mb-4 max-w-4xl mx-auto px-4"><div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 p-3 rounded-xl text-center"><p className="text-[9px] md:text-[10px] font-bold text-yellow-800 dark:text-yellow-500 uppercase tracking-wide leading-relaxed">Note: Specialist availability is subject to change frequently due to high demand. If your selected specialist is unavailable, a specialist of equal or greater qualifications will be automatically substituted to ensure immediate support.</p></div></div>
                    <footer className="bg-[#FFFBEB] dark:bg-[#0A0A0A] text-black dark:text-white py-10 md:py-12 px-6 border-t border-yellow-200 dark:border-gray-800 transition-colors">
                        <div className="max-w-7xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-8 md:mb-10">
                                <div className="md:col-span-5 space-y-4"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-yellow-400 rounded-xl flex items-center justify-center"><Heart className="w-4 h-4 fill-black text-black" /></div><span className="text-xl font-black tracking-tight">Peutic</span></div><p className="text-gray-800 dark:text-gray-500 text-xs leading-relaxed max-w-md">Connecting the disconnected through elite-level human specialists and cutting-edge secure technology.</p><div className="flex gap-4">{[Twitter, Instagram, Linkedin].map((Icon, i) => (<button key={i} className="text-gray-800 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors hover:scale-110 transform"><Icon className="w-4 h-4" /></button>))}</div></div>
                                <div className="grid grid-cols-2 md:grid-cols-1 gap-6 md:col-span-2"><div><h4 className="font-black mb-3 text-[9px] uppercase tracking-[0.3em] text-gray-700 dark:text-gray-400">Global</h4><ul className="space-y-2 text-xs font-bold text-gray-800 dark:text-gray-500"><li><Link to="/about" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors">About</Link></li><li><Link to="/press" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors">Media</Link></li></ul></div></div>
                                <div className="grid grid-cols-2 md:grid-cols-1 gap-6 md:col-span-2"><div><h4 className="font-black mb-3 text-[9px] uppercase tracking-[0.3em] text-gray-700 dark:text-gray-400">Support</h4><ul className="space-y-2 text-xs font-bold text-gray-800 dark:text-gray-500"><li><Link to="/support" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors">Help Center</Link></li><li><Link to="/safety" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors">Safety Standards</Link></li><li><Link to="/crisis" className="text-red-600 hover:text-red-700 transition-colors">Crisis Hub</Link></li></ul></div></div>
                                <div className="md:col-span-3"><h4 className="font-black mb-3 text-[9px] uppercase tracking-[0.3em] text-gray-700 dark:text-gray-400">Regulatory</h4><ul className="space-y-2 text-xs font-bold text-gray-800 dark:text-gray-500"><li><Link to="/privacy" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors">Privacy Policy</Link></li><li><Link to="/terms" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors">Terms of Service</Link></li></ul></div>

                            </div>
                            <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-yellow-100 dark:border-yellow-900/20">
                                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-500 font-bold text-xs">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Not a Medical Service. For entertainment & companionship only.</span>
                                </div>
                                <Link to="/crisis" className="bg-red-100 text-red-600 hover:bg-red-200 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-colors">
                                    In Crisis?
                                </Link>
                            </div>
                            <div className="pt-6 flex flex-col md:flex-row justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-gray-700 dark:text-gray-600 gap-3 md:gap-0 border-t border-yellow-200/50 dark:border-gray-800">
                                <p>&copy; {new Date().getFullYear()} Peutic Inc. | ISO 27001 Certified</p>
                                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div><span>Network Optimal</span></div>
                            </div>
                        </div>
                    </footer>
                </main >
            </div >
            {showPayment && (
                <Suspense fallback={<div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center text-white font-bold">Secure Payment node...</div>}>
                    <PaymentModal onClose={() => { setShowPayment(false); setPaymentError(undefined); }} onSuccess={handlePaymentSuccess} initialError={paymentError} />
                </Suspense>
            )}
            {showBreathing && <EmergencyOverlay userId={user.id} onClose={() => { setShowBreathing(false); refreshGarden(); }} />}
            {
                showProfile && (
                    <Suspense fallback={<div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center text-white font-bold">Identity Node...</div>}>
                        <ProfileModal user={dashboardUser} onClose={() => setShowProfile(false)} onUpdate={refreshData} />
                    </Suspense>
                )
            }
            {showGrounding && <GroundingMode onClose={() => setShowGrounding(false)} />}
            {showTechCheck && (<TechCheck onConfirm={confirmSession} onCancel={() => setShowTechCheck(false)} />)}

            {/* MOOD PULSE ALERT */}
            {/* MOOD PULSE ALERT (Removed Banner, Logic Kept for Floating Button) */}
            {
                moodRiskAlert && (
                    // Hidden banner logic - now relying on user initiative or smaller cues
                    <></>
                )
            }



            {/* VOICE JOURNAL MODAL */}
            {
                showVoiceJournal && (
                    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black flex items-center gap-2 dark:text-yellow-400"><Mic className="w-5 h-5 text-red-500" /> Voice Journal</h2>
                                <button onClick={() => setShowVoiceJournal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X className="w-5 h-5" /></button>
                            </div>

                            <VoiceRecorder userId={user.id} onSave={handleVoiceSave} />

                            <div className="mt-8">
                                <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">Recent Voice Notes</h3>
                                <div className="space-y-3">
                                    {voiceEntries.length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">No recordings yet.</p>}
                                    {voiceEntries.map(entry => (
                                        <VoiceEntryItem
                                            key={entry.id}
                                            entry={entry}
                                            onDelete={async (id) => {
                                                await UserService.deleteVoiceJournal(id);
                                                setVoiceEntries(prev => prev.filter(e => e.id !== id));
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                showBookFull && dashboardUser && (
                    <Suspense fallback={<div className="fixed inset-0 z-[120] bg-black flex items-center justify-center text-white font-black uppercase tracking-widest">Opening the Book...</div>}>
                        <BookOfYouView user={dashboardUser} garden={garden} onClose={() => setShowBookFull(false)} />
                    </Suspense>
                )
            }
            {
                showGardenFull && garden && (
                    <Suspense fallback={<div className="fixed inset-0 z-[120] bg-black flex items-center justify-center text-white font-black uppercase tracking-widest">Entering the Garden...</div>}>
                        <GardenFullView garden={garden} user={dashboardUser!} onClose={() => setShowGardenFull(false)} onUpdate={refreshGarden} />
                    </Suspense>
                )
            }
            {
                showPocketPet && dashboardUser && (
                    <Suspense fallback={<div className="fixed inset-0 z-[120] bg-black flex items-center justify-center text-white font-black uppercase tracking-widest">Bridging Digital Reality...</div>}>
                        <LuminaView user={dashboardUser} onClose={() => { setShowPocketPet(false); refreshPet(); }} />
                    </Suspense>
                )
            }
            {
                showObservatory && (
                    <Suspense fallback={null}>
                        <ObservatoryView user={dashboardUser} onClose={() => setShowObservatory(false)} />
                    </Suspense>
                )
            }
            {
                showDojo && (
                    <Suspense fallback={null}>
                        <DojoView user={dashboardUser} onClose={() => setShowDojo(false)} />
                    </Suspense>
                )
            }
        </div >
    );
};

export default Dashboard;