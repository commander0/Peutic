import React, { useState } from 'react';
import { ArrowLeft, Shield, Lock, FileText, Mail, Send, MessageCircle, CheckCircle, Heart, Globe, Users, Briefcase, Award, Phone, AlertTriangle, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StaticPageProps {
  type: 'privacy' | 'terms' | 'support' | 'about' | 'careers' | 'press' | 'safety' | 'crisis';
}

const StaticPages: React.FC<StaticPageProps> = ({ type }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    // In production, this would send to an API
  };

  const renderContent = () => {
    switch (type) {
      case 'privacy':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="border-b border-yellow-200 pb-6">
              <h1 className="text-4xl font-black text-gray-900 mb-2">Privacy Policy</h1>
              <p className="text-gray-600">Last Updated: October 24, 2025</p>
            </div>

            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Shield className="w-6 h-6 text-green-600"/> 1. HIPAA & Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Peutic Inc. ("we", "us") is committed to protecting your medical and personal information. 
                We operate in full compliance with the Health Insurance Portability and Accountability Act (HIPAA). 
                All video transmission is end-to-end encrypted using AES-256 standards.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We do <strong>not</strong> record video sessions unless explicitly requested by the user for therapeutic review. 
                Transient data processed by our AI models is anonymized and not used for model training without consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Account Information:</strong> Name, email, and date of birth for identity verification.</li>
                <li><strong>Health Data:</strong> Mood logs, journal entries, and session session summaries (stored encrypted).</li>
                <li><strong>Usage Data:</strong> Session duration and transaction history for billing purposes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Cookie Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We use secure HTTP-only cookies to maintain your session authentication. We also use minimal analytic cookies 
                to monitor system performance (latency, uptime) to ensure the quality of video calls. You may opt-out of non-essential cookies via the footer settings.
              </p>
            </section>
          </div>
        );

      case 'terms':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="border-b border-yellow-200 pb-6">
              <h1 className="text-4xl font-black text-gray-900 mb-2">Terms of Service</h1>
              <p className="text-gray-600">Effective Date: October 24, 2025</p>
            </div>

            <section>
              <h2 className="text-2xl font-bold mb-4">1. Service Usage</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Peutic provides an emotional support platform connecting users with AI-enhanced human specialists. 
                <strong>This service is not a replacement for emergency medical care.</strong> If you are in crisis or have suicidal ideation, 
                please call your local emergency services immediately (988 in the US).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Payments & Billing</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Rate:</strong> Services are billed at the rate locked in during signup (currently $1.49/USD per minute).
                Billing is calculated per second.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Refunds:</strong> We offer a satisfaction guarantee. If a session was unsatisfactory due to technical issues, 
                please contact support within 24 hours for a full credit refund.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. User Conduct</h2>
              <p className="text-gray-700 leading-relaxed">
                Users agree to treat specialists with respect. Harassment, hate speech, or inappropriate behavior during video calls 
                will result in an immediate permanent ban and forfeiture of remaining balance.
              </p>
            </section>
          </div>
        );

      case 'support':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="border-b border-yellow-200 pb-6">
              <h1 className="text-4xl font-black text-gray-900 mb-2">Support Center</h1>
              <p className="text-gray-600">We are here to help, 24/7.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
                {sent ? (
                  <div className="bg-green-50 border border-green-100 p-8 rounded-2xl text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-green-900 mb-2">Message Sent</h3>
                    <p className="text-green-700">A support specialist will email you within 15 minutes.</p>
                    <button onClick={() => setSent(false)} className="mt-6 text-sm font-bold underline">Send another</button>
                  </div>
                ) : (
                  <form onSubmit={handleSupportSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                      <input 
                        required 
                        type="email" 
                        className="w-full p-4 rounded-xl border border-gray-200 bg-white focus:border-yellow-400 outline-none"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">How can we help?</label>
                      <textarea 
                        required
                        className="w-full p-4 h-32 rounded-xl border border-gray-200 bg-white focus:border-yellow-400 outline-none resize-none"
                        placeholder="Describe your issue..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                      ></textarea>
                    </div>
                    <button type="submit" className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" /> Send Message
                    </button>
                  </form>
                )}
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-6">Common Questions</h2>
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-xl border border-yellow-100 shadow-sm">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Lock className="w-4 h-4 text-yellow-600"/> Forgot Password?</h3>
                    <p className="text-gray-600 text-sm">You can reset your password from the Login page. We will send a 6-digit secure code to your email.</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-yellow-100 shadow-sm">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><MessageCircle className="w-4 h-4 text-yellow-600"/> Audio/Video Issues?</h3>
                    <p className="text-gray-600 text-sm">Ensure you have allowed browser permissions for Camera and Microphone. Refreshing the page usually resolves connection drops.</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-yellow-100 shadow-sm">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-yellow-600"/> Billing Inquiries</h3>
                    <p className="text-gray-600 text-sm">Refunds are processed automatically for dropped calls under 30 seconds. Check your History tab for details.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="border-b border-yellow-200 pb-6">
              <h1 className="text-4xl font-black text-gray-900 mb-2">About Peutic</h1>
              <p className="text-gray-600">Reimagining Human Connection.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        We believe that everyone deserves instant access to empathy. In a world that is increasingly disconnected, Peutic bridges the gap by combining the warmth of human compassion with the availability of modern technology.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        Founded in 2024 by a team of clinical psychologists and AI engineers, we set out to solve the "2 AM Problem"—where do you turn when you need to talk, but the world is asleep?
                    </p>
                </div>
                <div className="bg-yellow-100 rounded-3xl p-8 border border-yellow-200">
                    <div className="flex items-center gap-4 mb-4">
                        <Globe className="w-8 h-8 text-yellow-600" />
                        <div>
                            <h3 className="font-bold text-xl">Global Reach</h3>
                            <p className="text-sm text-gray-600">Serving 120+ Countries</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <Users className="w-8 h-8 text-yellow-600" />
                        <div>
                            <h3 className="font-bold text-xl">1 Million+</h3>
                            <p className="text-sm text-gray-600">Sessions Completed</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Heart className="w-8 h-8 text-yellow-600" />
                        <div>
                            <h3 className="font-bold text-xl">Human-Centric</h3>
                            <p className="text-sm text-gray-600">AI Enhanced, Not AI Replaced</p>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        );

      case 'careers':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="border-b border-yellow-200 pb-6">
              <h1 className="text-4xl font-black text-gray-900 mb-2">Join the Mission</h1>
              <p className="text-gray-600">Help us heal the world, one conversation at a time.</p>
            </div>
            <div className="bg-black text-white p-8 rounded-3xl mb-8">
                <h2 className="text-2xl font-bold mb-4">Why work here?</h2>
                <p className="text-gray-400 mb-6">We are a remote-first, async-friendly company. We value output over hours and empathy over ego.</p>
                <div className="flex gap-4">
                    <span className="px-4 py-2 bg-gray-800 rounded-full text-xs font-bold">Remote</span>
                    <span className="px-4 py-2 bg-gray-800 rounded-full text-xs font-bold">Competitive Equity</span>
                    <span className="px-4 py-2 bg-gray-800 rounded-full text-xs font-bold">Full Health</span>
                </div>
            </div>
            <div>
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5"/> Open Positions</h3>
                <div className="space-y-4">
                    {['Senior React Engineer', 'Clinical Director (EMEA)', 'Customer Success Lead', 'AI Research Scientist'].map(job => (
                        <div key={job} className="flex justify-between items-center p-4 border border-gray-200 rounded-xl hover:border-yellow-400 transition-colors cursor-pointer bg-white">
                            <span className="font-bold text-gray-800">{job}</span>
                            <span className="text-sm text-gray-500 font-bold">Apply &rarr;</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        );

      case 'press':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="border-b border-yellow-200 pb-6">
              <h1 className="text-4xl font-black text-gray-900 mb-2">Press & Media</h1>
              <p className="text-gray-600">Latest news and assets.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
                {[
                    { outlet: "TechCrunch", title: "Peutic raises Series A to democratize therapy.", date: "Oct 2024" },
                    { outlet: "The Verge", title: "Is AI-Assisted human care the future?", date: "Sep 2024" },
                    { outlet: "Forbes", title: "Top 50 Mental Health Startups to Watch.", date: "Aug 2024" }
                ].map((article, i) => (
                    <div key={i} className="p-6 border border-gray-200 rounded-2xl hover:shadow-lg transition-shadow bg-white">
                        <p className="text-xs font-bold text-yellow-600 uppercase mb-2">{article.outlet}</p>
                        <h3 className="font-bold text-lg mb-4">{article.title}</h3>
                        <p className="text-gray-400 text-xs">{article.date}</p>
                    </div>
                ))}
            </div>
            <div className="bg-gray-100 p-8 rounded-2xl mt-8">
                <h3 className="font-bold text-lg mb-2">Media Inquiries</h3>
                <p className="text-gray-600 text-sm mb-4">For interviews, brand assets, or statements, please contact our comms team.</p>
                <a href="mailto:press@peutic.com" className="text-black font-bold underline decoration-yellow-400 decoration-2">press@peutic.com</a>
            </div>
          </div>
        );

      case 'safety':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="border-b border-yellow-200 pb-6">
              <h1 className="text-4xl font-black text-gray-900 mb-2">Safety Standards</h1>
              <p className="text-gray-600">Our uncompromising commitment to your safety.</p>
            </div>
            <section className="space-y-6">
                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0"><Award className="w-6 h-6 text-green-600"/></div>
                    <div>
                        <h3 className="font-bold text-xl mb-2">Specialist Vetting</h3>
                        <p className="text-gray-600 leading-relaxed">
                            We accept less than 1% of applicants. Every specialist undergoes a rigorous 5-stage vetting process including background checks, clinical roleplay scenarios, and empathy assessments.
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"><Shield className="w-6 h-6 text-blue-600"/></div>
                    <div>
                        <h3 className="font-bold text-xl mb-2">Real-Time Moderation</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Our proprietary "Guardian AI" monitors session sentiment in real-time (without recording) to detect abusive behavior or safety risks, protecting both users and specialists.
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0"><Lock className="w-6 h-6 text-purple-600"/></div>
                    <div>
                        <h3 className="font-bold text-xl mb-2">Zero-Knowledge Architecture</h3>
                        <p className="text-gray-600 leading-relaxed">
                            We designed our video architecture so that even our engineers cannot eavesdrop on active calls. Your conversation exists only between you and the specialist.
                        </p>
                    </div>
                </div>
            </section>
          </div>
        );

      case 'crisis':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="border-b-4 border-red-500 pb-6">
              <h1 className="text-4xl font-black text-red-600 mb-2 flex items-center gap-3"><AlertTriangle className="w-10 h-10"/> Crisis Resources</h1>
              <p className="text-gray-900 font-bold">Peutic is NOT an emergency service.</p>
            </div>
            
            <div className="bg-red-50 border border-red-200 p-6 rounded-2xl">
                <p className="text-red-900 font-medium leading-relaxed">
                    If you or someone you know is in immediate danger, has thoughts of self-harm, or is experiencing a medical emergency, please disconnect from this site and call emergency services immediately.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><Phone className="w-5 h-5"/> United States</h3>
                    <ul className="space-y-3">
                        <li className="flex justify-between border-b pb-2"><span>Emergency</span><span className="font-black text-red-600">911</span></li>
                        <li className="flex justify-between border-b pb-2"><span>Suicide & Crisis Lifeline</span><span className="font-black text-blue-600">988</span></li>
                        <li className="flex justify-between border-b pb-2"><span>Crisis Text Line</span><span className="font-black">Text HOME to 741741</span></li>
                    </ul>
                </div>
                <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><Globe className="w-5 h-5"/> International</h3>
                    <ul className="space-y-3">
                        <li className="flex justify-between border-b pb-2"><span>United Kingdom</span><span className="font-black">111 / 999</span></li>
                        <li className="flex justify-between border-b pb-2"><span>Canada</span><span className="font-black">988</span></li>
                        <li className="flex justify-between border-b pb-2"><span>Australia</span><span className="font-black">000</span></li>
                        <li className="flex justify-between border-b pb-2"><span>Europe</span><span className="font-black">112</span></li>
                    </ul>
                </div>
            </div>
            <p className="text-gray-500 text-sm mt-8 text-center">We care about you. Please stay safe.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBEB] font-sans flex flex-col">
      <div className="max-w-4xl mx-auto px-4 py-12 flex-1">
        <Link to="/" className="inline-flex items-center gap-2 font-bold text-gray-500 hover:text-black mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-16 border border-yellow-100 shadow-xl">
          {renderContent()}
        </div>
      </div>

      {/* GLOBAL FOOTER */}
      <footer className="bg-black text-white py-16 px-4 md:px-8 border-t border-gray-900 mt-auto">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="space-y-4">
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                          <Heart className="w-5 h-5 fill-black text-black" />
                      </div>
                      <span className="text-xl font-bold tracking-tight">Peutic</span>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">
                      Pioneering the future of emotional support with human connection and AI precision. Secure, private, and always available.
                  </p>
                  <div className="flex gap-4">
                      <button className="text-gray-500 hover:text-white transition-colors"><Twitter className="w-5 h-5"/></button>
                      <button className="text-gray-500 hover:text-white transition-colors"><Instagram className="w-5 h-5"/></button>
                      <button className="text-gray-500 hover:text-white transition-colors"><Linkedin className="w-5 h-5"/></button>
                  </div>
              </div>
              
              <div>
                  <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-gray-400">Company</h4>
                  <ul className="space-y-3 text-sm text-gray-500">
                      <li><Link to="/about" className="hover:text-yellow-500 transition-colors">About Us</Link></li>
                      <li><Link to="/press" className="hover:text-yellow-500 transition-colors">Press</Link></li>
                  </ul>
              </div>

              <div>
                  <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-gray-400">Support</h4>
                  <ul className="space-y-3 text-sm text-gray-500">
                      <li><Link to="/support" className="hover:text-yellow-500 transition-colors">Help Center</Link></li>
                      <li><Link to="/safety" className="hover:text-yellow-500 transition-colors">Safety Standards</Link></li>
                      <li><Link to="/crisis" className="hover:text-yellow-500 transition-colors text-red-500 font-bold">Crisis Resources</Link></li>
                  </ul>
              </div>

              <div>
                  <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-gray-400">Legal</h4>
                  <ul className="space-y-3 text-sm text-gray-500">
                      <li><Link to="/privacy" className="hover:text-yellow-500 transition-colors">Privacy Policy</Link></li>
                      <li><Link to="/terms" className="hover:text-yellow-500 transition-colors">Terms of Service</Link></li>
                  </ul>
              </div>
          </div>
          
          <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600">
              <p>&copy; 2025 Peutic Inc. HIPAA Compliant.</p>
              <div className="flex items-center gap-2 mt-4 md:mt-0">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Systems Operational</span>
              </div>
          </div>
      </footer>
    </div>
  );
};

export default StaticPages;