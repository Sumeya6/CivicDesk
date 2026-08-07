const bcrypt = require("bcryptjs");

const { prisma } = require("../config/db");
const {
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenCookieOptions,
} = require("../utils/jwt");

async function login(req, res, next) {
  try {
    const { phoneNumber, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { phoneNumber },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        password: true,
        role: true,
        officeId: true,
        isActive: true,
        preferredLanguage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || !user.isActive) {
      const error = new Error("Invalid phone number or password.");
      error.statusCode = 401;
      return next(error);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const error = new Error("Invalid phone number or password.");
      error.statusCode = 401;
      return next(error);
    }

    const { password: _, ...safeUser } = user;

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("accessToken", accessToken, getAccessTokenCookieOptions());

    return res.status(200).json({
      message: "Login successful.",
      user: safeUser,
    });
  } catch (error) {
    return next(error);
  }
}

function logout(req, res, next) {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "Logout successful.",
    });
  } catch (error) {
    return next(error);
  }
}

function getCurrentUser(req, res, next) {
  try {
    if (!req.user) {
      const error = new Error("Authentication required.");
      error.statusCode = 401;
      return next(error);
    }

    return res.status(200).json({
      message: "Authenticated user retrieved successfully.",
      user: req.user,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
  logout,
  getCurrentUser,
};
