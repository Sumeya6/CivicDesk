import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { PlusCircle, RefreshCw, CheckCircle } from "lucide-react";
import { fetchTickets } from "../../store/ticketSlice";
import { Pagination } from "../../components/Pagination";
import StatusBadge from "../../components/StatusBadge";
import PriorityBadge from "../../components/PriorityBadge";
import SlaIndicator from "../../components/SlaIndicator";
import { formatDate } from "../../components/ticketConfig";
import { useAuth } from "../../context/AuthContext";
import CreateTicketModal from "./CreateTicketModal";
import VerifyTicketModal from "./VerifyTicketModal";
import AuditTrailModal from "../../components/AuditTrailModal";
import AnnouncementBoard from "../../components/AnnouncementBoard";

const STATUS_EXPLANATIONS = {
  PENDING: "pendingExplanation",
  ASSIGNED: "assignedExplanation",
  IN_PROGRESS: "inProgressExplanation",
  AWAITING_PURCHASE: "awaitingPurchaseExplanation",
  RESOLVED: "resolvedExplanation",
  CLOSED: "closedExplanation",
};

function EmptyRequestPanel({ title, description }) {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-heading">
        <h2>{title}</h2>
      </div>
      <div className="dashboard-empty">
        <p>{description}</p>
      </div>
    </section>
  );
}

function EmployeeDashboard() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { currentUser } = useAuth();
  const { tickets, loading, error, page, totalPages } = useSelector(
    (s) => s.tickets,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [verifyTicket, setVerifyTicket] = useState(null);
  const [auditTicketId, setAuditTicketId] = useState(null);
  const resolvedTickets = tickets.filter((ticket) => ticket.status === "RESOLVED");

  const load = useCallback(() => {
    dispatch(fetchTickets({ page: currentPage, limit: 20 }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section
      className="dashboard-page"
      aria-labelledby="employee-dashboard-title"
    >
      <header className="dashboard-welcome">
        <div>
          <p className="dashboard-eyebrow">{t("dashboard.employeeLabel")}</p>
          <h1 id="employee-dashboard-title">
            {t("dashboard.welcome")}, {currentUser?.fullName ?? t("common.user")}
          </h1>
          <p>{t("dashboard.employeeDescription")}</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={load} className="button-secondary">
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
          {t("common.loading")}
        </div>
      )}

      {!loading && resolvedTickets.length > 0 && (
        <section className="workflow-attention" aria-labelledby="employee-action-title">
          <div>
            <p className="dashboard-eyebrow">{t("workflow.employeeActionLabel")}</p>
            <h2 id="employee-action-title">{t("workflow.employeeActionTitle")}</h2>
            <p>{t("workflow.employeeActionHint")}</p>
          </div>
          <div className="workflow-attention-list">
            {resolvedTickets.map((ticket) => (
              <div key={ticket.id} className="workflow-attention-item">
                <div>
                  <strong>{ticket.title}</strong>
                  <span>{t("workflow.resolvedExplanation")}</span>
                </div>
                <button
                  type="button"
                  className="button-primary workflow-action"
                  onClick={() => setVerifyTicket(ticket)}
                  aria-label={`${t("workflow.verifyResolution")} ${ticket.title}`}
                >
                  <CheckCircle className="h-4 w-4" />
                  {t("workflow.verifyResolution")}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && tickets.length === 0 && (
        <div className="dashboard-grid dashboard-grid-two">
          <EmptyRequestPanel
            title={t("dashboard.myRequests")}
            description={t("dashboard.requestsUnavailable")}
          />
          <AnnouncementBoard />
        </div>
      )}

      {!loading && tickets.length > 0 && (
        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <h2>{t("dashboard.myRequests")}</h2>
          </div>
          <div className="mobile-ticket-list">
            {tickets.map((ticket) => (
              <article key={ticket.id} className="mobile-ticket-card">
                <div className="mobile-ticket-card-heading">
                  <div>
                    <h2>{ticket.title}</h2>
                    <p>{t(`workflow.${STATUS_EXPLANATIONS[ticket.status] || "statusExplanation"}`)}</p>
                  </div>
                  <StatusBadge status={ticket.status} />
                </div>
                <div className="mobile-ticket-meta">
                  <PriorityBadge priority={ticket.priority} />
                  <span>{ticket.technician?.fullName || t("workflow.notAssigned")}</span>
                </div>
                <div className="mobile-ticket-actions">
                  {ticket.status === "RESOLVED" && <button type="button" onClick={() => setVerifyTicket(ticket)} className="button-primary workflow-action" aria-label={`${t("workflow.verifyResolution")} ${ticket.title}`}><CheckCircle className="h-4 w-4" />{t("workflow.verifyResolution")}</button>}
                  <button type="button" onClick={() => setAuditTicketId(ticket.id)} className="table-action workflow-audit">{t("workflow.audit")}</button>
                </div>
              </article>
            ))}
          </div>
          <div className="table-scroll">
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>{t("ticketTable.title")}</th>
                  <th>{t("ticketTable.category")}</th>
                  <th>{t("ticketTable.priority")}</th>
                  <th>{t("ticketTable.status")}</th>
                  <th>{t("ticketTable.technician")}</th>
                  <th>{t("ticketTable.slaDeadline")}</th>
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
                        <div className="entity-secondary line-clamp-1">
                          {ticket.description}
                        </div>
                      )}
                    </td>
                    <td>{ticket.category?.nameEn || ticket.categoryId}</td>
                    <td>
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td>
                      <StatusBadge status={ticket.status} />
                      <span className="ticket-status-explanation">
                        {t(`workflow.${STATUS_EXPLANATIONS[ticket.status] || "statusExplanation"}`)}
                      </span>
                    </td>
                    <td>
                      {ticket.technician?.fullName || (
                        <span className="text-(--civic-muted)">—</span>
                      )}
                    </td>
                    <td>
                      <SlaIndicator ticket={ticket} />
                    </td>
                    <td>{formatDate(ticket.createdAt)}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {ticket.status === "RESOLVED" && (
                          <button
                            type="button"
                            onClick={() => setVerifyTicket(ticket)}
                            className="button-primary"
                          >
                            <CheckCircle className="h-3 w-3" />
                            {t("workflow.verifyResolution")}
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
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </section>
      )}

      <div className="dashboard-grid dashboard-grid-two">
        <div />
        <AnnouncementBoard />
      </div>

      <CreateTicketModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
      />
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
