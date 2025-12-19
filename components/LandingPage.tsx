import React, { useState, useEffect } from 'react';
import { Shield, Heart, CheckCircle, ArrowRight, Star, Globe, ShieldCheck, Sparkles, Cookie, Instagram, Twitter, Linkedin, Play, MessageCircle } from 'lucide-react';
import { LanguageCode, getTranslation } from '../services/i18n';
import { Link } from 'react-router-dom';
import { Database, STABLE_AVATAR_POOL, INITIAL_COMPANIONS } from '../services/database';
import { Companion } from '../types';

const AvatarImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (src && src.length > 10) { 
            setImgSrc(src);
            setHasError(false);
        } else {
            setHasError(true);
        }
    }, [src]);

    if (hasError || !imgSrc) {
        let hash = 0;
        for (let i = 0; i < alt.length; i++) hash = alt.charCodeAt(i) + ((hash << 5) - hash);
        const index = Math.abs(hash) % STABLE_AVATAR_POOL.length;
        return <img src={STABLE_AVATAR_POOL[index]} alt={alt} className={className} loading="lazy" />;
    }

    return <img src={imgSrc} alt={alt} className={className} onError={() => setHasError(true)} loading="lazy" />;
};

interface LandingPageProps {
  onLoginClick: (signupMode?: boolean) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  const [onlineCount, setOnlineCount] = useState(124);
  const [showCookies, setShowCookies] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [featuredSpecialists, setFeaturedSpecialists] = useState<Companion[]>([]);
  const settings = Database.getSettings();

