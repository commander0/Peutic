import React, { useState, useEffect, useRef, lazy, Suspense, useTransition } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useDashboardUI } from '../hooks/useDashboardUI';
import { useGamification } from '../hooks/useGamification';
import { useDashboardState } from '../hooks/useDashboardState';
import { Link, useNavigate } from 'react-router-dom';
import { User, Companion, VoiceJournalEntry, Achievement } from '../types';
import { LanguageSelector } from './common/LanguageSelector';
import { useLanguage } from './common/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import {
    Clock, LayoutDashboard, Brain, BookOpen, User as UserIcon, Settings, Plus, Lock, Sun, Moon, Sparkles, Star, Mic, Heart, ShieldCheck, Leaf, LogOut, LifeBuoy, ChevronUp, ChevronDown, Megaphone, Zap, Scissors, Gamepad2, Cloud, Feather, AlertTriangle, Video, Eye, EyeOff, Edit2, Mail, RefreshCw, Save, Twitter, Instagram, Linkedin, X, Flame, Trophy, ShoppingBag
} from 'lucide-react';
import { NotificationBell } from './common/NotificationBell';
import { UserService } from '../services/userService';
// import PetCanvas from './pocket/PetCanvas';
import { useToast } from './common/Toast';
import { CompanionSkeleton, StatSkeleton } from './common/SkeletonLoader';
import { InspirationQuote } from './common/InspirationQuote';
import { GlobalErrorBoundary } from './common/GlobalErrorBoundary';

import { NameValidator } from '../services/nameValidator';
import { generateDailyInsight } from '../services/geminiService';

import TechCheck from './TechCheck';
import GroundingMode from './GroundingMode';
import { GardenService } from '../services/gardenService';
import { ClinicalSafetyScanner } from '../services/clinicalSafetyScanner';

// Extracted Components
import { JournalSection } from './dashboard/JournalSection';
import { WisdomGenerator } from './dashboard/WisdomGenerator';

import { MoodTracker } from './dashboard/MoodTracker';
import { SoundscapePlayer } from './dashboard/SoundscapePlayer';
import { WeatherEffect } from './dashboard/WeatherEffect';

// LAZY LOAD HEAVY COMPONENTS

const MindfulMatchGame = lazy(() => import('./MindfulMatchGame').catch(() => ({ default: () => <div className="p-10 text-center text-gray-400">Loading Game Engine...</div> })));
const CloudHopGame = lazy(() => import('./CloudHopGame').catch(() => ({ default: () => <div className="p-10 text-center text-gray-400">Loading Cloud Engine...</div> })));
const StressSlicerGame = lazy(() => import('./arcade/StressSlicerGame').catch(() => ({ default: () => <div className="p-10 text-center text-gray-400">Loading Slicer Engine...</div> })));
const PaymentModal = lazy(() => import('./PaymentModal').catch(() => ({ default: () => <div className="p-10 text-center text-gray-400">Loading Payment Secure Node...</div> })));
const ProfileModal = lazy(() => import('./ProfileModal').catch(() => ({ default: () => <div className="p-10 text-center text-gray-400">Loading Profile Experience...</div> })));
const GardenFullView = lazy(() => import('./garden/GardenFullView'));
const BookOfYouView = lazy(() => import('./retention/BookOfYouView'));
const LuminaView = lazy(() => import('./pocket/LuminaView'));
const ObservatoryView = lazy(() => import('./sanctuary/ObservatoryView'));
const DojoView = lazy(() => import('./sanctuary/DojoView'));
const ThoughtShredder = lazy(() => import('./tools/ThoughtShredder'));

import { SupportCircles } from './community/SupportCircles';
import WorldPulse from './community/WorldPulse';
import AgenticRouterModal from './safety/AgenticRouterModal';
import SerenityShop from './shop/SerenityShop';

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
    onStartSession: (companion: Companion, mode?: 'video' | 'voice') => void;
}

