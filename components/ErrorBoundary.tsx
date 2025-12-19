import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);

        // Auto-reload on chunk errors (once) to fix deployment cache issues
        if (error.message?.includes('Loading chunk') || error.message?.includes('Importing a module script failed')) {
            // We could store a flag in sessionStorage to prevent infinite reload loops
            const isReloading = sessionStorage.getItem('is_reloading_chunk');
            if (!isReloading) {
                sessionStorage.setItem('is_reloading_chunk', 'true');
                window.location.reload();
            } else {
                sessionStorage.removeItem('is_reloading_chunk');
            }
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4 text-center">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-700">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h1>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            We encountered an unexpected error. This might be due to a new update.
                        </p>
                        <button
                            onClick={() => {
                                sessionStorage.removeItem('is_reloading_chunk');
                                window.location.reload();
                            }}
                            className="w-full py-3 px-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-xl transition-colors shadow-lg shadow-brand-primary/20"
                        >
                            Reload Page
                        </button>
                        {this.state.error && (
                            <details className="mt-4 text-xs text-left text-slate-400 dark:text-slate-500 overflow-auto max-h-32 bg-slate-100 dark:bg-slate-900/50 p-2 rounded">
                                <summary className="cursor-pointer mb-1 hover:text-slate-600">Error Details</summary>
                                {this.state.error.toString()}
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
