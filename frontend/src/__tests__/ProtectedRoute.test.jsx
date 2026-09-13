import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { Provider } from "react-redux";
import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import Sidebar from "../layouts/Sidebar";
import i18n from "../i18n";
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
    i18n.changeLanguage("en");
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

  it("shows the technician navigation set without exposing admin pages", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AuthProvider>
            <Sidebar role="TECHNICIAN" />
          </AuthProvider>
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByText("Assigned Requests")).toBeTruthy();
    expect(screen.getByText("Announcements")).toBeTruthy();
    expect(screen.getByText("Profile")).toBeTruthy();
    expect(screen.getByText("Logout")).toBeTruthy();
    expect(screen.queryByText("Users")).toBeNull();
    expect(screen.queryByText("Tickets")).toBeNull();
    expect(screen.queryByText("Reports")).toBeNull();
  });

  it("shows the employee navigation set without exposing admin pages", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AuthProvider>
            <Sidebar role="EMPLOYEE" />
          </AuthProvider>
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByText("My Requests")).toBeTruthy();
    expect(screen.getByText("New Request")).toBeTruthy();
    expect(screen.getByText("Announcements")).toBeTruthy();
    expect(screen.getByText("Profile")).toBeTruthy();
    expect(screen.getByText("Logout")).toBeTruthy();
    expect(screen.queryByText("Users")).toBeNull();
    expect(screen.queryByText("Tickets")).toBeNull();
    expect(screen.queryByText("Reports")).toBeNull();
  });
});
