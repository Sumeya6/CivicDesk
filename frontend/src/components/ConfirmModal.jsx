import { AlertTriangle, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Modal } from "./Modal";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = "danger",
  loading = false,
}) {
  if (!isOpen) return null;
  const { t } = useTranslation();

  const isDanger = variant === "danger";
  const confirmIcon = isDanger ? AlertTriangle : Check;

  const modalTitle = title || t("confirmModal.title");
  const modalMessage = message || t("confirmModal.message");
  const confirmLabel = confirmText || (isDanger ? t("confirmModal.deleteConfirm") : t("confirmModal.confirm"));
  const cancelLabel = cancelText || t("confirmModal.cancel");
  const processingText = t("confirmModal.processing");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="max-w-md">
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              isDanger ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
            }`}
            aria-hidden="true"
          >
            <confirmIcon size={20} />
          </div>
          <p className="text-sm text-slate-700 pt-0.5">{modalMessage}</p>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="button-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`button-primary ${isDanger ? "bg-red-600 hover:bg-red-700" : ""}`}
          >
            {loading ? processingText : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}