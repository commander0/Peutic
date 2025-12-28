import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Companion, SessionFeedback } from '../types';
import { 
    Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, 
    Loader2, AlertCircle, RefreshCcw, Aperture, Star, CheckCircle, Users, Download, Share2, BadgeCheck, FileText, MessageSquare, Sparkles, ChevronRight, X, Eye
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
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Icebreaker State
  const [showIcebreaker, setShowIcebreaker] = useState(false);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);

  // Session State
  const [duration, setDuration] = useState(0);
  const [connectionState, setConnectionState] = useState<'QUEUED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('QUEUED');
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

  // --- Strict Resource Cleanup ---
  const performCleanup = useCallback(() => {
      console.log("Terminating session resources...");
      
      // 1. Terminate API session rigorously
      if (conversationIdRef.current) {
          endTavusConversation(conversationIdRef.current);
          conversationIdRef.current = null;
      }

      // 2. Update Database state
      Database.endSession(userId);
  }, [userId]);

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
            // SAFETY DELAY: Wait 1s to ensure TechCheck hardware is fully released by browser
            // This prevents "Camera Busy" errors on mobile devices
            setTimeout(() => {
                startTavusConnection();
            }, 1000);
        }
    };

    // Polling Interval for Queue Position
    const queueInterval = setInterval(async () => {
        if (connectionState === 'QUEUED') {
            let pos = await Database.getQueuePosition(userId);
            
            // Failsafe: If queue dropped us but we are still waiting
            if (pos === 0) {
                pos = await Database.joinQueue(userId);
            }

            setQueuePos(pos);
            setEstWait(Database.getEstimatedWaitTime(pos));

            if (pos === 1) {
                // We are next in line, try to enter
                await tryStart();
            }
        } else if (connectionState === 'CONNECTED') {
            // HEARTBEAT: Keep alive every 3s to prevent zombie cleanup (15s timeout)
            Database.sendKeepAlive(userId);
        }
    }, 3000);

    initQueue();

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
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('pagehide', handlePageHide);
        performCleanup();
    };
  }, [performCleanup]);

  const startTavusConnection = async () => {
      // Prevent double calls (API Optimization)
      if (connectionInitiated.current) return;
      
      // FINAL DOUBLE CHECK: Ensure we still have the spot before burning API credits
      const stillHasSpot = await Database.claimActiveSpot(userId);
      if (!stillHasSpot) {
          console.warn("Lost spot during initialization latency.");
          setConnectionState('QUEUED'); // Re-queue
          return;
      }

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
          // STRICT PRODUCTION ERROR HANDLING
          setConnectionState('ERROR');
          setErrorMsg(err.message || "Failed to establish secure connection.");
      }
  };

  // --- Timers & Credit Enforcement ---
  useEffect(() => {
    if (showSummary) return;
    if (connectionState !== 'CONNECTED') return;

    const interval = setInterval(() => {
        setDuration(d => {
            const newDuration = d + 1;
            if (newDuration % 60 === 0) {
                setRemainingMinutes(prev => {
                    const nextVal = prev - 1;
                    if (nextVal <= 0) { 
                        // STRICT CUTOFF
                        performCleanup();
                        handleEndSession(); 
                        return 0; 
                    }
                    return nextVal;
                });
            }
            if (remainingMinutes <= 1 && newDuration % 60 === 30) setLowBalanceWarning(true);
            return newDuration;
        });
        if (Math.random() > 0.9) setNetworkQuality(Math.max(2, Math.floor(Math.random() * 3) + 2)); 
    }, 1000);
    return () => clearInterval(interval);
  }, [showSummary, remainingMinutes, connectionState, performCleanup]);

  const handleEndSession = () => {
      performCleanup(); // Strict API cutoff
      setSummaryImage(renderSessionArtifact(companion.name, formatTime(duration), new Date().toLocaleDateString()));
      setShowSummary(true);
  };

  const submitFeedbackAndClose = () => {
      const minutesUsed = Math.ceil(duration / 60);
      const user = Database.getUser();
      if (minutesUsed > 0 && user) {
        Database.deductBalance(minutesUsed);
        Database.addTransaction({
            id: `sess_${Date.now()}`, userId: user.id, userName: userName, date: new Date().toISOString(),
            amount: -minutesUsed, description: `Session with ${companion.name}`, status: 'COMPLETED'
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
        Database.saveFeedback(feedback);
      }
      onEndSession();
  };

  const toggleFeedbackTag = (tag: string) => { if (feedbackTags.includes(tag)) setFeedbackTags(feedbackTags.filter(t => t !== tag)); else setFeedbackTags([...feedbackTags, tag]); };
  const formatTime = (seconds: number) => { const mins = Math.floor(seconds / 60); const secs = seconds % 60; return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`; };
  
  // Calculate cost dynamically based on active sale mode setting
  const settings = Database.getSettings();
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
                      <div className="flex justify-between items-center"><span className="text-gray-500 font-bold text-xs uppercase">Cost (@ ${currentRate}/m)</span><span className="text-green-500 font-black text-lg">${cost.toFixed(2)}</span></div>
                  </div>

                  <div className="mb-6">
                      <p className="text-gray-400 text-sm mb-3 font-bold">How was {companion.name}?</p>
                      <div className="flex justify-center gap-2 mb-4">
                          {[1,2,3,4,5].map(star => (
                              <button key={star} onClick={() => setRating(star)} className={`p-2 rounded-full transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-gray-700'}`}>
                                  <Star className={`w-8 h-8 ${rating >= star ? 'fill-yellow-400' : ''}`} />
                              </button>
                          ))}
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center">
                          {["Empathetic", "Professional", "Helpful", "Calming", "Insightful"].map(tag => (
                              <button key={tag} onClick={() => toggleFeedbackTag(tag)} className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${feedbackTags.includes(tag) ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-500'}`}>
                                  {tag}
                              </button>
                          ))}
                      </div>
                  </div>

                  <button onClick={submitFeedbackAndClose} className="w-full bg-yellow-500 text-black py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-yellow-400 transition-transform hover:scale-[1.02] shadow-lg">Return to Dashboard</button>
              </div>
          </div>
      );
  }

  // --- CONNECTED STATE ---
  if (connectionState === 'CONNECTED' && conversationUrl) {
      return (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
              {/* VIDEO LAYER */}
              <div className="flex-1 relative bg-gray-900">
                  <iframe 
                      src={getIframeUrl()} 
                      allow="microphone; camera; autoplay; fullscreen"
                      className="w-full h-full border-0"
                      title="Peutic Session"
                  />
                  
                  {/* OVERLAYS */}
                  {lowBalanceWarning && (
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-xl animate-pulse flex items-center gap-2 z-20">
                          <AlertCircle className="w-4 h-4"/> Less than 1 min remaining
                      </div>
                  )}

                  {/* ICEBREAKER CARD */}
                  {showIcebreaker && (
                      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center shadow-2xl animate-in slide-in-from-bottom-10 z-20">
                          <p className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-2">Conversation Starter</p>
                          <h3 className="text-white text-lg md:text-xl font-bold mb-4 leading-relaxed">"{ICEBREAKERS[currentTopicIndex]}"</h3>
                          <div className="flex gap-2 justify-center">
                              <button onClick={() => setShowIcebreaker(false)} className="px-4 py-2 bg-black/50 hover:bg-black/70 text-white rounded-lg text-xs font-bold transition-colors">Close</button>
                              <button onClick={nextIcebreaker} className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-2">Next <ChevronRight className="w-3 h-3"/></button>
                          </div>
                      </div>
                  )}

                  {/* CONTROLS */}
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-4 md:gap-6 z-20 px-4">
                      <button 
                          onClick={() => setShowIcebreaker(!showIcebreaker)} 
                          className={`p-4 rounded-full backdrop-blur-md transition-all shadow-lg hover:scale-105 ${showIcebreaker ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                      >
                          <Sparkles className="w-6 h-6" />
                      </button>
                      
                      <button onClick={handleEndSession} className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                          <PhoneOff className="w-6 h-6" /> End Session
                      </button>

                      <div className="hidden md:flex flex-col items-center justify-center w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
                          <div className="flex gap-0.5 items-end h-4 mb-1">
                             {[1,2,3,4].map(bar => (
                                 <div key={bar} className={`w-1 bg-white rounded-full transition-all duration-300 ${networkQuality >= bar ? 'bg-green-500' : 'bg-gray-600'}`} style={{ height: `${bar * 4}px` }}></div>
                             ))}
                          </div>
                          <span className="text-[8px] font-bold text-gray-400 uppercase">Signal</span>
                      </div>
                  </div>

                  {/* Top Info */}
                  <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
                      <div className="bg-red-600 px-3 py-1 rounded-full flex items-center gap-2 animate-pulse">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                          <span className="text-white text-xs font-bold uppercase tracking-widest">Live</span>
                      </div>
                      <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-white font-mono text-sm font-bold shadow-sm">
                          {formatTime(duration)}
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- CONNECTING / QUEUE STATE ---
  return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center text-white">
          {connectionState === 'QUEUED' && (
              <div className="max-w-md w-full p-8 text-center animate-in fade-in">
                  <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                      <Users className="w-10 h-10 text-yellow-500" />
                      <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">#{queuePos}</div>
                  </div>
                  <h2 className="text-3xl font-black mb-2">You are in line</h2>
                  <p className="text-gray-400 mb-8">Due to high demand, we are securing a private line for you.</p>
                  
                  <div className="bg-gray-800 rounded-2xl p-6 mb-8 border border-gray-700">
                      <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-500 font-bold text-xs uppercase">Est. Wait</span>
                          <span className="text-white font-mono font-bold">{estWait} min</span>
                      </div>
                      <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 animate-pulse" style={{ width: '100%' }}></div>
                      </div>
                  </div>
                  <button onClick={() => { Database.leaveQueue(userId); onEndSession(); }} className="text-gray-500 hover:text-white text-sm font-bold">Cancel Request</button>
              </div>
          )}

          {connectionState === 'CONNECTING' && (
              <div className="max-w-md w-full p-8 text-center animate-in zoom-in">
                  <div className="relative w-32 h-32 mx-auto mb-8">
                      <div className="absolute inset-0 border-4 border-yellow-500/30 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-t-yellow-500 rounded-full animate-spin"></div>
                      <img src={companion.imageUrl} alt={companion.name} className="absolute inset-2 w-28 h-28 rounded-full object-cover border-2 border-gray-900" />
                  </div>
                  <h2 className="text-3xl font-black mb-2">Connecting to {companion.name}...</h2>
                  <p className="text-gray-400 text-sm animate-pulse">Establishing secure P2P encryption...</p>
              </div>
          )}

          {connectionState === 'ERROR' && (
              <div className="max-w-md w-full p-8 text-center animate-in shake">
                  <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-black mb-4">Connection Failed</h2>
                  <p className="text-red-400 mb-8 bg-red-950/30 p-4 rounded-xl border border-red-900/50 text-sm">{errorMsg}</p>
                  <div className="flex gap-4 justify-center">
                      <button onClick={onEndSession} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold">Close</button>
                      <button onClick={() => { setErrorMsg(''); setConnectionState('QUEUED'); }} className="px-6 py-3 bg-white text-black hover:bg-gray-200 rounded-xl font-bold flex items-center gap-2"><RefreshCcw className="w-4 h-4"/> Retry</button>
                  </div>
              </div>
          )}
      </div>
  );
};

export default VideoRoom;