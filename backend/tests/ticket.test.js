const express = require("express");
const request = require("supertest");

jest.mock("../src/middleware/auth.middleware", () => {
  return (req, res, next) => {
    req.user = {
      id: req.header("x-user-id") || "user-1",
      role: req.header("x-user-role") || "EMPLOYEE",
      officeId: req.header("x-user-office") || "office-1",
    };
    next();
  };
});

jest.mock("../src/config/db", () => ({
  prisma: {
    category: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    ticket: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    technicianOffice: { findFirst: jest.fn() },
    maintenanceNote: { upsert: jest.fn() },
    auditLog: { create: jest.fn() },
  },
}));

jest.mock("../src/services/assignment.service", () => ({
  findBestTechnicianForOffice: jest.fn(),
}));

const { prisma } = require("../src/config/db");
const ticketRoutes = require("../src/routes/ticket.routes");

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/tickets", ticketRoutes);
  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({ message: err.message });
  });
  return app;
}

describe("ticket.routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("blocks non-admin users from manual assignment endpoint", async () => {
    const app = createApp();

    const response = await request(app)
      .patch("/tickets/t-1/assign")
      .set("x-user-role", "EMPLOYEE")
      .send({ technicianId: "tech-1", priority: "HIGH" });

    expect(response.status).toBe(403);
    expect(response.body.message).toContain("not authorized");
  });

  it("rejects reassignment when technician is not mapped to ticket office", async () => {
    prisma.ticket.findUnique.mockResolvedValue({
      id: "t-1",
      officeId: "office-1",
      technicianId: "tech-old",
      priority: "MEDIUM",
      status: "ASSIGNED",
    });
    prisma.user.findUnique.mockResolvedValue({
      id: "tech-2",
      role: "TECHNICIAN",
      isActive: true,
    });
    prisma.technicianOffice.findFirst.mockResolvedValue(null);

    const app = createApp();

    const response = await request(app)
      .patch("/tickets/t-1/assign")
      .set("x-user-role", "ADMIN")
      .send({ technicianId: "tech-2" });

    expect(response.status).toBe(422);
    expect(response.body.message).toContain("not mapped");
  });

  it("allows admin reassignment and priority override with audit logs", async () => {
    prisma.ticket.findUnique.mockResolvedValue({
      id: "t-1",
      officeId: "office-1",
      technicianId: "tech-old",
      priority: "LOW",
      status: "PENDING",
    });
    prisma.user.findUnique.mockResolvedValue({
      id: "tech-new",
      role: "TECHNICIAN",
      isActive: true,
    });
    prisma.technicianOffice.findFirst.mockResolvedValue({
      id: "mapping-1",
    });
    prisma.ticket.update.mockResolvedValue({
      id: "t-1",
      technicianId: "tech-new",
      priority: "CRITICAL",
      status: "ASSIGNED",
    });

    const app = createApp();

    const response = await request(app)
      .patch("/tickets/t-1/assign")
      .set("x-user-role", "ADMIN")
      .set("x-user-id", "admin-1")
      .send({ technicianId: "tech-new", priority: "CRITICAL" });

    expect(response.status).toBe(200);
    expect(response.body.ticket.status).toBe("ASSIGNED");

    const actions = prisma.auditLog.create.mock.calls.map((call) => call[0].data.action);
    expect(actions).toEqual(
      expect.arrayContaining([
        "MANUAL_REASSIGN",
        "PRIORITY_CHANGED",
        "STATUS_CHANGED",
      ]),
    );
  });

  it("requires SLA justification when employee closes exceeded ticket", async () => {
    prisma.ticket.findUnique.mockResolvedValue({
      id: "t-2",
      employeeId: "employee-1",
      status: "RESOLVED",
      isApproved: null,
      slaExceeded: true,
      slaJustification: null,
    });

    const app = createApp();

    const response = await request(app)
      .patch("/tickets/t-2/verify")
      .set("x-user-role", "EMPLOYEE")
      .set("x-user-id", "employee-1")
      .send({ isApproved: true, rating: 5 });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("slaJustification");
  });
});
