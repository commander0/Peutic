import React, { useState } from 'react';
import { X, Sparkles, Coins } from 'lucide-react';
import { User } from '../../types';
import { useToast } from '../common/Toast';
import { UserService } from '../../services/userService';

interface SanctuaryShopProps {
    user: User;
    onClose: () => void;
    onPurchaseUpdate: (updatedUser: User) => void;
}

export const SANCTUARY_ITEMS = [
    { id: 'incense', name: 'Ceremonial Incense', desc: 'A steady stream of calming smoke.', price: 15, icon: '🌫️' },
    { id: 'bonsai', name: 'Ancient Bonsai', desc: 'A centuries-old miniature tree.', price: 50, icon: '🪴' },
    { id: 'lantern', name: 'Paper Lantern', desc: 'Casts a warm, ethereal glow.', price: 30, icon: '🏮' },
    { id: 'stones', name: 'Zen Stones', desc: 'Perfectly balanced smooth river stones.', price: 20, icon: '🪨' },
    { id: 'scroll', name: 'Wisdom Scroll', desc: 'An ancient hanging calligraphy scroll.', price: 40, icon: '📜' },
    { id: 'singing_bowl', name: 'Singing Bowl', desc: 'A resonant brass meditation bowl.', price: 35, icon: '🥣' }
];

const SanctuaryShop: React.FC<SanctuaryShopProps> = ({ user, onClose, onPurchaseUpdate }) => {
    const { showToast } = useToast();
    const [purchasing, setPurchasing] = useState<string | null>(null);

    const unlockedDecor = user.unlockedDecor || [];

    const handlePurchase = async (item: typeof SANCTUARY_ITEMS[0]) => {
        if (unlockedDecor.includes(item.id)) return;

        if (user.balance < item.price) {
            showToast(`You need ${item.price} focus minutes to acquire this.`, "error");
            return;
        }

        setPurchasing(item.id);

        try {
            // Deduct cost
            const success = await UserService.deductBalance(item.price, `Purchased Decor: ${item.name}`);
            if (success) {
                // Update user decor array
                const newDecor = [...unlockedDecor, item.id];
                const updatedUser = await UserService.updateUserPartial(user.id, {
                    unlockedDecor: newDecor,
                    balance: user.balance - item.price // local optimistic update
                });

                if (updatedUser) {
                    onPurchaseUpdate(updatedUser);
                    showToast(`Acquired ${item.name}!`, "success");
                }
            } else {
                showToast("Transaction failed.", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Failed to acquire item.", "error");
        }

        setPurchasing(null);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-stone-900 border border-amber-900/50 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl relative overflow-hidden">

                {/* Header */}
                <header className="p-6 border-b border-stone-800 flex justify-between items-center bg-stone-900/80 sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-serif text-amber-100 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            Sanctuary Archive
                        </h2>
                        <p className="text-stone-400 text-sm mt-1">Exchange focus minutes for physical manifestations.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 rounded-full border border-amber-500/30">
                            <Coins className="w-4 h-4 text-amber-500" />
                            <span className="text-amber-200 font-bold tabular-nums">{user.balance}m</span>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-stone-400 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Items Grid */}
                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SANCTUARY_ITEMS.map(item => {
                        const isUnlocked = unlockedDecor.includes(item.id);
                        const canAfford = user.balance >= item.price;
                        const isPurchasing = purchasing === item.id;

                        return (
                            <div
                                key={item.id}
                                className={`p-4 rounded-2xl border transition-all flex items-start gap-4
                                    ${isUnlocked
                                        ? 'bg-emerald-900/20 border-emerald-900/50 opacity-70'
                                        : 'bg-stone-800/40 border-stone-700/50 hover:bg-stone-800'
                                    }
                                `}
                            >
                                <div className="text-4xl bg-stone-900/80 p-3 rounded-xl border border-white/5 drop-shadow-md">
                                    {item.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-stone-200">{item.name}</h3>
                                    <p className="text-xs text-stone-500 mt-1 mb-3 leading-relaxed">{item.desc}</p>

                                    {isUnlocked ? (
                                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest border border-emerald-500/30 px-2 py-1 rounded inline-block">
                                            Manifested
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handlePurchase(item)}
                                            disabled={!canAfford || isPurchasing}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all
                                                ${canAfford
                                                    ? 'bg-amber-500 text-amber-950 hover:bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                                    : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                                                }
                                            `}
                                        >
                                            {isPurchasing ? 'Acquiring...' : `Offer ${item.price}m`}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SanctuaryShop;
