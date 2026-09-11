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
import UserManagement from "../pages/admin/UserManagement";
import { store } from "../store/store";
import axios from "../api/axios";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const offices = [
  {
    id: "office-1",
    code: "AR-01",
    nameEn: "Arada One",
    nameAm: "አራዳ አንድ",
    isActive: true,
  },
];
const users = [
  {
    id: "user-1",
    fullName: "Aster Employee",
    phoneNumber: "0911111111",
    role: "EMPLOYEE",
    officeId: "office-1",
    isActive: true,
  },
  {
    id: "user-2",
    fullName: "Dawit Technician",
    phoneNumber: "0922222222",
    role: "TECHNICIAN",
    officeId: "office-1",
    isActive: true,
  },
  {
    id: "user-3",
    fullName: "Marta Admin",
    phoneNumber: "0933333333",
    role: "ADMIN",
    officeId: null,
    isActive: false,
  },
];

function renderPage() {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  axios.get.mockImplementation((url, config) => {
    if (url === "/offices")
      return Promise.resolve({
        data: { offices, meta: { total: offices.length } },
      });
    if (url === "/users" && config?.params?.role === "TECHNICIAN")
      return Promise.resolve({
        data: { users: [users[1]], meta: { total: 1 } },
      });
    return Promise.resolve({ data: { users, meta: { total: users.length } } });
  });
  axios.put.mockResolvedValue({ data: { user: users[0] } });
  axios.post.mockResolvedValue({
    data: { user: { ...users[0], id: "new-user" } },
  });
  axios.delete.mockResolvedValue({
    data: { user: users[0] },
  });
});

describe("UserManagement", () => {
  it("renders the user directory rows", async () => {
    renderPage();

    expect(await screen.findByText("Aster Employee")).toBeTruthy();
    expect(screen.getByText("Dawit Technician")).toBeTruthy();
    expect(screen.getByText("Marta Admin")).toBeTruthy();
    expect(screen.getAllByTestId("user-row")).toHaveLength(3);
  });

  it("filters users by role", async () => {
    renderPage();
    await screen.findByText("Aster Employee");

    fireEvent.click(screen.getByRole("button", { name: "TECHNICIAN" }));

    await waitFor(() =>
      expect(screen.getAllByTestId("user-row")).toHaveLength(1),
    );
    expect(screen.getByText("Dawit Technician")).toBeTruthy();
    expect(axios.get).toHaveBeenCalledWith("/users", {
      params: { role: "TECHNICIAN" },
    });
  });

  it("opens and closes the add user modal", async () => {
    renderPage();
    await screen.findByText("Aster Employee");

    fireEvent.click(screen.getByRole("button", { name: /add user/i }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /add user/i })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("opens the edit user modal with existing values", async () => {
    renderPage();
    expect(await screen.findByText("Aster Employee")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByDisplayValue("Aster Employee")).toBeTruthy();
    expect(screen.getByDisplayValue("0911111111")).toBeTruthy();
  });

  it("opens technician office assignment interactions", async () => {
    renderPage();
    await screen.findByText("Dawit Technician");

    fireEvent.click(screen.getByRole("button", { name: /assign offices/i }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    const officeOption = screen.getByRole("button", { name: /Arada One/ });
    fireEvent.click(officeOption);
    expect(officeOption.getAttribute("aria-pressed")).toBe("true");
  });

  it("confirms and deletes a user", async () => {
    renderPage();
    await screen.findByText("Aster Employee");

    fireEvent.click(screen.getAllByRole("button", { name: /delete/i })[0]);
    expect(
      screen.getByText("Are you sure you want to delete this user?"),
    ).toBeTruthy();

    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /^delete$/i,
      }),
    );

    await waitFor(() =>
      expect(axios.delete).toHaveBeenCalledWith("/users/user-1"),
    );
    await waitFor(() =>
      expect(screen.queryByText("Aster Employee")).toBeNull(),
    );
  });
});
