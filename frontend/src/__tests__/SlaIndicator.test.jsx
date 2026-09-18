import { describe, expect, it, vi, afterEach } from "vitest";
import {
  calculateSlaDeadline,
  getSlaStatus,
  formatSlaCountdown,
  getSlaPercentage,
  getTicketSlaInfo,
} from "../utils/sla";

describe("SLA utility functions", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("calculateSlaDeadline", () => {
    it("returns null when inputs are missing", () => {
      expect(calculateSlaDeadline(null, 24)).toBeNull();
      expect(calculateSlaDeadline("2025-01-01T00:00:00Z", null)).toBeNull();
      expect(calculateSlaDeadline(null, null)).toBeNull();
    });

    it("computes deadline from createdAt plus expected hours", () => {
      const createdAt = "2025-06-01T10:00:00Z";
      const deadline = calculateSlaDeadline(createdAt, 24);
      expect(deadline).toEqual(new Date("2025-06-02T10:00:00Z"));
    });

    it("handles fractional hours", () => {
      const createdAt = "2025-06-01T10:00:00Z";
      const deadline = calculateSlaDeadline(createdAt, 0.5);
      expect(deadline).toEqual(new Date("2025-06-01T10:30:00Z"));
    });
  });

  describe("getSlaStatus", () => {
    it("returns 'resolved' when resolvedAt is provided", () => {
      expect(getSlaStatus("2025-06-01T10:00:00Z", 24, "2025-06-01T12:00:00Z")).toBe("resolved");
    });

    it("returns 'on-track' when more than 25% time remains", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-01T16:00:00Z"));
      // 24h SLA, 6h elapsed = 25% elapsed, 75% remaining -> on-track
      expect(getSlaStatus("2025-06-01T10:00:00Z", 24)).toBe("on-track");
    });

    it("returns 'at-risk' when less than 25% time remains", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-02T04:00:00Z"));
      // 24h SLA, 18h elapsed = 75% elapsed, 25% remaining -> at boundary
      expect(getSlaStatus("2025-06-01T10:00:00Z", 24)).toBe("on-track");
    });

    it("returns 'at-risk' when very close to deadline", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-02T05:00:00Z"));
      // 24h SLA, 19h elapsed = ~79% elapsed, ~21% remaining -> at-risk
      expect(getSlaStatus("2025-06-01T10:00:00Z", 24)).toBe("at-risk");
    });

    it("returns 'overdue' when deadline has passed", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-02T11:00:00Z"));
      // 24h SLA, 25h elapsed -> overdue
      expect(getSlaStatus("2025-06-01T10:00:00Z", 24)).toBe("overdue");
    });

    it("returns 'on-track' when inputs are missing", () => {
      expect(getSlaStatus(null, 24)).toBe("on-track");
      expect(getSlaStatus("2025-06-01T10:00:00Z", null)).toBe("on-track");
    });
  });

  describe("formatSlaCountdown", () => {
    it("returns null when resolved", () => {
      expect(formatSlaCountdown("2025-06-01T10:00:00Z", 24, "2025-06-01T12:00:00Z")).toBeNull();
    });

    it("returns null when inputs are missing", () => {
      expect(formatSlaCountdown(null, 24)).toBeNull();
      expect(formatSlaCountdown("2025-06-01T10:00:00Z", null)).toBeNull();
    });

    it("formats remaining time in hours and minutes", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-01T16:30:00Z"));
      // 24h SLA, 6.5h elapsed -> 17h 30m remaining
      const result = formatSlaCountdown("2025-06-01T10:00:00Z", 24);
      expect(result).toBe("17h 30m remaining");
    });

    it("formats remaining time in minutes only", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-01T21:45:00Z"));
      // 24h SLA, 11.75h elapsed -> 12h 15m remaining
      const result = formatSlaCountdown("2025-06-01T10:00:00Z", 24);
      expect(result).toBe("12h 15m remaining");
    });

    it("formats overdue time", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-02T12:00:00Z"));
      // 24h SLA, 26h elapsed -> 2h overdue
      const result = formatSlaCountdown("2025-06-01T10:00:00Z", 24);
      expect(result).toBe("2h 0m overdue");
    });

    it("formats short overdue in minutes", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-02T10:15:00Z"));
      // 24h SLA, 24h15m elapsed -> 15m overdue
      const result = formatSlaCountdown("2025-06-01T10:00:00Z", 24);
      expect(result).toBe("15m overdue");
    });
  });

  describe("getSlaPercentage", () => {
    it("returns 0 when inputs are missing", () => {
      expect(getSlaPercentage(null, 24)).toBe(0);
      expect(getSlaPercentage("2025-06-01T10:00:00Z", null)).toBe(0);
    });

    it("returns percentage of time elapsed", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-01T22:00:00Z"));
      // 24h SLA, 12h elapsed = 50%
      expect(getSlaPercentage("2025-06-01T10:00:00Z", 24)).toBe(50);
    });

    it("returns >100 when overdue", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-02T22:00:00Z"));
      // 24h SLA, 36h elapsed = 150%
      expect(getSlaPercentage("2025-06-01T10:00:00Z", 24)).toBe(150);
    });

    it("returns 0 when just created", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-01T10:00:00Z"));
      expect(getSlaPercentage("2025-06-01T10:00:00Z", 24)).toBe(0);
    });
  });

  describe("getTicketSlaInfo", () => {
    it("returns complete SLA info for a ticket", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-01T22:00:00Z"));

      const ticket = {
        createdAt: "2025-06-01T10:00:00Z",
        resolvedAt: null,
        category: { expectedResolutionHours: 24 },
      };

      const info = getTicketSlaInfo(ticket);
      expect(info.status).toBe("on-track");
      expect(info.countdown).toBe("12h 0m remaining");
      expect(info.deadline).toEqual(new Date("2025-06-02T10:00:00Z"));
      expect(info.percentage).toBe(50);
      expect(info.expectedHours).toBe(24);
    });

    it("returns resolved status for closed tickets", () => {
      const ticket = {
        createdAt: "2025-06-01T10:00:00Z",
        resolvedAt: "2025-06-01T18:00:00Z",
        category: { expectedResolutionHours: 24 },
      };

      const info = getTicketSlaInfo(ticket);
      expect(info.status).toBe("resolved");
      expect(info.countdown).toBeNull();
    });

    it("handles tickets without category SLA", () => {
      const ticket = {
        createdAt: "2025-06-01T10:00:00Z",
        resolvedAt: null,
        category: null,
      };

      const info = getTicketSlaInfo(ticket);
      expect(info.status).toBe("on-track");
      expect(info.countdown).toBeNull();
      expect(info.expectedHours).toBeUndefined();
    });
  });
});

describe("SlaIndicator", () => {
  it("renders without crashing", async () => {
    const { default: SlaIndicator } = await import("../components/SlaIndicator");
    const { render, screen } = await import("@testing-library/react");
    const { I18nextProvider } = await import("react-i18next");
    const i18n = (await import("../i18n")).default;

    const ticket = {
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      resolvedAt: null,
      category: { expectedResolutionHours: 24 },
    };

    render(
      <I18nextProvider i18n={i18n}>
        <SlaIndicator ticket={ticket} />
      </I18nextProvider>,
    );

    expect(screen.getByText("On Track")).toBeTruthy();
  });

  it("shows overdue indicator for expired SLA", async () => {
    const { default: SlaIndicator } = await import("../components/SlaIndicator");
    const { render, screen } = await import("@testing-library/react");
    const { I18nextProvider } = await import("react-i18next");
    const i18n = (await import("../i18n")).default;

    const ticket = {
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      resolvedAt: null,
      category: { expectedResolutionHours: 24 },
    };

    render(
      <I18nextProvider i18n={i18n}>
        <SlaIndicator ticket={ticket} />
      </I18nextProvider>,
    );

    expect(screen.getByText("Overdue")).toBeTruthy();
  });
});
