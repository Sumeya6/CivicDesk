import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";

const dispatch = vi.fn(() => ({ unwrap: () => Promise.resolve() }));
let ticketState;

vi.mock("react-redux", () => ({
  useDispatch: () => dispatch,
  useSelector: (selector) => selector({ tickets: ticketState }),
}));

vi.mock("../store/ticketSlice", () => ({
  fetchTickets: (payload) => ({ type: "tickets/fetch", payload }),
  updateTicketStatus: (payload) => ({ type: "tickets/update", payload }),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ currentUser: { fullName: "Aster Tester" } }),
}));

vi.mock("../components/Pagination", () => ({ default: () => null, Pagination: () => null }));
vi.mock("../components/StatusBadge", () => ({ default: ({ status }) => <span>{status}</span> }));
vi.mock("../components/PriorityBadge", () => ({ default: ({ priority }) => <span>{priority}</span> }));
vi.mock("../components/SlaIndicator", () => ({ default: () => <span>SLA</span> }));
vi.mock("../components/ticketConfig", () => ({ formatDate: () => "today" }));
vi.mock("../components/AnnouncementBoard", () => ({ default: () => null }));
vi.mock("../pages/employee/CreateTicketModal", () => ({ default: () => null }));
vi.mock("../pages/employee/VerifyTicketModal", () => ({ default: () => null }));
vi.mock("../components/AuditTrailModal", () => ({ default: () => null }));
vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import TechnicianQueue from "../pages/technician/TechnicianQueue";
import EmployeeDashboard from "../pages/employee/EmployeeDashboard";

const ticket = (status) => ({
  id: `${status}-1`,
  title: `${status} ticket`,
  status,
  priority: "MEDIUM",
  categoryId: "cat-1",
  createdAt: "2026-09-19T00:00:00.000Z",
});

function renderPage(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

function setTickets(tickets) {
  ticketState = { tickets, loading: false, error: null, page: 1, totalPages: 1 };
}

describe("technician workflow actions", () => {
  test("shows Start for assigned tickets", () => {
    setTickets([ticket("ASSIGNED")]);
    renderPage(<TechnicianQueue />);
    expect(screen.getAllByRole("button", { name: /Start Work/i }).length).toBeGreaterThan(0);
  });

  test("shows Resolve and Request Purchase for in-progress tickets", () => {
    setTickets([ticket("IN_PROGRESS")]);
    renderPage(<TechnicianQueue onResolve={vi.fn()} onRequestPurchase={vi.fn()} />);
    expect(screen.getAllByRole("button", { name: "Resolve" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Request Purchase" }).length).toBeGreaterThan(0);
  });

  test("shows Resume for tickets awaiting purchase", () => {
    setTickets([ticket("AWAITING_PURCHASE")]);
    renderPage(<TechnicianQueue />);
    expect(screen.getAllByRole("button", { name: /Resume Work/i }).length).toBeGreaterThan(0);
  });

  test("keeps workflow actions in the mobile ticket presentation", () => {
    setTickets([ticket("ASSIGNED")]);
    renderPage(<TechnicianQueue />);
    expect(document.querySelector(".mobile-ticket-list")).toBeTruthy();
    expect(document.querySelector(".mobile-ticket-actions")).toBeTruthy();
  });
});

describe("employee workflow actions", () => {
  test("shows Verify Resolution only for resolved tickets", () => {
    setTickets([ticket("RESOLVED"), ticket("IN_PROGRESS")]);
    renderPage(<EmployeeDashboard />);
    expect(screen.getAllByRole("button", { name: /Verify Resolution RESOLVED ticket/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Verify Resolution IN_PROGRESS ticket/i })).toBeNull();
  });

  test("shows no verification action when no ticket is resolved", () => {
    setTickets([ticket("ASSIGNED")]);
    renderPage(<EmployeeDashboard />);
    expect(screen.queryByRole("button", { name: /Verify Resolution/i })).toBeNull();
  });
});
