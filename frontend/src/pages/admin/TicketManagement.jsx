import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Ticket, RefreshCw, UserCog, Eye } from "lucide-react";
import api from "../../api/axios";
import AdvancedFilterBar from "../../components/AdvancedFilterBar";
import StatusBadge from "../../components/StatusBadge";
import PriorityBadge from "../../components/PriorityBadge";
import { Pagination } from "../../components/Pagination";
import EmptyState from "../../components/EmptyState";
import SkeletonBlock from "../../components/SkeletonBlock";
import AssignTechnicianModal from "./AssignTechnicianModal";
import TicketDetailModal from "../../components/TicketDetailModal";

const pageSize = 10;

function TicketManagement() {
  const { t, i18n } = useTranslation();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [assignTicket, setAssignTicket] = useState(null);
  const [detailTicketId, setDetailTicketId] = useState(null);

  async function fetchTickets(currentPage, overrides = {}) {
    try {
      setLoading(true);
      setError("");
      const params = { page: currentPage, limit: pageSize, ...overrides };
      const { data } = await api.get("/tickets/search", { params });
      setResults(data.data?.data ?? []);
      setTotalPages(Math.max(data.data?.totalPages ?? 1, 1));
      setPage(data.data?.currentPage ?? currentPage);
    } catch (err) {
      setResults([]);
      setTotalPages(1);
      setError(err.message || t("searchFilters.unableToSearch"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get("/tickets/search", {
          params: { page: 1, limit: pageSize },
        });
        if (!cancelled) {
          setResults(data.data?.data ?? []);
          setTotalPages(Math.max(data.data?.totalPages ?? 1, 1));
          setPage(data.data?.currentPage ?? 1);
        }
      } catch (err) {
        if (!cancelled) {
          setResults([]);
          setTotalPages(1);
          setError(err.message || t("searchFilters.unableToSearch"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [t]);

  const handleResults = (tickets) => {
    if (!Array.isArray(tickets)) {
      setResults([]);
      return;
    }
    setResults(tickets);
    setTotalPages((previous) => Math.max(previous, 1));
  };

  const handleRefresh = () => {
    fetchTickets(page);
  };

  return (
    <div className="admin-surface workspace-page">
      <header className="workspace-header">
        <div>
          <p className="workspace-eyebrow">
            <Ticket size={14} /> {t("admin.administration")}
          </p>
          <h1>{t("navigation.tickets")}</h1>
          <p className="workspace-description">
            {t("searchFilters.description")}
          </p>
        </div>
        <div className="workspace-actions">
          <button
            type="button"
            className="button-secondary"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            {t("admin.refresh")}
          </button>
        </div>
      </header>

      <AdvancedFilterBar onResults={handleResults} onLoading={setLoading} />

      {error && (
        <div className="workspace-alert" role="alert">
          <Search className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">{t("searchFilters.unableToSearch")}</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="content-surface">
        <div className="content-surface-header">
          <h3>{t("searchFilters.searchResults")}</h3>
        </div>

        {loading ? (
          <div className="space-y-0 p-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                <SkeletonBlock className="h-8 w-8 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock className="h-4 w-1/3" />
                  <SkeletonBlock className="h-3 w-full" />
                  <SkeletonBlock className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={<Search className="h-5 w-5" />}
              title={t("searchFilters.noTickets")}
              description={t("searchFilters.useFilters")}
            />
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="workspace-table">
                <thead>
                  <tr>
                    <th>{t("searchFilters.title")}</th>
                    <th>{t("searchFilters.status")}</th>
                    <th>{t("searchFilters.priority")}</th>
                    <th>{t("searchFilters.office")}</th>
                    <th>{t("searchFilters.category")}</th>
                    <th>{t("admin.actions", "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>
                        {(() => {
                          const ticketTitle =
                            ticket.title || ticket.subject || ticket.description || "-";
                          return (
                        <button
                          type="button"
                          onClick={() => setDetailTicketId(ticket.id)}
                          aria-label={t("ticketDetail.viewDetailsFor", "View details for {{title}}", { title: ticketTitle })}
                          className="entity-name text-left hover:text-[var(--civic-blue-800)] hover:underline cursor-pointer"
                        >
                          {ticketTitle}
                        </button>
                          );
                        })()}
                        {ticket.description && (
                          <div className="entity-secondary line-clamp-1">
                            {ticket.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td>
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td>
                        {ticket.office
                          ? i18n.language === "am"
                            ? ticket.office.nameAm || ticket.office.nameEn
                            : ticket.office.nameEn || ticket.office.nameAm
                          : "-"}
                      </td>
                      <td>
                        {ticket.category
                          ? i18n.language === "am"
                            ? ticket.category.nameAm || ticket.category.nameEn
                            : ticket.category.nameEn || ticket.category.nameAm
                          : "-"}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailTicketId(ticket.id)}
                            className="button-secondary flex items-center gap-1 text-xs"
                          >
                            <Eye className="h-3 w-3" />
                            {t("ticketDetail.viewDetails", "View details")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setAssignTicket(ticket)}
                            className="button-primary flex items-center gap-1 text-xs"
                          >
                            <UserCog className="h-3 w-3" />
                            Assign
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={(nextPage) => fetchTickets(nextPage)}
              />
            )}
          </>
        )}
      </div>

      <AssignTechnicianModal
        isOpen={!!assignTicket}
        onClose={() => setAssignTicket(null)}
        ticket={assignTicket}
        onSuccess={handleRefresh}
      />

      <TicketDetailModal
        isOpen={!!detailTicketId}
        onClose={() => setDetailTicketId(null)}
        ticketId={detailTicketId}
      />
    </div>
  );
}

export default TicketManagement;
