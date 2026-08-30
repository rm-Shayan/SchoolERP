'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Generic error boundary — wraps children and catches any render error.
 * Use this or the pre-styled `PortalErrorBoundary` wrapper.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-gray-900">Something went wrong</h3>
          <p className="mt-1 max-w-sm text-xs text-gray-500">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.reset}
            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
