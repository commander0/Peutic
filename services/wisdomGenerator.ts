
// WisdomEngine.ts - Infinite Wisdom Generator
// providing both properly curated therapeutic quotes and dynamic combinatorial wisdom.

const CURATED_QUOTES = [
    "You don’t have to control your thoughts. You just have to stop letting them control you.",
    "Breathe. You’re going to be okay. Breathe and remember that you’ve been in this place before.",
    "Your present circumstances don’t determine where you can go; they merely determine where you start.",
    "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.",
    "You are not your anxiety. You are the observer of your anxiety.",
    "It is not the mountains ahead to climb that wear you out; it is the pebble in your shoe.",
    "Inner peace begins the moment you choose not to allow another person or event to control your emotions.",
    "You are strong enough to face it all, even if you don’t feel like it right now.",
    "Recovery is not a straight line. It's a messy path, but every step counts.",
    "Be kind to yourself. You are doing the best you can with what you have.",
    "The best way out is always through.",
    "This too shall pass. It might pass like a kidney stone, but it will pass.",
    "Your value doesn’t decrease based on someone’s inability to see your worth.",
    "Don't believe everything you think. Thoughts are just suggestions.",
    "Courage doesn't always roar. Sometimes courage is the quiet voice at the end of the day saying, 'I will try again tomorrow.'",
    "Nothing diminishes anxiety faster than action.",
    "You are allowed to be both a masterpiece and a work in progress simultaneously.",
    "Healing is not linear. Be patient with yourself.",
    "Stars can't shine without darkness.",
    "The only way to achieve the impossible is to believe it is possible.",
    "Do not let the behavior of others destroy your inner peace.",
    "Small steps in the right direction can turn out to be the biggest step of your life.",
    "You are worthy of the love you keep trying to give to everyone else.",
    "What you are looking for is already inside you.",
    "Peace comes from within. Do not seek it without.",
    "Happiness is not something ready made. It comes from your own actions.",
    "Turn your wounds into wisdom.",
    "The greatest weapon against stress is our ability to choose one thought over another.",
    "You don't have to see the whole staircase, just take the first step.",
    "Self-care is how you take your power back.",
    "Your mind will answer most questions if you learn to relax and wait for the answer.",
    "Every day is a fresh beginning.",
    "Believe you can and you're halfway there.",
    "Difficult roads often lead to beautiful destinations.",
    "Don't count the days, make the days count.",
    "Simplicity is the ultimate sophistication.",
    "Change your thoughts and you change your world.",
    "It always seems impossible until it's done.",
    "Keep your face to the sunshine and you cannot see a shadow.",
    "Positive anything is better than negative nothing.",
    "Limit your 'always' and your 'nevers'.",
    "Choose to be optimistic, it feels better.",
    "A negative mind will never give you a positive life.",
    "If you want to live a happy life, tie it to a goal, not to people or things.",
    "The only limit to our realization of tomorrow will be our doubts of today.",
    "Act as if what you do makes a difference. It does.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "You identify less with your thoughts when you realize you are the sky, not the clouds.",
    "The present moment is all you ever have.",
    "Gratitude turns what we have into enough.",
    "You are capable of amazing things.",
    "Let go of what was, accept what is, and have faith in what will be.",
    "Your potential is endless.",
    "Focus on the step in front of you, not the whole staircase.",
    "Life is 10% what happens to you and 90% how you react to it.",
    "The best time for new beginnings is now."
];

// Combinatorial Engine for specific inputs
// Structure: [Opener] + [Action] + [Benefit]
const TEMPLATES = {
    anxiety: {
        openers: [
            "When the world feels loud,",
            "In moments of high stress,",
            "If your heart races,",
            "When worry clouds your mind,",
            "If the future feels overwhelming,",
        ],
        actions: [
            "take a deep, grounding breath,",
            "focus on just one small thing,",
            "plant your feet firmly on the earth,",
            "observe your thoughts without judgment,",
            "remind yourself that you are safe,",
        ],
        benefits: [
            "and watch the storm settle.",
            "and find your inner stillness.",
            "and know that this moment is temporary.",
            "for you are stronger than your fear.",
            "and reclaim your peace.",
        ]
    },
    depression: {
        openers: [
            "Even on the darkest days,",
            "When hope feels distant,",
            "If the weight feels too heavy,",
            "When you feel like giving up,",
            "In the quiet of the night,",
        ],
        actions: [
            "remember that you are loved,",
            "take just one gentle step,",
            "be kind to your weary heart,",
            "look for a single spark of light,",
            "know that rest is not failure,",
        ],
        benefits: [
            "for the sun will rise again.",
            "and your strength will return.",
            "for you are worthy of healing.",
            "and tomorrow brings new grace.",
            "because your story is not over."
        ]
    }
};

export class WisdomEngine {
    static generate(topic?: string): string {
        // 70% chance of a curated classic
        if (Math.random() > 0.3 || !topic) {
            return CURATED_QUOTES[Math.floor(Math.random() * CURATED_QUOTES.length)];
        }

        // 30% chance of a dynamic construction based on topic keywords
        const normalizedInput = topic.toLowerCase();
        let category: 'anxiety' | 'depression' | null = null;

        if (normalizedInput.includes('anxi') || normalizedInput.includes('stress') || normalizedInput.includes('worry') || normalizedInput.includes('panic')) {
            category = 'anxiety';
        } else if (normalizedInput.includes('depress') || normalizedInput.includes('sad') || normalizedInput.includes('tire') || normalizedInput.includes('hopeless')) {
            category = 'depression';
        }

        if (category) {
            const t = TEMPLATES[category];
            const part1 = t.openers[Math.floor(Math.random() * t.openers.length)];
            const part2 = t.actions[Math.floor(Math.random() * t.actions.length)];
            const part3 = t.benefits[Math.floor(Math.random() * t.benefits.length)];
            return `${part1} ${part2} ${part3}`;
        }

        // Fallback to curated
        return CURATED_QUOTES[Math.floor(Math.random() * CURATED_QUOTES.length)];
    }
}
