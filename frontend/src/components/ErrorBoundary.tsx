import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches uncaught errors in the React tree below this boundary (render, lifecycle, constructors).
 * Async/event errors still need local try/catch; this prevents a blank screen for component failures.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const { error } = this.state;
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 py-12">
          <h1 className="text-xl font-semibold text-[#2C3E50]">Something went wrong</h1>
          <p className="max-w-md text-center text-sm text-gray-600">
            An unexpected error occurred. You can reload the page or return to the home screen.
          </p>
          {import.meta.env.DEV && (
            <pre className="max-h-40 max-w-2xl overflow-auto rounded border bg-white p-3 text-left text-xs text-red-800">
              {error.message}
            </pre>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              className="bg-[#C4A672] text-white hover:bg-[#8B7355]"
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
            <Button type="button" variant="outline" onClick={() => (window.location.href = '/')}>
              Go home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
