import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleClearCache = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-4 font-sans">
                    <div className="max-w-md w-full bg-neutral-800 rounded-2xl p-8 shadow-2xl border border-neutral-700 text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>

                        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                        <p className="text-neutral-400 mb-6 text-sm">
                            The application encountered an unexpected error.
                        </p>

                        <div className="bg-neutral-950 rounded-lg p-4 mb-6 text-left overflow-auto max-h-48 border border-neutral-800">
                            <p className="text-red-400 font-mono text-xs mb-2 break-words">
                                {this.state.error?.toString()}
                            </p>
                            {this.state.errorInfo && (
                                <pre className="text-neutral-500 font-mono text-[10px] whitespace-pre-wrap">
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            )}
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={this.handleReload}
                                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCcw className="w-4 h-4" /> Try Again
                            </button>

                            <button
                                onClick={this.handleClearCache}
                                className="w-full py-3 bg-transparent text-neutral-400 font-medium text-xs hover:text-white transition-colors"
                            >
                                Clear Cache & Restart (Emergency)
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
