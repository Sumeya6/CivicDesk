import { ArrowRight, Phone, ArrowRight as NavArrow } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthShell from "../../components/auth/AuthShell";
import api from "../../api/axios";

function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!phoneNumber.trim()) {
      setError(t("auth.phoneNumber"));
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const response = await api.post("/auth/forgot-password", { phoneNumber });
      setMessage(
        response.data?.message ||
          "If an account exists, a reset code has been sent via SMS.",
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to send reset instructions.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToResetPassword = () => {
    navigate("/reset-password");
  };

  return (
    <AuthShell>
      <div>
        <h1 className="m-0 text-[var(--civic-font-size-xl)] font-bold leading-[1.3] tracking-[-0.02em] text-[var(--civic-text)]">
          {t("auth.forgotPassword")}
        </h1>
        <p className="mb-5 mt-2 text-[var(--civic-font-size-md)] leading-[1.5] text-[var(--civic-muted)]">
          Enter your phone number to receive reset instructions.
        </p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label
            className="mb-1.5 block text-[var(--civic-font-size-base)] font-medium text-[var(--civic-text)]"
            htmlFor="phoneNumber"
          >
            {t("auth.phoneNumber")}
          </label>
          <div className="flex h-10 items-center rounded-lg border border-[var(--civic-border)] bg-white px-3 text-[var(--civic-muted)] transition focus-within:border-[var(--civic-blue-600)] focus-within:shadow-[var(--civic-focus-ring)]">
            <Phone size={16} className="shrink-0" />
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="+251 912345678"
              autoComplete="tel"
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
          <div className="flex flex-col gap-3">
            <div className="civic-alert civic-alert-success" role="status">
              <span className="flex-1">{message}</span>
            </div>
            <button
              type="button"
              onClick={goToResetPassword}
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--civic-blue-800)] bg-white text-sm font-semibold text-[var(--civic-blue-800)] transition hover:bg-[var(--civic-blue-800)] hover:text-white"
            >
              Go to Reset Password
              <NavArrow size={16} />
            </button>
          </div>
        )}
        <button
          className="mt-1 flex h-10 items-center justify-center gap-2 rounded-lg border-0 bg-[var(--civic-blue-800)] text-sm font-semibold text-white transition hover:bg-[var(--civic-blue-950)] hover:shadow-[var(--civic-shadow-md)] disabled:cursor-wait disabled:opacity-65"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? t("common.loading") : "Send instructions"}
          <ArrowRight size={16} />
        </button>
      </form>
      <div className="mt-5 border-t border-[var(--civic-border)] pt-4 text-center text-[13px] text-[var(--civic-muted)]">
        <Link to="/login" className="text-[var(--civic-blue-700)] hover:text-[var(--civic-blue-800)] hover:underline">
          {t("common.back")} {t("auth.signIn")}
        </Link>
      </div>
    </AuthShell>
  );
}

export default ForgotPassword;
