const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");

const mockPrisma = {
  ticket: {
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  category: {
    findMany: jest.fn(),
  },
  office: {
    findMany: jest.fn(),
  },
};

jest.mock("../src/config/db", () => ({
  prisma: mockPrisma,
}));

jest.mock("../src/utils/jwt", () => ({
  verifyAccessToken: jest.fn(),
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  extractBearerToken: jest.fn(),
  getAccessTokenCookieOptions: jest.fn(),
}));

const { verifyAccessToken } = require("../src/utils/jwt");
const reportRoutes = require("../src/routes/report.routes");
const errorHandler = require("../src/middleware/error.middleware");

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/reports", reportRoutes);
  app.use(errorHandler);
  return app;
}

const app = createApp();

const adminUser = {
  id: "admin-id",
  fullName: "Admin User",
  phoneNumber: "+1234567890",
  role: "ADMIN",
  officeId: "off1",
  isActive: true,
  preferredLanguage: "EN",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const employeeUser = {
  id: "emp-id",
  fullName: "Employee User",
  phoneNumber: "+0987654321",
  role: "EMPLOYEE",
  officeId: "off1",
  isActive: true,
  preferredLanguage: "EN",
  createdAt: new Date(),
  updatedAt: new Date(),
};

function authCookie() {
  return "accessToken=fake-token";
}

function makeTicket(overrides = {}) {
  return {
    id: "t1",
    title: "Test ticket",
    description: "desc",
    status: "PENDING",
    priority: "MEDIUM",
    createdAt: new Date(),
    resolvedAt: null,
    rating: null,
    office: null,
    category: null,
    technician: null,
    ...overrides,
  };
}

describe("GET /api/reports/summary", () => {
  beforeEach(() => {
    verifyAccessToken.mockReset();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.ticket.findMany.mockReset();
    mockPrisma.ticket.findMany.mockResolvedValue([]);
    mockPrisma.ticket.groupBy.mockReset();
    mockPrisma.ticket.groupBy.mockResolvedValue([]);
    mockPrisma.ticket.count.mockReset();
    mockPrisma.ticket.count.mockResolvedValue(0);
    mockPrisma.category.findMany.mockReset();
    mockPrisma.category.findMany.mockResolvedValue([]);
    mockPrisma.office.findMany.mockReset();
    mockPrisma.office.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockReset();
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.user.findUnique.mockReset();
    verifyAccessToken.mockReturnValue({ sub: "admin-id", role: "ADMIN" });
    mockPrisma.user.findUnique.mockResolvedValue(adminUser);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("returns 200 with valid period 1m", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([]);
    mockPrisma.ticket.groupBy.mockResolvedValue([]);
    mockPrisma.category.findMany.mockResolvedValue([]);
    mockPrisma.office.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/reports/summary?period=1m")
      .set("Cookie", authCookie());

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("period", "1m");
    expect(res.body.data).toHaveProperty("total", 0);
    expect(res.body.data).toHaveProperty("pending", 0);
    expect(res.body.data).toHaveProperty("inProgress", 0);
    expect(res.body.data).toHaveProperty("awaitingPurchase", 0);
    expect(res.body.data).toHaveProperty("resolved", 0);
    expect(res.body.data).toHaveProperty("closed", 0);
    expect(res.body.data).toHaveProperty("requestsByOffice");
    expect(res.body.data).toHaveProperty("requestsByCategory");
    expect(res.body.data).toHaveProperty("technicianWorkload");
    expect(res.body.data).toHaveProperty("averageResolutionTimeHours", 0);
    expect(res.body.data).toHaveProperty("slaPercentage", 0);
    expect(res.body.data).toHaveProperty("averageSatisfactionRating", 0);
    expect(res.body.data).toHaveProperty("ratingDistribution");
  });

  test("returns 400 for invalid period", async () => {
    const res = await request(app)
      .get("/api/reports/summary?period=2m")
      .set("Cookie", authCookie());
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid period/i);
  });

  test("defaults to 1m when no period provided", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/reports/summary")
      .set("Cookie", authCookie());

    expect(res.status).toBe(200);
    expect(res.body.data.period).toBe("1m");
  });

  test.each(["1m", "3m", "6m", "9m", "1y"])(
    "accepts period %s",
    async (period) => {
      mockPrisma.ticket.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get(`/api/reports/summary?period=${period}`)
        .set("Cookie", authCookie());

      expect(res.status).toBe(200);
      expect(res.body.data.period).toBe(period);
    },
  );

  test("calculates startDate correctly for 1m period", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([]);

    const beforeRequest = new Date();
    await request(app)
      .get("/api/reports/summary?period=1m")
      .set("Cookie", authCookie());
    const afterRequest = new Date();

    const calledWhere = mockPrisma.ticket.findMany.mock.calls[0][0].where;
    const startDate = calledWhere.createdAt.gte;

    const expectedMin = new Date(beforeRequest);
    expectedMin.setMonth(expectedMin.getMonth() - 1);
    const expectedMax = new Date(afterRequest);
    expectedMax.setMonth(expectedMax.getMonth() - 1);

    expect(startDate.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime() - 1000);
    expect(startDate.getTime()).toBeLessThanOrEqual(expectedMax.getTime() + 1000);
  });

  test("calculates startDate correctly for 1y period", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([]);

    const beforeRequest = new Date();
    await request(app)
      .get("/api/reports/summary?period=1y")
      .set("Cookie", authCookie());
    const afterRequest = new Date();

    const calledWhere = mockPrisma.ticket.findMany.mock.calls[0][0].where;
    const startDate = calledWhere.createdAt.gte;

    expect(startDate).toBeInstanceOf(Date);

    const expected = new Date(beforeRequest);
    expected.setMonth(expected.getMonth() - 12);

    expect(startDate.getFullYear()).toBe(expected.getFullYear());
    expect(startDate.getMonth()).toBe(expected.getMonth());
  });

  test("counts statuses correctly", async () => {
    const statusGroups = [
      { status: "PENDING", _count: { status: 2 } },
      { status: "IN_PROGRESS", _count: { status: 1 } },
      { status: "RESOLVED", _count: { status: 1 } },
      { status: "CLOSED", _count: { status: 1 } },
      { status: "AWAITING_PURCHASE", _count: { status: 1 } },
    ];
    mockPrisma.ticket.groupBy.mockResolvedValueOnce(statusGroups);
    mockPrisma.category.findMany.mockResolvedValue([]);
    mockPrisma.office.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/reports/summary?period=1m")
      .set("Cookie", authCookie());

    expect(res.body.data.total).toBe(6);
    expect(res.body.data.pending).toBe(2);
    expect(res.body.data.inProgress).toBe(1);
    expect(res.body.data.resolved).toBe(1);
    expect(res.body.data.closed).toBe(1);
    expect(res.body.data.awaitingPurchase).toBe(1);
  });

  test("aggregates requests by office", async () => {
    const officeGroups = [
      { officeId: "o1", _count: { officeId: 2 } },
      { officeId: "o2", _count: { officeId: 1 } },
    ];
    mockPrisma.ticket.groupBy.mockImplementation(({ by }) => {
      if (by?.includes("officeId")) return Promise.resolve(officeGroups);
      return Promise.resolve([]);
    });
    mockPrisma.office.findMany.mockResolvedValue([
      { id: "o1", nameEn: "Finance", nameAm: "ፋይናንስ" },
      { id: "o2", nameEn: "HR", nameAm: "ሐአር" },
    ]);
    mockPrisma.category.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/reports/summary?period=1m")
      .set("Cookie", authCookie());

    expect(res.body.data.requestsByOffice).toHaveLength(2);
    expect(res.body.data.requestsByOffice).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ office: "Finance", count: 2 }),
        expect.objectContaining({ office: "HR", count: 1 }),
      ]),
    );
  });

  test("aggregates requests by category", async () => {
    const categoryGroups = [
      { categoryId: "c1", _count: { categoryId: 2 } },
      { categoryId: "c2", _count: { categoryId: 1 } },
    ];
    mockPrisma.ticket.groupBy.mockImplementation(({ by }) => {
      if (by?.includes("categoryId")) return Promise.resolve(categoryGroups);
      return Promise.resolve([]);
    });
    mockPrisma.category.findMany.mockResolvedValue([
      { id: "c1", nameEn: "Hardware", nameAm: "ሀርድዌር" },
      { id: "c2", nameEn: "Software", nameAm: "ሶፍትዌር" },
    ]);
    mockPrisma.office.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/reports/summary?period=1m")
      .set("Cookie", authCookie());

    expect(res.body.data.requestsByCategory).toHaveLength(2);
    expect(res.body.data.requestsByCategory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: "Hardware", count: 2 }),
        expect.objectContaining({ category: "Software", count: 1 }),
      ]),
    );
  });

  test("aggregates technician workload", async () => {
    const techGroups = [
      { technicianId: "tech1", _count: { technicianId: 2 } },
      { technicianId: "tech2", _count: { technicianId: 1 } },
    ];
    mockPrisma.ticket.groupBy.mockImplementation(({ by }) => {
      if (by?.includes("technicianId")) return Promise.resolve(techGroups);
      return Promise.resolve([]);
    });
    mockPrisma.user.findMany.mockResolvedValue([
      { id: "tech1", fullName: "Alice" },
      { id: "tech2", fullName: "Bob" },
    ]);
    mockPrisma.category.findMany.mockResolvedValue([]);
    mockPrisma.office.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/reports/summary?period=1m")
      .set("Cookie", authCookie());

    expect(res.body.data.technicianWorkload).toHaveLength(2);
    expect(res.body.data.technicianWorkload).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ technician: "Alice", count: 2 }),
        expect.objectContaining({ technician: "Bob", count: 1 }),
      ]),
    );
  });

  test("calculates average resolution time in hours", async () => {
    const baseDate = new Date();
    const createdDate = new Date(baseDate.getTime() - 24 * 60 * 60 * 1000);
    const tickets = [
      makeTicket({
        status: "RESOLVED",
        createdAt: createdDate,
        resolvedAt: new Date(createdDate.getTime() + 2 * 60 * 60 * 1000),
      }),
      makeTicket({
        status: "CLOSED",
        createdAt: createdDate,
        resolvedAt: new Date(createdDate.getTime() + 12 * 60 * 60 * 1000),
      }),
    ];
    mockPrisma.ticket.findMany.mockResolvedValue(tickets);
    mockPrisma.category.findMany.mockResolvedValue([]);
    mockPrisma.office.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/reports/summary?period=1m")
      .set("Cookie", authCookie());

    expect(res.body.data.averageResolutionTimeHours).toBe(7);
  });

  test("calculates SLA percentage (24h threshold)", async () => {
    const baseDate = new Date();
    const createdDate = new Date(baseDate.getTime() - 24 * 60 * 60 * 1000);
    const tickets = [
      makeTicket({
        status: "RESOLVED",
        createdAt: createdDate,
        resolvedAt: new Date(createdDate.getTime() + 2 * 60 * 60 * 1000),
        categoryId: "cat1",
      }),
      makeTicket({
        status: "CLOSED",
        createdAt: createdDate,
        resolvedAt: new Date(createdDate.getTime() + 12 * 60 * 60 * 1000),
        categoryId: "cat1",
      }),
      makeTicket({
        status: "RESOLVED",
        createdAt: createdDate,
        resolvedAt: new Date(createdDate.getTime() + 48 * 60 * 60 * 1000),
        categoryId: "cat1",
      }),
    ];
    mockPrisma.ticket.findMany.mockResolvedValue(tickets);
    mockPrisma.category.findMany.mockResolvedValue([
      { id: "cat1", expectedResolutionHours: 24 },
    ]);
    mockPrisma.office.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/reports/summary?period=1m")
      .set("Cookie", authCookie());

    expect(res.body.data.slaPercentage).toBe(66.67);
  });

  test("calculates satisfaction rating and distribution", async () => {
    const ratingGroups = [
      { rating: 5, _count: { rating: 1 } },
      { rating: 4, _count: { rating: 1 } },
      { rating: 3, _count: { rating: 2 } },
    ];
    const ratedTickets = [
      { rating: 5 },
      { rating: 4 },
      { rating: 3 },
      { rating: 3 },
    ];
    mockPrisma.ticket.groupBy.mockImplementation(({ by }) => {
      if (by?.includes("rating")) return Promise.resolve(ratingGroups);
      return Promise.resolve([]);
    });
    mockPrisma.ticket.findMany.mockImplementation(({ where }) => {
      if (where?.rating) return Promise.resolve(ratedTickets);
      return Promise.resolve([]);
    });
    mockPrisma.category.findMany.mockResolvedValue([]);
    mockPrisma.office.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/reports/summary?period=1m")
      .set("Cookie", authCookie());

    expect(res.body.data.averageSatisfactionRating).toBeCloseTo(3.75, 1);
    expect(res.body.data.ratingDistribution).toEqual({
      5: 1,
      4: 1,
      3: 2,
      2: 0,
      1: 0,
    });
  });

  test("handles empty results with zeros", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/reports/summary?period=1m")
      .set("Cookie", authCookie());

    expect(res.body.data.total).toBe(0);
    expect(res.body.data.pending).toBe(0);
    expect(res.body.data.requestsByOffice).toEqual([]);
    expect(res.body.data.requestsByCategory).toEqual([]);
    expect(res.body.data.technicianWorkload).toEqual([]);
    expect(res.body.data.averageResolutionTimeHours).toBe(0);
    expect(res.body.data.slaPercentage).toBe(0);
    expect(res.body.data.averageSatisfactionRating).toBe(0);
  });

  test("skips tickets without office in office aggregation", async () => {
    const officeGroups = [
      { officeId: "o1", _count: { officeId: 1 } },
    ];
    mockPrisma.ticket.groupBy.mockImplementation(({ by }) => {
      if (by?.includes("officeId")) return Promise.resolve(officeGroups);
      return Promise.resolve([]);
    });
    mockPrisma.office.findMany.mockResolvedValue([
      { id: "o1", nameEn: "IT", nameAm: "IT" },
    ]);

    const res = await request(app)
      .get("/api/reports/summary?period=1m")
      .set("Cookie", authCookie());

    expect(res.body.data.requestsByOffice).toHaveLength(1);
    expect(res.body.data.requestsByOffice[0].count).toBe(1);
  });

  test("skips tickets without technician in workload", async () => {
    const techGroups = [
      { technicianId: "tech1", _count: { technicianId: 1 } },
    ];
    mockPrisma.ticket.groupBy.mockImplementation(({ by }) => {
      if (by?.includes("technicianId")) return Promise.resolve(techGroups);
      return Promise.resolve([]);
    });
    mockPrisma.user.findMany.mockResolvedValue([
      {
        id: "tech1",
        fullName: "Alice",
        name: "Alice",
        email: "a@t.com",
      },
    ]);

    const res = await request(app)
      .get("/api/reports/summary?period=1m")
      .set("Cookie", authCookie());

    expect(res.body.data.technicianWorkload).toHaveLength(1);
  });

  test("skips tickets without resolvedAt in resolution time", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/reports/summary?period=1m")
      .set("Cookie", authCookie());

    expect(res.body.data.averageResolutionTimeHours).toBe(0);
  });
});

