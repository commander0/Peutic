
export enum LogLevel {
    INFO = 'INFO',
    WARN = 'WARNING',
    ERROR = 'ERROR',
    SECURITY = 'SECURITY',
    SUCCESS = 'SUCCESS'
}

class Logger {
    private static instance: Logger;

    private constructor() { }

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    info(event: string, details: string = '') {
        this.log(LogLevel.INFO, event, details);
    }

    warn(event: string, details: string = '') {
        this.log(LogLevel.WARN, event, details);
    }

    error(event: string, details: string = '', error?: any) {
        const errorDetails = error ? `${details} | Error: ${error.message || error}` : details;
        this.log(LogLevel.ERROR, event, errorDetails);
        console.error(`[ERROR] ${event}:`, error || details);
    }

    security(event: string, details: string = '') {
        this.log(LogLevel.SECURITY, event, details);
        console.warn(`[SECURITY] ${event}: ${details}`);
    }

    success(event: string, details: string = '') {
        this.log(LogLevel.SUCCESS, event, details);
    }

    private log(type: LogLevel, event: string, details: string) {
        // Local console log for development
        if (process.env.NODE_ENV === 'development') {
            const color = type === LogLevel.ERROR ? 'red' : type === LogLevel.WARN ? 'yellow' : type === LogLevel.SECURITY ? 'orange' : 'green';
            console.log(`%c[${type}] ${new Date().toLocaleTimeString()} - ${event}`, `color: ${color}; font-weight: bold;`, details);
        }

        // Circular dependency check: We can't import Database here yet if Database imports Logger
        // But we want to persist logs. We'll use a dynamic import or a callback.
        // For now, let's assume we'll hook this up to the Database service later.
        if ((window as any).PersistLog) {
            (window as any).PersistLog(type, event, details);
        }
    }
}

export const logger = Logger.getInstance();
