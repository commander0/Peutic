import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { AdminService } from '../../services/adminService';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught runtime error intercepted:", error, errorInfo);

        // Push the error to the Admin Service for central monitoring
        AdminService.logSystemEvent(
            'CRITICAL_ERROR',
            'Global Boundary Intercept',
            `${error.message}\nStack: ${errorInfo.componentStack}`
        );
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            // Render specific fallback if provided by the component instantiator
            if (this.props.fallback) {
                return <>{this.props.fallback}</>;
            }

            return (
                <div className="min-h-[100dvh] w-full bg-[#050505] text-stone-300 flex flex-col items-center justify-center p-8 font-sans animate-in fade-in duration-500">
                    <div className="max-w-md w-full text-center space-y-6 bg-stone-900/50 p-8 rounded-3xl border border-red-900/30 shadow-[0_0_50px_rgba(220,38,38,0.05)]">
                        <div className="w-20 h-20 bg-red-950/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-900/50">
                            <AlertOctagon className="w-10 h-10 text-red-500 animate-pulse" />
                        </div>

                        <h1 className="text-3xl font-black text-white tracking-tight">System Fault</h1>

                        <p className="text-stone-400 text-sm leading-relaxed">
                            A critical anomaly occurred within the application interface.
                            The incident has been securely logged to Mission Control.
                        </p>

                        <div className="bg-black/50 p-4 rounded-xl border border-stone-800 text-left overflow-hidden">
                            <p className="font-mono text-[10px] text-red-400/80 truncate">
                                {this.state.error?.message || "Unknown Runtime Exception"}
                            </p>
                        </div>

                        <button
                            onClick={this.handleReset}
                            className="mt-8 px-8 py-4 bg-stone-100 text-stone-900 font-bold rounded-xl w-full flex items-center justify-center gap-3 hover:bg-white hover:scale-[1.02] transition-all shadow-xl"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Reinitialize Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
