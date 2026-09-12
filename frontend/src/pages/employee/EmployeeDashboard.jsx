import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PlusCircle, RefreshCw, CheckCircle } from "lucide-react";
import { fetchTickets } from "../../store/ticketSlice";
import { Pagination } from "../../components/Pagination";
import StatusBadge from "../../components/StatusBadge";
import PriorityBadge from "../../components/PriorityBadge";
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
            className="button-secondary"
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
        <div className="workspace-alert" role="alert">
          {error}
        </div>
      )}

      {loading && (
        <div className="table-state">
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
          <div className="table-scroll">
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
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
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {ticket.status === "RESOLVED" && (
                          <button
                            type="button"
                            onClick={() => setVerifyTicket(ticket)}
                            className="button-primary"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Verify
                          </button>
                        )}
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
