import { useTranslation } from "react-i18next";
import { Home, Search, Link2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-(--civic-page) p-4"
      role="main"
    >
      <div className="w-full max-w-md text-center p-8 rounded-xl border border-(--civic-border) bg-white shadow-lg">
        <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
          <Search className="h-8 w-8 text-slate-400" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-3xl font-bold text-(--civic-text)">
          {t("errors.notFound.title") ?? "404"}
        </h1>
        <p className="mt-2 text-lg text-(--civic-muted)">
          {t("errors.notFound.subtitle") ?? "Page not found"}
        </p>
        <p className="mt-4 text-(--civic-muted)">
          {t("errors.notFound.description") ??
            "The page you're looking for doesn't exist or has been moved."}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link to="/" className="button-primary">
            <Home className="h-4 w-4 mr-2" />
            {t("common.goHome") ?? "Go Home"}
          </Link>
          <Link to="/dashboard" className="button-secondary">
            <Link2 className="h-4 w-4 mr-2" />
            {t("navigation.dashboard") ?? "Dashboard"}
          </Link>
        </div>
      </div>
    </div>
  );
}
