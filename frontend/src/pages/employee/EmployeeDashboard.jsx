import { ClipboardList, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import AnnouncementBoard from "../../components/AnnouncementBoard";

function EmptyRequestPanel({ title, description }) {
  return <section className="dashboard-panel"><div className="dashboard-panel-heading"><h2>{title}</h2><span className="dashboard-panel-icon"><ClipboardList size={18} /></span></div><div className="dashboard-empty"><p>{description}</p></div></section>;
}

function EmployeeDashboard() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  return (
    <section className="dashboard-page" aria-labelledby="employee-dashboard-title">
      <header className="dashboard-welcome"><div><p className="dashboard-eyebrow">{t("dashboard.employeeLabel")}</p><h1 id="employee-dashboard-title">{t("dashboard.welcome")}, {currentUser?.fullName ?? "User"}</h1><p>{t("dashboard.employeeDescription")}</p></div><Link className="dashboard-primary-action" to="/requests/create"><PlusCircle size={17} />{t("dashboard.createRequest")}</Link></header>
      <div className="dashboard-grid dashboard-grid-two"><EmptyRequestPanel title={t("dashboard.myRequests")} description={t("dashboard.requestsUnavailable")} /><EmptyRequestPanel title={t("dashboard.statusOverview")} description={t("dashboard.requestsUnavailable")} /></div>
      <div className="dashboard-grid dashboard-grid-two"><EmptyRequestPanel title={t("dashboard.recentRequests")} description={t("dashboard.requestsUnavailable")} /><AnnouncementBoard /></div>
    </section>
  );
}

export default EmployeeDashboard;