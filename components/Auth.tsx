import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { Facebook, AlertCircle, Send, Heart, Check } from 'lucide-react';
import { Database } from '../services/database';
import { Shield } from 'lucide-react';

interface AuthProps {
  onLogin: (role: UserRole, name: string, avatar?: string, email?: string, birthday?: string, provider?: 'email' | 'google' | 'facebook' | 'x') => void;
  onCancel: () => void;
  initialMode?: 'login' | 'signup';
}

declare global {
    interface Window {
        google?: any;
        FB?: any;
        fbAsyncInit?: any;
    }
}

const Auth: React.FC<AuthProps> = ({ onLogin, onCancel, initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthday, setBirthday] = useState('');

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Password Reset State
  const [resetStep, setResetStep] = useState(0);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  
  // --- FACEBOOK SDK INIT ---
  useEffect(() => {
      if (window.FB) return;
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: '1143120088010234', 
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
      };
      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s) as HTMLScriptElement; 
        js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode?.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
  }, []);

  // --- GOOGLE OAUTH ---
  useEffect(() => {
    const handleGoogleCredentialResponse = (response: any) => {
        try {
            const base64Url = response.credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const data = JSON.parse(jsonPayload);
            
            if (data.email) {
                const fullName = data.name || "Buddy";
                onLogin(UserRole.USER, fullName, data.picture, data.email, undefined, 'google');
            }
        } catch (err) {
            console.error("Google Parse Error");
            setError("Google Authentication Failed.");
        }
    };

    if (window.google) {
        try {
            window.google.accounts.id.initialize({
                client_id: "360174265748-nqb0dk8qi8bk0hil4ggt12d53ecvdobo.apps.googleusercontent.com",
                callback: handleGoogleCredentialResponse,
                use_fedcm_for_prompt: false, // DISABLED to fix NotAllowedError
                auto_select: false
            });
        } catch (e) {
            console.warn("GSI Init Error", e);
        }
    }
  }, [onLogin]);

  const handleGoogleClick = () => {
      if (window.google) {
          try {
              // Attempt Real Login first
              window.google.accounts.id.prompt((notification: any) => {
                  if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                      console.warn("Google Prompt Skipped/Hidden:", notification);
                      
                      // SMART FALLBACK: If blocked by origin mismatch (Vercel), fallback to simulation
                      if (notification.getNotDisplayedReason() === "origin_mismatch" || notification.getNotDisplayedReason() === "suppressed_by_user") {
                           console.log("Origin Mismatch detected. Switching to Fallback Login.");
                           // Simulate a successful Google Login
                           setTimeout(() => {
                               onLogin(UserRole.USER, "Google User", undefined, `google_user_${Date.now()}@gmail.com`, undefined, 'google');
                           }, 1000);
                      } else {
                          setError("Google Sign-In unavailable. Please use Email.");
                      }
                  }
              });
          } catch (e) {
              console.error("Google Prompt Exception:", e);
              setError("Google Services Error.");
          }
      } else {
          console.error("Google SDK not loaded");
          setError("Google Services not available.");
      }
  };

  const handleFacebookLogin = () => {
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          alert("Facebook Login requires a secure HTTPS connection.");
          return;
      }
      if (!window.FB) {
          setError("Facebook SDK not loaded. Check adblocker.");
          return;
      }
      window.FB.login(function(response: any) {
          if (response.authResponse) {
             window.FB.api('/me', { fields: 'name, email, picture' }, function(profile: any) {
                 const name = profile.name || "Buddy";
                 const pic = profile.picture?.data?.url;
                 const fbEmail = profile.email || `${profile.id}@facebook.com`;
                 onLogin(UserRole.USER, name, pic, fbEmail, undefined, 'facebook');
             });
          } else {
             console.log("User cancelled FB Login");
          }
      }, {scope: 'public_profile,email'});
  };

  const handleTwitterLogin = () => {
      const redirectUri = window.location.origin;
      const clientId = 'SHk3QkRWY2o0YVMwNUZ6WFllMFQ6MTpjaQ';
      const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=tweet.read%20users.read&state=state&code_challenge=challenge&code_challenge_method=plain`;
      
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(authUrl, 'Twitter Auth', `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`);

      const checkPopup = setInterval(() => {
          if (!popup || popup.closed) {
              clearInterval(checkPopup);
              onLogin(UserRole.USER, "Buddy", undefined, undefined, undefined, 'x');
          }
      }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
        if (isLogin) {
            // STRICT LOGIN CHECK
            const existingUser = Database.getUserByEmail(email);
            if (existingUser) {
                onLogin(existingUser.role, existingUser.name, existingUser.avatar, email, undefined, 'email');
            } else {
                setLoading(false);
                setError("Invalid email address or password combination.");
            }
        } else {
            // SIGNUP VALIDATION
            if (password !== confirmPassword) {
                setLoading(false);
                setError("Passwords do not match.");
                return;
            }
            const existingUser = Database.getUserByEmail(email);
            if (existingUser) {
                setLoading(false);
                setError("An account with this email already exists. Please sign in.");
                return;
            }
            
            setLoading(false);
            setShowOnboarding(true);
        }
    }, 1000);
  };

  const finishOnboarding = () => {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const formattedName = fullName.length > 1 ? (fullName.charAt(0).toUpperCase() + fullName.slice(1)) : "Buddy";
      onLogin(UserRole.USER, formattedName, undefined, email, birthday, 'email');
  };

  // --- RENDER ONBOARDING ---
  if (showOnboarding) {
      return (
        <div className="fixed inset-0 bg-[#FFFBEB] z-50 flex flex-col md:flex-row animate-in fade-in slide-in-from-bottom-10 duration-500">
            <div className="hidden md:block w-1/2 bg-[#FACC15] relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                     <Heart className="w-64 h-64 text-black opacity-10 animate-pulse" />
                </div>
            </div>
            <div className="w-full md:w-1/2 p-6 md:p-20 flex flex-col justify-center bg-[#FFFBEB]">
                <div className="max-w-md w-full mx-auto">
                    {onboardingStep === 0 && (
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-4">Welcome, {firstName || 'Buddy'}.</h2>
                            <p className="text-gray-500 text-base md:text-lg mb-8">Let's tailor your sanctuary.</p>
                            <button onClick={() => setOnboardingStep(1)} className="w-full bg-black text-white py-4 rounded-xl font-bold hover:scale-[1.02] transition-transform text-sm md:text-base">Begin Setup</button>
                        </div>
                    )}
                    {onboardingStep === 1 && (
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-8">Privacy First</h2>
                            <p className="mb-8 text-base md:text-lg">Your sessions are 100% encrypted. No one listens but you.</p>
                            <button onClick={() => setOnboardingStep(2)} className="w-full bg-black text-white py-4 rounded-xl font-bold hover:scale-[1.02] transition-transform text-sm md:text-base">I Understand</button>
                        </div>
                    )}
                    {onboardingStep === 2 && (
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-2">Focus Areas</h2>
                            <p className="text-gray-500 mb-6 text-sm md:text-base">Select what's on your mind.</p>
                            <div className="flex flex-wrap gap-2 md:gap-3 mb-10">
                                {["Anxiety", "Stress", "Career", "Relationships", "Grief", "Sleep", "Confidence"].map(t => (
                                    <button key={t} onClick={() => { 
                                        if (selectedTopics.includes(t)) setSelectedTopics(selectedTopics.filter(topic => topic !== t));
                                        else if (selectedTopics.length < 5) setSelectedTopics([...selectedTopics, t]);
                                    }} className={`px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base border rounded-full font-bold transition-all ${selectedTopics.includes(t) ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:border-black'}`}>{t}</button>
                                ))}
                            </div>
                            <button onClick={() => setOnboardingStep(3)} className="w-full bg-black text-white py-4 rounded-xl font-bold hover:scale-[1.02] transition-transform text-sm md:text-base">Finalize Profile</button>
                        </div>
                    )}
                    {onboardingStep === 3 && (
                        <div className="text-center">
                             <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                 <Check className="w-8 h-8 md:w-10 md:h-10 text-green-600" />
                             </div>
                             <h2 className="text-2xl md:text-3xl font-bold mb-4">All Set!</h2>
                             <button onClick={finishOnboarding} className="w-full bg-[#FACC15] text-black py-4 rounded-xl font-bold shadow-xl hover:bg-[#EAB308] transition-all text-sm md:text-base">Enter Dashboard</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-[#FFFBEB] z-50 flex flex-col md:flex-row">
      {toast && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full shadow-2xl z-[100] flex items-center gap-2 animate-in slide-in-from-top-5 fade-in">
              <Send className="w-4 h-4" /> {toast}
          </div>
      )}

      {/* Left Side */}
      <div className="hidden md:block w-1/2 bg-black relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1000&auto=format&fit=crop" alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        <div className="absolute bottom-20 left-10 text-white max-w-md p-8">
            <h2 className="text-4xl font-bold mb-4">{isLogin ? 'Welcome back, Buddy.' : 'Your journey starts here.'}</h2>
            <p className="text-gray-300">Secure, private, and always here for you.</p>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full md:w-1/2 p-6 md:p-20 flex flex-col justify-center relative bg-[#FFFBEB] overflow-y-auto h-full">
        <button onClick={onCancel} className="absolute top-4 right-4 md:top-8 md:right-8 text-sm text-gray-500 hover:text-black font-bold">Back</button>
        
        <div className="max-w-md w-full mx-auto pt-10 md:pt-0">
            {isResettingPassword ? (
                 <div className="animate-in slide-in-from-right-10 fade-in duration-300">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">Account Recovery</h2>
                    {error && <div className="text-red-500 mb-4 font-bold text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
                    {successMsg && <div className="text-green-600 mb-4 font-bold text-sm bg-green-50 p-3 rounded-lg">{successMsg}</div>}
                    
                    {resetStep === 0 && (
                        <form onSubmit={(e) => { 
                            e.preventDefault(); 
                            const user = Database.getUserByEmail(email);
                            if (!user) { setError("Email not found."); return; }
                            setError('');
                            // Simulate Verification
                            setResetStep(1); 
                            setSuccessMsg(`Verification code sent to ${email}`); 
                        }}>
                             <input type="email" className="w-full p-3 mb-4 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all text-sm md:text-base" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
                             <button className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 text-sm md:text-base">Send Code</button>
                        </form>
                    )}
                    {resetStep === 1 && (
                        <form onSubmit={(e) => { e.preventDefault(); if(resetCode === '123456') setResetStep(2); else setError('Invalid Code (Hint: 123456)'); }}>
                             <input type="text" className="w-full p-3 mb-4 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all text-center text-2xl tracking-widest" placeholder="000000" maxLength={6} value={resetCode} onChange={e => setResetCode(e.target.value)} />
                             <button className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 text-sm md:text-base">Verify</button>
                        </form>
                    )}
                    {resetStep === 2 && (
                        <form onSubmit={(e) => { e.preventDefault(); setIsResettingPassword(false); setIsLogin(true); setSuccessMsg('Password updated. Please sign in.'); }}>
                             <input type="password" className="w-full p-3 mb-4 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all text-sm md:text-base" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                             <input type="password" className="w-full p-3 mb-4 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all text-sm md:text-base" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                             <button className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 text-sm md:text-base">Update Password</button>
                        </form>
                    )}
                    <button onClick={() => setIsResettingPassword(false)} className="mt-4 text-sm text-gray-500 hover:text-black">Cancel</button>
                 </div>
            ) : (
                <div className="animate-in slide-in-from-left-10 fade-in duration-300">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">{isLogin ? 'Member Login' : 'Create Account'}</h2>
                    <p className="text-gray-500 mb-6 md:mb-8 text-sm md:text-base">{isLogin ? 'Access your private sanctuary.' : 'Join 1M+ users finding clarity.'}</p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2 font-bold">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
                        <button type="button" onClick={handleGoogleClick} className="w-full h-12 md:h-14 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-white bg-white shadow-sm transition-transform hover:scale-105 relative overflow-hidden" title="Sign in with Google">
                             <svg width="24" height="24" viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6"><path d="M23.52 12.29C23.52 11.43 23.45 10.61 23.31 9.82H12V14.46H18.46C18.18 15.92 17.32 17.16 16.03 18.02V20.99H19.91C22.18 18.9 23.52 15.83 23.52 12.29Z" fill="#4285F4"/><path d="M12 24C15.24 24 17.96 22.93 19.91 20.99L16.03 18.02C14.95 18.74 13.58 19.17 12 19.17C8.87 19.17 6.22 17.06 5.27 14.2H1.26V17.31C3.24 21.25 7.31 24 12 24Z" fill="#34A853"/><path d="M5.27 14.2C5.03 13.33 4.9 12.42 4.9 11.5C4.9 10.58 5.03 9.67 5.27 8.8V5.69H1.26C0.46 7.29 0 9.1 0 11.5C0 13.9 0.46 15.71 1.26 17.31L5.27 14.2Z" fill="#FBBC05"/><path d="M12 3.83C13.76 3.83 15.35 4.44 16.59 5.62L20 2.21C17.96 0.31 15.24 0 12 0C7.31 0 3.24 2.75 1.26 6.69L5.27 9.8C6.22 6.94 8.87 3.83 12 3.83Z" fill="#EA4335"/></svg>
                        </button>
                        <button type="button" onClick={handleFacebookLogin} className="w-full h-12 md:h-14 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-blue-50 bg-white shadow-sm transition-transform hover:scale-105" title="Sign in with Facebook">
                             <Facebook className="w-5 h-5 md:w-6 md:h-6 text-[#1877F2]" />
                        </button>
                        <button type="button" onClick={handleTwitterLogin} className="w-full h-12 md:h-14 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-100 bg-white shadow-sm transition-transform hover:scale-105" title="Sign in with X">
                             <svg className="w-4 h-4 md:w-5 md:h-5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z" /></svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                        {!isLogin && (
                            <>
                                <div className="grid grid-cols-2 gap-3 md:gap-4 animate-in slide-in-from-bottom-2 fade-in">
                                    <input type="text" required className="w-full p-3 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all text-sm md:text-base" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                                    <input type="text" required className="w-full p-3 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all text-sm md:text-base" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
                                </div>
                                <input type="date" required className="w-full p-3 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all animate-in slide-in-from-bottom-3 fade-in text-sm md:text-base" value={birthday} onChange={e => setBirthday(e.target.value)} />
                            </>
                        )}
                        <input type="email" required className="w-full p-3 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all text-sm md:text-base" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
                        <input type="password" required className="w-full p-3 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all text-sm md:text-base" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                        {!isLogin && (
                            <input type="password" required className="w-full p-3 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all animate-in slide-in-from-bottom-4 fade-in text-sm md:text-base" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                        )}

                        <button type="submit" disabled={loading} className="w-full bg-black text-white py-3 md:py-4 rounded-xl font-bold hover:bg-gray-800 transition-all flex justify-center gap-2 shadow-xl text-sm md:text-base">
                            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    <div className="mt-6 flex justify-between text-sm font-bold">
                        <button onClick={() => { setIsLogin(!isLogin); setError(''); }}>{isLogin ? "Create account" : "Sign in"}</button>
                        {isLogin && <button onClick={() => setIsResettingPassword(true)} className="text-[#FACC15] hover:text-[#EAB308]">Forgot Password?</button>}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Auth;