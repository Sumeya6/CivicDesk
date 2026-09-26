import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import TicketDetailModal from "../components/TicketDetailModal";
import ticketApi from "../api/ticketApi";

vi.mock("../api/ticketApi", () => ({
  default: {
    getTicket: vi.fn(),
  },
}));

const mockTicketData = {
  id: "t12345678-abcd",
  title: "Printer Network Failure",
  description: "Unable to print from Office 201 due to subnet mismatch.",
  status: "IN_PROGRESS",
  priority: "HIGH",
  deviceOrSystem: "HP LaserJet Pro",
  createdAt: "2026-09-20T10:00:00.000Z",
  updatedAt: "2026-09-20T12:00:00.000Z",
  resolvedAt: "2026-09-20T11:30:00.000Z",
  closedAt: null,
  category: {
    id: "cat-1",
    nameEn: "Networking",
    nameAm: "ኔትወርክ",
    expectedResolutionHours: 24,
  },
  slaExceeded: false,
  slaJustification: null,
  requiresPurchase: true,
  purchaseDetails: "Replacement Ethernet NIC card required.",
  isApproved: true,
  rating: 5,
  feedback: "Great fast service",
  office: { id: "off-1", nameEn: "IT Department", nameAm: "አይቲ ክፍል", code: "IT-01" },
  employee: { id: "emp-1", fullName: "Abebe Kebede", phoneNumber: "+251911223344", role: "EMPLOYEE" },
  technician: { id: "tech-1", fullName: "Tigist Bekele", phoneNumber: "+251922334455", role: "TECHNICIAN" },
  asset: { id: "ast-1", assetTag: "AST-999", name: "Printer Unit" },
  maintenanceNote: {
    diagnosis: "Blown NIC card resistor",
    workPerformed: "Replaced NIC card module",
    partsReplaced: "NIC card module",
    recommendations: "Installed surge protector",
    purchasedByOffice: true,
  },
  auditLogs: [
    {
      id: "log-1",
      action: "CREATED",
      createdAt: "2026-09-20T10:00:00.000Z",
      actorId: "emp-1",
      actor: { id: "emp-1", fullName: "Abebe Kebede", role: "EMPLOYEE" },
    },
    {
      id: "log-2",
      action: "MANUAL_ASSIGNED",
      createdAt: "2026-09-20T10:05:00.000Z",
      previousValue: null,
      newValue: "tech-1",
      previousDisplayValue: null,
      newDisplayValue: "Tigist Bekele",
      actorId: "admin-1",
      actor: { id: "admin-1", fullName: "Admin User", role: "ADMIN" },
    },
  ],
};

describe("TicketDetailModal", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnClose.mockClear();
  });

  test("does not render when isOpen is false", () => {
    render(<TicketDetailModal isOpen={false} onClose={mockOnClose} ticketId="t12345678-abcd" />);
    expect(screen.queryByText("Ticket Details")).toBeNull();
  });

  test("fetches ticket details and renders 5 sections when open", async () => {
    ticketApi.getTicket.mockResolvedValue({ data: mockTicketData });

    render(<TicketDetailModal isOpen={true} onClose={mockOnClose} ticketId="t12345678-abcd" />);

    await waitFor(() => {
      expect(ticketApi.getTicket).toHaveBeenCalledWith("t12345678-abcd");
    });

    // Check title and section headers
    expect(screen.getByText("Overview")).toBeTruthy();
    expect(screen.getByText("People & Assignment")).toBeTruthy();
    expect(screen.getByText("SLA & Workflow")).toBeTruthy();
    expect(screen.getByText("Work & Purchasing")).toBeTruthy();
    expect(screen.getByText("Closure & Feedback")).toBeTruthy();

    // Check content details
    expect(screen.getByText("Printer Network Failure")).toBeTruthy();
    expect(screen.getByText("Unable to print from Office 201 due to subnet mismatch.")).toBeTruthy();
    expect(screen.getByText("IT Department")).toBeTruthy();
    expect(screen.getByText("Abebe Kebede")).toBeTruthy();
    expect(screen.getAllByText("Tigist Bekele").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Replacement Ethernet NIC card required.")).toBeTruthy();
    expect(screen.getByText("Blown NIC card resistor")).toBeTruthy();
    expect(screen.getByText("Replaced NIC card module")).toBeTruthy();
    expect(screen.getByText("NIC card module")).toBeTruthy();
    expect(screen.getByText("Installed surge protector")).toBeTruthy();
    expect(screen.getByText(/Sep 21, 2026/)).toBeTruthy();
    expect(screen.getByText("Great fast service")).toBeTruthy();
    expect(screen.getByText("Activity Timeline")).toBeTruthy();
    expect(screen.getByText("Manually Assigned")).toBeTruthy();
    expect(screen.getAllByText("Tigist Bekele").length).toBeGreaterThanOrEqual(2);
  });

  test("renders View Audit Trail button and triggers AuditTrailModal", async () => {
    ticketApi.getTicket.mockResolvedValue({ data: mockTicketData });

    render(<TicketDetailModal isOpen={true} onClose={mockOnClose} ticketId="t12345678-abcd" />);

    await waitFor(() => {
      expect(screen.getByText("View Audit Trail")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("View Audit Trail"));

    await waitFor(() => {
      expect(screen.getByText("Audit Trail")).toBeTruthy();
    });
  });

  test("displays error alert when ticket fetch fails", async () => {
    ticketApi.getTicket.mockRejectedValue(new Error("Ticket not found"));

    render(<TicketDetailModal isOpen={true} onClose={mockOnClose} ticketId="invalid-id" />);

    await waitFor(() => {
      expect(screen.getByText("Ticket not found")).toBeTruthy();
    });
  });
});
