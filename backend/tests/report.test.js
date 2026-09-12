const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");

const mockPrisma = {
  ticket: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock("../src/config/db", () => ({
  prisma: mockPrisma,
}));

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
    mockPrisma.ticket.findMany.mockClear();
    mockPrisma.ticket.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("returns 200 with valid period 1m", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([]);

    const res = await request(app).get("/api/reports/summary?period=1m");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("period", "1m");
    expect(res.body).toHaveProperty("total", 0);
    expect(res.body).toHaveProperty("pending", 0);
    expect(res.body).toHaveProperty("inProgress", 0);
    expect(res.body).toHaveProperty("awaitingPurchase", 0);
    expect(res.body).toHaveProperty("resolved", 0);
    expect(res.body).toHaveProperty("closed", 0);
    expect(res.body).toHaveProperty("requestsByOffice");
    expect(res.body).toHaveProperty("requestsByCategory");
    expect(res.body).toHaveProperty("technicianWorkload");
    expect(res.body).toHaveProperty("averageResolutionTimeHours", 0);
    expect(res.body).toHaveProperty("slaPercentage", 0);
    expect(res.body).toHaveProperty("averageSatisfactionRating", 0);
    expect(res.body).toHaveProperty("ratingDistribution");
  });

  test("returns 400 for invalid period", async () => {
    const res = await request(app).get("/api/reports/summary?period=2m");
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid period/i);
  });

  test("defaults to 1m when no period provided", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([]);

    const res = await request(app).get("/api/reports/summary");

    expect(res.status).toBe(200);
    expect(res.body.period).toBe("1m");
  });

  test.each(["1m", "3m", "6m", "9m", "1y"])(
    "accepts period %s",
    async (period) => {
      mockPrisma.ticket.findMany.mockResolvedValue([]);

      const res = await request(app).get(
        `/api/reports/summary?period=${period}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.period).toBe(period);
    },
  );

  test("calculates startDate correctly for 1m period", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([]);

    const beforeRequest = new Date();
    await request(app).get("/api/reports/summary?period=1m");
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
    await request(app).get("/api/reports/summary?period=1y");
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
    const tickets = [
      makeTicket({ status: "PENDING" }),
      makeTicket({ status: "PENDING" }),
      makeTicket({ status: "IN_PROGRESS" }),
      makeTicket({ status: "RESOLVED" }),
      makeTicket({ status: "CLOSED" }),
      makeTicket({ status: "AWAITING_PURCHASE" }),
    ];
    mockPrisma.ticket.findMany.mockResolvedValue(tickets);

    const res = await request(app).get("/api/reports/summary?period=1m");

    expect(res.body.total).toBe(6);
    expect(res.body.pending).toBe(2);
    expect(res.body.inProgress).toBe(1);
    expect(res.body.resolved).toBe(1);
    expect(res.body.closed).toBe(1);
    expect(res.body.awaitingPurchase).toBe(1);
  });

  test("aggregates requests by office", async () => {
    const tickets = [
      makeTicket({
        office: { id: "o1", nameEn: "Finance", nameAm: "ፋይናንስ" },
      }),
      makeTicket({
        office: { id: "o1", nameEn: "Finance", nameAm: "ፋይናንስ" },
      }),
      makeTicket({
        office: { id: "o2", nameEn: "HR", nameAm: "ሐአር" },
      }),
    ];
    mockPrisma.ticket.findMany.mockResolvedValue(tickets);

    const res = await request(app).get("/api/reports/summary?period=1m");

    expect(res.body.requestsByOffice).toHaveLength(2);
    expect(res.body.requestsByOffice).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ office: "Finance", count: 2 }),
        expect.objectContaining({ office: "HR", count: 1 }),
      ]),
    );
  });

  test("aggregates requests by category", async () => {
    const tickets = [
      makeTicket({
        category: { id: "c1", nameEn: "Hardware", nameAm: "ሀርድዌር" },
      }),
      makeTicket({
        category: { id: "c1", nameEn: "Hardware", nameAm: "ሀርድዌር" },
      }),
      makeTicket({
        category: { id: "c2", nameEn: "Software", nameAm: "ሶፍትዌር" },
      }),
    ];
    mockPrisma.ticket.findMany.mockResolvedValue(tickets);

    const res = await request(app).get("/api/reports/summary?period=1m");

    expect(res.body.requestsByCategory).toHaveLength(2);
    expect(res.body.requestsByCategory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: "Hardware", count: 2 }),
        expect.objectContaining({ category: "Software", count: 1 }),
      ]),
    );
  });

  test("aggregates technician workload", async () => {
    const tickets = [
      makeTicket({
        status: "IN_PROGRESS",
        technician: {
          id: "tech1",
          fullName: "Alice",
          name: "Alice",
          email: "alice@test.com",
        },
      }),
      makeTicket({
        status: "RESOLVED",
        technician: {
          id: "tech1",
          fullName: "Alice",
          name: "Alice",
          email: "alice@test.com",
        },
      }),
      makeTicket({
        status: "PENDING",
        technician: {
          id: "tech2",
          fullName: "Bob",
          name: "Bob",
          email: "bob@test.com",
        },
      }),
    ];
    mockPrisma.ticket.findMany.mockResolvedValue(tickets);

    const res = await request(app).get("/api/reports/summary?period=1m");

    expect(res.body.technicianWorkload).toHaveLength(2);
    expect(res.body.technicianWorkload).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ technician: "Alice", count: 2 }),
        expect.objectContaining({ technician: "Bob", count: 1 }),
      ]),
    );
  });

  test("calculates average resolution time in hours", async () => {
    const baseDate = new Date("2026-09-01T08:00:00Z");
    const tickets = [
      makeTicket({
        status: "RESOLVED",
        createdAt: baseDate,
        resolvedAt: new Date("2026-09-01T10:00:00Z"),
      }),
      makeTicket({
        status: "CLOSED",
        createdAt: baseDate,
        resolvedAt: new Date("2026-09-01T20:00:00Z"),
      }),
    ];
    mockPrisma.ticket.findMany.mockResolvedValue(tickets);

    const res = await request(app).get("/api/reports/summary?period=1m");

    expect(res.body.averageResolutionTimeHours).toBe(7);
  });

  test("calculates SLA percentage (24h threshold)", async () => {
    const baseDate = new Date("2026-09-01T08:00:00Z");
    const tickets = [
      makeTicket({
        status: "RESOLVED",
        createdAt: baseDate,
        resolvedAt: new Date("2026-09-01T10:00:00Z"),
      }),
      makeTicket({
        status: "CLOSED",
        createdAt: baseDate,
        resolvedAt: new Date("2026-09-01T20:00:00Z"),
      }),
      makeTicket({
        status: "RESOLVED",
        createdAt: baseDate,
        resolvedAt: new Date("2026-09-02T12:00:00Z"),
      }),
    ];
    mockPrisma.ticket.findMany.mockResolvedValue(tickets);

    const res = await request(app).get("/api/reports/summary?period=1m");

    expect(res.body.slaPercentage).toBe(66.67);
  });

  test("calculates satisfaction rating and distribution", async () => {
    const tickets = [
      makeTicket({ status: "RESOLVED", rating: 5, resolvedAt: new Date() }),
      makeTicket({ status: "RESOLVED", rating: 4, resolvedAt: new Date() }),
      makeTicket({ status: "CLOSED", rating: 3, resolvedAt: new Date() }),
      makeTicket({ status: "RESOLVED", rating: null, resolvedAt: new Date() }),
    ];
    mockPrisma.ticket.findMany.mockResolvedValue(tickets);

    const res = await request(app).get("/api/reports/summary?period=1m");

    expect(res.body.averageSatisfactionRating).toBe(4);
    expect(res.body.ratingDistribution).toEqual({
      5: 1,
      4: 1,
      3: 1,
      2: 0,
      1: 0,
    });
  });

  test("handles empty results with zeros", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([]);

    const res = await request(app).get("/api/reports/summary?period=1m");

    expect(res.body.total).toBe(0);
    expect(res.body.pending).toBe(0);
    expect(res.body.requestsByOffice).toEqual([]);
    expect(res.body.requestsByCategory).toEqual([]);
    expect(res.body.technicianWorkload).toEqual([]);
    expect(res.body.averageResolutionTimeHours).toBe(0);
    expect(res.body.slaPercentage).toBe(0);
    expect(res.body.averageSatisfactionRating).toBe(0);
  });

  test("skips tickets without office in office aggregation", async () => {
    const tickets = [
      makeTicket({ office: null }),
      makeTicket({
        office: { id: "o1", nameEn: "IT", nameAm: "IT" },
      }),
    ];
    mockPrisma.ticket.findMany.mockResolvedValue(tickets);

    const res = await request(app).get("/api/reports/summary?period=1m");

    expect(res.body.requestsByOffice).toHaveLength(1);
    expect(res.body.requestsByOffice[0].count).toBe(1);
  });

  test("skips tickets without technician in workload", async () => {
    const tickets = [
      makeTicket({ technician: null }),
      makeTicket({
        technician: {
          id: "tech1",
          fullName: "Alice",
          name: "Alice",
          email: "a@t.com",
        },
      }),
    ];
    mockPrisma.ticket.findMany.mockResolvedValue(tickets);

    const res = await request(app).get("/api/reports/summary?period=1m");

    expect(res.body.technicianWorkload).toHaveLength(1);
  });

  test("skips tickets without resolvedAt in resolution time", async () => {
    const tickets = [
      makeTicket({
        status: "RESOLVED",
        resolvedAt: null,
      }),
    ];
    mockPrisma.ticket.findMany.mockResolvedValue(tickets);

    const res = await request(app).get("/api/reports/summary?period=1m");

    expect(res.body.averageResolutionTimeHours).toBe(0);
  });
});
