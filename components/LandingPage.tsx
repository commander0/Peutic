import React, { useState, useEffect } from 'react';
import { Heart, CheckCircle, ArrowRight, ShieldCheck, Cookie, Instagram, Twitter, Linkedin, Play, Moon, Sun, Megaphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from './common/LanguageContext';
import { LanguageSelector } from './common/LanguageSelector';
import { AdminService } from '../services/adminService';
import { STABLE_AVATAR_POOL, INITIAL_COMPANIONS } from '../services/database';

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
    const [onlineCount, setOnlineCount] = useState(142);
    const [showCookies, setShowCookies] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [featuredSpecialists, setFeaturedSpecialists] = useState<Companion[]>([]);
    const { lang, setLang, t } = useLanguage();

    const [darkMode, setDarkMode] = useState(() => {
        const local = localStorage.getItem('peutic_theme');
        if (local) return local === 'dark';
        return false;
    });

    const [settings, setSettings] = useState(AdminService.getSettings());

    useEffect(() => {
        AdminService.syncGlobalSettings().then(setSettings);
        const hasAccepted = localStorage.getItem('peutic_cookies_accepted');
        if (!hasAccepted) {
            const timer = setTimeout(() => {
                setShowCookies(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    // Dynamic Specialists Online Counter
    useEffect(() => {
        const interval = setInterval(() => {
            setOnlineCount(prev => {
                const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
                return Math.max(80, Math.min(450, prev + delta));
            });
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        const loadComps = async () => {
            const fromDb = await AdminService.getCompanions();
            const list = (fromDb && fromDb.length > 0) ? fromDb : INITIAL_COMPANIONS;
            const unique = Array.from(new Map(list.map(item => [item.id, item])).values());
            setFeaturedSpecialists(unique);
        };
        loadComps();

        return () => {
            window.removeEventListener('scroll', handleScroll);
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

    const displayList = featuredSpecialists.length > 0 ? featuredSpecialists : INITIAL_COMPANIONS;
    const half = Math.ceil(displayList.length / 2);
    const row1 = displayList.slice(0, half);
    const row2 = displayList.slice(half);
    const marqueeRow1 = [...row1, ...row1];
    const marqueeRow2 = [...row2, ...row2];

    return (
        <div className={`min-h-screen bg-[#FFFBEB] dark:bg-[#0A0A0A] font-sans text-[#0A0A0A] dark:text-[#F3F4F6] selection:bg-yellow-200 selection:text-black transition-colors duration-500 ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>

            {/* BACKGROUND VIDEO - HUMAN CONNECTION THEME */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute min-w-full min-h-full object-cover opacity-100"
                >
                    <source src="https://videos.pexels.com/video-files/3195325/3195325-uhd_2560_1440_25fps.mp4" type="video/mp4" />
                </video>
                {/* Visual Overlay for Readability */}
                <div className="absolute inset-0 bg-[#FFFBEB]/70 dark:bg-black/60 backdrop-blur-[1px]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FFFBEB]/30 dark:via-transparent to-[#FFFBEB] dark:to-[#0A0A0A]"></div>
            </div>

            {/* PUBLIC BROADCAST BANNER */}
            {settings.broadcastMessage && (
                <div className="bg-yellow-500 text-black py-2 px-4 shadow-lg animate-in slide-in-from-top duration-500 relative z-50 overflow-hidden group">
                    <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-[-20deg]"></div>
                    <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
                        <Megaphone className="w-3.5 h-3.5 animate-bounce" />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-center">{settings.broadcastMessage}</span>
                    </div>
                </div>
            )}

            <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${scrolled ? 'py-2 bg-[#FFFBEB]/90 dark:bg-black/90 backdrop-blur-xl border-b border-yellow-200/30 dark:border-gray-800 shadow-sm' : 'py-3 md:py-6 bg-transparent border-transparent'}`}>
                <div className="max-w-7xl mx-auto px-2 md:px-8 flex justify-between items-center">
                    <div className="flex items-center gap-2 md:gap-3 group cursor-pointer shrink-0">
                        <div className="w-8 h-8 md:w-9 md:h-9 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Heart className="w-5 h-5 md:w-5 md:h-5 fill-black text-black" />
                        </div>
                        <span className="text-xl md:text-2xl font-black tracking-tight dark:text-white">Peutic</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-6">
                        <LanguageSelector currentLanguage={lang} onLanguageChange={setLang} />
                        <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0">
                            {darkMode ? <Sun className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" /> : <Moon className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />}
                        </button>
                        <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1 hidden sm:block"></div>
                        <button onClick={() => onLoginClick(false)} className="text-xs font-black uppercase tracking-widest hover:opacity-70 transition-opacity px-2 md:px-3 dark:text-gray-300 shrink-0 whitespace-nowrap">
                            {t('nav_signin')}
                        </button>
                        <button onClick={() => onLoginClick(true)} className="bg-yellow-400 text-black px-4 py-2 md:px-6 md:py-2.5 rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-yellow-300 transition-all hover:scale-105 active:scale-95 shadow-xl shrink-0 whitespace-nowrap">
                            {t('nav_join')}
                        </button>
                    </div>
                </div>
            </nav>

            <section className="relative pt-24 pb-12 md:pt-44 md:pb-24 px-4 md:px-6 z-10">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 md:gap-12 items-center">
                    <div className="lg:col-span-7 space-y-5 md:space-y-8 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-1.5 bg-white/80 dark:bg-gray-900 border border-yellow-200/50 dark:border-gray-800 rounded-full shadow-sm transition-colors mx-auto lg:mx-0">
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 dark:text-gray-400">{onlineCount} {t('hero_badge')}</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] md:leading-[1] tracking-tighter dark:text-white">
                            {t('hero_title_1')} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-500 dark:from-yellow-500 dark:to-orange-400">{t('hero_title_2')}</span>
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-gray-900 dark:text-gray-200 font-bold max-w-xl mx-auto lg:mx-0 leading-relaxed px-2 drop-shadow-sm">
                            {t('hero_subtitle')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start pt-2 md:pt-3">
                            <button onClick={() => onLoginClick(true)} className="px-8 py-3 md:px-9 md:py-4 bg-[#FACC15] text-black rounded-full font-black text-sm md:text-base uppercase tracking-widest shadow-[0_20px_40px_-15px_rgba(250,204,21,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(250,204,21,0.5)] transition-all hover:-translate-y-1 flex items-center justify-center gap-2.5">
                                <Play className="w-4 h-4 fill-black" /> {t('cta_start')}
                            </button>
                            <button onClick={() => onLoginClick(true)} className="px-8 py-3 md:px-9 md:py-4 bg-white/90 dark:bg-gray-900 border border-yellow-200 dark:border-gray-700 text-black dark:text-white rounded-full font-black text-sm md:text-base uppercase tracking-widest hover:bg-yellow-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2.5 backdrop-blur-sm">
                                {t('cta_team')}
                            </button>
                        </div>
                        <div className="flex items-center justify-center lg:justify-start gap-4 md:gap-6 pt-3 md:pt-4">
                            <div className="flex -space-x-2">
                                {STABLE_AVATAR_POOL.slice(0, 4).map((src, i) => (
                                    <img key={i} src={src} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-[#FFFBEB] dark:border-black object-cover shadow-md" alt="User" />
                                ))}
                            </div>
                            <p className="text-[9px] md:text-xs font-bold text-gray-800 dark:text-gray-300 uppercase tracking-widest drop-shadow-sm">{t('trusted_by')}</p>
                        </div>
                    </div>
                    <div className="lg:col-span-5 relative mt-6 md:mt-0">
                        <div className="relative w-4/5 md:w-full max-w-xs mx-auto -rotate-1 hover:rotate-0 transition-all duration-500 transform-gpu backface-hidden">
                            <div
                                className="relative aspect-[4/5] bg-gray-900 rounded-[2rem] overflow-hidden shadow-2xl border-4 md:border-8 border-white dark:border-gray-800 group z-10"
                                style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)', maskImage: 'radial-gradient(white, black)' }}
                            >
                                <img src={INITIAL_COMPANIONS[0].imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Ruby" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"></div>
                                <div className="absolute top-5 left-5 md:top-6 md:left-6">
                                    <div className="bg-black/30 backdrop-blur-xl border border-white/20 px-3 py-1 rounded-full flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white">{t('live_link')}</span>
                                    </div>
                                </div>
                                <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-8">
                                    <p className="text-yellow-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] mb-1">{t('primary_spec')}</p>
                                    <h3 className="text-white text-2xl md:text-3xl font-black mb-0.5">Ruby</h3>
                                    <p className="text-gray-300 font-medium italic text-xs md:text-sm">Anxiety & Emotional Regulation</p>
                                </div>
                            </div>
                            <div className="absolute -bottom-4 -left-4 md:-bottom-5 md:-left-5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-3 md:p-5 rounded-2xl md:rounded-3xl shadow-xl border border-yellow-100 dark:border-gray-700 animate-float z-20 transition-colors">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-xl"><CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500" /></div>
                                    <div>
                                        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">Connection</p>
                                        <p className="text-sm md:text-base font-black dark:text-white">{t('secure_conn')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            <section className="py-12 md:py-16 bg-white/50 dark:bg-black/40 backdrop-blur-sm relative overflow-hidden transition-colors border-y border-yellow-100/30 dark:border-gray-800/30 z-10">
                <div className="max-w-7xl mx-auto text-center mb-8 md:mb-12 px-6">
                    <p className="text-yellow-600 dark:text-yellow-500 font-black uppercase tracking-[0.4em] text-[9px] md:text-[10px] mb-2 md:mb-3">{t('roster_title')}</p>
                    <h2 className="text-3xl md:text-4xl font-black leading-[1.1] tracking-tight mb-3 md:mb-4 dark:text-white">{t('roster_heading')}</h2>
                    <button onClick={() => onLoginClick(true)} className="flex items-center gap-2 font-black uppercase tracking-widest text-[9px] md:text-[10px] hover:gap-3 transition-all justify-center dark:text-gray-300">
                        {t('roster_btn')} <ArrowRight className="w-3 h-3 text-[#FACC15]" />
                    </button>
                </div>

                {/* DUAL MARQUEE SYSTEM RESTORED */}
                <style>{`
                    @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                    @keyframes marquee-reverse { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
                    .animate-marquee { animation: marquee 50s linear infinite; }
                    .animate-marquee-reverse { animation: marquee-reverse 60s linear infinite; }
                    .marquee-container:hover .animate-marquee, .marquee-container:hover .animate-marquee-reverse { animation-play-state: paused; }
                `}</style>
                <div className="relative w-full marquee-container space-y-6">
                    <div className="absolute left-0 top-0 bottom-0 w-12 md:w-60 bg-gradient-to-r from-[#FFFBEB] dark:from-[#0A0A0A] to-transparent z-20 pointer-events-none transition-colors"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-12 md:w-60 bg-gradient-to-l from-[#FFFBEB] dark:from-[#0A0A0A] to-transparent z-20 pointer-events-none transition-colors"></div>
                    
                    <div className="flex flex-col gap-4 md:gap-8">
                        {/* Row 1: Forward Scroll */}
                        <div className="flex gap-4 md:gap-6 animate-marquee w-fit px-4">
                            {marqueeRow1.map((spec, i) => (
                                <div key={`${spec.id}-1-${i}`} onClick={() => onLoginClick(true)} className="relative flex-shrink-0 w-36 h-48 md:w-52 md:h-64 bg-white dark:bg-gray-900 rounded-2xl md:rounded-[1.5rem] overflow-hidden shadow-lg border border-yellow-100 dark:border-gray-800 hover:scale-105 hover:shadow-2xl hover:border-yellow-400 transition-all duration-300 cursor-pointer group">
                                    <div className="h-[75%] md:h-[80%] w-full relative">
                                        <AvatarImage src={spec.imageUrl} className="w-full h-full object-cover" alt={spec.name} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                    </div>
                                    <div className="h-[25%] md:h-[20%] bg-white dark:bg-gray-900 p-2 flex flex-col justify-center items-center text-center relative z-10 transition-colors">
                                        <p className="text-[9px] md:text-[10px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest line-clamp-1">{spec.specialty}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Row 2: Reverse Scroll */}
                        <div className="flex gap-4 md:gap-6 animate-marquee-reverse w-fit px-4">
                            {marqueeRow2.map((spec, i) => (
                                <div key={`${spec.id}-2-${i}`} onClick={() => onLoginClick(true)} className="relative flex-shrink-0 w-36 h-48 md:w-52 md:h-64 bg-white dark:bg-gray-900 rounded-2xl md:rounded-[1.5rem] overflow-hidden shadow-lg border border-yellow-100 dark:border-gray-800 hover:scale-105 hover:shadow-2xl hover:border-yellow-400 transition-all duration-300 cursor-pointer group">
                                    <div className="h-[75%] md:h-[80%] w-full relative">
                                        <AvatarImage src={spec.imageUrl} className="w-full h-full object-cover" alt={spec.name} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                    </div>
                                    <div className="h-[25%] md:h-[20%] bg-white dark:bg-gray-900 p-2 flex flex-col justify-center items-center text-center relative z-10 transition-colors">
                                        <p className="text-[9px] md:text-[10px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest line-clamp-1">{spec.specialty}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <footer className="bg-white/90 dark:bg-[#0A0A0A] text-black dark:text-white py-12 md:py-16 px-6 relative z-20 transition-colors border-t border-yellow-100/50 dark:border-gray-800/50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-10 md:mb-12">
                        <div className="md:col-span-5 space-y-4 md:space-y-6">
                            <div className="flex items-center gap-3"><div className="w-7 h-7 md:w-9 md:h-9 bg-yellow-400 rounded-xl flex items-center justify-center"><Heart className="w-4 h-4 md:w-5 md:h-5 fill-black text-black" /></div><span className="text-xl md:text-2xl font-black tracking-tight">Peutic</span></div>
                            <p className="text-gray-800 dark:text-gray-400 text-xs md:text-sm leading-relaxed max-w-sm">{t('footer_desc')}</p>
                            <div className="flex gap-5">{[Twitter, Instagram, Linkedin].map((Icon, i) => (<button key={i} className="text-gray-800 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors hover:scale-110 transform"><Icon className="w-4 h-4 md:w-5 md:h-5" /></button>))}</div>
                        </div>
                    </div>
                    <div className="pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-gray-700 dark:text-gray-600 gap-4 md:gap-0">
                        <p>&copy; {new Date().getFullYear()} Peutic Inc. | ISO 27001 Certified</p>
                        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div><span>{t('ui_network_optimal')}</span></div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;