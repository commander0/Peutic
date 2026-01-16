
export class NameValidator {
    static validate(name: string): { valid: boolean; error?: string } {
        if (!name || typeof name !== 'string') {
            return { valid: false, error: "Name is required." };
        }
        
        const trimmed = name.trim();

        // 1. Length Checks
        if (trimmed.length < 2) {
            return { valid: false, error: "Name must be at least 2 characters." };
        }
        if (trimmed.length > 50) {
            return { valid: false, error: "Name cannot exceed 50 characters." };
        }

        // 2. Character Set Check (Modern SaaS Standard)
        // \p{L} matches any Unicode letter (English + Accents + Asian scripts etc)
        // Allowed extras: spaces, hyphens, apostrophes, dots.
        // The /u flag enables Unicode support.
        const validCharsRegex = /^[\p{L}\s\-.']+$/u;
        if (!validCharsRegex.test(trimmed)) {
            return { valid: false, error: "Name contains invalid characters (no numbers or symbols)." };
        }

        // 3. Structural Integrity
        // Must start with a letter (e.g., "-John" is invalid)
        if (!/^[\p{L}]/u.test(trimmed)) {
             return { valid: false, error: "Name must start with a letter." };
        }

        // 4. Anti-Gibberish Heuristics
        // Prevent repeating characters (e.g. "Jaaaaames") - Limit 3 repeats
        if (/(.)\1\1\1/.test(trimmed)) {
            return { valid: false, error: "Name looks invalid (too many repeating characters)." };
        }
        
        // Prevent names that are purely punctuation despite regex allowing them (e.g., ".-.'")
        // We enforce at least 2 actual letters
        const letterCount = (trimmed.match(/[\p{L}]/gu) || []).length;
        if (letterCount < 2) {
             return { valid: false, error: "Name must contain at least 2 letters." };
        }

        return { valid: true };
    }

    static sanitize(name: string): string {
        if (!name) return "";
        
        let clean = name.trim();
        
        // 1. Collapse multiple spaces
        clean = clean.replace(/\s+/g, ' ');

        // 2. Convert to Title Case (e.g. "JOHN DOE" -> "John Doe")
        // This gives the app a cleaner look
        clean = clean.split(' ').map(word => {
            if (word.length === 0) return "";
            // Handle names like O'Connor or Jean-Luc specially if needed, 
            // but simple capitalization is usually safe for general display
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');

        return clean;
    }
}
