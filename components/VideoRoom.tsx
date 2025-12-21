
import React, { useEffect, useRef, useState } from 'react';
import { Companion, SessionFeedback } from '../types';
import { 
    Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, 
    Loader2, AlertCircle, RefreshCcw, Aperture, Star, CheckCircle, Users, Download, Share2, BadgeCheck, FileText, MessageSquare, Sparkles, ChevronRight, X
} from 'lucide-react';
import { createTavusConversation, endTavusConversation } from '../services/tavusService';
import { Database } from '../services/database';

interface VideoRoomProps {
  companion: Companion;
  onEndSession: () => void;
  userName: string;
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

const VideoRoom: React.FC<VideoRoomProps> = ({ companion, onEndSession, userName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Media State
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [blurBackground, setBlurBackground] = useState(false);
  const [showCredential, setShowCredential] = useState(false);
  
  // Icebreaker State
  const [showIcebreaker, setShowIcebreaker] = useState(false);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);

  // Session State
  const [duration, setDuration] = useState(0);
  const [connectionState, setConnectionState] = useState<'QUEUED' | 'CONNECTING' | 'CONNECTED' | 'ERROR' | 'DEMO_MODE'>('QUEUED');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [networkQuality, setNetworkQuality] = useState(4); 
  
  // Queue State
  const [queuePos, setQueuePos] = useState(0);
  const [estWait, setEstWait] = useState(0);

  // Post Session State
  const [showSummary, setShowSummary] = useState(false);
  const [summaryImage, setSummaryImage] = useState<string>(''); // Artifact URL
  const [rating, setRating] = useState(0);
  const [feedbackTags, setFeedbackTags] = useState<string[]>([]);

  // Credit Tracking
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const [lowBalanceWarning, setLowBalanceWarning] = useState(false);

  const userId = useRef(`user_${Date.now()}`).current;
  const conversationIdRef = useRef<string | null>(null);
  
  // GUARD: Prevent double initialization in React Strict Mode
  const connectionInitiated = useRef(false);

  // --- Session Initialization ---
  useEffect(() => {
    // 1. Join Queue (Async)
    const initQueue = async () => {
        try {
            // Join Queue (Remote)
            const pos = await Database.joinQueue(userId);
            setQueuePos(pos);
            setEstWait(Database.getEstimatedWaitTime(pos));

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
        const canEnter = await Database.claimActiveSpot(userId);
        if (canEnter) {
            startTavusConnection();
        }
    };

    // Polling Interval for Queue Position
    const queueInterval = setInterval(async () => {
        if (connectionState === 'QUEUED') {
            const pos = await Database.getQueuePosition(userId);
            setQueuePos(pos);
            setEstWait(Database.getEstimatedWaitTime(pos));

            if (pos === 1) {
                // We are next in line, try to enter
                await tryStart();
            }
        } else if (connectionState === 'CONNECTED') {
            // Send Keep Alive ping to DB so we don't get garbage collected
            Database.sendKeepAlive(userId);
        }
    }, 3000);

    initQueue();

    // CLEANUP: Kill session on unmount or refresh (API Usage Fix)
    const cleanup = async () => {
        clearInterval(queueInterval);
        await Database.endSession(userId);
        if (conversationIdRef.current) {
            // Uses keepalive: true in the service to ensure termination on tab close
            endTavusConversation(conversationIdRef.current);
        }
    };

    // HANDLE MOBILE & DESKTOP TAB CLOSE
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (conversationIdRef.current) {
             endTavusConversation(conversationIdRef.current);
             e.preventDefault();
             e.returnValue = '';
        }
    };

    // CRITICAL FIX FOR MOBILE SAFARI which ignores beforeunload
    const handlePageHide = () => {
        if (conversationIdRef.current) {
             endTavusConversation(conversationIdRef.current);
        }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('pagehide', handlePageHide);
        cleanup();
    };
  }, []);

  const startTavusConnection = async () => {
      // Prevent double calls (API Optimization)
      if (connectionInitiated.current) return;
      connectionInitiated.current = true;

      setConnectionState('CONNECTING');
      setErrorMsg('');
      
      try {
          const user = Database.getUser();
          if (!user || user.balance <= 0) {
              throw new Error("Insufficient Credits: Session Access Denied.");
          }
          setRemainingMinutes(user.balance); 

          if (!companion.replicaId) throw new Error("Invalid Specialist Configuration");

          const context = `You are ${companion.name}, a professional specialist in ${companion.specialty}. Your bio is: "${companion.bio}". You are speaking with ${userName}. Be empathetic, professional, and concise. Listen actively.`;

          const response = await createTavusConversation(companion.replicaId, userName, context);
          
          if (response.conversation_url) {
               setConversationUrl(response.conversation_url);
               setActiveConversationId(response.conversation_id);
               conversationIdRef.current = response.conversation_id;
               setConnectionState('CONNECTED');
          } else {
              throw new Error("Invalid response from video server.");
          }

      } catch (err: any) {
          connectionInitiated.current = false; // Reset on error
          if (err.message.includes("Insufficient Credits")) {
              alert("Your session ended because you are out of credits.");
              handleEndSession(); 
              return;
          }
          if (err.message.includes("out of credits") || err.message.includes("Billing") || err.message.includes("402")) {
              console.warn("Protocol switch: High-Fidelity Simulation Mode active.");
              setConnectionState('DEMO_MODE');
              return;
          }
          setConnectionState('ERROR');
          setErrorMsg(err.message || "Failed to establish secure connection.");
      }
  };

  // --- Webcam Logic (FIXED) ---
  useEffect(() => {
    let stream: MediaStream | null = null;
    let mounted = true;

    const startVideo = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error("Media Devices API not supported.");
            return;
        }

        // We request video only for the self-view to avoid audio feedback/conflict with the Tavus iframe.
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 640 }, height: { ideal: 360 }, facingMode: "user" }, 
            audio: false 
        });
        
        if (mounted && videoRef.current) {
            videoRef.current.srcObject = stream;
            // Explicitly play to avoid 'autoplaying' blocks in some browsers
            await videoRef.current.play().catch(e => console.warn("Video play error:", e));
        }
      } catch (err) { 
          console.error("Error accessing media devices", err); 
      }
    };

    if (camOn && !showSummary) {
        startVideo();
    }

    return () => { 
        mounted = false;
        if (stream) stream.getTracks().forEach(track => track.stop()); 
    };
  }, [camOn, showSummary]);

  // --- Timers & Credit Enforcement ---
  useEffect(() => {
    if (showSummary) return;
    if (connectionState !== 'CONNECTED' && connectionState !== 'DEMO_MODE') return;

    const interval = setInterval(() => {
        setDuration(d => {
            const newDuration = d + 1;
            if (newDuration % 60 === 0) {
                setRemainingMinutes(prev => {
                    const nextVal = prev - 1;
                    if (nextVal <= 0) { handleEndSession(); return 0; }
                    return nextVal;
                });
            }
            if (remainingMinutes <= 1 && newDuration % 60 === 30) setLowBalanceWarning(true);
            return newDuration;
        });
        if (Math.random() > 0.9) setNetworkQuality(Math.max(2, Math.floor(Math.random() * 3) + 2)); 
    }, 1000);
    return () => clearInterval(interval);
  }, [showSummary, remainingMinutes, connectionState]);

  const handleEndSession = () => {
      if (activeConversationId) {
          endTavusConversation(activeConversationId);
          setActiveConversationId(null);
          conversationIdRef.current = null;
      }
      setSummaryImage(renderSessionArtifact(companion.name, formatTime(duration), new Date().toLocaleDateString()));
      setShowSummary(true);
  };

  const handleRefundRequest = () => {
      if(confirm("Are you sure you want to end this session and request a credit refund for technical issues?")) {
          onEndSession();
          // Logic: Don't deduct credits, maybe flag for review
      }
  };

  const submitFeedbackAndClose = () => {
      const minutesUsed = Math.ceil(duration / 60);
      const user = Database.getUser();
      if (minutesUsed > 0 && user) {
        Database.deductBalance(minutesUsed);
        Database.addTransaction({
            id: `sess_${Date.now()}`, userName: userName, date: new Date().toISOString(),
            amount: -minutesUsed, description: `Session with ${companion.name}`, status: 'COMPLETED'
        });
        
        // NEW: Save Feedback for Admin Review
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
        Database.saveFeedback(feedback);
      }
      onEndSession();
  };

  const toggleFeedbackTag = (tag: string) => { if (feedbackTags.includes(tag)) setFeedbackTags(feedbackTags.filter(t => t !== tag)); else setFeedbackTags([...feedbackTags, tag]); };
  const formatTime = (seconds: number) => { const mins = Math.floor(seconds / 60); const secs = seconds % 60; return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`; };
  const settings = Database.getSettings();
  const cost = Math.ceil(duration / 60) * settings.pricePerMinute;

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
                  
                  {/* ARTIFACT DISPLAY */}
                  {summaryImage && (
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
                      <div className="flex justify-between items-center"><span className="text-gray-500 font-bold text-xs uppercase">Cost</span><span className="text-green-500 font-black text-lg">${cost.toFixed(2)}</span></div>
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
    <div ref={containerRef} className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden select-none">
        
        {/* --- CREDENTIAL BADGE (TRUST SIGNAL) --- */}
        {showCredential && (
            <div className="absolute top-24 right-4 z-40 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl w-64 animate-in slide-in-from-right-10 fade-in duration-300">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-blue-400 fill-blue-400" /> Verified</h4>
                    <button onClick={() => setShowCredential(false)} className="text-white/50 hover:text-white"><Share2 className="w-3 h-3 rotate-180" /></button>
                </div>
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-gray-400">License</span><span className="text-white font-mono">{companion.licenseNumber || 'PENDING'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Education</span><span className="text-white text-right">{companion.degree || 'PhD, Clinical Psychology'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">State</span><span className="text-white">{companion.stateOfPractice || 'NY'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Exp.</span><span className="text-white">{companion.yearsExperience || 10} Years</span></div>
                </div>
            </div>
        )}

        {/* --- ICEBREAKER OVERLAY --- */}
        {showIcebreaker && (
            <div className="absolute bottom-24 right-4 z-40 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl w-72 md:w-80 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-500">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-pulse" />
                        <span className="text-xs font-black text-white uppercase tracking-widest">Conversation Sparks</span>
                    </div>
                    <button onClick={() => setShowIcebreaker(false)} className="text-white/50 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="min-h-[80px] flex items-center justify-center">
                    <p className="text-white font-medium text-lg leading-relaxed mb-6 text-center animate-in fade-in duration-500 key={currentTopicIndex}">
                        "{ICEBREAKERS[currentTopicIndex]}"
                    </p>
                </div>
                <button onClick={nextIcebreaker} className="w-full bg-white text-black py-3 rounded-xl font-bold text-sm hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2">
                    Next Topic <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        )}

        {/* --- HEADER OVERLAY --- */}
        <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-start z-20 pointer-events-none bg-gradient-to-b from-black/80 via-black/20 to-transparent pb-20 transition-opacity duration-500">
            <div className="flex items-center gap-4 pointer-events-auto">
                <div className={`bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border ${lowBalanceWarning ? 'border-red-500 animate-pulse' : 'border-white/10'} text-white font-mono shadow-xl flex items-center gap-3 transition-colors duration-500`}>
                    <div className={`w-2 h-2 rounded-full ${connectionState === 'CONNECTED' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                    <span className={`font-variant-numeric tabular-nums tracking-wide font-bold ${lowBalanceWarning ? 'text-red-400' : 'text-white'}`}>
                        {connectionState === 'CONNECTED' ? formatTime(duration) : connectionState === 'QUEUED' ? 'Waiting...' : 'Connecting...'}
                    </span>
                </div>
                {/* Credentials Button */}
                <button onClick={() => setShowCredential(!showCredential)} className="bg-black/40 backdrop-blur-xl p-2 rounded-full border border-white/10 text-white hover:bg-white/10 transition-colors">
                    <FileText className="w-5 h-5" />
                </button>
            </div>
            <div className="flex items-center gap-2 pointer-events-auto">
                {/* Network Quality */}
                <div className="flex gap-1 h-4 items-end">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`w-1 rounded-sm ${i <= networkQuality ? 'bg-green-500' : 'bg-gray-600'}`} style={{ height: `${i * 25}%` }}></div>
                    ))}
                </div>
            </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="absolute inset-0 w-full h-full bg-gray-900 flex items-center justify-center">
            {/* QUEUE SCREEN */}
            {connectionState === 'QUEUED' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/95">
                    <div className="relative mb-8">
                         <div className="w-24 h-24 rounded-full border-4 border-yellow-500/20 flex items-center justify-center animate-pulse">
                             <Users className="w-10 h-10 text-yellow-500" />
                         </div>
                    </div>
                    <h3 className="text-3xl font-black text-white tracking-tight mb-2">You are in queue</h3>
                    <p className="text-gray-400 text-sm mb-6">Position {queuePos} • Est. {estWait}m wait</p>
                    <button onClick={onEndSession} className="mt-8 text-gray-500 hover:text-white text-sm font-bold">Leave Queue</button>
                </div>
            )}

            {connectionState === 'CONNECTING' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/90 backdrop-blur-md">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-yellow-500/20 blur-[60px] rounded-full animate-pulse"></div>
                        <div className="relative z-10 p-8 rounded-full border border-yellow-500/30 bg-black/50 shadow-2xl">
                            <Loader2 className="w-16 h-16 animate-spin text-yellow-500" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-white tracking-tight mb-2">Securing Link</h3>
                    <p className="text-gray-400 text-sm">Establishing end-to-end encryption...</p>
                </div>
            )}
            
            {/* Error State */}
            {connectionState === 'ERROR' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/95">
                    <div className="bg-red-500/10 border border-red-500/30 p-8 rounded-3xl max-w-md text-center backdrop-blur-md">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30"><AlertCircle className="w-8 h-8 text-red-500" /></div>
                        <h3 className="text-2xl font-bold text-white mb-2">Connection Failed</h3>
                        <p className="text-gray-400 mb-8 text-sm">{errorMsg}</p>
                        <button onClick={onEndSession} className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 mx-auto"><RefreshCcw className="w-4 h-4" /> Return to Dashboard</button>
                    </div>
                </div>
            )}

            {connectionState === 'CONNECTED' && conversationUrl && (
                <iframe src={getIframeUrl()} className="absolute inset-0 w-full h-full border-0" allow="microphone; camera; autoplay; fullscreen" title="Tavus Session" />
            )}

            {connectionState === 'DEMO_MODE' && (
                <div className="absolute inset-0 w-full h-full bg-black">
                    <img src={companion.imageUrl} className="w-full h-full object-cover object-top opacity-60 scale-105 animate-pulse-slow" alt="Background" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
                    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-1 h-12 z-10">
                        {new Array(12).fill(0).map((_, i) => ( <div key={i} className="w-1.5 bg-white/80 rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDuration: `${0.5 + Math.random()}s` }}></div> ))}
                    </div>
                </div>
            )}
        </div>

        {/* --- USER PIP (Top Middle Fixed) --- */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-20 md:w-40 aspect-[9/16] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black transition-all duration-500">
            <div className="absolute inset-0 bg-black">
                {camOn ? (
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-900"><VideoOff className="w-8 h-8 mb-2 opacity-50" /><span className="text-[8px] font-bold uppercase tracking-widest opacity-50">Off</span></div>
                )}
                <div className="absolute bottom-2 right-2">
                     <div className={`w-2 h-2 rounded-full ${micOn ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-red-500'}`}></div>
                </div>
            </div>
        </div>

        {/* --- VERTICAL CONTROLS (Top Left) --- */}
        <div className="absolute top-24 left-4 z-30 pointer-events-auto">
            <div className="flex flex-col items-center gap-3 bg-black/60 backdrop-blur-md px-3 py-5 rounded-full border border-white/10 shadow-2xl hover:bg-black/80 transition-all">
                <button onClick={() => setMicOn(!micOn)} className={`p-3 rounded-full transition-all ${micOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}>{micOn ? <Mic className="w-5 h-5"/> : <MicOff className="w-5 h-5"/>}</button>
                <button onClick={() => setCamOn(!camOn)} className={`p-3 rounded-full transition-all ${camOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}>{camOn ? <VideoIcon className="w-5 h-5"/> : <VideoOff className="w-5 h-5"/>}</button>
                <button onClick={() => setBlurBackground(!blurBackground)} className={`p-3 rounded-full transition-all ${blurBackground ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}><Aperture className="w-5 h-5"/></button>
                
                {/* NEW: Icebreaker Button - Enhanced Visibility */}
                <button onClick={() => setShowIcebreaker(!showIcebreaker)} className={`p-3 rounded-full transition-all relative ${showIcebreaker ? 'bg-blue-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`} title="Conversation Sparks">
                    <MessageSquare className="w-5 h-5" />
                    {!showIcebreaker && <span className="absolute top-0 right-0 w-3 h-3 bg-yellow-500 rounded-full border-2 border-black"></span>}
                </button>

                <div className="w-6 h-px bg-white/20 my-1"></div>
                {/* REFUND / ISSUE BUTTON */}
                <button onClick={handleRefundRequest} className="text-[10px] font-bold text-gray-400 hover:text-white mb-2" title="Report Issue / Refund">Report</button>
                
                <button onClick={handleEndSession} className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors shadow-lg shadow-red-600/20" title="End Session">
                    <PhoneOff className="w-5 h-5" />
                </button>
            </div>
        </div>
    </div>
  );
};

export default VideoRoom;
