import { Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import i18n from "../i18n";

function LanguageToggle({ variant = "auth" }) {
  const { t } = useTranslation();
  const { changeLanguage, preferredLanguage } = useAuth();

  const handleToggle = () => {
    const next = preferredLanguage === "EN" ? "AM" : "EN";
    changeLanguage(next);
    i18n.changeLanguage(next.toLowerCase());
    document.documentElement.lang = next.toLowerCase() === "en" ? "en" : "am";
    localStorage.setItem("civicdesk_language", next);
  };

  if (variant === "navbar") {
    return (
      <div className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--civic-border)] bg-[var(--civic-cyan-50)] px-3 text-[12.5px] font-medium text-[var(--civic-muted)] max-[640px]:h-7 max-[640px]:px-2">
        <Globe2 size={15} />
        <button
          type="button"
          className="border-0 bg-transparent p-0 text-[12.5px] font-medium text-[var(--civic-blue-800)] transition hover:text-[var(--civic-blue-950)] max-[640px]:text-xs"
          aria-label={t("layout.changeLanguage")}
          onClick={handleToggle}
        >
          {preferredLanguage === "EN" ? "English" : "አማርኛ"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-7 items-center gap-1.5 shrink-0 rounded-lg border border-[var(--civic-border)] bg-[var(--civic-cyan-50)] px-3 text-[12.5px] font-medium text-[var(--civic-muted)]">
      <Globe2 size={15} />
      <button
        type="button"
        className="border-0 bg-transparent p-0 text-[12.5px] font-medium text-[var(--civic-blue-800)] transition hover:text-[var(--civic-blue-950)]"
        aria-label={t("layout.changeLanguage")}
        onClick={handleToggle}
      >
        English / አማርኛ
      </button>
    </div>
  );
}

export default LanguageToggle;
