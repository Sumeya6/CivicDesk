import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Ticket,
  Wrench,
  Users,
  Building2,
  BarChart3,
  PlusCircle,
} from "lucide-react";

const ROLE_NAV = {
  EMPLOYEE: [
    { to: "/employee", label: "Dashboard", icon: LayoutDashboard },
    { to: "/employee/create", label: "Create Ticket", icon: PlusCircle },
  ],
  TECHNICIAN: [
    { to: "/technician", label: "My Queue", icon: Wrench },
  ],
  ADMIN: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/tickets", label: "All Tickets", icon: Ticket },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/offices", label: "Offices", icon: Building2 },
    { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role || "EMPLOYEE";
  const items = ROLE_NAV[role] || ROLE_NAV.EMPLOYEE;

  return (
    <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-gray-50 lg:block">
      <nav className="flex flex-col gap-1 p-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Navigation
        </p>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/employee" || item.to === "/technician" || item.to === "/admin"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
