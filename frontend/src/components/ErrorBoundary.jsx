import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
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
          className="min-h-screen flex items-center justify-center bg-(--civic-page) p-4"
          role="alert"
        >
          <div className="w-full max-w-md text-center p-8 rounded-xl border border-(--civic-border) bg-white shadow-lg">
            <AlertCircle
              className="mx-auto h-14 w-14 text-red-500"
              aria-hidden="true"
            />
            <h1 className="mt-4 text-2xl font-bold text-(--civic-text)">
              {t?.("errors.somethingWentWrong") ?? "Something went wrong"}
            </h1>
            <p className="mt-2 text-(--civic-muted)">
              {t?.("errors.unexpectedError") ??
                "An unexpected error occurred. Please try again."}
            </p>
            {process.env.NODE_ENV !== "production" && this.state.error && (
              <details className="mt-4 text-left p-4 rounded bg-red-50 border border-red-200">
                <summary className="cursor-pointer font-medium text-red-700">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs overflow-auto text-red-900">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => window.location.reload()}
                className="button-primary"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t?.("common.reload") ?? "Reload Page"}
              </button>
              <Link to="/" className="button-secondary">
                <Home className="h-4 w-4 mr-2" />
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
