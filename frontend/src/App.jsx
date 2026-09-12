import Announcements from "./pages/admin/Announcements";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import PeriodicReports from "./pages/admin/PeriodicReports";
import AdvancedFilterBar from "./components/AdvancedFilterBar";
import StatusBadge from "./components/StatusBadge";
import PriorityBadge from "./components/PriorityBadge";
import SkeletonBlock from "./components/SkeletonBlock";
import EmptyState from "./components/EmptyState";
import { Search, Globe } from "lucide-react";

function App() {
  const { t, i18n } = useTranslation();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const changeLanguage = () => {
    const newLanguage = i18n.language === "en" ? "am" : "en";
    i18n.changeLanguage(newLanguage);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-gray-800">
              CivicDesk
            </span>
          </div>
          <button
            onClick={changeLanguage}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
          >
            <Globe className="h-3.5 w-3.5" />
            {i18n.language === "en" ? "አማርኛ" : "English"}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="space-y-8">
          <PeriodicReports />

          <Announcements />

          <AdvancedFilterBar onResults={setResults} onLoading={setLoading} />

          {/* Search Results */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-800">
                {t("searchFilters.searchResults")}
              </h2>
            </div>

            {loading && (
              <div className="p-5">
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((item) => (
                    <SkeletonBlock key={item} className="h-12" />
                  ))}
                </div>
              </div>
            )}

            {!loading && results === null && (
              <div className="p-5">
                <EmptyState
                  icon={<Search className="h-5 w-5" />}
                  title={t("searchFilters.useFilters")}
                  description={t("searchFilters.freeTextSearch")}
                />
              </div>
            )}

            {!loading &&
              results !== null &&
              Array.isArray(results) &&
              results.length === 0 && (
                <div className="p-5">
                  <EmptyState
                    icon={<Search className="h-5 w-5" />}
                    title={t("searchFilters.noTickets")}
                  />
                </div>
              )}

            {!loading && Array.isArray(results) && results.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Ticket
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Priority
                      </th>
                      <th className="hidden px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 sm:table-cell">
                        Category
                      </th>
                      <th className="hidden px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 sm:table-cell">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.map((ticket, index) => (
                      <tr
                        key={ticket.id || index}
                        className="transition hover:bg-gray-50/50"
                      >
                        <td className="max-w-[200px] truncate px-5 py-3 font-medium text-gray-800">
                          {ticket.id || "N/A"}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="px-5 py-3">
                          <PriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="hidden px-5 py-3 text-gray-600 sm:table-cell">
                          {ticket.category?.nameEn ||
                            ticket.category?.name ||
                            ticket.categoryId ||
                            "-"}
                        </td>
                        <td className="hidden px-5 py-3 text-gray-600 sm:table-cell">
                          {ticket.createdAt
                            ? new Date(ticket.createdAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
