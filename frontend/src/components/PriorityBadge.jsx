import { useTranslation } from "react-i18next";

const priorityStyles = {
  LOW: "bg-slate-50 text-slate-700 ring-slate-600/20",
  MEDIUM: "bg-sky-50 text-sky-700 ring-sky-600/20",
  HIGH: "bg-amber-50 text-amber-700 ring-amber-600/20",
  CRITICAL: "bg-red-50 text-red-700 ring-red-600/20",
};

export default function PriorityBadge({ priority }) {
  const { t } = useTranslation();

  if (!priority) return <span className="text-gray-400">-</span>;

  const styles =
    priorityStyles[priority] || "bg-gray-50 text-gray-600 ring-gray-500/20";
  const label = t(`priority.${priority.toLowerCase()}`, priority);

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles}`}
    >
      {label}
    </span>
  );
}
