require("dotenv").config();

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/server");
const { prisma } = require("../src/config/db");
const notificationService = require("../src/services/notification.service");
const { getPasswordResetSecret } = require("../src/utils/jwt");

const TEST_PHONE = `+2519${String(Math.floor(Math.random() * 100000000)).padStart(8, "0")}`;
const TEST_PASSWORD = "Password123!";
let testOfficeId;

beforeAll(async () => {
  await prisma.$connect();
  const office = await prisma.office.findFirst({ where: { isActive: true } });
  testOfficeId = office?.id;
  
  await prisma.user.deleteMany({
    where: {
      phoneNumber: TEST_PHONE,
    },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: {
      phoneNumber: TEST_PHONE,
    },
  });
  await prisma.$disconnect();
});

describe("Auth routes", () => {
  test("POST /api/auth/register success", async () => {
    const response = await request(app).post("/api/auth/register").send({
      fullName: "Test User",
      phoneNumber: TEST_PHONE,
      password: TEST_PASSWORD,
      preferredLanguage: "EN",
      officeId: testOfficeId,
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("User registered successfully.");
    expect(response.body.data.user).toMatchObject({
      fullName: "Test User",
      phoneNumber: TEST_PHONE,
      preferredLanguage: "EN",
    });
    expect(response.body.data.user).not.toHaveProperty("password");
  });

  test("POST /api/auth/register duplicate phone returns 409", async () => {
    const response = await request(app).post("/api/auth/register").send({
      fullName: "Duplicate User",
      phoneNumber: TEST_PHONE,
      password: TEST_PASSWORD,
      preferredLanguage: "EN",
      officeId: testOfficeId,
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Phone number is already registered.");
  });

  test("POST /api/auth/register always creates an employee", async () => {
    const phoneNumber = `+2519${String(Math.floor(Math.random() * 100000000)).padStart(8, "0")}`;
    const response = await request(app).post("/api/auth/register").send({
      fullName: "Role Guard Test",
      phoneNumber,
      password: TEST_PASSWORD,
      role: "ADMIN",
      officeId: testOfficeId,
    });

    expect(response.status).toBe(201);
    expect(response.body.data.user.role).toBe("EMPLOYEE");
    await prisma.user.delete({ where: { phoneNumber } });
  });

  test("POST /api/auth/register rejects malformed phone numbers", async () => {
    const response = await request(app).post("/api/auth/register").send({
      fullName: "Invalid Phone Test",
      phoneNumber: "not-a-phone",
      password: TEST_PASSWORD,
      officeId: testOfficeId,
    });

    expect(response.status).toBe(422);
  });

  test("POST /api/auth/login success returns user and cookie", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ phoneNumber: TEST_PHONE, password: TEST_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login successful.");
    expect(response.body.data.user).toMatchObject({ phoneNumber: TEST_PHONE });
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  test("POST /api/auth/login invalid password returns 401", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ phoneNumber: TEST_PHONE, password: "WrongPass123" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid phone number or password.");
  });

  test("PUT /api/auth/change-password success", async () => {
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ phoneNumber: TEST_PHONE, password: TEST_PASSWORD });

    const cookies = loginResponse.headers["set-cookie"];
    const response = await request(app)
      .put("/api/auth/change-password")
      .set("Cookie", cookies)
      .send({ currentPassword: TEST_PASSWORD, newPassword: "NewPass123!" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Password changed successfully.");

    const reLogin = await request(app)
      .post("/api/auth/login")
      .send({ phoneNumber: TEST_PHONE, password: "NewPass123!" });

    expect(reLogin.status).toBe(200);
  });

  test("PUT /api/auth/change-password with wrong current password returns 401", async () => {
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ phoneNumber: TEST_PHONE, password: "NewPass123!" });

    const cookies = loginResponse.headers["set-cookie"];
    const response = await request(app)
      .put("/api/auth/change-password")
      .set("Cookie", cookies)
      .send({ currentPassword: "Incorrect!", newPassword: "Password123!" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Current password is incorrect.");
  });

  describe("Password reset flow", () => {
    test("POST /api/auth/forgot-password returns generic success for unknown phone (no enumeration)", async () => {
      const response = await request(app)
        .post("/api/auth/forgot-password")
        .send({ phoneNumber: "+251999999999" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(
        "If an account with that phone number exists, password reset instructions have been sent."
      );
      expect(response.body).not.toHaveProperty("resetToken");
    });

    test("POST /api/auth/forgot-password returns generic success for inactive user (no enumeration)", async () => {
      const inactivePhone = `+2519${String(Math.floor(Math.random() * 100000000)).padStart(8, "0")}`;
      await prisma.user.create({
        data: {
          fullName: "Inactive User",
          phoneNumber: inactivePhone,
          password: await require("bcryptjs").hash(TEST_PASSWORD, 10),
          preferredLanguage: "EN",
          officeId: testOfficeId,
          role: "EMPLOYEE",
          isActive: false,
        },
      });

      const response = await request(app)
        .post("/api/auth/forgot-password")
        .send({ phoneNumber: inactivePhone });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(
        "If an account with that phone number exists, password reset instructions have been sent."
      );
      expect(response.body).not.toHaveProperty("resetToken");

      await prisma.user.delete({ where: { phoneNumber: inactivePhone } });
    });

    test("POST /api/auth/forgot-password and POST /api/auth/reset-password full flow", async () => {
      const forgot = await request(app)
        .post("/api/auth/forgot-password")
        .send({ phoneNumber: TEST_PHONE });
      expect(forgot.status).toBe(200);
      expect(forgot.body.message).toMatch(/reset/i);

      const resetToken = forgot.body.data.resetToken;
      expect(resetToken).toBeDefined();

      const newPassword = "ResetPass123!";
      const reset = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: resetToken, newPassword });
      expect(reset.status).toBe(200);
      expect(reset.body.message).toBe("Password has been reset successfully.");

      const login = await request(app)
        .post("/api/auth/login")
        .send({ phoneNumber: TEST_PHONE, password: newPassword });
      expect(login.status).toBe(200);
    });

    test("POST /api/auth/reset-password rejects expired token", async () => {
      const user = await prisma.user.findUnique({ where: { phoneNumber: TEST_PHONE } });
      const expiredToken = jwt.sign(
        {
          sub: user.id,
          phoneNumber: user.phoneNumber,
          purpose: "password_reset",
        },
        getPasswordResetSecret(),
        { expiresIn: "-1h" }
      );

      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: expiredToken, newPassword: "NewPass123!" });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Authentication token has expired.");
    });

    test("POST /api/auth/reset-password rejects invalid token", async () => {
      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: "invalid-token", newPassword: "NewPass123!" });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid authentication token.");
    });

    test("POST /api/auth/reset-password rejects token with wrong purpose", async () => {
      const user = await prisma.user.findUnique({ where: { phoneNumber: TEST_PHONE } });
      const wrongPurposeToken = jwt.sign(
        {
          sub: user.id,
          phoneNumber: user.phoneNumber,
          purpose: "email_verification",
        },
        getPasswordResetSecret(),
        { expiresIn: "1h" }
      );

      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: wrongPurposeToken, newPassword: "NewPass123!" });

      expect(response.status).toBe(401);
    });

    test("POST /api/auth/reset-password rejects token for non-existent user", async () => {
      const fakeUserId = "00000000-0000-0000-0000-000000000000";
      const token = jwt.sign(
        {
          sub: fakeUserId,
          phoneNumber: "+251999999999",
          purpose: "password_reset",
        },
        getPasswordResetSecret(),
        { expiresIn: "1h" }
      );

      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({ token, newPassword: "NewPass123!" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found.");
    });

    test("POST /api/auth/forgot-password handles provider failure gracefully", async () => {
      const originalSend = notificationService.sendPasswordReset;
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      
      notificationService.sendPasswordReset = jest.fn().mockRejectedValue(
        new Error("Twilio configuration is missing.")
      );

      const response = await request(app)
        .post("/api/auth/forgot-password")
        .send({ phoneNumber: TEST_PHONE });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(
        "If an account with that phone number exists, password reset instructions have been sent."
      );

      notificationService.sendPasswordReset = originalSend;
      process.env.NODE_ENV = originalNodeEnv;
    });
  });
});