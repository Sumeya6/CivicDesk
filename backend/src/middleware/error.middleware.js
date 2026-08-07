const logger = require("../config/logger");

function errorHandler(err, req, res, next) {
  const statusCode = err?.statusCode || 400;
  const message = err?.message || "Internal server error.";
  const isDevelopment = process.env.NODE_ENV === "development";

  if (statusCode >= 500) {
    logger.error(message, {
      stack: err?.stack,
      path: req.originalUrl,
      code: err?.code,
    });
  }

  let response = { message };

  if (err?.details) {
    response.errors = err.details;
  }

  if (isDevelopment && err?.stack) {
    response.stack = err.stack;
  }

  if (err?.code === "P2002") {
    return res.status(409).json({
      message: "Conflict. The requested resource already exists.",
      ...(isDevelopment && { stack: err.stack }),
    });
  }

  if (err?.code === "P2025") {
    return res.status(404).json({
      message: "The requested resource was not found.",
      ...(isDevelopment && { stack: err.stack }),
    });
  }

  if (err?.code === "P2003" || err?.code === "P2014" || err?.code === "P2015") {
    return res.status(422).json({
      message:
        "The request could not be processed due to invalid relation data.",
      ...(isDevelopment && { stack: err.stack }),
    });
  }

  return res.status(statusCode).json(response);
}

module.exports = errorHandler;
