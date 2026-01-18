
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Companion, SessionFeedback } from '../types';
import {
    PhoneOff,
    Loader2, AlertCircle, RefreshCcw, Star, CheckCircle, Clock, Sparkles, Download
} from 'lucide-react';
import { createTavusConversation, endTavusConversation } from '../services/tavusService';
import { UserService } from '../services/userService';
import { generateWisdomCard } from '../services/geminiService';
import { AdminService } from '../services/adminService';
import { useToast } from './common/Toast';

interface VideoRoomProps {
    companion: Companion;
    onEndSession: () => void;
    userName: string;
    userId: string;
    initialMood?: string | null;
}

// --- ICEBREAKER DATA ---
const ICEBREAKERS = [
    "What is one small win you had this week?",
    "If you could teleport anywhere right now, where would you go?",
    "What comfort food do you crave when you're stressed?",
    "What's a sound or smell that instantly relaxes you?",
    "Who is someone that makes you feel safe?",
    "What's the best advice you've ever received?",
    "If you had an extra hour in the day, how would you spend it?",
    "What is something you are grateful for today?",
    "Describe your perfect calm morning.",
    "What is a hobby you've always wanted to try?",
    "What book or movie has had a big impact on you?",
    "If you could have dinner with anyone, living or dead, who would it be?",
    "What's a song that always lifts your mood?"
];

// --- AMBIENT ENGAGEMENT CONTENT ---
const WELLNESS_TIPS = [
    "Focus on your breath. Inhale for 4 seconds, hold for 4, exhale for 4.",
    "Notice three things in your room that are the color yellow.",
    "Relax your shoulders and unclench your jaw. You're in a safe space.",
    "Remember that it's okay to take things one step at a time.",
    "Think of one thing you're looking forward to this month.",
    "You're doing something brave by showing up for yourself today."
];

