const request = require("supertest");

const mockPrisma = {
  user: { findUnique: jest.fn(), findFirst: jest.fn() },
  category: { findUnique: jest.fn() },
  ticket: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  $transaction: jest.fn(),
};

jest.mock("cookie-parser", () => () => (req, res, next) => next(), {
  virtual: true,
});
jest.mock("../src/config/db", () => ({ prisma: mockPrisma }));
jest.mock("../src/middleware/auth.middleware", () => (req, res, next) => {
  const role = req.headers["x-test-role"];
  if (!role)
    return res.status(401).json({ message: "Authentication required." });
  req.user = {
    id:
      role === "EMPLOYEE"
        ? "employee-1"
        : role === "TECHNICIAN"
          ? "tech-1"
          : "admin-1",
    role,
    isActive: true,
  };
  return next();
});
jest.mock("../src/services/assignment.service", () => ({
  assignTechnicianToTicket: jest.fn(),
}));
jest.mock("../src/utils/audit.util", () => ({ createAuditEntry: jest.fn() }));
jest.mock("@prisma/client", () => ({
  Priority: {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
    CRITICAL: "CRITICAL",
  },
  Role: { EMPLOYEE: "EMPLOYEE", TECHNICIAN: "TECHNICIAN", ADMIN: "ADMIN" },
  TicketStatus: {
    PENDING: "PENDING",
    ASSIGNED: "ASSIGNED",
    IN_PROGRESS: "IN_PROGRESS",
    AWAITING_PURCHASE: "AWAITING_PURCHASE",
    RESOLVED: "RESOLVED",
    CLOSED: "CLOSED",
  },
}));

const {
  createTicket,
  verifyTicket,
} = require("../src/controllers/ticket.controller");
const {
  assignTechnicianToTicket,
} = require("../src/services/assignment.service");
const { createAuditEntry } = require("../src/utils/audit.util");
const app = require("../src/server");

function response() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

describe("ticket workflow", () => {
  beforeEach(() => jest.clearAllMocks());

  test("creates a medium-priority ticket and invokes office assignment", async () => {
    const req = {
      user: { id: "employee-1", role: "EMPLOYEE" },
      body: {
        title: "Printer",
        description: "Paper jam",
        categoryId: "category-1",
      },
    };
    const res = response();
    const created = { id: "ticket-1", status: "PENDING", priority: "MEDIUM" };
    mockPrisma.user.findUnique.mockResolvedValue({ officeId: "office-1" });
    mockPrisma.category.findUnique.mockResolvedValue({
      id: "category-1",
      isActive: true,
    });
    mockPrisma.$transaction.mockImplementation((callback) =>
      callback({
        ticket: { create: jest.fn().mockResolvedValue(created) },
      }),
    );
    assignTechnicianToTicket.mockResolvedValue(created);

    await createTicket(req, res, jest.fn());

    expect(assignTechnicianToTicket).toHaveBeenCalledWith(
      "ticket-1",
      "office-1",
      expect.any(Object),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ticket: created }),
    );
  });

  test("requires a valid rating when an employee approves a resolution", async () => {
    const req = {
      user: { id: "employee-1", role: "EMPLOYEE" },
      params: { id: "ticket-1" },
      body: { isApproved: true, rating: 6 },
    };
    const res = response();
    const next = jest.fn();
    await verifyTicket(req, res, next);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 422 }),
    );
    expect(mockPrisma.ticket.findUnique).not.toHaveBeenCalled();
  });
});

function useTransactionCallback() {
  mockPrisma.$transaction.mockImplementation((callback) =>
    callback({
      ticket: {
        create: mockPrisma.ticket.create,
        update: mockPrisma.ticket.update,
      },
    }),
  );
}

