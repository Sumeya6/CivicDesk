import { X } from "lucide-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { createTechnician, createUser, updateUser } from "../store/userSlice";

function UserModal({ offices, user, technicianMode = false, onClose }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [form, setForm] = useState(() => ({
    fullName: user?.fullName ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    password: "",
    role: user?.role ?? "EMPLOYEE",
    officeId:
      user?.officeId ??
      offices.find((office) => office.code === "IT")?.id ??
      "",
    preferredLanguage: user?.preferredLanguage ?? "AM",
    confirmPassword: "",
  }));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (
      !form.fullName.trim() ||
      !form.phoneNumber.trim() ||
      (!user && form.password.length < 8) ||
      (technicianMode && form.password !== form.confirmPassword)
    ) {
      setError(
        technicianMode && form.password !== form.confirmPassword
          ? t("auth.passwordMismatch")
          : `${t("admin.fullName")}, ${t("auth.phoneNumber")}, and a password of at least 8 characters are required.`,
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        preferredLanguage: form.preferredLanguage,
      };
      if (!user) payload.password = form.password;
      if (technicianMode) {
        await dispatch(createTechnician(payload)).unwrap();
      } else {
        payload.role = form.role;
        payload.officeId = form.officeId || undefined;
        await dispatch(
          user
            ? updateUser({ id: user.id, ...payload })
            : createUser({ ...payload, password: form.password }),
        ).unwrap();
      }
      onClose();
    } catch (requestError) {
      setError(requestError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-[rgb(11_47_107_/_38%)] p-4 max-[640px]:items-start max-[640px]:p-3"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="w-[min(100%,32rem)] max-h-[calc(100vh-32px)] min-w-0 overflow-x-hidden overflow-y-auto rounded-xl border border-[var(--civic-border)] bg-white shadow-[0_18px_45px_rgb(11_47_107_/_18%)] max-[640px]:max-h-[calc(100vh-24px)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-modal-title"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2
            id="user-modal-title"
            className="text-base font-semibold text-slate-900"
          >
            {technicianMode
              ? t("admin.addTechnician")
              : user
                ? t("admin.editUser")
                : t("admin.addUser")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        <form className="grid gap-3 p-5 sm:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
            {t("admin.fullName")}
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.fullName}
              onChange={(event) =>
                setForm({ ...form, fullName: event.target.value })
              }
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            {t("auth.phoneNumber")}
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.phoneNumber}
              onChange={(event) =>
                setForm({ ...form, phoneNumber: event.target.value })
              }
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            {user ? t("admin.passwordOptional") : t("admin.temporaryPassword")}
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
            />
          </label>
          {!technicianMode && (
            <label className="block text-xs font-medium text-slate-600">
              {t("admin.role")}
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={form.role}
                onChange={(event) =>
                  setForm({ ...form, role: event.target.value })
                }
              >
                <option>EMPLOYEE</option>
                <option>TECHNICIAN</option>
                <option>ADMIN</option>
              </select>
            </label>
          )}
          <label className="block text-xs font-medium text-slate-600">
            {t("admin.office")}
            {technicianMode ? (
              <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                {offices.find((office) => office.code === "IT")?.nameEn ??
                  t("admin.unassigned")}
                <small className="block text-slate-500">
                  {t("admin.automaticallyAssigned")}
                </small>
              </div>
            ) : (
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={form.officeId}
                onChange={(event) =>
                  setForm({ ...form, officeId: event.target.value })
                }
              >
                <option value="">{t("admin.unassigned")}</option>
                {offices.map((office) => (
                  <option key={office.id} value={office.id}>
                    {office.nameEn}
                  </option>
                ))}
              </select>
            )}
          </label>
          {technicianMode && (
            <label className="block text-xs font-medium text-slate-600">
              {t("auth.confirmPassword")}
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm({ ...form, confirmPassword: event.target.value })
                }
              />
            </label>
          )}
          {error && (
            <p className="text-xs text-red-600 sm:col-span-2" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {t("admin.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving
                ? t("admin.saving")
                : technicianMode
                  ? t("admin.addTechnician")
                  : user
                    ? t("admin.saveChanges")
                    : t("admin.addUser")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserModal;
