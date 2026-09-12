import { useTranslation } from "react-i18next";

const priorityBadgeClass = {
  LOW: "civic-badge civic-badge-low",
  MEDIUM: "civic-badge civic-badge-medium",
  HIGH: "civic-badge civic-badge-high",
  CRITICAL: "civic-badge civic-badge-critical",
};

export default function PriorityBadge({ priority }) {
  const { t } = useTranslation();

  if (!priority) return <span style={{ color: "#94a3b8" }}>-</span>;

  const cls = priorityBadgeClass[priority] || "civic-badge civic-badge-closed";
  const label = t(`priority.${priority.toLowerCase()}`, priority);

  return <span className={cls}>{label}</span>;
}
