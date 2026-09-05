function calculateResolutionHours(createdAt, resolvedAt = new Date()) {
  const createdTime = new Date(createdAt).getTime();
  const resolvedTime = new Date(resolvedAt).getTime();

  if (Number.isNaN(createdTime) || Number.isNaN(resolvedTime)) {
    return 0;
  }

  const diffMs = Math.max(0, resolvedTime - createdTime);
  return diffMs / (1000 * 60 * 60);
}

function isSlaExceeded(createdAt, resolvedAt, expectedResolutionHours) {
  if (!Number.isFinite(expectedResolutionHours) || expectedResolutionHours < 0) {
    return false;
  }

  return (
    calculateResolutionHours(createdAt, resolvedAt) > Number(expectedResolutionHours)
  );
}

function normalizeJustification(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

module.exports = {
  calculateResolutionHours,
  isSlaExceeded,
  normalizeJustification,
};
