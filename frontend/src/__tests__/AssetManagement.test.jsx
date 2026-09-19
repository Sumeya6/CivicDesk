import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import "../i18n";
import AssetManagement from "../pages/admin/AssetManagement";
import { store } from "../store/store";
import axios from "../api/axios";

vi.mock("../api/axios", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const mockAssets = [
  {
    id: "asset-1",
    assetTag: "IT-001",
    name: "Dell Latitude 5540",
    assetType: "COMPUTER",
    serialNumber: "SN-12345",
    status: "ACTIVE",
    officeId: "off1",
    employeeId: "emp-1",
    purchaseDate: "2024-01-15T00:00:00.000Z",
    warrantyExpiry: "2027-01-15T00:00:00.000Z",
    notes: null,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z",
    office: { id: "off1", code: "AR-01", nameAm: "አራዳ", nameEn: "Arada" },
    employee: { id: "emp-1", fullName: "Employee User" },
  },
  {
    id: "asset-2",
    assetTag: "PR-001",
    name: "HP LaserJet Pro",
    assetType: "PRINTER",
    serialNumber: "SN-67890",
    status: "MAINTENANCE",
    officeId: "off1",
    employeeId: null,
    purchaseDate: "2023-06-01T00:00:00.000Z",
    warrantyExpiry: "2026-06-01T00:00:00.000Z",
    notes: null,
    createdAt: "2023-06-01T00:00:00.000Z",
    updatedAt: "2023-06-01T00:00:00.000Z",
    office: { id: "off1", code: "AR-01", nameAm: "አራዳ", nameEn: "Arada" },
    employee: null,
  },
];

const mockOffices = [
  { id: "off1", code: "AR-01", nameAm: "አራዳ", nameEn: "Arada", isActive: true },
];

function renderPage() {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <AssetManagement />
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  axios.get.mockImplementation((url) => {
    if (url.startsWith("/assets"))
      return Promise.resolve({ data: { success: true, message: "Assets retrieved.", data: mockAssets, meta: { total: 2, page: 1, pageSize: 20, pageCount: 1 } } });
    if (url.startsWith("/offices"))
      return Promise.resolve({ data: { success: true, message: "Offices retrieved.", data: mockOffices, meta: { total: 1 } } });
    return Promise.reject(new Error(`unexpected request: ${url}`));
  });
  axios.patch.mockResolvedValue({ data: { success: true, message: "Asset archived.", data: { id: "asset-1", status: "ARCHIVED" } } });
});

describe("AssetManagement", () => {
  it("renders asset rows from the API", async () => {
    renderPage();
    expect(await screen.findByText("Dell Latitude 5540")).toBeTruthy();
    expect(screen.getByText("HP LaserJet Pro")).toBeTruthy();
    expect(screen.getAllByTestId("asset-row")).toHaveLength(2);
  });

  it("displays asset tag and type badges", async () => {
    renderPage();
    expect(await screen.findByText("IT-001")).toBeTruthy();
    expect(screen.getByText("PR-001")).toBeTruthy();
  });

  it("opens the add asset modal", async () => {
    renderPage();
    await screen.findByText("Dell Latitude 5540");
    fireEvent.click(screen.getByRole("button", { name: /add asset/i }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /add asset/i })).toBeTruthy();
  });

  it("opens the edit asset modal", async () => {
    renderPage();
    await screen.findByText("Dell Latitude 5540");
    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByDisplayValue("Dell Latitude 5540")).toBeTruthy();
  });

  it("archives an asset after confirmation", async () => {
    renderPage();
    await screen.findByText("Dell Latitude 5540");
    fireEvent.click(screen.getAllByRole("button", { name: /archive/i })[0]);
    expect(screen.getByText(/are you sure/i)).toBeTruthy();
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: /archive/i }),
    );
    await waitFor(() =>
      expect(axios.patch).toHaveBeenCalledWith("/assets/asset-1/archive"),
    );
  });
});
