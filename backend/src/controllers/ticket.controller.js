const { Priority, TicketStatus } = require("@prisma/client");

const { prisma } = require("../config/db");
const { findBestTechnicianForOffice } = require("../services/assignment.service");
const {
  isSlaExceeded,
  normalizeJustification,
} = require("../services/sla.service");

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function ensureRole(req, allowedRoles) {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    throw createHttpError("You are not authorized to perform this action.", 403);
  }
}

function validatePriority(priority) {
  if (!Object.values(Priority).includes(priority)) {
    throw createHttpError(
      "Priority must be one of LOW, MEDIUM, HIGH, or CRITICAL.",
      422,
    );
  }
}

async function writeAuditLog({ ticketId, actorId, action, previousValue, newValue }) {
  await prisma.auditLog.create({
    data: {
      ticketId,
      actorId,
      action,
      previousValue,
      newValue,
    },
  });
}

async function createTicket(req, res, next) {
  try {
    ensureRole(req, ["EMPLOYEE"]);

    const { title, description, categoryId, deviceOrSystem } = req.body;

    if (!title || !description || !categoryId) {
      throw createHttpError(
        "title, description, and categoryId are required.",
        422,
      );
    }

    if (!req.user.officeId) {
      throw createHttpError("Employee must belong to an office.", 422);
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw createHttpError("Category not found.", 404);
    }

    const technicianId = await findBestTechnicianForOffice(req.user.officeId);
    const status = technicianId ? TicketStatus.ASSIGNED : TicketStatus.PENDING;

    const ticket = await prisma.ticket.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        deviceOrSystem: deviceOrSystem?.trim() || null,
        priority: Priority.MEDIUM,
        status,
        employeeId: req.user.id,
        technicianId,
        officeId: req.user.officeId,
      },
    });

    await writeAuditLog({
      ticketId: ticket.id,
      actorId: req.user.id,
      action: "TICKET_CREATED",
      previousValue: null,
      newValue: ticket.title,
    });

    await writeAuditLog({
      ticketId: ticket.id,
      actorId: req.user.id,
      action: "STATUS_CHANGED",
      previousValue: null,
      newValue: status,
    });

    if (technicianId) {
      await writeAuditLog({
        ticketId: ticket.id,
        actorId: req.user.id,
        action: "AUTO_ASSIGNED",
        previousValue: null,
        newValue: technicianId,
      });
    }

    return res.status(201).json({
      message: "Ticket created successfully.",
      ticket,
    });
  } catch (error) {
    return next(error);
  }
}

async function assignTicket(req, res, next) {
  try {
    ensureRole(req, ["ADMIN"]);

    const { id } = req.params;
    const { technicianId, priority } = req.body;

    if (!technicianId && !priority) {
      throw createHttpError("technicianId or priority must be provided.", 422);
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: {
        id: true,
        officeId: true,
        technicianId: true,
        priority: true,
        status: true,
      },
    });

    if (!ticket) {
      throw createHttpError("Ticket not found.", 404);
    }

    const updates = {};

    if (priority) {
      validatePriority(priority);
      updates.priority = priority;
    }

    if (technicianId) {
      const technician = await prisma.user.findUnique({
        where: { id: technicianId },
        select: { id: true, role: true, isActive: true },
      });

      if (!technician || technician.role !== "TECHNICIAN" || !technician.isActive) {
        throw createHttpError("Technician not found or inactive.", 422);
      }

      const officeMapping = await prisma.technicianOffice.findFirst({
        where: {
          technicianId,
          officeId: ticket.officeId,
        },
      });

      if (!officeMapping) {
        throw createHttpError(
          "Technician is not mapped to the ticket office.",
          422,
        );
      }

      updates.technicianId = technicianId;
      if (ticket.status === TicketStatus.PENDING) {
        updates.status = TicketStatus.ASSIGNED;
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: updates,
    });

    if (technicianId && ticket.technicianId !== technicianId) {
      await writeAuditLog({
        ticketId: ticket.id,
        actorId: req.user.id,
        action: "MANUAL_REASSIGN",
        previousValue: ticket.technicianId,
        newValue: technicianId,
      });
    }

    if (priority && ticket.priority !== priority) {
      await writeAuditLog({
        ticketId: ticket.id,
        actorId: req.user.id,
        action: "PRIORITY_CHANGED",
        previousValue: ticket.priority,
        newValue: priority,
      });
    }

    if (updates.status && ticket.status !== updates.status) {
      await writeAuditLog({
        ticketId: ticket.id,
        actorId: req.user.id,
        action: "STATUS_CHANGED",
        previousValue: ticket.status,
        newValue: updates.status,
      });
    }

    return res.status(200).json({
      message: "Ticket assignment updated successfully.",
      ticket: updatedTicket,
    });
  } catch (error) {
    return next(error);
  }
}

async function requestPurchase(req, res, next) {
  try {
    ensureRole(req, ["TECHNICIAN"]);

    const { id } = req.params;
    const purchaseDetails = req.body.purchaseDetails?.trim();

    if (!purchaseDetails) {
      throw createHttpError("purchaseDetails is required.", 422);
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: {
        id: true,
        technicianId: true,
        status: true,
      },
    });

    if (!ticket) {
      throw createHttpError("Ticket not found.", 404);
    }

    if (ticket.technicianId !== req.user.id) {
      throw createHttpError("Only the assigned technician can request purchase.", 403);
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        requiresPurchase: true,
        purchaseDetails,
        status: TicketStatus.AWAITING_PURCHASE,
      },
    });

    await writeAuditLog({
      ticketId: ticket.id,
      actorId: req.user.id,
      action: "PURCHASE_REQUESTED",
      previousValue: null,
      newValue: purchaseDetails,
    });

    if (ticket.status !== TicketStatus.AWAITING_PURCHASE) {
      await writeAuditLog({
        ticketId: ticket.id,
        actorId: req.user.id,
        action: "STATUS_CHANGED",
        previousValue: ticket.status,
        newValue: TicketStatus.AWAITING_PURCHASE,
      });
    }

    return res.status(200).json({
      message: "Purchase request recorded successfully.",
      ticket: updatedTicket,
    });
  } catch (error) {
    return next(error);
  }
}

