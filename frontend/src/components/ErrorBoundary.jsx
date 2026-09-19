import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { t } = this.props.t || {};
      return (
        <div
          className="flex min-h-screen items-center justify-center bg-[var(--civic-page)] p-4"
          role="alert"
        >
          <div className="w-full max-w-md rounded-xl border border-[var(--civic-border)] bg-white p-8 text-center shadow-[var(--civic-shadow-lg)]">
            <AlertCircle
              className="mx-auto h-14 w-14 text-[var(--civic-error)]"
              aria-hidden="true"
            />
            <h1 className="mt-4 text-2xl font-bold text-[var(--civic-blue-950)]">
              {t?.("errors.somethingWentWrong") ?? "Something went wrong"}
            </h1>
            <p className="mt-2 text-[var(--civic-muted)]">
              {t?.("errors.unexpectedError") ??
                "An unexpected error occurred. Please try again."}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => window.location.reload()}
                className="button-primary justify-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {t?.("common.reload") ?? "Reload Page"}
              </button>
              <Link to="/" className="button-secondary justify-center">
                <Home className="mr-2 h-4 w-4" />
                {t?.("common.goHome") ?? "Go Home"}
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
