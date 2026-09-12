const { prisma } = require("../config/db");
const { TicketStatus } = require("@prisma/client");
const { createAuditEntry } = require("../utils/audit.util");
const {
  requireSlaJustification,
  calculateSla,
} = require("../services/sla.service");

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function resolveTicket(req, res, next) {
  try {
    const {
      diagnosis,
      workPerformed,
      partsReplaced,
      recommendations,
      purchasedByOffice = false,
      slaJustification,
    } = req.body;
    if (!diagnosis?.trim() || !workPerformed?.trim()) {
      throw createError("Diagnosis and work performed are required.", 422);
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: { category: true, maintenanceNote: true },
    });
    if (!ticket) throw createError("Ticket not found.", 404);
    if (ticket.technicianId !== req.user.id && req.user.role !== "ADMIN") {
      throw createError(
        "Only the assigned technician can resolve this ticket.",
        403,
      );
    }
    if (
      ticket.status !== TicketStatus.IN_PROGRESS &&
      ticket.status !== TicketStatus.AWAITING_PURCHASE
    ) {
      throw createError(
        "Only an in-progress or procurement-paused ticket can be resolved.",
        422,
      );
    }

    const sla = calculateSla({ ...ticket, slaJustification }, new Date());
    if (
      sla.exceeded &&
      !slaJustification?.trim() &&
      !ticket.slaJustification?.trim()
    ) {
      requireSlaJustification({ ...ticket, slaJustification }, new Date());
    }

    const resolved = await prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          status: TicketStatus.RESOLVED,
          resolvedAt: new Date(),
          slaExceeded: sla.exceeded,
          ...(slaJustification !== undefined && {
            slaJustification: slaJustification.trim() || null,
          }),
          maintenanceNote: {
            upsert: {
              create: {
                diagnosis: diagnosis.trim(),
                workPerformed: workPerformed.trim(),
                partsReplaced: partsReplaced?.trim() || null,
                recommendations: recommendations?.trim() || null,
                purchasedByOffice: Boolean(purchasedByOffice),
              },
              update: {
                diagnosis: diagnosis.trim(),
                workPerformed: workPerformed.trim(),
                partsReplaced: partsReplaced?.trim() || null,
                recommendations: recommendations?.trim() || null,
                purchasedByOffice: Boolean(purchasedByOffice),
              },
            },
          },
        },
        include: { maintenanceNote: true },
      });
      await createAuditEntry({
        ticketId: ticket.id,
        actor: req.user.id,
        action: "RESOLVED",
        previousValue: ticket.status,
        newValue: TicketStatus.RESOLVED,
        tx,
      });
      return updated;
    });

    return res
      .status(200)
      .json({ message: "Ticket resolved successfully.", ticket: resolved });
  } catch (error) {
    return next(error);
  }
}

module.exports = { resolveTicket };
