import { AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";

const variants = {
  error: { Icon: AlertCircle, className: "border-red-200 bg-red-50 text-red-800" },
  success: { Icon: CheckCircle, className: "border-green-200 bg-green-50 text-green-800" },
  warning: { Icon: AlertTriangle, className: "border-yellow-200 bg-yellow-50 text-yellow-800" },
  info: { Icon: Info, className: "border-blue-200 bg-blue-50 text-blue-800" },
};

export default function Alert({ type = "error", message, onClose }) {
  if (!message) return null;
  const { Icon, className } = variants[type] || variants.error;

  return (
    <div className={`flex items-start gap-2 rounded-md border p-3 text-sm ${className}`} role="alert">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button type="button" onClick={onClose} className="font-bold opacity-70 hover:opacity-100" aria-label="Dismiss">
          &times;
        </button>
      )}
    </div>
  );
}
