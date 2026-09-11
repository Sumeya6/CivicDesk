import { useSelector } from "react-redux";
import AdminDashboard from "./admin/AdminDashboard";
import EmployeeDashboard from "./employee/EmployeeDashboard";
import TechnicianDashboard from "./technician/TechnicianDashboard";

function DashboardRouter() {
  const role = useSelector((state) => state.auth.role);
  if (role === "ADMIN") return <AdminDashboard />;
  if (role === "TECHNICIAN") return <TechnicianDashboard />;
  return <EmployeeDashboard />;
}

export default DashboardRouter;