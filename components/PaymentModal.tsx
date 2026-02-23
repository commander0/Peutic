import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, X, AlertTriangle, Lock } from 'lucide-react';
import { AdminService } from '../services/adminService';

const STRIPE_PUBLISHABLE_KEY = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY || '';

declare global {
    interface Window {
        Stripe?: any;
    }
}

interface PaymentModalProps {
    onClose: () => void;
    onSuccess: (mins: number, cost: number, token?: string) => void;
    initialError?: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, onSuccess, initialError }) => {
    const [amount, setAmount] = useState(20);
    const [isCustom, setIsCustom] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(initialError || '');
    const settings = AdminService.getSettings();

    const pricePerMin = settings.saleMode ? 1.59 : 1.99;
    const stripeRef = useRef<any>(null);
    const elementsRef = useRef<any>(null);
    const cardElementRef = useRef<any>(null);
    const mountNodeRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        // Feature Flag: Graceful Fallback Mode for Local Dev without Stripe Keys 
        if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY.startsWith('sk_')) {
            console.warn("DEV MODE: VITE_STRIPE_PUBLISHABLE_KEY is missing. Stripe UI will fallback to Sandbox Mode.");
            setError("Sandbox Mode Active: Stripe key missing. Simulated payments allowed for testing.");
            // Do NOT return here, we allow the UI to render the Sandbox fallback buttons
        } else {
            if (!window.Stripe) {
                console.error("CRITICAL: Stripe.js script not loaded in window.");
                setError("Stripe failed to load. Please check your internet connection and refresh.");
                return;
            }
        }
        if (!stripeRef.current) {
            try {
                // Only init Stripe if the key is valid
                if (STRIPE_PUBLISHABLE_KEY && !STRIPE_PUBLISHABLE_KEY.startsWith('sk_')) {
                    console.log("Initializing Stripe with key:", STRIPE_PUBLISHABLE_KEY.substring(0, 8) + "...");
                    stripeRef.current = window.Stripe(STRIPE_PUBLISHABLE_KEY);
                    elementsRef.current = stripeRef.current.elements();
                    const style = { base: { color: "#32325d", fontFamily: '"Manrope", sans-serif', fontSmoothing: "antialiased", fontSize: "16px", "::placeholder": { color: "#aab7c4" } } };
                    if (!cardElementRef.current) {
                        cardElementRef.current = elementsRef.current.create("card", { style: style, hidePostalCode: true });
                        if (mountNodeRef.current) cardElementRef.current.mount(mountNodeRef.current);
                    }
                }
            } catch (e: any) {
                console.error("Stripe Initialization Failed:", e);
                setError(`Secure Channel Unavailable (${e.message || "Init Error"}). Retrying...`);
            }
        }
    }, []);

    const setMountNode = (node: HTMLDivElement | null) => {
        mountNodeRef.current = node;
        if (node && cardElementRef.current) {
            try { cardElementRef.current.mount(node); } catch (e) { }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setError('');
        if (!amount || amount <= 0) { setError("Please enter a valid amount."); setProcessing(false); return; }

        // --- SANDBOX FALLBACK ---
        if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY.startsWith('sk_')) {
            console.log("Processing Simulated Sandbox Payment...");
            setTimeout(() => {
                setProcessing(false);
                const minutesAdded = Math.floor(amount / pricePerMin);
                onSuccess(minutesAdded, amount, "tok_sandbox_simulated");
            }, 1000);
            return;
        }

        // --- PRODUCTION FLOW ---
        if (!stripeRef.current || !cardElementRef.current) { setError("Payment system not initialized. Please try again later."); setProcessing(false); return; }
        try {
            const result = await stripeRef.current.createToken(cardElementRef.current);
            if (result.error) {
                setError(result.error.message);
                setProcessing(false);
            } else {
                const paymentToken = result.token.id;
                const minutesAdded = Math.floor(amount / pricePerMin);
                setTimeout(() => {
                    setProcessing(false);
                    onSuccess(minutesAdded, amount, paymentToken);
                }, 500);
            }
        } catch (err: any) {
            setError(err.message || "Payment failed.");
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-gray-100 dark:border-gray-800">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                        <span className="font-bold text-gray-700 dark:text-white">Secure Checkout</span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"><X className="w-5 h-5 dark:text-white" /></button>
                </div>
                <div className="p-8">
                    <div className="mb-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 font-medium">Select Amount to Add</p>
                        {!isCustom && <h2 className="text-5xl font-extrabold tracking-tight mb-6 dark:text-white">${amount.toFixed(2)}</h2>}
                        <div className="flex justify-center gap-2 mb-6 flex-wrap">
                            {[20, 50, 100, 250].map((val) => (
                                <button key={val} type="button" onClick={() => { setAmount(val); setIsCustom(false); }} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!isCustom && amount === val ? 'bg-black dark:bg-white dark:text-black text-white shadow-lg transform scale-105' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>${val}</button>
                            ))}
                            <button type="button" onClick={() => { setIsCustom(true); setAmount(0); }} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isCustom ? 'bg-black dark:bg-white dark:text-black text-white shadow-lg transform scale-105' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Custom</button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Adds approx. <span className="font-bold text-black dark:text-white">{Math.floor((amount || 0) / pricePerMin)} mins</span> of talk time.</p>
                    </div>
                    {error && (
                        <div className={`mb-4 p-3 border text-sm rounded-lg flex items-center gap-2 ${error.includes("Sandbox Mode")
                                ? 'bg-blue-50/50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                                : 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-900 text-red-600 dark:text-red-400'
                            }`}>
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 relative group transition-all focus-within:ring-2 focus-within:ring-yellow-400">
                            <div className="absolute top-0 right-0 p-2 opacity-50"><Lock className="w-3 h-3 text-gray-400" /></div>
                            <div ref={setMountNode} className="p-2" />
                        </div>
                        <button type="submit" disabled={processing || (amount <= 0) || (!!error && !error.includes("Sandbox Mode"))} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${processing || (amount <= 0) || (!!error && !error.includes("Sandbox Mode")) ? 'bg-gray-800 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-yellow-500 text-black hover:bg-yellow-400 hover:scale-[1.02]'}`}>
                            {processing ? <span className="animate-pulse">Processing...</span> : <><ShieldCheck className="w-5 h-5" /> Pay ${(amount || 0).toFixed(2)}</>}
                        </button>
                        <div className="flex justify-center items-center gap-2 opacity-60 grayscale hover:grayscale-0 transition-all">
                            <span className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1"><Lock className="w-3 h-3" /> Ends-to-End Encrypted via Stripe</span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
