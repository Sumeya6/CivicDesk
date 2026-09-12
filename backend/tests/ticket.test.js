const request = require("supertest");

const mockPrisma = {
  user: { findUnique: jest.fn(), findFirst: jest.fn() },
  category: { findUnique: jest.fn(), findMany: jest.fn() },
  ticket: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock("cookie-parser", () => () => (req, res, next) => next(), {
  virtual: true,
});
jest.mock("../src/config/db", () => ({
  prisma: mockPrisma,
  connectDB: jest.fn().mockResolvedValue(undefined),
}));
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
  listTickets,
} = require("../src/controllers/ticket.controller");
const { listCategories } = require("../src/controllers/category.controller");
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

describe("GET /api/tickets", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns paginated tickets with category included", async () => {
    const tickets = [
      {
        id: "t-1",
        title: "Printer jam",
        status: "IN_PROGRESS",
        priority: "HIGH",
        category: { id: "cat-1", nameEn: "Printer / Scanner Failure" },
      },
    ];
    mockPrisma.ticket.findMany.mockResolvedValue(tickets);
    mockPrisma.ticket.count.mockResolvedValue(1);

    const res = await request(app)
      .get("/api/tickets")
      .set("x-test-role", "TECHNICIAN");

    expect(res.status).toBe(200);
    expect(res.body.tickets).toEqual(tickets);
    expect(res.body.totalTickets).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.totalPages).toBe(1);
    expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { category: true },
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  test("filters by status", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([]);
    mockPrisma.ticket.count.mockResolvedValue(0);

    const res = await request(app)
      .get("/api/tickets?status=IN_PROGRESS")
      .set("x-test-role", "TECHNICIAN");

    expect(res.status).toBe(200);
    expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "IN_PROGRESS" } }),
    );
  });

  test("handles pagination parameters", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([]);
    mockPrisma.ticket.count.mockResolvedValue(0);

    const res = await request(app)
      .get("/api/tickets?page=2&limit=5")
      .set("x-test-role", "TECHNICIAN");

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 }),
    );
  });

  test("returns 422 for invalid status filter", async () => {
    const res = await request(app)
      .get("/api/tickets?status=INVALID_STATUS")
      .set("x-test-role", "TECHNICIAN");

    expect(res.status).toBe(422);
    expect(res.body.message).toMatch(/invalid/i);
  });

  test("requires authentication", async () => {
    const res = await request(app).get("/api/tickets");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/categories", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns active categories", async () => {
    const categories = [
      { id: "cat-1", nameEn: "Printer / Scanner Failure", type: "HARDWARE" },
      { id: "cat-2", nameEn: "OS Failure / Blue Screen", type: "SOFTWARE" },
    ];
    mockPrisma.category.findMany.mockResolvedValue(categories);

    const res = await request(app)
      .get("/api/categories")
      .set("x-test-role", "EMPLOYEE");

    expect(res.status).toBe(200);
    expect(res.body.categories).toEqual(categories);
    expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { nameEn: "asc" },
    });
  });

  test("requires authentication", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(401);
  });
});
