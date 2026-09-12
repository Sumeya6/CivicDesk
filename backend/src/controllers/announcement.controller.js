const { prisma } = require("../config/db");

// Get all announcements
async function getAnnouncements(req, res, next) {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(announcements);
  } catch (error) {
    return next(error);
  }
}

// Get one announcement
async function getAnnouncementById(req, res, next) {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      return res.status(404).json({
        message: "Announcement not found",
      });
    }

    return res.status(200).json(announcement);
  } catch (error) {
    return next(error);
  }
}

// Create announcement
async function createAnnouncement(req, res, next) {
  try {
    const { title, content, isActive } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: "Title and content are required",
      });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        authorId: req.user.id,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return res.status(201).json(announcement);
  } catch (error) {
    return next(error);
  }
}

// Update announcement
async function updateAnnouncement(req, res, next) {
  try {
    const { id } = req.params;
    const { title, content, isActive } = req.body;

    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Announcement not found",
      });
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(isActive !== undefined && {
          isActive: Boolean(isActive),
        }),
      },
    });

    return res.status(200).json(announcement);
  } catch (error) {
    return next(error);
  }
}

// Delete announcement
async function deleteAnnouncement(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Announcement not found",
      });
    }

    await prisma.announcement.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
