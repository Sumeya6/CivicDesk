export const AUDIT_ACTION_KEYS = {
  CREATED: "created",
  TICKET_CREATED: "created",
  AUTO_ASSIGNED: "autoAssigned",
  ASSIGNED: "autoAssigned",
  MANUAL_ASSIGNED: "manualAssigned",
  PRIORITY_CHANGED: "priorityChanged",
  PRIORITY_SET: "priorityChanged",
  AWAITING_PURCHASE: "awaitingPurchase",
  STATUS_CHANGED: "statusChanged",
  STATUS_CHANGE: "statusChanged",
  RESOLVED: "resolved",
  VERIFIED: "verified",
  REOPENED: "reopened",
};

export function getAuditActorName(log, t) {
  if (log.actor?.fullName) return log.actor.fullName;
  if (log.actor?.id === "SYSTEM" || log.actorId === "SYSTEM") {
    return t("ticketDetail.systemAccount", "CivicDesk System");
  }
  return t("ticketDetail.systemFallback", "System / Unknown user");
}

export function getAuditValue(log, key, t) {
  const displayKey = `${key}DisplayValue`;
  const value = log[displayKey] ?? log[`${key}Value`];
  if (!value) return null;
  if (log.action === "MANUAL_ASSIGNED" || log.action === "AUTO_ASSIGNED" || log.action === "ASSIGNED") {
    return log[displayKey] || t("ticketDetail.systemFallback", "System / Unknown user");
  }
  return value;
}