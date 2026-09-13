import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Ticket, RefreshCw } from "lucide-react";
import api from "../../api/axios";
import AdvancedFilterBar from "../../components/AdvancedFilterBar";
import StatusBadge from "../../components/StatusBadge";
import PriorityBadge from "../../components/PriorityBadge";
import { Pagination } from "../../components/Pagination";
import EmptyState from "../../components/EmptyState";
import SkeletonBlock from "../../components/SkeletonBlock";

const pageSize = 10;

function TicketManagement() {
  const { t } = useTranslation();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");

  const queryParams = useMemo(() => ({ page, limit: pageSize }), [page]);

  const loadTickets = async (currentPage = page, overrides = {}) => {
    try {
      setLoading(true);
      setError("");

      const params = {
        ...queryParams,
        ...overrides,
        page: currentPage,
        limit: pageSize,
      };

      const { data } = await api.get("/tickets/search", { params });
      setResults(data.data ?? []);
      setTotalPages(Math.max(data.totalPages ?? 1, 1));
      setPage(data.currentPage ?? currentPage);
    } catch (err) {
      setResults([]);
      setTotalPages(1);
      setError(err.message || t("searchFilters.unableToSearch"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResults = (tickets) => {
    if (!Array.isArray(tickets)) {
      setResults([]);
      return;
    }

    setResults(tickets);
    setTotalPages((previous) => Math.max(previous, 1));
  };

  const handleRefresh = () => {
    loadTickets(page);
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
                  </tr>
                </thead>
                <tbody>
                  {results.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>
                        <div className="entity-name">
                          {ticket.title ||
                            ticket.subject ||
                            ticket.description ||
                            "-"}
                        </div>
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
                      <td>{ticket.office?.nameEn || "-"}</td>
                      <td>{ticket.category?.nameEn || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={(nextPage) => loadTickets(nextPage)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TicketManagement;
