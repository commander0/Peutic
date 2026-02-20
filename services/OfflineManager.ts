
// Removed uuid dependency to avoid install issues
export interface OfflineRequest {
    id: string;
    type: 'JOURNAL' | 'MOOD' | 'VOICE';
    payload: any;
    timestamp: number;
    retryCount: number;
}

export class OfflineManager {
    private static STORAGE_KEY = 'peutic_offline_queue';
    private static queue: OfflineRequest[] = [];

    static init() {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.queue = JSON.parse(stored);
            }
            window.addEventListener('online', () => this.processQueue());
        }
    }

    static queueRequest(type: 'JOURNAL' | 'MOOD' | 'VOICE', payload: any) {
        const request: OfflineRequest = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
            type,
            payload,
            timestamp: Date.now(),
            retryCount: 0
        };
        this.queue.push(request);
        this.persist();
        console.log(`[OfflineManager] Queued ${type} request`, request.id);
    }

    static async processQueue() {
        if (this.queue.length === 0) return;
        if (!navigator.onLine) return;

        console.log(`[OfflineManager] Processing ${this.queue.length} offline requests...`);
        const currentQueue = [...this.queue];
        this.queue = []; // Clear temporarily, re-add failures
        this.persist();

        // Dynamic import to avoid circular dependency if possible, or pass handler
        // For simplicity, we'll dispatch a custom event or allow UserService to poll this.
        // ACTUALLY: Better to let UserService call this, or expose a handler registry.

        // Simple Event Dispatch Pattern
        const event = new CustomEvent('peutic-sync-offline', { detail: { requests: currentQueue } });
        window.dispatchEvent(event);
    }

    private static persist() {
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
        }
    }

    static getQueueLength(): number {
        return this.queue.length;
    }
}

OfflineManager.init();
