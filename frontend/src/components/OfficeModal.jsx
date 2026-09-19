import { useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { createOffice, updateOffice } from "../store/officeSlice";
import { Modal } from "./Modal";

function OfficeModal({ office, onClose }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [form, setForm] = useState(() => ({
    code: office?.code ?? "",
    nameAm: office?.nameAm ?? "",
    nameEn: office?.nameEn ?? "",
  }));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.code.trim() || !form.nameAm.trim() || !form.nameEn.trim()) {
      setError(t("admin.requiredOfficeFields"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const action = office
        ? updateOffice({ id: office.id, ...form })
        : createOffice(form);
      await dispatch(action).unwrap();
      onClose();
    } catch (requestError) {
      setError(requestError);
    } finally {
      setSaving(false);
    }
  };

  const modalTitle = office ? t("admin.editOffice") : t("admin.addOffice");

  return (
    <Modal isOpen={true} onClose={onClose} title={modalTitle}>
      <form className="flex flex-col gap-3.5 p-5" onSubmit={handleSubmit}>
        <label className="civic-label">
          {t("admin.officeCode")}
          <input
            className="civic-input"
            value={form.code}
            onChange={(event) =>
              setForm({ ...form, code: event.target.value })
            }
          />
        </label>
        <label className="civic-label">
          {t("admin.nameAm")}
          <input
            className="civic-input"
            value={form.nameAm}
            onChange={(event) =>
              setForm({ ...form, nameAm: event.target.value })
            }
          />
        </label>
        <label className="civic-label">
          {t("admin.nameEn")}
          <input
            className="civic-input"
            value={form.nameEn}
            onChange={(event) =>
              setForm({ ...form, nameEn: event.target.value })
            }
          />
        </label>
        {error && (
          <div className="civic-alert civic-alert-error" role="alert">
            <span className="flex-1">{error}</span>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
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
              : office
                ? t("admin.saveChanges")
                : t("admin.addOffice")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default OfficeModal;
