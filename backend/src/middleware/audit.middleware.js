const { prisma } = require("../config/db");

function auditMiddleware(req, res, next) {
  if (!req.auditLogData) {
    return next();
  }

  res.on("finish", async () => {
    try {
      const auditEntry = req.auditLogData;
      await prisma.auditLog.create({
        data: {
          ticketId: auditEntry.ticketId,
          actorId: auditEntry.actorId,
          action: auditEntry.action,
          previousValue: auditEntry.previousValue,
          newValue: auditEntry.newValue,
        },
      });
    } catch (error) {
      // Intentionally keep audit logging lightweight and non-blocking.
      // Errors here should not break the main request flow.
    }
  });

  return next();
}

module.exports = auditMiddleware;
