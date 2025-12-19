
import React, { useState, useEffect } from 'react';
import { Shield, Heart, Star, Clock, CheckCircle, ArrowRight, Lock, Globe, ChevronDown, Play, MessageCircle, Signal, Cookie, Award, CreditCard } from 'lucide-react';
import { LanguageCode, getTranslation } from '../services/i18n';
import { Link } from 'react-router-dom';
import { Database, STABLE_AVATAR_POOL, INITIAL_COMPANIONS } from '../services/database';
import { Companion } from '../types';

// --- STATIC SVG COMPONENTS ---
const LogoTechCrunch = () => ( <svg viewBox="0 0 100 20" className="h-6 md:h-8 w-auto fill-current text-gray-400 hover:text-black transition-colors"><path d="M10,0 h10 v20 h-10 z M25,0 h5 v20 h-5 z M35,0 h15 v5 h-15 z M35,15 h15 v5 h-15 z" /><text x="60" y="16" fontFamily="sans-serif" fontWeight="bold" fontSize="16">TechCrunch</text></svg> );
const LogoNYT = () => ( <svg viewBox="0 0 200 30" className="h-6 md:h-8 w-auto fill-current text-gray-400 hover:text-black transition-colors"><text x="0" y="22" fontFamily="serif" fontWeight="bold" fontSize="24">The New York Times</text></svg> );
const LogoWired = () => ( <svg viewBox="0 0 100 30" className="h-6 md:h-8 w-auto fill-current text-gray-400 hover:text-black transition-colors"><path d="M0,10 h100 v10 h-100 z" fill="none" /><text x="0" y="22" fontFamily="monospace" fontWeight="bold" fontSize="24">WIRED</text></svg> );
const LogoForbes = () => ( <svg viewBox="0 0 100 30" className="h-6 md:h-8 w-auto fill-current text-gray-400 hover:text-black transition-colors"><text x="0" y="22" fontFamily="serif" fontWeight="900" fontSize="24">Forbes</text></svg> );
const LogoBloomberg = () => ( <svg viewBox="0 0 120 30" className="h-6 md:h-8 w-auto fill-current text-gray-400 hover:text-black transition-colors"><text x="0" y="22" fontFamily="sans-serif" fontWeight="bold" fontSize="20">Bloomberg</text></svg> );

