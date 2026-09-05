const { prisma } = require("../config/db");

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function upsertMaintenanceNote(req, res, next) {
  try {
    if (!req.user || req.user.role !== "TECHNICIAN") {
      throw createHttpError("You are not authorized to perform this action.", 403);
    }

    const { id } = req.params;
    const { diagnosis, workPerformed, partsReplaced, recommendations, purchasedByOffice } =
      req.body;

    if (!diagnosis || !workPerformed) {
      throw createHttpError("diagnosis and workPerformed are required.", 422);
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, technicianId: true },
    });

    if (!ticket) {
      throw createHttpError("Ticket not found.", 404);
    }

    if (ticket.technicianId !== req.user.id) {
      throw createHttpError("Only the assigned technician can manage notes.", 403);
    }

    const note = await prisma.maintenanceNote.upsert({
      where: { ticketId: id },
      update: {
        diagnosis: diagnosis.trim(),
        workPerformed: workPerformed.trim(),
        partsReplaced: partsReplaced?.trim() || null,
        recommendations: recommendations?.trim() || null,
        purchasedByOffice: Boolean(purchasedByOffice),
      },
      create: {
        ticketId: id,
        diagnosis: diagnosis.trim(),
        workPerformed: workPerformed.trim(),
        partsReplaced: partsReplaced?.trim() || null,
        recommendations: recommendations?.trim() || null,
        purchasedByOffice: Boolean(purchasedByOffice),
      },
    });

    return res.status(200).json({
      message: "Maintenance note saved successfully.",
      maintenanceNote: note,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  upsertMaintenanceNote,
};
