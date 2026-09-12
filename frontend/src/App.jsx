import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
// import Login from "./pages/auth/Login";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import CreateTicket from "./pages/employee/CreateTicket";
import TechnicianDashboard from "./pages/technician/TechnicianDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
// import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* <Route path="/login" element={<Login />} /> */}

      <Route
        element={
          // <ProtectedRoute>
          <AppLayout />
          // </ProtectedRoute>
        }
      >
        <Route path="/employee" element={<EmployeeDashboard />} />
        <Route path="/employee/create" element={<CreateTicket />} />
        <Route path="/technician" element={<TechnicianDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/tickets" element={<AdminDashboard />} />
      </Route>

      {/* <Route path="*" element={<Navigate to="/login" replace />} /> */}
    </Routes>
  );
}
