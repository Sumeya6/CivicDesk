export const STATUS_CONFIG = {
  PENDING: { label: "Pending", className: "civic-badge civic-badge-pending" },
  ASSIGNED: { label: "Assigned", className: "civic-badge civic-badge-assigned" },
  IN_PROGRESS: { label: "In Progress", className: "civic-badge civic-badge-in-progress" },
  AWAITING_PURCHASE: { label: "Awaiting Purchase", className: "civic-badge civic-badge-awaiting-purchase" },
  RESOLVED: { label: "Resolved", className: "civic-badge civic-badge-resolved" },
  CLOSED: { label: "Closed", className: "civic-badge civic-badge-closed" },
};

export const PRIORITY_CONFIG = {
  LOW: { label: "Low", className: "civic-badge civic-badge-low" },
  MEDIUM: { label: "Medium", className: "civic-badge civic-badge-medium" },
  HIGH: { label: "High", className: "civic-badge civic-badge-high" },
  CRITICAL: { label: "Critical", className: "civic-badge civic-badge-critical" },
};

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
