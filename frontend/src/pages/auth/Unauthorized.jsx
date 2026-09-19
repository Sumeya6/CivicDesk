import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Unauthorized() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--civic-page)] p-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--civic-border)] bg-white p-8 text-center shadow-[var(--civic-shadow-lg)]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--civic-error-bg)]">
          <ShieldAlert className="h-7 w-7 text-[var(--civic-error)]" aria-hidden="true" />
        </div>
        <h1 className="text-[var(--civic-font-size-4xl)] font-bold text-[var(--civic-blue-950)]">
          403
        </h1>
        <p className="mt-2 text-[var(--civic-font-size-lg)] text-[var(--civic-muted)]">
          {t("auth.unauthorized") ?? "Unauthorized"}
        </p>
        <p className="mt-2 text-[var(--civic-font-size-base)] text-[var(--civic-muted)]">
          You do not have permission to view this page.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg border-0 bg-[var(--civic-blue-800)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--civic-blue-950)] hover:shadow-[var(--civic-shadow-md)] no-underline"
        >
          <ArrowLeft size={16} />
          {t("auth.signIn")}
        </Link>
      </div>
    </div>
  );
}

export default Unauthorized;
