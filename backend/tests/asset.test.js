const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");

const mockPrisma = {
  asset: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

jest.mock("../src/config/db", () => ({ prisma: mockPrisma }));

jest.mock("../src/utils/jwt", () => ({
  verifyAccessToken: jest.fn(),
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  extractBearerToken: jest.fn(),
  getAccessTokenCookieOptions: jest.fn(),
}));

const { verifyAccessToken } = require("../src/utils/jwt");
const assetRoutes = require("../src/routes/asset.routes");
const errorHandler = require("../src/middleware/error.middleware");

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/assets", assetRoutes);
  app.use(errorHandler);
  return app;
}

const app = createApp();

const adminUser = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
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
  id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  fullName: "Employee User",
  phoneNumber: "+0987654321",
  role: "EMPLOYEE",
  officeId: "off1",
  isActive: true,
  preferredLanguage: "EN",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAsset = {
  id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  assetTag: "IT-001",
  name: "Dell Latitude 5540",
  assetType: "COMPUTER",
  serialNumber: "SN-12345",
  status: "ACTIVE",
  officeId: "off1",
  employeeId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  purchaseDate: new Date("2024-01-15"),
  warrantyExpiry: new Date("2027-01-15"),
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  office: { id: "off1", code: "AR-01", nameAm: "አራዳ", nameEn: "Arada" },
  employee: { id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", fullName: "Employee User", phoneNumber: "+0987654321" },
  tickets: [],
};

describe("GET /api/assets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    verifyAccessToken.mockReturnValue({ sub: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", role: "ADMIN" });
    mockPrisma.user.findUnique.mockResolvedValue(adminUser);
    mockPrisma.asset.findMany.mockResolvedValue([mockAsset]);
    mockPrisma.asset.count.mockResolvedValue(1);
  });

  test("returns 200 for authenticated admin", async () => {
    const res = await request(app)
      .get("/api/assets")
      .set("Cookie", "accessToken=fake-token");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].assetTag).toBe("IT-001");
  });

  test("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/assets");
    expect(res.status).toBe(401);
  });

  test("returns 403 for employee", async () => {
    verifyAccessToken.mockReturnValue({ sub: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", role: "EMPLOYEE" });
    mockPrisma.user.findUnique.mockResolvedValue(employeeUser);

    const res = await request(app)
      .get("/api/assets")
      .set("Cookie", "accessToken=fake-token");

    expect(res.status).toBe(403);
  });

  test("supports search query", async () => {
    const res = await request(app)
      .get("/api/assets?search=Dell")
      .set("Cookie", "accessToken=fake-token");

    expect(res.status).toBe(200);
    expect(mockPrisma.asset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ name: expect.objectContaining({ contains: "Dell" }) }),
          ]),
        }),
      }),
    );
  });

  test("supports status filter", async () => {
    const res = await request(app)
      .get("/api/assets?status=ACTIVE")
      .set("Cookie", "accessToken=fake-token");

    expect(res.status).toBe(200);
    expect(mockPrisma.asset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "ACTIVE" }),
      }),
    );
  });
});