async function resolveTicket(req, res, next) {
  try {
    ensureRole(req, ["TECHNICIAN"]);

    const { id } = req.params;
    const { diagnosis, workPerformed, partsReplaced, recommendations, purchasedByOffice } =
      req.body;

    if (!diagnosis || !workPerformed) {
      throw createHttpError("diagnosis and workPerformed are required.", 422);
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            expectedResolutionHours: true,
          },
        },
      },
    });

    if (!ticket) {
      throw createHttpError("Ticket not found.", 404);
    }

    if (ticket.technicianId !== req.user.id) {
      throw createHttpError("Only the assigned technician can resolve this ticket.", 403);
    }

    const resolvedAt = new Date();
    const slaExceeded = isSlaExceeded(
      ticket.createdAt,
      resolvedAt,
      ticket.category.expectedResolutionHours,
    );

    await prisma.maintenanceNote.upsert({
      where: { ticketId: ticket.id },
      update: {
        diagnosis: diagnosis.trim(),
        workPerformed: workPerformed.trim(),
        partsReplaced: partsReplaced?.trim() || null,
        recommendations: recommendations?.trim() || null,
        purchasedByOffice: Boolean(purchasedByOffice),
      },
      create: {
        ticketId: ticket.id,
        diagnosis: diagnosis.trim(),
        workPerformed: workPerformed.trim(),
        partsReplaced: partsReplaced?.trim() || null,
        recommendations: recommendations?.trim() || null,
        purchasedByOffice: Boolean(purchasedByOffice),
      },
    });

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: TicketStatus.RESOLVED,
        resolvedAt,
        slaExceeded,
      },
    });

    if (ticket.status !== TicketStatus.RESOLVED) {
      await writeAuditLog({
        ticketId: ticket.id,
        actorId: req.user.id,
        action: "STATUS_CHANGED",
        previousValue: ticket.status,
        newValue: TicketStatus.RESOLVED,
      });
    }

    await writeAuditLog({
      ticketId: ticket.id,
      actorId: req.user.id,
      action: "RESOLUTION_SUBMITTED",
      previousValue: null,
      newValue: diagnosis.trim(),
    });

    return res.status(200).json({
      message: "Ticket resolved successfully.",
      ticket: updatedTicket,
    });
  } catch (error) {
    return next(error);
  }
}

async function verifyTicket(req, res, next) {
  try {
    ensureRole(req, ["EMPLOYEE"]);

    const { id } = req.params;
    const { isApproved, rating, feedback, slaJustification } = req.body;

    if (typeof isApproved !== "boolean") {
      throw createHttpError("isApproved must be provided as a boolean.", 422);
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: {
        id: true,
        employeeId: true,
        status: true,
        isApproved: true,
        slaExceeded: true,
        slaJustification: true,
      },
    });

    if (!ticket) {
      throw createHttpError("Ticket not found.", 404);
    }

    if (ticket.employeeId !== req.user.id) {
      throw createHttpError("You can only verify your own ticket.", 403);
    }

    if (ticket.status !== TicketStatus.RESOLVED) {
      throw createHttpError("Only resolved tickets can be verified.", 422);
    }

    const justification = normalizeJustification(slaJustification);

    if (isApproved) {
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw createHttpError("rating must be an integer between 1 and 5.", 422);
      }

      if (ticket.slaExceeded && !justification && !ticket.slaJustification) {
        throw createHttpError(
          "slaJustification is required when closing an SLA-exceeded ticket.",
          400,
        );
      }

      const updatedTicket = await prisma.ticket.update({
        where: { id },
        data: {
          status: TicketStatus.CLOSED,
          isApproved: true,
          rating,
          feedback: feedback?.trim() || null,
          slaJustification: justification || ticket.slaJustification,
          closedAt: new Date(),
        },
      });

      await writeAuditLog({
        ticketId: ticket.id,
        actorId: req.user.id,
        action: "APPROVAL_DECISION",
        previousValue: String(ticket.isApproved),
        newValue: "true",
      });

      await writeAuditLog({
        ticketId: ticket.id,
        actorId: req.user.id,
        action: "STATUS_CHANGED",
        previousValue: ticket.status,
        newValue: TicketStatus.CLOSED,
      });

      return res.status(200).json({
        message: "Ticket closed successfully.",
        ticket: updatedTicket,
      });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: TicketStatus.IN_PROGRESS,
        isApproved: false,
      },
    });

    await writeAuditLog({
      ticketId: ticket.id,
      actorId: req.user.id,
      action: "APPROVAL_DECISION",
      previousValue: String(ticket.isApproved),
      newValue: "false",
    });

    await writeAuditLog({
      ticketId: ticket.id,
      actorId: req.user.id,
      action: "STATUS_CHANGED",
      previousValue: ticket.status,
      newValue: TicketStatus.IN_PROGRESS,
    });

    return res.status(200).json({
      message: "Ticket has been reopened for more work.",
      ticket: updatedTicket,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createTicket,
  assignTicket,
  requestPurchase,
  resolveTicket,
  verifyTicket,
};
