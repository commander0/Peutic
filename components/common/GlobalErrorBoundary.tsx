import React, { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { AdminService } from '../../services/adminService';

interface ErrorBoundaryProps {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

export class GlobalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    public state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Critical Application Error:", error, errorInfo);
        // Log to Admin Service if possible
        try {
            AdminService.logSystemEvent('ERROR', 'Global Crash', error.message);
        } catch (e) {
            console.error("Failed to log crash to AdminService", e);
        }
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-white font-sans">
                    <div className="bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm max-w-lg w-full flex flex-col items-center shadow-2xl">
                        <div className="bg-red-500/10 p-4 rounded-full mb-6">
                            <AlertTriangle className="w-12 h-12 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2 text-zinc-100">System Malfunction</h1>
                        <p className="text-zinc-400 mb-8 leading-relaxed">
                            An unexpected error has occurred. We have logged this event and notified the engineering team.
                        </p>

                        {this.state.error && (
                            <div className="w-full bg-black/50 p-4 rounded-lg mb-6 overflow-hidden text-left">
                                <code className="text-xs text-red-400 font-mono break-all line-clamp-4">
                                    {this.state.error.toString()}
                                </code>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                this.setState({ hasError: false });
                                window.location.href = '/';
                            }}
                            className="w-full bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reboot System
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
