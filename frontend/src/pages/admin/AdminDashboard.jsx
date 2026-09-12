import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { fetchUsers } from "../../store/userSlice";
import { fetchOffices } from "../../store/officeSlice";
import { fetchTickets } from "../../store/ticketSlice";
import { Pagination, StatusBadge, PriorityBadge } from "../../components/Pagination";
import { formatDate } from "../../components/ticketConfig";
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
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            {t("dashboard.refresh", "Refresh")}
          </button>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="mb-3 flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[var(--civic-blue-700)] focus:outline-none focus:ring-1 focus:ring-[var(--civic-blue-700)]"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 text-slate-500">
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
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Device/System</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900">{ticket.title}</div>
                      {ticket.description && (
                        <div className="mt-0.5 text-xs text-slate-500 line-clamp-1">{ticket.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {ticket.category?.nameEn || ticket.categoryId}
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {ticket.deviceOrSystem || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => setAssignTicket(ticket)}
                          className="inline-flex items-center gap-1 rounded bg-[var(--civic-blue-800)] px-2 py-1 text-xs text-white hover:bg-[var(--civic-blue-950)]"
                        >
                          <UserCog className="h-3 w-3" />
                          Assign
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuditTicketId(ticket.id)}
                          className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
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
