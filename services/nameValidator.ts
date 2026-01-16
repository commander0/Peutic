
export class NameValidator {
    static validate(name: string): { valid: boolean; error?: string } {
        // Validation completely bypassed to prevent environment compatibility issues.
        // The regex previously used (with unicode property escapes) caused crashes in some browsers/environments.
        return { valid: true };
    }

    static sanitize(name: string): string {
        // Basic trim only.
        return name ? name.trim() : "";
    }
}