describe("GET /api/assets/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    verifyAccessToken.mockReturnValue({ sub: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", role: "ADMIN" });
    mockPrisma.user.findUnique.mockResolvedValue(adminUser);
    mockPrisma.asset.findUnique.mockResolvedValue({ ...mockAsset, tickets: [] });
  });

  test("returns 200 for authenticated admin", async () => {
    const res = await request(app)
      .get("/api/assets/cccccccc-cccc-cccc-cccc-cccccccccccc")
      .set("Cookie", "accessToken=fake-token");

    expect(res.status).toBe(200);
    expect(res.body.data.assetTag).toBe("IT-001");
  });

  test("returns 404 for nonexistent asset", async () => {
    mockPrisma.asset.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/assets/00000000-0000-0000-0000-000000000000")
      .set("Cookie", "accessToken=fake-token");

    expect(res.status).toBe(404);
  });

  test("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/assets/cccccccc-cccc-cccc-cccc-cccccccccccc");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/assets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    verifyAccessToken.mockReturnValue({ sub: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", role: "ADMIN" });
    mockPrisma.user.findUnique.mockResolvedValue(adminUser);
    mockPrisma.asset.create.mockResolvedValue(mockAsset);
  });

  test("allows authenticated ADMIN to create asset", async () => {
    const res = await request(app)
      .post("/api/assets")
      .set("Cookie", "accessToken=fake-token")
      .send({
        assetTag: "IT-001",
        name: "Dell Latitude 5540",
        assetType: "COMPUTER",
        officeId: "off1",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.assetTag).toBe("IT-001");
  });

  test("rejects authenticated employee with 403", async () => {
    verifyAccessToken.mockReturnValue({ sub: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", role: "EMPLOYEE" });
    mockPrisma.user.findUnique.mockResolvedValue(employeeUser);

    const res = await request(app)
      .post("/api/assets")
      .set("Cookie", "accessToken=fake-token")
      .send({
        assetTag: "IT-001",
        name: "Dell Latitude 5540",
        assetType: "COMPUTER",
        officeId: "off1",
      });

    expect(res.status).toBe(403);
  });

  test("returns 401 without authentication", async () => {
    const res = await request(app)
      .post("/api/assets")
      .send({
        assetTag: "IT-001",
        name: "Dell Latitude 5540",
        assetType: "COMPUTER",
        officeId: "off1",
      });

    expect(res.status).toBe(401);
  });

  test("returns 422 when assetTag is missing", async () => {
    const res = await request(app)
      .post("/api/assets")
      .set("Cookie", "accessToken=fake-token")
      .send({
        name: "Dell Latitude 5540",
        assetType: "COMPUTER",
        officeId: "off1",
      });

    expect(res.status).toBe(422);
  });

  test("returns 422 when name is missing", async () => {
    const res = await request(app)
      .post("/api/assets")
      .set("Cookie", "accessToken=fake-token")
      .send({
        assetTag: "IT-001",
        assetType: "COMPUTER",
        officeId: "off1",
      });

    expect(res.status).toBe(422);
  });

  test("returns 422 when officeId is missing", async () => {
    const res = await request(app)
      .post("/api/assets")
      .set("Cookie", "accessToken=fake-token")
      .send({
        assetTag: "IT-001",
        name: "Dell Latitude 5540",
        assetType: "COMPUTER",
      });

    expect(res.status).toBe(422);
  });

  test("returns 422 when assetType is invalid", async () => {
    const res = await request(app)
      .post("/api/assets")
      .set("Cookie", "accessToken=fake-token")
      .send({
        assetTag: "IT-001",
        name: "Dell Latitude 5540",
        assetType: "INVALID",
        officeId: "off1",
      });

    expect(res.status).toBe(422);
  });
});

describe("PUT /api/assets/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    verifyAccessToken.mockReturnValue({ sub: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", role: "ADMIN" });
    mockPrisma.user.findUnique.mockResolvedValue(adminUser);
    mockPrisma.asset.update.mockResolvedValue({ ...mockAsset, name: "Updated Asset" });
  });

  test("allows authenticated ADMIN to update asset", async () => {
    const res = await request(app)
      .put("/api/assets/cccccccc-cccc-cccc-cccc-cccccccccccc")
      .set("Cookie", "accessToken=fake-token")
      .send({ name: "Updated Asset" });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Updated Asset");
  });

  test("rejects authenticated employee with 403", async () => {
    verifyAccessToken.mockReturnValue({ sub: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", role: "EMPLOYEE" });
    mockPrisma.user.findUnique.mockResolvedValue(employeeUser);

    const res = await request(app)
      .put("/api/assets/cccccccc-cccc-cccc-cccc-cccccccccccc")
      .set("Cookie", "accessToken=fake-token")
      .send({ name: "Updated Asset" });

    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/assets/:id/archive", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    verifyAccessToken.mockReturnValue({ sub: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", role: "ADMIN" });
    mockPrisma.user.findUnique.mockResolvedValue(adminUser);
    mockPrisma.asset.update.mockResolvedValue({ ...mockAsset, status: "ARCHIVED" });
  });

  test("allows authenticated ADMIN to archive asset", async () => {
    const res = await request(app)
      .patch("/api/assets/cccccccc-cccc-cccc-cccc-cccccccccccc/archive")
      .set("Cookie", "accessToken=fake-token");

    expect(res.status).toBe(200);
    expect(mockPrisma.asset.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cccccccc-cccc-cccc-cccc-cccccccccccc" },
        data: { status: "ARCHIVED" },
      }),
    );
  });

  test("rejects authenticated employee with 403", async () => {
    verifyAccessToken.mockReturnValue({ sub: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", role: "EMPLOYEE" });
    mockPrisma.user.findUnique.mockResolvedValue(employeeUser);

    const res = await request(app)
      .patch("/api/assets/cccccccc-cccc-cccc-cccc-cccccccccccc/archive")
      .set("Cookie", "accessToken=fake-token");

    expect(res.status).toBe(403);
  });
});

describe("GET /api/assets/my", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    verifyAccessToken.mockReturnValue({ sub: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", role: "EMPLOYEE" });
    mockPrisma.user.findUnique.mockResolvedValue(employeeUser);
    mockPrisma.asset.findMany.mockResolvedValue([mockAsset]);
  });

  test("returns 200 for authenticated employee", async () => {
    const res = await request(app)
      .get("/api/assets/my")
      .set("Cookie", "accessToken=fake-token");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  test("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/assets/my");
    expect(res.status).toBe(401);
  });
});
