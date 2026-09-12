import { useTranslation } from "react-i18next";

const statusStyles = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  ASSIGNED: "bg-blue-50 text-blue-700 ring-blue-600/20",
  IN_PROGRESS: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  AWAITING_PURCHASE: "bg-orange-50 text-orange-700 ring-orange-600/20",
  RESOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  CLOSED: "bg-gray-50 text-gray-600 ring-gray-500/20",
};

export default function StatusBadge({ status }) {
  const { t } = useTranslation();

  if (!status) return <span className="text-gray-400">-</span>;

  const styles = statusStyles[status] || "bg-gray-50 text-gray-600 ring-gray-500/20";
  const label = t(`status.${status.toLowerCase()}`, status);

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles}`}
    >
      {label}
    </span>
  );
}
