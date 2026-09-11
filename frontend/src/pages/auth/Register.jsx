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
        error?.response?.data?.message || t("auth.registrationFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div>
        <h1 className="m-0 text-[21px] font-bold leading-[1.3] tracking-[-0.02em] text-[#0f172a] max-[480px]:text-[19px]">
          {t("auth.createAccount")}
        </h1>
        <p className="mb-[22px] mt-[7px] text-[13.5px] leading-[1.5] text-[#64748b]">
          {t("auth.registerDescription")}
        </p>
      </div>
      <form className="flex flex-col gap-[15px]" onSubmit={handleSubmit}>
        <div>
          <label
            className="mb-1.5 block text-[13px] font-medium text-[#334155]"
            htmlFor="fullName"
          >
            {t("auth.fullName")}
          </label>
          <div className="flex h-10 items-center rounded-lg border-[1.5px] border-[#d1d9e6] bg-white px-[11px] text-[#94a3b8] transition focus-within:border-[#0757c9] focus-within:shadow-[0_0_0_3px_rgb(7_87_201_/_8%)]">
            <UserRound size={16} />
            <input
              id="fullName"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Abebe Welde"
              autoComplete="name"
              className="flex-1 border-0 bg-transparent outline-none focus:border-0 focus:outline-none focus:ring-0 text-black  text-[15px]"
            />
          </div>
          {errors.fullName && (
            <p className="mt-1 text-[12.5px] leading-[1.4] text-red-600">
              {errors.fullName}
            </p>
          )}
        </div>
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
              className="flex-1 border-0 bg-transparent outline-none focus:border-0 focus:outline-none focus:ring-0 text-black text-[15px]"
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
            htmlFor="officeId"
          >
            {t("auth.office")}
          </label>
          <div className="relative flex h-10 items-center rounded-lg border-[1.5px] border-[#d1d9e6] bg-white px-[11px] pr-[5px] text-[#94a3b8] transition focus-within:border-[#0757c9] focus-within:shadow-[0_0_0_3px_rgb(7_87_201_/_8%)]">
            <Building2 size={16} />
            <select
              id="officeId"
              name="officeId"
              value={form.officeId}
              onChange={handleChange}
              className="flex-1 border-0 bg-transparent outline-none focus:border-0 focus:outline-none focus:ring-0 text-black text-[12px]"
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
              className="pointer-events-none absolute right-[11px] top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]"
            />
          </div>
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
                autoComplete="new-password"
                className="flex-1 border-0 bg-transparent outline-none focus:border-0 focus:outline-none focus:ring-0 text-black text-[15px]"
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
          <p className="mt-1.5 mx-0.5 text-xs leading-[1.4] text-[#94a3b8]">
            {t("auth.passwordHint")}
          </p>
          {errors.password && (
            <p className="mt-1 text-[12.5px] leading-[1.4] text-red-600">
              {errors.password}
            </p>
          )}
        </div>
        <div>
          <label
            className="mb-1.5 block text-[13px] font-medium text-[#334155]"
            htmlFor="confirmPassword"
          >
            {t("auth.confirmPassword")}
          </label>
          <div className="relative">
            <div className="flex h-10 items-center rounded-lg border-[1.5px] border-[#d1d9e6] bg-white px-[11px] text-[#94a3b8] transition focus-within:border-[#0757c9] focus-within:shadow-[0_0_0_3px_rgb(7_87_201_/_8%)]">
              <LockKeyhole size={16} />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                className="flex-1 border-0 bg-transparent outline-none focus:border-0 focus:outline-none focus:ring-0 text-black text-[15px]"
              />
            </div>
            <button
              type="button"
              className="absolute bottom-px right-px top-px flex w-[38px] items-center justify-center rounded-r-[7px] border-0 bg-transparent text-[#94a3b8] transition hover:text-[#475569]"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-[12.5px] leading-[1.4] text-red-600">
              {errors.confirmPassword}
            </p>
          )}
        </div>
        {submitError && (
          <p className="mt-1 text-[12.5px] leading-[1.4] text-red-600">
            {submitError}
          </p>
        )}
        {successMessage && (
          <p className="mt-1 text-[12.5px] leading-[1.4] text-green-600">
            {successMessage}
          </p>
        )}
        <button
          className="mt-1 flex h-[42px] items-center justify-center gap-2 rounded-lg border-0 bg-[#0757c9] text-sm font-semibold text-white transition hover:bg-[#0546b0] hover:shadow-[0_4px_12px_rgb(7_87_201_/_25%)] disabled:cursor-wait disabled:opacity-65"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? t("auth.registering") : t("auth.register")}
          <ArrowRight size={16} />
        </button>
      </form>
      <div className="mt-[18px] border-t border-[#e5eaf1] pt-3.5 text-center text-xs leading-[1.6] text-[#94a3b8]">
        {t("auth.termsPrefix")} <a href="#terms" className="text-[#0757c9] hover:underline">
          {t("auth.terms")}
        </a>{" "}
        {t("auth.and")} <a href="#privacy" className="text-[#0757c9] hover:underline">
          {t("auth.privacy")}
        </a>.
      </div>
      <div className="hidden">
        {t("auth.haveAccount")} <Link to="/login">{t("auth.signIn")}</Link>
      </div>
    </AuthShell>
  );
}

export default Register;
