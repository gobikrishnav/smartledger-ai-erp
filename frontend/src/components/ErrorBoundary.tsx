import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
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
        <div className="p-4 m-4 border border-gray-400 bg-gray-100 rounded text-black">
          <h1 className="font-bold text-lg mb-2">Something went wrong.</h1>
          <p className="font-mono text-sm">{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
