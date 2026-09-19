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
  const { t } = useTranslation();

  if (!isOpen) return null;

  const isDanger = variant === "danger";
  const ConfirmIcon = isDanger ? AlertTriangle : Check;

  const modalTitle = title || t("confirmModal.title");
  const modalMessage = message || t("confirmModal.message");
  const confirmLabel = confirmText || (isDanger ? t("confirmModal.deleteConfirm") : t("confirmModal.confirm"));
  const cancelLabel = cancelText || t("confirmModal.cancel");
  const processingText = t("confirmModal.processing");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="max-w-md">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <div
            className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-full ${
              isDanger ? "bg-[var(--civic-error-bg)] text-[var(--civic-error)]" : "bg-[var(--civic-success-bg)] text-[var(--civic-success)]"
            }`}
            aria-hidden="true"
          >
            <ConfirmIcon size={20} />
          </div>
          <p className="text-[var(--civic-font-size-base)] text-[var(--civic-text)] pt-2">{modalMessage}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--civic-border)] pt-4">
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
            className={`button-primary ${isDanger ? "!bg-[var(--civic-error)] hover:!bg-[#9c1e14] !border-[var(--civic-error)]" : ""}`}
          >
            {loading ? processingText : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
