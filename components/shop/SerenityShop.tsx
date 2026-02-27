import React, { useState } from 'react';
import { ShoppingBag, TreePine, Heart, Coffee, X, Sparkles, CheckCircle2, Star } from 'lucide-react';
import { User } from '../../types';
import { UserService } from '../../services/userService';

interface SerenityShopProps {
    user: User;
    balance: number;
    onClose: () => void;
    onPurchase: (cost: number, description: string) => void;
}

const ITEMS = [
    {
        id: 'charity-tree',
        type: 'charity',
        name: 'Plant a Virtuoso Tree',
        description: 'Contribute to global reforestation. Your focus minutes will be donated to plant one real tree via our partners.',
        cost: 50,
        icon: TreePine,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10'
    },
    {
        id: 'charity-meal',
        type: 'charity',
        name: 'Provide a Warm Meal',
        description: 'Convert your mental clarity into sustenance for someone in need.',
        cost: 30,
        icon: Heart,
        color: 'text-rose-500',
        bg: 'bg-rose-500/10'
    },
    {
        id: 'item-plushie',
        type: 'digital',
        name: 'Lumina Companion Plushie',
        description: 'Unlock the exclusive golden plushie on your dashboard.',
        cost: 15,
        icon: Star,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10'
    },
    {
        id: 'item-coffee',
        type: 'digital',
        name: 'Virtual Coffee for Developers',
        description: 'Send a virtual coffee to the team building Sanctuary.',
        cost: 5,
        icon: Coffee,
        color: 'text-amber-700',
        bg: 'bg-amber-700/10'
    },
    {
        id: 'charity-animal',
        type: 'charity',
        name: 'Protect Wildlife',
        description: 'Donate your focus to sponsor an endangered animal for a day.',
        cost: 10,
        icon: Heart,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10'
    },
    {
        id: 'digital-theme-sapphire',
        type: 'digital',
        name: 'Sapphire Aura Theme',
        description: 'Unlock an exclusive deep-blue crystalline dashboard theme.',
        cost: 25,
        icon: Sparkles,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10'
    },
    {
        id: 'charity-flowers',
        type: 'charity',
        name: 'Send Digital Flowers',
        description: 'Brighten someone else\'s World Pulse with a bouquet of gratitude.',
        cost: 15,
        icon: Heart,
        color: 'text-pink-500',
        bg: 'bg-pink-500/10'
    }
];

const SerenityShop: React.FC<SerenityShopProps> = ({ user, balance, onClose, onPurchase }) => {
    const [purchasedId, setPurchasedId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleBuy = async (item: typeof ITEMS[0]) => {
        if (balance < item.cost) return;

        setIsProcessing(true);
        // Instant Gratification
        onPurchase(item.cost, `Shop: ${item.name}`);
        setPurchasedId(item.id);

        // Play success sound
        const sound = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
        sound.volume = 0.5;
        sound.play().catch(() => { });

        setIsProcessing(false);

        // Auto clear success state
        setTimeout(() => setPurchasedId(null), 3000);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/5 relative overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
                    <div className="absolute top-0 right-0 p-32 bg-amber-400/20 dark:bg-amber-500/10 rounded-full blur-[80px]"></div>
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors z-10"><X className="w-6 h-6 dark:text-gray-400" /></button>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 bg-amber-100 dark:bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
                                    <ShoppingBag className="w-6 h-6" />
                                </div>
                                <h2 className="text-3xl font-black tracking-tight text-amber-900 dark:text-amber-100">The Serenity Store</h2>
                            </div>
                            <p className="text-amber-700/80 dark:text-amber-200/60 font-medium">Transform your mental focus into real-world impact & digital rewards.</p>
                        </div>

                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-1">Your Currency</span>
                            <div className="text-4xl font-black text-amber-500 drop-shadow-sm flex items-center gap-2">
                                {balance.toLocaleString()}
                                <span className="text-xl font-bold text-amber-600/50">Mins</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Grid */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50/50 dark:bg-transparent custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {ITEMS.map(item => {
                            const Icon = item.icon;
                            const canAfford = balance >= item.cost;
                            const isBuyingThis = isProcessing && purchasedId === null; // simplified logic
                            const justBought = purchasedId === item.id;

                            return (
                                <div
                                    key={item.id}
                                    className={`relative bg-white dark:bg-black/40 border border-gray-200 dark:border-white/5 rounded-3xl p-6 transition-all duration-300 ${canAfford ? 'hover:shadow-xl hover:-translate-y-1 hover:border-amber-300 dark:hover:border-amber-500/30' : 'opacity-75 grayscale-[0.5]'}`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-2xl ${item.bg} ${item.color}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`text-xl font-black ${canAfford ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>
                                                {item.cost}
                                            </span>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Minutes</span>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 font-medium">
                                        {item.description}
                                    </p>

                                    <button
                                        disabled={!canAfford || isProcessing || justBought}
                                        onClick={() => handleBuy(item)}
                                        className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                                            ${justBought ? 'bg-green-500 text-white' :
                                                canAfford ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-300' :
                                                    'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'}
                                        `}
                                    >
                                        {justBought ? (
                                            <><CheckCircle2 className="w-5 h-5 animate-in zoom-in" /> Acquired!</>
                                        ) : !canAfford ? (
                                            'Insufficient Balance'
                                        ) : (
                                            <><Sparkles className="w-4 h-4" /> Claim Reward</>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SerenityShop;
