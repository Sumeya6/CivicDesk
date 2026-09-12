export const STATUS_CONFIG = {
  PENDING: { label: "Pending", className: "bg-gray-100 text-gray-700" },
  ASSIGNED: { label: "Assigned", className: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "In Progress", className: "bg-yellow-100 text-yellow-700" },
  AWAITING_PURCHASE: { label: "Awaiting Purchase", className: "bg-purple-100 text-purple-700" },
  RESOLVED: { label: "Resolved", className: "bg-green-100 text-green-700" },
  CLOSED: { label: "Closed", className: "bg-gray-200 text-gray-500" },
};

export const PRIORITY_CONFIG = {
  LOW: { label: "Low", className: "bg-gray-100 text-gray-600" },
  MEDIUM: { label: "Medium", className: "bg-yellow-100 text-yellow-700" },
  HIGH: { label: "High", className: "bg-orange-100 text-orange-700" },
  CRITICAL: { label: "Critical", className: "bg-red-100 text-red-700" },
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
