const MS_PER_HOUR = 1000 * 60 * 60;
const MS_PER_MINUTE = 1000 * 60;

/**
 * Calculate the SLA deadline date from ticket creation time and expected hours.
 */
export function calculateSlaDeadline(createdAt, expectedHours) {
  if (!createdAt || !expectedHours) return null;
  return new Date(new Date(createdAt).getTime() + expectedHours * MS_PER_HOUR);
}

/**
 * Determine SLA urgency status.
 * Returns: 'on-track' | 'at-risk' | 'overdue' | 'resolved'
 *
 * "at-risk" = less than 25% of SLA time remaining.
 */
export function getSlaStatus(createdAt, expectedHours, resolvedAt) {
  if (resolvedAt) return "resolved";
  if (!createdAt || !expectedHours) return "on-track";

  const now = Date.now();
  const created = new Date(createdAt).getTime();
  const deadline = created + expectedHours * MS_PER_HOUR;
  const totalMs = expectedHours * MS_PER_HOUR;
  const remainingMs = deadline - now;

  if (remainingMs <= 0) return "overdue";
  if (remainingMs < totalMs * 0.25) return "at-risk";
  return "on-track";
}

/**
 * Format SLA countdown as a human-readable string.
 * Examples: "6h 23m remaining", "2h overdue", "Resolved"
 */
export function formatSlaCountdown(createdAt, expectedHours, resolvedAt) {
  if (resolvedAt) return null;
  if (!createdAt || !expectedHours) return null;

  const now = Date.now();
  const created = new Date(createdAt).getTime();
  const deadline = created + expectedHours * MS_PER_HOUR;
  const diffMs = deadline - now;

  const isOverdue = diffMs < 0;
  const absDiff = Math.abs(diffMs);

  const hours = Math.floor(absDiff / MS_PER_HOUR);
  const minutes = Math.floor((absDiff % MS_PER_HOUR) / MS_PER_MINUTE);

  if (hours > 0) {
    return isOverdue
      ? `${hours}h ${minutes}m overdue`
      : `${hours}h ${minutes}m remaining`;
  }
  return isOverdue
    ? `${minutes}m overdue`
    : `${minutes}m remaining`;
}

/**
 * Get SLA percentage elapsed (0 = just created, 100 = deadline, >100 = overdue).
 */
export function getSlaPercentage(createdAt, expectedHours) {
  if (!createdAt || !expectedHours) return 0;
  const now = Date.now();
  const created = new Date(createdAt).getTime();
  const totalMs = expectedHours * MS_PER_HOUR;
  return Math.round(((now - created) / totalMs) * 100);
}

/**
 * Compute SLA info for a ticket object.
 * Expects ticket with createdAt, category.expectedResolutionHours, and optional resolvedAt.
 */
export function getTicketSlaInfo(ticket) {
  const expectedHours = ticket.category?.expectedResolutionHours;
  return {
    status: getSlaStatus(ticket.createdAt, expectedHours, ticket.resolvedAt),
    countdown: formatSlaCountdown(ticket.createdAt, expectedHours, ticket.resolvedAt),
    deadline: calculateSlaDeadline(ticket.createdAt, expectedHours),
    percentage: getSlaPercentage(ticket.createdAt, expectedHours),
    expectedHours,
  };
}
