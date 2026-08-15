import React from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Keeps one broken page from taking down the whole site.
 *
 * The root boundary in main.jsx catches everything, which is why an error
 * anywhere no longer produces a white screen — but "everything" is the problem:
 * a single page throwing replaced the entire application, header and footer and
 * admin sidebar included, and the only way out was a full reload. From the
 * visitor's side that is indistinguishable from the app crashing.
 *
 * This boundary sits below the chrome instead. A page that throws is replaced
 * by a message inside the layout it was rendering in; every link on the page
 * still works, so the visitor can simply go somewhere else.
 *
 * It also resets itself. A class boundary holds its error state until it is
 * unmounted, so without the `key` below, one bad page would poison every route
 * visited afterwards — the boundary would keep rendering its fallback no matter
 * what was inside it. Keying on the location remounts it on each navigation.
 */
class Boundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    // No reporting service is wired up, so the console is where this goes —
    // and the copy below does not claim anyone has been told.
    console.error("Route error:", error, errorInfo);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return this.props.renderFallback(this.state.error);
  }
}

function Fallback({ error, homePath, homeLabel }) {
  return (
    <div className="flex items-center justify-center py-20 px-4">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-600" aria-hidden="true" />
        </div>
        {/* Deliberately not the root boundary's wording. These are two
            different situations — one page failed, versus the application
            failed — and describing them identically would make the difference
            invisible to whoever is reading a bug report. */}
        <h2 className="text-xl font-bold text-gray-900 mb-2">This page didn't load</h2>
        <p className="text-gray-600 mb-6">
          It hit an error while rendering. The rest of the site is working — try again,
          or head somewhere else.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-semibold rounded-md transition-colors"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Try again
          </button>
          <Link
            to={homePath}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-[#0A5C8C] hover:bg-[#084a6f] text-white font-semibold rounded-md transition-colors"
          >
            {homeLabel}
          </Link>
        </div>
        {import.meta.env.DEV && (
          <pre className="mt-6 text-left bg-gray-100 rounded-lg p-4 text-xs text-red-600 overflow-x-auto whitespace-pre-wrap">
            {String(error)}
          </pre>
        )}
      </div>
    </div>
  );
}

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.homePath]  Where the recovery link points.
 * @param {string} [props.homeLabel]
 */
export default function RouteErrorBoundary({ children, homePath = "/", homeLabel = "Go to the homepage" }) {
  const location = useLocation();
  return (
    <Boundary
      key={`${location.pathname}${location.search}`}
      renderFallback={(error) => (
        <Fallback error={error} homePath={homePath} homeLabel={homeLabel} />
      )}
    >
      {children}
    </Boundary>
  );
}
