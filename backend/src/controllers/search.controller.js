const { prisma } = require("../config/db");

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

async function searchTickets(req, res, next) {
  try {
    const {
      employeeId,
      technicianId,
      officeId,
      status,
      priority,
      categoryId,
      startDate,
      endDate,
      q,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const skip = (pageNumber - 1) * limitNumber;

    const where = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (technicianId) {
      where.technicianId = technicianId;
    }

    if (officeId) {
      where.officeId = officeId;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startOfDay(startDate);
      }
      if (endDate) {
        where.createdAt.lte = endOfDay(endDate);
      }
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { deviceOrSystem: { contains: q, mode: "insensitive" } },
      ];
    }

    const [tickets, totalCount] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          office: true,
          category: true,
          employee: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
              role: true,
              officeId: true,
            },
          },
          technician: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
              role: true,
              officeId: true,
            },
          },
        },
      }),

      prisma.ticket.count({
        where,
      }),
    ]);

    return res.status(200).json({
      data: tickets,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNumber),
      currentPage: pageNumber,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  searchTickets,
};
