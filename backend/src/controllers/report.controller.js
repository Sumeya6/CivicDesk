const { prisma } = require("../config/db");

async function getSummary(req, res, next) {
  try {
    const { period = "1m" } = req.query;

    const allowedPeriods = {
      "1m": 1,
      "3m": 3,
      "6m": 6,
      "9m": 9,
      "1y": 12,
    };

    const months = allowedPeriods[period];

    if (!months) {
      return res.status(400).json({
        message: "Invalid period. Use 1m, 3m, 6m, 9m, or 1y.",
      });
    }

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const where = {
      createdAt: {
        gte: startDate,
      },
    };

    // Get all tickets in the selected period
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        office: true,
        category: true,
        technician: true,
      },
    });

    // Status counts
    const total = tickets.length;

    const pending = tickets.filter(
      (ticket) => ticket.status === "PENDING",
    ).length;

    const inProgress = tickets.filter(
      (ticket) => ticket.status === "IN_PROGRESS",
    ).length;

    const awaitingPurchase = tickets.filter(
      (ticket) => ticket.status === "AWAITING_PURCHASE",
    ).length;

    const resolved = tickets.filter(
      (ticket) => ticket.status === "RESOLVED",
    ).length;

    const closed = tickets.filter(
      (ticket) => ticket.status === "CLOSED",
    ).length;

    // Requests by office
    const officeMap = {};

    for (const ticket of tickets) {
      if (!ticket.office) continue;

      const officeId = ticket.office.id;

      if (!officeMap[officeId]) {
        officeMap[officeId] = {
          officeId,
          office: ticket.office.nameEn || ticket.office.nameAm,
          count: 0,
        };
      }

      officeMap[officeId].count++;
    }

    const requestsByOffice = Object.values(officeMap);

    // Requests by category
    const categoryMap = {};

    for (const ticket of tickets) {
      if (!ticket.category) continue;

      const categoryId = ticket.category.id;

      if (!categoryMap[categoryId]) {
        categoryMap[categoryId] = {
          categoryId,
          category: ticket.category.nameEn || ticket.category.nameAm,
          count: 0,
        };
      }

      categoryMap[categoryId].count++;
    }

    const requestsByCategory = Object.values(categoryMap);

    // Technician workload
    const technicianMap = {};

    for (const ticket of tickets) {
      if (!ticket.technician) continue;

      const technicianId = ticket.technician.id;

      if (!technicianMap[technicianId]) {
        technicianMap[technicianId] = {
          technicianId,
          technician:
            ticket.technician.fullName ||
            ticket.technician.name ||
            ticket.technician.email,
          count: 0,
        };
      }

      technicianMap[technicianId].count++;
    }

    const technicianWorkload = Object.values(technicianMap);

    // Resolution time
    const resolvedTickets = tickets.filter(
      (ticket) =>
        (ticket.status === "RESOLVED" || ticket.status === "CLOSED") &&
        ticket.resolvedAt,
    );

    let averageResolutionTimeHours = 0;

    if (resolvedTickets.length > 0) {
      const totalResolutionHours = resolvedTickets.reduce((sum, ticket) => {
        const created = new Date(ticket.createdAt);
        const resolvedDate = new Date(ticket.resolvedAt);

        const hours = (resolvedDate - created) / (1000 * 60 * 60);

        return sum + hours;
      }, 0);

      averageResolutionTimeHours =
        totalResolutionHours / resolvedTickets.length;
    }

    // SLA percentage
    let slaPercentage = 0;

    const ticketsWithSla = tickets.filter((ticket) => ticket.resolvedAt);

    if (ticketsWithSla.length > 0) {
      const slaMet = ticketsWithSla.filter((ticket) => {
        const created = new Date(ticket.createdAt);
        const resolvedDate = new Date(ticket.resolvedAt);

        const resolutionHours = (resolvedDate - created) / (1000 * 60 * 60);

        // 24-hour SLA target
        return resolutionHours <= 24;
      }).length;

      slaPercentage = (slaMet / ticketsWithSla.length) * 100;
    }

    // Satisfaction rating
    // Satisfaction rating
    const ticketsWithRating = tickets.filter(
      (ticket) => ticket.rating !== null && ticket.rating !== undefined,
    );

    let averageSatisfactionRating = 0;

    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    if (ticketsWithRating.length > 0) {
      const totalRating = ticketsWithRating.reduce(
        (sum, ticket) => sum + Number(ticket.rating),
        0,
      );

      averageSatisfactionRating = totalRating / ticketsWithRating.length;

      for (const ticket of ticketsWithRating) {
        const rating = Number(ticket.rating);

        if (rating >= 1 && rating <= 5) {
          ratingDistribution[rating]++;
        }
      }
    }
    return res.status(200).json({
      period,
      startDate,

      total,
      pending,
      inProgress,
      awaitingPurchase,
      resolved,
      closed,

      requestsByOffice,
      requestsByCategory,

      technicianWorkload,

      slaPercentage: Number(slaPercentage.toFixed(2)),

      averageResolutionTimeHours: Number(averageResolutionTimeHours.toFixed(2)),

      averageSatisfactionRating: Number(averageSatisfactionRating.toFixed(2)),

      ratingDistribution,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getSummary,
};
