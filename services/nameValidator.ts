
export class NameValidator {
    private static JOKE_NAMES = [
        'mickey mouse', 'donald duck', 'spongebob squarepants', 'buggs bunny',
        'darth vader', 'harry potter', 'test name', 'tester test', 'user test',
        'admin account', 'root admin', 'system user', 'first last', 'john doe', 'jane doe',
        'asdfghjkl', 'qwertyuiop', '12345678', 'password123'
    ];


    private static DISRUPTIVE_CHARACTERS = /'|;|--|\/\*|\*\/|\\"|\\u|<|>|%|\$|&|\|/i;

    static validate(firstName: string, lastName: string): { valid: boolean; error?: string } {
        const first = firstName.trim().toLowerCase();
        const last = lastName.trim().toLowerCase();

        // 1. Length Checks
        if (first.length < 2) {
            return { valid: false, error: "First name is too short (min 2 characters)." };
        }
        if (last.length < 2) {
            return { valid: false, error: "Last name is too short (min 2 characters)." };
        }
        if (first.length > 50 || last.length > 50) {
            return { valid: false, error: "Name is too long (max 50 characters)." };
        }

        // 2. Character Disruption Checks (SQLi, Scripting, etc.)
        if (this.DISRUPTIVE_CHARACTERS.test(firstName) || this.DISRUPTIVE_CHARACTERS.test(lastName)) {
            return { valid: false, error: "Name contains restricted characters for security." };
        }

        // 3. Joke Name Detection
        const fullName = `${first} ${last}`;
        if (this.JOKE_NAMES.includes(first) || this.JOKE_NAMES.includes(last) || this.JOKE_NAMES.includes(fullName)) {
            return { valid: false, error: "Please use your real name instead of a placeholder or joke name." };
        }

        // 4. Pattern Checks (Allowing letters, common accents, hyphens, and apostrophes)
        // This regex is safer than unicode property escapes which caused issues previously.
        const namePattern = /^[a-zA-Z\u00C0-\u017F\s'-]+$/;
        if (!namePattern.test(firstName) || !namePattern.test(lastName)) {
            return { valid: false, error: "Name contains invalid characters. Use letters, hyphens, or apostrophes only." };
        }

        // 5. Gibberish / Repetition Check (e.g., "aaaaaaa")
        if (/([a-z])\1{4,}/i.test(first) || /([a-z])\1{4,}/i.test(last)) {
            return { valid: false, error: "Name appears to be repetitive or gibberish." };
        }

        return { valid: true };
    }

    static validateFullName(fullName: string): { valid: boolean; error?: string } {
        const parts = (fullName || "").trim().split(/\s+/);
        if (parts.length < 2) {
            return { valid: false, error: "Please provide both a first and last name separated by a space." };
        }
        return this.validate(parts[0], parts.slice(1).join(' '));
    }

    static sanitize(name: string): string {

        if (!name) return "";
        // Trim and remove any extra internal whitespace
        let clean = name.trim().replace(/\s+/g, ' ');
        // Basic SQL escaping (though parameterized queries are used, this is for safety)
        clean = clean.replace(/[';]|--/g, "");
        return clean;
    }
}
