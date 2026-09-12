import { AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";

const variants = {
  error: { Icon: AlertCircle, className: "civic-alert civic-alert-error" },
  success: { Icon: CheckCircle, className: "civic-alert civic-alert-success" },
  warning: { Icon: AlertTriangle, className: "civic-alert civic-alert-warning" },
  info: { Icon: Info, className: "civic-alert civic-alert-info" },
};

export default function Alert({ type = "error", message, onClose }) {
  if (!message) return null;
  const { Icon, className } = variants[type] || variants.error;

  return (
    <div className={className} role="alert">
      <Icon style={{ marginTop: 2, flexShrink: 0, width: 16, height: 16 }} />
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button type="button" onClick={onClose} style={{ fontWeight: 700, opacity: 0.7, cursor: "pointer", background: "none", border: 0, padding: 0 }} aria-label="Dismiss">
          &times;
        </button>
      )}
    </div>
  );
}