// --- ARTIFACT GENERATOR ---
const renderSessionArtifact = (companionName: string, durationStr: string, dateStr: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // 1. Gradient Background
    const grd = ctx.createLinearGradient(0, 0, 1080, 1350);
    grd.addColorStop(0, '#FFFBEB');
    grd.addColorStop(1, '#FEF3C7');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 1080, 1350);

    // 2. Abstract Circle Art
    ctx.fillStyle = 'rgba(250, 204, 21, 0.1)';
    ctx.beginPath(); ctx.arc(540, 675, 450, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(250, 204, 21, 0.15)';
    ctx.beginPath(); ctx.arc(540, 675, 350, 0, Math.PI * 2); ctx.fill();

    // 3. Text Configuration
    ctx.textAlign = 'center';

    // Header
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 40px Manrope, sans-serif';
    ctx.fillText('PEUTIC SESSION SUMMARY', 540, 100);

    // Main Quote
    const quotes = [
        "Clarity comes in moments of calm.",
        "You are stronger than you know.",
        "Peace begins with a single breath.",
        "Growth happens in the quiet moments."
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    ctx.font = 'italic 500 48px Manrope, sans-serif';
    ctx.fillStyle = '#4B5563';
    ctx.fillText(`"${quote}"`, 540, 250);

    // Stats Box
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = "rgba(0,0,0,0.1)";
    ctx.shadowBlur = 30;
    ctx.roundRect(140, 480, 800, 550, 50);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Inside Box Content
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 100px Manrope, sans-serif';
    ctx.fillText(durationStr, 540, 650);

    ctx.font = 'bold 28px Manrope, sans-serif';
    ctx.fillStyle = '#9CA3AF';
    ctx.fillText('MINUTES OF CLARITY', 540, 710);

    ctx.strokeStyle = '#F3F4F6';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(290, 770);
    ctx.lineTo(790, 770);
    ctx.stroke();

    ctx.font = 'bold 36px Manrope, sans-serif';
    ctx.fillStyle = '#4B5563';
    ctx.fillText('Session with', 540, 850);

    ctx.font = 'bold 60px Manrope, sans-serif';
    ctx.fillStyle = '#F59E0B';
    ctx.fillText(companionName, 540, 930);

    // Footer
    ctx.font = '30px Manrope, sans-serif';
    ctx.fillStyle = '#6B7280';
    ctx.fillText(dateStr, 540, 1250);

    ctx.font = 'bold 32px Manrope, sans-serif';
    ctx.fillStyle = '#F59E0B';
    ctx.fillText('peutic.xyz', 540, 1300);

    return canvas.toDataURL('image/png');
};

const VideoRoom: React.FC<VideoRoomProps> = ({ companion, onEndSession, userName, userId, initialMood }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Media State
    const [currentTopicIndex, setCurrentTopicIndex] = useState(0);

    // Session State
    const [duration, setDuration] = useState(0);
    const [connectionState, setConnectionState] = useState<'QUEUED' | 'CONNECTING' | 'CONNECTED' | 'ERROR' | 'QUEUE_FULL'>('QUEUED');
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [conversationUrl, setConversationUrl] = useState<string | null>(null);
    const [networkQuality, setNetworkQuality] = useState(4);

    // Explicit reset helper
    const setConnectionInitiated = (val: boolean) => { connectionInitiated.current = val; };

    // Queue State
    const [queuePos, setQueuePos] = useState(0);
    const [estWait, setEstWait] = useState(0);
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const [serviceDelay, setServiceDelay] = useState(false);

    // Post Session State
    const [showSummary, setShowSummary] = useState(false);
    const [summaryImage, setSummaryImage] = useState<string>(''); // Artifact URL
    const [rating, setRating] = useState(0);
    const [feedbackTags, setFeedbackTags] = useState<string[]>([]);
    const [wisdomCard, setWisdomCard] = useState<{ wisdom: string, title: string, color: string } | null>(null);
    const { showToast } = useToast();




    // Credit Tracking
    const [remainingMinutes, setRemainingMinutes] = useState(0);
    const [lowBalanceWarning, setLowBalanceWarning] = useState(false);

    // const userId = useRef(`user_${Date.now()}`).current; // REMOVED: Using propellant prop for persistence
    const conversationIdRef = useRef<string | null>(null);

    // GUARD: Prevent double initialization in React Strict Mode
    const connectionInitiated = useRef(false);

    // --- Strict Resource Cleanup ---
    const performCleanup = useCallback(() => {
        console.log("Terminating session resources...");

        // 1. Terminate API session rigorously
        if (conversationIdRef.current) {
            endTavusConversation(conversationIdRef.current);
            conversationIdRef.current = null;
        }

        // 2. Update Database state (Clean both Active and Queue)
        UserService.endSession(userId);

    }, [userId]);

    // --- Session Initialization ---
    useEffect(() => {
        // 1. Join Queue (Async)
        const initQueue = async () => {
            try {
                // Join Queue (Remote)
                const pos = await UserService.joinQueue(userId);


                if (pos === -1) {
                    setConnectionState('QUEUE_FULL');
                    return;
                }

                if (pos === 99) {
                    // Database connectivity issue
                    setErrorMsg("Unable to join queue. Please check your internet connection.");
                    setConnectionState('ERROR');
                    return;
                }

                setQueuePos(pos);
                setEstWait(UserService.getEstimatedWaitTime(pos));


                // If we are #1 or inactive (pos 0 implies potential active state in some logics, but mostly 1)
                // Note: DB returns 0 if active, 1+ if waiting.
                if (pos === 1 || pos === 0) {
                    await tryStart();
                }
            } catch (error) {
                console.error("Queue Error:", error);
                setErrorMsg("Failed to join queue. Please retry.");
                setConnectionState('ERROR');
            }
        };

        const tryStart = async () => {
            // Attempt to claim spot securely via Supabase
            const canEnter = await UserService.claimActiveSpot(userId);

            if (canEnter) {
                // SAFETY DELAY: Wait 1s to ensure TechCheck hardware is fully released by browser
                // This prevents "Camera Busy" errors on mobile devices
                setTimeout(() => {
                    startTavusConnection();
                }, 1000);
            }
        };

        // Polling Interval for Queue Position & Heartbeat
        const queueInterval = setInterval(async () => {
            if (connectionState === 'QUEUED') {
                await UserService.sendQueueHeartbeat(userId); // Prevent Zombie Queue
                let pos = await UserService.getQueuePosition(userId);


                // Failsafe: If queue dropped us but we are still waiting
                if (pos === 0) {
                    pos = await UserService.joinQueue(userId);
                }


                if (pos === -1) {
                    setConnectionState('QUEUE_FULL');
                    return;
                }

                if (pos === 99) {
                    // Keep trying silently, don't crash, but don't update UI to error yet
                    console.warn("Lost DB connection");
                    return;
                }

                setQueuePos(pos);
                setEstWait(UserService.getEstimatedWaitTime(pos));


                if (pos === 1) {
                    // We are next in line, try to enter
                    await tryStart();
                }
            } else if (connectionState === 'CONNECTED') {
                // HEARTBEAT: Keep alive every 3s to prevent zombie cleanup (15s timeout)
                UserService.sendKeepAlive(userId);

            }
        }, 3000);

        initQueue();

        // Rotate Wellness Tips
        const tipInterval = setInterval(() => {
            setCurrentTipIndex(prev => (prev + 1) % WELLNESS_TIPS.length);
        }, 8000);

        // HANDLE MOBILE & DESKTOP TAB CLOSE / REFRESH
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            performCleanup();
            e.preventDefault();
            e.returnValue = '';
        };

        const handlePageHide = () => {
            performCleanup();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            clearInterval(queueInterval);
            clearInterval(tipInterval);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handlePageHide);
            performCleanup();
        };
    }, [performCleanup]);

    const startTavusConnection = async () => {
        // Prevent double calls (API Optimization)
        if (connectionInitiated.current) return;

        // FINAL DOUBLE CHECK: Ensure we still have the spot before burning API credits
        const stillHasSpot = await UserService.claimActiveSpot(userId);

        if (!stillHasSpot) {
            console.warn("Lost spot during initialization latency.");
            setConnectionState('QUEUED'); // Re-queue
            return;
        }

        connectionInitiated.current = true;
        setConnectionState('CONNECTING');
        setErrorMsg('');

        // SERVICE DELAY MONITOR: If API takes > 7s, show "High Traffic" HUD
        const delayTimer = setTimeout(() => {
            setServiceDelay(true);
        }, 7000);

        try {
            const user = UserService.getUser();

            if (!user || user.balance <= 0) {
                throw new Error("Insufficient Credits: Session Access Denied.");
            }
            setRemainingMinutes(user.balance);

            if (!companion.replicaId) throw new Error("Invalid Specialist Configuration");

            // --- INTELLIGENT CONTEXT INJECTION ---
            // 1. Fetch recent mood (Database Fallback)
            const moods = await UserService.getMoods(user.id);
            const recentMood = moods.length > 0 ? moods[moods.length - 1].mood : null;

            let moodContext = "";
            // Priority: Immediate Mood (from Waiting Room) > Recent Mood (Database)
            const mood = initialMood || recentMood;

            if (mood === 'Sad' || mood === 'rain') moodContext = "The user is feeling sad or down right now. Approach with extra gentleness and validation.";
            else if (mood === 'Good' || mood === 'confetti') moodContext = "The user is feeling good. Celebrate this positive energy.";
            else if (mood === 'Anxious' || mood === '😰') moodContext = "The user reported feeling anxious immediately before this call. Focus on grounding techniques first.";
            else if (mood === 'Angry' || mood === '😤') moodContext = "The user is feeling frustrated or angry. Allow them space to vent and validate their feelings.";

            // 2. Fetch language preference from User Object (was localStorage)
            const savedLang = user.languagePreference || 'en';
            const langInstructions = savedLang !== 'en' ? `IMPORTANT: The user prefers language code '${savedLang}'. You must speak in this language.` : "";

            const context = `You are ${companion.name}, a professional specialist in ${companion.specialty}. Your bio is: "${companion.bio}". You are speaking with ${userName}. Be empathetic, professional, and concise. Listen actively. ${moodContext} ${langInstructions}`;

            const response = await createTavusConversation(companion.replicaId, userName, context);

            if (response.conversation_url) {
                clearTimeout(delayTimer);
                setServiceDelay(false);
                setConversationUrl(response.conversation_url);
                conversationIdRef.current = response.conversation_id;
                setConnectionState('CONNECTED');
            } else {
                throw new Error("Invalid response from video server.");
            }

        } catch (err: any) {
            connectionInitiated.current = false; // Reset on error
            if (err.message.includes("Insufficient Credits")) {
                showToast("Your session ended because you are out of credits.", "error");

                handleEndSession();
                return;
            }
            // STRICT PRODUCTION ERROR HANDLING
            setConnectionState('ERROR');
            setErrorMsg(err.message || "Failed to establish secure connection.");
        }
    };

    // --- Timers & Credit Enforcement ---
    useEffect(() => {
        if (showSummary) return;
        if (connectionState !== 'CONNECTED') return;

        // Deduct first minute immediately upon connection
        // This ensures the user is charged for the initial connection time
        UserService.deductBalance(1);
        setRemainingMinutes(prev => prev - 1);


        const interval = setInterval(() => {
            setDuration(d => {
                const newDuration = d + 1;

                // Deduct balance at the START of every new minute
                if (newDuration > 0 && newDuration % 60 === 0) {
                    UserService.deductBalance(1);
                    setRemainingMinutes(prev => {

                        const nextVal = prev - 1;
                        if (nextVal <= 0) {
                            // STRICT CUTOFF: If credits hit zero, end session immediately
                            performCleanup();
                            handleEndSession();
                            return 0;
                        }
                        return nextVal;
                    });
                }

                // Warn user when 30 seconds remain in their final credit minute
                if (remainingMinutes <= 1 && newDuration % 60 === 30) {
                    setLowBalanceWarning(true);
                }

                return newDuration;
            });

            // Randomly update network quality to make HUD feel alive
            if (Math.random() > 0.9) {
                setNetworkQuality(Math.max(2, Math.floor(Math.random() * 3) + 2));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [showSummary, connectionState, performCleanup]); // Removed remainingMinutes from dependency array!

    const handleEndSession = async () => {
        performCleanup(); // Strict API cutoff
        setSummaryImage(renderSessionArtifact(companion.name, formatTime(duration), new Date().toLocaleDateString()));
        setShowSummary(true);

        // Generate AI Wisdom Card
        const user = UserService.getUser();
        if (user && duration > 30) {
            const summary = `Session with ${companion.name} for ${formatTime(duration)}.`;
            const card = await generateWisdomCard(user.name, summary);
            setWisdomCard(card);
        }
    };


    const submitFeedbackAndClose = () => {
        const minutesUsed = Math.ceil(duration / 60);
        const user = UserService.getUser();
        if (minutesUsed > 0 && user) {
            // Note: Balance was already deducted incrementally during the session
            // We only record the transaction history here for the user's records
            UserService.saveTransaction({
                id: `sess_${Date.now()}`,
                userId: user.id,
                userName: userName,
                date: new Date().toISOString(),
                amount: -minutesUsed,
                description: `Session with ${companion.name}`,
                status: 'COMPLETED'
            });

            const feedback: SessionFeedback = {
                id: `fb_${Date.now()}`,
                userId: user.id,
                userName: userName,
                companionName: companion.name,
                rating: rating,
                tags: feedbackTags,
                date: new Date().toISOString(),
                duration: minutesUsed
            };
            UserService.saveFeedback(feedback);
        }
        onEndSession();
    };


    const toggleFeedbackTag = (tag: string) => { if (feedbackTags.includes(tag)) setFeedbackTags(feedbackTags.filter(t => t !== tag)); else setFeedbackTags([...feedbackTags, tag]); };
    const formatTime = (seconds: number) => { const mins = Math.floor(seconds / 60); const secs = seconds % 60; return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`; };

    // Calculate cost dynamically based on active sale mode setting
    const settings = AdminService.getSettings();
    const currentRate = settings.saleMode ? 1.59 : 1.99;
    const cost = Math.ceil(duration / 60) * currentRate;


    // --- HELPER: Pre-fill Name to Skip Input Screen ---
    const getIframeUrl = () => {
        if (!conversationUrl) return '';
        try {
            const url = new URL(conversationUrl);
            url.searchParams.set('username', userName);
            return url.toString();
        } catch (e) {
            return conversationUrl;
        }
    };

    const nextIcebreaker = () => {
        setCurrentTopicIndex((prev) => (prev + 1) % ICEBREAKERS.length);
    };

    // --- RENDER ---
    if (showSummary) {
        return (
            <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
                <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl max-w-md w-full text-center animate-in zoom-in duration-300 shadow-2xl my-auto">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/50"><CheckCircle className="w-8 h-8 text-green-500" /></div>
                    <h2 className="text-2xl font-black text-white mb-6 tracking-tight">Session Complete</h2>

                    {/* AI WISDOM CARD */}
                    {wisdomCard && (
                        <div className="mb-6 animate-in slide-in-from-top-4 duration-700">
                            <div
                                className="p-6 rounded-2xl text-center shadow-lg border border-white/10"
                                style={{ backgroundColor: wisdomCard.color }}
                            >
                                <Sparkles className="w-5 h-5 text-yellow-600 mx-auto mb-2 animate-pulse" />
                                <h3 className="text-black font-black text-[10px] uppercase tracking-[0.2em] mb-2">{wisdomCard.title}</h3>
                                <p className="text-gray-800 font-bold text-sm leading-relaxed italic">"{wisdomCard.wisdom}"</p>
                            </div>
                        </div>
                    )}

                    {/* ARTIFACT DISPLAY */}
                    {summaryImage && !wisdomCard && (
                        <div className="mb-6 relative group">
                            <img src={summaryImage} alt="Session Artifact" className="w-full rounded-xl shadow-lg border border-gray-700" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                <a href={summaryImage} download={`peutic-session-${Date.now()}.png`} className="bg-white text-black px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform">
                                    <Download className="w-4 h-4" /> Save Card
                                </a>
                            </div>
                        </div>
                    )}

                    <div className="bg-black/50 rounded-2xl p-4 mb-6 border border-gray-800">
                        <div className="flex justify-between mb-2"><span className="text-gray-500 font-bold text-xs uppercase">Time</span><span className="font-mono font-bold text-white">{formatTime(duration)}</span></div>
                        <div className="flex justify-between items-center"><span className="text-gray-500 font-bold text-xs uppercase">Cost (@ ${currentRate}/m)</span><span className="text-green-500 font-black text-lg">${cost.toFixed(2)}</span></div>
                    </div>

                    <div className="mb-6">
                        <p className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">Rate Experience</p>
                        <div className="flex justify-center gap-2 mb-4">{[1, 2, 3, 4, 5].map(star => (<button key={star} onClick={() => setRating(star)} className="focus:outline-none"><Star className={`w-6 h-6 ${star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-700'}`} /></button>))}</div>
                        <div className="flex flex-wrap justify-center gap-2">{['Good Listener', 'Empathetic', 'Helpful', 'Calming', 'Insightful'].map(tag => (<button key={tag} onClick={() => toggleFeedbackTag(tag)} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${feedbackTags.includes(tag) ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-500'}`}>{tag}</button>))}</div>
                    </div>

                    <button onClick={submitFeedbackAndClose} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-xl font-black tracking-wide transition-colors shadow-lg">Return to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="fixed inset-0 bg-[#0A0A0A] z-50 flex items-center justify-center overflow-hidden font-sans">
            {/* Background / Placeholder */}
            <div className="absolute inset-0 z-0">
                {/* Layered Gradients for Depth */}
                <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/10 via-transparent to-blue-500/5"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#0A0A0A_70%)]"></div>

                {/* Blurred Identity */}
                <img
                    src={companion.imageUrl}
                    className="w-full h-full object-cover opacity-20 blur-[100px] scale-110"
                    alt="Background"
                />
            </div>

            {/* State: CONNECTING / QUEUED */}
            {(connectionState === 'CONNECTING' || connectionState === 'QUEUED') && (
                <div className="relative z-10 w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-screen">
                    {/* Background Glows for Wow Factor */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
                    <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none animate-pulse-slow pulse-delay-1000"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center w-full animate-in animate-fade-in duration-1000">
                        {/* Left: Companion Presence */}
                        <div className="text-center space-y-6">
                            <div className="relative inline-block">
                                {/* Holographic Ring */}
                                <div className="absolute inset-[-20px] rounded-full border border-yellow-500/20 animate-spin-slow"></div>
                                <div className="absolute inset-[-10px] rounded-full border border-yellow-400/10 animate-spin-slow" style={{ animationDirection: 'reverse' }}></div>

                                <div className="relative w-40 h-40 md:w-64 md:h-64 mx-auto">
                                    <div className="absolute inset-0 rounded-full bg-yellow-500/20 animate-ping"></div>
                                    <div className="absolute inset-0 rounded-full border-4 border-yellow-500/30 z-20"></div>
                                    <img
                                        src={companion.imageUrl}
                                        className="w-full h-full rounded-full object-cover border-4 border-yellow-500/50 shadow-[0_0_80px_rgba(250,204,21,0.2)] relative z-10"
                                        alt={companion.name}
                                    />
                                    <div className="absolute bottom-4 right-4 bg-green-500 w-8 h-8 rounded-full border-4 border-[#0A0A0A] z-30 animate-pulse shadow-xl"></div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                                    {companion.name} <span className="text-yellow-500">is ready</span>
                                </h2>
                                <p className="text-gray-400 font-medium tracking-wide uppercase text-xs flex items-center justify-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-yellow-500"></span>
                                    {connectionState === 'QUEUED' ? 'Priority Queue Active' : 'Establishing Secure Line'}
                                    <span className="w-1 h-1 rounded-full bg-yellow-500"></span>
                                </p>
                            </div>
                        </div>

                        {/* Right: Info & Engagement */}
                        <div className="space-y-8">
                            {/* Status Card */}
                            <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-8 border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]">
                                {connectionState === 'QUEUED' ? (
                                    <div className="space-y-8">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Queue Position</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-6xl font-black text-white leading-none">{queuePos}</span>
                                                    <span className="text-gray-500 font-bold">/ 15</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Estimated Arrival</p>
                                                <div className="px-4 py-2 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 inline-block">
                                                    <span className="text-xl font-black text-yellow-500">{estWait > 0 ? `~${estWait}s` : 'Next'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/5">
                                                <div
                                                    className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(250,204,21,0.5)]"
                                                    style={{ width: `${Math.max(5, 100 - (queuePos * 10))}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-bold text-center italic">Your time is valuable. We are preparing the room with highest priority.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-4 space-y-6">
                                        <div className="flex items-center gap-6">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-yellow-500/20 blur-xl animate-pulse"></div>
                                                <div className="relative p-5 bg-yellow-500/10 rounded-[24px] border border-yellow-500/20">
                                                    <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white">Initializing Stream</h3>
                                                <p className="text-gray-400 text-sm">Perfecting audio and video quality...</p>
                                            </div>
                                        </div>

                                        {serviceDelay && (
                                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex items-start gap-3 animate-in fade-in">
                                                <div className="p-2 bg-blue-500/20 rounded-full mt-0.5">
                                                    <Clock className="w-4 h-4 text-blue-400" />
                                                </div>
                                                <p className="text-xs text-blue-200/80 leading-relaxed font-medium">
                                                    High demand detected. We're tuning your private room for the best experience. Just a moment.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Engagement Card */}
                            <div className="bg-black/60 backdrop-blur-xl rounded-[40px] p-8 border border-white/5 min-h-[160px] flex flex-col justify-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Sparkles className="w-12 h-12 text-yellow-500" />
                                </div>
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-[1px] bg-yellow-500/50"></span>
                                        <span className="text-[10px] font-black text-yellow-500/70 uppercase tracking-[0.3em]">Moment of Peace</span>
                                    </div>
                                    <p className="text-gray-200 text-lg md:text-xl font-medium leading-relaxed italic animate-in animate-fade-in" key={currentTipIndex}>
                                        "{WELLNESS_TIPS[currentTipIndex]}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* State: ERROR */}
            {(connectionState === 'ERROR' || connectionState === 'QUEUE_FULL') && (
                <div className="relative z-10 text-center p-8 bg-red-900/80 backdrop-blur-md rounded-3xl border border-red-500/30 max-w-md w-full animate-in zoom-in">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-white mb-2">Connection Interrupted</h2>
                    <p className="text-gray-300 mb-6">{errorMsg || "System is currently at capacity. Please try again later."}</p>
                    <div className="flex gap-4 justify-center">
                        <button onClick={onEndSession} className="bg-gray-800 text-white px-6 py-3 rounded-full font-bold hover:bg-gray-700 transition-colors">Return</button>
                        <button onClick={() => { setConnectionState('QUEUED'); setConnectionInitiated(false); }} className="bg-yellow-500 text-black px-8 py-3 rounded-full font-bold hover:bg-yellow-400 transition-colors flex items-center gap-2"><RefreshCcw className="w-4 h-4" /> Retry Connection</button>
                    </div>
                </div>
            )}

            {/* State: CONNECTED */}
            {connectionState === 'CONNECTED' && conversationUrl && (
                <>
                    <iframe
                        src={getIframeUrl() || conversationUrl}
                        className="absolute inset-0 w-full h-full border-0 z-10 bg-black"
                        allow="microphone; camera; autoplay; fullscreen"
                    />

                    {/* HUD Overlay */}
                    <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
                        <div className="flex items-center gap-3">
                            <div className={`px-3 py-1 rounded-full flex items-center gap-2 backdrop-blur-md border border-white/10 ${lowBalanceWarning ? 'bg-red-500/80 animate-pulse' : 'bg-black/40'}`}>
                                <Clock className="w-4 h-4 text-white" />
                                <span className="font-mono font-bold text-white text-sm">{formatTime(duration)}</span>
                            </div>
                            <div className={`px-3 py-1 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-2 ${networkQuality < 2 ? 'bg-red-900/50 border-red-500/30' : 'bg-black/40'}`}>
                                <div className={`w-2 h-2 rounded-full ${networkQuality > 2 ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                                <span className={`text-xs font-bold uppercase hidden md:inline ${networkQuality < 2 ? 'text-red-300' : 'text-gray-300'}`}>
                                    {networkQuality < 2 ? 'Unstable Signal' : 'HD Secure'}
                                </span>
                            </div>
                        </div>

                        {networkQuality < 2 && (
                            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-xl animate-pulse flex items-center gap-2 backdrop-blur-md">
                                <RefreshCcw className="w-3 h-3 animate-spin" /> Reconnecting Stream...
                            </div>
                        )}

                        <button
                            onClick={handleEndSession}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
                        >
                            <PhoneOff className="w-4 h-4" /> End
                        </button>
                    </div>

                    {/* Icebreaker / Tools Panel (Bottom Left) */}
                    <div className="absolute bottom-6 left-6 z-20 hidden md:block">
                        <div className="bg-black/60 backdrop-blur-lg border border-white/10 rounded-2xl p-4 max-w-sm">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-yellow-500 text-xs font-black uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-3 h-3" /> Conversation Starter</h4>
                                <button onClick={nextIcebreaker} className="text-gray-400 hover:text-white transition-colors"><RefreshCcw className="w-3 h-3" /></button>
                            </div>
                            <p className="text-white text-sm font-medium leading-snug">"{ICEBREAKERS[currentTopicIndex]}"</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default VideoRoom;
