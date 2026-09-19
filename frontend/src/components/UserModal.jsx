import { useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { createTechnician, createUser, updateUser } from "../store/userSlice";
import { Modal } from "./Modal";

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

  const modalTitle = technicianMode
    ? t("admin.addTechnician")
    : user
      ? t("admin.editUser")
      : t("admin.addUser");

  return (
    <Modal isOpen={true} onClose={onClose} title={modalTitle} maxWidth="max-w-xl">
      <form className="grid gap-3 p-5 sm:grid-cols-2" onSubmit={handleSubmit}>
        <label className="civic-label sm:col-span-2">
          {t("admin.fullName")}
          <input
            className="civic-input"
            value={form.fullName}
            onChange={(event) =>
              setForm({ ...form, fullName: event.target.value })
            }
          />
        </label>
        <label className="civic-label">
          {t("auth.phoneNumber")}
          <input
            className="civic-input"
            value={form.phoneNumber}
            onChange={(event) =>
              setForm({ ...form, phoneNumber: event.target.value })
            }
          />
        </label>
        <label className="civic-label">
          {user ? t("admin.passwordOptional") : t("admin.temporaryPassword")}
          <input
            type="password"
            className="civic-input"
            value={form.password}
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
          />
        </label>
        {!technicianMode && (
          <label className="civic-label">
            {t("admin.role")}
            <select
              className="civic-select"
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
        <label className="civic-label">
          {t("admin.office")}
          {technicianMode ? (
            <div className="civic-input bg-[#f8fafc] text-[var(--civic-muted)]">
              {offices.find((office) => office.code === "IT")?.nameEn ??
                t("admin.unassigned")}
              <small className="block text-[11px] text-[var(--civic-muted)]">
                {t("admin.automaticallyAssigned")}
              </small>
            </div>
          ) : (
            <select
              className="civic-select"
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
          <label className="civic-label">
            {t("auth.confirmPassword")}
            <input
              type="password"
              className="civic-input"
              value={form.confirmPassword}
              onChange={(event) =>
                setForm({ ...form, confirmPassword: event.target.value })
              }
            />
          </label>
        )}
        {error && (
          <div className="civic-alert civic-alert-error sm:col-span-2" role="alert">
            <span className="flex-1">{error}</span>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1 sm:col-span-2">
          <button
            type="button"
            onClick={onClose}
            className="button-secondary"
          >
            {t("admin.cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="button-primary"
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
    </Modal>
  );
}

export default UserModal;
