/**
 * Calculates whether a ticket has exceeded the resolution window configured
 * on its category.
 *
 * @param {{ createdAt: Date, category: { expectedResolutionHours: number } }} ticket
 * @param {Date} [at]
 * @returns {{ exceeded: boolean, elapsedHours: number, expectedHours: number }}
 */
function calculateSla(ticket, at = new Date()) {
  const expectedHours = Number(ticket.category.expectedResolutionHours);
  const elapsedHours =
    (at.getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60);

  return {
    exceeded: elapsedHours > expectedHours,
    elapsedHours,
    expectedHours,
  };
}

function requireSlaJustification(ticket, at = new Date()) {
  const result = calculateSla(ticket, at);

  if (result.exceeded && !ticket.slaJustification?.trim()) {
    const error = new Error(
      "SLA justification is required before resolving an overdue ticket.",
    );
    error.statusCode = 422;
    error.code = "SLA_JUSTIFICATION_REQUIRED";
    throw error;
  }

  return result;
}

module.exports = {
  calculateSla,
  requireSlaJustification,
};
