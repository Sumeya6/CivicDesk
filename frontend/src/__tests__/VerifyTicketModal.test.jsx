import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { describe, test, expect, vi, beforeEach } from "vitest";
import ticketReducer from "../store/ticketSlice";
import VerifyTicketModal from "../pages/employee/VerifyTicketModal";

const mockVerifyApi = vi.fn();
vi.mock("../api/ticketApi", () => ({
  default: {
    verifyTicket: (...args) => mockVerifyApi(...args),
    getTicket: vi.fn().mockResolvedValue({ ticket: {} }),
    listTickets: vi.fn().mockResolvedValue({ tickets: [], totalTickets: 0, page: 1, totalPages: 1 }),
    createTicket: vi.fn(),
    assignTicket: vi.fn(),
    requestPurchase: vi.fn(),
    resolveTicket: vi.fn(),
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

const resolvedTicket = {
  id: "t-1",
  title: "Printer jam",
  description: "Paper stuck",
  status: "RESOLVED",
  slaExceeded: false,
};

describe("VerifyTicketModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders for a resolved ticket with approve/reject buttons", () => {
    renderWithStore(<VerifyTicketModal isOpen={true} onClose={() => {}} ticket={resolvedTicket} />);
    expect(screen.getByText("Approve Resolution")).toBeDefined();
    expect(screen.getByText("Reject Resolution")).toBeDefined();
  });

  test("renders five rating stars after choosing approve", () => {
    renderWithStore(<VerifyTicketModal isOpen={true} onClose={() => {}} ticket={resolvedTicket} />);
    fireEvent.click(screen.getByText("Approve Resolution"));
    const stars = screen.getAllByRole("radio", { name: /star/i });
    expect(stars).toHaveLength(5);
  });

  test("rating selection works", () => {
    renderWithStore(<VerifyTicketModal isOpen={true} onClose={() => {}} ticket={resolvedTicket} />);
    fireEvent.click(screen.getByText("Approve Resolution"));
    fireEvent.click(screen.getByRole("radio", { name: "4 stars" }));
    expect(screen.getByRole("radio", { name: "4 stars" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: "3 stars" }).getAttribute("aria-checked")).toBe("false");
  });

  test("approval cannot be submitted without a rating", async () => {
    renderWithStore(<VerifyTicketModal isOpen={true} onClose={() => {}} ticket={resolvedTicket} />);
    fireEvent.click(screen.getByText("Approve Resolution"));
    fireEvent.click(screen.getByText("Approve & Close"));
    expect(mockVerifyApi).not.toHaveBeenCalled();
  });

  test("feedback is optional", async () => {
    mockVerifyApi.mockResolvedValue({ message: "Closed", ticket: { id: "t-1", status: "CLOSED" } });
    renderWithStore(<VerifyTicketModal isOpen={true} onClose={() => {}} ticket={resolvedTicket} />);
    fireEvent.click(screen.getByText("Approve Resolution"));
    fireEvent.click(screen.getByRole("radio", { name: "5 stars" }));
    fireEvent.click(screen.getByText("Approve & Close"));
    await waitFor(() => {
      expect(mockVerifyApi).toHaveBeenCalledWith("t-1", { isApproved: true, rating: 5 });
    });
  });

  test("approval sends isApproved true with rating and feedback", async () => {
    mockVerifyApi.mockResolvedValue({ message: "Closed", ticket: { id: "t-1", status: "CLOSED" } });
    renderWithStore(<VerifyTicketModal isOpen={true} onClose={() => {}} ticket={resolvedTicket} />);
    fireEvent.click(screen.getByText("Approve Resolution"));
    fireEvent.click(screen.getByRole("radio", { name: "4 stars" }));
    fireEvent.change(screen.getByLabelText(/feedback/i), { target: { value: "Great work" } });
    fireEvent.click(screen.getByText("Approve & Close"));
    await waitFor(() => {
      expect(mockVerifyApi).toHaveBeenCalledWith("t-1", { isApproved: true, rating: 4, feedback: "Great work" });
    });
  });

  test("rejection sends isApproved false", async () => {
    mockVerifyApi.mockResolvedValue({ message: "Reopened", ticket: { id: "t-1", status: "IN_PROGRESS" } });
    renderWithStore(<VerifyTicketModal isOpen={true} onClose={() => {}} ticket={resolvedTicket} />);
    fireEvent.click(screen.getByText("Reject Resolution"));
    fireEvent.change(screen.getByLabelText(/feedback/i), { target: { value: "Still broken" } });
    fireEvent.click(screen.getByText("Reject & Reopen"));
    await waitFor(() => {
      expect(mockVerifyApi).toHaveBeenCalledWith("t-1", { isApproved: false, feedback: "Still broken" });
    });
  });

  test("API errors are handled and displayed", async () => {
    mockVerifyApi.mockRejectedValue({ message: "Only resolved tickets can be verified." });
    renderWithStore(<VerifyTicketModal isOpen={true} onClose={() => {}} ticket={resolvedTicket} />);
    fireEvent.click(screen.getByText("Reject Resolution"));
    fireEvent.click(screen.getByText("Reject & Reopen"));
    await waitFor(() => {
      expect(screen.getByText("Only resolved tickets can be verified.")).toBeDefined();
    });
  });
});
