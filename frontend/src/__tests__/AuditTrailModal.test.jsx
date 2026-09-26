import { render, screen, waitFor } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import AuditTrailModal from "../components/AuditTrailModal";
import ticketApi from "../api/ticketApi";

vi.mock("../api/ticketApi", () => ({
  default: { getTicket: vi.fn() },
}));

describe("AuditTrailModal", () => {
  test("uses actor and assignment display names without rendering UUIDs", async () => {
    ticketApi.getTicket.mockResolvedValue({
      data: {
        auditLogs: [
          {
            id: "log-1",
            action: "MANUAL_ASSIGNED",
            actorId: "actor-uuid-123",
            actor: {
              id: "actor-uuid-123",
              fullName: "Admin User",
              role: "ADMIN",
            },
            previousValue: "old-tech-uuid",
            newValue: "new-tech-uuid",
            previousDisplayValue: null,
            newDisplayValue: "Tigist Bekele",
            createdAt: "2026-09-20T10:05:00.000Z",
          },
          {
            id: "log-2",
            action: "STATUS_CHANGED",
            actorId: "legacy-actor-uuid",
            previousValue: "PENDING",
            newValue: "ASSIGNED",
            createdAt: "2026-09-20T10:06:00.000Z",
          },
        ],
      },
    });

    render(<AuditTrailModal isOpen onClose={vi.fn()} ticketId="ticket-1" />);

    await waitFor(() => expect(screen.getByText(/Admin User/)).toBeTruthy());
    expect(screen.getByText("Tigist Bekele")).toBeTruthy();
    expect(
      screen.getAllByText("System / Unknown user").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("actor-uuid-123")).toBeNull();
    expect(screen.queryByText("legacy-actor-uuid")).toBeNull();
    expect(screen.queryByText("old-tech-uuid")).toBeNull();
    expect(screen.queryByText("new-tech-uuid")).toBeNull();
  });
});
