import React, { useState } from 'react';
import { X, Gift, Package, Globe, Leaf, Award, Sparkles } from 'lucide-react';
import { User } from '../../types';
import { useToast } from '../common/Toast';
import { UserService } from '../../services/userService';

interface SerenityShopProps {
    user: User;
    onClose: () => void;
    onUpdate: () => void;
}

const SHOP_ITEMS = [
    { id: 'donate_trees', type: 'altruism', title: 'Plant 5 Real Trees', desc: 'Donate to Trees for the Future.', cost: 50, icon: Leaf, color: 'text-green-400', bg: 'bg-green-500/20' },
    { id: 'donate_mha', type: 'altruism', title: 'Fund Therapy', desc: 'Donate to Mental Health America.', cost: 150, icon: Globe, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { id: 'physical_candle', type: 'physical', title: 'Calm Lavender Candle', desc: 'We ship a real candle to your door.', cost: 500, icon: Package, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    { id: 'physical_box', type: 'physical', title: 'Monthly Wellness Box', desc: 'Curated self-care physical box.', cost: 1200, icon: Gift, color: 'text-pink-400', bg: 'bg-pink-500/20' },
    { id: 'digital_dojo', type: 'digital', title: 'Cosmic Dojo Theme', desc: 'Unlock the cosmic background.', cost: 20, icon: Sparkles, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
];

export const SerenityShop: React.FC<SerenityShopProps> = ({ user, onClose, onUpdate }) => {
    const { showToast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    // We treat oracleTokens as "Serenity Coins" for the V4 economy
    const coins = user.oracleTokens || 0;

    const handlePurchase = async (item: typeof SHOP_ITEMS[0]) => {
        if (coins < item.cost) {
            showToast("Not enough Serenity Coins.", "error");
            return;
        }

        setIsProcessing(true);
        try {
            // Deduct coins (re-using the oracle token deduction logic)
            const newBalance = coins - item.cost;
            await UserService.updateUser({ ...user, oracleTokens: newBalance });

            if (item.type === 'physical') {
                showToast(`Physical order placed! Check your email for shipping details.`, "success");
            } else if (item.type === 'altruism') {
                showToast(`Thank you! Your donation for '${item.title}' has been processed.`, "success");
            } else {
                showToast(`Successfully unlocked ${item.title}!`, "success");
            }
            onUpdate();
        } catch (e) {
            showToast("Failed to process transaction.", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#0A0A0A] font-sans flex flex-col pt-safe px-safe">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0 bg-[#0A0A0A]/80 backdrop-blur-xl z-20 sticky top-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                        <Award className="w-6 h-6 text-black" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">The Altruism Bazaar</h1>
                        <p className="text-yellow-500 font-bold uppercase tracking-widest text-xs">Unified Tangible Economy</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
                        <Award className="w-5 h-5 text-yellow-500" />
                        <span className="text-white font-black text-lg">{coins}</span>
                        <span className="text-gray-400 text-xs font-bold uppercase">Coins</span>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 pb-32 custom-scrollbar">

                {/* Hero / Philosophy */}
                <div className="max-w-4xl mx-auto text-center space-y-4">
                    <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-600">
                        Turn Inner Peace into Outer Impact
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                        Every minute you spend grounding yourself earns Serenity Coins. Spend them on digital upgrades, tangible real-world wellness products delivered to your door, or donate them to global charities.
                    </p>
                </div>

                {/* Categories */}
                {['altruism', 'physical', 'digital'].map(category => {
                    const items = SHOP_ITEMS.filter(i => i.type === category);
                    if (items.length === 0) return null;

                    return (
                        <div key={category} className="max-w-6xl mx-auto space-y-6">
                            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                <h3 className="text-white text-xl font-black uppercase tracking-widest">
                                    {category === 'altruism' ? 'Global Impact (Charity)' : category === 'physical' ? 'Tangible Goods (Shipped)' : 'Digital Upgrades'}
                                </h3>
                                {category === 'physical' && <span className="bg-yellow-500/20 text-yellow-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Real World</span>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {items.map(item => {
                                    const Icon = item.icon;
                                    const canAfford = coins >= item.cost;

                                    return (
                                        <div key={item.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:bg-white/10 transition-all group hover:-translate-y-1 hover:shadow-2xl">
                                            <div>
                                                <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                                    <Icon className={`w-7 h-7 ${item.color}`} />
                                                </div>
                                                <h4 className="text-xl font-black text-white mb-2">{item.title}</h4>
                                                <p className="text-gray-400 text-sm leading-relaxed mb-6">{item.desc}</p>
                                            </div>

                                            <div className="flex items-center justify-between mt-auto border-t border-white/10 pt-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Award className="w-5 h-5 text-yellow-500" />
                                                    <span className="text-white font-bold text-lg">{item.cost}</span>
                                                </div>
                                                <button
                                                    onClick={() => handlePurchase(item)}
                                                    disabled={!canAfford || isProcessing}
                                                    className={`px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider transition-all ${canAfford ? 'bg-white text-black hover:bg-yellow-400' : 'bg-white/10 text-gray-500 cursor-not-allowed'}`}
                                                >
                                                    {isProcessing ? 'Processing' : canAfford ? 'Claim' : 'Locked'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

            </div>

            {/* Bottom Gradient Overlay purely for aesthetics */}
            <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none z-10"></div>
        </div>
    );
};