const AvatarImage = React.memo(({ src, alt, className, isUser = false }: { src?: string, alt?: string, className?: string, isUser?: boolean }) => {
    const [imgError, setImgError] = useState(false);
    return (
        <div className={`relative ${className || ''} overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
            {src && !imgError ? (
                <img
                    src={src}
                    alt={alt || 'Avatar'}
                    className={`w-full h-full object-cover ${src?.includes('dicebear') ? 'bg-yellow-200 dark:bg-yellow-900/50' : ''}`}
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
    const [, startTransition] = useTransition();

    const handleToggle = () => {
        startTransition(() => {
            setIsOpen(prev => !prev);
        });
    };

    return (
        <div className="bg-transparent rounded-3xl border border-[var(--color-primary-border)] overflow-hidden transition-all duration-300" style={{ borderColor: 'var(--color-primary-border)' }}>
            <button onClick={handleToggle} className="w-full p-4 lg:p-6 flex items-center justify-between hover:bg-[var(--color-primary)]/10 transition-colors group">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-black/5 text-primary dark:bg-white/10 group-hover:bg-black/10 dark:group-hover:bg-white/20 transition-colors">
                        <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-base dark:text-gray-200">{title}</span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-gray-400" /> : <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />}
            </button>
            {/* Provide feedback during transition if needed, or just allow Suspense to handle it */}
            <div className={`transition-[grid-template-rows] duration-300 grid ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <div className="p-4 lg:p-6 pt-0 bg-transparent">
                        {isOpen && children}
                    </div>
                </div>
            </div>
        </div>
    );
});
CollapsibleSection.displayName = 'CollapsibleSection';

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onStartSession }) => {
    const { lang, setLang, t } = useLanguage();
    const { theme, mode, setTheme, toggleMode } = useTheme();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'inner_sanctuary' | 'history' | 'settings'>('inner_sanctuary');

    // STRICT ADMIN REDIRECT
    useEffect(() => {
        if (user && user.role === 'ADMIN') {
            navigate('/admin/dashboard', { replace: true });
        }
    }, [user, navigate]);

    // Derived boolean for simple UI toggles
    const isDark = mode === 'dark';

    // Achievements Listener
    const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
    const prevAchievementsRef = useRef<string[]>([]);
    // deleted unused ref

    useEffect(() => {
        UserService.getAchievements().then(setAllAchievements);
    }, []);

    useEffect(() => {
        if (user?.unlockedAchievements) {
            const currentIds = user.unlockedAchievements;
            const prevIds = prevAchievementsRef.current;

            // Find new unlocks
            const newUnlocks = currentIds.filter(id => !prevIds.includes(id));

            if (newUnlocks.length > 0 && prevIds.length > 0) { // Skip on initial load
                newUnlocks.forEach(id => {
                    const ach = allAchievements.find(a => a.id === id);
                    const title = ach?.title || id;

                    const sound = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
                    sound.volume = 0.5;
                    sound.play().catch(() => { });

                    showToast(`Achievement Unlocked: ${title}`, "success");

                    addNotification({
                        id: Date.now().toString(),
                        title: "New Achievement!",
                        message: `You unlocked: ${title}`,
                        type: 'success',
                        read: false,
                        timestamp: new Date()
                    });
                });
            }
            prevAchievementsRef.current = currentIds;
        }
    }, [user?.unlockedAchievements, allAchievements]);



    const {
        dashboardUser, setDashboardUser,
        balance,
        transactions, companions, loadingCompanions,
        weeklyGoal, weeklyMessage, settings, refreshData
    } = useDashboardState(user);

    const [hasClippedInnerGarden, setHasClippedInnerGarden] = useState(false);
    const idleTimerRef = useRef<number | null>(null);
    const logoutTimerRef = useRef<number | null>(null);
    const weeklyTarget = 100;

    const {
        showPayment, setShowPayment,
        paymentError, setPaymentError,
        showBreathing, setShowBreathing,
        showProfile, setShowProfile,
        showGrounding, setShowGrounding,
        showDeleteConfirm, setShowDeleteConfirm,
        mood, setMood,
        editName, setEditName,
        editEmail, setEditEmail,
        isSavingProfile, setIsSavingProfile,
        isIdle, setIsIdle,
        showTechCheck, setShowTechCheck,
        isGhostMode, setIsGhostMode,
        isDeletingAccount, setIsDeletingAccount,
        showBookFull, setShowBookFull,
        showGardenFull, setShowGardenFull,
        showPocketPet, setShowPocketPet,
        showObservatory, setShowObservatory,
        showDojo, setShowDojo,
        showShredder, setShowShredder,
        showMatchGame, setShowMatchGame,
        showCloudHop, setShowCloudHop,
        showSlicerGame, setShowSlicerGame,
        isUnlockingRoom, setIsUnlockingRoom,
        showVoiceJournal, setShowVoiceJournal,
        showSupportCircles, setShowSupportCircles,
        showWorldPulse, setShowWorldPulse,
        showAgenticRouter, setShowAgenticRouter,
        showSerenityShop, setShowSerenityShop,
        agentMessage, setAgentMessage
    } = useDashboardUI(user);

    // Gamification Hook
    const { garden, lumina, refreshGarden, handleClipPlant, refreshPet } = useGamification(user);

    // Notifications Hook
    const { notifications, addNotification, handleClearNotification, handleClearAllNotifications } = useNotifications(user);

    const handleNotificationAction = (action: string) => {
        switch (action) {
            case 'open_pet': setShowPocketPet(true); break;
            case 'open_garden': setShowGardenFull(true); break;
            case 'check_streak': setShowBookFull(true); break;
            case 'open_community': setShowSupportCircles(true); break;
            case 'open_dojo': setShowDojo(true); break;
            case 'open_observatory': setShowObservatory(true); break;
            case 'open_shredder': setShowShredder(true); break;
            case 'open_games': setShowMatchGame(true); break;
        }
    };

    useEffect(() => {
        generateDailyInsight(user.name, user.id);
    }, [user.id, user.name]);

    // Agentic Workflow: Proactive Empathy Check (Updated for V4 Modal)
    useEffect(() => {
        if (!user) return;
        const checkAgenticSafety = async () => {
            const now = new Date();
            const lastLogin = new Date(user.lastLoginDate || now);
            const diffDays = Math.floor(Math.abs(now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

            const msg = ClinicalSafetyScanner.generateProactiveCheckIn(user, diffDays);

            if (msg && !sessionStorage.getItem('agentic_checkin_shown')) {
                setTimeout(() => {
                    setAgentMessage(msg);
                    setShowAgenticRouter(true);

                    const sound = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
                    sound.volume = 0.3;
                    sound.play().catch(() => { });

                    sessionStorage.setItem('agentic_checkin_shown', 'true');
                }, 3500); // 3.5s delay for organic feel
            }
        };
        checkAgenticSafety();
    }, [user?.id, setAgentMessage, setShowAgenticRouter]);

    const [pendingCompanion, setPendingCompanion] = useState<Companion | null>(null);
    const [specialtyFilter, setSpecialtyFilter] = useState<string>('All');
    const { showToast } = useToast();

    // --- NEW FEATURE: VOICE JOURNAL & MOOD PULSE ---
    const [voiceEntries, setVoiceEntries] = useState<VoiceJournalEntry[]>([]);
    const [moodRiskAlert, setMoodRiskAlert] = useState(false);

    const resetIdleTimer = () => {
        setIsIdle(false);
        if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
        if (logoutTimerRef.current) window.clearTimeout(logoutTimerRef.current);

        idleTimerRef.current = window.setTimeout(() => setIsIdle(true), 5 * 60 * 1000); // 5 minutes blur
        logoutTimerRef.current = window.setTimeout(() => {
            showToast("Session timed out due to inactivity", "info");
            onLogout();
        }, 15 * 60 * 1000); // 15 minutes logout
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
        if (!dashboardUser) return;
        const risk = await UserService.predictMoodRisk(dashboardUser.id);
        if (risk) setMoodRiskAlert(true);
    };

    const loadVoiceJournals = async () => {
        if (!dashboardUser) return;
        const entries = await UserService.getVoiceJournals(dashboardUser.id);
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

    const handleStartConnection = (c: Companion, mode: 'video' | 'voice' = 'video') => {
        if ((dashboardUser?.balance || 0) <= 0) { setPaymentError("Insufficient credits. Please add funds to start a session."); setShowPayment(true); return; }
        if (mode === 'voice') {
            onStartSession(c, 'voice');
            return;
        }
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
        if (isUnlockingRoom) return;

        const currentRooms = dashboardUser.unlockedRooms || [];

        // If already unlocked, open the view
        if (currentRooms.includes(roomId)) {
            if (roomId === 'observatory') setShowObservatory(true);
            if (roomId === 'dojo') setShowDojo(true);
            return;
        }

        setIsUnlockingRoom(true);

        if (dashboardUser.balance < cost) {
            showToast(`You need ${cost}m to unlock this space.`, "error");
            setPaymentError(`Unlock ${roomId}: ${cost}m required`);
            setShowPayment(true);
            setIsUnlockingRoom(false);
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

            // Achievement Hook
            const unlockedAch = await UserService.unlockAchievement(dashboardUser.id, 'EXPLORER');
            if (unlockedAch) {
                showToast(`🏆 Achievement Unlocked: ${unlockedAch.title}`, "success");
            }

            // Open immediately
            if (roomId === 'observatory') setShowObservatory(true);
            if (roomId === 'dojo') setShowDojo(true);
        }
        setIsUnlockingRoom(false);
    };

    const filteredCompanions = specialtyFilter === 'All' ? companions : companions.filter(c => c.specialty.includes(specialtyFilter) || c.specialty === specialtyFilter);
    const uniqueSpecialties = Array.from(new Set(companions.map(c => c.specialty))).sort();

    const isFlowState = (dashboardUser?.streak || 0) >= 21;

    return (
        <div
            className={`min-h-screen transition-all duration-1000 font-sans text-[var(--color-text-base)] ${isFlowState ? 'ring-[4px] ring-yellow-400/80 ring-inset shadow-[inset_0_0_150px_rgba(250,204,21,0.15)] bg-yellow-900/5' : ''}`}
            style={{
                backgroundColor: isFlowState ? undefined : 'var(--color-bg-base)',
                backgroundImage: isFlowState ? undefined : 'var(--color-bg-gradient)'
            }}
        >
            {isFlowState && (
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden mix-blend-screen">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-[pulse_8s_ease-in-out_infinite]"></div>
                    <div className="absolute top-0 left-0 w-full h-1/4 bg-gradient-to-b from-yellow-500/10 to-transparent"></div>
                </div>
            )}
            {mood && <WeatherEffect type={mood} />}
            {/* FLOATING CONTROLS: Separated for better ergonomics */}
            <div className={`fixed bottom-6 left-6 z-[80] transition-all duration-500 ease-in-out border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden backdrop-blur-md w-12 h-12 rounded-full bg-transparent`}>
                <button
                    onClick={handleVoiceCheckIn}
                    className="w-full h-full flex items-center justify-center hover:scale-110 transition-transform bg-transparent text-primary group"
                    title="Voice Journal"
                >
                    <Mic className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </button>
            </div>

            <div className="fixed bottom-6 right-6 z-[80] pointer-events-none">
                <div className="pointer-events-auto">
                    <SoundscapePlayer />
                </div>
            </div>

            {/* BROADCAST BANNER */}
            {settings?.dashboardBroadcastMessage && (
                <div className="bg-primary text-black py-2 px-4 shadow-lg animate-in slide-in-from-top duration-500 relative z-50 overflow-hidden group">
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-[-20deg]"></div>
                    <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
                        <Megaphone className="w-4 h-4 text-black/80 animate-bounce" />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-center shadow-sm">{settings?.dashboardBroadcastMessage}</span>
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
                            { id: 'store', icon: ShoppingBag, label: 'Store', isModal: true },
                            { id: 'history', icon: Clock, label: t('dash_journal') },
                            { id: 'settings', icon: Settings, label: t('dash_settings') }
                        ].map((item) => (
                            <button key={item.id} onClick={() => item.isModal ? setShowSerenityShop(true) : setActiveTab(item.id as any)} className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 lg:p-4 rounded-xl transition-all duration-300 group border border-transparent ${activeTab === item.id ? 'bg-primary/20 text-primary dark:bg-yellow-500/20 dark:text-yellow-400 border-primary/30 dark:border-yellow-500/30 shadow-sm' : 'text-gray-500 hover:bg-primary-light dark:hover:bg-gray-800 dark:text-gray-400'}`}>
                                <item.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${activeTab === item.id ? 'text-primary dark:text-yellow-400' : 'group-hover:text-primary dark:group-hover:text-white'}`} />
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
                                            onClear={handleClearNotification}
                                            onClearAll={handleClearAllNotifications}
                                            onAction={handleNotificationAction}
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg md:text-xl font-black tracking-tight dark:text-white truncate max-w-[120px]">Peutic</span>
                                            <h1 className="hidden md:block text-2xl lg:text-3xl font-black tracking-tight dark:text-white leading-tight">
                                                {activeTab === 'inner_sanctuary' ? 'Sanctuary' : activeTab === 'history' ? t('sec_history') : t('dash_settings')}
                                            </h1>
                                            {(dashboardUser?.unlockedDecor || []).includes('item-plushie') && (
                                                <div className="ml-2 w-8 h-8 md:w-10 md:h-10 animate-[bounce_3s_infinite]" title="Lumina Companion Plushie">
                                                    <svg viewBox="-50 -50 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">
                                                        <path d="M 0 -30 Q 20 -30 25 -10 Q 30 15 0 25 Q -30 15 -25 -10 Q -20 -30 0 -30 Z" fill="#fbbf24" />
                                                        <path d="M -15 -10 Q -20 -30 -5 -20 Z M 15 -10 Q 20 -30 5 -20 Z" fill="#fef3c7" />
                                                        <circle cx="-8" cy="-5" r="3" fill="#000" />
                                                        <circle cx="8" cy="-5" r="3" fill="#000" />
                                                        <path d="M -3 3 Q 0 8 3 3" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                                                        <circle cx="-15" cy="5" r="4" fill="#fef08a" opacity="0.5" className="animate-pulse" />
                                                        <circle cx="15" cy="5" r="4" fill="#fef08a" opacity="0.5" className="animate-pulse" />
                                                    </svg>
                                                </div>
                                            )}
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

                                <button onClick={() => setShowGrounding(true)} className="relative p-2.5 rounded-2xl bg-white dark:bg-gray-800 border-2 border-blue-400 dark:border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] hover:scale-105 transition-all text-blue-500 overflow-hidden" title="Panic Relief / Grounding Mode">
                                    <div className="absolute inset-0 bg-blue-400/20 blur-md rounded-2xl animate-pulse pointer-events-none"></div>
                                    <LifeBuoy className="w-5 h-5 relative z-10" />
                                </button>

                                <button onClick={toggleDarkMode} className="p-2.5 rounded-2xl bg-white dark:bg-gray-800 border border-primary-light dark:border-gray-700 shadow-sm hover:scale-105 transition-all">
                                    {isDark ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-gray-400" />}
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


                                <button onClick={() => setShowProfile(true)} className="w-10 h-10 md:w-11 md:h-11 rounded-2xl overflow-hidden border-2 border-primary shadow-premium transition-all hover:rotate-3 active:scale-90 flex-shrink-0">
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

                                <div className="space-y-4">


                                    <CollapsibleSection title="Spaces" icon={Zap} defaultOpen={false}>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-3 gap-1 md:gap-4">
                                                {/* TILE 1: ZEN BONZAI */}
                                                <div
                                                    onClick={() => setShowGardenFull(true)}
                                                    className="group relative bg-white/20 dark:bg-black/40 backdrop-blur-xl rounded-xl md:rounded-3xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(34,197,94,0.15)] hover:shadow-[0_8px_32px_rgba(34,197,94,0.4)] hover:-translate-y-1 transition-all overflow-hidden flex flex-col h-[100px] md:h-[220px] cursor-pointer"
                                                >
                                                    <div className="flex-1 p-2 md:p-6 relative flex flex-col items-center justify-center">
                                                        <div className="absolute inset-0 bg-green-400/10 md:bg-green-400/20 blur-2xl md:blur-3xl rounded-full scale-150 animate-pulse pointer-events-none"></div>
                                                        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pointer-events-none">
                                                            <div className="relative mb-1 md:mb-4 pointer-events-auto">
                                                                <div className="absolute -inset-4 bg-green-500/20 blur-xl rounded-full animate-pulse"></div>
                                                                <div className="w-10 h-10 md:w-20 md:h-20 bg-gradient-to-br from-green-500 to-emerald-700 border border-green-400/50 rounded-2xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(34,197,94,0.4)] group-hover:scale-110 transition-transform">
                                                                    <Leaf className="w-5 h-5 md:w-10 md:h-10 text-white animate-ethereal-breathe" />
                                                                </div>
                                                            </div>
                                                            {/* Overlay Controls */}
                                                            <div className="absolute top-2 right-2 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (!hasClippedInnerGarden) {
                                                                            handleClipPlant();
                                                                            setHasClippedInnerGarden(true);
                                                                        }
                                                                    }}
                                                                    className={`p-2 bg-white/90 dark:bg-black/80 rounded-full shadow-lg ${hasClippedInnerGarden ? 'opacity-50 cursor-not-allowed text-gray-400' : 'hover:scale-110 active:scale-95 text-pink-500'} transition-all`}
                                                                    title={hasClippedInnerGarden ? "Already Clipped" : "Clip for Inspiration"}
                                                                    disabled={hasClippedInnerGarden}
                                                                >
                                                                    <Scissors className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <h3 className="text-[7px] md:text-sm font-black text-green-700 dark:text-green-300 uppercase tracking-widest drop-shadow-sm text-center mt-[-10px] relative z-20">Zen Bonzai</h3>
                                                        <p className="hidden md:block text-[9px] font-bold text-green-600/70 dark:text-green-400/60 uppercase tracking-tighter">
                                                            {garden ? `Lvl ${garden.level} • ${garden.currentPlantType}` : 'Plant Seed'}
                                                        </p>
                                                    </div>
                                                </div>

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
                                                            className="group relative bg-white/20 dark:bg-black/40 backdrop-blur-xl rounded-xl md:rounded-3xl border border-white/20 dark:border-white/5 shadow-glass hover:shadow-premium hover:-translate-y-1 transition-all overflow-hidden flex flex-col h-[100px] md:h-[220px] cursor-pointer"
                                                        >
                                                            <div className="flex flex-col items-center justify-center h-full p-2 md:p-6 text-center relative z-10">
                                                                <div className="relative mb-1 md:mb-4">
                                                                    <div className="absolute -inset-4 md:-inset-6 bg-purple-400/30 dark:bg-purple-500/20 blur-xl rounded-full animate-pulse"></div>
                                                                    <div className="absolute -inset-2 border border-purple-300/50 dark:border-purple-500/30 rounded-full animate-[spin_8s_linear_infinite]"></div>
                                                                    <div className="w-10 h-10 md:w-20 md:h-20 bg-gradient-to-br from-purple-600 to-indigo-700 border border-purple-400/50 rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] group-hover:scale-110 transition-transform">
                                                                        <BookOpen className="w-5 h-5 md:w-10 md:h-10" />
                                                                    </div>
                                                                    {isLocked && <div className="absolute -top-2 -right-2 bg-primary text-black p-1 rounded-lg shadow-lg"><Lock className="w-3 h-3" /></div>}
                                                                </div>
                                                                <h3 className="text-[7px] md:text-sm font-black text-purple-700 dark:text-purple-300 uppercase tracking-widest drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]">Book of You</h3>
                                                                <p className="hidden md:block text-[10px] font-bold text-purple-500/70 dark:text-purple-400/50 uppercase tracking-widest">
                                                                    {isLocked ? `Unlocked in ${daysRemaining}d` : 'Open Chronicle'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {/* TILE 3: LUMINA */}
                                                <div
                                                    onClick={() => setShowPocketPet(true)}
                                                    className="group relative bg-white/20 dark:bg-black/40 backdrop-blur-xl rounded-xl md:rounded-3xl border border-white/20 dark:border-white/5 shadow-glass hover:shadow-premium hover:-translate-y-1 transition-all overflow-hidden flex flex-col h-[100px] md:h-[220px] cursor-pointer"
                                                >
                                                    <div className="flex-1 p-2 md:p-6 relative flex flex-col items-center justify-center">
                                                        <div className="relative mb-1 md:mb-4">
                                                            <div className="absolute -inset-4 bg-cyan-500/20 blur-xl rounded-full animate-pulse"></div>
                                                            <div className="w-10 h-10 md:w-20 md:h-20 bg-gradient-to-br from-cyan-500 to-blue-700 border border-cyan-400/50 rounded-2xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(34,211,238,0.4)] group-hover:scale-110 transition-transform overflow-hidden">
                                                                <Sparkles className="w-5 h-5 md:w-10 md:h-10 text-white animate-bounce" />
                                                            </div>
                                                        </div>
                                                        <h3 className="text-[7px] md:text-sm font-black text-cyan-700 dark:text-cyan-50 uppercase tracking-[0.2em] mb-1">Lumina</h3>
                                                        <p className="hidden md:block text-[10px] font-bold text-cyan-600/60 dark:text-cyan-400/50 uppercase tracking-widest">
                                                            {lumina ? `${lumina.name} Lvl ${lumina.level}` : 'Summon Friend'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* TILE 4: ORACLE */}
                                                <div
                                                    onClick={() => handleRoomInteraction('observatory', 25)}
                                                    className={`group relative bg-white/20 dark:bg-black/40 backdrop-blur-xl rounded-xl md:rounded-3xl border ${dashboardUser?.unlockedRooms?.includes('observatory') ? 'border-white/20 dark:border-white/5 shadow-glass hover:shadow-premium hover:-translate-y-1' : 'border-gray-300 dark:border-gray-700 grayscale opacity-80'} transition-all overflow-hidden flex flex-col h-[100px] md:h-[220px] cursor-pointer`}
                                                >
                                                    <div className="flex-1 p-2 md:p-6 relative flex flex-col items-center justify-center text-center">
                                                        <div className="relative mb-1 md:mb-4">
                                                            <div className="absolute -inset-4 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
                                                            <div className={`w-10 h-10 md:w-20 md:h-20 ${dashboardUser?.unlockedRooms?.includes('observatory') ? 'bg-gradient-to-br from-indigo-500 to-purple-700 border-indigo-400/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-gray-400 dark:bg-gray-600 border-gray-400/50 text-gray-200'} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                                {dashboardUser?.unlockedRooms?.includes('observatory') ? <Moon className="w-5 h-5 md:w-8 md:h-8 text-white" /> : <Lock className="w-4 h-4 md:w-6 md:h-6 text-gray-200" />}
                                                            </div>
                                                            {!dashboardUser?.unlockedRooms?.includes('observatory') && (
                                                                <div className="absolute -top-3 -right-3 md:-top-2 md:-right-2 bg-indigo-500 text-white text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border border-white/20">
                                                                    25m
                                                                </div>
                                                            )}
                                                        </div>
                                                        <h3 className="text-[7px] md:text-sm font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-[0.2em] mb-1">Oracle</h3>
                                                        {dashboardUser?.unlockedRooms?.includes('observatory') ? (
                                                            <p className="hidden md:block text-[10px] font-bold text-indigo-600/60 dark:text-indigo-400/50 uppercase tracking-widest">Dreams & Vision</p>
                                                        ) : (
                                                            <p className="hidden md:block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Locked</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* TILE 5: ZEN DOJO */}
                                                <div
                                                    onClick={() => handleRoomInteraction('dojo', 15)}
                                                    className={`group relative bg-white/20 dark:bg-black/40 backdrop-blur-xl rounded-xl md:rounded-3xl border ${dashboardUser?.unlockedRooms?.includes('dojo') ? 'border-white/20 dark:border-white/5 shadow-glass hover:shadow-premium hover:-translate-y-1' : 'border-gray-300 dark:border-gray-700 grayscale opacity-80'} transition-all overflow-hidden flex flex-col h-[100px] md:h-[220px] cursor-pointer`}
                                                >
                                                    <div className="flex-1 p-2 md:p-6 relative flex flex-col items-center justify-center text-center">
                                                        <div className="relative mb-1 md:mb-4">
                                                            <div className="absolute -inset-4 bg-amber-500/20 blur-xl rounded-full animate-pulse"></div>
                                                            <div className={`w-10 h-10 md:w-20 md:h-20 ${dashboardUser?.unlockedRooms?.includes('dojo') ? 'bg-gradient-to-br from-amber-500 to-orange-700 border-amber-400/50 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-gray-400 dark:bg-gray-600 border-gray-400/50 text-gray-200'} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                                {dashboardUser?.unlockedRooms?.includes('dojo') ? <Zap className="w-5 h-5 md:w-8 md:h-8 text-white" /> : <Lock className="w-4 h-4 md:w-6 md:h-6 text-gray-200" />}
                                                            </div>
                                                            {!dashboardUser?.unlockedRooms?.includes('dojo') && (
                                                                <div className="absolute -top-3 -right-3 md:-top-2 md:-right-2 bg-amber-500 text-white text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border border-white/20">
                                                                    15m
                                                                </div>
                                                            )}
                                                        </div>
                                                        <h3 className="text-[7px] md:text-sm font-black text-amber-700 dark:text-amber-300 uppercase tracking-[0.2em] mb-1">Zen Dojo</h3>
                                                        {dashboardUser?.unlockedRooms?.includes('dojo') ? (
                                                            <p className="hidden md:block text-[10px] font-bold text-amber-600/60 dark:text-amber-400/50 uppercase tracking-widest">Focus & Flow</p>
                                                        ) : (
                                                            <p className="hidden md:block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Locked</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* TILE 6: THOUGHT SHREDDER */}
                                                <div
                                                    onClick={() => setShowShredder(true)}
                                                    className="group relative bg-white/20 dark:bg-black/40 backdrop-blur-xl rounded-xl md:rounded-3xl border border-white/20 dark:border-white/5 shadow-glass hover:shadow-premium hover:-translate-y-1 transition-all overflow-hidden flex flex-col h-[100px] md:h-[220px] cursor-pointer"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-600/5 pointer-events-none"></div>
                                                    <div className="flex-1 p-2 md:p-6 relative flex flex-col items-center justify-center text-center">
                                                        <div className="relative mb-1 md:mb-4">
                                                            <div className="absolute -inset-4 bg-red-500/20 blur-xl rounded-full animate-pulse"></div>
                                                            <div className="w-10 h-10 md:w-20 md:h-20 bg-gradient-to-br from-red-500 to-rose-700 border border-red-400/50 rounded-2xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] group-hover:scale-110 transition-transform">
                                                                <Scissors className="w-5 h-5 md:w-8 md:h-8 text-white" />
                                                            </div>
                                                        </div>
                                                        <h3 className="text-[7px] md:text-sm font-black text-red-700 dark:text-red-300 uppercase tracking-[0.2em] mb-1">Shredder</h3>
                                                        <p className="hidden md:block text-[10px] font-bold text-red-600/60 dark:text-red-400/50 uppercase tracking-widest">Release & Let Go</p>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </CollapsibleSection>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                                    {dashboardUser ? (
                                        <div className="bg-transparent dark:bg-transparent p-4 md:p-5 rounded-3xl border border-transparent shadow-none col-span-1 md:col-span-2 relative overflow-hidden group min-h-[120px] md:min-h-[140px]">
                                            {weeklyGoal >= 300 ? (
                                                <div className="absolute top-4 right-4 z-20 flex items-center justify-center">
                                                    <div className="relative w-16 h-16 flex items-center justify-center">
                                                        {/* Removed Green Nuclear Flame Effect per user request */}
                                                        <Trophy className="w-12 h-12 text-green-400 animate-bounce relative z-10" />
                                                        <Leaf className="absolute -right-2 top-0 w-6 h-6 text-green-300 fill-green-400 animate-pulse drop-shadow-[0_0_10px_rgba(74,222,128,1)] z-20" />
                                                    </div>
                                                </div>
                                            ) : weeklyGoal >= weeklyTarget ? (
                                                <div className="absolute top-4 right-4 z-20 flex items-center justify-center">
                                                    <div className="relative w-14 h-14 flex items-center justify-center">
                                                        <div className="absolute w-full h-full border-2 border-blue-500/40 border-t-blue-400 rounded-full animate-[spin_3s_linear_infinite]"></div>
                                                        <div className="absolute w-10 h-10 bg-blue-400/50 rounded-full blur-xl animate-pulse"></div>
                                                        <Leaf className="w-8 h-8 text-blue-400 fill-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,1)] animate-bounce relative z-10" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="absolute top-4 right-4 opacity-40 group-hover:opacity-100 transition-opacity duration-300">
                                                    <Leaf className="w-14 h-14 text-gray-200 dark:text-gray-800/50 group-hover:text-primary dark:group-hover:text-blue-500 transition-colors" />
                                                </div>
                                            )}
                                            <div className="relative z-10">
                                                <h3 className="font-bold text-gray-500 dark:text-gray-400 text-[10px] md:text-xs uppercase tracking-widest mb-1">Weekly Wellness Goal</h3>
                                                <div className="flex items-end gap-2 mb-2 md:mb-3">
                                                    <span className={`text-2xl md:text-4xl font-black ${weeklyGoal >= 300 ? 'text-green-500 dark:text-green-400' : 'text-primary dark:text-blue-400'}`}>{weeklyGoal}</span>
                                                    <span className="text-gray-400 text-[10px] md:text-sm font-bold mb-1">/ {weeklyTarget} activities</span>
                                                </div>
                                                <div className={`w-full h-2 md:h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full mb-2 md:mb-3 relative ${weeklyGoal >= 300 ? 'shadow-[0_0_15px_rgba(34,197,94,0.4)]' : weeklyGoal >= weeklyTarget ? 'shadow-[0_0_10px_rgba(59,130,246,0.2)]' : ''}`}>
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ease-out absolute left-0 top-0 bottom-0 ${weeklyGoal >= 300 ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]'
                                                            : weeklyGoal >= weeklyTarget ? 'bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                                                                : 'bg-primary dark:bg-blue-500'
                                                            }`}
                                                        style={{ width: `${Math.min(100, (weeklyGoal / weeklyTarget) * 100)}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-[10px] md:text-sm font-bold text-gray-700 dark:text-gray-300">
                                                    {weeklyMessage}
                                                </p>
                                            </div>
                                        </div>
                                    ) : <StatSkeleton />}
                                    <MoodTracker onMoodSelect={handleMoodSelect} />
                                </div>

                                <CollapsibleSection title="Arcade" icon={Gamepad2}>
                                    <div className="grid grid-cols-3 gap-1 md:gap-4 w-full">
                                        {/* TILE 1: MINDFUL MATCH */}
                                        <div
                                            onClick={() => setShowMatchGame(true)}
                                            className="group relative bg-white/20 dark:bg-black/40 backdrop-blur-xl rounded-xl md:rounded-3xl border border-white/20 dark:border-white/5 shadow-glass hover:shadow-premium hover:-translate-y-1 transition-all overflow-hidden flex flex-col h-[100px] md:h-[220px] cursor-pointer"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-pink-600/5 pointer-events-none"></div>
                                            <div className="flex-1 p-2 md:p-6 relative flex flex-col items-center justify-center text-center">
                                                <div className="relative mb-1 md:mb-4">
                                                    <div className="absolute -inset-4 bg-violet-500/20 blur-xl rounded-full animate-pulse"></div>
                                                    <div className="w-10 h-10 md:w-20 md:h-20 bg-gradient-to-br from-violet-500 to-purple-700 border border-violet-400/50 rounded-2xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] group-hover:scale-110 transition-transform">
                                                        <Brain className="w-5 h-5 md:w-8 md:h-8 text-white" />
                                                    </div>
                                                </div>
                                                <h3 className="text-[7px] md:text-sm font-black text-violet-700 dark:text-violet-300 uppercase tracking-[0.2em] mb-1">Mindful Match</h3>
                                                <p className="hidden md:block text-[10px] font-bold text-violet-600/60 dark:text-violet-400/50 uppercase tracking-widest">Memory & Focus</p>
                                            </div>
                                        </div>

                                        {/* TILE 2: CLOUD HOP */}
                                        <div
                                            onClick={() => setShowCloudHop(true)}
                                            className="group relative bg-white/20 dark:bg-black/40 backdrop-blur-xl rounded-xl md:rounded-3xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(14,165,233,0.15)] hover:shadow-[0_8px_32px_rgba(14,165,233,0.4)] hover:-translate-y-1 transition-all overflow-hidden flex flex-col h-[100px] md:h-[220px] cursor-pointer"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-cyan-600/5 pointer-events-none"></div>
                                            <div className="flex-1 p-2 md:p-6 relative flex flex-col items-center justify-center text-center">
                                                <div className="relative mb-1 md:mb-4">
                                                    <div className="absolute -inset-4 bg-sky-500/20 blur-xl rounded-full animate-pulse"></div>
                                                    <div className="w-10 h-10 md:w-20 md:h-20 bg-gradient-to-br from-sky-500 to-blue-700 border border-sky-400/50 rounded-2xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(14,165,233,0.4)] group-hover:scale-110 transition-transform">
                                                        <Cloud className="w-5 h-5 md:w-8 md:h-8 text-white" />
                                                    </div>
                                                </div>
                                                <h3 className="text-[7px] md:text-sm font-black text-sky-700 dark:text-sky-300 uppercase tracking-[0.2em] mb-1">Cloud Hop</h3>
                                                <p className="hidden md:block text-[10px] font-bold text-sky-600/60 dark:text-sky-400/50 uppercase tracking-widest">Relax & Soar</p>
                                            </div>
                                        </div>

                                        {/* TILE 3: STRESS SLICER */}
                                        <div
                                            onClick={() => setShowSlicerGame(true)}
                                            className="group relative bg-white/20 dark:bg-black/40 backdrop-blur-xl rounded-xl md:rounded-3xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(239,68,68,0.15)] hover:shadow-[0_8px_32px_rgba(239,68,68,0.4)] hover:-translate-y-1 transition-all overflow-hidden flex flex-col h-[100px] md:h-[220px] cursor-pointer"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-600/5 pointer-events-none"></div>
                                            <div className="flex-1 p-2 md:p-6 relative flex flex-col items-center justify-center text-center">
                                                <div className="relative mb-1 md:mb-4">
                                                    <div className="absolute -inset-4 bg-red-500/20 blur-xl rounded-full animate-pulse"></div>
                                                    <div className="w-10 h-10 md:w-20 md:h-20 bg-gradient-to-br from-red-500 to-rose-700 border border-red-400/50 rounded-2xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] group-hover:scale-110 transition-transform">
                                                        <Flame className="w-5 h-5 md:w-8 md:h-8 text-white" />
                                                    </div>
                                                </div>
                                                <h3 className="text-[7px] md:text-sm font-black text-red-700 dark:text-red-300 uppercase tracking-[0.2em] mb-1">Stress Slicer</h3>
                                                <p className="hidden md:block text-[10px] font-bold text-red-600/60 dark:text-red-400/50 uppercase tracking-widest">Cathartic Release</p>
                                            </div>
                                        </div>
                                    </div>
                                </CollapsibleSection>
                                <CollapsibleSection title="Journal" icon={Feather}>
                                    <GlobalErrorBoundary fallback={
                                        <div className="p-6 text-center border border-red-500/20 bg-red-500/5 rounded-xl">
                                            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                                            <h3 className="font-bold text-red-400 text-sm">Hub Temporarily Unavailable</h3>
                                            <p className="text-xs text-red-300 mt-1">We are restoring the connection. Please try again shortly.</p>
                                        </div>
                                    }>
                                        <Suspense fallback={<div className="p-6 space-y-4"><StatSkeleton /><StatSkeleton /></div>}>
                                            <div className="space-y-6">
                                                <JournalSection user={user} />
                                                <div className="border-t border-dashed border-primary-light dark:border-gray-700" />
                                                <WisdomGenerator userId={user.id} />
                                            </div>
                                        </Suspense>
                                    </GlobalErrorBoundary>
                                </CollapsibleSection>
                                <div>
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-5"><div><h2 className="text-xl md:text-2xl font-black dark:text-primary">{t('sec_specialists')}</h2><p className="text-gray-500 text-xs md:text-sm">{t('roster_heading')}</p></div><div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide"><button onClick={() => setSpecialtyFilter('All')} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${specialtyFilter === 'All' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>All</button>{uniqueSpecialties.map(spec => (<button key={spec} onClick={() => setSpecialtyFilter(spec)} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${specialtyFilter === spec ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{spec}</button>))}</div></div>
                                    {loadingCompanions ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                            {[1, 2, 3, 4, 5].map(i => <CompanionSkeleton key={i} />)}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                                            {filteredCompanions.map((companion) => (
                                                <div key={companion.id} onClick={() => handleStartConnection(companion)} className="group relative bg-primary/10 dark:bg-primary/20 backdrop-blur-sm rounded-[1.8rem] overflow-hidden border border-[var(--color-primary-border)] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer flex flex-col h-full" style={{ borderColor: 'var(--color-primary-border)' }}>
                                                    <div className="aspect-[4/5] relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                        <AvatarImage src={companion.imageUrl} alt={companion.name} className="w-full h-full object-cover group-hover:scale-110 group-hover:animate-breathing transition-transform duration-700" />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>


                                                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-5 flex flex-col justify-center text-center">
                                                            <p className="text-primary text-[10px] font-black uppercase tracking-widest mb-2">About {companion.name}</p>
                                                            <p className="text-white text-xs leading-relaxed mb-3">"{companion.bio}"</p>
                                                            <div className="grid grid-cols-2 gap-2 text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-3"><div className="bg-white/10 p-1.5 rounded-lg">{companion.yearsExperience} Yrs Exp</div><div className="bg-white/10 p-1.5 rounded-lg">{companion.degree}</div></div>
                                                            <div className="flex flex-col gap-2 mt-2">
                                                                <button onClick={(e) => { e.stopPropagation(); handleStartConnection(companion, 'video'); }} className="bg-white text-black px-4 py-2 rounded-full font-bold text-[10px] w-full flex items-center justify-center gap-2 hover:bg-primary transition-colors"><Video className="w-3 h-3" /> HD Camera Session</button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleStartConnection(companion, 'voice'); }} className="bg-black/50 text-white border border-white/20 px-4 py-2 rounded-full font-bold text-[10px] w-full flex items-center justify-center gap-2 hover:bg-blue-500 hover:border-blue-500 transition-colors backdrop-blur-md"><Mic className="w-3 h-3" /> Live Voice Connect</button>
                                                            </div>
                                                        </div>
                                                        <div className="absolute top-3 left-3 flex gap-2"><div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md ${companion.status === 'AVAILABLE' ? 'bg-green-500/90 text-white shadow-lg shadow-green-500/20' : 'bg-gray-500/90 text-white'}`}>{companion.status === 'AVAILABLE' ? 'Online' : 'Busy'}</div></div><div className="absolute bottom-3 left-3 right-3 group-hover:opacity-0 transition-opacity"><h3 className="text-white font-black text-lg leading-tight mb-0.5 shadow-sm drop-shadow-md">{companion.name}</h3><p className="text-white/90 dark:text-gray-200 text-[10px] font-bold uppercase tracking-wider truncate drop-shadow-md">{companion.specialty}</p></div></div><div className="p-3 bg-primary/10 dark:bg-primary/20 flex justify-between items-center border-t border-primary/20"><div className="flex items-center gap-1"><Star className="w-3 h-3 text-primary fill-primary" /><span className="text-gray-700 dark:text-gray-300 text-xs font-bold">{companion.rating}</span></div><button className="bg-white/50 dark:bg-primary/30 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white rounded-lg p-2 transition-colors"><Eye className="w-3.5 h-3.5" /></button></div></div>))}</div>)}
                                    {filteredCompanions.length === 0 && (<div className="text-center py-16 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800"><p className="text-gray-500 font-bold text-sm">No specialists found in this category.</p><button onClick={() => setSpecialtyFilter('All')} className="text-primary text-xs font-bold mt-2 hover:underline">View All</button></div>)}
                                </div>
                            </div>
                        )}
                        {activeTab === 'history' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-500">
                                <div className="bg-white/70 dark:bg-gray-900/40 rounded-3xl border border-yellow-100/50 dark:border-gray-800/50 overflow-hidden backdrop-blur-md shadow-xl hover:shadow-2xl transition-shadow duration-500">
                                    <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                        <h3 className="font-black text-lg dark:text-primary">{t('sec_history')}</h3>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Financials & Check-ins</span>
                                    </div>
                                    <div className="overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0 z-10"><tr><th className="p-4 md:p-5">Date</th><th className="p-4 md:p-5">Description</th><th className="p-4 md:p-5 text-right">Amount</th><th className="p-4 md:p-5 text-right">Status</th></tr></thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                {transactions.length === 0 ? (<tr><td colSpan={4} className="p-8 text-center text-gray-400 text-sm italic">No records found.</td></tr>) : (transactions.map((tx) => (<tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"><td className="p-4 md:p-5 text-sm dark:text-gray-300 font-mono">{new Date(tx.date).toLocaleDateString()}</td><td className="p-4 md:p-5 text-sm font-bold dark:text-white">{tx.description}</td><td className={`p-4 md:p-5 text-sm text-right font-mono font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount}m</td><td className="p-4 md:p-5 text-right"><span className="px-2 py-1 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase tracking-wide">{tx.status}</span></td></tr>)))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="bg-white/70 dark:bg-gray-900/40 rounded-3xl border border-yellow-100/50 dark:border-gray-800/50 overflow-hidden backdrop-blur-md shadow-xl hover:shadow-2xl transition-shadow duration-500">
                                    <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-xl text-red-600 dark:text-red-400"><Mic className="w-5 h-5" /></div>
                                            <div>
                                                <h3 className="font-black text-lg dark:text-primary leading-tight">Voice Chronicles</h3>
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
                                    <div className="p-5 md:p-6 border-b border-primary-light dark:border-gray-800"><h3 className="font-black text-lg md:text-xl dark:text-primary mb-1">{t('dash_settings')}</h3><p className="text-gray-500 text-xs">Manage your personal information.</p></div>
                                    <div className="p-5 md:p-6 space-y-5">
                                        <div className="flex items-center gap-5"><div className="relative"><div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-4 border-primary-light dark:border-gray-800"><AvatarImage src={dashboardUser?.avatar || ''} alt="Profile" className="w-full h-full object-cover" isUser={true} /></div><button onClick={() => setShowProfile(true)} className="absolute bottom-0 right-0 p-1.5 bg-black text-white rounded-full hover:bg-gray-800 transition-colors shadow-lg"><Edit2 className="w-3 h-3" /></button></div><div className="flex-1 space-y-3"><div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Display Name</label><div className="relative"><UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-primary outline-none transition-colors text-sm font-bold dark:text-white" /></div></div><div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Email Address</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-primary outline-none transition-colors text-sm font-bold dark:text-white" /></div></div></div></div>
                                        <div className="flex justify-end pt-2"><button onClick={saveProfileChanges} disabled={isSavingProfile} className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold text-xs hover:opacity-80 transition-opacity flex items-center gap-2">{isSavingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}{t('ui_save')}</button></div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-primary-light dark:border-gray-800 overflow-hidden shadow-sm">
                                    <div className="p-5 md:p-6 border-b border-primary-light dark:border-gray-800"><h3 className="font-black text-lg md:text-xl dark:text-primary mb-1">Preferences</h3><p className="text-gray-500 text-xs">Customize your sanctuary experience.</p></div>
                                    <div className="p-5 md:p-6 space-y-5">
                                        <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"><Moon className="w-4 h-4 text-gray-600 dark:text-gray-400" /></div><div><p className="font-bold text-gray-900 dark:text-white text-sm">Dark Mode</p><p className="text-[10px] text-gray-500">Reduce eye strain.</p></div></div><button onClick={toggleDarkMode} className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${isDark ? 'bg-primary' : 'bg-gray-200'}`}><span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-5' : 'translate-x-1'}`} /></button></div>
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
                                                    { id: 'sunshine', color: '#FACC15', label: 'Sunshine' },
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
                                <div className="bg-white/70 dark:bg-gray-900/40 rounded-3xl border border-primary-light/50 dark:border-gray-800/50 overflow-hidden backdrop-blur-md shadow-sm">
                                    <div className="p-5 md:p-6 border-b border-primary-light/30 dark:border-gray-800/50"><h3 className="font-black text-lg md:text-xl dark:text-primary mb-1">Security Health</h3><p className="text-gray-500 text-xs text-green-500 flex items-center gap-1 font-bold animate-pulse"><ShieldCheck className="w-3 h-3" /> All systems secured & encrypted</p></div>
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
                                                <h4 className="font-bold text-base mb-1 dark:text-primary">Are you absolutely sure?</h4>
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
                    <div className="mt-8 mb-4 max-w-4xl mx-auto px-4"><div className="bg-primary-light dark:bg-primary/10 border border-primary-border dark:border-primary/30 p-3 rounded-xl text-center"><p className="text-[9px] md:text-[10px] font-bold text-primary dark:text-primary uppercase tracking-wide leading-relaxed">Note: Specialist availability is subject to change frequently due to high demand. If your selected specialist is unavailable, a specialist of equal or greater qualifications will be automatically substituted to ensure immediate support.</p></div></div>
                    <footer className="bg-primary/5 dark:bg-primary/5 text-black dark:text-white py-10 md:py-12 px-6 dark:border-gray-800 transition-colors">
                        <div className="max-w-7xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-8 md:mb-10">
                                <div className="md:col-span-5 space-y-4"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-yellow-400 rounded-xl flex items-center justify-center"><Heart className="w-4 h-4 fill-black text-black" /></div><span className="text-xl font-black tracking-tight">Peutic</span></div><p className="text-gray-800 dark:text-gray-500 text-xs leading-relaxed max-w-md">Connecting the disconnected through elite-level human specialists and cutting-edge secure technology.</p><div className="flex gap-4">{[Twitter, Instagram, Linkedin].map((Icon, i) => (<button key={i} className="text-gray-800 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors hover:scale-110 transform"><Icon className="w-4 h-4" /></button>))}</div></div>
                                <div className="grid grid-cols-2 md:grid-cols-1 gap-6 md:col-span-2"><div><h4 className="font-black mb-3 text-[9px] uppercase tracking-[0.3em] text-gray-700 dark:text-gray-400">Global</h4><ul className="space-y-2 text-xs font-bold text-gray-800 dark:text-gray-500"><li><Link to="/about" className="hover:text-primary dark:hover:text-primary transition-colors">About</Link></li><li><Link to="/press" className="hover:text-primary dark:hover:text-primary transition-colors">Media</Link></li></ul></div></div>
                                <div className="grid grid-cols-2 md:grid-cols-1 gap-6 md:col-span-2"><div><h4 className="font-black mb-3 text-[9px] uppercase tracking-[0.3em] text-gray-700 dark:text-gray-400">Support</h4><ul className="space-y-2 text-xs font-bold text-gray-800 dark:text-gray-500"><li><Link to="/support" className="hover:text-primary dark:hover:text-primary transition-colors">Help Center</Link></li><li><Link to="/safety" className="hover:text-primary dark:hover:text-primary transition-colors">Safety Standards</Link></li><li><Link to="/crisis" className="text-red-600 hover:text-red-700 transition-colors">Crisis Hub</Link></li></ul></div></div>
                                <div className="md:col-span-3"><h4 className="font-black mb-3 text-[9px] uppercase tracking-[0.3em] text-gray-700 dark:text-gray-400">Regulatory</h4><ul className="space-y-2 text-xs font-bold text-gray-800 dark:text-gray-500"><li><Link to="/privacy" className="hover:text-primary dark:hover:text-primary transition-colors">Privacy Policy</Link></li><li><Link to="/terms" className="hover:text-primary dark:hover:text-primary transition-colors">Terms of Service</Link></li></ul></div>

                            </div>
                            <div className="mb-8 p-4 bg-primary-light dark:bg-primary/10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-primary-border dark:border-primary/20">
                                <div className="flex items-center gap-2 text-primary dark:text-primary font-bold text-xs">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Not a Medical Service. For entertainment & companionship only.</span>
                                </div>
                                <Link to="/crisis" className="bg-red-100 text-red-600 hover:bg-red-200 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-colors">
                                    In Crisis?
                                </Link>
                            </div>
                            <div className="pt-6 flex flex-col md:flex-row justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-gray-700 dark:text-gray-600 gap-3 md:gap-0 border-t border-primary-border/50 dark:border-gray-800">
                                <p>&copy; {new Date().getFullYear()} Peutic Inc. | ISO 27001 Certified</p>
                                <div
                                    onClick={() => setShowWorldPulse(true)}
                                    className="flex items-center gap-2 cursor-pointer hover:text-indigo-400 transition-colors"
                                >
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                    <span>Pulse of the World</span>
                                </div>
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

            {/* GAMES */}
            {
                showMatchGame && (
                    <Suspense fallback={<div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center text-white font-bold">Loading Game...</div>}>
                        <div className="fixed inset-0 z-[150] bg-base/90 backdrop-blur-xl flex flex-col">
                            {/* Header */}
                            <div className="bg-violet-50 dark:bg-violet-950/30 p-4 border-b border-violet-100 dark:border-violet-900/50 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-violet-500" />
                                    <h2 className="font-black text-violet-900 dark:text-violet-300 uppercase tracking-widest text-sm">Mindful Match</h2>
                                </div>
                                <button onClick={() => setShowMatchGame(false)} className="p-2 hover:bg-violet-100 dark:hover:bg-violet-900 rounded-full transition-colors group">
                                    <X className="w-6 h-6 text-violet-400 group-hover:text-violet-600" />
                                </button>
                            </div>

                            {/* Game Area - Full Flex Growth */}
                            <div className="flex-1 overflow-hidden relative flex flex-col">
                                <MindfulMatchGame dashboardUser={dashboardUser} />
                            </div>
                        </div>
                    </Suspense>
                )
            }

            {
                showCloudHop && (
                    <Suspense fallback={<div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center text-white font-bold">Loading Cloud Engine...</div>}>
                        <div className="fixed inset-0 z-[150] bg-base/90 backdrop-blur-xl flex flex-col">
                            <div className="bg-sky-50 dark:bg-sky-950/30 p-4 border-b border-sky-100 dark:border-sky-900/50 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-2">
                                    <Cloud className="w-5 h-5 text-sky-500" />
                                    <h2 className="font-black text-sky-900 dark:text-sky-300 uppercase tracking-widest text-sm">Cloud Hop</h2>
                                </div>
                                <button onClick={() => setShowCloudHop(false)} className="p-2 hover:bg-sky-100 dark:hover:bg-sky-900 rounded-full transition-colors group">
                                    <X className="w-6 h-6 text-sky-400 group-hover:text-sky-600" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <CloudHopGame dashboardUser={dashboardUser} />
                            </div>
                        </div>
                    </Suspense>
                )
            }

            {
                showSlicerGame && (
                    <Suspense fallback={<div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center text-white font-bold">Loading Slicer Engine...</div>}>
                        <div className="fixed inset-0 z-[150] bg-base/90 backdrop-blur-xl flex flex-col">
                            <div className="bg-red-50 dark:bg-red-950/30 p-4 border-b border-red-100 dark:border-red-900/50 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-2">
                                    <Flame className="w-5 h-5 text-red-500" />
                                    <h2 className="font-black text-red-900 dark:text-red-300 uppercase tracking-widest text-sm">Stress Slicer</h2>
                                </div>
                                <button onClick={() => setShowSlicerGame(false)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition-colors group">
                                    <X className="w-6 h-6 text-red-400 group-hover:text-red-600" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <StressSlicerGame dashboardUser={dashboardUser} />
                            </div>
                        </div>
                    </Suspense>
                )
            }

            {/* MOOD PULSE ALERT */}
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
                        <div className="bg-primary-light dark:bg-black/50 dark:backdrop-blur-xl dark:border dark:border-white/10 w-full max-w-lg rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black flex items-center gap-2 dark:text-primary"><Mic className="w-5 h-5 text-red-500" /> Voice Journal</h2>
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
                        <DojoView user={dashboardUser} onClose={() => setShowDojo(false)} onUpdate={refreshData} />
                    </Suspense>
                )
            }
            {
                showShredder && (
                    <Suspense fallback={null}>
                        <ThoughtShredder onClose={() => setShowShredder(false)} />
                    </Suspense>
                )
            }
            {
                showSupportCircles && (
                    <SupportCircles onClose={() => setShowSupportCircles(false)} />
                )
            }
            {
                showWorldPulse && dashboardUser && (
                    <WorldPulse onClose={() => setShowWorldPulse(false)} />
                )
            }
            {
                showAgenticRouter && dashboardUser && (
                    <AgenticRouterModal
                        message={agentMessage}
                        onClose={() => setShowAgenticRouter(false)}
                        onAcceptAction={(action) => {
                            setShowAgenticRouter(false);
                            if (action === 'dojo') setShowDojo(true);
                            if (action === 'breathing') setShowBreathing(true);
                            if (action === 'soundscape') {
                                // Soundscape handled inside MoodTracker or just show toast for now
                                showToast("Soundscape Queued.", "success");
                            }
                        }}
                    />
                )
            }
            {
                showSerenityShop && dashboardUser && (
                    <SerenityShop
                        user={dashboardUser}
                        balance={balance}
                        onClose={() => setShowSerenityShop(false)}
                        onPurchase={async (cost, desc, itemId) => {
                            if (await UserService.deductBalance(cost, desc)) {
                                let updatedUser = { ...dashboardUser, balance: dashboardUser.balance - cost };

                                if (itemId && (itemId.startsWith('item-') || itemId.startsWith('digital-'))) {
                                    const currentDecor = updatedUser.unlockedDecor || [];
                                    if (!currentDecor.includes(itemId)) {
                                        updatedUser = { ...updatedUser, unlockedDecor: [...currentDecor, itemId] };
                                        await UserService.updateUser(updatedUser);
                                    }
                                }

                                setDashboardUser(updatedUser);
                                setShowSerenityShop(false);
                                showToast(`Acquired: ${desc}`, "success");
                            } else {
                                showToast("Transaction failed.", "error");
                            }
                        }}
                    />
                )
            }
        </div >
    );
};

export default Dashboard;
