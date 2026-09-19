import React, { Suspense } from "react";
import { useSelector } from "react-redux";
import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";

const Login = React.lazy(() => import("./pages/auth/Login"));
const Register = React.lazy(() => import("./pages/auth/Register"));
const ForgotPassword = React.lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = React.lazy(() => import("./pages/auth/ResetPassword"));
const Unauthorized = React.lazy(() => import("./pages/auth/Unauthorized"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const DashboardRouter = React.lazy(() => import("./pages/DashboardRouter"));
const EmployeeDashboard = React.lazy(
  () => import("./pages/employee/EmployeeDashboard"),
);
const CreateTicket = React.lazy(() => import("./pages/employee/CreateTicket"));
const AssignedRequests = React.lazy(
  () => import("./pages/technician/AssignedRequests"),
);
const TicketManagement = React.lazy(
  () => import("./pages/admin/TicketManagement"),
);
const UserManagement = React.lazy(() => import("./pages/admin/UserManagement"));
const OfficeManagement = React.lazy(
  () => import("./pages/admin/OfficeManagement"),
);
const Announcements = React.lazy(() => import("./pages/admin/Announcements"));
const AnnouncementBoard = React.lazy(
  () => import("./components/AnnouncementBoard"),
);
const PeriodicReports = React.lazy(
  () => import("./pages/admin/PeriodicReports"),
);
const AssetManagement = React.lazy(
  () => import("./pages/admin/AssetManagement"),
);
const AssetDetail = React.lazy(() => import("./pages/employee/AssetDetail"));
const Profile = React.lazy(() => import("./pages/Profile"));

function LoadingFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-(--civic-blue-800) border-t-transparent" />
    </div>
  );
}

function AnnouncementsAccess() {
  const role = useSelector((state) => state.auth.role);

  if (role === "ADMIN") {
    return <Announcements />;
  }

  return <AnnouncementBoard />;
}

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
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
                  <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                    <EmployeeDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/requests/create"
                element={
                  <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                    <CreateTicket />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assigned-requests"
                element={
                  <ProtectedRoute allowedRoles={["TECHNICIAN"]}>
                    <AssignedRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tickets"
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <TicketManagement />
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
                path="/announcements"
                element={
                  <ProtectedRoute
                    allowedRoles={["EMPLOYEE", "TECHNICIAN", "ADMIN"]}
                  >
                    <AnnouncementsAccess />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <PeriodicReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assets"
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <AssetManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assets/:id"
                element={
                  <ProtectedRoute allowedRoles={["ADMIN", "EMPLOYEE", "TECHNICIAN"]}>
                    <AssetDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute
                    allowedRoles={["EMPLOYEE", "TECHNICIAN", "ADMIN"]}
                  >
                    <Profile />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
