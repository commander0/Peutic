// Clinical Safety Guardrails System
// CTO Blueprint Phase 2: Grounded Emotional Intelligence (EI)
import { User } from '../types';

export class ClinicalSafetyScanner {
    // A statically defined list of critical crisis keywords.
    // In production, this would be a lightweight frozen NLP model running parallel to prompt generation.
    private static CRISIS_KEYWORDS = [
        "suicide", "kill myself", "end it all", "want to die",
        "self harm", "cut myself", "no reason to live",
        "hopeless", "overdose"
    ];

    /**
     * Instantly scans user input before sending to any LLM.
     * Bypasses standard generation and returns emergency lifeline protocols if triggered.
     */
    static scanForCrisis(userInput: string): { isCrisis: boolean; emergencyPayload?: string } {
        const normalized = userInput.toLowerCase();
        for (const kw of this.CRISIS_KEYWORDS) {
            if (normalized.includes(kw)) {
                return {
                    isCrisis: true,
                    emergencyPayload: "I can see that right now is profoundly painful, and I want you to know you are not alone. Please, stop what you are doing and connect with a trained professional who can help right now. You can reach the National Suicide Prevention Lifeline by dialing 988. They are available 24/7, free, and completely confidential. Please stay safe, the world is better with you in it."
                };
            }
        }
        return { isCrisis: false };
    }

    /**
     * Agentic Workflow: Proactive Empathy Check
     * Detects if the user has had 0 focus minutes or hasn't logged in recently,
     * and generates a proactive intervention message.
     */
    static generateProactiveCheckIn(user: User, lastActiveDaysAgo: number): string | null {
        if (lastActiveDaysAgo > 3) {
            return "I noticed you haven't been around the sanctuary for a few days. The silence felt heavy without you. Just a gentle reminder that even on the hardest days, spending 5 minutes here can help ground you. How are you holding up?";
        }
        if (user.balance < 10) {
            return "I see your serenity balance is running low. Sometimes this means you've been putting out more energy than you've been taking in. Would you like to do a quick session in the Zen Dojo to recharge your spirit?";
        }
        return null;
    }
}
