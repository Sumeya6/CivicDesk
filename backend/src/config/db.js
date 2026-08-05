require("dotenv").config();

const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const logger = require("./logger");

/**
 * Singleton PrismaClient instance.
 *
 * During development (hot reload) Node may re-evaluate modules several times,
 * which would normally create a new PrismaClient on every reload and exhaust
 * database connections. Storing the instance on `globalThis` guarantees that
 * only one client is ever created and shared across reloads.
 */
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Establishes and verifies the connection to PostgreSQL.
 *
 * - Uses Prisma's `$connect()` to open the connection pool.
 * - Runs a lightweight `SELECT 1` health check to confirm the database is
 *   reachable before the rest of the application boots.
 * - Logs a clear success message on success and a detailed error on failure,
 *   then re-throws the error so the server can terminate gracefully.
 *
 * @returns {Promise<void>} Resolves once the connection is verified.
 */
async function connectDB() {
  try {
    await prisma.$connect();

    await prisma.$queryRaw`SELECT 1`;

    logger.info("Database connected successfully.");
  } catch (error) {
    logger.error("Failed to connect to the database:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw error;
  }
}

/**
 * Gracefully closes the database connection when the process receives a
 * termination signal (Ctrl+C / SIGINT or SIGTERM) so no connections leak.
 */
async function disconnectDB() {
  try {
    await prisma.$disconnect();
    logger.info("Database connection closed.");
  } catch (error) {
    logger.error("Error while closing the database connection:", {
      message: error instanceof Error ? error.message : String(error),
    });
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", disconnectDB);
process.on("SIGTERM", disconnectDB);

module.exports = { prisma, connectDB };
