import { Link, NavLink } from "react-router-dom";
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
  Package,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const mainNavByRole = {
  EMPLOYEE: [
    {
      to: "/dashboard",
      labelKey: "navigation.dashboard",
      icon: LayoutDashboard,
    },
    { to: "/requests", labelKey: "navigation.myRequests", icon: ClipboardList, end: true },
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
    { to: "/assets", labelKey: "navigation.assets", icon: Package },
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

  const renderItem = ({ type, to, labelKey, icon: Icon, end }) => {
    if (type === "button") {
      return (
        <button
          key={labelKey}
          type="button"
          onClick={() => {
            onNavigate?.();
            logout();
          }}
          className="app-nav-link flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[var(--civic-text)] transition hover:bg-[var(--civic-cyan-50)]"
        >
          <Icon size={18} strokeWidth={1.8} />
          {t(labelKey)}
        </button>
      );
    }

    return (
      <NavLink
        key={to}
        to={to}
        end={end}
        onClick={onNavigate}
        className={({ isActive }) =>
          `app-nav-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-[var(--civic-blue-800)] text-white" : "text-[var(--civic-text)] hover:bg-[var(--civic-cyan-50)]"}`
        }
      >
        <Icon size={18} strokeWidth={1.8} />
        {t(labelKey)}
      </NavLink>
    );
  };

  return (
    <aside
      className={`${mobile ? "flex w-full" : "fixed inset-y-0 left-0 z-40 hidden h-screen w-72 overflow-y-auto lg:flex"} flex-col border-r border-[var(--civic-border)] bg-white p-5 shadow-[var(--civic-shadow-sm)]`}
    >
      <div className="mb-6 border-b border-[var(--civic-border)] pb-4">
        <Link to="/dashboard" className="no-underline">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-[-0.01em] text-[var(--civic-blue-950)]">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--civic-cyan-500)]" />
            CivicDesk
          </h2>
          <p className="mt-1 text-[13px] text-[var(--civic-muted)]">
            {t("layout.welcome")}
          </p>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
        {mainItems.map(renderItem)}
      </nav>
      <div className="mt-auto border-t border-[var(--civic-border)] pt-3">
        <nav className="flex flex-col gap-1" aria-label="Account navigation">
          {accountNav.map(renderItem)}
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;
