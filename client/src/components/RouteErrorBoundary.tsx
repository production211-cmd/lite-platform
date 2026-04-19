/**
 * RouteErrorBoundary — Per-Route Error Isolation
 * ================================================
 * Wraps individual page routes so a crash in one page
 * doesn't take down the entire application. Shows a
 * friendly error message with retry/home options.
 */
import React from "react";
import { Link } from "wouter";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: React.ReactNode;
  pageName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[RouteErrorBoundary${this.props.pageName ? ` — ${this.props.pageName}` : ""}]`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[50vh] p-8">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold font-heading text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-500 font-body mb-1">
              {this.props.pageName
                ? `An error occurred while loading the ${this.props.pageName} page.`
                : "An unexpected error occurred on this page."}
            </p>
            <p className="text-xs text-gray-400 font-mono mb-6 max-h-20 overflow-auto px-4">
              {this.state.error?.message}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold font-body hover:bg-gray-800 transition-colors"
              >
                <RefreshCw size={14} />
                Try Again
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium font-body text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Home size={14} />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap a page component with RouteErrorBoundary.
 * Usage: const SafeDashboard = withErrorBoundary(Dashboard, "Dashboard");
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  pageName: string
): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => (
    <RouteErrorBoundary pageName={pageName}>
      <Component {...props} />
    </RouteErrorBoundary>
  );
  Wrapped.displayName = `withErrorBoundary(${pageName})`;
  return Wrapped;
}
