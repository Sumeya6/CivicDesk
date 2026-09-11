import Announcements from "./pages/admin/Announcements";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import PeriodicReports from "./pages/admin/PeriodicReports";
import AdvancedFilterBar from "./components/AdvancedFilterBar";

function App() {
  const { t, i18n } = useTranslation();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const changeLanguage = () => {
    const newLanguage = i18n.language === "en" ? "am" : "en";
    i18n.changeLanguage(newLanguage);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Language Switcher */}
      <div className="flex justify-end p-4">
        <button
          onClick={changeLanguage}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          {i18n.language === "en" ? "አማርኛ" : "English"}
        </button>
      </div>

      <div className="px-6 pb-6">
        <div className="mx-auto max-w-7xl">
          <PeriodicReports />

          <div className="mt-8">
            <Announcements />
          </div>

          <div className="mt-8">
            <AdvancedFilterBar onResults={setResults} onLoading={setLoading} />
          </div>

          <div className="mt-6 rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-bold text-gray-800">
              {t("searchFilters.searchResults")}
            </h2>

            {loading && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-12 w-full animate-pulse rounded-lg bg-gray-200"
                  />
                ))}
              </div>
            )}

            {!loading && results === null && (
              <p className="text-gray-500">{t("searchFilters.useFilters")}</p>
            )}

            {!loading &&
              results !== null &&
              Array.isArray(results) &&
              results.length === 0 && (
                <p className="text-gray-500">{t("searchFilters.noTickets")}.</p>
              )}

            {!loading && Array.isArray(results) && results.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="p-3">Ticket</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Created</th>
                    </tr>
                  </thead>

                  <tbody>
                    {results.map((ticket, index) => (
                      <tr
                        key={ticket.id || index}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-3">{ticket.id || "N/A"}</td>

                        <td className="p-3">{ticket.status || "N/A"}</td>

                        <td className="p-3">{ticket.priority || "N/A"}</td>

                        <td className="p-3">
                          {ticket.category?.nameEn ||
                            ticket.category?.name ||
                            ticket.categoryId ||
                            "N/A"}
                        </td>

                        <td className="p-3">
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
