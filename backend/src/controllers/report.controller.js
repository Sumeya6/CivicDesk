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

    const tickets = await prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });

    return res.status(200).json({
      period,
      startDate,
      total: tickets.length,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getSummary,
};