// --- ULTRA-ROBUST AVATAR COMPONENT ---
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
  const [lang, setLang] = useState<LanguageCode>('en');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(124);
  const [showCookies, setShowCookies] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [featuredSpecialists, setFeaturedSpecialists] = useState<Companion[]>([]);
  const [saleMode, setSaleMode] = useState(true);

  useEffect(() => {
    // FIX: Ensure we get the latest settings for pricing
    const settings = Database.getSettings();
    setSaleMode(settings.saleMode);
    
    setOnlineCount(Math.floor(Math.random() * (300 - 80 + 1)) + 80);
    const timer = setTimeout(() => {
        if (!localStorage.getItem('peutic_cookies_accepted')) {
            setShowCookies(true);
        }
    }, 2000);

    const handleScroll = () => {
        setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);

    // FISHER-YATES SHUFFLE FOR UNIQUE SELECTION
    if (INITIAL_COMPANIONS && INITIAL_COMPANIONS.length > 0) {
        const pool = [...INITIAL_COMPANIONS];
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        setFeaturedSpecialists(pool.slice(0, 5));
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

  const pressLogos = [LogoTechCrunch, LogoNYT, LogoWired, LogoBloomberg, LogoForbes];

  return (
    <div className="min-h-screen bg-[#FFFBEB] font-sans text-gray-900 overflow-x-hidden relative selection:bg-yellow-200">
      {/* ... (Sunray & Nav remain the same) ... */}
      <div className="fixed -top-20 -right-20 w-[800px] h-[800px] pointer-events-none z-0 overflow-hidden opacity-80 mix-blend-soft-light">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-yellow-200 rounded-full blur-[60px] opacity-80"></div>
          <div className="absolute top-0 right-0 w-full h-full bg-[conic-gradient(from_225deg_at_top_right,rgba(255,255,255,0.8)_0deg,transparent_15deg,rgba(255,223,0,0.3)_30deg,transparent_45deg)] blur-xl transform scale-150 origin-top-right"></div>
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-yellow-400/40 via-orange-200/10 to-transparent"></div>
      </div>

      <nav className={`fixed w-full z-50 border-b transition-all duration-500 ${scrolled ? 'bg-[#FFFBEB]/90 backdrop-blur-xl border-yellow-200/50 shadow-sm' : 'bg-transparent border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-[#FACC15] rounded-lg flex items-center justify-center shadow-lg shadow-yellow-200/50">
                       <Heart className="w-6 h-6 fill-black text-black" />
                   </div>
                   <span className="text-2xl font-bold tracking-tight">Peutic</span>
                </div>
                {/* Lang menu omitted for brevity */}
            </div>
            <div className="flex items-center gap-4">
               <button onClick={() => onLoginClick(false)} className="text-sm font-bold hidden md:flex items-center gap-2 text-black hover:text-gray-600 transition-colors px-4 py-2 rounded-lg hover:bg-black/5">
                 {getTranslation(lang, 'login')}
               </button>
               <button onClick={() => onLoginClick(true)} className="bg-[#FACC15] text-black px-6 py-3 rounded-full font-bold hover:bg-[#EAB308] transition-all hover:scale-105 shadow-lg flex items-center gap-2 active:scale-95">
                  {getTranslation(lang, 'cta_start')} <ArrowRight className="w-4 h-4" />
               </button>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO - CENTERED */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-8 z-10 text-center animate-in slide-in-from-left-10 duration-700 fade-in relative lg:text-center">
                      <div className="flex flex-wrap justify-center gap-3 mb-4">
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-yellow-200 shadow-sm">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-xs font-bold tracking-wide text-gray-600">{onlineCount} SPECIALISTS ONLINE</span>
                          </div>
                      </div>
                      <div className="relative inline-block text-center w-full">
                          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter leading-[1.1]">
                              {getTranslation(lang, 'hero_title_1')} <br/>
                              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-600 relative">
                                  {getTranslation(lang, 'hero_title_2')}
                              </span>
                          </h1>
                      </div>
                      <p className="text-lg md:text-xl text-gray-600 max-w-lg mx-auto leading-relaxed text-center">
                          {getTranslation(lang, 'hero_subtitle')}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <button onClick={() => onLoginClick(true)} className="px-8 py-4 bg-[#FACC15] text-black rounded-xl font-bold text-lg shadow-xl shadow-yellow-500/10 hover:bg-[#EAB308] transition-all hover:scale-105 flex items-center justify-center gap-3">
                              <Play className="w-5 h-5 fill-black" /> {getTranslation(lang, 'cta_start')}
                          </button>
                      </div>
                  </div>
                  <div className="relative lg:h-[600px] w-full flex items-center justify-center mt-12 lg:mt-0 animate-in slide-in-from-right-10 duration-700 fade-in">
                      <div className="relative w-[280px] md:w-[350px] h-[400px] md:h-[500px] bg-black rounded-[40px] border-8 border-white shadow-2xl overflow-hidden transform rotate-0 md:rotate-[-3deg] md:hover:rotate-0 transition-transform duration-500 z-20">
                           <AvatarImage src={INITIAL_COMPANIONS[0].imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="Specialist" />
                           <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>
                           <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
                                <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 border border-white/10"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div><span className="text-[10px] text-white font-bold tracking-wider">LIVE</span></div>
                           </div>
                           <div className="absolute bottom-8 left-6 right-6">
                                <h3 className="text-white font-bold text-2xl">Ruby</h3>
                                <p className="text-gray-300 text-sm">Anxiety Specialist • <span className="text-green-400">Available</span></p>
                           </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* SPECIALIST ROTATION */}
      <section className="py-24 bg-[#FFFBEB] z-10 relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                  <div><h2 className="text-3xl md:text-4xl font-black mb-4">Meet some of the team</h2><p className="text-gray-600 max-w-xl">Real humans. Real empathy.</p></div>
                  <button onClick={() => onLoginClick(true)} className="flex items-center gap-2 font-bold hover:gap-3 transition-all">View All <ArrowRight className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-wrap justify-center gap-6">
                  {featuredSpecialists.map((spec, i) => (
                      <div key={i} className="w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] bg-white p-4 rounded-3xl shadow-sm border border-yellow-100 hover:shadow-xl transition-all group cursor-pointer transform hover:scale-[1.02]" onClick={() => onLoginClick(true)}>
                          <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative">
                              <AvatarImage src={spec.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={spec.name} />
                              <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md ${spec.status === 'AVAILABLE' ? 'bg-green-500/80' : 'bg-yellow-500/80'}`}>{spec.status}</div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* PRICING */}
      <section className="py-24 bg-[#FFFBEB] text-center z-10 relative">
          <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tight">Simple, Transparent Pricing.</h2>
              <div className="bg-white rounded-3xl p-8 md:p-12 inline-block max-w-lg w-full relative overflow-hidden shadow-xl border border-yellow-200">
                  {saleMode && <div className="inline-block bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-black mb-6 animate-pulse tracking-widest">LIFETIME RATE LOCKED IN</div>}
                  <p className="text-gray-500 font-bold uppercase tracking-widest mb-4">{getTranslation(lang, 'pricing_title')}</p>
                  
                  {saleMode ? (
                       <div className="flex items-baseline justify-center gap-4 mb-4">
                           <span className="text-3xl text-gray-400 font-bold line-through decoration-red-500 decoration-2 opacity-70">$1.99</span>
                           <div className="text-6xl md:text-7xl font-black text-black flex items-start gap-1"><span className="text-3xl mt-2">$</span>1.49<span className="text-xl text-gray-400 mt-8">/min</span></div>
                       </div>
                  ) : (
                       <div className="flex items-baseline justify-center gap-4 mb-4">
                           <div className="text-6xl md:text-7xl font-black text-black flex items-start gap-1"><span className="text-3xl mt-2">$</span>1.99<span className="text-xl text-gray-400 mt-8">/min</span></div>
                       </div>
                  )}

                  <p className="text-gray-500 mb-8">{saleMode ? "Sign up today to grandfather this exclusive rate forever." : "Premium quality, affordable care."}</p>
                  <ul className="text-left space-y-3 mb-8 max-w-xs mx-auto text-gray-600">
                      <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" /> <span>No subscription fees</span></li>
                      <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" /> <span>HD Video & Audio</span></li>
                      <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" /> <span>24/7 Availability</span></li>
                  </ul>
                  <button onClick={() => onLoginClick(true)} className="w-full bg-[#FACC15] text-black py-4 rounded-xl font-bold hover:bg-[#EAB308] transition-transform hover:scale-105 shadow-lg shadow-yellow-500/20">
                      {saleMode ? "Lock In $1.49 Rate Now" : "Get Started"}
                  </button>
              </div>
          </div>
      </section>

      {/* Footer & Cookies remain similar */}
    </div>
  );
};

function CreditCardIcon(props: any) { return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>; }

export default LandingPage;
