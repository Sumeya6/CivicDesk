import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import PeriodicReports from "../pages/admin/PeriodicReports";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from "../api/axios";

const mockReportData = {
  total: 25,
  slaPercentage: 80,
  awaitingPurchase: 3,
  averageResolutionTimeHours: 12.5,
  averageSatisfactionRating: 4.2,
  technicianWorkload: [
    { technicianId: "t1", technician: "Alice", count: 10 },
    { technicianId: "t2", technician: "Bob", count: 8 },
  ],
  requestsByCategory: [
    { categoryId: "c1", category: "Hardware", count: 12 },
    { categoryId: "c2", category: "Software", count: 8 },
  ],
  ratingDistribution: { 5: 10, 4: 8, 3: 5, 2: 2, 1: 0 },
};

const mockSearchData = {
  data: [
    {
      id: "t1",
      title: "Printer issue",
      status: "PENDING",
      priority: "HIGH",
      office: { nameEn: "IT" },
      category: { nameEn: "Hardware" },
    },
  ],
  totalCount: 1,
  totalPages: 1,
  currentPage: 1,
};

describe("PeriodicReports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: mockReportData });
  });

  test("renders the page title", async () => {
    render(<PeriodicReports />);

    expect(
      screen.getByText("Admin Analytics & Periodic Reports"),
    ).toBeTruthy();
  });

  test("renders all five reporting period buttons", async () => {
    render(<PeriodicReports />);

    expect(screen.getByText("Monthly")).toBeTruthy();
    expect(screen.getByText("3 Months")).toBeTruthy();
    expect(screen.getByText("6 Months")).toBeTruthy();
    expect(screen.getByText("9 Months")).toBeTruthy();
    expect(screen.getByText("Annual")).toBeTruthy();
  });

  test("calls API with default period 1m on mount", async () => {
    render(<PeriodicReports />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/reports/summary", {
        params: { period: "1m" },
      });
    });
  });

  test("calls API with new period when period button is clicked", async () => {
    render(<PeriodicReports />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByText("6 Months"));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/reports/summary", {
        params: { period: "6m" },
      });
    });
  });

  test("displays loading skeletons before data loads", () => {
    api.get.mockReturnValue(new Promise(() => {}));

    const { container } = render(<PeriodicReports />);

    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test("renders report metrics after data loads", async () => {
    render(<PeriodicReports />);

    await waitFor(() => {
      expect(screen.getByText("25")).toBeTruthy();
    });

    expect(screen.getAllByText("80%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/12\.5/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/4\.2/).length).toBeGreaterThanOrEqual(1);
  });

  test("renders technician workload", async () => {
    render(<PeriodicReports />);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeTruthy();
    });

    expect(screen.getByText("Bob")).toBeTruthy();
  });

  test("renders category data", async () => {
    render(<PeriodicReports />);

    await waitFor(() => {
      expect(screen.getByText("Hardware")).toBeTruthy();
    });

    expect(screen.getByText("Software")).toBeTruthy();
  });

  test("renders export buttons", async () => {
    render(<PeriodicReports />);

    await waitFor(() => {
      expect(screen.getByText("Export CSV")).toBeTruthy();
    });

    expect(screen.getByText("Export PDF")).toBeTruthy();
  });

  test("renders search section", async () => {
    render(<PeriodicReports />);

    await waitFor(() => {
      expect(screen.getByText("Advanced Ticket Search")).toBeTruthy();
    });

    expect(screen.getByText("Search Tickets")).toBeTruthy();
    expect(screen.getByText("Reset")).toBeTruthy();
  });

  test("renders search filter controls", async () => {
    render(<PeriodicReports />);

    await waitFor(() => {
      expect(screen.getByText("All Statuses")).toBeTruthy();
    });

    expect(screen.getByText("All Priorities")).toBeTruthy();
    expect(screen.getByText("Start Date")).toBeTruthy();
    expect(screen.getByText("End Date")).toBeTruthy();
  });

  test("search triggers API call with filters", async () => {
    api.get.mockResolvedValueOnce({ data: mockReportData });

    render(<PeriodicReports />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(1);
    });

    api.get.mockResolvedValueOnce({ data: mockSearchData });

    fireEvent.click(screen.getByText("Search Tickets"));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/tickets/search", {
        params: expect.objectContaining({ page: 1, limit: 10 }),
      });
    });
  });

  test("search results display in table", async () => {
    api.get.mockResolvedValueOnce({ data: mockReportData });

    render(<PeriodicReports />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(1);
    });

    api.get.mockResolvedValueOnce({ data: mockSearchData });

    fireEvent.click(screen.getByText("Search Tickets"));

    await waitFor(() => {
      expect(screen.getByText("Printer issue")).toBeTruthy();
    });
  });

  test("reset clears search filters", async () => {
    api.get.mockResolvedValueOnce({ data: mockReportData });

    render(<PeriodicReports />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(1);
    });

    api.get.mockResolvedValueOnce({ data: mockSearchData });
    fireEvent.click(screen.getByText("Search Tickets"));

    await waitFor(() => {
      expect(screen.getByText("Printer issue")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("Reset"));

    await waitFor(() => {
      expect(screen.queryByText("Printer issue")).toBeNull();
    });
  });
});
