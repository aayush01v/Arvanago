import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);

        // Check for chunk load error (common after deployments)
        if (error.message.includes('Failed to fetch dynamically imported module') ||
            error.message.includes('Importing a module script failed')) {
            // Force reload to get fresh chunks
            window.location.reload();
        }
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // If it's a chunk error, we might have already reloaded in componentDidCatch
            // But if we're still here, show UI
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4 text-center">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100 dark:border-slate-700">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h2>
                        <p className="text-slate-600 dark:text-slate-300 mb-6">
                            A new version of the app might be available. Please try refreshing.
                        </p>

                        <button
                            onClick={this.handleReload}
                            className="w-full py-3 px-4 bg-brand-primary text-white rounded-xl font-semibold hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
