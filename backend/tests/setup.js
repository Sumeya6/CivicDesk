const { prisma } = require("../src/config/db");

module.exports = async () => {
  await prisma.$connect();
};
