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
  Ticket,
  Megaphone,
  UserCircle2,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const mainNavByRole = {
  EMPLOYEE: [
    {
      to: "/dashboard",
      labelKey: "navigation.dashboard",
      icon: LayoutDashboard,
    },
    { to: "/requests", labelKey: "navigation.myRequests", icon: ClipboardList },
    {
      to: "/requests/create",
      labelKey: "navigation.newRequest",
      icon: PlusCircle,
    },
    {
      to: "/announcements",
      labelKey: "navigation.announcements",
      icon: Megaphone,
    },
  ],
  TECHNICIAN: [
    {
      to: "/dashboard",
      labelKey: "navigation.dashboard",
      icon: LayoutDashboard,
    },
    {
      to: "/assigned-requests",
      labelKey: "navigation.assignedRequests",
      icon: ListChecks,
    },
    {
      to: "/announcements",
      labelKey: "navigation.announcements",
      icon: Megaphone,
    },
  ],
  ADMIN: [
    {
      to: "/dashboard",
      labelKey: "navigation.dashboard",
      icon: LayoutDashboard,
    },
    { to: "/tickets", labelKey: "navigation.tickets", icon: Ticket },
    { to: "/users", labelKey: "navigation.users", icon: Users },
    { to: "/offices", labelKey: "navigation.offices", icon: Building2 },
    {
      to: "/announcements",
      labelKey: "navigation.announcements",
      icon: Megaphone,
    },
    { to: "/reports", labelKey: "navigation.reports", icon: BarChart3 },
  ],
};

const accountNav = [
  { to: "/profile", labelKey: "navigation.profile", icon: UserCircle2 },
  { type: "button", labelKey: "navigation.logout", icon: LogOut },
];

function Sidebar({ role, onNavigate, mobile = false }) {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const mainItems = mainNavByRole[role] ?? mainNavByRole.EMPLOYEE;

  const renderItem = ({ type, to, labelKey, icon: Icon }) => {
    if (type === "button") {
      return (
        <button
          key={labelKey}
          type="button"
          onClick={() => {
            onNavigate?.();
            logout();
          }}
          className="app-nav-link flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          <Icon size={18} />
          {t(labelKey)}
        </button>
      );
    }

    return (
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
    );
  };

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
      <nav className="flex flex-1 flex-col gap-2">
        {mainItems.map(renderItem)}
      </nav>
      <div className="mt-auto border-t border-[var(--civic-border)] pt-4">
        <nav className="flex flex-col gap-2">{accountNav.map(renderItem)}</nav>
      </div>
    </aside>
  );
}

export default Sidebar;
