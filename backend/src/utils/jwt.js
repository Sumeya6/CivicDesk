require("dotenv").config();

const jwt = require("jsonwebtoken");

function createAuthError(message, statusCode = 401) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getAccessTokenSecret() {
  return process.env.JWT_ACCESS_TOKEN_SECRET || "development-access-secret";
}

function getRefreshTokenSecret() {
  return process.env.JWT_REFRESH_TOKEN_SECRET || "development-refresh-secret";
}

function getAccessTokenExpiration() {
  return process.env.JWT_ACCESS_TOKEN_EXPIRATION || "15m";
}

function getRefreshTokenExpiration() {
  return process.env.JWT_REFRESH_TOKEN_EXPIRATION || "7d";
}

function parseExpiresInToMilliseconds(expiresIn) {
  if (!expiresIn || typeof expiresIn !== "string") {
    return 15 * 60 * 1000;
  }

  const match = /^([0-9]+)(ms|s|m|h|d)$/i.exec(expiresIn.trim());

  if (!match) {
    return 15 * 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "ms":
      return value;
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 15 * 60 * 1000;
  }
}

function getAccessTokenMaxAge() {
  return parseExpiresInToMilliseconds(getAccessTokenExpiration());
}

function getAccessTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: getAccessTokenMaxAge(),
  };
}

function signToken(payload, secret, expiresIn) {
  return jwt.sign(payload, secret, { expiresIn });
}

function generateAccessToken(user) {
  return signToken(
    {
      sub: user.id,
      role: user.role,
      phoneNumber: user.phoneNumber,
    },
    getAccessTokenSecret(),
    getAccessTokenExpiration(),
  );
}

function generateRefreshToken(user) {
  return signToken(
    {
      sub: user.id,
      role: user.role,
      phoneNumber: user.phoneNumber,
    },
    getRefreshTokenSecret(),
    getRefreshTokenExpiration(),
  );
}

function getPasswordResetSecret() {
  return process.env.JWT_PASSWORD_RESET_SECRET || getRefreshTokenSecret();
}

function getPasswordResetExpiration() {
  return process.env.JWT_PASSWORD_RESET_EXPIRATION || "1h";
}

function generatePasswordResetToken(user) {
  return signToken(
    {
      sub: user.id,
      phoneNumber: user.phoneNumber,
      purpose: "password_reset",
    },
    getPasswordResetSecret(),
    getPasswordResetExpiration(),
  );
}

function verifyPasswordResetToken(token) {
  return verifyToken(token, getPasswordResetSecret());
}

function verifyToken(token, secret) {
  if (!token) {
    throw createAuthError("Authentication token required.", 401);
  }

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw createAuthError("Authentication token has expired.", 401);
    }

    if (error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
      throw createAuthError("Invalid authentication token.", 401);
    }

    throw createAuthError("Authentication failed.", 401);
  }
}

function verifyAccessToken(token) {
  return verifyToken(token, getAccessTokenSecret());
}

function verifyRefreshToken(token) {
  return verifyToken(token, getRefreshTokenSecret());
}

function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader || typeof authorizationHeader !== "string") {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  extractBearerToken,
  getAccessTokenCookieOptions,
  generatePasswordResetToken,
  verifyPasswordResetToken,
};
