import { X } from "lucide-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { createOffice, updateOffice } from "../store/officeSlice";

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
        aria-labelledby="office-modal-title"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2
            id="office-modal-title"
            className="text-base font-semibold text-slate-900"
          >
            {office ? t("admin.editOffice") : t("admin.addOffice")}
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
        <form className="space-y-3.5 p-5" onSubmit={handleSubmit}>
          <label className="block text-xs font-medium text-slate-600">
            {t("admin.officeCode")}
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.code}
              onChange={(event) =>
                setForm({ ...form, code: event.target.value })
              }
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            {t("admin.nameAm")}
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.nameAm}
              onChange={(event) =>
                setForm({ ...form, nameAm: event.target.value })
              }
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            {t("admin.nameEn")}
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.nameEn}
              onChange={(event) =>
                setForm({ ...form, nameEn: event.target.value })
              }
            />
          </label>
          {error && (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
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
                : office
                  ? t("admin.saveChanges")
                  : t("admin.addOffice")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OfficeModal;
