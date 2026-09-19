import { useTranslation } from "react-i18next";
import { Home, Search, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[var(--civic-page)] p-4"
      role="main"
    >
      <div className="w-full max-w-sm rounded-xl border border-[var(--civic-border)] bg-white p-8 text-center shadow-[var(--civic-shadow-lg)]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f1f6fb]">
          <Search className="h-7 w-7 text-[var(--civic-muted)]" aria-hidden="true" />
        </div>
        <h1 className="text-[var(--civic-font-size-4xl)] font-bold text-[var(--civic-blue-950)]">
          {t("errors.notFound.title") ?? "404"}
        </h1>
        <p className="mt-2 text-[var(--civic-font-size-lg)] text-[var(--civic-muted)]">
          {t("errors.notFound.subtitle") ?? "Page not found"}
        </p>
        <p className="mt-2 text-[var(--civic-font-size-base)] text-[var(--civic-muted)]">
          {t("errors.notFound.description") ??
            "The page you're looking for doesn't exist or has been moved."}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link to="/" className="button-primary justify-center no-underline">
            <Home className="h-4 w-4" />
            {t("common.goHome") ?? "Go Home"}
          </Link>
          <Link to="/dashboard" className="button-secondary justify-center no-underline">
            <ArrowLeft className="h-4 w-4" />
            {t("navigation.dashboard") ?? "Dashboard"}
          </Link>
        </div>
      </div>
    </div>
  );
}
