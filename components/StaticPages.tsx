import React, { useState } from 'react';
import { ArrowLeft, Shield, Lock, FileText, Mail, Send, MessageCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StaticPageProps {
  type: 'privacy' | 'terms' | 'support';
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
          <div className="space-y-8">
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
          <div className="space-y-8">
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
          <div className="space-y-8">
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
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBEB] font-sans">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 font-bold text-gray-500 hover:text-black mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-16 border border-yellow-100 shadow-xl">
          {renderContent()}
        </div>

        <div className="mt-12 text-center text-gray-400 text-xs">
          &copy; 2025 Peutic Inc. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default StaticPages;