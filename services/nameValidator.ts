
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

        // 2. Character Set Check
        // Try Modern Unicode first, fallback to Basic Latin/Accents if environment forbids \p{L}
        try {
            // \p{L} matches any Unicode letter. /u flag is required.
            const modernRegex = new RegExp("^[\\p{L}\\s\\-.']+$", "u");
            if (!modernRegex.test(trimmed)) {
                return { valid: false, error: "Name contains invalid characters (numbers or symbols not allowed)." };
            }
            
            // Structural: Must start with a letter
            const startRegex = new RegExp("^[\\p{L}]", "u");
            if (!startRegex.test(trimmed)) {
                return { valid: false, error: "Name must start with a letter." };
            }

            // Letter Count: Must have at least 2 letters (prevents ".-")
            const letterMatch = trimmed.match(new RegExp("[\\p{L}]", "gu"));
            if (!letterMatch || letterMatch.length < 2) {
                 return { valid: false, error: "Name must contain at least 2 letters." };
            }

        } catch (e) {
            // Fallback for environments that don't support Unicode Property Escapes
            // Allows: a-z, A-Z, Latin-1 Supplement (Accents), spaces, dots, hyphens, apostrophes
            const fallbackRegex = /^[a-zA-Z\u00C0-\u00FF\s\-.']+$/;
            if (!fallbackRegex.test(trimmed)) {
                return { valid: false, error: "Name contains invalid characters." };
            }
            if (!/^[a-zA-Z\u00C0-\u00FF]/.test(trimmed)) {
                 return { valid: false, error: "Name must start with a letter." };
            }
        }

        // 3. Anti-Gibberish Heuristics (Universal)
        // Prevent repeating characters (e.g. "Jaaaaames") - Limit 3 repeats
        if (/(.)\1\1\1/.test(trimmed)) {
            return { valid: false, error: "Name looks invalid (too many repeating characters)." };
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
