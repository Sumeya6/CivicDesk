import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  RotateCcw,
  CalendarDays,
  Users,
  Tag,
  AlertCircle,
} from "lucide-react";
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
  q: "",
};

const filterKeyMap = {
  reporter: "employeeId",
  technician: "technicianId",
  office: "officeId",
  category: "categoryId",
};

function FilterGroup({ icon, label, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

function FilterField({ label, htmlFor, children }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-sm font-medium text-gray-600"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClasses =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20";

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
      Object.entries(filters)
        .filter(([, value]) => value !== "")
        .map(([key, value]) => [filterKeyMap[key] || key, value]),
    );

    try {
      const response = await api.get("/tickets/search", {
        params: payload,
      });

      onResults?.(response.data.data || []);
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
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-gray-800">
          {t("searchFilters.title")}
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">
          {t("searchFilters.description")}
        </p>
      </div>

      <form onSubmit={handleSearch} className="p-5 sm:p-6">
        <div className="space-y-5">
          <FilterGroup
            icon={<CalendarDays className="h-3.5 w-3.5" />}
            label={t("searchFilters.dateRange") || "Date Range"}
          >
            <FilterField label={t("searchFilters.startDate")} htmlFor="startDate">
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={filters.startDate}
                onChange={handleChange}
                className={inputClasses}
              />
            </FilterField>
            <FilterField label={t("searchFilters.endDate")} htmlFor="endDate">
              <input
                id="endDate"
                name="endDate"
                type="date"
                value={filters.endDate}
                onChange={handleChange}
                className={inputClasses}
              />
            </FilterField>
          </FilterGroup>

          <div className="border-t border-gray-100" />

          <FilterGroup
            icon={<Users className="h-3.5 w-3.5" />}
            label={t("searchFilters.assignment") || "Assignment"}
          >
            <FilterField label={t("searchFilters.reporter")} htmlFor="reporter">
              <input
                id="reporter"
                name="reporter"
                type="text"
                value={filters.reporter}
                onChange={handleChange}
                placeholder={t("searchFilters.employeeId")}
                className={inputClasses}
              />
            </FilterField>
            <FilterField label={t("searchFilters.technician")} htmlFor="technician">
              <input
                id="technician"
                name="technician"
                type="text"
                value={filters.technician}
                onChange={handleChange}
                placeholder={t("searchFilters.technicianId")}
                className={inputClasses}
              />
            </FilterField>
            <FilterField label={t("searchFilters.office")} htmlFor="office">
              <input
                id="office"
                name="office"
                type="text"
                value={filters.office}
                onChange={handleChange}
                placeholder={t("searchFilters.officeId")}
                className={inputClasses}
              />
            </FilterField>
          </FilterGroup>

          <div className="border-t border-gray-100" />

          <FilterGroup
            icon={<Tag className="h-3.5 w-3.5" />}
            label={t("searchFilters.ticketDetails") || "Ticket Details"}
          >
            <FilterField label={t("searchFilters.status")} htmlFor="status">
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleChange}
                className={inputClasses}
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
            </FilterField>
            <FilterField label={t("searchFilters.priority")} htmlFor="priority">
              <select
                id="priority"
                name="priority"
                value={filters.priority}
                onChange={handleChange}
                className={inputClasses}
              >
                <option value="">{t("searchFilters.allPriorities")}</option>
                <option value="LOW">{t("priority.low")}</option>
                <option value="MEDIUM">{t("priority.medium")}</option>
                <option value="HIGH">{t("priority.high")}</option>
                <option value="CRITICAL">{t("priority.critical")}</option>
              </select>
            </FilterField>
            <FilterField label={t("searchFilters.category")} htmlFor="category">
              <input
                id="category"
                name="category"
                type="text"
                value={filters.category}
                onChange={handleChange}
                placeholder={t("searchFilters.categoryId")}
                className={inputClasses}
              />
            </FilterField>
          </FilterGroup>

          <div className="border-t border-gray-100" />

          <FilterField label={t("searchFilters.freeTextSearch")} htmlFor="q">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="q"
                name="q"
                type="text"
                value={filters.q}
                onChange={handleChange}
                placeholder={t("searchFilters.freeTextSearchPlaceholder") || t("searchFilters.freeTextSearch")}
                className={`${inputClasses} pl-9`}
              />
            </div>
          </FilterField>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Search className="h-4 w-4" />
            {t("searchFilters.searchTickets")}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            <RotateCcw className="h-4 w-4" />
            {t("common.reset")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdvancedFilterBar;
