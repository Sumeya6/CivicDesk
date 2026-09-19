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
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded p-0.5 font-bold opacity-70 transition hover:opacity-100"
          aria-label="Dismiss"
        >
          &times;
        </button>
      )}
    </div>
  );
}
