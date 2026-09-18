import { useMemo, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function AppLayout() {
  const { isAuthenticated, role } = useSelector((state) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const normalizedRole = useMemo(() => role ?? "EMPLOYEE", [role]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen min-w-0 max-w-full overflow-x-hidden bg-(--civic-page)">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 rounded bg-(--civic-blue-800) text-white font-medium shadow-lg"
      >
        Skip to main content
      </a>
      <div className="flex min-w-0 max-w-full">
        <Sidebar
          role={normalizedRole}
          onNavigate={() => setMobileMenuOpen(false)}
        />
        <div className="ml-72 min-h-screen min-w-0 max-w-full flex-1 overflow-x-hidden max-[1023px]:ml-0">
          <Navbar
            role={normalizedRole}
            onMenuToggle={() => setMobileMenuOpen((value) => !value)}
          />
          {mobileMenuOpen ? (
            <div className="fixed left-0 right-0 top-14 z-35 max-h-[calc(100vh-56px)] overflow-y-auto border-b border-(--civic-border) bg-(--civic-page) p-4 lg:hidden">
              <Sidebar
                role={normalizedRole}
                mobile
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </div>
          ) : null}
          <main
            id="main-content"
            className="min-h-screen min-w-0 max-w-full px-4 pb-4 pt-22 lg:p-8 lg:pt-22 max-[640px]:px-3.5 max-[640px]:pb-4 max-[640px]:pt-22"
            tabIndex={-1}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppLayout;
