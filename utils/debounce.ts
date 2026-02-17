export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout | null = null;

    return function (this: any, ...args: Parameters<T>) {
        const context = this;
        if (timeout) clearTimeout(timeout);

        timeout = setTimeout(() => {
            timeout = null;
            func.apply(context, args);
        }, wait);
    } as T;
}
