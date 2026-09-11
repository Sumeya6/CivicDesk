import { Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import LanguageToggle from "../LanguageToggle";

function AuthShell({ children }) {
  const location = useLocation();

  return (
    <main className="min-h-screen bg-[#f4f7fb]">
      <header className="flex h-14 items-center justify-between gap-2.5 border-b border-[#e2e8f0] border-t-2 border-t-[#1a2332] bg-white px-5 max-[480px]:px-3.5">
        <Link
          className="inline-flex min-w-0 items-center gap-[7px] text-[17px] font-bold tracking-[-0.01em] text-[#0757c9] no-underline"
          to="/login"
          aria-label="ITSM Portal home"
        >
          <Settings size={17} strokeWidth={2.8} />
          <span>CivicDesk</span>
        </Link>
        <LanguageToggle variant="auth" />
      </header>
      <section
        className="mx-auto my-10 w-[min(480px,calc(100%-32px))] rounded-xl border border-[#e5eaf1] bg-white shadow-[0_1px_3px_rgb(15_23_42_/_4%),0_6px_24px_rgb(15_23_42_/_3%)] max-[480px]:my-0 max-[480px]:min-h-[calc(100vh-56px)] max-[480px]:w-full max-[480px]:rounded-none max-[480px]:border-x-0"
        aria-label="Authentication"
      >
        <nav
          className="grid h-[50px] grid-cols-2 border-b border-[#e5eaf1]"
          aria-label="Authentication pages"
        >
          <Link
            className={`flex items-center justify-center border-b-2 border-transparent text-[13.5px] font-medium text-[#64748b] no-underline transition hover:text-[#334155] ${location.pathname === "/login" ? "border-b-[#0757c9] font-semibold text-[#0757c9]" : ""}`}
            to="/login"
          >
            Sign In
          </Link>
          <Link
            className={`flex items-center justify-center border-b-2 border-transparent text-[13.5px] font-medium text-[#64748b] no-underline transition hover:text-[#334155] ${location.pathname === "/register" ? "border-b-[#0757c9] font-semibold text-[#0757c9]" : ""}`}
            to="/register"
          >
            Register Account
          </Link>
        </nav>
        <div className="px-7 pb-7 pt-8 max-[480px]:px-4 max-[480px]:pb-7 max-[480px]:pt-6">
          {children}
        </div>
      </section>
    </main>
  );
}

export default AuthShell;
