require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const logger = require("./config/logger");
const { connectDB } = require("./config/db");
const routes = require("./routes");
const notFound = require("./middleware/notFound.middleware");
const errorHandler = require("./middleware/error.middleware");

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
  });
  next();
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "CivicDesk API",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, async () => {
  try {
    await connectDB();
    logger.info(`CivicDesk API listening on port ${PORT} (${NODE_ENV})`);
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
});

function shutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  if (!server) {
    process.exit(0);
  }
  server.close(() => {
    logger.info("HTTP server closed.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

module.exports = app;
