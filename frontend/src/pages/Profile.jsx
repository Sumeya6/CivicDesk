import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { UserCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import LanguageToggle from "../components/LanguageToggle";
import { fetchMyTechnicianOffices } from "../store/userSlice";
import { fetchOfficeOptions } from "../store/officeSlice";

function Profile() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { currentUser, role } = useAuth();
  const offices = useSelector((state) => state.offices.items);
  const [technicianOfficeIds, setTechnicianOfficeIds] = useState([]);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const lang = i18n.language?.toLowerCase() === "am" ? "am" : "en";
  const roleLabel = t(`roles.${role}`, role);
  const isActive = currentUser?.isActive !== false;

  useEffect(() => {
    if (offices.length === 0) {
      dispatch(fetchOfficeOptions());
    }
  }, [dispatch, offices.length]);

  useEffect(() => {
    if (role === "TECHNICIAN") {
      dispatch(fetchMyTechnicianOffices())
        .unwrap()
        .then((ids) => setTechnicianOfficeIds(ids))
        .catch(() => setTechnicianOfficeIds([]));
    }
  }, [dispatch, role]);

  const officeName = (() => {
    if (!currentUser?.officeId) return null;
    const office = offices.find((o) => o.id === currentUser.officeId);
    if (!office) return currentUser.officeId;
    return lang === "am" ? office.nameAm : office.nameEn;
  })();

  const assignedOffices = technicianOfficeIds
    .map((id) => {
      const office = offices.find((o) => o.id === id);
      if (!office) return { id, name: id };
      return {
        id,
        name: lang === "am" ? office.nameAm : office.nameEn,
      };
    })
    .filter(Boolean);

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError(t("profile.passwordMismatch"));
      return;
    }

    setIsSavingPassword(true);
    try {
      const response = await api.put("/auth/change-password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswordMessage(
        response.data?.message || t("profile.passwordChanged"),
      );
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setPasswordError(error.message || t("profile.passwordChangeFailed"));
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="admin-surface workspace-page">
      <header className="workspace-header">
        <div>
          <p className="workspace-eyebrow">
            <UserCircle2 size={14} /> {t("layout.profile")}
          </p>
          <h1>{t("layout.profile")}</h1>
        </div>
      </header>

      <div className="content-surface">
        <div className="space-y-4 p-6">
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--civic-blue-800)] text-lg font-semibold text-white">
              {currentUser?.fullName?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {currentUser?.fullName ?? t("common.user")}
              </h2>
              <p className="text-xs text-slate-500">{roleLabel}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                {t("auth.phoneNumber")}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-800">
                {currentUser?.phoneNumber ?? "-"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                {t("admin.role")}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-800">
                {roleLabel}
              </p>
            </div>
          </div>

          {(role === "EMPLOYEE" || role === "ADMIN") && officeName && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                {t("auth.office")}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-800">
                {officeName}
              </p>
            </div>
          )}

          {role === "TECHNICIAN" && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                {t("profile.assignedOffices")}
              </p>
              {assignedOffices.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {assignedOffices.map((office) => (
                    <span
                      key={office.id}
                      className="inline-flex items-center rounded-md bg-[var(--civic-cyan-50)] px-2.5 py-1 text-xs font-medium text-[var(--civic-blue-800)]"
                    >
                      {office.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  {t("dashboard.noAssignedOffices")}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                {t("profile.accountStatus")}
              </p>
              <p className="mt-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    isActive
                      ? "bg-green-50 text-green-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {isActive ? t("admin.active") : t("admin.inactive")}
                </span>
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                {t("profile.preferredLanguage")}
              </p>
              <div className="mt-2">
                <LanguageToggle variant="auth" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="content-surface">
        <div className="content-surface-header">
          <h2>{t("profile.changePassword")}</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4 p-6">
          {passwordError && (
            <p className="text-xs text-red-600" role="alert">
              {passwordError}
            </p>
          )}
          {passwordMessage && (
            <p className="text-xs text-green-600" role="status">
              {passwordMessage}
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            <label className="civic-label">
              {t("profile.currentPassword")}
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(event) =>
                  setPasswords({
                    ...passwords,
                    currentPassword: event.target.value,
                  })
                }
                className="civic-input mt-1"
                required
              />
            </label>
            <label className="civic-label">
              {t("profile.newPassword")}
              <input
                type="password"
                value={passwords.newPassword}
                onChange={(event) =>
                  setPasswords({
                    ...passwords,
                    newPassword: event.target.value,
                  })
                }
                className="civic-input mt-1"
                minLength={8}
                required
              />
            </label>
            <label className="civic-label">
              {t("profile.confirmPassword")}
              <input
                type="password"
                value={passwords.confirmPassword}
                onChange={(event) =>
                  setPasswords({
                    ...passwords,
                    confirmPassword: event.target.value,
                  })
                }
                className="civic-input mt-1"
                minLength={8}
                required
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={isSavingPassword}
            className="button-primary"
          >
            {isSavingPassword
              ? t("profile.savingPassword")
              : t("profile.changePassword")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
