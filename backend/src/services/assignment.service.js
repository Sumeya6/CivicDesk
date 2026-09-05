const { TicketStatus } = require("@prisma/client");

const { prisma } = require("../config/db");

const ACTIVE_WORKLOAD_STATUSES = [TicketStatus.PENDING, TicketStatus.IN_PROGRESS];

async function getTechnicianWorkloadsByOffice(officeId) {
  const technicianMappings = await prisma.technicianOffice.findMany({
    where: {
      officeId,
      technician: {
        role: "TECHNICIAN",
        isActive: true,
      },
    },
    select: {
      technicianId: true,
      assignedAt: true,
    },
  });

  if (!technicianMappings.length) {
    return [];
  }

  const technicianIds = technicianMappings.map((mapping) => mapping.technicianId);

  const activeTickets = await prisma.ticket.findMany({
    where: {
      technicianId: { in: technicianIds },
      status: { in: ACTIVE_WORKLOAD_STATUSES },
    },
    select: {
      technicianId: true,
    },
  });

  const workloadMap = new Map();
  for (const technicianId of technicianIds) {
    workloadMap.set(technicianId, 0);
  }

  for (const ticket of activeTickets) {
    if (!ticket.technicianId) {
      continue;
    }
    workloadMap.set(
      ticket.technicianId,
      (workloadMap.get(ticket.technicianId) || 0) + 1,
    );
  }

  return technicianMappings
    .map((mapping) => ({
      technicianId: mapping.technicianId,
      assignedAt: mapping.assignedAt,
      activeWorkload: workloadMap.get(mapping.technicianId) || 0,
    }))
    .sort((left, right) => {
      if (left.activeWorkload !== right.activeWorkload) {
        return left.activeWorkload - right.activeWorkload;
      }

      if (left.assignedAt.getTime() !== right.assignedAt.getTime()) {
        return left.assignedAt.getTime() - right.assignedAt.getTime();
      }

      return left.technicianId.localeCompare(right.technicianId);
    });
}

async function findBestTechnicianForOffice(officeId) {
  const workloads = await getTechnicianWorkloadsByOffice(officeId);

  if (!workloads.length) {
    return null;
  }

  return workloads[0].technicianId;
}

module.exports = {
  ACTIVE_WORKLOAD_STATUSES,
  getTechnicianWorkloadsByOffice,
  findBestTechnicianForOffice,
};
