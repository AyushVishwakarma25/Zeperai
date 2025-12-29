import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md border border-slate-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="close" className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h1>
            <p className="text-slate-500 mb-6 text-sm">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <div className="bg-slate-100 p-3 rounded-lg text-left mb-6 overflow-hidden">
                <p className="text-xs font-mono text-slate-600 break-words line-clamp-4">
                    {this.state.error?.message}
                </p>
            </div>
            <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={() => window.location.reload()}>
                    Refresh Page
                </Button>
                <Button variant="primary" onClick={() => this.setState({ hasError: false, error: null })}>
                    Try Again
                </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}