  useEffect(() => {
    setOnlineCount(Math.floor(Math.random() * (300 - 80 + 1)) + 142);
    const timer = setTimeout(() => {
        if (!localStorage.getItem('peutic_cookies_accepted')) {
            setShowCookies(true);
        }
    }, 2000);

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    if (INITIAL_COMPANIONS && INITIAL_COMPANIONS.length > 0) {
        const pool = [...INITIAL_COMPANIONS].sort(() => Math.random() - 0.5);
        setFeaturedSpecialists(pool.slice(0, 6));
    }

    return () => {
        clearTimeout(timer);
        window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const acceptCookies = () => {
      localStorage.setItem('peutic_cookies_accepted', 'true');
      setShowCookies(false);
  };

  return (
    <div className="min-h-screen bg-[#FFFBEB] font-sans text-[#0A0A0A] selection:bg-yellow-200 selection:text-black">
      
      {/* Mesh Gradient Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-[10%] -right-[5%] w-[60%] h-[60%] bg-yellow-200/40 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] bg-orange-100/30 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-4 bg-[#FFFBEB]/80 backdrop-blur-xl border-b border-yellow-200/30 shadow-sm' : 'py-8 bg-transparent border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex justify-between items-center">
            <div className="flex items-center gap-3 group cursor-pointer">
               <div className="w-10 h-10 bg-[#FACC15] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                   <Heart className="w-6 h-6 fill-black text-black" />
               </div>
               <span className="text-2xl font-black tracking-tight uppercase">Peutic</span>
            </div>
            
            <div className="hidden md:flex items-center gap-10">
                {['Features', 'Specialists', 'Pricing'].map(item => (
                    <button key={item} className="text-sm font-bold text-gray-500 hover:text-black transition-colors uppercase tracking-widest">{item}</button>
                ))}
            </div>

            <div className="flex items-center gap-4">
               <button onClick={() => onLoginClick(false)} className="text-sm font-black uppercase tracking-widest hover:opacity-70 transition-opacity px-4">
                 Sign In
               </button>
               <button onClick={() => onLoginClick(true)} className="bg-black text-white px-8 py-3.5 rounded-full font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-xl">
                  Join Now
               </button>
            </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-24 md:pt-64 md:pb-40 px-6 z-10">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-16 items-center">
              <div className="lg:col-span-7 space-y-10 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-yellow-200/50 rounded-full shadow-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{onlineCount} Specialists Ready</span>
                  </div>
                  
                  <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1] tracking-tighter">
                      Humanity <br/> 
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-400">On Demand.</span>
                  </h1>
                  
                  <p className="text-xl md:text-2xl text-gray-500 font-medium max-w-2xl leading-relaxed">
                      Experience the gold standard in emotional support. Connect instantly via video with a dedicated specialist tailored to your journey.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start pt-4">
                      <button onClick={() => onLoginClick(true)} className="px-10 py-5 bg-[#FACC15] text-black rounded-full font-black text-lg uppercase tracking-widest shadow-[0_20px_40px_-15px_rgba(250,204,21,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(250,204,21,0.5)] transition-all hover:-translate-y-1 flex items-center justify-center gap-3">
                         <Play className="w-5 h-5 fill-black" /> Get Started
                      </button>
                      <button className="px-10 py-5 bg-white border border-yellow-200 rounded-full font-black text-lg uppercase tracking-widest hover:bg-yellow-50 transition-all flex items-center justify-center gap-3">
                         View Team
                      </button>
                  </div>

                  <div className="flex items-center justify-center lg:justify-start gap-8 pt-10 border-t border-yellow-200/30">
                      <div className="flex -space-x-3">
                          {STABLE_AVATAR_POOL.slice(0, 4).map((src, i) => (
                              <img key={i} src={src} className="w-12 h-12 rounded-full border-4 border-[#FFFBEB] object-cover" alt="User" />
                          ))}
                      </div>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Trusted by 1M+ Members</p>
                  </div>
              </div>

              <div className="lg:col-span-5 relative">
                  <div className="relative w-[85%] mx-auto rotate-3 hover:rotate-0 transition-all duration-500">
                      <div className="relative aspect-[4/5] bg-gray-900 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white group">
                           <img src={INITIAL_COMPANIONS[0].imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Ruby" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"></div>
                           <div className="absolute top-8 left-8">
                                <div className="bg-black/30 backdrop-blur-xl border border-white/20 px-4 py-1.5 rounded-full flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Live Link Active</span>
                                </div>
                           </div>
                           <div className="absolute bottom-10 left-10 right-10">
                                <p className="text-yellow-400 text-xs font-black uppercase tracking-[0.3em] mb-2">Primary Specialist</p>
                                <h3 className="text-white text-4xl font-black mb-1">Ruby</h3>
                                <p className="text-gray-300 font-medium italic">Anxiety & Emotional Regulation</p>
                           </div>
                      </div>
                      {/* Decorative Floating Elements */}
                      <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-xl border border-yellow-100 animate-float z-20">
                          <div className="flex items-center gap-3">
                              <div className="p-3 bg-green-50 rounded-xl"><CheckCircle className="w-6 h-6 text-green-500" /></div>
                              <div>
                                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">Connection</p>
                                  <p className="text-lg font-black">100% Secure</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Featured Specialists Section */}
      <section className="py-32 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                  <div className="max-w-xl text-center md:text-left">
                      <p className="text-yellow-600 font-black uppercase tracking-[0.4em] text-xs mb-4">The Care Team</p>
                      <h2 className="text-4xl md:text-6xl font-black leading-[1.1] tracking-tight">Vetted Expertise. <br/> Unmatched Empathy.</h2>
                  </div>
                  <button onClick={() => onLoginClick(true)} className="flex items-center gap-3 font-black uppercase tracking-widest text-sm hover:gap-5 transition-all">
                      Browse Full Roster <ArrowRight className="w-5 h-5 text-[#FACC15]" />
                  </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                  {featuredSpecialists.map((spec, i) => (
                      <div key={i} onClick={() => onLoginClick(true)} className="group bg-[#FFFBEB] rounded-[2.5rem] p-6 border border-yellow-100 hover:border-yellow-400 hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer">
                          <div className="aspect-square rounded-[1.8rem] overflow-hidden mb-6 shadow-lg">
                              <AvatarImage src={spec.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={spec.name} />
                          </div>
                          <div className="flex justify-between items-start px-2">
                              <div>
                                  <h3 className="text-2xl font-black mb-1">{spec.name}</h3>
                                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{spec.specialty}</p>
                              </div>
                              <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-yellow-100">
                                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                  <span className="text-xs font-black">{spec.rating}</span>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* Trust & Security Banner */}
      <section className="py-20 bg-black text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
              <div className="flex items-center gap-6">
                  <ShieldCheck className="w-16 h-16 text-yellow-500" />
                  <div>
                      <h3 className="text-2xl font-black tracking-tight mb-2">HIPAA Compliant Infrastructure</h3>
                      <p className="text-gray-500 font-medium">End-to-end 256-bit encryption. Your sessions belong to you alone.</p>
                  </div>
              </div>
              <div className="flex gap-12">
                  <div className="text-center">
                      <p className="text-3xl font-black mb-1">99.9%</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Uptime</p>
                  </div>
                  <div className="text-center">
                      <p className="text-3xl font-black mb-1">0%</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Data Sharing</p>
                  </div>
                  <div className="text-center">
                      <p className="text-3xl font-black mb-1">AES</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Encrypted</p>
                  </div>
              </div>
          </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 px-6">
          <div className="max-w-5xl mx-auto">
              <div className="bg-black text-white rounded-[4rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
                  {/* Mesh Gradient Inside Black Box */}
                  <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-yellow-500/10 blur-[80px] pointer-events-none"></div>
                  
                  <div className="relative z-10 space-y-8">
                      <p className="text-yellow-500 font-black uppercase tracking-[0.4em] text-xs">Premium Access</p>
                      <h2 className="text-5xl md:text-7xl font-black tracking-tighter">Pay only for clarity.</h2>
                      
                      <div className="flex flex-col items-center justify-center gap-4 py-8">
                           {settings.saleMode ? (
                               <div className="flex items-baseline gap-6">
                                   <span className="text-4xl text-gray-600 font-black line-through opacity-50 decoration-red-500">$1.99</span>
                                   <div className="text-8xl md:text-9xl font-black text-white flex items-start gap-2">
                                      <span className="text-4xl mt-6">$</span>1.49<span className="text-2xl text-gray-500 mt-20">/min</span>
                                   </div>
                               </div>
                           ) : (
                               <div className="text-8xl md:text-9xl font-black text-white flex items-start gap-2">
                                  <span className="text-4xl mt-6">$</span>1.99<span className="text-2xl text-gray-500 mt-20">/min</span>
                               </div>
                           )}
                           {settings.saleMode && <div className="bg-yellow-500 text-black px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest animate-pulse">Lifetime Rate Locked</div>}
                      </div>

                      <p className="text-gray-400 text-lg max-w-xl mx-auto font-medium">
                          No subscriptions. No hidden fees. Instant access to the world's most elite specialists 24/7.
                      </p>

                      <button onClick={() => onLoginClick(true)} className="bg-white text-black px-12 py-5 rounded-full font-black text-xl uppercase tracking-widest hover:bg-yellow-500 transition-all hover:scale-105 shadow-2xl">
                          Start Session Now
                      </button>
                  </div>
              </div>
          </div>
      </section>

      {/* High-End Footer */}
      <footer className="bg-[#0A0A0A] text-white py-24 px-6 md:px-10 border-t border-gray-900 relative z-20">
          <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
                  <div className="md:col-span-5 space-y-8">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                              <Heart className="w-6 h-6 fill-black text-black" />
                          </div>
                          <span className="text-2xl font-black tracking-tight uppercase">Peutic</span>
                      </div>
                      <p className="text-gray-500 text-lg leading-relaxed max-w-md">
                          Connecting the disconnected through elite-level human specialists and cutting-edge secure technology.
                      </p>
                      <div className="flex gap-6">
                          {[Twitter, Instagram, Linkedin].map((Icon, i) => (
                              <button key={i} className="text-gray-500 hover:text-white transition-colors hover:scale-110 transform"><Icon className="w-6 h-6"/></button>
                          ))}
                      </div>
                  </div>
                  
                  <div className="md:col-span-2">
                      <h4 className="font-black mb-8 text-[10px] uppercase tracking-[0.3em] text-gray-600">Global</h4>
                      <ul className="space-y-4 text-sm font-bold text-gray-400">
                          <li><Link to="/about" className="hover:text-yellow-500 transition-colors">About</Link></li>
                          <li><Link to="/press" className="hover:text-yellow-500 transition-colors">Media</Link></li>
                      </ul>
                  </div>

                  <div className="md:col-span-2">
                      <h4 className="font-black mb-8 text-[10px] uppercase tracking-[0.3em] text-gray-600">Support</h4>
                      <ul className="space-y-4 text-sm font-bold text-gray-400">
                          <li><Link to="/support" className="hover:text-yellow-500 transition-colors">Help Center</Link></li>
                          <li><Link to="/safety" className="hover:text-yellow-500 transition-colors">Safety Standards</Link></li>
                          <li><Link to="/crisis" className="text-red-500 hover:text-red-400 transition-colors">Crisis Hub</Link></li>
                      </ul>
                  </div>

                  <div className="md:col-span-3">
                      <h4 className="font-black mb-8 text-[10px] uppercase tracking-[0.3em] text-gray-600">Regulatory</h4>
                      <ul className="space-y-4 text-sm font-bold text-gray-400">
                          <li><Link to="/privacy" className="hover:text-yellow-500 transition-colors">Privacy Policy</Link></li>
                          <li><Link to="/terms" className="hover:text-yellow-500 transition-colors">Terms of Service</Link></li>
                          <li><button onClick={() => setShowCookies(true)} className="hover:text-yellow-500 transition-colors">Cookie Controls</button></li>
                      </ul>
                  </div>
              </div>
              
              <div className="pt-10 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
                  <p>&copy; 2025 Peutic Global Inc. | ISO 27001 Certified</p>
                  <div className="flex items-center gap-3 mt-4 md:mt-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Network Optimal</span>
                  </div>
              </div>
          </div>
      </footer>

      {showCookies && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-black text-white p-6 z-[100] rounded-[2rem] border border-gray-800 shadow-2xl animate-in slide-in-from-bottom-5">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4">
                      <Cookie className="w-10 h-10 text-yellow-500" />
                      <p className="text-xs font-bold text-gray-400 leading-relaxed uppercase tracking-wider">Secure connectivity cookies are active to ensure low-latency video. <Link to="/privacy" className="text-white underline">Policy</Link></p>
                  </div>
                  <div className="flex gap-4">
                      <button onClick={acceptCookies} className="px-8 py-3 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500 transition-all">Accept</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default LandingPage;