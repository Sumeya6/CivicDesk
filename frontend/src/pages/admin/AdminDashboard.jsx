import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { fetchUsers } from "../../store/userSlice";
import { fetchOffices } from "../../store/officeSlice";
import { fetchTickets } from "../../store/ticketSlice";
import { Pagination } from "../../components/Pagination";
import StatusBadge from "../../components/StatusBadge";
import PriorityBadge from "../../components/PriorityBadge";
import SlaIndicator from "../../components/SlaIndicator";
import { formatDate } from "../../components/ticketConfig";
import { getSlaStatus } from "../../utils/sla";
import AssignTechnicianModal from "./AssignTechnicianModal";
import AuditTrailModal from "../../components/AuditTrailModal";
import {
  BarChart3,
  Building2,
  Megaphone,
  ShieldCheck,
  Users,
  Wrench,
  RefreshCw,
  UserCog,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import AnnouncementBoard from "../../components/AnnouncementBoard";

function AdminDashboard() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const users = useSelector((state) => state.users.items);
  const offices = useSelector((state) => state.offices.items);
  const announcements = useSelector((state) => state.announcements.items);
  const { tickets, loading, error, page, totalPages } = useSelector((s) => s.tickets);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [assignTicket, setAssignTicket] = useState(null);
  const [auditTicketId, setAuditTicketId] = useState(null);

  const activeUsers = users.filter((user) => user.isActive).length;
  const technicians = users.filter((user) => user.role === "TECHNICIAN").length;

  const slaSummary = useMemo(() => {
    let atRisk = 0;
    let overdue = 0;
    for (const ticket of tickets) {
      const status = getSlaStatus(
        ticket.createdAt,
        ticket.category?.expectedResolutionHours,
        ticket.resolvedAt,
      );
      if (status === "at-risk") atRisk++;
      if (status === "overdue") overdue++;
    }
    return { atRisk, overdue };
  }, [tickets]);

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchOffices());
  }, [dispatch]);

  const loadTickets = useCallback(() => {
    dispatch(fetchTickets({ status: statusFilter || undefined, page: currentPage, limit: 20 }));
  }, [dispatch, statusFilter, currentPage]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const STATUSES = ["PENDING", "ASSIGNED", "IN_PROGRESS", "AWAITING_PURCHASE", "RESOLVED", "CLOSED"];

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

      <div className="dashboard-stat-grid">
        <div className="dashboard-stat">
          <span className="dashboard-stat-icon">
            <AlertTriangle size={18} />
          </span>
          <div>
            <span>{t("sla.atRiskCount")}</span>
            <strong>{slaSummary.atRisk}</strong>
          </div>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-icon dashboard-stat-icon-red">
            <AlertCircle size={18} />
          </span>
          <div>
            <span>{t("sla.overdueCount")}</span>
            <strong>{slaSummary.overdue}</strong>
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
          <button
            type="button"
            onClick={loadTickets}
            className="button-secondary"
          >
            <RefreshCw className="h-4 w-4" />
            {t("dashboard.refresh", "Refresh")}
          </button>
        </div>

        {error && (
          <div className="workspace-alert" role="alert">{error}</div>
        )}

        <div className="flex items-center gap-2 px-4 pb-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="civic-select"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="table-state">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Loading tickets…
          </div>
        )}

        {!loading && tickets.length === 0 && (
          <div className="dashboard-empty">
            <p>No tickets found.</p>
          </div>
        )}

        {!loading && tickets.length > 0 && (
          <div className="table-scroll">
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>{t("ticketTable.title")}</th>
                  <th>{t("ticketTable.category")}</th>
                  <th>{t("ticketTable.priority")}</th>
                  <th>{t("ticketTable.status")}</th>
                  <th>{t("ticketTable.sla")}</th>
                  <th>{t("ticketTable.device")}</th>
                  <th>{t("ticketTable.created")}</th>
                  <th>{t("ticketTable.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <div className="entity-name">{ticket.title}</div>
                      {ticket.description && (
                        <div className="entity-secondary line-clamp-1">{ticket.description}</div>
                      )}
                    </td>
                    <td>
                      {ticket.category?.nameEn || ticket.categoryId}
                    </td>
                    <td>
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td>
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td>
                      <SlaIndicator ticket={ticket} />
                    </td>
                    <td>
                      {ticket.deviceOrSystem || "—"}
                    </td>
                    <td>
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => setAssignTicket(ticket)}
                          className="button-primary"
                        >
                          <UserCog className="h-3 w-3" />
                          Assign
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuditTicketId(ticket.id)}
                          className="table-action"
                        >
                          Audit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setCurrentPage} />
      </section>

      <AssignTechnicianModal
        isOpen={!!assignTicket}
        onClose={() => setAssignTicket(null)}
        ticket={assignTicket}
      />
      <AuditTrailModal
        isOpen={!!auditTicketId}
        onClose={() => setAuditTicketId(null)}
        ticketId={auditTicketId}
      />
    </section>
  );
}

export default AdminDashboard;
