import { ArrowRight, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthShell from "../../components/auth/AuthShell";
import api from "../../api/axios";

function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlToken = searchParams.get("token");

  const [token, setToken] = useState(urlToken || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(!urlToken);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token.trim()) {
      setError("Reset token is required.");
      return;
    }
    if (!newPassword || !confirmPassword) {
      setError("Both fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await api.post("/auth/reset-password", {
        token: token.trim(),
        newPassword,
      });
      setMessage(
        response.data?.message || "Password has been reset successfully.",
      );
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to reset password. Token may be expired or invalid.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div>
        <h1 className="m-0 text-[var(--civic-font-size-xl)] font-bold leading-[1.3] tracking-[-0.02em] text-[var(--civic-text)]">
          Reset Password
        </h1>
        <p className="mb-5 mt-2 text-[var(--civic-font-size-md)] leading-[1.5] text-[var(--civic-muted)]">
          {urlToken
            ? "Enter your new password below."
            : "Enter the reset code you received via SMS and your new password."}
        </p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {showTokenInput && (
          <div>
            <label
              className="mb-1.5 block text-[var(--civic-font-size-base)] font-medium text-[var(--civic-text)]"
              htmlFor="token"
            >
              Reset Code
            </label>
            <div className="flex h-10 items-center rounded-lg border border-[var(--civic-border)] bg-white px-3 text-[var(--civic-muted)] transition focus-within:border-[var(--civic-blue-600)] focus-within:shadow-[var(--civic-focus-ring)]">
              <Lock size={16} className="shrink-0" />
              <input
                id="token"
                type="text"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Enter reset code from SMS"
                autoComplete="one-time-code"
                className="flex-1 bg-transparent pl-2 text-center text-[15px] text-[var(--civic-text)] tracking-widest outline-none placeholder:text-[var(--civic-muted)]"
              />
            </div>
          </div>
        )}
        <div>
          <label
            className="mb-1.5 block text-[var(--civic-font-size-base)] font-medium text-[var(--civic-text)]"
            htmlFor="newPassword"
          >
            New Password
          </label>
          <div className="relative">
            <div className="flex h-10 items-center rounded-lg border border-[var(--civic-border)] bg-white px-3 text-[var(--civic-muted)] transition focus-within:border-[var(--civic-blue-600)] focus-within:shadow-[var(--civic-focus-ring)]">
              <Lock size={16} className="shrink-0" />
              <input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                className="flex-1 border-0 bg-transparent pl-2 text-[15px] text-[var(--civic-text)] outline-none placeholder:text-[var(--civic-muted)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="mr-1 flex items-center justify-center rounded p-1 text-[var(--civic-muted)] transition hover:text-[var(--civic-text)]"
                aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
        <div>
          <label
            className="mb-1.5 block text-[var(--civic-font-size-base)] font-medium text-[var(--civic-text)]"
            htmlFor="confirmPassword"
          >
            Confirm New Password
          </label>
          <div className="flex h-10 items-center rounded-lg border border-[var(--civic-border)] bg-white px-3 text-[var(--civic-muted)] transition focus-within:border-[var(--civic-blue-600)] focus-within:shadow-[var(--civic-focus-ring)]">
            <Lock size={16} className="shrink-0" />
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
              className="flex-1 border-0 bg-transparent pl-2 text-[15px] text-[var(--civic-text)] outline-none placeholder:text-[var(--civic-muted)]"
            />
          </div>
        </div>
        {error && (
          <div className="civic-alert civic-alert-error" role="alert">
            <span className="flex-1">{error}</span>
          </div>
        )}
        {message && (
          <div className="civic-alert civic-alert-success" role="status">
            <span className="flex-1">{message}</span>
          </div>
        )}
        <button
          className="mt-1 flex h-10 items-center justify-center gap-2 rounded-lg border-0 bg-[var(--civic-blue-800)] text-sm font-semibold text-white transition hover:bg-[var(--civic-blue-950)] hover:shadow-[var(--civic-shadow-md)] disabled:cursor-wait disabled:opacity-65"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? t("common.loading") : "Reset Password"}
          <ArrowRight size={16} />
        </button>
      </form>
      {!urlToken && (
        <p className="mt-3 text-center text-[12px] text-[var(--civic-muted)]">
          Have a reset link with a token?{" "}
          <button
            type="button"
            onClick={() => setShowTokenInput(false)}
            className="text-[var(--civic-blue-700)] hover:text-[var(--civic-blue-800)] hover:underline"
          >
            Use token from URL instead
          </button>
        </p>
      )}
      <div className="mt-5 border-t border-[var(--civic-border)] pt-4 text-center text-[13px] text-[var(--civic-muted)]">
        <Link to="/login" className="text-[var(--civic-blue-700)] hover:text-[var(--civic-blue-800)] hover:underline">
          {t("common.back")} {t("auth.signIn")}
        </Link>
      </div>
    </AuthShell>
  );
}

export default ResetPassword;
