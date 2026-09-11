import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { store } from "../store/store";
import { logout as resetAuthState } from "../store/authSlice";
import axios from "../api/axios";

vi.mock("../api/axios", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

function TestConsumer() {
  const {
    currentUser,
    role,
    preferredLanguage,
    isAuthenticated,
    login,
    logout,
    changeLanguage,
  } = useAuth();

  return (
    <div>
      <div data-testid="auth-state">{String(isAuthenticated)}</div>
      <div data-testid="user-name">{currentUser?.fullName ?? "none"}</div>
      <div data-testid="role">{role ?? "none"}</div>
      <div data-testid="language">{preferredLanguage ?? "none"}</div>
      <button
        onClick={() =>
          login({ phoneNumber: "0911111111", password: "secret123" })
        }
      >
        Login
      </button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => changeLanguage("EN")}>Change Language</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </MemoryRouter>
    </Provider>,
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    store.dispatch(resetAuthState());
    vi.clearAllMocks();
    axios.get.mockRejectedValue({ response: { status: 401 } });
  });

  it("restores authenticated user from /auth/me on startup", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        user: {
          id: "1",
          fullName: "Jane Doe",
          role: "ADMIN",
          preferredLanguage: "EN",
          isActive: true,
          office: { id: "office-1" },
        },
      },
    });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getAllByTestId("auth-state")[0].textContent).toBe("true");
    });

    expect(axios.get).toHaveBeenCalledWith("/auth/me");
    expect(screen.getAllByTestId("user-name")[0].textContent).toBe("Jane Doe");
    expect(screen.getAllByTestId("role")[0].textContent).toBe("ADMIN");
    expect(screen.getAllByTestId("language")[0].textContent).toBe("EN");
  });

  it("login updates authentication state", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        user: {
          id: "2",
          fullName: "John Doe",
          role: "EMPLOYEE",
          preferredLanguage: "AM",
          isActive: true,
          office: { id: "office-2" },
        },
      },
    });

    renderWithProvider();
    const loginButton = screen.getAllByRole("button", { name: /login/i })[0];
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getAllByTestId("auth-state")[0].textContent).toBe("true");
    });

    expect(axios.post).toHaveBeenCalledWith("/auth/login", {
      phoneNumber: "0911111111",
      password: "secret123",
    });
    expect(screen.getAllByTestId("user-name")[0].textContent).toBe("John Doe");
    expect(screen.getAllByTestId("role")[0].textContent).toBe("EMPLOYEE");
    expect(screen.getAllByTestId("language")[0].textContent).toBe("AM");
  });

  it("logout clears authentication", async () => {
    axios.post
      .mockResolvedValueOnce({
        data: {
          user: {
            id: "3",
            fullName: "Aster",
            role: "TECHNICIAN",
            preferredLanguage: "AM",
            isActive: true,
            office: { id: "office-3" },
          },
        },
      })
      .mockResolvedValueOnce({ data: { message: "Logout successful." } });

    renderWithProvider();
    const loginButton = screen.getAllByRole("button", { name: /login/i })[0];
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getAllByTestId("auth-state")[0].textContent).toBe("true");
    });

    fireEvent.click(screen.getAllByRole("button", { name: /logout/i })[0]);

    await waitFor(() => {
      expect(screen.getAllByTestId("auth-state")[0].textContent).toBe("false");
    });
    expect(screen.getAllByTestId("user-name")[0].textContent).toBe("none");
  });

  it("changeLanguage updates language", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        user: {
          id: "4",
          fullName: "Aster",
          role: "TECHNICIAN",
          preferredLanguage: "AM",
          isActive: true,
          office: { id: "office-4" },
        },
      },
    });

    renderWithProvider();
    const loginButton = screen.getAllByRole("button", { name: /login/i })[0];
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getAllByTestId("auth-state")[0].textContent).toBe("true");
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /change language/i })[0],
    );

    expect(screen.getAllByTestId("language")[0].textContent).toBe("EN");
  });
});
