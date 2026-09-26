import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ticketReducer from "../store/ticketSlice";
import userReducer from "../store/userSlice";
import officeReducer from "../store/officeSlice";
import announcementReducer from "../store/announcementSlice";
import AdminDashboard from "../pages/admin/AdminDashboard";
import TicketManagement from "../pages/admin/TicketManagement";
import api from "../api/axios";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    currentUser: { fullName: "Admin User" },
    preferredLanguage: "EN",
  }),
}));

vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("../components/TicketDetailModal", () => ({
  default: ({ isOpen, onClose }) =>
    isOpen ? (
      <div role="dialog" aria-label="Ticket details">
        <span>Ticket details opened</span>
        <button type="button" onClick={onClose}>Close details</button>
      </div>
    ) : null,
}));

function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      tickets: ticketReducer,
      users: userReducer,
      offices: officeReducer,
      announcements: announcementReducer,
    },
    preloadedState,
  });
}

describe("Admin Assignment Flow", () => {
  test("updates Admin Dashboard list on successful technician assignment", async () => {
    let ticketStatus = "PENDING";
    const store = createTestStore({
      users: { items: [], loading: false },
      offices: { items: [], loading: false },
      announcements: { items: [], loading: false },
      tickets: {
        tickets: [
          {
            id: "t-1",
            title: "Broken Printer",
            description: "Paper jam issue",
            status: "PENDING",
            priority: "MEDIUM",
            officeId: "off-1",
            createdAt: "2026-09-20T10:00:00.000Z",
          },
        ],
        technicians: [{ id: "tech-1", fullName: "Tech One" }],
        loading: false,
        error: null,
        page: 1,
        totalPages: 1,
      },
    });

    api.get.mockImplementation((url) => {
      if (url.includes("/users") && url.includes("officeId")) {
        return Promise.resolve({ data: { data: [{ id: "tech-1", fullName: "Tech One" }] } });
      }
      if (url.includes("/tickets")) {
        return Promise.resolve({
          data: {
            data: [
              {
                id: "t-1",
                title: "Broken Printer",
                status: ticketStatus,
                priority: "MEDIUM",
                officeId: "off-1",
                technicianId: ticketStatus === "ASSIGNED" ? "tech-1" : null,
                technician: ticketStatus === "ASSIGNED" ? { id: "tech-1", fullName: "Tech One" } : null,
                createdAt: "2026-09-20T10:00:00.000Z",
              },
            ],
            meta: { totalTickets: 1, page: 1, totalPages: 1 },
          },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    api.patch.mockImplementation(() => {
      ticketStatus = "ASSIGNED";
      return Promise.resolve({
        data: {
          success: true,
          message: "Ticket assignment updated.",
          data: {
            id: "t-1",
            title: "Broken Printer",
            status: "ASSIGNED",
            priority: "MEDIUM",
            officeId: "off-1",
            technicianId: "tech-1",
          },
        },
      });
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      </Provider>,
    );

    const title = await screen.findByText("Broken Printer");
    expect(title).toBeTruthy();
    expect(screen.getByText("PENDING")).toBeTruthy();

    const assignBtn = screen.getByRole("button", { name: /Assign/i });
    fireEvent.click(assignBtn);

    const modalTitle = await screen.findByText("Assign / Update Ticket");
    expect(modalTitle).toBeTruthy();

    const select = screen.getByLabelText(/^Technician$/i);
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Tech One" })).toBeTruthy();
    });
    fireEvent.change(select, { target: { value: "tech-1" } });

    expect(
      screen.getByText(/Saving will assign the technician and move a Pending ticket to Assigned/i),
    ).toBeTruthy();

    const saveBtn = screen.getByRole("button", { name: "Save Changes" });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/tickets/t-1/assign", expect.objectContaining({
        technicianId: "tech-1",
      }));
    });
  });

  test("updates Ticket Management search results on successful technician assignment", async () => {
    api.get.mockImplementation((url) => {
      if (url.includes("/users") && url.includes("officeId")) {
        return Promise.resolve({ data: { data: [{ id: "tech-1", fullName: "Tech One" }] } });
      }
      if (url.includes("/tickets/search")) {
        return Promise.resolve({
          data: {
            data: {
              data: [
                {
                  id: "t-2",
                  title: "Network Down",
                  status: "PENDING",
                  priority: "MEDIUM",
                  officeId: "off-1",
                },
              ],
              totalCount: 1,
              totalPages: 1,
              currentPage: 1,
            },
          },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    api.patch.mockResolvedValue({
      data: {
        success: true,
        message: "Ticket assignment updated.",
        data: {
          id: "t-2",
          title: "Network Down",
          status: "ASSIGNED",
          priority: "MEDIUM",
          technicianId: "tech-1",
        },
      },
    });

    const store = createTestStore({
      tickets: {
        tickets: [],
        technicians: [{ id: "tech-1", fullName: "Tech One" }],
        loading: false,
        error: null,
        page: 1,
        totalPages: 1,
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <TicketManagement />
        </MemoryRouter>
      </Provider>,
    );

    const titleEl = await screen.findByText("Network Down");
    expect(titleEl).toBeTruthy();

    const assignBtn = await screen.findByRole("button", { name: "Assign" });
    fireEvent.click(assignBtn);

    const modalTitle = await screen.findByText("Assign / Update Ticket");
    expect(modalTitle).toBeTruthy();

    const select = screen.getByLabelText(/^Technician$/i);
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Tech One" })).toBeTruthy();
    });
    fireEvent.change(select, { target: { value: "tech-1" } });

    const saveBtn = screen.getByRole("button", { name: "Save Changes" });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/tickets/t-2/assign", expect.objectContaining({
        technicianId: "tech-1",
      }));
    });
  });

  test("opens details from both the title and View details actions", async () => {
    api.get.mockImplementation((url) => {
      if (url.includes("/tickets/search")) {
        return Promise.resolve({
          data: {
            data: {
              data: [{ id: "t-3", title: "Printer Offline", status: "PENDING", priority: "LOW" }],
              totalPages: 1,
              currentPage: 1,
            },
          },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    render(
      <Provider store={createTestStore()}>
        <MemoryRouter>
          <TicketManagement />
        </MemoryRouter>
      </Provider>,
    );

    const title = await screen.findByRole("button", { name: "View details for Printer Offline" });
    fireEvent.click(title);
    expect(screen.getByText("Ticket details opened")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Close details" }));
    fireEvent.click(screen.getByRole("button", { name: "View details" }));
    expect(screen.getByText("Ticket details opened")).toBeTruthy();
  });
});
