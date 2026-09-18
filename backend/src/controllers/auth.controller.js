const bcrypt = require("bcryptjs");

const { prisma } = require("../config/db");
const {
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  verifyRefreshToken,
} = require("../utils/jwt");
const {
  generatePasswordResetToken,
  verifyPasswordResetToken,
} = require("../utils/jwt");
const { findUserByPhone, createUser } = require("../services/user.service");
const { normalizeEthiopianPhone } = require("../utils/phone");
const notificationService = require("../services/notification.service");
const logger = require("../config/logger");
const { successResponse, createdResponse } = require("../utils/response");

async function register(req, res, next) {
  try {
    const { fullName, phoneNumber, password, preferredLanguage, officeId } =
      req.body;

    const normalizedPhoneNumber = normalizeEthiopianPhone(phoneNumber);
    const existingUser = await findUserByPhone(normalizedPhoneNumber);
    if (existingUser) {
      const error = new Error("Phone number is already registered.");
      error.statusCode = 409;
      return next(error);
    }

    const office = await prisma.office.findUnique({
      where: { id: officeId },
      select: { id: true, isActive: true },
    });
    if (!office || !office.isActive) {
      const error = new Error("Selected office was not found or is inactive.");
      error.statusCode = 422;
      return next(error);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser({
      fullName,
      phoneNumber: normalizedPhoneNumber,
      password: hashedPassword,
      preferredLanguage,
      officeId,
      role: "EMPLOYEE",
    });

    return res.status(201).json(createdResponse("User registered successfully.", user));
  } catch (error) {
    return next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { id } = req.user;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { password: true },
    });

    if (!user) {
      const error = new Error("Authenticated user not found.");
      error.statusCode = 401;
      return next(error);
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      const error = new Error("Current password is incorrect.");
      error.statusCode = 401;
      return next(error);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return res.status(200).json(successResponse("Password changed successfully."));
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { phoneNumber, password } = req.body;
    const normalizedPhoneNumber = normalizeEthiopianPhone(phoneNumber);
    const user = await findUserByPhone(normalizedPhoneNumber);

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
    res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

    return res.status(200).json(successResponse("Login successful.", safeUser));
  } catch (error) {
    return next(error);
  }
}

function logout(req, res, next) {
  try {
    const clearOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    };
    res.clearCookie("accessToken", clearOptions);
    res.clearCookie("refreshToken", clearOptions);

    return res.status(200).json(successResponse("Logout successful."));
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

    return res.status(200).json(successResponse("Authenticated user retrieved successfully.", req.user));
  } catch (error) {
    return next(error);
  }
}

async function refreshToken(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      const error = new Error("Refresh token required.");
      error.statusCode = 401;
      return next(error);
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      const error = new Error("Invalid or expired refresh token.");
      error.statusCode = 401;
      return next(error);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
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

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("accessToken", accessToken, getAccessTokenCookieOptions());
    res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

    return res.status(200).json(successResponse("Token refreshed successfully.", user));
  } catch (error) {
    return next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { phoneNumber } = req.body;

    const user = await findUserByPhone(phoneNumber);

    const genericMessage =
      "If an account with that phone number exists, password reset instructions have been sent.";

    if (!user || !user.isActive) {
      return res.status(200).json(successResponse(genericMessage));
    }

    const resetToken = generatePasswordResetToken(user);

    if (process.env.NODE_ENV === "test") {
      return res.status(200).json(successResponse("Password reset token generated.", { resetToken }));
    }

    try {
      await notificationService.sendPasswordReset(user, resetToken);
    } catch (err) {
      logger.error("Failed to send password reset SMS", {
        err: err.message,
        phoneNumber: user.phoneNumber,
      });
    }

    return res.status(200).json(successResponse(genericMessage));
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;

    const decoded = verifyPasswordResetToken(token);
    if (!decoded || !decoded.sub) {
      const error = new Error("Invalid or expired password reset token.");
      error.statusCode = 401;
      return next(error);
    }

    const userId = decoded.sub;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      return next(error);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res.status(200).json(successResponse("Password has been reset successfully."));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  changePassword,
  login,
  logout,
  getCurrentUser,
  refreshToken,
  forgotPassword,
  resetPassword,
};
