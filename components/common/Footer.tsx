import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, Twitter, Instagram, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
    return (
        <footer className="border-t border-gray-100 dark:border-white/5 bg-white dark:bg-black py-12 md:py-16 transition-colors duration-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
                                <span className="font-serif font-black text-black">P</span>
                            </div>
                            <span className="font-serif text-xl font-bold tracking-tight dark:text-white">Peutic</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                            The gold standard in digital mental wellness.
                            Connecting you with premium specialists for secure, private, and instant support.
                        </p>
                        <div className="flex gap-4">
                            <SocialIcon Icon={Twitter} href="#" />
                            <SocialIcon Icon={Instagram} href="#" />
                            <SocialIcon Icon={Linkedin} href="#" />
                        </div>
                    </div>

                    {/* Links */}
                    <div className="col-span-1">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-gray-900 dark:text-white mb-4">Platform</h4>
                        <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                            <li><Link to="/" className="hover:text-yellow-500 transition-colors">Home</Link></li>
                            <li><Link to="/about" className="hover:text-yellow-500 transition-colors">About Us</Link></li>
                            <li><Link to="/safety" className="hover:text-yellow-500 transition-colors">Safety & Trust</Link></li>
                            <li><Link to="/crisis" className="hover:text-red-500 transition-colors">Crisis Resources</Link></li>
                        </ul>
                    </div>

                    <div className="col-span-1">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-gray-900 dark:text-white mb-4">Legal</h4>
                        <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                            <li><Link to="/privacy" className="hover:text-yellow-500 transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-yellow-500 transition-colors">Terms of Service</Link></li>
                            <li><Link to="/support" className="hover:text-yellow-500 transition-colors">Cookie Settings</Link></li>
                            <li><Link to="/admin/login" className="hover:text-yellow-500 transition-colors">Admin Portal</Link></li>
                        </ul>
                    </div>

                    {/* Trust Badge */}
                    <div className="col-span-1 bg-gray-50 dark:bg-white/5 rounded-2xl p-6 flex flex-col items-center text-center">
                        <ShieldCheck className="w-10 h-10 text-yellow-500 mb-3" />
                        <h5 className="font-bold text-gray-900 dark:text-white mb-1">HIPAA Compliant</h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                            Your data is encrypted end-to-end and protected by enterprise-grade security.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            Systems Operational
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
                    <p>&copy; {new Date().getFullYear()} Peutic Inc. All rights reserved.</p>
                    <p className="flex items-center gap-1">
                        Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> in San Francisco
                    </p>
                </div>
            </div>
        </footer>
    );
};

const SocialIcon = ({ Icon, href }: { Icon: any, href: string }) => (
    <a href={href} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-yellow-400 hover:text-black transition-all">
        <Icon className="w-4 h-4" />
    </a>
);
