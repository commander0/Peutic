export const getGreeting = (name: string): string => {
    const hour = new Date().getHours();
    const firstName = name.split(' ')[0] || 'Friend';

    if (hour < 5) return `Late Night Thoughts, ${firstName}`;
    if (hour < 12) return `Good Morning, ${firstName}`;
    if (hour < 17) return `Good Afternoon, ${firstName}`;
    if (hour < 21) return `Good Evening, ${firstName}`;
    return `Rest Well, ${firstName}`;
};

export const getDynamicQuote = (): string => {
    const quotes = [
        "Growth is a spiral process, doubling back on itself, reassessing and regrouping.",
        "The only way out is through.",
        "Your potential is endless.",
        "Breathe. You are here.",
        "Small steps are still progress.",
        "Bloom where you are planted.",
        "Trust the timing of your life.",
        "Peace comes from within. Do not seek it without.",
        "You are enough just as you are.",
        "Every storm runs out of rain.",
        "Healing is not linear.",
        "Be gentle with yourself. You are doing the best you can.",
        "Stars can't shine without darkness.",
        "Embrace the glorious mess that you are.",
        "This too shall pass."
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
};
