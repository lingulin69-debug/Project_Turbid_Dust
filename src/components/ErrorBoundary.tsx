import React, { Component, ErrorInfo, ReactNode } from 'react';

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
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-950 text-white min-h-screen font-mono">
          <h1 className="text-3xl font-bold mb-4 text-red-400">系統發生錯誤 (System Error)</h1>
          <div className="bg-black/50 p-6 rounded-lg border border-red-800 backdrop-blur-sm">
            <h2 className="text-xl text-red-300 mb-2">Error Message:</h2>
            <pre className="whitespace-pre-wrap text-sm text-gray-300 mb-6">
              {this.state.error?.toString()}
            </pre>
            
            <h2 className="text-xl text-red-300 mb-2">Component Stack:</h2>
            <pre className="whitespace-pre-wrap text-xs text-gray-400 overflow-auto max-h-[500px]">
              {this.state.errorInfo?.componentStack}
            </pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-red-800 hover:bg-red-700 rounded text-white transition-colors"
          >
            重新載入 (Reload)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}