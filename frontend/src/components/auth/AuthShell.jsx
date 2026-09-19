import { Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageToggle from "../LanguageToggle";

function AuthShell({ children }) {
  const { t } = useTranslation();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <main className="min-h-screen bg-[var(--civic-page)]">
      <header className="flex h-14 items-center justify-between gap-2.5 border-b border-[var(--civic-border)] border-t-2 border-t-[var(--civic-blue-950)] bg-white px-5 max-[480px]:px-3.5">
        <Link
          className="inline-flex min-w-0 items-center gap-[7px] text-[17px] font-bold tracking-[-0.01em] text-[var(--civic-blue-800)] no-underline"
          to="/login"
          aria-label="CivicDesk"
        >
          <Settings size={17} strokeWidth={2.8} />
          <span>CivicDesk</span>
        </Link>
        <LanguageToggle variant="auth" />
      </header>
      <section
        className="mx-auto my-10 w-[min(480px,calc(100%-32px))] max-[480px]:my-0 max-[480px]:min-h-[calc(100vh-56px)] max-[480px]:w-full rounded-xl border border-[var(--civic-border)] bg-white shadow-[var(--civic-shadow-lg)] max-[480px]:rounded-none max-[480px]:border-x-0"
        aria-label="Authentication"
      >
        <nav
          className="grid h-[50px] grid-cols-2 border-b border-[var(--civic-border)]"
          aria-label="Authentication pages"
        >
          <Link
            className={`flex items-center justify-center border-b-2 border-transparent text-[13.5px] font-medium text-[var(--civic-muted)] no-underline transition hover:text-[var(--civic-text)] ${isActive("/login") ? "border-b-[var(--civic-blue-800)] font-semibold text-[var(--civic-blue-800)]" : ""}`}
            to="/login"
          >
            {t("auth.signIn")}
          </Link>
          <Link
            className={`flex items-center justify-center border-b-2 border-transparent text-[13.5px] font-medium text-[var(--civic-muted)] no-underline transition hover:text-[var(--civic-text)] ${isActive("/register") ? "border-b-[var(--civic-blue-800)] font-semibold text-[var(--civic-blue-800)]" : ""}`}
            to="/register"
          >
            {t("auth.register")}
          </Link>
        </nav>
        <div className="px-7 pb-7 pt-8 max-[480px]:px-4 max-[480px]:pb-7 max-[480px]:pt-6">
          {children}
        </div>
      </section>
    </main>
  );
}

export default AuthShell;
