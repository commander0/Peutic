import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    retryCount: number;
}

export class ZenErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        retryCount: 0
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, retryCount: 0 };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ZenErrorBoundary caught an error:', error, errorInfo);
    }

    private handleRetry = () => {
        this.setState(prevState => ({
            hasError: false,
            error: null,
            retryCount: prevState.retryCount + 1
        }));
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center text-white font-sans">
                    <div className="max-w-md w-full backdrop-blur-3xl bg-white/5 rounded-3xl p-8 border border-white/10 shadow-2xl animate-fade-in-up">
                        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-red-500/10 text-red-400">
                            <RefreshCw className="w-8 h-8 opacity-80" />
                        </div>
                        <h2 className="text-2xl font-black mb-3 text-white tracking-tight">The flow was interrupted</h2>
                        <p className="text-gray-400 mb-8 leading-relaxed font-medium">A momentary dissonance occurred in the system. Take a deep breath, and let's try reconnecting your session.</p>

                        <button
                            onClick={this.handleRetry}
                            className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 transition-all font-bold text-white uppercase tracking-widest text-sm"
                        >
                            Breathe & Retry
                        </button>

                        {this.state.retryCount > 0 && (
                            <p className="mt-4 text-xs text-gray-500 font-medium">Retry attempt: {this.state.retryCount}</p>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
