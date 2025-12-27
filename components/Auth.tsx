
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
  
  // Update state when prop changes to support switching modes from parent
  useEffect(() => {
    setIsLogin(initialMode === 'login');
  }, [initialMode]);
  
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
  const [toast, setToast] = useState<string | null>(null);

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
            // Using a generic client ID. 
            // Note: If you see [GSI_LOGGER] origin errors in console, it is because this 
            // client ID is not whitelisted for your specific domain/localhost. 
            window.google.accounts.id.initialize({
                client_id: "360174265748-nqb0dk8qi8bk0hil4ggt12d53ecvdobo.apps.googleusercontent.com",
                callback: handleGoogleCredentialResponse,
                use_fedcm_for_prompt: false, 
                auto_select: false
            });
        } catch (e) {
            console.warn("GSI Init Error", e);
        }
    }
  }, [onLogin]);

  const handleGoogleClick = () => {
      // 1. SDK Check
      if (!window.google) {
          setError("Google Sign-In is currently unavailable. Please use email.");
          return;
      }

      try {
          // 2. Attempt Real Login
          window.google.accounts.id.prompt((notification: any) => {
              if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                  const reason = notification.getNotDisplayedReason();
                  console.warn("Google Prompt Skipped/Hidden. Reason:", reason);
                  setError("Google Sign-In was blocked or closed. Please try again or use email.");
              }
          });
      } catch (e) {
          console.error("Google Prompt Exception:", e);
          setError("An error occurred with Google Sign-In.");
      }
  };

  const handleFacebookLogin = () => {
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          alert("Facebook Login requires a secure HTTPS connection.");
          return;
      }
      if (!window.FB) {
          setError("Facebook SDK not loaded. Please verify your connection.");
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
        <div className="fixed inset-0 bg-[#FFFBEB] dark:bg-black z-50 flex flex-col md:flex-row animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="hidden md:block w-1/2 bg-[#FACC15] dark:bg-yellow-600 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                     <Heart className="w-64 h-64 text-black opacity-10 animate-pulse" />
                </div>
            </div>
            <div className="w-full md:w-1/2 h-full overflow-y-auto flex flex-col bg-[#FFFBEB] dark:bg-black text-black dark:text-white relative">
                <div className="flex-1 flex flex-col justify-end md:justify-center p-6 md:p-20 pb-12 md:pb-20 min-h-full">
                    <div className="max-w-md w-full mx-auto">
                        {onboardingStep === 0 && (
                            <div className="animate-in slide-in-from-bottom-5 fade-in duration-500 space-y-6">
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Welcome, {firstName || 'Buddy'}.</h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl font-medium leading-relaxed">Let's tailor your sanctuary.</p>
                                </div>
                                <button onClick={() => setOnboardingStep(1)} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 md:py-5 rounded-2xl font-black hover:scale-[1.02] transition-transform text-base md:text-lg shadow-xl">Begin Setup</button>
                            </div>
                        )}
                        {onboardingStep === 1 && (
                            <div className="animate-in slide-in-from-bottom-5 fade-in duration-500 space-y-6">
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Privacy First</h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl font-medium leading-relaxed">Your sessions are 100% encrypted. No one listens but you.</p>
                                </div>
                                <button onClick={() => setOnboardingStep(2)} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 md:py-5 rounded-2xl font-black hover:scale-[1.02] transition-transform text-base md:text-lg shadow-xl">I Understand</button>
                            </div>
                        )}
                        {onboardingStep === 2 && (
                            <div className="animate-in slide-in-from-bottom-5 fade-in duration-500 space-y-6">
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Focus Areas</h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg mb-6">Select what's on your mind.</p>
                                    <div className="flex flex-wrap gap-2 md:gap-3 mb-8">
                                        {["Anxiety", "Stress", "Career", "Relationships", "Grief", "Sleep", "Confidence"].map(t => (
                                            <button key={t} onClick={() => { 
                                                if (selectedTopics.includes(t)) setSelectedTopics(selectedTopics.filter(topic => topic !== t));
                                                else if (selectedTopics.length < 5) setSelectedTopics([...selectedTopics, t]);
                                            }} className={`px-4 py-2.5 md:px-5 md:py-3 text-sm md:text-base border rounded-full font-bold transition-all ${selectedTopics.includes(t) ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white'}`}>{t}</button>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={() => setOnboardingStep(3)} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 md:py-5 rounded-2xl font-black hover:scale-[1.02] transition-transform text-base md:text-lg shadow-xl">Finalize Profile</button>
                            </div>
                        )}
                        {onboardingStep === 3 && (
                            <div className="text-center animate-in zoom-in duration-500 space-y-8">
                                 <div className="w-20 h-20 md:w-24 md:h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto shadow-lg">
                                     <Check className="w-10 h-10 md:w-12 md:h-12 text-green-600 dark:text-green-400" />
                                 </div>
                                 <div>
                                    <h2 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">All Set!</h2>
                                    <p className="text-gray-500">Your safe space is ready.</p>
                                 </div>
                                 <button onClick={finishOnboarding} className="w-full bg-[#FACC15] text-black py-4 md:py-5 rounded-2xl font-black shadow-[0_20px_40px_-15px_rgba(250,204,21,0.5)] hover:bg-[#EAB308] hover:scale-105 transition-all text-base md:text-lg uppercase tracking-widest">Enter Dashboard</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-[#FFFBEB] dark:bg-black z-50 flex flex-col md:flex-row transition-colors">
      {toast && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-full shadow-2xl z-[100] flex items-center gap-2 animate-in slide-in-from-top-5 fade-in">
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
      <div className="w-full md:w-1/2 p-6 md:p-20 flex flex-col justify-center relative bg-[#FFFBEB] dark:bg-black text-black dark:text-white overflow-y-auto h-full">
        <button onClick={onCancel} className="absolute top-4 right-4 md:top-8 md:right-8 text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white font-bold">Back</button>
        
        <div className="max-w-md w-full mx-auto pt-10 md:pt-0">
            <div className="animate-in slide-in-from-left-10 fade-in duration-300">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">{isLogin ? 'Member Login' : 'Create Account'}</h2>
                <p className="text-gray-500 mb-6 md:mb-8 text-sm md:text-base">{isLogin ? 'Access your private sanctuary.' : 'Join 1M+ users finding clarity.'}</p>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-center gap-2 font-bold">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
                    <button type="button" onClick={handleGoogleClick} className="w-full h-12 md:h-14 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-gray-900 bg-white dark:bg-black shadow-sm transition-transform hover:scale-105 relative overflow-hidden" title="Sign in with Google">
                            <svg width="24" height="24" viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6"><path d="M23.52 12.29C23.52 11.43 23.45 10.61 23.31 9.82H12V14.46H18.46C18.18 15.92 17.32 17.16 16.03 18.02V20.99H19.91C22.18 18.9 23.52 15.83 23.52 12.29Z" fill="#4285F4"/><path d="M12 24C15.24 24 17.96 22.93 19.91 20.99L16.03 18.02C14.95 18.74 13.58 19.17 12 19.17C8.87 19.17 6.22 17.06 5.27 14.2H1.26V17.31C3.24 21.25 7.31 24 12 24Z" fill="#34A853"/><path d="M5.27 14.2C5.03 13.33 4.9 12.42 4.9 11.5C4.9 10.58 5.03 9.67 5.27 8.8V5.69H1.26C0.46 7.29 0 9.1 0 11.5C0 13.9 0.46 15.71 1.26 17.31L5.27 14.2Z" fill="#FBBC05"/><path d="M12 3.83C13.76 3.83 15.35 4.44 16.59 5.62L20 2.21C17.96 0.31 15.24 0 12 0C7.31 0 3.24 2.75 1.26 6.69L5.27 9.8C6.22 6.94 8.87 3.83 12 3.83Z" fill="#EA4335"/></svg>
                    </button>
                    <button type="button" onClick={handleFacebookLogin} className="w-full h-12 md:h-14 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-white dark:bg-black shadow-sm transition-transform hover:scale-105" title="Sign in with Facebook">
                            <Facebook className="w-5 h-5 md:w-6 md:h-6 text-[#1877F2]" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                    {!isLogin && (
                        <>
                            <div className="grid grid-cols-2 gap-3 md:gap-4 animate-in slide-in-from-bottom-2 fade-in">
                                <input type="text" required className="w-full p-3 rounded-xl border border-yellow-200 dark:border-gray-800 bg-yellow-50 dark:bg-gray-900 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all text-sm md:text-base dark:text-white" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                                <input type="text" required className="w-full p-3 rounded-xl border border-yellow-200 dark:border-gray-800 bg-yellow-50 dark:bg-gray-900 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all text-sm md:text-base dark:text-white" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
                            </div>
                            <input type="date" required className="w-full p-3 rounded-xl border border-yellow-200 dark:border-gray-800 bg-yellow-50 dark:bg-gray-900 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all animate-in slide-in-from-bottom-3 fade-in text-sm md:text-base dark:text-white" value={birthday} onChange={e => setBirthday(e.target.value)} />
                        </>
                    )}
                    <input type="email" required className="w-full p-3 rounded-xl border border-yellow-200 dark:border-gray-800 bg-yellow-50 dark:bg-gray-900 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all text-sm md:text-base dark:text-white" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
                    <input type="password" required className="w-full p-3 rounded-xl border border-yellow-200 dark:border-gray-800 bg-yellow-50 dark:bg-gray-900 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all text-sm md:text-base dark:text-white" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                    {!isLogin && (
                        <input type="password" required className="w-full p-3 rounded-xl border border-yellow-200 dark:border-gray-800 bg-yellow-50 dark:bg-gray-900 focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all animate-in slide-in-from-bottom-4 fade-in text-sm md:text-base dark:text-white" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    )}

                    <button type="submit" disabled={loading} className="w-full bg-black dark:bg-white text-white dark:text-black py-3 md:py-4 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all flex justify-center gap-2 shadow-xl text-sm md:text-base">
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className="mt-6 flex justify-between text-sm font-bold">
                    <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">{isLogin ? "Create account" : "Sign in"}</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
