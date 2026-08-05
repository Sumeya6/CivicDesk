const logger = require("../config/logger");

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error.";

  if (statusCode >= 500) {
    logger.error(message, { stack: err.stack, path: req.originalUrl });
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

module.exports = errorHandler;
