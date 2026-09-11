require("dotenv").config();

const request = require("supertest");
const app = require("../src/server");
const { prisma } = require("../src/config/db");

let adminCookie;
let createdOfficeId;
let deletableOfficeId;

beforeAll(async () => {
  await prisma.$connect();
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({ phoneNumber: admin.phoneNumber, password: "Password123!" });

  adminCookie = loginResponse.headers["set-cookie"];
});

afterAll(async () => {
  if (createdOfficeId) {
    await prisma.office.deleteMany({ where: { id: createdOfficeId } });
  }
  if (deletableOfficeId) {
    await prisma.office.deleteMany({ where: { id: deletableOfficeId } });
  }
  await prisma.$disconnect();
});

describe("Office management routes", () => {
  test("GET /api/offices returns offices with meta", async () => {
    const response = await request(app)
      .get("/api/offices")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Offices retrieved successfully.");
    expect(response.body.meta).toBeDefined();
    expect(Array.isArray(response.body.offices)).toBe(true);
  });

  test("POST /api/offices creates an office", async () => {
    const response = await request(app)
      .post("/api/offices")
      .set("Cookie", adminCookie)
      .send({
        code: `TEST_OFFICE_${Date.now()}`,
        nameAm: "ነገር ጽሕፈት ቤት",
        nameEn: "Test Office",
        isActive: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.office).toMatchObject({ nameEn: "Test Office" });
    createdOfficeId = response.body.office.id;
  });

  test("GET /api/offices/:id returns the created office", async () => {
    const response = await request(app)
      .get(`/api/offices/${createdOfficeId}`)
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.office).toMatchObject({ id: createdOfficeId });
  });

  test("PUT /api/offices/:id updates an office", async () => {
    const response = await request(app)
      .put(`/api/offices/${createdOfficeId}`)
      .set("Cookie", adminCookie)
      .send({
        code: `TEST_OFFICE_UPDATED_${Date.now()}`,
        nameAm: "ተሻሽለ ጽሕፈት",
        nameEn: "Updated Test Office",
      });

    expect(response.status).toBe(200);
    expect(response.body.office.nameEn).toBe("Updated Test Office");
  });

  test("PUT /api/offices/:id/status updates office status", async () => {
    const response = await request(app)
      .put(`/api/offices/${createdOfficeId}/status`)
      .set("Cookie", adminCookie)
      .send({ isActive: false });

    expect(response.status).toBe(200);
    expect(response.body.office.isActive).toBe(false);
  });

  test("DELETE /api/offices/:id deletes an empty office", async () => {
    const createResponse = await request(app)
      .post("/api/offices")
      .set("Cookie", adminCookie)
      .send({
        code: `DELETE_OFFICE_${Date.now()}`,
        nameAm: "ለመሰረዝ ቢሮ",
        nameEn: "Deletable Office",
        isActive: true,
      });

    deletableOfficeId = createResponse.body.office.id;
    const response = await request(app)
      .delete(`/api/offices/${deletableOfficeId}`)
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Office deleted successfully.");
    expect(response.body.office.id).toBe(deletableOfficeId);
    deletableOfficeId = null;
  });

  test("DELETE /api/offices/:id rejects an office with dependencies", async () => {
    const response = await request(app)
      .delete(`/api/offices/${createdOfficeId}`)
      .set("Cookie", adminCookie);

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/associated users|tickets/i);
  });
});
