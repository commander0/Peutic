
// A list of reserved system names, offensive terms, or common joke names
const BLOCKLIST = [
    "admin", "administrator", "root", "system", "sysadmin", "support", "help", "staff", "moderator",
    "null", "undefined", "none", "void", "test", "tester", "sample", "demo",
    "hitler", "nazi", "kkk", "isis", "terrorist",
    "ben dover", "mike hunt", "hugh jass", "dixon cider", "seymour butts", // Common pranks
    "anon", "anonymous", "noone", "nobody"
];

// Regex for valid names:
// \p{L} matches any Unicode letter (supports accents, foreign languages)
// \s matches whitespace
// \-' matches hyphens and apostrophes
const SAFE_NAME_REGEX = /^[\p{L}\s\-']+$/u;

export const NameValidator = {
    validate(firstName: string, lastName?: string): { valid: boolean; error?: string } {
        const first = firstName?.trim() || "";
        const last = lastName?.trim() || "";
        const fullName = last ? `${first} ${last}` : first;
        const lowerName = fullName.toLowerCase();

        // 1. Length Checks
        if (first.length < 2) return { valid: false, error: "First name is too short (min 2 chars)." };
        if (first.length > 30) return { valid: false, error: "First name is too long (max 30 chars)." };
        if (last && last.length > 30) return { valid: false, error: "Last name is too long (max 30 chars)." };

        // 2. Character Safety Check (Prevents XSS, SQLi chars, and numbers)
        if (!SAFE_NAME_REGEX.test(first)) {
            return { valid: false, error: "First name contains invalid characters (letters only)." };
        }
        if (last && !SAFE_NAME_REGEX.test(last)) {
            return { valid: false, error: "Last name contains invalid characters (letters only)." };
        }

        // 3. Blocklist Check (Exact Match or Includes for system terms)
        if (BLOCKLIST.includes(lowerName) || BLOCKLIST.includes(first.toLowerCase())) {
            return { valid: false, error: "This name is not allowed." };
        }

        // 4. Specific System Keyword Check (Contains)
        // Prevents "AdminHelper" or "SystemUser"
        const systemTerms = ["admin", "root", "system", "support", "peutic"];
        if (systemTerms.some(term => lowerName.includes(term))) {
            return { valid: false, error: "Name cannot contain reserved system keywords." };
        }

        return { valid: true };
    },

    // Sanitize for display just in case
    sanitize(name: string): string {
        return name.replace(/[<>]/g, '').trim();
    }
};
