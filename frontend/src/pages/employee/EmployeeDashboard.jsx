import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PlusCircle, RefreshCw, CheckCircle } from "lucide-react";
import { fetchTickets } from "../../store/ticketSlice";
import { Pagination, StatusBadge, PriorityBadge } from "../../components/Pagination";
import { formatDate } from "../../components/ticketConfig";
import { useAuth } from "../../context/AuthContext";
import CreateTicketModal from "./CreateTicketModal";
import VerifyTicketModal from "./VerifyTicketModal";
import AuditTrailModal from "../../components/AuditTrailModal";
import AnnouncementBoard from "../../components/AnnouncementBoard";

function EmptyRequestPanel({ title, description }) {
  return <section className="dashboard-panel"><div className="dashboard-panel-heading"><h2>{title}</h2></div><div className="dashboard-empty"><p>{description}</p></div></section>;
}

function EmployeeDashboard() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { currentUser } = useAuth();
  const { tickets, loading, error, page, totalPages } = useSelector((s) => s.tickets);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [verifyTicket, setVerifyTicket] = useState(null);
  const [auditTicketId, setAuditTicketId] = useState(null);

  const load = useCallback(() => {
    dispatch(fetchTickets({ page: currentPage, limit: 20 }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="dashboard-page" aria-labelledby="employee-dashboard-title">
      <header className="dashboard-welcome">
        <div>
          <p className="dashboard-eyebrow">{t("dashboard.employeeLabel")}</p>
          <h1 id="employee-dashboard-title">{t("dashboard.welcome")}, {currentUser?.fullName ?? "User"}</h1>
          <p>{t("dashboard.employeeDescription")}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            {t("dashboard.refresh", "Refresh")}
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="dashboard-primary-action"
          >
            <PlusCircle size={17} />
            {t("dashboard.createRequest")}
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Loading tickets…
        </div>
      )}

      {!loading && tickets.length === 0 && (
        <div className="dashboard-grid dashboard-grid-two">
          <EmptyRequestPanel title={t("dashboard.myRequests")} description={t("dashboard.requestsUnavailable")} />
          <AnnouncementBoard />
        </div>
      )}

      {!loading && tickets.length > 0 && (
        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <h2>{t("dashboard.myRequests")}</h2>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
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
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {ticket.status === "RESOLVED" && (
                          <button
                            type="button"
                            onClick={() => setVerifyTicket(ticket)}
                            className="inline-flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Verify
                          </button>
                        )}
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
          <Pagination page={page} totalPages={totalPages} onPageChange={setCurrentPage} />
        </section>
      )}

      <div className="dashboard-grid dashboard-grid-two">
        <div />
        <AnnouncementBoard />
      </div>

      <CreateTicketModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
      <VerifyTicketModal
        isOpen={!!verifyTicket}
        onClose={() => setVerifyTicket(null)}
        ticket={verifyTicket}
      />
      <AuditTrailModal
        isOpen={!!auditTicketId}
        onClose={() => setAuditTicketId(null)}
        ticketId={auditTicketId}
      />
    </section>
  );
}

export default EmployeeDashboard;
