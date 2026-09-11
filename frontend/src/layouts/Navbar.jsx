import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import LanguageToggle from "../components/LanguageToggle";

function Navbar({ role, onMenuToggle }) {
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed left-72 right-0 top-0 z-30 border-b border-[var(--civic-border)] bg-white px-4 py-3 shadow-[0_2px_10px_rgb(11_47_107_/_4%)] max-[1023px]:left-0 lg:px-6">
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            className="app-menu-button rounded-lg p-2 hover:bg-slate-100 lg:hidden"
            onClick={() => {
              setMobileOpen((value) => !value);
              onMenuToggle?.();
            }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="min-w-0">
            <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-semibold text-[var(--civic-blue-950)]">
              {t("layout.welcome")}, {currentUser?.fullName ?? "User"}
            </p>
            <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold tracking-[0.04em] text-[var(--civic-muted)]">
              {role}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 max-[640px]:gap-1.5">
          <LanguageToggle variant="navbar" />
          <button
            onClick={logout}
            className="rounded-lg bg-[var(--civic-blue-800)] px-3 py-2 text-sm font-medium text-white transition hover:bg-[var(--civic-blue-950)] hover:shadow-[0_4px_10px_rgb(11_47_107_/_16%)] max-[640px]:px-2.5 max-[640px]:py-[7px]"
          >
            {t("auth.logout")}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
