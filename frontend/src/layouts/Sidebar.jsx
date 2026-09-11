import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Building2,
  BarChart3,
  PlusCircle,
  ListChecks,
} from "lucide-react";

const navigationByRole = {
  EMPLOYEE: [
    {
      to: "/dashboard",
      labelKey: "navigation.dashboard",
      icon: LayoutDashboard,
    },
    {
      to: "/requests/create",
      labelKey: "navigation.requests",
      icon: PlusCircle,
    },
    { to: "/requests", labelKey: "navigation.requests", icon: ClipboardList },
  ],
  TECHNICIAN: [
    {
      to: "/dashboard",
      labelKey: "navigation.dashboard",
      icon: LayoutDashboard,
    },
    {
      to: "/assigned-requests",
      labelKey: "navigation.requests",
      icon: ListChecks,
    },
  ],
  ADMIN: [
    {
      to: "/dashboard",
      labelKey: "navigation.dashboard",
      icon: LayoutDashboard,
    },
    { to: "/users", labelKey: "navigation.users", icon: Users },
    { to: "/offices", labelKey: "navigation.offices", icon: Building2 },
    { to: "/reports", labelKey: "navigation.reports", icon: BarChart3 },
  ],
};

function Sidebar({ role, onNavigate, mobile = false }) {
  const { t } = useTranslation();
  const items = navigationByRole[role] ?? navigationByRole.EMPLOYEE;

  return (
    <aside
      className={`${mobile ? "flex w-full" : "fixed inset-y-0 left-0 z-40 hidden h-screen w-72 overflow-y-auto lg:flex"} flex-col border-r border-[var(--civic-border)] bg-white p-6 shadow-[2px_0_12px_rgb(11_47_107_/_4%)]`}
    >
      <div className="mb-8 border-b border-[var(--civic-border)] pb-5">
        <h2 className="text-lg font-semibold tracking-[-0.01em] text-[var(--civic-blue-950)] before:mr-[9px] before:inline-block before:h-2 before:w-2 before:rounded-full before:bg-[var(--civic-cyan-500)] before:content-['']">
          CivicDesk
        </h2>
        <p className="text-sm text-slate-500">{t("layout.welcome")}</p>
      </div>
      <nav className="space-y-2">
        {items.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `app-nav-link flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`
            }
          >
            <Icon size={18} />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
