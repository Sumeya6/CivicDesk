import { useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../api/axios";

const initialFilters = {
  reporter: "",
  technician: "",
  office: "",
  status: "",
  priority: "",
  category: "",
  startDate: "",
  endDate: "",
};

function AdvancedFilterBar({ onResults, onLoading }) {
  const { t } = useTranslation();

  const [filters, setFilters] = useState(initialFilters);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSearch = async (event) => {
    event.preventDefault();

    setError("");
    onLoading?.(true);

    const payload = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== ""),
    );

    try {
      const response = await api.get("/tickets/search", {
        params: payload,
      });

      onResults?.(response.data);
    } catch (err) {
      console.error("Ticket search failed:", err);

      setError(
        err.response?.data?.message || t("searchFilters.unableToSearch"),
      );

      onResults?.([]);
    } finally {
      onLoading?.(false);
    }
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setError("");
    onResults?.(null);
  };

  return (
    <div className="w-full rounded-xl bg-white p-6 shadow-md">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800">
          {t("searchFilters.title")}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {t("searchFilters.description")}
        </p>
      </div>

      <form onSubmit={handleSearch}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="reporter"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t("searchFilters.reporter")}
            </label>

            <input
              id="reporter"
              name="reporter"
              type="text"
              value={filters.reporter}
              onChange={handleChange}
              placeholder={t("searchFilters.employeeId")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="technician"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t("searchFilters.technician")}
            </label>

            <input
              id="technician"
              name="technician"
              type="text"
              value={filters.technician}
              onChange={handleChange}
              placeholder={t("searchFilters.technicianId")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="office"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t("searchFilters.office")}
            </label>

            <input
              id="office"
              name="office"
              type="text"
              value={filters.office}
              onChange={handleChange}
              placeholder={t("searchFilters.officeId")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t("searchFilters.status")}
            </label>

            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="">{t("searchFilters.allStatuses")}</option>

              <option value="PENDING">{t("status.pending")}</option>

              <option value="ASSIGNED">{t("status.assigned")}</option>

              <option value="IN_PROGRESS">{t("status.inProgress")}</option>

              <option value="AWAITING_PURCHASE">
                {t("status.awaitingPurchase")}
              </option>

              <option value="RESOLVED">{t("status.resolved")}</option>

              <option value="CLOSED">{t("status.closed")}</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="priority"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t("searchFilters.priority")}
            </label>

            <select
              id="priority"
              name="priority"
              value={filters.priority}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="">{t("searchFilters.allPriorities")}</option>

              <option value="LOW">{t("priority.low")}</option>

              <option value="MEDIUM">{t("priority.medium")}</option>

              <option value="HIGH">{t("priority.high")}</option>

              <option value="CRITICAL">{t("priority.critical")}</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="category"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t("searchFilters.category")}
            </label>

            <input
              id="category"
              name="category"
              type="text"
              value={filters.category}
              onChange={handleChange}
              placeholder={t("searchFilters.categoryId")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="startDate"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t("searchFilters.startDate")}
            </label>

            <input
              id="startDate"
              name="startDate"
              type="date"
              value={filters.startDate}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t("searchFilters.endDate")}
            </label>

            <input
              id="endDate"
              name="endDate"
              type="date"
              value={filters.endDate}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
          >
            {t("searchFilters.searchTickets")}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-gray-300 px-5 py-2 font-medium text-gray-700 hover:bg-gray-100"
          >
            {t("common.reset")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdvancedFilterBar;
