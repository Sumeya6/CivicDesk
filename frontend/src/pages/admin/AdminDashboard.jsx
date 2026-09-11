import {
  BarChart3,
  Building2,
  Megaphone,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import AnnouncementBoard from "../../components/AnnouncementBoard";
import { fetchOffices } from "../../store/officeSlice";
import { fetchUsers } from "../../store/userSlice";

function AdminDashboard() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const users = useSelector((state) => state.users.items);
  const offices = useSelector((state) => state.offices.items);
  const announcements = useSelector((state) => state.announcements.items);
  const activeUsers = users.filter((user) => user.isActive).length;
  const technicians = users.filter((user) => user.role === "TECHNICIAN").length;

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchOffices());
  }, [dispatch]);

  return (
    <section className="dashboard-page" aria-labelledby="admin-dashboard-title">
      <header className="dashboard-welcome">
        <div>
          <p className="dashboard-eyebrow">{t("dashboard.adminLabel")}</p>
          <h1 id="admin-dashboard-title">{t("dashboard.adminTitle")}</h1>
          <p>{t("dashboard.adminDescription")}</p>
        </div>
        <div className="dashboard-quick-actions">
          <Link to="/users">
            <Users size={16} />
            {t("dashboard.manageUsers")}
          </Link>
          <Link to="/offices">
            <Building2 size={16} />
            {t("dashboard.manageOffices")}
          </Link>
        </div>
      </header>
      <div className="dashboard-stat-grid">
        <div className="dashboard-stat">
          <span className="dashboard-stat-icon">
            <Users size={18} />
          </span>
          <div>
            <span>{t("dashboard.totalUsers")}</span>
            <strong>{users.length}</strong>
          </div>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-icon dashboard-stat-icon-green">
            <ShieldCheck size={18} />
          </span>
          <div>
            <span>{t("dashboard.activeUsers")}</span>
            <strong>{activeUsers}</strong>
          </div>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-icon dashboard-stat-icon-cyan">
            <Wrench size={18} />
          </span>
          <div>
            <span>{t("dashboard.technicians")}</span>
            <strong>{technicians}</strong>
          </div>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-icon dashboard-stat-icon-cyan">
            <Building2 size={18} />
          </span>
          <div>
            <span>{t("dashboard.offices")}</span>
            <strong>{offices.length}</strong>
          </div>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-icon dashboard-stat-icon-purple">
            <Megaphone size={18} />
          </span>
          <div>
            <span>{t("dashboard.activeAnnouncements")}</span>
            <strong>{announcements.length}</strong>
          </div>
        </div>
      </div>
      <div className="dashboard-grid dashboard-grid-two">
        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <h2>{t("dashboard.quickActions")}</h2>
          </div>
          <div className="dashboard-action-list">
            <Link to="/users">
              <Users size={16} />
              <span>{t("dashboard.manageUsers")}</span>
            </Link>
            <Link to="/offices">
              <Building2 size={16} />
              <span>{t("dashboard.manageOffices")}</span>
            </Link>
            <Link to="/reports">
              <BarChart3 size={16} />
              <span>{t("dashboard.viewReports")}</span>
            </Link>
          </div>
        </section>
        <AnnouncementBoard />
      </div>
      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <h2>{t("dashboard.openRequests")}</h2>
        </div>
        <div className="dashboard-empty">
          <p>{t("dashboard.requestsUnavailable")}</p>
        </div>
      </section>
    </section>
  );
}

export default AdminDashboard;
