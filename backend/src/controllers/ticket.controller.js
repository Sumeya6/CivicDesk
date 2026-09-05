const { prisma } = require("../config/db");
const { Priority, Role, TicketStatus } = require("@prisma/client");
const { assignTechnicianToTicket } = require("../services/assignment.service");
const { createAuditEntry } = require("../utils/audit.util");

const priorities = Object.values(Priority);
const statuses = Object.values(TicketStatus);

function error(message, statusCode = 400) {
  const result = new Error(message);
  result.statusCode = statusCode;
  return result;
}

function authorize(req, roles) {
  if (!req.user || !roles.includes(req.user.role))
    throw error("You are not authorized for this action.", 403);
}

async function createTicket(req, res, next) {
  try {
    authorize(req, [Role.EMPLOYEE, Role.ADMIN]);
    const { title, description, categoryId, deviceOrSystem, priority } =
      req.body;
    if (!title?.trim() || !description?.trim() || !categoryId)
      throw error("Title, description, and category are required.", 422);
    if (priority !== undefined && !priorities.includes(priority))
      throw error("Invalid priority.", 422);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { officeId: true },
    });
    if (!user?.officeId)
      throw error("The employee must belong to an office.", 422);
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, isActive: true },
    });
    if (!category?.isActive)
      throw error("Category not found or inactive.", 422);

    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          categoryId,
          deviceOrSystem: deviceOrSystem?.trim() || null,
          priority: priority || Priority.MEDIUM,
          employeeId: req.user.id,
          officeId: user.officeId,
        },
      });
      await createAuditEntry({
        ticketId: created.id,
        actor: req.user.id,
        action: "CREATED",
        newValue: created.status,
        tx,
      });
      return assignTechnicianToTicket(created.id, user.officeId, tx);
    });
    return res
      .status(201)
      .json({ message: "Ticket created successfully.", ticket });
  } catch (requestError) {
    return next(requestError);
  }
}

async function assignTicket(req, res, next) {
  try {
    authorize(req, [Role.ADMIN]);
    const { technicianId, priority } = req.body;
    if (!technicianId && priority === undefined)
      throw error("Technician or priority is required.", 422);
    if (priority !== undefined && !priorities.includes(priority))
      throw error("Invalid priority.", 422);
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
    });
    if (!ticket) throw error("Ticket not found.", 404);
    const technician = technicianId
      ? await prisma.user.findFirst({
          where: {
            id: technicianId,
            role: Role.TECHNICIAN,
            isActive: true,
            technicianOffices: { some: { officeId: ticket.officeId } },
          },
        })
      : null;
    if (technicianId && !technician)
      throw error(
        "Technician is not active or is not mapped to this office.",
        422,
      );

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          ...(technicianId && { technicianId }),
          ...(priority !== undefined && { priority }),
        },
      });
      if (technicianId && technicianId !== ticket.technicianId)
        await createAuditEntry({
          ticketId: ticket.id,
          actor: req.user.id,
          action: "MANUAL_ASSIGNED",
          previousValue: ticket.technicianId,
          newValue: technicianId,
          tx,
        });
      if (priority !== undefined && priority !== ticket.priority)
        await createAuditEntry({
          ticketId: ticket.id,
          actor: req.user.id,
          action: "PRIORITY_CHANGED",
          previousValue: ticket.priority,
          newValue: priority,
          tx,
        });
      return result;
    });
    return res
      .status(200)
      .json({ message: "Ticket assignment updated.", ticket: updated });
  } catch (requestError) {
    return next(requestError);
  }
}

async function requestPurchase(req, res, next) {
  try {
    authorize(req, [Role.TECHNICIAN, Role.ADMIN]);
    const { purchaseDetails } = req.body;
    if (!purchaseDetails?.trim())
      throw error("Purchase details are required.", 422);
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
    });
    if (!ticket) throw error("Ticket not found.", 404);
    if (
      req.user.role === Role.TECHNICIAN &&
      ticket.technicianId !== req.user.id
    )
      throw error("Only the assigned technician can request a purchase.", 403);
    if (ticket.status !== TicketStatus.IN_PROGRESS)
      throw error("Only in-progress tickets can request a purchase.", 422);
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          status: TicketStatus.AWAITING_PURCHASE,
          requiresPurchase: true,
          purchaseDetails: purchaseDetails.trim(),
        },
      });
      await createAuditEntry({
        ticketId: ticket.id,
        actor: req.user.id,
        action: "AWAITING_PURCHASE",
        previousValue: ticket.status,
        newValue: purchaseDetails.trim(),
        tx,
      });
      return result;
    });
    return res.status(200).json({
      message: "Ticket marked as awaiting purchase.",
      ticket: updated,
    });
  } catch (requestError) {
    return next(requestError);
  }
}

