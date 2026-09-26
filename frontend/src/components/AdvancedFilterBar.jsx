import { useState, useEffect } from "react";
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
import ticketApi from "../api/ticketApi";

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
      <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-[var(--civic-muted)]">
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
        className="civic-label"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClasses = "civic-input";

function AdvancedFilterBar({ onResults, onLoading }) {
  const { t, i18n } = useTranslation();

  const [filters, setFilters] = useState(initialFilters);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    ticketApi
      .listCategories()
      .then((data) => {
        if (isMounted) {
          const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
          setCategories(list.filter((c) => c.isActive !== false));
        }
      })
      .catch((err) => {
        console.error("Failed to load categories for search filter:", err);
      })
      .finally(() => {
        if (isMounted) setCategoriesLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

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

      onResults?.(response.data.data?.data || []);
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
    <div className="civic-card">
      <div className="civic-card-header">
        <h2>{t("searchFilters.title")}</h2>
        <p>{t("searchFilters.description")}</p>
      </div>

      <form onSubmit={handleSearch} className="civic-card-body">
        <div className="space-y-4">
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

          <div className="border-t border-[var(--civic-border)]" />

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

          <div className="border-t border-[var(--civic-border)]" />

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
              <select
                id="category"
                name="category"
                value={filters.category}
                onChange={handleChange}
                disabled={categoriesLoading}
                className={inputClasses}
              >
                <option value="">{t("searchFilters.allCategories", "All categories")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {i18n.language === "am" ? cat.nameAm || cat.nameEn : cat.nameEn || cat.nameAm}
                  </option>
                ))}
              </select>
              {categoriesLoading && (
                <p className="mt-1 text-[11px] text-[var(--civic-muted)]">
                  {t("searchFilters.loadingCategories", "Loading categories...")}
                </p>
              )}
            </FilterField>
          </FilterGroup>

          <div className="border-t border-[var(--civic-border)]" />

          <FilterField label={t("searchFilters.freeTextSearch")} htmlFor="q">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--civic-muted)]" />
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
          <div className="civic-alert civic-alert-error mt-4" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 border-t border-[var(--civic-border)] pt-4">
          <button
            type="submit"
            className="button-primary inline-flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            {t("searchFilters.searchTickets")}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="button-secondary inline-flex items-center gap-2"
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