describe("authentication and authorization", () => {
  beforeEach(() => {
    verifyAccessToken.mockReset();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.ticket.findMany.mockReset();
    mockPrisma.ticket.findMany.mockResolvedValue([]);
  });

  test("returns 401 when no token is provided", async () => {
    const res = await request(app).get("/api/reports/summary?period=1m");
    expect(res.status).toBe(401);
  });

  test("returns 401 when token is invalid", async () => {
    const authError = new Error("Invalid token");
    authError.statusCode = 401;
    verifyAccessToken.mockImplementation(() => {
      throw authError;
    });

    const res = await request(app)
      .get("/api/reports/summary?period=1m")
      .set("Cookie", "accessToken=invalid-token");

    expect(res.status).toBe(401);
  });

  test("returns 403 when user is not ADMIN", async () => {
    verifyAccessToken.mockReturnValue({ sub: "emp-id", role: "EMPLOYEE" });
    mockPrisma.user.findUnique.mockResolvedValue(employeeUser);

    const res = await request(app)
      .get("/api/reports/summary?period=1m")
      .set("Cookie", "accessToken=fake-token");

    expect(res.status).toBe(403);
  });

  test("returns 403 when user is TECHNICIAN", async () => {
    const techUser = { ...employeeUser, role: "TECHNICIAN" };
    verifyAccessToken.mockReturnValue({ sub: "tech-id", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(techUser);

    const res = await request(app)
      .get("/api/reports/summary?period=1m")
      .set("Cookie", "accessToken=fake-token");

    expect(res.status).toBe(403);
  });

  test("returns 200 when user is ADMIN", async () => {
    verifyAccessToken.mockReturnValue({ sub: "admin-id", role: "ADMIN" });
    mockPrisma.user.findUnique.mockResolvedValue(adminUser);

    const res = await request(app)
      .get("/api/reports/summary?period=1m")
      .set("Cookie", "accessToken=fake-token");

    expect(res.status).toBe(200);
  });
});
