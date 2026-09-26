const mockPrisma = {
  technicianOffice: { findMany: jest.fn() },
  ticket: { groupBy: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
};
const mockCreateAuditEntry = jest.fn();

jest.mock("../src/config/db", () => ({ prisma: mockPrisma }));
jest.mock("../src/utils/audit.util", () => ({ createAuditEntry: mockCreateAuditEntry }));
jest.mock("@prisma/client", () => ({
  TicketStatus: {
    PENDING: "PENDING",
    ASSIGNED: "ASSIGNED",
    IN_PROGRESS: "IN_PROGRESS",
    AWAITING_PURCHASE: "AWAITING_PURCHASE",
  },
  Priority: { MEDIUM: "MEDIUM" },
  Role: { TECHNICIAN: "TECHNICIAN" },
}));

const {
  findLeastBusyTechnician,
  assignTechnicianToTicket,
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

  test("auto-assignment changes a pending ticket to assigned", async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue({
      id: "ticket-1",
      status: "PENDING",
      technicianId: null,
      priority: "MEDIUM",
    });
    mockPrisma.technicianOffice.findMany.mockResolvedValue([
      { technician: { id: "tech-1", isActive: true, role: "TECHNICIAN", createdAt: new Date("2026-01-01") } },
    ]);
    mockPrisma.ticket.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    mockPrisma.ticket.update.mockResolvedValue({
      id: "ticket-1",
      technicianId: "tech-1",
      status: "ASSIGNED",
    });

    await expect(assignTechnicianToTicket("ticket-1", "office-1")).resolves.toEqual(
      expect.objectContaining({ technicianId: "tech-1", status: "ASSIGNED" }),
    );
    expect(mockPrisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ technicianId: "tech-1", status: "ASSIGNED" }),
    }));
    expect(mockCreateAuditEntry).toHaveBeenCalledWith(expect.objectContaining({
      action: "STATUS_CHANGED",
      previousValue: "PENDING",
      newValue: "ASSIGNED",
    }));
  });
});
