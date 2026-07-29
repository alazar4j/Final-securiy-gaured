import { Component, type ReactNode } from 'react';

interface State { hasError: boolean; message: string; }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  declare props: { children: ReactNode };
  declare state: State;

  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(err: Error) {
    console.error('App error:', err);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-6">
          <div className="max-w-md w-full bg-white rounded-xl shadow-card p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-error-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-error-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mb-1">Something went wrong</h2>
            <p className="text-sm text-neutral-500 mb-4">{this.state.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
