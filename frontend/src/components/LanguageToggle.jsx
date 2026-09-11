import { Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

function LanguageToggle({ variant = "auth" }) {
  const { i18n } = useTranslation();
  const { changeLanguage, preferredLanguage } = useAuth();

  const handleToggle = () => {
    const next = preferredLanguage === "EN" ? "AM" : "EN";
    i18n.changeLanguage(next.toLowerCase());
    changeLanguage(next);
  };

  if (variant === "navbar") {
    return (
      <div className="flex h-8 items-center gap-1.5 rounded-[7px] border border-[var(--civic-border)] bg-[var(--civic-cyan-50)] px-[11px] text-[12.5px] font-medium text-[var(--civic-muted)] max-[640px]:h-[30px] max-[640px]:px-[9px]">
        <Globe2 size={15} />
        <button
          type="button"
          className="border-0 bg-transparent p-0 text-[12.5px] font-medium text-[var(--civic-blue-800)] transition hover:text-[var(--civic-blue-950)] max-[640px]:text-xs"
          aria-label="Change language"
          onClick={handleToggle}
        >
          {preferredLanguage === "EN" ? "English" : "አማርኛ"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[30px] items-center gap-1.5 shrink-0 rounded-[7px] border border-[#d1d9e6] bg-[#f8fafc] px-[11px] text-[12.5px] font-medium text-[#475569]">
      <Globe2 size={15} />
      <button
        type="button"
        className="border-0 bg-transparent p-0 text-[12.5px] font-medium text-[#0757c9] transition hover:text-[#0546b0]"
        aria-label="Change language"
        onClick={handleToggle}
      >
        English / አማርኛ
      </button>
    </div>
  );
}

export default LanguageToggle;
