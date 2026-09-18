const { prisma } = require("../config/db");

const SYSTEM_ACTOR_PHONE =
  process.env.SYSTEM_ACTOR_PHONE || "+251900000000";

/** @type {string | null} */
let cachedSystemActorId = null;

/**
 * Resolves the database user ID used as the actor for automated system actions.
 *
 * @param {import("@prisma/client").Prisma.TransactionClient | typeof prisma} tx
 * @returns {Promise<string>}
 */
async function resolveSystemActorId(tx) {
  if (cachedSystemActorId) {
    return cachedSystemActorId;
  }

  const systemUser = await tx.user.findUnique({
    where: { phoneNumber: SYSTEM_ACTOR_PHONE },
    select: { id: true },
  });

  if (!systemUser) {
    // Create system user on-demand if missing (e.g., fresh DB without seed)
    const bcrypt = require("bcryptjs");
    const passwordHash = await bcrypt.hash("system-generated-password", 12);
    const created = await tx.user.create({
      data: {
        fullName: "CivicDesk System",
        phoneNumber: SYSTEM_ACTOR_PHONE,
        password: passwordHash,
        role: "ADMIN",
        preferredLanguage: "EN",
        isActive: true,
      },
      select: { id: true },
    });
    cachedSystemActorId = created.id;
    return created.id;
  }

  cachedSystemActorId = systemUser.id;
  return systemUser.id;
}

/**
 * Creates an immutable audit log entry for a ticket lifecycle event.
 *
 * @param {object} params
 * @param {string} params.ticketId
 * @param {string | "SYSTEM"} params.actor - User UUID or the literal "SYSTEM"
 * @param {string} params.action
 * @param {string | null} [params.previousValue]
 * @param {string | null} [params.newValue]
 * @param {import("@prisma/client").Prisma.TransactionClient | typeof prisma} [params.tx]
 * @returns {Promise<import("@prisma/client").AuditLog>}
 */
async function createAuditEntry({
  ticketId,
  actor,
  action,
  previousValue = null,
  newValue = null,
  tx = prisma,
}) {
  const actorId =
    actor === "SYSTEM" ? await resolveSystemActorId(tx) : actor;

  return tx.auditLog.create({
    data: {
      ticketId,
      actorId,
      action,
      previousValue,
      newValue,
    },
  });
}

module.exports = {
  createAuditEntry,
  resolveSystemActorId,
};
