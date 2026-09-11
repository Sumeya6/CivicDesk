import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Unauthorized from "./pages/auth/Unauthorized";
import OfficeManagement from "./pages/admin/OfficeManagement";
import UserManagement from "./pages/admin/UserManagement";
import DashboardRouter from "./pages/DashboardRouter";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route element={<AppLayout />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                allowedRoles={["EMPLOYEE", "TECHNICIAN", "ADMIN"]}
              >
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute
                allowedRoles={["EMPLOYEE", "TECHNICIAN", "ADMIN"]}
              >
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  Requests
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests/create"
            element={
              <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  Create Request
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assigned-requests"
            element={
              <ProtectedRoute allowedRoles={["TECHNICIAN"]}>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  Assigned Requests
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/offices"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <OfficeManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  Reports
                </div>
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
