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
import OfficeManagement from "../pages/admin/OfficeManagement";
import { store } from "../store/store";
import axios from "../api/axios";

vi.mock("../api/axios", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  axios.get.mockResolvedValue({
    data: {
      offices: [
        {
          id: "1",
          code: "AR-01",
          nameEn: "Arada Office",
          nameAm: "የአራዳ ቢሮ",
          isActive: true,
        },
      ],
      meta: { total: 1 },
    },
  });
  axios.delete.mockResolvedValue({ data: { office: { id: "1" } } });
});

describe("OfficeManagement", () => {
  it("renders offices from the office API", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <OfficeManagement />
        </MemoryRouter>
      </Provider>,
    );
    expect(await screen.findByText("Arada Office")).toBeTruthy();
    expect(screen.getByText("የአራዳ ቢሮ")).toBeTruthy();
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/offices", {
        params: { pageSize: 100 },
      }),
    );
  });

  it("confirms and deletes an office", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <OfficeManagement />
        </MemoryRouter>
      </Provider>,
    );
    await screen.findByText("Arada Office");

    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(
      screen.getByText("Are you sure you want to delete this office?"),
    ).toBeTruthy();

    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /^delete$/i,
      }),
    );

    await waitFor(() =>
      expect(axios.delete).toHaveBeenCalledWith("/offices/1"),
    );
    await waitFor(() => expect(screen.queryByText("Arada Office")).toBeNull());
  });
});
