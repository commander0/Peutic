
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Lock, FileText, Mail, Send, MessageCircle, CheckCircle, Heart, Globe, Users, Phone, AlertTriangle, Play, Award, Star, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { STABLE_AVATAR_POOL } from '../services/database';

interface StaticPageProps {
  type: 'privacy' | 'terms' | 'support' | 'about' | 'press' | 'safety' | 'crisis';
}

const StaticPages: React.FC<StaticPageProps> = ({ type }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('peutic_theme');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    // In production, this would send to an API
  };

  const renderContent = () => {
    switch (type) {
      case 'about':
        return (
          <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500">
            <div className="text-center pb-6 md:pb-8 border-b border-yellow-200 dark:border-gray-700">
                <Heart className="w-12 h-12 md:w-16 md:h-16 text-yellow-500 fill-yellow-500 mx-auto mb-4 animate-pulse" />
                <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Humanity On Demand</h1>
                <p className="text-base md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">We are building the future of emotional support by combining the warmth of human connection with the accessibility of modern technology.</p>
            </div>

            <section className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black mb-4 dark:text-white">Our Mission</h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 text-base md:text-lg">
                        Loneliness is a global epidemic. Traditional therapy is often inaccessible, expensive, or bound by waitlists. 
                        Peutic was born from a simple belief: <span className="font-bold bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-200 px-1">everyone deserves to be heard, instantly.</span>
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base md:text-lg">
                        We connect you with empathetic, verified specialists in seconds. No judgment. No stigma. Just pure, unfiltered human connection when you need it most.
                    </p>
                </div>
                <div className="relative">
                    <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=800&auto=format&fit=crop" className="rounded-3xl shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500" alt="Team meeting" />
                    <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-xl border border-yellow-100 dark:border-gray-700">
                        <p className="font-black text-2xl md:text-4xl text-yellow-500">1M+</p>
                        <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Sessions Completed</p>
                    </div>
                </div>
            </section>

            <section className="bg-yellow-50 dark:bg-yellow-900/10 rounded-3xl p-6 md:p-10 border border-yellow-100 dark:border-yellow-900/30">
                <h2 className="text-2xl md:text-3xl font-black mb-8 text-center dark:text-white">Our Core Values</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-yellow-200 dark:border-gray-700"><Globe className="w-6 h-6 text-yellow-600 dark:text-yellow-500"/></div>
                        <h3 className="font-bold text-lg mb-2 dark:text-white">Universal Access</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Democratizing mental wellness for every time zone and budget.</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-yellow-200 dark:border-gray-700"><Shield className="w-6 h-6 text-yellow-600 dark:text-yellow-500"/></div>
                        <h3 className="font-bold text-lg mb-2 dark:text-white">Radical Privacy</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">What happens in a session, stays in a session. Cryptographically guaranteed.</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-yellow-200 dark:border-gray-700"><Users className="w-6 h-6 text-yellow-600 dark:text-yellow-500"/></div>
                        <h3 className="font-bold text-lg mb-2 dark:text-white">Human First</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Technology connects us, but empathy heals us.</p>
                    </div>
                </div>
            </section>
          </div>
        );

      case 'press':
        return (
          <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500">
             <div className="text-center pb-6 md:pb-8 border-b border-yellow-200 dark:border-gray-700">
                <div className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500"/> Impact Report
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">Lives Changed</h1>
                <p className="text-base md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Real stories from the Peutic community. See how instant connection is transforming mental wellness.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {[
                    { img: STABLE_AVATAR_POOL[1], name: "Sarah J.", role: "Architect", quote: "I used to wait weeks for a therapy appointment. With Peutic, I found calm before my big presentation in minutes. It's a game changer." },
                    { img: STABLE_AVATAR_POOL[0], name: "Michael R.", role: "Student", quote: "Exam stress was eating me alive. Connecting with a specialist at 3 AM saved my semester. I felt understood." },
                    { img: STABLE_AVATAR_POOL[3], name: "Elena G.", role: "New Mom", quote: "Postpartum loneliness is real. Having a friendly face just a click away made me feel human again." },
                    { img: STABLE_AVATAR_POOL[2], name: "David K.", role: "Veteran", quote: "Traditional settings felt too clinical. Here, I can just talk. It feels like talking to a wise friend." },
                    { img: STABLE_AVATAR_POOL[5], name: "Priya M.", role: "Founder", quote: "Founder burnout is real. Peutic helps me reset my mindset between high-stakes meetings." },
                    { img: STABLE_AVATAR_POOL[4], name: "James L.", role: "Musician", quote: "I use it to clear creative blocks. The specialists ask the right questions to get me unstuck." }
                ].map((story, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                        <div className="flex items-center gap-4 mb-4">
                            <img src={story.img} alt={story.name} className="w-14 h-14 rounded-full object-cover border-2 border-yellow-200 dark:border-yellow-600" />
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">{story.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{story.role}</p>
                            </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 italic leading-relaxed text-sm md:text-base">"{story.quote}"</p>
                        <div className="mt-4 flex gap-1">
                            {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-black dark:bg-white text-white dark:text-black rounded-3xl p-8 md:p-10 text-center relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl md:text-3xl font-black mb-6">Media Inquiries</h2>
                    <p className="text-gray-400 dark:text-gray-600 mb-8 max-w-xl mx-auto text-sm md:text-base">Writing a story about the future of mental health? We'd love to chat.</p>
                    <a href="mailto:press@peutic.com" className="inline-flex items-center gap-2 bg-white dark:bg-black text-black dark:text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-bold hover:bg-yellow-400 dark:hover:bg-yellow-400 hover:text-black transition-colors text-sm md:text-base">
                        <Mail className="w-5 h-5"/> Contact Press Team
                    </a>
                </div>
            </div>
          </div>
        );

      case 'safety':
        return (
          <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500">
             <div className="text-center pb-6 md:pb-8 border-b border-yellow-200 dark:border-gray-700">
                <ShieldCheck className="w-12 h-12 md:w-16 md:h-16 text-green-600 mx-auto mb-4" />
                <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">Safety Standards</h1>
                <p className="text-base md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Your safety and privacy are the foundation of our platform. We go beyond industry standards.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 dark:text-white"><Lock className="w-5 h-5 md:w-6 md:h-6 text-green-600"/> Military-Grade Encryption</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                        Every video packet is encrypted using AES-256 standards. Our architecture is Peer-to-Peer (P2P) focused, meaning video data flows directly between you and the specialist whenever possible, bypassing central servers entirely.
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 dark:text-white"><Award className="w-5 h-5 md:w-6 md:h-6 text-yellow-600"/> Specialist Vetting</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                        We accept less than 1% of applicants. Every specialist undergoes a vigorous 5-step background check, credential verification, and emotional resonance testing before they ever speak to a user.
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 dark:text-white"><AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-orange-600"/> Real-time Moderation AI</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                        Our passive safety AI monitors for signs of abuse or harassment to protect both users and specialists. If a violation is detected, the session is flagged for immediate human review.
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 dark:text-white"><FileText className="w-5 h-5 md:w-6 md:h-6 text-blue-600"/> Zero-Knowledge Storage</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                        We do not store video recordings of your sessions unless you explicitly opt-in for therapeutic review. Your journal entries are encrypted at rest with a key derived from your password.
                    </p>
                </div>
            </div>
          </div>
        );

      case 'crisis':
        return (
          <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500">
             <div className="text-center pb-6 md:pb-8 border-b border-red-200 dark:border-red-900">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 text-red-600 dark:text-red-500" />
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">Crisis Resources</h1>
                <p className="text-lg md:text-xl text-red-600 dark:text-red-400 font-bold max-w-2xl mx-auto">Peutic is not a replacement for emergency services.</p>
                <p className="text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto text-sm md:text-base">If you or someone you know is in immediate danger, please use the following resources immediately.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-red-50 dark:bg-red-950/20 p-6 md:p-8 rounded-3xl border border-red-100 dark:border-red-900 text-center">
                    <h3 className="text-xl md:text-2xl font-black text-red-700 dark:text-red-400 mb-2">Emergency Services</h3>
                    <p className="text-red-600 dark:text-red-300/80 mb-6 text-sm md:text-base">Immediate Police/Ambulance Assistance</p>
                    <a href="tel:911" className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-black text-xl md:text-2xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20">
                        <Phone className="w-5 h-5 md:w-6 md:h-6"/> Call 911
                    </a>
                    <p className="text-xs text-red-400 mt-4 font-bold uppercase tracking-widest">In the United States</p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 md:p-8 rounded-3xl border border-blue-100 dark:border-blue-900 text-center">
                    <h3 className="text-xl md:text-2xl font-black text-blue-700 dark:text-blue-400 mb-2">Suicide & Crisis Lifeline</h3>
                    <p className="text-blue-600 dark:text-blue-300/80 mb-6 text-sm md:text-base">24/7 Free & Confidential Support</p>
                    <a href="tel:988" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-black text-xl md:text-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                        <Phone className="w-5 h-5 md:w-6 md:h-6"/> Call 988
                    </a>
                    <p className="text-xs text-blue-400 mt-4 font-bold uppercase tracking-widest">Available Nationwide</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-xl md:text-2xl font-bold mb-6 dark:text-white">International Resources</h3>
                <div className="grid md:grid-cols-2 gap-4 text-xs md:text-sm">
                    <div className="flex justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <span className="font-bold text-gray-700 dark:text-gray-300">United Kingdom</span>
                        <a href="tel:111" className="font-bold text-blue-600 dark:text-blue-400">111 / 999</a>
                    </div>
                    <div className="flex justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <span className="font-bold text-gray-700 dark:text-gray-300">Canada</span>
                        <a href="tel:988" className="font-bold text-blue-600 dark:text-blue-400">988</a>
                    </div>
                    <div className="flex justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <span className="font-bold text-gray-700 dark:text-gray-300">Australia</span>
                        <a href="tel:000" className="font-bold text-blue-600 dark:text-blue-400">000</a>
                    </div>
                    <div className="flex justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <span className="font-bold text-gray-700 dark:text-gray-300">Europe (General)</span>
                        <a href="tel:112" className="font-bold text-blue-600 dark:text-blue-400">112</a>
                    </div>
                </div>
                <div className="mt-6 text-center">
                    <a href="https://www.befrienders.org/" target="_blank" rel="noreferrer" className="text-gray-500 font-bold underline hover:text-black dark:text-gray-400 dark:hover:text-white text-xs md:text-sm">Find a helpline in your country</a>
                </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
            <div className="border-b border-yellow-200 dark:border-gray-700 pb-4 md:pb-6">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">Last Updated: October 24, 2025</p>
            </div>

            <section className="bg-yellow-50 dark:bg-yellow-900/10 p-6 rounded-2xl border border-yellow-200 dark:border-yellow-900/30">
              <h2 className="text-lg font-black text-yellow-800 dark:text-yellow-500 uppercase tracking-wider mb-2">Important Disclaimer</h2>
              <p className="text-sm text-yellow-900 dark:text-yellow-200 font-medium">
                PEUTIC IS NOT A HEALTHCARE PROVIDER. The Services are for emotional support and coaching purposes only. 
                They do not constitute medical advice, diagnosis, or treatment.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 dark:text-white"><Shield className="w-5 h-5 md:w-6 md:h-6 text-green-600"/> 1. Data Security & HIPAA</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 text-sm md:text-base">
                Peutic Inc. operates in compliance with HIPAA standards for data transmission. All video and audio streams are encrypted via AES-256 and WebRTC DTLS.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                We do <strong>not</strong> record or store video content of your sessions on our servers unless you explicitly opt-in for therapeutic review features.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold mb-4 dark:text-white">2. AI Data Usage</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                Our AI systems process text and audio transiently to facilitate the conversation. Your personal conversation data is <strong>never</strong> used to train our general public models.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold mb-4 dark:text-white">3. Information We Collect</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 text-sm md:text-base">
                <li><strong>Identity:</strong> Name, email, and age verification (18+ only).</li>
                <li><strong>Usage:</strong> Transaction history and session timestamps for billing.</li>
                <li><strong>Voluntary Data:</strong> Journal entries and mood logs (stored encrypted).</li>
              </ul>
            </section>
          </div>
        );

      case 'terms':
        return (
          <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
            <div className="border-b border-yellow-200 dark:border-gray-700 pb-4 md:pb-6">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2">Terms of Service</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">Effective Date: October 24, 2025</p>
            </div>

            <section className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-200 dark:border-red-900/30">
              <h2 className="text-lg font-black text-red-800 dark:text-red-500 uppercase tracking-wider mb-2">NON-MEDICAL SERVICE</h2>
              <p className="text-sm text-red-900 dark:text-red-200 font-bold">
                IF YOU ARE THINKING ABOUT SUICIDE OR IF YOU ARE CONSIDERING HARMING YOURSELF OR OTHERS OR IF YOU FEEL THAT ANY OTHER PERSON MAY BE IN ANY DANGER OR IF YOU HAVE ANY MEDICAL EMERGENCY, YOU MUST IMMEDIATELY CALL THE EMERGENCY SERVICE NUMBER (911 IN THE US) AND NOTIFY THE RELEVANT AUTHORITIES.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold mb-4 dark:text-white">1. Service Description</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 text-sm md:text-base">
                Peutic provides a platform for connecting with human and AI-assisted emotional support specialists. Our specialists act as coaches and companions, not licensed psychiatrists or doctors.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold mb-4 dark:text-white">2. Billing & Credits</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 text-sm md:text-base">
                <strong>Prepaid Credits:</strong> Services are purchased via prepaid credits. These credits do not expire as long as the account is active.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                <strong>Refunds:</strong> We offer a "Good Fit Guarantee". If you are unsatisfied with the first 5 minutes of any session, you may end the call and request a credit refund via support.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold mb-4 dark:text-white">3. Zero Tolerance Policy</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                We maintain a strict zero-tolerance policy for harassment, hate speech, or inappropriate sexual conduct towards our specialists. Violation of this policy results in an immediate permanent ban and forfeiture of all remaining credits.
              </p>
            </section>
          </div>
        );

      case 'support':
        return (
          <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
            <div className="border-b border-yellow-200 dark:border-gray-700 pb-4 md:pb-6">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2">Support Center</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">We are here to help, 24/7.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-6 dark:text-white">Contact Us</h2>
                {sent ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900 p-6 md:p-8 rounded-2xl text-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-green-900 dark:text-green-300 mb-2">Message Sent</h3>
                    <p className="text-green-700 dark:text-green-400/80 text-sm md:text-base">A support specialist will email you within 15 minutes.</p>
                    <button onClick={() => setSent(false)} className="mt-6 text-sm font-bold underline text-green-800 dark:text-green-400">Send another</button>
                  </div>
                ) : (
                  <form onSubmit={handleSupportSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                      <input 
                        required 
                        type="email" 
                        className="w-full p-3 md:p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-yellow-400 outline-none text-sm md:text-base dark:text-white"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">How can we help?</label>
                      <textarea 
                        required
                        className="w-full p-3 md:p-4 h-32 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-yellow-400 outline-none resize-none text-sm md:text-base dark:text-white"
                        placeholder="Describe your issue..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                      ></textarea>
                    </div>
                    <button type="submit" className="w-full py-3 md:py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition flex items-center justify-center gap-2 text-sm md:text-base">
                      <Send className="w-4 h-4" /> Send Message
                    </button>
                  </form>
                )}
              </div>

              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-6 dark:text-white">Common Questions</h2>
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl border border-yellow-100 dark:border-gray-700 shadow-sm">
                    <h3 className="font-bold text-base md:text-lg mb-2 flex items-center gap-2 dark:text-white"><Lock className="w-4 h-4 text-yellow-600 dark:text-yellow-500"/> Forgot Password?</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm">You can reset your password from the Login page. We will send a 6-digit secure code to your email.</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl border border-yellow-100 dark:border-gray-700 shadow-sm">
                    <h3 className="font-bold text-base md:text-lg mb-2 flex items-center gap-2 dark:text-white"><MessageCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-500"/> Audio/Video Issues?</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm">Ensure you have allowed browser permissions for Camera and Microphone. Refreshing the page usually resolves connection drops.</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl border border-yellow-100 dark:border-gray-700 shadow-sm">
                    <h3 className="font-bold text-base md:text-lg mb-2 flex items-center gap-2 dark:text-white"><FileText className="w-4 h-4 text-yellow-600 dark:text-yellow-500"/> Billing Inquiries</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm">Refunds are processed automatically for dropped calls under 30 seconds. Check your History tab for details.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBEB] dark:bg-black font-sans transition-colors duration-500">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <Link to="/" className="inline-flex items-center gap-2 font-bold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white mb-6 md:mb-8 transition-colors text-sm md:text-base">
          <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" /> Back to Home
        </Link>
        
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-3xl p-6 md:p-16 border border-yellow-100 dark:border-gray-800 shadow-xl transition-colors duration-500">
          {renderContent()}
        </div>

        <div className="mt-8 md:mt-12 text-center text-gray-400 dark:text-gray-600 text-xs">
          &copy; 2025 Peutic Inc. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default StaticPages;
