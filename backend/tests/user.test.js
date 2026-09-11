require("dotenv").config();

const request = require("supertest");
const app = require("../src/server");
const { prisma } = require("../src/config/db");

let adminCookie;
let adminId;
let createdUserId;
let createdUserPhone;

beforeAll(async () => {
  await prisma.$connect();
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  adminId = admin.id;
  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({ phoneNumber: admin.phoneNumber, password: "Password123!" });

  adminCookie = loginResponse.headers["set-cookie"];
});

afterAll(async () => {
  if (createdUserId) {
    await prisma.user.deleteMany({ where: { id: createdUserId } });
  }
  await prisma.$disconnect();
});

describe("User management routes", () => {
  test("GET /api/users returns users with meta", async () => {
    const response = await request(app)
      .get("/api/users")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Users retrieved successfully.");
    expect(response.body.meta).toBeDefined();
    expect(Array.isArray(response.body.users)).toBe(true);
  });

  test("POST /api/auth/register creates a user for user tests", async () => {
    createdUserPhone = `+2519110000${Math.floor(Math.random() * 10000)}`;
    const response = await request(app).post("/api/auth/register").send({
      fullName: "User Test",
      phoneNumber: createdUserPhone,
      password: "Password123!",
      preferredLanguage: "EN",
    });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ phoneNumber: createdUserPhone });
    createdUserId = response.body.user.id;
  });

  test("GET /api/users/:id returns the created user", async () => {
    const response = await request(app)
      .get(`/api/users/${createdUserId}`)
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ id: createdUserId });
  });

  test("PUT /api/users/:id updates a user", async () => {
    const response = await request(app)
      .put(`/api/users/${createdUserId}`)
      .set("Cookie", adminCookie)
      .send({ fullName: "Updated User" });

    expect(response.status).toBe(200);
    expect(response.body.user.fullName).toBe("Updated User");
  });

  test("PUT /api/users/:id/role updates the user role", async () => {
    const response = await request(app)
      .put(`/api/users/${createdUserId}/role`)
      .set("Cookie", adminCookie)
      .send({ role: "TECHNICIAN" });

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe("TECHNICIAN");
  });

  test("PATCH /api/users/me/language updates preferred language", async () => {
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ phoneNumber: createdUserPhone, password: "Password123!" });

    expect(loginResponse.status).toBe(200);
    const userCookie = loginResponse.headers["set-cookie"];

    const patchResponse = await request(app)
      .patch("/api/users/me/language")
      .set("Cookie", userCookie)
      .send({ preferredLanguage: "AM" });

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.user.preferredLanguage).toBe("AM");
  });

  test("PUT /api/users/:id/status toggles user status", async () => {
    const response = await request(app)
      .put(`/api/users/${createdUserId}/status`)
      .set("Cookie", adminCookie)
      .send({ isActive: false });

    expect(response.status).toBe(200);
    expect(response.body.user.isActive).toBe(false);
  });

  test("DELETE /api/users/:id deletes a user", async () => {
    const response = await request(app)
      .delete(`/api/users/${createdUserId}`)
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User deleted successfully.");
    expect(response.body.user.id).toBe(createdUserId);
    createdUserId = null;
  });

  test("DELETE /api/users/:id prevents an admin from deleting themselves", async () => {
    const response = await request(app)
      .delete(`/api/users/${adminId}`)
      .set("Cookie", adminCookie);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("You cannot delete your own account.");
  });
});
