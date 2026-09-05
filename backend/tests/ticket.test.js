const mockPrisma = {
	user: { findUnique: jest.fn() },
	category: { findUnique: jest.fn() },
	ticket: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
	$transaction: jest.fn(),
};

jest.mock("../src/config/db", () => ({ prisma: mockPrisma }));
jest.mock("../src/services/assignment.service", () => ({ assignTechnicianToTicket: jest.fn() }));
jest.mock("../src/utils/audit.util", () => ({ createAuditEntry: jest.fn() }));
jest.mock("@prisma/client", () => ({
	Priority: { LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH", CRITICAL: "CRITICAL" },
	Role: { EMPLOYEE: "EMPLOYEE", TECHNICIAN: "TECHNICIAN", ADMIN: "ADMIN" },
	TicketStatus: { PENDING: "PENDING", ASSIGNED: "ASSIGNED", IN_PROGRESS: "IN_PROGRESS", AWAITING_PURCHASE: "AWAITING_PURCHASE", RESOLVED: "RESOLVED", CLOSED: "CLOSED" },
}));

const { createTicket, verifyTicket } = require("../src/controllers/ticket.controller");
const { assignTechnicianToTicket } = require("../src/services/assignment.service");

function response() {
	return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

describe("ticket workflow", () => {
	beforeEach(() => jest.clearAllMocks());

	test("creates a medium-priority ticket and invokes office assignment", async () => {
		const req = { user: { id: "employee-1", role: "EMPLOYEE" }, body: { title: "Printer", description: "Paper jam", categoryId: "category-1" } };
		const res = response();
		const created = { id: "ticket-1", status: "PENDING", priority: "MEDIUM" };
		mockPrisma.user.findUnique.mockResolvedValue({ officeId: "office-1" });
		mockPrisma.category.findUnique.mockResolvedValue({ id: "category-1", isActive: true });
		mockPrisma.$transaction.mockImplementation((callback) => callback({
			ticket: { create: jest.fn().mockResolvedValue(created) },
		}));
		assignTechnicianToTicket.mockResolvedValue(created);

		await createTicket(req, res, jest.fn());

		expect(assignTechnicianToTicket).toHaveBeenCalledWith("ticket-1", "office-1", expect.any(Object));
		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ticket: created }));
	});

	test("requires a valid rating when an employee approves a resolution", async () => {
		const req = { user: { id: "employee-1", role: "EMPLOYEE" }, params: { id: "ticket-1" }, body: { isApproved: true, rating: 6 } };
		const res = response();
		const next = jest.fn();
		await verifyTicket(req, res, next);
		expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 422 }));
		expect(mockPrisma.ticket.findUnique).not.toHaveBeenCalled();
	});
});
