const { prisma } = require("../config/db");
const { successResponse } = require("../utils/response");
const { TicketStatus, Priority } = require("@prisma/client");

const VALID_STATUSES = Object.values(TicketStatus);
const VALID_PRIORITIES = Object.values(Priority);

function startOfDay(dateString) {
  const d = new Date(dateString);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(dateString) {
  const d = new Date(dateString);
  d.setHours(23, 59, 59, 999);
  return d;
}

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
        success: false,
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

    // Get categories with their expected resolution hours for SLA calculation
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        expectedResolutionHours: true,
      },
    });

    const categorySlaMap = new Map(
      categories.map((c) => [c.id, c.expectedResolutionHours]),
    );

    // Parallel aggregations using Prisma
    const [
      statusCounts,
      officeCounts,
      categoryCounts,
      technicianWorkload,
      resolvedTickets,
      ticketsWithSla,
      ticketsWithRating,
      ratingDistribution,
    ] = await Promise.all([
      // Status counts
      prisma.ticket.groupBy({
        by: ["status"],
        where,
        _count: { status: true },
      }),

      // Requests by office
      prisma.ticket.groupBy({
        by: ["officeId"],
        where,
        _count: { officeId: true },
      }),

      // Requests by category
      prisma.ticket.groupBy({
        by: ["categoryId"],
        where,
        _count: { categoryId: true },
      }),

      // Technician workload
      prisma.ticket.groupBy({
        by: ["technicianId"],
        where: { ...where, technicianId: { not: null } },
        _count: { technicianId: true },
      }),

      // Resolved/closed tickets for resolution time
      prisma.ticket.findMany({
        where: {
          ...where,
          status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
          resolvedAt: { not: null },
        },
        select: { createdAt: true, resolvedAt: true },
      }),

      // Tickets with SLA (have resolvedAt)
      prisma.ticket.findMany({
        where: {
          ...where,
          resolvedAt: { not: null },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
          categoryId: true,
        },
      }),

      // Tickets with ratings
      prisma.ticket.findMany({
        where: {
          ...where,
          rating: { not: null },
        },
        select: { rating: true },
      }),

      // Rating distribution
      prisma.ticket.groupBy({
        by: ["rating"],
        where: {
          ...where,
          rating: { not: null },
        },
        _count: { rating: true },
      }),
    ]);

    // Process status counts
    const statusMap = { PENDING: 0, ASSIGNED: 0, IN_PROGRESS: 0, AWAITING_PURCHASE: 0, RESOLVED: 0, CLOSED: 0 };
    for (const sc of statusCounts) {
      statusMap[sc.status] = sc._count.status;
    }

    // Requests by office - join with office names
    const officeIds = officeCounts.map((oc) => oc.officeId);
    const offices = await prisma.office.findMany({
      where: { id: { in: officeIds } },
      select: { id: true, nameAm: true, nameEn: true },
    });
    const officeMap = new Map(offices.map((o) => [o.id, o.nameEn || o.nameAm]));
    const requestsByOffice = officeCounts.map((oc) => ({
      officeId: oc.officeId,
      office: officeMap.get(oc.officeId) || "Unknown",
      count: oc._count.officeId,
    }));

    // Requests by category - join with category names
    const categoryIds = categoryCounts.map((cc) => cc.categoryId);
    const categoryNames = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, nameAm: true, nameEn: true },
    });
    const categoryNameMap = new Map(categoryNames.map((c) => [c.id, c.nameEn || c.nameAm]));
    const requestsByCategory = categoryCounts.map((cc) => ({
      categoryId: cc.categoryId,
      category: categoryNameMap.get(cc.categoryId) || "Unknown",
      count: cc._count.categoryId,
    }));

    // Technician workload - join with technician names
    const technicianIds = technicianWorkload.map((tw) => tw.technicianId).filter(Boolean);
    const technicians = await prisma.user.findMany({
      where: { id: { in: technicianIds } },
      select: { id: true, fullName: true },
    });
    const technicianNameMap = new Map(technicians.map((t) => [t.id, t.fullName]));
    const workload = technicianWorkload.map((tw) => ({
      technicianId: tw.technicianId,
      technician: technicianNameMap.get(tw.technicianId) || "Unknown",
      count: tw._count.technicianId,
    }));

    // Average resolution time
    let averageResolutionTimeHours = 0;
    if (resolvedTickets.length > 0) {
      const totalResolutionHours = resolvedTickets.reduce((sum, ticket) => {
        const created = new Date(ticket.createdAt);
        const resolvedDate = new Date(ticket.resolvedAt);
        const hours = (resolvedDate - created) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);
      averageResolutionTimeHours = totalResolutionHours / resolvedTickets.length;
    }

    // SLA percentage using category-specific expectedResolutionHours
    let slaPercentage = 0;
    if (ticketsWithSla.length > 0) {
      const slaMet = ticketsWithSla.filter((ticket) => {
        const created = new Date(ticket.createdAt);
        const resolvedDate = new Date(ticket.resolvedAt);
        const resolutionHours = (resolvedDate - created) / (1000 * 60 * 60);

        const expectedHours = categorySlaMap.get(ticket.categoryId) || 24;
        return resolutionHours <= expectedHours;
      }).length;

      slaPercentage = (slaMet / ticketsWithSla.length) * 100;
    }

    // Average satisfaction rating
    let averageSatisfactionRating = 0;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (ticketsWithRating.length > 0) {
      const totalRating = ticketsWithRating.reduce((sum, t) => sum + Number(t.rating), 0);
      averageSatisfactionRating = totalRating / ticketsWithRating.length;

      for (const rd of ratingDistribution) {
        distribution[rd.rating] = rd._count.rating;
      }
    }

    return res.status(200).json(
      successResponse("Report summary retrieved successfully.", {
        period,
        startDate,
        total: statusMap.PENDING + statusMap.ASSIGNED + statusMap.IN_PROGRESS + statusMap.AWAITING_PURCHASE + statusMap.RESOLVED + statusMap.CLOSED,
        pending: statusMap.PENDING,
        inProgress: statusMap.IN_PROGRESS,
        awaitingPurchase: statusMap.AWAITING_PURCHASE,
        resolved: statusMap.RESOLVED,
        closed: statusMap.CLOSED,
        requestsByOffice,
        requestsByCategory,
        technicianWorkload: workload,
        slaPercentage: Number(slaPercentage.toFixed(2)),
        averageResolutionTimeHours: Number(averageResolutionTimeHours.toFixed(2)),
        averageSatisfactionRating: Number(averageSatisfactionRating.toFixed(2)),
        ratingDistribution: distribution,
      }),
    );
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getSummary,
};