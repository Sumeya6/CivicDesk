import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { Provider } from "react-redux";
import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import { store } from "../store/store";
import { logout as resetAuthState, setCredentials } from "../store/authSlice";

function renderProtectedRoute(initialEntries = ["/secure"]) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route
              path="/unauthorized"
              element={<div>Unauthorized Page</div>}
            />
            <Route
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
              path="/secure"
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </Provider>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear();
    store.dispatch(resetAuthState());
  });

  it("redirects unauthenticated users to login", () => {
    renderProtectedRoute();

    expect(screen.getByText("Login Page")).toBeTruthy();
  });

  it("allows authorized roles to access the route", () => {
    store.dispatch(
      setCredentials({
        currentUser: {
          id: "1",
          fullName: "Admin",
          role: "ADMIN",
          preferredLanguage: "EN",
          isActive: true,
          office: { id: "office-1" },
        },
        role: "ADMIN",
        preferredLanguage: "EN",
      }),
    );

    renderProtectedRoute();

    expect(screen.getByText("Protected Content")).toBeTruthy();
  });

  it("blocks unauthorized roles", () => {
    store.dispatch(
      setCredentials({
        currentUser: {
          id: "2",
          fullName: "Employee",
          role: "EMPLOYEE",
          preferredLanguage: "AM",
          isActive: true,
          office: { id: "office-2" },
        },
        role: "EMPLOYEE",
        preferredLanguage: "AM",
      }),
    );

    renderProtectedRoute();

    expect(screen.getAllByText("Unauthorized Page").length).toBeGreaterThan(0);
  });
});
