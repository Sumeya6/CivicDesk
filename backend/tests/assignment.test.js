jest.mock("../src/config/db", () => ({
  prisma: {
    technicianOffice: {
      findMany: jest.fn(),
    },
    ticket: {
      findMany: jest.fn(),
    },
  },
}));

const { prisma } = require("../src/config/db");
const {
  getTechnicianWorkloadsByOffice,
  findBestTechnicianForOffice,
} = require("../src/services/assignment.service");

describe("assignment.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("assigns to the technician with the lowest active workload", async () => {
    prisma.technicianOffice.findMany.mockResolvedValue([
      {
        technicianId: "tech-a",
        assignedAt: new Date("2026-01-01T08:00:00.000Z"),
      },
      {
        technicianId: "tech-b",
        assignedAt: new Date("2026-01-01T08:30:00.000Z"),
      },
      {
        technicianId: "tech-c",
        assignedAt: new Date("2026-01-01T09:00:00.000Z"),
      },
    ]);

    prisma.ticket.findMany.mockResolvedValue([
      { technicianId: "tech-a" },
      { technicianId: "tech-a" },
      { technicianId: "tech-c" },
    ]);

    const workloads = await getTechnicianWorkloadsByOffice("office-1");

    expect(workloads.map((item) => item.technicianId)).toEqual([
      "tech-b",
      "tech-c",
      "tech-a",
    ]);

    const selectedTechnician = await findBestTechnicianForOffice("office-1");

    expect(selectedTechnician).toBe("tech-b");
    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ["PENDING", "IN_PROGRESS"] },
        }),
      }),
    );
  });

  it("returns null when no technicians are mapped to the office", async () => {
    prisma.technicianOffice.findMany.mockResolvedValue([]);

    const selectedTechnician = await findBestTechnicianForOffice("office-2");

    expect(selectedTechnician).toBeNull();
    expect(prisma.ticket.findMany).not.toHaveBeenCalled();
  });
});