async function verifyTicket(req, res, next) {
  try {
    authorize(req, [Role.EMPLOYEE]);
    const { isApproved, rating, feedback } = req.body;
    if (typeof isApproved !== "boolean")
      throw error("isApproved must be true or false.", 422);
    if (isApproved && (!Number.isInteger(rating) || rating < 1 || rating > 5))
      throw error("A 1-5 rating is required when approving a ticket.", 422);
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
    });
    if (!ticket) throw error("Ticket not found.", 404);
    if (ticket.employeeId !== req.user.id)
      throw error("Only the ticket owner can verify this ticket.", 403);
    if (ticket.status !== TicketStatus.RESOLVED)
      throw error("Only resolved tickets can be verified.", 422);
    if (isApproved && ticket.slaExceeded && !ticket.slaJustification?.trim())
      throw error(
        "SLA justification is required before closing an overdue ticket.",
        422,
      );
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          isApproved,
          rating: isApproved ? rating : null,
          feedback: feedback?.trim() || null,
          status: isApproved ? TicketStatus.CLOSED : TicketStatus.IN_PROGRESS,
          closedAt: isApproved ? new Date() : null,
        },
      });
      await createAuditEntry({
        ticketId: ticket.id,
        actor: req.user.id,
        action: isApproved ? "VERIFIED" : "REOPENED",
        previousValue: ticket.status,
        newValue: result.status,
        tx,
      });
      return result;
    });
    return res.status(200).json({
      message: isApproved ? "Ticket closed successfully." : "Ticket reopened.",
      ticket: updated,
    });
  } catch (requestError) {
    return next(requestError);
  }
}

async function updateStatus(req, res, next) {
  try {
    authorize(req, [Role.TECHNICIAN, Role.ADMIN]);
    const { status } = req.body;
    if (
      !statuses.includes(status) ||
      [
        TicketStatus.RESOLVED,
        TicketStatus.CLOSED,
        TicketStatus.AWAITING_PURCHASE,
      ].includes(status)
    )
      throw error(
        "Use the dedicated workflow endpoint for this ticket status.",
        422,
      );
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
    });
    if (!ticket) throw error("Ticket not found.", 404);
    if (
      req.user.role === Role.TECHNICIAN &&
      ticket.technicianId !== req.user.id
    )
      throw error("Only the assigned technician can update this ticket.", 403);
    const allowedNextStatuses = {
      [TicketStatus.PENDING]: [
        TicketStatus.PENDING,
        TicketStatus.ASSIGNED,
        TicketStatus.IN_PROGRESS,
      ],
      [TicketStatus.ASSIGNED]: [
        TicketStatus.ASSIGNED,
        TicketStatus.IN_PROGRESS,
      ],
      [TicketStatus.IN_PROGRESS]: [TicketStatus.IN_PROGRESS],
      [TicketStatus.AWAITING_PURCHASE]: [
        TicketStatus.AWAITING_PURCHASE,
        TicketStatus.IN_PROGRESS,
      ],
      [TicketStatus.RESOLVED]: [TicketStatus.RESOLVED],
      [TicketStatus.CLOSED]: [TicketStatus.CLOSED],
    };
    if (!allowedNextStatuses[ticket.status]?.includes(status))
      throw error("Invalid ticket status transition.", 422);
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.ticket.update({
        where: { id: ticket.id },
        data: { status },
      });
      await createAuditEntry({
        ticketId: ticket.id,
        actor: req.user.id,
        action: "STATUS_CHANGED",
        previousValue: ticket.status,
        newValue: status,
        tx,
      });
      return result;
    });
    return res
      .status(200)
      .json({ message: "Ticket status updated.", ticket: updated });
  } catch (requestError) {
    return next(requestError);
  }
}

async function getTicket(req, res, next) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        maintenanceNote: true,
        auditLogs: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!ticket) throw error("Ticket not found.", 404);
    if (req.user.role === Role.EMPLOYEE && ticket.employeeId !== req.user.id)
      throw error("You are not authorized to view this ticket.", 403);
    if (
      req.user.role === Role.TECHNICIAN &&
      ticket.technicianId !== req.user.id
    )
      throw error("You are not authorized to view this ticket.", 403);
    return res.status(200).json({ ticket });
  } catch (requestError) {
    return next(requestError);
  }
}

module.exports = {
  createTicket,
  assignTicket,
  requestPurchase,
  verifyTicket,
  updateStatus,
  getTicket,
};
