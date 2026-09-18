import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { fetchTickets, updateTicketStatus } from "../../store/ticketSlice";
import { Pagination } from "../../components/Pagination";
import StatusBadge from "../../components/StatusBadge";
import PriorityBadge from "../../components/PriorityBadge";
import SlaIndicator from "../../components/SlaIndicator";
import { formatDate } from "../../components/ticketConfig";
import { toast } from "react-toastify";
import { RefreshCw } from "lucide-react";

const QUEUE_STATUSES = [
  "ASSIGNED",
  "IN_PROGRESS",
  "AWAITING_PURCHASE",
  "RESOLVED",
  "CLOSED",
];

export default function TechnicianQueue({ onRequestPurchase, onResolve, onViewAudit }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { tickets, loading, error, page, totalPages } = useSelector((s) => s.tickets);
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(() => {
    dispatch(fetchTickets({ status: statusFilter || undefined, page: currentPage, limit: 20 }));
  }, [dispatch, statusFilter, currentPage]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await dispatch(updateTicketStatus({ id: ticketId, status: newStatus })).unwrap();
      toast.success("Status updated");
      load();
    } catch (err) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  return (
    <div className="admin-surface workspace-page">
      <header className="workspace-header">
        <div>
          <h1>Technician Queue</h1>
        </div>
        <div className="workspace-actions">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="civic-select"
          >
            <option value="">All Statuses</option>
            {QUEUE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={load}
            className="button-secondary"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="workspace-alert" role="alert">{error}</div>
      )}

      {loading && (
        <div className="table-state">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Loading tickets…
        </div>
      )}

      {!loading && tickets.length === 0 && (
        <div className="table-state">No tickets found.</div>
      )}

      {!loading && tickets.length > 0 && (
        <div className="content-surface">
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
                        {ticket.status === "ASSIGNED" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(ticket.id, "IN_PROGRESS")}
                            className="button-primary"
                          >
                            Start
                          </button>
                        )}
                        {ticket.status === "IN_PROGRESS" && (
                          <button
                            type="button"
                            onClick={() => onResolve?.(ticket)}
                            className="button-primary"
                          >
                            Resolve
                          </button>
                        )}
                        {ticket.status === "IN_PROGRESS" && (
                          <button
                            type="button"
                            onClick={() => onRequestPurchase?.(ticket)}
                            className="button-primary"
                          >
                            Request Purchase
                          </button>
                        )}
                        {ticket.status === "AWAITING_PURCHASE" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(ticket.id, "IN_PROGRESS")}
                            className="button-primary"
                          >
                            Resume
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onViewAudit?.(ticket)}
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
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
