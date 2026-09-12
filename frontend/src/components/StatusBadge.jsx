import { useTranslation } from "react-i18next";

const statusBadgeClass = {
  PENDING: "civic-badge civic-badge-pending",
  ASSIGNED: "civic-badge civic-badge-assigned",
  IN_PROGRESS: "civic-badge civic-badge-in-progress",
  AWAITING_PURCHASE: "civic-badge civic-badge-awaiting-purchase",
  RESOLVED: "civic-badge civic-badge-resolved",
  CLOSED: "civic-badge civic-badge-closed",
};

export default function StatusBadge({ status }) {
  const { t } = useTranslation();

  if (!status) return <span style={{ color: "#94a3b8" }}>-</span>;

  const cls = statusBadgeClass[status] || "civic-badge civic-badge-closed";
  const label = t(`status.${status.toLowerCase()}`, status);

  return <span className={cls}>{label}</span>;
}
