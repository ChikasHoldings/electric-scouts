import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

/**
 * The last line of defence between a render error and a blank white page.
 *
 * Mounted at the root in main.jsx, OUTSIDE the router — which is deliberate,
 * because an error thrown while the router itself is rendering has to be caught
 * by something above it. That constraint shapes this file:
 *
 *   No react-router components. `<Link>` throws outside a `<Router>`, so the
 *   recovery button here would itself crash the fallback and hand the visitor
 *   the very blank page this exists to prevent. Plain anchors and a full page
 *   load instead — after an unknown error, discarding all client state is the
 *   more reliable recovery anyway.
 *
 *   No `process.env`. Vite does not define `process` in the browser, so
 *   reading `process.env.NODE_ENV` throws a ReferenceError. Reading it inside
 *   the fallback meant the fallback crashed exactly when it was needed.
 *   `import.meta.env.DEV` is the bundler-provided equivalent.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // The browser console is the only place this goes. There is no error
    // reporting service wired up, which is why the copy below does not claim
    // anyone has been told.
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    // A full reload rather than clearing the flag: the component that threw
    // would re-render into the same bad state, and the visitor would watch the
    // page break a second time.
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-2 max-w-md mx-auto">
              This page hit an unexpected error. Reloading usually fixes it.
            </p>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              If it keeps happening, email{" "}
              <a href="mailto:support@electricscouts.com" className="text-[#0A5C8C] hover:underline">
                support@electricscouts.com
              </a>{" "}
              and tell us what you were doing.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              onClick={this.handleReload}
              className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-12 font-semibold px-6"
            >
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
              Reload the page
            </Button>
            <a
              href="/"
              className="inline-flex items-center justify-center bg-[#0A5C8C] hover:bg-[#084a6f] text-white h-12 font-semibold px-6 rounded-md transition-colors"
            >
              <Home className="w-4 h-4 mr-2" aria-hidden="true" />
              Go to the homepage
            </a>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <div className="mt-8 bg-gray-100 rounded-lg p-6 text-left">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">
                Error details (development only)
              </h2>
              <pre className="text-xs text-red-600 overflow-x-auto whitespace-pre-wrap">
                {String(this.state.error)}
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
