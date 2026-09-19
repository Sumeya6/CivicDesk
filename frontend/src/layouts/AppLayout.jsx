import { useMemo, useState, useCallback } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function AppLayout() {
  const { isAuthenticated, role } = useSelector((state) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const normalizedRole = useMemo(() => role ?? "EMPLOYEE", [role]);

  const handleMobileNavigate = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const handleMenuToggle = useCallback(() => {
    setMobileMenuOpen((v) => !v);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen min-w-0 max-w-full overflow-x-hidden bg-[var(--civic-page)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 rounded-lg bg-[var(--civic-blue-800)] px-4 py-2 font-medium text-white shadow-lg"
      >
        Skip to main content
      </a>
      <div className="flex min-w-0 max-w-full">
        <Sidebar
          role={normalizedRole}
          onNavigate={handleMobileNavigate}
        />
        <div className="ml-72 min-h-screen min-w-0 max-w-full flex-1 overflow-x-hidden max-[1023px]:ml-0">
          <Navbar
            role={normalizedRole}
            onMenuToggle={handleMenuToggle}
          />
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 top-14 z-35 overflow-y-auto border-b border-[var(--civic-border)] bg-[var(--civic-page)] p-4 lg:hidden"
              aria-label="Mobile navigation"
            >
              <Sidebar
                role={normalizedRole}
                mobile
                onNavigate={handleMobileNavigate}
              />
            </div>
          )}
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 top-14 z-30 bg-black/20 lg:hidden"
              onClick={handleMobileNavigate}
              aria-hidden="true"
            />
          )}
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
