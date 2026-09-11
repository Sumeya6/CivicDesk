const { prisma } = require("../config/db");

async function listActiveAnnouncements(req, res, next) {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      message: "Announcements retrieved successfully.",
      announcements,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listActiveAnnouncements };