describe("ticket HTTP workflow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTransactionCallback();
  });

  test("POST /api/tickets automatically assigns and audits creation", async () => {
    const ticket = { id: "ticket-1", status: "PENDING", priority: "MEDIUM" };
    mockPrisma.user.findUnique.mockResolvedValue({ officeId: "office-1" });
    mockPrisma.category.findUnique.mockResolvedValue({
      id: "category-1",
      isActive: true,
    });
    mockPrisma.ticket.create.mockResolvedValue(ticket);
    assignTechnicianToTicket.mockResolvedValue(ticket);

    const response = await request(app)
      .post("/api/tickets")
      .set("x-test-role", "EMPLOYEE")
      .send({
        title: "Printer",
        description: "Paper jam",
        categoryId: "category-1",
      });

    expect(response.status).toBe(201);
    expect(assignTechnicianToTicket).toHaveBeenCalledWith(
      "ticket-1",
      "office-1",
      expect.any(Object),
    );
    expect(createAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: "CREATED" }),
    );
  });

  test("PATCH /assign enforces admin authorization, reassignment, priority, and audit logging", async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue({
      id: "ticket-1",
      officeId: "office-1",
      technicianId: "tech-old",
      priority: "LOW",
    });
    mockPrisma.user.findFirst.mockResolvedValue({ id: "tech-2" });
    mockPrisma.ticket.update.mockResolvedValue({
      id: "ticket-1",
      technicianId: "tech-2",
      priority: "HIGH",
    });

    const unauthorized = await request(app)
      .patch("/api/tickets/ticket-1/assign")
      .set("x-test-role", "EMPLOYEE")
      .send({ priority: "HIGH" });
    expect(unauthorized.status).toBe(403);

    const response = await request(app)
      .patch("/api/tickets/ticket-1/assign")
      .set("x-test-role", "ADMIN")
      .send({ technicianId: "tech-2", priority: "HIGH" });

    expect(response.status).toBe(200);
    expect(createAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: "MANUAL_ASSIGNED" }),
    );
    expect(createAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: "PRIORITY_CHANGED" }),
    );
  });

  test("procurement accepts only in-progress tickets", async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue({
      id: "ticket-1",
      status: "IN_PROGRESS",
      technicianId: "tech-1",
    });
    mockPrisma.ticket.update.mockResolvedValue({
      id: "ticket-1",
      status: "AWAITING_PURCHASE",
    });

    const response = await request(app)
      .patch("/api/tickets/ticket-1/request-purchase")
      .set("x-test-role", "TECHNICIAN")
      .send({ purchaseDetails: "Replacement toner" });
    expect(response.status).toBe(200);
    expect(createAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: "AWAITING_PURCHASE" }),
    );

    mockPrisma.ticket.findUnique.mockResolvedValue({
      id: "ticket-1",
      status: "PENDING",
      technicianId: "tech-1",
    });
    const rejected = await request(app)
      .patch("/api/tickets/ticket-1/request-purchase")
      .set("x-test-role", "TECHNICIAN")
      .send({ purchaseDetails: "Replacement toner" });
    expect(rejected.status).toBe(422);
  });

  test("resolution stores notes and requires SLA justification when overdue", async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue({
      id: "ticket-1",
      status: "IN_PROGRESS",
      technicianId: "tech-1",
      createdAt: new Date(),
      category: { expectedResolutionHours: 24 },
    });
    mockPrisma.ticket.update.mockResolvedValue({
      id: "ticket-1",
      status: "RESOLVED",
    });

    const resolved = await request(app)
      .put("/api/tickets/ticket-1/resolve")
      .set("x-test-role", "TECHNICIAN")
      .send({
        diagnosis: "Jam",
        workPerformed: "Cleared paper",
        purchasedByOffice: false,
      });
    expect(resolved.status).toBe(200);

    mockPrisma.ticket.findUnique.mockResolvedValue({
      id: "ticket-2",
      status: "IN_PROGRESS",
      technicianId: "tech-1",
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      category: { expectedResolutionHours: 1 },
    });
    const overdue = await request(app)
      .put("/api/tickets/ticket-2/resolve")
      .set("x-test-role", "TECHNICIAN")
      .send({ diagnosis: "Jam", workPerformed: "Cleared paper" });
    expect(overdue.status).toBe(422);
  });

  test("verification approves resolved tickets or rejects them back to in-progress", async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue({
      id: "ticket-1",
      status: "RESOLVED",
      employeeId: "employee-1",
      slaExceeded: false,
    });
    mockPrisma.ticket.update.mockResolvedValue({
      id: "ticket-1",
      status: "CLOSED",
    });

    const approved = await request(app)
      .patch("/api/tickets/ticket-1/verify")
      .set("x-test-role", "EMPLOYEE")
      .send({ isApproved: true, rating: 5, feedback: "Fixed" });
    expect(approved.status).toBe(200);
    expect(createAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: "VERIFIED" }),
    );

    mockPrisma.ticket.findUnique.mockResolvedValue({
      id: "ticket-2",
      status: "RESOLVED",
      employeeId: "employee-1",
      slaExceeded: false,
    });
    mockPrisma.ticket.update.mockResolvedValue({
      id: "ticket-2",
      status: "IN_PROGRESS",
    });
    const rejected = await request(app)
      .patch("/api/tickets/ticket-2/verify")
      .set("x-test-role", "EMPLOYEE")
      .send({ isApproved: false, feedback: "Still failing" });
    expect(rejected.status).toBe(200);

    mockPrisma.ticket.findUnique.mockResolvedValue({
      id: "ticket-3",
      status: "IN_PROGRESS",
      employeeId: "employee-1",
      slaExceeded: false,
    });
    const invalid = await request(app)
      .patch("/api/tickets/ticket-3/verify")
      .set("x-test-role", "EMPLOYEE")
      .send({ isApproved: true, rating: 5 });
    expect(invalid.status).toBe(422);
  });

  test("status endpoint permits valid transitions and protects closed tickets", async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue({
      id: "ticket-1",
      status: "PENDING",
      technicianId: "tech-1",
    });
    mockPrisma.ticket.update.mockResolvedValue({
      id: "ticket-1",
      status: "IN_PROGRESS",
    });
    const valid = await request(app)
      .put("/api/tickets/ticket-1/status")
      .set("x-test-role", "TECHNICIAN")
      .send({ status: "IN_PROGRESS" });
    expect(valid.status).toBe(200);

    mockPrisma.ticket.findUnique.mockResolvedValue({
      id: "ticket-1",
      status: "CLOSED",
      technicianId: "tech-1",
    });
    const closed = await request(app)
      .put("/api/tickets/ticket-1/status")
      .set("x-test-role", "TECHNICIAN")
      .send({ status: "IN_PROGRESS" });
    expect(closed.status).toBe(422);
  });
});
