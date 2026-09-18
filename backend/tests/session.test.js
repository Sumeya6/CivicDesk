const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  office: {
    findUnique: jest.fn(),
  },
};

jest.mock("../src/config/db", () => ({
  prisma: mockPrisma,
}));

jest.mock("../src/utils/jwt", () => {
  const actual = jest.requireActual("../src/utils/jwt");
  return {
    ...actual,
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    verifyAccessToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
    getAccessTokenCookieOptions: jest.fn(() => ({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 900000,
      path: "/",
    })),
    getRefreshTokenCookieOptions: jest.fn(() => ({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 604800000,
      path: "/",
    })),
  };
});

jest.mock("../src/utils/phone", () => ({
  ETHIOPIAN_PHONE_PATTERN: /^(\+2519\d{8}|09\d{8}|9\d{8}|2519\d{8})$/,
  normalizeEthiopianPhone: jest.fn((p) => p),
  getEthiopianPhoneVariants: jest.fn((p) => [p]),
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} = require("../src/utils/jwt");
const bcrypt = require("bcryptjs");
const authRoutes = require("../src/routes/auth.routes");
const errorHandler = require("../src/middleware/error.middleware");

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRoutes);
  app.use(errorHandler);
  return app;
}

const app = createApp();

const testUser = {
  id: "user-1",
  fullName: "Test User",
  phoneNumber: "+251911111111",
  password: "$2a$10$hashedpassword",
  role: "EMPLOYEE",
  officeId: "office-1",
  isActive: true,
  preferredLanguage: "EN",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const safeUser = { ...testUser };
delete safeUser.password;

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue(testUser);
    bcrypt.compare.mockResolvedValue(true);
    generateAccessToken.mockReturnValue("mock-access-token");
    generateRefreshToken.mockReturnValue("mock-refresh-token");
  });

  test("sets both accessToken and refreshToken cookies", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ phoneNumber: "+251911111111", password: "Password123!" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful.");

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(Array.isArray(cookies)).toBe(true);

    const accessCookie = cookies.find((c) => c.startsWith("accessToken="));
    const refreshCookie = cookies.find((c) => c.startsWith("refreshToken="));

    expect(accessCookie).toBeDefined();
    expect(accessCookie).toContain("HttpOnly");
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain("HttpOnly");
  });

  test("returns user without password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ phoneNumber: "+251911111111", password: "Password123!" });

    expect(res.body.data).toBeDefined();
    expect(res.body.data).not.toHaveProperty("password");
    expect(res.body.data.phoneNumber).toBe("+251911111111");
  });

  test("returns 401 for invalid credentials", async () => {
    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ phoneNumber: "+251911111111", password: "WrongPassword!" });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid/i);
  });

  test("returns 401 for inactive user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      ...testUser,
      isActive: false,
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ phoneNumber: "+251911111111", password: "Password123!" });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/refresh", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue(testUser);
    verifyRefreshToken.mockReturnValue({
      sub: "user-1",
      role: "EMPLOYEE",
      phoneNumber: "+251911111111",
    });
    generateAccessToken.mockReturnValue("new-access-token");
    generateRefreshToken.mockReturnValue("new-refresh-token");
  });

  test("returns 200 with new tokens when refresh token is valid", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", "refreshToken=valid-refresh-token");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Token refreshed successfully.");
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe("user-1");

    const cookies = res.headers["set-cookie"];
    const accessCookie = cookies.find((c) => c.startsWith("accessToken="));
    const refreshCookie = cookies.find((c) => c.startsWith("refreshToken="));
    expect(accessCookie).toBeDefined();
    expect(refreshCookie).toBeDefined();
  });

  test("returns 401 when no refresh token cookie is present", async () => {
    const res = await request(app).post("/api/auth/refresh");

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/refresh token required/i);
  });

  test("returns 401 when refresh token is invalid", async () => {
    verifyRefreshToken.mockImplementation(() => {
      const err = new Error("Invalid token");
      err.statusCode = 401;
      throw err;
    });

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", "refreshToken=invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid or expired/i);
  });

  test("returns 401 when refresh token is expired", async () => {
    verifyRefreshToken.mockImplementation(() => {
      const err = new Error("Token expired");
      err.statusCode = 401;
      throw err;
    });

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", "refreshToken=expired-token");

    expect(res.status).toBe(401);
  });

  test("returns 401 when user no longer exists", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", "refreshToken=valid-refresh-token");

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/user not found/i);
  });

  test("returns 401 when user is deactivated", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      ...testUser,
      isActive: false,
    });

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", "refreshToken=valid-refresh-token");

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  test("clears both accessToken and refreshToken cookies", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", "accessToken=at; refreshToken=rt");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logout successful.");

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();

    const accessCookie = cookies.find((c) => c.startsWith("accessToken="));
    const refreshCookie = cookies.find((c) => c.startsWith("refreshToken="));

    expect(accessCookie).toBeDefined();
    expect(accessCookie).toContain("Expires=");
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain("Expires=");
  });
});

describe("protected route behavior after token expiry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/auth/me returns 401 without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  test("GET /api/auth/me returns 401 with invalid access token", async () => {
    verifyAccessToken.mockImplementation(() => {
      const err = new Error("Invalid token");
      err.statusCode = 401;
      throw err;
    });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", "accessToken=invalid");

    expect(res.status).toBe(401);
  });

  test("GET /api/auth/me returns 200 with valid token and active user", async () => {
    verifyAccessToken.mockReturnValue({
      sub: "user-1",
      role: "EMPLOYEE",
    });
    mockPrisma.user.findUnique.mockResolvedValue(testUser);

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", "accessToken=valid-token");

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe("user-1");
  });

  test("GET /api/auth/me returns 401 when user is deactivated", async () => {
    verifyAccessToken.mockReturnValue({
      sub: "user-1",
      role: "EMPLOYEE",
    });
    mockPrisma.user.findUnique.mockResolvedValue({
      ...testUser,
      isActive: false,
    });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", "accessToken=valid-token");

    expect(res.status).toBe(401);
  });

  test("refresh allows continued access after access token expires", async () => {
    verifyRefreshToken.mockReturnValue({
      sub: "user-1",
      role: "EMPLOYEE",
      phoneNumber: "+251911111111",
    });

    generateAccessToken.mockReturnValue("new-access");
    generateRefreshToken.mockReturnValue("new-refresh");

    mockPrisma.user.findUnique.mockResolvedValue(testUser);

    const refreshRes = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", "refreshToken=valid-refresh");

    expect(refreshRes.status).toBe(200);

    verifyAccessToken.mockReturnValue({ sub: "user-1", role: "EMPLOYEE" });

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Cookie", "accessToken=new-access");

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.id).toBe("user-1");
  });
});
