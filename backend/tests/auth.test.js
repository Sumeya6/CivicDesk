require("dotenv").config();

const request = require("supertest");
const app = require("../src/server");
const { prisma } = require("../src/config/db");

const TEST_PHONE = `+2519110000${Math.floor(Math.random() * 10000)}`;
const TEST_PASSWORD = "Password123!";

beforeAll(async () => {
  await prisma.$connect();
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
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("User registered successfully.");
    expect(response.body.user).toMatchObject({
      fullName: "Test User",
      phoneNumber: TEST_PHONE,
      preferredLanguage: "EN",
    });
    expect(response.body.user).not.toHaveProperty("password");
  });

  test("POST /api/auth/register duplicate phone returns 409", async () => {
    const response = await request(app).post("/api/auth/register").send({
      fullName: "Duplicate User",
      phoneNumber: TEST_PHONE,
      password: TEST_PASSWORD,
      preferredLanguage: "EN",
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Phone number is already registered.");
  });

  test("POST /api/auth/register always creates an employee", async () => {
    const phoneNumber = `+2519110000${Math.floor(Math.random() * 10000)}`;
    const response = await request(app).post("/api/auth/register").send({
      fullName: "Role Guard Test",
      phoneNumber,
      password: TEST_PASSWORD,
      role: "ADMIN",
    });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe("EMPLOYEE");
    await prisma.user.delete({ where: { phoneNumber } });
  });

  test("POST /api/auth/register rejects malformed phone numbers", async () => {
    const response = await request(app).post("/api/auth/register").send({
      fullName: "Invalid Phone Test",
      phoneNumber: "not-a-phone",
      password: TEST_PASSWORD,
    });

    expect(response.status).toBe(422);
  });

  test("POST /api/auth/login success returns user and cookie", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ phoneNumber: TEST_PHONE, password: TEST_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login successful.");
    expect(response.body.user).toMatchObject({ phoneNumber: TEST_PHONE });
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

  test("POST /api/auth/forgot-password and POST /api/auth/reset-password flow", async () => {
    // Request a reset token
    const forgot = await request(app)
      .post("/api/auth/forgot-password")
      .send({ phoneNumber: TEST_PHONE });
    expect(forgot.status).toBe(200);
    expect(forgot.body.message).toMatch(/reset/i);

    const resetToken = forgot.body.resetToken;
    expect(resetToken).toBeDefined();

    const newPassword = "ResetPass123!";
    const reset = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: resetToken, newPassword });
    expect(reset.status).toBe(200);
    expect(reset.body.message).toBe("Password has been reset successfully.");

    // Ensure we can login with the new password
    const login = await request(app)
      .post("/api/auth/login")
      .send({ phoneNumber: TEST_PHONE, password: newPassword });
    expect(login.status).toBe(200);
  });
});
