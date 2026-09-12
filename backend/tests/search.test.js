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

const searchRoutes = require("../src/routes/search.routes");
const errorHandler = require("../src/middleware/error.middleware");

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/tickets", searchRoutes);
  app.use(errorHandler);
  return app;
}

const app = createApp();

describe("GET /api/tickets/search", () => {
  let capturedWhere;

  beforeEach(() => {
    capturedWhere = null;
    mockPrisma.ticket.findMany.mockReset();
    mockPrisma.ticket.count.mockReset();

    mockPrisma.ticket.findMany.mockImplementation(({ where } = {}) => {
      capturedWhere = where || null;
      return Promise.resolve([]);
    });
    mockPrisma.ticket.count.mockResolvedValue(0);
  });

  describe("response shape", () => {
    test("returns data, totalCount, totalPages, currentPage", async () => {
      const res = await request(app).get("/api/tickets/search");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("totalCount");
      expect(res.body).toHaveProperty("totalPages");
      expect(res.body).toHaveProperty("currentPage");
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test("does NOT return old pagination structure", async () => {
      const res = await request(app).get("/api/tickets/search");

      expect(res.body.pagination).toBeUndefined();
    });
  });

  describe("pagination", () => {
    test("defaults to page 1 and limit 10", async () => {
      mockPrisma.ticket.count.mockResolvedValue(25);

      const res = await request(app).get("/api/tickets/search");

      expect(res.body.currentPage).toBe(1);
      expect(res.body.totalPages).toBe(3);
      const findManyCall = mockPrisma.ticket.findMany.mock.calls[0][0];
      expect(findManyCall.skip).toBe(0);
      expect(findManyCall.take).toBe(10);
    });

    test("respects page and limit params", async () => {
      mockPrisma.ticket.count.mockResolvedValue(50);

      await request(app).get("/api/tickets/search?page=2&limit=5");

      const findManyCall = mockPrisma.ticket.findMany.mock.calls[0][0];
      expect(findManyCall.skip).toBe(5);
      expect(findManyCall.take).toBe(5);
    });

    test("calculates totalPages correctly", async () => {
      mockPrisma.ticket.count.mockResolvedValue(25);

      const res = await request(app).get("/api/tickets/search?limit=10");
      expect(res.body.totalPages).toBe(3);
    });

    test("clamps limit to max 100", async () => {
      await request(app).get("/api/tickets/search?limit=200");

      const findManyCall = mockPrisma.ticket.findMany.mock.calls[0][0];
      expect(findManyCall.take).toBe(100);
    });

    test("defaults limit to 10 when invalid", async () => {
      await request(app).get("/api/tickets/search?limit=0");

      const findManyCall = mockPrisma.ticket.findMany.mock.calls[0][0];
      expect(findManyCall.take).toBe(10);
    });

    test("clamps page to min 1", async () => {
      await request(app).get("/api/tickets/search?page=0");

      const findManyCall = mockPrisma.ticket.findMany.mock.calls[0][0];
      expect(findManyCall.skip).toBe(0);
    });
  });

  describe("individual filters", () => {
    test("filters by employeeId", async () => {
      await request(app).get("/api/tickets/search?employeeId=emp123");
      expect(capturedWhere.employeeId).toBe("emp123");
    });

    test("filters by technicianId", async () => {
      await request(app).get("/api/tickets/search?technicianId=tech456");
      expect(capturedWhere.technicianId).toBe("tech456");
    });

    test("filters by officeId", async () => {
      await request(app).get("/api/tickets/search?officeId=off789");
      expect(capturedWhere.officeId).toBe("off789");
    });

    test("filters by status", async () => {
      await request(app).get("/api/tickets/search?status=RESOLVED");
      expect(capturedWhere.status).toBe("RESOLVED");
    });

    test("filters by priority", async () => {
      await request(app).get("/api/tickets/search?priority=HIGH");
      expect(capturedWhere.priority).toBe("HIGH");
    });

    test("filters by categoryId", async () => {
      await request(app).get("/api/tickets/search?categoryId=cat999");
      expect(capturedWhere.categoryId).toBe("cat999");
    });
  });

  describe("date filters", () => {
    test("filters by startDate at start of day", async () => {
      await request(app).get("/api/tickets/search?startDate=2026-09-01");

      expect(capturedWhere.createdAt).toBeDefined();
      expect(capturedWhere.createdAt.gte).toEqual(expect.any(Date));

      const gte = capturedWhere.createdAt.gte;
      expect(gte.getHours()).toBe(0);
      expect(gte.getMinutes()).toBe(0);
      expect(gte.getSeconds()).toBe(0);
      expect(gte.getMilliseconds()).toBe(0);
    });

    test("filters by endDate and includes entire day", async () => {
      await request(app).get("/api/tickets/search?endDate=2026-09-10");

      expect(capturedWhere.createdAt).toBeDefined();
      expect(capturedWhere.createdAt.lte).toEqual(expect.any(Date));

      const lte = capturedWhere.createdAt.lte;
      expect(lte.getHours()).toBe(23);
      expect(lte.getMinutes()).toBe(59);
      expect(lte.getSeconds()).toBe(59);
      expect(lte.getMilliseconds()).toBe(999);
    });

    test("combines startDate and endDate", async () => {
      await request(app).get(
        "/api/tickets/search?startDate=2026-09-01&endDate=2026-09-10",
      );

      expect(capturedWhere.createdAt.gte).toEqual(expect.any(Date));
      expect(capturedWhere.createdAt.lte).toEqual(expect.any(Date));
      expect(capturedWhere.createdAt.lte.getHours()).toBe(23);
    });

    test("does not create createdAt filter when no dates provided", async () => {
      await request(app).get("/api/tickets/search");

      expect(capturedWhere).not.toHaveProperty("createdAt");
    });
  });

  describe("q free-text search", () => {
    test("creates OR filter across title, description, deviceOrSystem", async () => {
      await request(app).get("/api/tickets/search?q=printer");

      expect(capturedWhere.OR).toEqual([
        { title: { contains: "printer", mode: "insensitive" } },
        { description: { contains: "printer", mode: "insensitive" } },
        { deviceOrSystem: { contains: "printer", mode: "insensitive" } },
      ]);
    });

    test("does not create OR filter when q is empty string", async () => {
      await request(app).get("/api/tickets/search?q=");

      expect(capturedWhere.OR).toBeUndefined();
    });

    test("does not create OR filter when q is not provided", async () => {
      await request(app).get("/api/tickets/search");

      expect(capturedWhere.OR).toBeUndefined();
    });

    test("q uses case-insensitive mode for Amharic text", async () => {
      await request(app).get("/api/tickets/search?q=%E0%A8%AA%E0%A8%B0%E0%A8%BF%E0%A8%A3%E0%A8%9F%E0%A8%B0");

      expect(capturedWhere.OR).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: { contains: expect.any(String), mode: "insensitive" },
          }),
        ]),
      );
    });
  });

  describe("filter combinations", () => {
    test("status + priority", async () => {
      await request(app).get(
        "/api/tickets/search?status=PENDING&priority=HIGH",
      );

      expect(capturedWhere.status).toBe("PENDING");
      expect(capturedWhere.priority).toBe("HIGH");
    });

    test("officeId + categoryId", async () => {
      await request(app).get(
        "/api/tickets/search?officeId=o1&categoryId=c1",
      );

      expect(capturedWhere.officeId).toBe("o1");
      expect(capturedWhere.categoryId).toBe("c1");
    });

    test("technicianId + date range", async () => {
      await request(app).get(
        "/api/tickets/search?technicianId=tech1&startDate=2026-09-01&endDate=2026-09-30",
      );

      expect(capturedWhere.technicianId).toBe("tech1");
      expect(capturedWhere.createdAt.gte).toEqual(expect.any(Date));
      expect(capturedWhere.createdAt.lte).toEqual(expect.any(Date));
    });

    test("employeeId + status + priority", async () => {
      await request(app).get(
        "/api/tickets/search?employeeId=emp1&status=IN_PROGRESS&priority=CRITICAL",
      );

      expect(capturedWhere.employeeId).toBe("emp1");
      expect(capturedWhere.status).toBe("IN_PROGRESS");
      expect(capturedWhere.priority).toBe("CRITICAL");
    });

    test("q + status", async () => {
      await request(app).get("/api/tickets/search?q=laptop&status=PENDING");

      expect(capturedWhere.OR).toBeDefined();
      expect(capturedWhere.status).toBe("PENDING");
    });

    test("multiple filters + pagination", async () => {
      mockPrisma.ticket.count.mockResolvedValue(50);

      await request(app).get(
        "/api/tickets/search?status=RESOLVED&officeId=o1&priority=MEDIUM&page=2&limit=5",
      );

      expect(capturedWhere.status).toBe("RESOLVED");
      expect(capturedWhere.officeId).toBe("o1");
      expect(capturedWhere.priority).toBe("MEDIUM");

      const findManyCall = mockPrisma.ticket.findMany.mock.calls[0][0];
      expect(findManyCall.skip).toBe(5);
      expect(findManyCall.take).toBe(5);
    });
  });

  describe("returns actual data", () => {
    test("returns tickets and count from prisma", async () => {
      const mockTickets = [
        { id: "t1", title: "A" },
        { id: "t2", title: "B" },
      ];
      mockPrisma.ticket.findMany.mockResolvedValue(mockTickets);
      mockPrisma.ticket.count.mockResolvedValue(2);

      const res = await request(app).get("/api/tickets/search");

      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].id).toBe("t1");
      expect(res.body.data[1].id).toBe("t2");
      expect(res.body.totalCount).toBe(2);
    });
  });
});
