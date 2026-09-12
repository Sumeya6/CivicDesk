const mockPrisma = {
  technicianOffice: { findMany: jest.fn() },
  ticket: { groupBy: jest.fn() },
};

jest.mock("../src/config/db", () => ({ prisma: mockPrisma }));
jest.mock("../src/utils/audit.util", () => ({ createAuditEntry: jest.fn() }));
jest.mock("@prisma/client", () => ({
  TicketStatus: {
    PENDING: "PENDING",
    IN_PROGRESS: "IN_PROGRESS",
    AWAITING_PURCHASE: "AWAITING_PURCHASE",
  },
  Priority: { MEDIUM: "MEDIUM" },
  Role: { TECHNICIAN: "TECHNICIAN" },
}));

const {
  findLeastBusyTechnician,
  ACTIVE_TICKET_STATUSES,
} = require("../src/services/assignment.service");

describe("assignment service", () => {
  beforeEach(() => jest.clearAllMocks());

  test("counts only pending and in-progress tickets and chooses the least busy technician", async () => {
    mockPrisma.technicianOffice.findMany.mockResolvedValue([
      {
        technician: {
          id: "tech-a",
          isActive: true,
          role: "TECHNICIAN",
          createdAt: new Date("2026-01-01"),
        },
      },
      {
        technician: {
          id: "tech-b",
          isActive: true,
          role: "TECHNICIAN",
          createdAt: new Date("2026-01-02"),
        },
      },
    ]);
    mockPrisma.ticket.groupBy
      .mockResolvedValueOnce([{ technicianId: "tech-a", _count: { id: 2 } }])
      .mockResolvedValueOnce([
        { technicianId: "tech-a", _max: { updatedAt: new Date("2026-01-02") } },
      ]);

    await expect(findLeastBusyTechnician("office-1")).resolves.toBe("tech-b");
    expect(mockPrisma.ticket.groupBy.mock.calls[0][0].where.status.in).toEqual([
      "PENDING",
      "IN_PROGRESS",
    ]);
    expect(ACTIVE_TICKET_STATUSES).toEqual(["PENDING", "IN_PROGRESS"]);
  });

  test("returns null when an office has no active mapped technicians", async () => {
    mockPrisma.technicianOffice.findMany.mockResolvedValue([]);
    await expect(findLeastBusyTechnician("office-1")).resolves.toBeNull();
    expect(mockPrisma.ticket.groupBy).not.toHaveBeenCalled();
  });
});
