const { prisma } = require("../config/db");

async function replaceTechnicianOffices(technicianId, officeIds) {
  return prisma.$transaction(async (tx) => {
    await tx.technicianOffice.deleteMany({ where: { technicianId } });

    if (officeIds.length === 0) {
      return [];
    }

    const assignments = officeIds.map((officeId) => ({
      technicianId,
      officeId,
    }));

    return tx.technicianOffice.createMany({
      data: assignments,
      skipDuplicates: true,
    });
  });
}

module.exports = {
  replaceTechnicianOffices,
};
