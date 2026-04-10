import React, { Component, ErrorInfo, ReactNode } from 'react';

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

  public handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error instanceof Error 
        ? this.state.error.message 
        : String(this.state.error || 'Unknown error occurred');

      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f8fafc', padding: '1rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', maxWidth: '28rem', border: '1px solid #e2e8f0' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>Something went wrong</h1>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <div style={{ backgroundColor: '#f1f5f9', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'left', marginBottom: '1.5rem', overflow: 'hidden' }}>
                <p style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#475569', wordBreak: 'break-word' }}>
                    {errorMessage}
                </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button style={{ padding: '0.5rem 1rem', backgroundColor: '#e2e8f0', color: '#1e293b', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }} onClick={() => window.location.reload()}>
                    Refresh Page
                </button>
                <button style={{ padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }} onClick={this.handleRetry}>
                    Try Again
                </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}