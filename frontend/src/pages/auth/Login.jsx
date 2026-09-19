import { ArrowRight, Eye, EyeOff, LockKeyhole, Phone } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import AuthShell from "../../components/auth/AuthShell";

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ phoneNumber: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: "" }));
  };
  const validate = () => {
    const nextErrors = {};
    if (!form.phoneNumber.trim())
      nextErrors.phoneNumber = t("auth.phoneNumber");
    if (!form.password.trim()) nextErrors.password = t("auth.password");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      await login({ phoneNumber: form.phoneNumber, password: form.password });
      navigate("/dashboard");
    } catch (error) {
      const backendMessage = error?.data?.message || error?.message;
      setSubmitError(
        error?.status === 401 &&
          backendMessage === "User not found or inactive."
          ? t("auth.inactiveAccount")
          : error?.status === 401
            ? t("auth.invalidCredentials")
            : backendMessage || t("auth.invalidCredentials"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div>
        <h1 className="m-0 font-bold leading-[1.3] tracking-[-0.02em] text-(--civic-text) max-[480px]:text-(--civic-font-size-lg)">
          {t("auth.signInTitle")}
        </h1>
        <p className="mb-5 mt-2 text-(--civic-font-size-md) leading-normal">
          {t("auth.loginDescription")}
        </p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label
            className="mb-1.5 block text-(--civic-font-size-base) font-medium"
            htmlFor="phoneNumber"
          >
            {t("auth.phoneNumber")}
          </label>
          <div className="flex h-10 items-center rounded-lg border border-(--civic-border) bg-white px-3 text-(--civic-muted) transition focus-within:border-(--civic-blue-600) focus-within:shadow-(--civic-focus-ring)">
            <Phone size={16} className="shrink-0" />
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={form.phoneNumber}
              onChange={handleChange}
              placeholder="+251 912345678"
              autoComplete="tel"
              className="flex-1 border-0 bg-transparent pl-2 text-[15px] text-(--civic-text) outline-none placeholder:text-(--civic-muted)"
            />
          </div>
          {errors.phoneNumber && (
            <p
              className="mt-1 text-[12px] leading-[1.4] text-(--civic-error)"
              role="alert"
            >
              {errors.phoneNumber}
            </p>
          )}
        </div>
        <div>
          <label
            className="mb-1.5 block text-(--civic-font-size-base) font-medium"
            htmlFor="password"
          >
            {t("auth.password")}
          </label>
          <div className="relative">
            <div className="flex h-10 items-center rounded-lg border border-(--civic-border) bg-white px-3 text-(--civic-muted) transition focus-within:border-(--civic-blue-600) focus-within:shadow-(--civic-focus-ring)">
              <LockKeyhole size={16} className="shrink-0" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                className="flex-1 border-0 bg-transparent pl-2 text-[15px] text-(--civic-text) outline-none placeholder:text-(--civic-muted)"
              />
            </div>
            <button
              type="button"
              className="absolute bottom-px right-px top-px flex w-10 items-center justify-center rounded-r-lg border-0 bg-transparent text-(--civic-muted) transition hover:text-(--civic-text)"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword ? t("auth.hidePassword") : t("auth.showPassword")
              }
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p
              className="mt-1 text-[12px] leading-[1.4] text-(--civic-error)"
              role="alert"
            >
              {errors.password}
            </p>
          )}
        </div>
        <div className="-mt-1 text-right text-[11px]">
          <Link
            to="/forgot-password"
            className="text-(--civic-blue-700) hover:text-(--civic-blue-800) hover:underline"
          >
            {t("auth.forgotPassword")}
          </Link>
        </div>
        {submitError && (
          <div className="civic-alert civic-alert-error" role="alert">
            <span className="flex-1">{submitError}</span>
          </div>
        )}
        <button
          className="mt-1 flex h-10 items-center justify-center gap-2 rounded-lg border-0 bg-(--civic-blue-800) text-sm font-semibold text-white transition hover:bg-(--civic-blue-950) hover:shadow-(--civic-shadow-md) active:translate-y-px disabled:cursor-wait disabled:opacity-65"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
          <ArrowRight size={16} />
        </button>
      </form>
      <div className="mt-5 border-t border-(--civic-border) pt-4 text-center text-[12px] text-(--civic-muted)">
        {t("auth.noAccount")}{" "}
        <Link
          to="/register"
          className="text-(--civic-blue-700) hover:text-(--civic-blue-800) hover:underline"
        >
          {t("auth.registerNow")}
        </Link>
      </div>
    </AuthShell>
  );
}

export default Login;
