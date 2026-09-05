const { TicketStatus, Priority, Role } = require("@prisma/client");

const { prisma } = require("../config/db");
const logger = require("../config/logger");
const { createAuditEntry } = require("../utils/audit.util");

/** Ticket statuses that contribute to a technician's active workload. */
const ACTIVE_TICKET_STATUSES = [TicketStatus.PENDING, TicketStatus.IN_PROGRESS];

/**
 * Finds the active technician mapped to an office with the lowest active
 * ticket workload. Ties are broken by least-recent assignment, then UUID.
 *
 * @param {string} officeId
 * @param {import("@prisma/client").Prisma.TransactionClient | typeof prisma} [tx]
 * @returns {Promise<string | null>} Selected technician ID, or null when none are mapped.
 */
async function findLeastBusyTechnician(officeId, tx = prisma) {
  const mappings = await tx.technicianOffice.findMany({
    where: { officeId },
    select: {
      technician: {
        select: {
          id: true,
          isActive: true,
          role: true,
          createdAt: true,
        },
      },
    },
  });

  const technicians = mappings
    .map((mapping) => mapping.technician)
    .filter(
      (technician) =>
        technician.isActive && technician.role === Role.TECHNICIAN,
    );

  if (technicians.length === 0) {
    return null;
  }

  const technicianIds = technicians.map((technician) => technician.id);

  const [activeCounts, lastAssignments] = await Promise.all([
    tx.ticket.groupBy({
      by: ["technicianId"],
      where: {
        technicianId: { in: technicianIds },
        status: { in: ACTIVE_TICKET_STATUSES },
      },
      _count: { id: true },
    }),
    tx.ticket.groupBy({
      by: ["technicianId"],
      where: {
        technicianId: { in: technicianIds },
      },
      _max: { updatedAt: true },
    }),
  ]);

  const activeCountByTechnician = new Map(
    activeCounts.map((row) => [row.technicianId, row._count.id]),
  );

  const lastAssignedAtByTechnician = new Map(
    lastAssignments.map((row) => [row.technicianId, row._max.updatedAt]),
  );

  const rankedTechnicians = technicians
    .map((technician) => ({
      id: technician.id,
      activeCount: activeCountByTechnician.get(technician.id) ?? 0,
      lastAssignedAt: lastAssignedAtByTechnician.get(technician.id) ?? null,
      createdAt: technician.createdAt,
    }))
    .sort((left, right) => {
      if (left.activeCount !== right.activeCount) {
        return left.activeCount - right.activeCount;
      }

      if (left.lastAssignedAt === null && right.lastAssignedAt === null) {
        return left.id.localeCompare(right.id);
      }

      if (left.lastAssignedAt === null) {
        return -1;
      }

      if (right.lastAssignedAt === null) {
        return 1;
      }

      const assignmentDelta =
        left.lastAssignedAt.getTime() - right.lastAssignedAt.getTime();

      if (assignmentDelta !== 0) {
        return assignmentDelta;
      }

      return left.id.localeCompare(right.id);
    });

  return rankedTechnicians[0].id;
}

/**
 * Auto-assigns a ticket to the least-busy technician for the given office.
 * When no technician is available, the ticket is returned unchanged so an
 * admin can assign it manually.
 *
 * @param {string} ticketId
 * @param {string} officeId
 * @param {import("@prisma/client").Prisma.TransactionClient | typeof prisma} [tx]
 * @returns {Promise<import("@prisma/client").Ticket>}
 */
async function assignTechnicianToTicket(ticketId, officeId, tx = prisma) {
  const existingTicket = await tx.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!existingTicket) {
    const error = new Error("Ticket not found.");
    error.statusCode = 404;
    throw error;
  }

  const technicianId = await findLeastBusyTechnician(officeId, tx);

  if (!technicianId) {
    logger.warn(
      "No active technicians mapped to office; ticket remains unassigned.",
      { ticketId, officeId },
    );
    return existingTicket;
  }

  const updatedTicket = await tx.ticket.update({
    where: { id: ticketId },
    data: {
      technicianId,
      ...(existingTicket.priority == null && { priority: Priority.MEDIUM }),
    },
  });

  await createAuditEntry({
    ticketId,
    actor: "SYSTEM",
    action: "AUTO_ASSIGNED",
    previousValue: existingTicket.technicianId,
    newValue: technicianId,
    tx,
  });

  return updatedTicket;
}

module.exports = {
  findLeastBusyTechnician,
  assignTechnicianToTicket,
  ACTIVE_TICKET_STATUSES,
};
