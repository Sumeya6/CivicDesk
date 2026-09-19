import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  MapPin,
  Wrench,
  Clock,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchOfficeOptions } from "../../store/officeSlice";
import { fetchMyTechnicianOffices } from "../../store/userSlice";
import { fetchTickets } from "../../store/ticketSlice";
import AnnouncementBoard from "../../components/AnnouncementBoard";
import StatusBadge from "../../components/StatusBadge";
import PriorityBadge from "../../components/PriorityBadge";
import { formatDate } from "../../components/ticketConfig";

function TechnicianDashboard() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { currentUser } = useAuth();
  const offices = useSelector((state) => state.offices.items);
  const { tickets, loading } = useSelector((s) => s.tickets);
  const [assignedOfficeIds, setAssignedOfficeIds] = useState([]);

  const assignedOffices = offices.filter((office) =>
    assignedOfficeIds.includes(office.id),
  );

  useEffect(() => {
    if (offices.length === 0) dispatch(fetchOfficeOptions());
  }, [dispatch, offices.length]);

  useEffect(() => {
    dispatch(fetchMyTechnicianOffices())
      .unwrap()
      .then(setAssignedOfficeIds)
      .catch(() =>
        setAssignedOfficeIds(
          currentUser?.officeId ? [currentUser.officeId] : [],
        ),
      );
  }, [dispatch, currentUser?.officeId]);

  useEffect(() => {
    dispatch(fetchTickets({ page: 1, limit: 100 }));
  }, [dispatch]);

  const stats = useMemo(() => {
    const assigned = tickets.filter((t) => t.status === "ASSIGNED").length;
    const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS").length;
    const awaitingPurchase = tickets.filter(
      (t) => t.status === "AWAITING_PURCHASE",
    ).length;
    const resolved = tickets.filter(
      (t) => t.status === "RESOLVED" || t.status === "CLOSED",
    ).length;
    const highPriority = tickets.filter(
      (t) => t.priority === "HIGH" || t.priority === "CRITICAL",
    ).length;
    return { assigned, inProgress, awaitingPurchase, resolved, highPriority };
  }, [tickets]);

  const recentTickets = useMemo(() => {
    return [...tickets]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [tickets]);

  return (
    <section
      className="dashboard-page"
      aria-labelledby="technician-dashboard-title"
    >
      <header className="dashboard-welcome">
        <div>
          <p className="dashboard-eyebrow">{t("dashboard.technicianLabel")}</p>
          <h1 id="technician-dashboard-title">
            {t("dashboard.welcome")}, {currentUser?.fullName ?? t("common.user")}
          </h1>
          <p>{t("dashboard.technicianDescription")}</p>
        </div>
        <div className="dashboard-context-chip">
          <Wrench size={16} />
          {t("dashboard.serviceDesk")}
        </div>
      </header>

      <div className="dashboard-stat-grid">
        <div className="dashboard-stat">
          <span className="dashboard-stat-icon">
            <ClipboardList size={18} />
          </span>
          <div>
            <span>{t("dashboard.assignedRequests")}</span>
            <strong>{stats.assigned}</strong>
          </div>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-icon dashboard-stat-icon-cyan">
            <Clock size={18} />
          </span>
          <div>
            <span>{t("dashboard.inProgress")}</span>
            <strong>{stats.inProgress}</strong>
          </div>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-icon dashboard-stat-icon-purple">
            <ShoppingCart size={18} />
          </span>
          <div>
            <span>{t("status.awaitingPurchase")}</span>
            <strong>{stats.awaitingPurchase}</strong>
          </div>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-icon dashboard-stat-icon-green">
            <CheckCircle2 size={18} />
          </span>
          <div>
            <span>{t("status.resolved")}</span>
            <strong>{stats.resolved}</strong>
          </div>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-icon" style={{ color: "#b45309", background: "#fef3c7" }}>
            <AlertTriangle size={18} />
          </span>
          <div>
            <span>{t("priority.high")} / {t("priority.critical")}</span>
            <strong>{stats.highPriority}</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid-two">
        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <h2>{t("dashboard.assignedOffices")}</h2>
            <MapPin size={18} className="text-[var(--civic-muted)]" />
          </div>
          <div className="dashboard-list-empty">
            {assignedOffices.length > 0 ? (
              assignedOffices.map((office) => (
                <p key={office.id}>
                  {office.nameEn}
                  <span>{office.nameAm}</span>
                </p>
              ))
            ) : (
              <p>{t("dashboard.noAssignedOffices")}</p>
            )}
          </div>
        </section>
        <AnnouncementBoard />
      </div>

      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <h2>{t("dashboard.recentRequests")}</h2>
          <Link to="/assigned-requests" className="button-secondary no-underline text-[12.5px]">
            {t("dashboard.assignedRequests")} <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="table-state">{t("common.loading")}</div>
        ) : recentTickets.length === 0 ? (
          <div className="dashboard-empty">
            <p>{t("dashboard.requestsUnavailable")}</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>{t("ticketTable.title")}</th>
                  <th>{t("ticketTable.priority")}</th>
                  <th>{t("ticketTable.status")}</th>
                  <th>{t("ticketTable.created")}</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <div className="entity-name">{ticket.title}</div>
                    </td>
                    <td>
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td>
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td>{formatDate(ticket.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex justify-center">
        <Link to="/assigned-requests" className="dashboard-primary-action no-underline">
          {t("dashboard.assignedRequests")} <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

export default TechnicianDashboard;
