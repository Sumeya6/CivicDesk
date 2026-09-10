import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { describe, test, expect, vi, beforeEach } from "vitest";
import ticketReducer from "../store/ticketSlice";
import TicketResolveModal from "../pages/technician/TicketResolveModal";

const mockResolveApi = vi.fn();
vi.mock("../api/ticketApi", () => ({
  default: {
    resolveTicket: (...args) => mockResolveApi(...args),
    getTicket: vi.fn().mockResolvedValue({ ticket: {} }),
    listTickets: vi.fn().mockResolvedValue({ tickets: [], totalTickets: 0, page: 1, totalPages: 1 }),
    createTicket: vi.fn(),
    assignTicket: vi.fn(),
    requestPurchase: vi.fn(),
    verifyTicket: vi.fn(),
    updateStatus: vi.fn(),
    listCategories: vi.fn().mockResolvedValue([]),
    listTechnicians: vi.fn().mockResolvedValue([]),
  },
}));

function renderWithStore(ui, { preloadedState = {} } = {}) {
  const store = configureStore({
    reducer: { tickets: ticketReducer },
    preloadedState,
  });
  return render(<Provider store={store}>{ui}</Provider>);
}

const baseTicket = {
  id: "t-1",
  title: "Printer jam",
  description: "Paper is stuck in the main tray",
  status: "IN_PROGRESS",
  slaExceeded: false,
  category: { expectedResolutionHours: 24 },
};

const resolveBtn = () => screen.getByRole("button", { name: /resolve ticket/i });

describe("TicketResolveModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders resolution form fields", () => {
    renderWithStore(<TicketResolveModal isOpen={true} onClose={() => {}} ticket={baseTicket} />);
    expect(screen.getByLabelText(/diagnosis/i)).toBeDefined();
    expect(screen.getByLabelText(/work performed/i)).toBeDefined();
    expect(screen.getByLabelText(/parts replaced/i)).toBeDefined();
    expect(screen.getByLabelText(/recommendations/i)).toBeDefined();
    expect(screen.getByLabelText(/parts were purchased by office/i)).toBeDefined();
  });

  test("diagnosis and work performed are required", async () => {
    renderWithStore(<TicketResolveModal isOpen={true} onClose={() => {}} ticket={baseTicket} />);
    fireEvent.click(resolveBtn());
    await waitFor(() => {
      expect(screen.getByText("Diagnosis is required")).toBeDefined();
      expect(screen.getByText("Work performed is required")).toBeDefined();
    });
  });

  test("purchasedByOffice toggle works", () => {
    renderWithStore(<TicketResolveModal isOpen={true} onClose={() => {}} ticket={baseTicket} />);
    const checkbox = screen.getByLabelText(/parts were purchased by office/i);
    expect(checkbox.checked).toBe(false);
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });

  test("SLA justification is not shown when slaExceeded is false", () => {
    renderWithStore(<TicketResolveModal isOpen={true} onClose={() => {}} ticket={baseTicket} />);
    expect(screen.queryByLabelText(/sla justification/i)).toBeNull();
  });

  test("SLA justification is shown when slaExceeded is true", () => {
    renderWithStore(
      <TicketResolveModal isOpen={true} onClose={() => {}} ticket={{ ...baseTicket, slaExceeded: true }} />
    );
    expect(screen.getByLabelText(/sla justification/i)).toBeDefined();
  });

  test("submit is disabled when slaExceeded is true and justification is empty", async () => {
    renderWithStore(
      <TicketResolveModal isOpen={true} onClose={() => {}} ticket={{ ...baseTicket, slaExceeded: true }} />
    );
    fireEvent.change(screen.getByLabelText(/diagnosis/i), { target: { value: "Paper jam" } });
    fireEvent.change(screen.getByLabelText(/work performed/i), { target: { value: "Cleared tray" } });
    fireEvent.change(screen.getByLabelText(/sla justification/i), { target: { value: "   " } });
    fireEvent.click(resolveBtn());
    expect(mockResolveApi).not.toHaveBeenCalled();
  });

  test("submit is enabled when slaExceeded is true and valid justification is entered", async () => {
    mockResolveApi.mockResolvedValue({ message: "Ticket resolved successfully.", ticket: { id: "t-1", status: "RESOLVED" } });
    renderWithStore(
      <TicketResolveModal isOpen={true} onClose={() => {}} ticket={{ ...baseTicket, slaExceeded: true }} />
    );
    fireEvent.change(screen.getByLabelText(/diagnosis/i), { target: { value: "Paper jam" } });
    fireEvent.change(screen.getByLabelText(/work performed/i), { target: { value: "Cleared tray" } });
    fireEvent.change(screen.getByLabelText(/sla justification/i), {
      target: { value: "Technician was on leave" },
    });
    fireEvent.click(resolveBtn());
    await waitFor(() => {
      expect(mockResolveApi).toHaveBeenCalledWith("t-1", {
        diagnosis: "Paper jam",
        workPerformed: "Cleared tray",
        purchasedByOffice: false,
        slaJustification: "Technician was on leave",
      });
    });
  });

  test("successful resolution calls API with correct payload", async () => {
    mockResolveApi.mockResolvedValue({ message: "Ticket resolved successfully.", ticket: { id: "t-1", status: "RESOLVED" } });
    renderWithStore(<TicketResolveModal isOpen={true} onClose={() => {}} ticket={baseTicket} />);
    fireEvent.change(screen.getByLabelText(/diagnosis/i), { target: { value: "Paper jam" } });
    fireEvent.change(screen.getByLabelText(/work performed/i), { target: { value: "Cleared paper" } });
    fireEvent.change(screen.getByLabelText(/parts replaced/i), { target: { value: "None" } });
    fireEvent.click(screen.getByLabelText(/parts were purchased by office/i));
    fireEvent.click(resolveBtn());
    await waitFor(() => {
      expect(mockResolveApi).toHaveBeenCalledWith("t-1", {
        diagnosis: "Paper jam",
        workPerformed: "Cleared paper",
        partsReplaced: "None",
        purchasedByOffice: true,
      });
    });
  });

  test("API errors are displayed appropriately", async () => {
    mockResolveApi.mockRejectedValue({ message: "Diagnosis and work performed are required." });
    renderWithStore(<TicketResolveModal isOpen={true} onClose={() => {}} ticket={baseTicket} />);
    fireEvent.change(screen.getByLabelText(/diagnosis/i), { target: { value: "Jam" } });
    fireEvent.change(screen.getByLabelText(/work performed/i), { target: { value: "Fixed" } });
    fireEvent.click(resolveBtn());
    await waitFor(() => {
      expect(screen.getByText("Diagnosis and work performed are required.")).toBeDefined();
    });
  });
});
