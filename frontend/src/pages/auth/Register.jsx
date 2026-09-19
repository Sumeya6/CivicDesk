import {
  ArrowRight,
  Building2,
  ChevronDown,
  Eye,
  EyeOff,
  LockKeyhole,
  Phone,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import api from "../../api/axios";
import AuthShell from "../../components/auth/AuthShell";
import { fetchOfficeOptions } from "../../store/officeSlice";

function Register() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const offices = useSelector((state) => state.offices.items);
  const officesStatus = useSelector((state) => state.offices.status);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    officeId: "",
    preferredLanguage: "AM",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    dispatch(fetchOfficeOptions());
  }, [dispatch]);
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: "" }));
  };
  const validate = () => {
    const nextErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = t("auth.fullName");
    if (!form.phoneNumber.trim())
      nextErrors.phoneNumber = t("auth.phoneNumber");
    if (!form.officeId) nextErrors.officeId = t("auth.selectOffice");
    if (!form.password.trim() || form.password.length < 8)
      nextErrors.password = t("auth.password");
    if (form.password !== form.confirmPassword)
      nextErrors.confirmPassword = t("auth.passwordMismatch");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError("");
    setSuccessMessage("");
    try {
      const payload = {
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        password: form.password,
        confirmPassword: undefined,
        preferredLanguage: form.preferredLanguage || "AM",
        officeId: form.officeId,
      };
      await api.post("/auth/register", payload);
      setSuccessMessage(t("auth.registrationSuccess"));
      setTimeout(() => navigate("/login"), 800);
    } catch (error) {
      setSubmitError(
        error?.data?.message || error?.message || t("auth.registrationFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div>
        <h1 className="m-0 text-(length:--civic-font-size-xl) font-bold leading-[1.3] tracking-[-0.02em] text-(--civic-text) max-[480px]:text-(length:--civic-font-size-lg)">
          {t("auth.createAccount")}
        </h1>
        <p className="mb-5 mt-2 text-(length:--civic-font-size-md) leading-normal text-[#64748b]">
          {t("auth.registerDescription")}
        </p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label
            className="mb-1.5 block text-(length:--civic-font-size-base) font-medium text-(--civic-text)"
            htmlFor="fullName"
          >
            {t("auth.fullName")}
          </label>
          <div className="flex h-10 items-center rounded-lg border border-(--civic-border) bg-white px-3 text-(--civic-muted) transition focus-within:border-(--civic-blue-600) focus-within:shadow-(--civic-focus-ring)">
            <UserRound size={16} className="shrink-0" />
            <input
              id="fullName"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Abebe Welde"
              autoComplete="name"
              className="flex-1 border-0 bg-transparent pl-2 text-[15px] text-(--civic-text) outline-none placeholder:text-(--civic-muted)"
            />
          </div>
          {errors.fullName && (
            <p
              className="mt-1 text-[12px] leading-[1.4] text-(--civic-error)"
              role="alert"
            >
              {errors.fullName}
            </p>
          )}
        </div>
        <div>
          <label
            className="mb-1.5 block text-(length:--civic-font-size-base) font-medium text-(--civic-text)"
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
            className="mb-1.5 block text-(length:--civic-font-size-base) font-medium text-(--civic-text)"
            htmlFor="officeId"
          >
            {t("auth.office")}
          </label>
          <div className="relative flex h-10 items-center rounded-lg border border-(--civic-border) bg-white px-3 pr-2 text-(--civic-muted) transition focus-within:border-(--civic-blue-600) focus-within:shadow-(--civic-focus-ring)">
            <Building2 size={16} className="shrink-0" />
            <select
              id="officeId"
              name="officeId"
              value={form.officeId}
              onChange={handleChange}
              className="flex-1 border-0 bg-transparent pl-2 text-(--civic-text) text-[13px] outline-none"
            >
              <option value="">
                {officesStatus === "loading"
                  ? t("auth.loadingOffices")
                  : t("auth.selectOffice")}
              </option>
              {offices.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.nameEn} / {office.nameAm}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--civic-muted)"
            />
          </div>
          {errors.officeId && (
            <p
              className="mt-1 text-[12px] leading-[1.4] text-(--civic-error)"
              role="alert"
            >
              {errors.officeId}
            </p>
          )}
        </div>
        <div>
          <label
            className="mb-1.5 block text-(length:--civic-font-size-base) font-medium text-(--civic-text)"
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
                autoComplete="new-password"
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
          <p className="mt-1 text-[12px] leading-[1.4] text-(--civic-muted)">
            {t("auth.passwordHint")}
          </p>
          {errors.password && (
            <p
              className="mt-1 text-[12px] leading-[1.4] text-(--civic-error)"
              role="alert"
            >
              {errors.password}
            </p>
          )}
        </div>
        <div>
          <label
            className="mb-1.5 block text-(length:--civic-font-size-base) font-medium text-(--civic-text)"
            htmlFor="confirmPassword"
          >
            {t("auth.confirmPassword")}
          </label>
          <div className="relative">
            <div className="flex h-10 items-center rounded-lg border border-(--civic-border) bg-white px-3 text-(--civic-muted) transition focus-within:border-(--civic-blue-600) focus-within:shadow-(--civic-focus-ring)">
              <LockKeyhole size={16} className="shrink-0" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                className="flex-1 border-0 bg-transparent pl-2 text-[15px] text-(--civic-text) outline-none placeholder:text-(--civic-muted)"
              />
            </div>
            <button
              type="button"
              className="absolute bottom-px right-px top-px flex w-10 items-center justify-center rounded-r-lg border-0 bg-transparent text-(--civic-muted) transition hover:text-(--civic-text)"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={
                showConfirmPassword
                  ? t("auth.hidePassword")
                  : t("auth.showPassword")
              }
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p
              className="mt-1 text-[12px] leading-[1.4] text-(--civic-error)"
              role="alert"
            >
              {errors.confirmPassword}
            </p>
          )}
        </div>
        {submitError && (
          <div className="civic-alert civic-alert-error" role="alert">
            <span className="flex-1">{submitError}</span>
          </div>
        )}
        {successMessage && (
          <div className="civic-alert civic-alert-success" role="status">
            <span className="flex-1">{successMessage}</span>
          </div>
        )}
        <button
          className="mt-1 flex h-10 items-center justify-center gap-2 rounded-lg border-0 bg-(--civic-blue-800) text-sm font-semibold text-white transition hover:bg-(--civic-blue-950) hover:shadow-(--civic-shadow-md) disabled:cursor-wait disabled:opacity-65"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? t("auth.registering") : t("auth.register")}
          <ArrowRight size={16} />
        </button>
      </form>
      <div className="mt-4 border-t border-(--civic-border) pt-3.5 text-center text-[12px] leading-[1.6] text-(--civic-muted)">
        {t("auth.termsPrefix")}{" "}
        <a
          href="#terms"
          className="text-(--civic-blue-700) hover:text-(--civic-blue-800) hover:underline"
        >
          {t("auth.terms")}
        </a>{" "}
        {t("auth.and")}{" "}
        <a
          href="#privacy"
          className="text-(--civic-blue-700) hover:text-(--civic-blue-800) hover:underline"
        >
          {t("auth.privacy")}
        </a>
        .
      </div>
      <div className="hidden">
        {t("auth.haveAccount")} <Link to="/login">{t("auth.signIn")}</Link>
      </div>
    </AuthShell>
  );
}

export default Register;
