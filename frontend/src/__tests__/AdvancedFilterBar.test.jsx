import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import AdvancedFilterBar from "../components/AdvancedFilterBar";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from "../api/axios";

const mockSearchData = {
  data: [
    {
      id: "t1",
      title: "Test ticket",
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

describe("AdvancedFilterBar", () => {
  const mockOnResults = vi.fn();
  const mockOnLoading = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnResults.mockClear();
    mockOnLoading.mockClear();
  });

  test("renders the filter title", () => {
    render(<AdvancedFilterBar />);

    expect(screen.getByText("Advanced Ticket Search")).toBeTruthy();
  });

  test("renders all filter fields", () => {
    render(<AdvancedFilterBar />);

    expect(screen.getByLabelText("Reporter")).toBeTruthy();
    expect(screen.getByLabelText("Assigned Technician")).toBeTruthy();
    expect(screen.getByLabelText("Sub-city Office")).toBeTruthy();
    expect(screen.getByLabelText("Status")).toBeTruthy();
    expect(screen.getByLabelText("Priority")).toBeTruthy();
    expect(screen.getByLabelText("Category")).toBeTruthy();
    expect(screen.getByLabelText("Start Date")).toBeTruthy();
    expect(screen.getByLabelText("End Date")).toBeTruthy();
    expect(screen.getByLabelText("Search by keyword")).toBeTruthy();
  });

  test("renders search and reset buttons", () => {
    render(<AdvancedFilterBar />);

    expect(screen.getByText("Search Tickets")).toBeTruthy();
    expect(screen.getByText("Reset")).toBeTruthy();
  });

  test("maps reporter field to employeeId in API call", async () => {
    api.get.mockResolvedValue({ data: mockSearchData });

    render(<AdvancedFilterBar onResults={mockOnResults} />);

    fireEvent.change(screen.getByLabelText("Reporter"), {
      target: { value: "emp-123" },
    });

    fireEvent.submit(screen.getByText("Search Tickets").closest("form"));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/tickets/search", {
        params: expect.objectContaining({ employeeId: "emp-123" }),
      });
    });
  });

  test("maps technician field to technicianId in API call", async () => {
    api.get.mockResolvedValue({ data: mockSearchData });

    render(<AdvancedFilterBar onResults={mockOnResults} />);

    fireEvent.change(screen.getByLabelText("Assigned Technician"), {
      target: { value: "tech-456" },
    });

    fireEvent.submit(screen.getByText("Search Tickets").closest("form"));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/tickets/search", {
        params: expect.objectContaining({ technicianId: "tech-456" }),
      });
    });
  });

  test("maps office field to officeId in API call", async () => {
    api.get.mockResolvedValue({ data: mockSearchData });

    render(<AdvancedFilterBar onResults={mockOnResults} />);

    fireEvent.change(screen.getByLabelText("Sub-city Office"), {
      target: { value: "off-789" },
    });

    fireEvent.submit(screen.getByText("Search Tickets").closest("form"));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/tickets/search", {
        params: expect.objectContaining({ officeId: "off-789" }),
      });
    });
  });

  test("maps category field to categoryId in API call", async () => {
    api.get.mockResolvedValue({ data: mockSearchData });

    render(<AdvancedFilterBar onResults={mockOnResults} />);

    fireEvent.change(screen.getByLabelText("Category"), {
      target: { value: "cat-abc" },
    });

    fireEvent.submit(screen.getByText("Search Tickets").closest("form"));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/tickets/search", {
        params: expect.objectContaining({ categoryId: "cat-abc" }),
      });
    });
  });

  test("sends status and priority directly", async () => {
    api.get.mockResolvedValue({ data: mockSearchData });

    render(<AdvancedFilterBar onResults={mockOnResults} />);

    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "RESOLVED" },
    });
    fireEvent.change(screen.getByLabelText("Priority"), {
      target: { value: "HIGH" },
    });

    fireEvent.submit(screen.getByText("Search Tickets").closest("form"));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/tickets/search", {
        params: expect.objectContaining({
          status: "RESOLVED",
          priority: "HIGH",
        }),
      });
    });
  });

  test("sends startDate and endDate", async () => {
    api.get.mockResolvedValue({ data: mockSearchData });

    render(<AdvancedFilterBar onResults={mockOnResults} />);

    fireEvent.change(screen.getByLabelText("Start Date"), {
      target: { value: "2026-09-01" },
    });
    fireEvent.change(screen.getByLabelText("End Date"), {
      target: { value: "2026-09-10" },
    });

    fireEvent.submit(screen.getByText("Search Tickets").closest("form"));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/tickets/search", {
        params: expect.objectContaining({
          startDate: "2026-09-01",
          endDate: "2026-09-10",
        }),
      });
    });
  });

  test("sends q free-text search parameter", async () => {
    api.get.mockResolvedValue({ data: mockSearchData });

    render(<AdvancedFilterBar onResults={mockOnResults} />);

    fireEvent.change(screen.getByLabelText("Search by keyword"), {
      target: { value: "printer" },
    });

    fireEvent.submit(screen.getByText("Search Tickets").closest("form"));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/tickets/search", {
        params: expect.objectContaining({ q: "printer" }),
      });
    });
  });

  test("submits multiple filters together", async () => {
    api.get.mockResolvedValue({ data: mockSearchData });

    render(<AdvancedFilterBar onResults={mockOnResults} />);

    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "PENDING" },
    });
    fireEvent.change(screen.getByLabelText("Priority"), {
      target: { value: "LOW" },
    });
    fireEvent.change(screen.getByLabelText("Sub-city Office"), {
      target: { value: "off-1" },
    });
    fireEvent.change(screen.getByLabelText("Search by keyword"), {
      target: { value: "laptop" },
    });

    fireEvent.submit(screen.getByText("Search Tickets").closest("form"));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/tickets/search", {
        params: expect.objectContaining({
          status: "PENDING",
          priority: "LOW",
          officeId: "off-1",
          q: "laptop",
        }),
      });
    });
  });

  test("does not send empty string values", async () => {
    api.get.mockResolvedValue({ data: mockSearchData });

    render(<AdvancedFilterBar onResults={mockOnResults} />);

    fireEvent.submit(screen.getByText("Search Tickets").closest("form"));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/tickets/search", {
        params: expect.not.objectContaining({
          employeeId: "",
          technicianId: "",
          officeId: "",
          categoryId: "",
        }),
      });
    });
  });

  test("calls onResults with data from API response", async () => {
    api.get.mockResolvedValue({ data: mockSearchData });

    render(<AdvancedFilterBar onResults={mockOnResults} />);

    fireEvent.submit(screen.getByText("Search Tickets").closest("form"));

    await waitFor(() => {
      expect(mockOnResults).toHaveBeenCalledWith(mockSearchData.data);
    });
  });

  test("calls onLoading with true then false", async () => {
    api.get.mockResolvedValue({ data: mockSearchData });

    render(<AdvancedFilterBar onLoading={mockOnLoading} />);

    fireEvent.submit(screen.getByText("Search Tickets").closest("form"));

    await waitFor(() => {
      expect(mockOnLoading).toHaveBeenCalledWith(true);
      expect(mockOnLoading).toHaveBeenCalledWith(false);
    });
  });

  test("shows error message on API failure", async () => {
    api.get.mockRejectedValue({
      response: { data: { message: "Search failed" } },
    });

    render(<AdvancedFilterBar onResults={mockOnResults} />);

    fireEvent.submit(screen.getByText("Search Tickets").closest("form"));

    await waitFor(() => {
      expect(screen.getByText("Search failed")).toBeTruthy();
    });
  });

  test("calls onResults with empty array on error", async () => {
    api.get.mockRejectedValue(new Error("Network error"));

    render(<AdvancedFilterBar onResults={mockOnResults} />);

    fireEvent.submit(screen.getByText("Search Tickets").closest("form"));

    await waitFor(() => {
      expect(mockOnResults).toHaveBeenCalledWith([]);
    });
  });

  test("reset clears all filters", async () => {
    render(<AdvancedFilterBar onResults={mockOnResults} />);

    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "RESOLVED" },
    });
    fireEvent.change(screen.getByLabelText("Search by keyword"), {
      target: { value: "test" },
    });

    fireEvent.click(screen.getByText("Reset"));

    expect(screen.getByLabelText("Status").value).toBe("");
    expect(screen.getByLabelText("Search by keyword").value).toBe("");
  });

  test("reset calls onResults with null", () => {
    render(<AdvancedFilterBar onResults={mockOnResults} />);

    fireEvent.click(screen.getByText("Reset"));

    expect(mockOnResults).toHaveBeenCalledWith(null);
  });
});
