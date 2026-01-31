import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { AdminService } from '../services/adminService';
import { logger } from '../services/logger';

interface ErrorBoundaryProps {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    public state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error("Critical Application Error", "ErrorBoundary Caught Exception", { error, info: errorInfo });
        // Attempt to log to backend if possible
        AdminService.logSystemEvent('ERROR', 'App Crash', error.message).catch(() => { });
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-white font-sans">
                    <div className="p-6 rounded-full bg-yellow-900/20 mb-6">
                        <AlertTriangle className="w-16 h-16 text-yellow-500" />
                    </div>
                    <h1 className="text-3xl font-black mb-4 tracking-tight">Something went wrong.</h1>
                    <p className="text-gray-400 mb-8 max-w-md">
                        Our systems detected an unexpected issue. We have automatically logged this report.
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
                            className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" /> Reload Application
                        </button>
                        <button
                            onClick={() => { localStorage.clear(); window.location.reload(); }}
                            className="bg-gray-800 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors text-sm"
                        >
                            Clear Cache & Reset
                        </button>
                    </div>

                    {this.state.error && (
                        <div className="mt-12 p-4 bg-gray-900/50 rounded-lg max-w-lg w-full text-left overflow-hidden">
                            <p className="text-xs text-gray-500 font-mono mb-2 uppercase tracking-wider">Error Details (Developer Mode)</p>
                            <code className="text-xs text-red-400 font-mono break-words block">
                                {this.state.error.toString()}
                            </code>
                        </div>
                    )}
                </div>
            );
        }
        return this.props.children;
    }
}
