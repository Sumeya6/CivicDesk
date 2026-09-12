const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");

const mockPrisma = {
  announcement: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
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
const announcementRoutes = require("../src/routes/announcement.routes");
const errorHandler = require("../src/middleware/error.middleware");

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/announcements", announcementRoutes);
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

const mockAnnouncement = {
  id: "ann-1",
  title: "Test Announcement",
  content: "Some content",
  authorId: "admin-id",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("GET /api/announcements", () => {
  beforeEach(() => {
    mockPrisma.announcement.findMany.mockResolvedValue([mockAnnouncement]);
  });

  test("returns 200 without authentication", async () => {
    const res = await request(app).get("/api/announcements");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
  });
});

describe("POST /api/announcements", () => {
  beforeEach(() => {
    verifyAccessToken.mockReset();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.announcement.create.mockReset();
    mockPrisma.user.findUnique.mockResolvedValue(adminUser);
    mockPrisma.announcement.create.mockResolvedValue(mockAnnouncement);
  });

  test("rejects unauthenticated request with 401", async () => {
    const res = await request(app)
      .post("/api/announcements")
      .send({ title: "Test", content: "Content" });

    expect(res.status).toBe(401);
  });

  test("rejects authenticated non-admin with 403", async () => {
    verifyAccessToken.mockReturnValue({ sub: "emp-id", role: "EMPLOYEE" });
    mockPrisma.user.findUnique.mockResolvedValue(employeeUser);

    const res = await request(app)
      .post("/api/announcements")
      .set("Cookie", "accessToken=fake-token")
      .send({ title: "Test", content: "Content" });

    expect(res.status).toBe(403);
  });

  test("allows authenticated ADMIN to create announcement", async () => {
    verifyAccessToken.mockReturnValue({ sub: "admin-id", role: "ADMIN" });

    const res = await request(app)
      .post("/api/announcements")
      .set("Cookie", "accessToken=fake-token")
      .send({ title: "Test Announcement", content: "Content body" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("title", "Test Announcement");
  });

  test("uses authenticated user's id as authorId, not body authorId", async () => {
    verifyAccessToken.mockReturnValue({ sub: "admin-id", role: "ADMIN" });

    await request(app)
      .post("/api/announcements")
      .set("Cookie", "accessToken=fake-token")
      .send({
        title: "Test",
        content: "Content",
        authorId: "fake-id-should-be-ignored",
      });

    expect(mockPrisma.announcement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        authorId: "admin-id",
      }),
    });
  });

  test("returns 400 when title is missing", async () => {
    verifyAccessToken.mockReturnValue({ sub: "admin-id", role: "ADMIN" });

    const res = await request(app)
      .post("/api/announcements")
      .set("Cookie", "accessToken=fake-token")
      .send({ content: "Content only" });

    expect(res.status).toBe(400);
  });

  test("returns 400 when content is missing", async () => {
    verifyAccessToken.mockReturnValue({ sub: "admin-id", role: "ADMIN" });

    const res = await request(app)
      .post("/api/announcements")
      .set("Cookie", "accessToken=fake-token")
      .send({ title: "Title only" });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/announcements/:id", () => {
  beforeEach(() => {
    verifyAccessToken.mockReset();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.announcement.findUnique.mockReset();
    mockPrisma.announcement.delete.mockReset();

    mockPrisma.user.findUnique.mockResolvedValue(adminUser);
    mockPrisma.announcement.findUnique.mockResolvedValue(mockAnnouncement);
    mockPrisma.announcement.delete.mockResolvedValue(mockAnnouncement);
  });

  test("rejects unauthenticated delete with 401", async () => {
    const res = await request(app).delete("/api/announcements/ann-1");

    expect(res.status).toBe(401);
  });

  test("rejects authenticated non-admin delete with 403", async () => {
    verifyAccessToken.mockReturnValue({ sub: "emp-id", role: "EMPLOYEE" });
    mockPrisma.user.findUnique.mockResolvedValue(employeeUser);

    const res = await request(app)
      .delete("/api/announcements/ann-1")
      .set("Cookie", "accessToken=fake-token");

    expect(res.status).toBe(403);
  });

  test("allows authenticated ADMIN to delete announcement", async () => {
    verifyAccessToken.mockReturnValue({ sub: "admin-id", role: "ADMIN" });

    const res = await request(app)
      .delete("/api/announcements/ann-1")
      .set("Cookie", "accessToken=fake-token");

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  test("returns 404 when announcement does not exist", async () => {
    verifyAccessToken.mockReturnValue({ sub: "admin-id", role: "ADMIN" });
    mockPrisma.announcement.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/announcements/nonexistent")
      .set("Cookie", "accessToken=fake-token");

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/announcements/:id", () => {
  beforeEach(() => {
    verifyAccessToken.mockReset();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.announcement.findUnique.mockReset();
    mockPrisma.announcement.update.mockReset();

    mockPrisma.user.findUnique.mockResolvedValue(adminUser);
    mockPrisma.announcement.findUnique.mockResolvedValue(mockAnnouncement);
    mockPrisma.announcement.update.mockResolvedValue({
      ...mockAnnouncement,
      title: "Updated",
    });
  });

  test("rejects unauthenticated update with 401", async () => {
    const res = await request(app)
      .put("/api/announcements/ann-1")
      .send({ title: "Updated" });

    expect(res.status).toBe(401);
  });

  test("rejects authenticated non-admin update with 403", async () => {
    verifyAccessToken.mockReturnValue({ sub: "emp-id", role: "EMPLOYEE" });
    mockPrisma.user.findUnique.mockResolvedValue(employeeUser);

    const res = await request(app)
      .put("/api/announcements/ann-1")
      .set("Cookie", "accessToken=fake-token")
      .send({ title: "Updated" });

    expect(res.status).toBe(403);
  });

  test("allows authenticated ADMIN to update announcement", async () => {
    verifyAccessToken.mockReturnValue({ sub: "admin-id", role: "ADMIN" });

    const res = await request(app)
      .put("/api/announcements/ann-1")
      .set("Cookie", "accessToken=fake-token")
      .send({ title: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated");
  });
});

describe("no hardcoded AUTHOR_ID", () => {
  beforeEach(() => {
    verifyAccessToken.mockReset();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.announcement.create.mockReset();
  });

  test("createAnnouncement uses req.user.id from auth middleware", async () => {
    const differentAdminId = "admin-unique-xyz";
    verifyAccessToken.mockReturnValue({
      sub: differentAdminId,
      role: "ADMIN",
    });

    mockPrisma.user.findUnique.mockResolvedValue({
      ...adminUser,
      id: differentAdminId,
    });
    mockPrisma.announcement.create.mockResolvedValue({
      ...mockAnnouncement,
      authorId: differentAdminId,
    });

    await request(app)
      .post("/api/announcements")
      .set("Cookie", "accessToken=fake-token")
      .send({ title: "Test", content: "Content" });

    expect(mockPrisma.announcement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        authorId: differentAdminId,
      }),
    });
  });
});
