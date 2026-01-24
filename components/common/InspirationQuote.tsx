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
        // Pick random quote on mount/refresh
        const random = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        setQuote(random);
    }, []);

    return (
        <span className="inline-block text-[10px] md:text-xs font-medium text-gray-400 italic border-l border-gray-200 dark:border-gray-700 pl-2 ml-2 md:pl-3 md:ml-3 animate-in fade-in duration-1000 max-w-[150px] md:max-w-none truncate md:overflow-visible">
            "{quote}"
        </span>
    );
};
