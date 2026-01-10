
import React, { useState, useEffect, useRef } from 'react';
import { Shield, Heart, CheckCircle, ArrowRight, Star, Globe, ShieldCheck, Sparkles, Cookie, Instagram, Twitter, Linkedin, Play, MessageCircle, Moon, Sun, ChevronDown } from 'lucide-react';
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

const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'zh', label: '中文' },
  { code: 'ar', label: 'العربية' }
];

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  const [onlineCount, setOnlineCount] = useState(124);
  const [showCookies, setShowCookies] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [featuredSpecialists, setFeaturedSpecialists] = useState<Companion[]>([]);
  
  // Theme State with LocalStorage Priority
  const [darkMode, setDarkMode] = useState(() => {
      const local = localStorage.getItem('peutic_theme');
      if (local) return local === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [lang, setLang] = useState<LanguageCode>('en'); // Language State
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  
  const settings = Database.getSettings();

  // Helper to shorten translation calls
  const t = (key: any) => getTranslation(lang, key);

  // Separate effect for Cookies to ensure it runs EXACTLY once
  useEffect(() => {
    const hasAccepted = localStorage.getItem('peutic_cookies_accepted');
    if (!hasAccepted) {
        const timer = setTimeout(() => {
            setShowCookies(true);
        }, 2000);
        return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Apply theme on mount/change
    if (darkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    setOnlineCount(Math.floor(Math.random() * (300 - 80 + 1)) + 142);
    
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    if (INITIAL_COMPANIONS && INITIAL_COMPANIONS.length > 0) {
        setFeaturedSpecialists(INITIAL_COMPANIONS); 
    }

    const handleClickOutside = (event: MouseEvent) => {
        if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
            setShowLangMenu(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [darkMode]);

  const toggleDarkMode = () => {
      const newMode = !darkMode;
      setDarkMode(newMode);
      if (newMode) {
          localStorage.setItem('peutic_theme', 'dark');
      } else {
          localStorage.setItem('peutic_theme', 'light');
      }
  };

  const acceptCookies = () => {
      localStorage.setItem('peutic_cookies_accepted', 'true');
      setShowCookies(false);
  };

  // Split specialists for the two rows
  const row1 = featuredSpecialists.slice(0, Math.ceil(featuredSpecialists.length / 2));
  const row2 = featuredSpecialists.slice(Math.ceil(featuredSpecialists.length / 2));

  return (
    <div className={`min-h-screen bg-[#FFFBEB] dark:bg-[#0A0A0A] font-sans text-[#0A0A0A] dark:text-[#F3F4F6] selection:bg-yellow-200 selection:text-black transition-colors duration-500 ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Mesh Gradient Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-[10%] -right-[5%] w-[60%] h-[60%] bg-yellow-200/40 dark:bg-yellow-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] bg-orange-100/30 dark:bg-blue-900/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ${scrolled ? 'py-3 md:py-4 bg-[#FFFBEB]/80 dark:bg-black/80 backdrop-blur-xl border-b border-yellow-200/30 dark:border-gray-800 shadow-sm' : 'py-6 md:py-8 bg-transparent border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-10 flex justify-between items-center">
            <div className="flex items-center gap-2 md:gap-3 group cursor-pointer">
               <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                   <Heart className="w-5 h-5 md:w-6 md:h-6 fill-black text-black" />
               </div>
               <span className="text-xl md:text-2xl font-black tracking-tight dark:text-white">Peutic</span>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
               {/* Language Dropdown */}
               <div className="relative" ref={langMenuRef}>
                   <button 
                       onClick={() => setShowLangMenu(!showLangMenu)} 
                       className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-md border border-gray-200 dark:border-gray-800 hover:border-yellow-400 dark:hover:border-yellow-500 transition-all text-xs font-black uppercase tracking-wider shadow-sm group"
                   >
                       <Globe className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors" />
                       <span className="text-gray-800 dark:text-gray-200">{lang}</span>
                       <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${showLangMenu ? 'rotate-180' : ''}`} />
                   </button>
                   
                   {showLangMenu && (
                       <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                           {LANGUAGES.map((l) => (
                               <button
                                   key={l.code}
                                   onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                                   className={`w-full text-left px-4 py-3 text-xs font-bold hover:bg-yellow-50 dark:hover:bg-gray-800 transition-colors flex justify-between items-center ${lang === l.code ? 'text-yellow-600 dark:text-yellow-500 bg-yellow-50/50' : 'text-gray-700 dark:text-gray-300'}`}
                               >
                                   {l.label}
                                   {lang === l.code && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>}
                               </button>
                           ))}
                       </div>
                   )}
               </div>

               <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                  {darkMode ? <Sun className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" /> : <Moon className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />}
               </button>
               <button onClick={() => onLoginClick(false)} className="text-xs md:text-sm font-black uppercase tracking-widest hover:opacity-70 transition-opacity px-2 md:px-4 dark:text-gray-300">
                 {t('nav_signin')}
               </button>
               <button onClick={() => onLoginClick(true)} className="bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 md:px-8 md:py-3.5 rounded-full font-black text-xs md:text-sm uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 shadow-xl">
                  {t('nav_join')}
               </button>
            </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 md:pt-64 md:pb-40 px-4 md:px-6 z-10">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 md:gap-16 items-center">
              <div className="lg:col-span-7 space-y-6 md:space-y-10 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white dark:bg-gray-900 border border-yellow-200/50 dark:border-gray-800 rounded-full shadow-sm transition-colors">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">{onlineCount} {t('hero_badge')}</span>
                  </div>
                  
                  <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black leading-[1.1] md:leading-[1] tracking-tighter dark:text-white">
                      {t('hero_title_1')} <br/> 
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-400">{t('hero_title_2')}</span>
                  </h1>
                  
                  <p className="text-base sm:text-lg md:text-2xl text-gray-500 dark:text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed px-2">
                      {t('hero_subtitle')}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-5 justify-center pt-2 md:pt-4">
                      <button onClick={() => onLoginClick(true)} className="px-8 py-3.5 md:px-10 md:py-5 bg-[#FACC15] text-black rounded-full font-black text-sm md:text-lg uppercase tracking-widest shadow-[0_20px_40px_-15px_rgba(250,204,21,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(250,204,21,0.5)] transition-all hover:-translate-y-1 flex items-center justify-center gap-3">
                         <Play className="w-4 h-4 md:w-5 md:h-5 fill-black" /> {t('cta_start')}
                      </button>
                      <button onClick={() => onLoginClick(true)} className="px-8 py-3.5 md:px-10 md:py-5 bg-white dark:bg-gray-900 border border-yellow-200 dark:border-gray-700 text-black dark:text-white rounded-full font-black text-sm md:text-lg uppercase tracking-widest hover:bg-yellow-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-3">
                         {t('cta_team')}
                      </button>
                  </div>

                  <div className="flex items-center justify-center gap-4 md:gap-8 pt-4 md:pt-6">
                      <div className="flex -space-x-3">
                          {STABLE_AVATAR_POOL.slice(0, 4).map((src, i) => (
                              <img key={i} src={src} className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-[#FFFBEB] dark:border-black object-cover" alt="User" />
                          ))}
                      </div>
                      <p className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-widest">{t('trusted_by')}</p>
                  </div>
              </div>

              <div className="lg:col-span-5 relative mt-8 md:mt-0">
                  {/* HERO IMAGE CONTAINER */}
                  <div className="relative w-4/5 md:w-full max-w-sm mx-auto -rotate-1 hover:rotate-0 transition-all duration-500">
                      <div className="relative aspect-[4/5] bg-gray-900 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl border-4 md:border-8 border-white dark:border-gray-800 group">
                           <img src={INITIAL_COMPANIONS[0].imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Ruby" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"></div>
                           <div className="absolute top-6 left-6 md:top-8 md:left-8">
                                <div className="bg-black/30 backdrop-blur-xl border border-white/20 px-3 py-1 md:px-4 md:py-1.5 rounded-full flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white">{t('live_link')}</span>
                                </div>
                           </div>
                           <div className="absolute bottom-8 left-8 right-8 md:bottom-10 md:left-10 md:right-10">
                                <p className="text-yellow-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-2">{t('primary_spec')}</p>
                                <h3 className="text-white text-3xl md:text-4xl font-black mb-1">Ruby</h3>
                                <p className="text-gray-300 font-medium italic text-sm md:text-base">Anxiety & Emotional Regulation</p>
                           </div>
                      </div>
                      {/* Decorative Floating Elements */}
                      <div className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-xl border border-yellow-100 dark:border-gray-700 animate-float z-20 transition-colors">
                          <div className="flex items-center gap-3">
                              <div className="p-2 md:p-3 bg-green-50 dark:bg-green-900/30 rounded-xl"><CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-500" /></div>
                              <div>
                                  <p className="text-[9px] md:text-xs font-black uppercase tracking-widest text-gray-400">Connection</p>
                                  <p className="text-base md:text-lg font-black dark:text-white">100% Secure</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Infinite Marquee Roster */}
      <section className="py-16 md:py-24 bg-[#FFFBEB] dark:bg-[#0A0A0A] relative overflow-hidden transition-colors">
          <div className="max-w-7xl mx-auto text-center mb-10 md:mb-16 px-6">
              <p className="text-yellow-600 font-black uppercase tracking-[0.4em] text-[10px] md:text-xs mb-3 md:mb-4">{t('roster_title')}</p>
              <h2 className="text-3xl md:text-5xl font-black leading-[1.1] tracking-tight mb-4 md:mb-6 dark:text-white">{t('roster_heading')}</h2>
              <button onClick={() => onLoginClick(true)} className="flex items-center gap-3 font-black uppercase tracking-widest text-[10px] md:text-xs hover:gap-5 transition-all justify-center dark:text-gray-300">
                  {t('roster_btn')} <ArrowRight className="w-3 h-3 md:w-4 md:h-4 text-[#FACC15]" />
              </button>
          </div>

          <style>{`
            @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
            }
            @keyframes marquee-reverse {
                0% { transform: translateX(-50%); }
                100% { transform: translateX(0); }
            }
            .animate-marquee {
                animation: marquee 180s linear infinite;
            }
            .animate-marquee-reverse {
                animation: marquee-reverse 180s linear infinite;
            }
            .marquee-container:hover .animate-marquee,
            .marquee-container:hover .animate-marquee-reverse {
                animation-play-state: paused;
            }
          `}</style>

          {/* Marquee Wrapper with Fade Masks */}
          <div className="relative w-full marquee-container">
              <div className="absolute left-0 top-0 bottom-0 w-12 md:w-60 bg-gradient-to-r from-[#FFFBEB] dark:from-[#0A0A0A] to-transparent z-20 pointer-events-none transition-colors"></div>
              <div className="absolute right-0 top-0 bottom-0 w-12 md:w-60 bg-gradient-to-l from-[#FFFBEB] dark:from-[#0A0A0A] to-transparent z-20 pointer-events-none transition-colors"></div>

              <div className="flex flex-col gap-6 md:gap-8">
                  {/* Row 1: Left to Right */}
                  <div className="flex gap-4 md:gap-6 animate-marquee w-fit px-4">
                      {[...row1, ...row1, ...row1, ...row1].map((spec, i) => (
                          <div 
                              key={`${spec.id}-1-${i}`}
                              onClick={() => onLoginClick(true)}
                              className="relative flex-shrink-0 w-44 h-60 md:w-64 md:h-80 bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl overflow-hidden shadow-lg border border-yellow-100 dark:border-gray-800 hover:scale-105 hover:shadow-2xl hover:border-yellow-400 transition-all duration-300 cursor-pointer group"
                          >
                              <div className="h-[75%] md:h-[80%] w-full relative">
                                  <AvatarImage src={spec.imageUrl} className="w-full h-full object-cover" alt={spec.name} />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                              </div>
                              <div className="h-[25%] md:h-[20%] bg-[#FFFBEB] dark:bg-gray-900 p-2 md:p-3 flex flex-col justify-center items-center text-center relative z-10 transition-colors">
                                  <p className="text-[10px] md:text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest line-clamp-1">{spec.specialty}</p>
                              </div>
                          </div>
                      ))}
                  </div>

                  {/* Row 2: Right to Left */}
                  <div className="flex gap-4 md:gap-6 animate-marquee-reverse w-fit px-4">
                      {[...row2, ...row2, ...row2, ...row2].map((spec, i) => (
                          <div 
                              key={`${spec.id}-2-${i}`}
                              onClick={() => onLoginClick(true)}
                              className="relative flex-shrink-0 w-44 h-60 md:w-64 md:h-80 bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl overflow-hidden shadow-lg border border-yellow-100 dark:border-gray-800 hover:scale-105 hover:shadow-2xl hover:border-yellow-400 transition-all duration-300 cursor-pointer group"
                          >
                              <div className="h-[75%] md:h-[80%] w-full relative">
                                  <AvatarImage src={spec.imageUrl} className="w-full h-full object-cover" alt={spec.name} />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                              </div>
                              <div className="h-[25%] md:h-[20%] bg-[#FFFBEB] dark:bg-gray-900 p-2 md:p-3 flex flex-col justify-center items-center text-center relative z-10 transition-colors">
                                  <p className="text-[10px] md:text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest line-clamp-1">{spec.specialty}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </section>

      {/* Trust & Security Banner - BLENDED */}
      <section className="py-16 md:py-20 bg-[#FFFBEB] dark:bg-[#0A0A0A] text-black dark:text-white relative overflow-hidden transition-colors">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-12 text-center md:text-left relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                  <ShieldCheck className="w-12 h-12 md:w-16 md:h-16 text-black dark:text-white" />
                  <div>
                      <h3 className="text-xl md:text-2xl font-black tracking-tight mb-2">{t('trust_title')}</h3>
                      <p className="text-sm md:text-base text-gray-800 dark:text-gray-400 font-medium">{t('trust_desc')}</p>
                  </div>
              </div>
              <div className="flex gap-8 md:gap-12">
                  <div className="text-center">
                      <p className="text-2xl md:text-3xl font-black mb-1">99.9%</p>
                      <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-500">{t('stat_uptime')}</p>
                  </div>
                  <div className="text-center">
                      <p className="text-2xl md:text-3xl font-black mb-1">0%</p>
                      <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-500">{t('stat_sharing')}</p>
                  </div>
                  <div className="text-center">
                      <p className="text-2xl md:text-3xl font-black mb-1">AES</p>
                      <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-500">{t('stat_enc')}</p>
                  </div>
              </div>
          </div>
      </section>

      {/* Pricing Section - BLENDED */}
      <section className="py-12 px-6">
          <div className="max-w-xl mx-auto">
              <div className="bg-[#FFFBEB] dark:bg-gray-900 text-black dark:text-white rounded-[2rem] p-6 text-center relative overflow-hidden shadow-2xl border border-yellow-200 dark:border-gray-800 transition-colors">
                  {/* Mesh Gradient Inside Box */}
                  <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-yellow-100/30 dark:bg-yellow-900/10 blur-[80px] pointer-events-none"></div>
                  
                  <div className="relative z-10 space-y-3 md:space-y-4">
                      <p className="text-black/60 dark:text-white/60 font-black uppercase tracking-[0.4em] text-[8px] md:text-[9px]">{t('pricing_badge')}</p>
                      <h2 className="text-xl md:text-2xl font-black tracking-tighter">{t('pricing_title')}</h2>
                      
                      <div className="flex flex-col items-center justify-center gap-1 py-1">
                           {settings.saleMode ? (
                               <div className="flex items-baseline gap-2">
                                   <span className="text-sm md:text-lg text-black/50 dark:text-white/50 font-black line-through opacity-50 decoration-black dark:decoration-white">$1.99</span>
                                   <div className="text-3xl md:text-4xl font-black text-black dark:text-white flex items-start gap-1">
                                      <span className="text-base md:text-lg mt-1 md:mt-2">$</span>1.59<span className="text-[10px] md:text-xs text-black/60 dark:text-white/60 mt-4 md:mt-6">/min</span>
                                   </div>
                               </div>
                           ) : (
                               <div className="text-3xl md:text-4xl font-black text-black dark:text-white flex items-start gap-1">
                                  <span className="text-base md:text-lg mt-1 md:mt-2">$</span>1.99<span className="text-[10px] md:text-xs text-black/60 dark:text-white/60 mt-4 md:mt-6">/min</span>
                                </div>
                           )}
                           {settings.saleMode && <div className="bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 rounded-full font-black text-[8px] uppercase tracking-widest animate-pulse mt-1">Lifetime Rate Locked</div>}
                      </div>

                      <p className="text-black/70 dark:text-white/70 text-xs max-w-sm mx-auto font-medium leading-relaxed">
                          {t('pricing_sub')}
                      </p>

                      <button onClick={() => onLoginClick(true)} className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-all hover:scale-105 shadow-xl mt-2">
                          {t('pricing_btn')}
                      </button>
                  </div>
              </div>
          </div>
      </section>

      {/* High-End Footer - BLENDED */}
      <footer className="bg-[#FFFBEB] dark:bg-[#0A0A0A] text-black dark:text-white py-16 md:py-24 px-6 md:px-10 relative z-20 transition-colors">
          <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 mb-12 md:mb-20">
                  <div className="md:col-span-5 space-y-6 md:space-y-8">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-400 rounded-xl flex items-center justify-center">
                              <Heart className="w-5 h-5 md:w-6 md:h-6 fill-black text-black" />
                          </div>
                          <span className="text-xl md:text-2xl font-black tracking-tight">Peutic</span>
                      </div>
                      <p className="text-gray-800 dark:text-gray-500 text-sm md:text-lg leading-relaxed max-w-md">
                          {t('footer_desc')}
                      </p>
                      <div className="flex gap-6">
                          {[Twitter, Instagram, Linkedin].map((Icon, i) => (
                              <button key={i} className="text-gray-800 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors hover:scale-110 transform"><Icon className="w-5 h-5 md:w-6 md:h-6"/></button>
                          ))}
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-8 md:col-span-2">
                      <div>
                          <h4 className="font-black mb-4 md:mb-8 text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-gray-700 dark:text-gray-400">{t('footer_global')}</h4>
                          <ul className="space-y-2 md:space-y-4 text-xs md:text-sm font-bold text-gray-800 dark:text-gray-500">
                              <li><Link to="/about" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors">{t('link_about')}</Link></li>
                              <li><Link to="/press" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors">{t('link_media')}</Link></li>
                          </ul>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-1 gap-8 md:col-span-2">
                      <div>
                          <h4 className="font-black mb-4 md:mb-8 text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-gray-700 dark:text-gray-400">{t('footer_support')}</h4>
                          <ul className="space-y-2 md:space-y-4 text-xs md:text-sm font-bold text-gray-800 dark:text-gray-500">
                              <li><Link to="/support" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors">{t('link_help')}</Link></li>
                              <li><Link to="/safety" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors">{t('link_safety')}</Link></li>
                              <li><Link to="/crisis" className="text-red-600 hover:text-red-700 transition-colors">{t('link_crisis')}</Link></li>
                          </ul>
                      </div>
                  </div>

                  <div className="md:col-span-3">
                      <h4 className="font-black mb-4 md:mb-8 text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-gray-700 dark:text-gray-400">{t('footer_reg')}</h4>
                      <ul className="space-y-2 md:space-y-4 text-xs md:text-sm font-bold text-gray-800 dark:text-gray-500">
                          <li><Link to="/privacy" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors">{t('link_privacy')}</Link></li>
                          <li><Link to="/terms" className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors">{t('link_terms')}</Link></li>
                          <li><button onClick={() => setShowCookies(true)} className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors">{t('link_cookies')}</button></li>
                      </ul>
                  </div>
              </div>
              
              <div className="pt-8 md:pt-10 flex flex-col md:flex-row justify-between items-center text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 dark:text-gray-600 gap-4 md:gap-0">
                  <p>&copy; 2025 Peutic Global Inc. | ISO 27001 Certified</p>
                  <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Network Optimal</span>
                  </div>
              </div>
          </div>
      </footer>

      {showCookies && (
          <div className="fixed bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-[#FFFBEB] dark:bg-gray-900 text-black dark:text-white p-4 md:p-6 z-[100] rounded-2xl md:rounded-[2rem] border-2 border-yellow-400 shadow-2xl animate-in slide-in-from-bottom-5">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 text-center md:text-left">
                  <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                      <Cookie className="w-8 h-8 md:w-10 md:h-10 text-yellow-600" />
                      <p className="text-[10px] md:text-xs font-bold leading-relaxed uppercase tracking-wider">Secure connectivity cookies are active to ensure low-latency video. <Link to="/privacy" className="underline">Policy</Link></p>
                  </div>
                  <div className="flex gap-4">
                      <button onClick={acceptCookies} className="px-6 py-2 md:px-8 md:py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-all">Accept</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default LandingPage;
