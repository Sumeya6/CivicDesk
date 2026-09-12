const { prisma } = require("../config/db");

async function listCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { nameEn: "asc" },
    });

    return res.status(200).json({ categories });
  } catch (requestError) {
    return next(requestError);
  }
}

module.exports = { listCategories };
