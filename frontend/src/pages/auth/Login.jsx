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
      const message =
        error?.response?.data?.message || t("auth.invalidCredentials");
      setSubmitError(
        error?.response?.status === 401 &&
          error?.response?.data?.message === "User not found or inactive."
          ? t("auth.inactiveAccount")
          : error?.response?.status === 401
            ? t("auth.invalidCredentials")
            : message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div>
        <h1 className="m-0 text-[21px] font-bold leading-[1.3] tracking-[-0.02em] text-[#0f172a] max-[480px]:text-[19px]">
          {t("auth.signInTitle")}
        </h1>
        <p className="mb-[22px] mt-[7px] text-[13.5px] leading-[1.5] text-[#64748b]">
          {t("auth.loginDescription")}
        </p>
      </div>
      <form className="flex flex-col gap-[18px]" onSubmit={handleSubmit}>
        <div>
          <label
            className="mb-1.5 block text-[13px] font-medium text-[#334155]"
            htmlFor="phoneNumber"
          >
            {t("auth.phoneNumber")}
          </label>
          <div className="flex h-10 items-center rounded-lg border-[1.5px] border-[#d1d9e6] bg-white px-[11px] text-[#94a3b8] transition focus-within:border-[#0757c9] focus-within:shadow-[0_0_0_3px_rgb(7_87_201_/_8%)]">
            <Phone size={16} />
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={form.phoneNumber}
              onChange={handleChange}
              placeholder="+251 912345678"
              autoComplete="tel"
            />
          </div>
          {errors.phoneNumber && (
            <p className="mt-1 text-[12.5px] leading-[1.4] text-red-600">
              {errors.phoneNumber}
            </p>
          )}
        </div>
        <div>
          <label
            className="mb-1.5 block text-[13px] font-medium text-[#334155]"
            htmlFor="password"
          >
            {t("auth.password")}
          </label>
          <div className="relative">
            <div className="flex h-10 items-center rounded-lg border-[1.5px] border-[#d1d9e6] bg-white px-[11px] text-[#94a3b8] transition focus-within:border-[#0757c9] focus-within:shadow-[0_0_0_3px_rgb(7_87_201_/_8%)]">
              <LockKeyhole size={16} />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <button
              type="button"
              className="absolute bottom-px right-px top-px flex w-[38px] items-center justify-center rounded-r-[7px] border-0 bg-transparent text-[#94a3b8] transition hover:text-[#475569]"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-[12.5px] leading-[1.4] text-red-600">
              {errors.password}
            </p>
          )}
        </div>
        <div className="-mt-1.5 text-right">
          <Link to="/forgot-password">{t("auth.forgotPassword")}</Link>
        </div>
        {submitError && (
          <p className="mt-1 text-[12.5px] leading-[1.4] text-red-600">
            {submitError}
          </p>
        )}
        <button
          className="mt-1 flex h-[42px] items-center justify-center gap-2 rounded-lg border-0 bg-[#0757c9] text-sm font-semibold text-white transition hover:bg-[#0546b0] hover:shadow-[0_4px_12px_rgb(7_87_201_/_25%)] active:translate-y-px disabled:cursor-wait disabled:opacity-65"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
          <ArrowRight size={16} />
        </button>
      </form>
      <div className="mt-5 border-t border-[#e5eaf1] pt-4 text-center text-[13px] text-[#64748b]">
        {t("auth.noAccount")}{" "}
        <Link to="/register">{t("auth.registerNow")}</Link>
      </div>
    </AuthShell>
  );
}

export default Login;
