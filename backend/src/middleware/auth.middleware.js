const { prisma } = require("../config/db");
const { verifyAccessToken } = require("../utils/jwt");

async function authenticateUser(req, res, next) {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      const error = new Error("Authentication token required.");
      error.statusCode = 401;
      return next(error);
    }

    const decodedToken = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decodedToken.sub },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        officeId: true,
        isActive: true,
        preferredLanguage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || !user.isActive) {
      const error = new Error("User not found or inactive.");
      error.statusCode = 401;
      return next(error);
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = authenticateUser;
