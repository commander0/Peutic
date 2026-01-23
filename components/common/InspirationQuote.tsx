import React, { useState, useEffect } from 'react';

const QUOTES = [
    "Breathe. This moment is yours.",
    "Small steps are still progress.",
    "You are stronger than you know.",
    "Peace begins with a pause.",
    "Your potential is infinite.",
    "Growth is a spiral process.",
    "Be gentle with yourself today.",
    "Every day is a fresh beginning.",
    "You are capable of amazing things.",
    "Trust the timing of your life."
];

export const InspirationQuote: React.FC = () => {
    const [quote, setQuote] = useState("");

    useEffect(() => {
        const random = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        setQuote(random);
    }, []);

    return (
        <div className="flex justify-end pr-2 md:pr-0">
             <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] italic border-r md:border-r-0 md:border-l border-gray-200 dark:border-gray-800 pr-3 md:pr-0 md:pl-3 animate-in fade-in duration-1000 line-clamp-1 max-w-[140px] sm:max-w-none text-right">
                "{quote}"
            </span>
        </div>
    );
};