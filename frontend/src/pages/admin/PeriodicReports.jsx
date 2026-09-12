import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../api/axios";
import StatusBadge from "../../components/StatusBadge";
import PriorityBadge from "../../components/PriorityBadge";
import SkeletonBlock from "../../components/SkeletonBlock";
import EmptyState from "../../components/EmptyState";
import {
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Timer,
  Star,
  Users,
  Tags,
  ShoppingCart,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
} from "lucide-react";

const periods = [
  { value: "1m", label: "monthly" },
  { value: "3m", label: "threeMonths" },
  { value: "6m", label: "sixMonths" },
  { value: "9m", label: "nineMonths" },
  { value: "1y", label: "annual" },
];

function MetricCard({ title, value, suffix = "", icon, accentColor = "blue" }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon && (
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorMap[accentColor]}`}>
            {icon}
          </div>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {value}
        {suffix && <span className="text-lg font-semibold text-gray-500">{suffix}</span>}
      </p>
    </div>
  );
}

function ProgressBar({ value, color = "blue" }) {
  const colorMap = {
    blue: "bg-blue-600",
    yellow: "bg-yellow-400",
    red: "bg-red-500",
  };

  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorMap[color]}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function StarRating({ rating }) {
  const rounded = Math.round(rating);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rounded ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
      <span className="ml-1.5 text-sm font-medium text-gray-600">{rating}/5</span>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((item) => (
          <SkeletonBlock key={item} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonBlock className="h-56" />
        <SkeletonBlock className="h-56" />
        <SkeletonBlock className="h-56" />
        <SkeletonBlock className="h-56" />
      </div>
    </div>
  );
}

const inputClasses =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20";

function PeriodicReports() {
  const { t } = useTranslation();

  const [selectedPeriod, setSelectedPeriod] = useState("1m");
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [searchFilters, setSearchFilters] = useState({
    employeeId: "",
    technicianId: "",
    officeId: "",
    status: "",
    priority: "",
    categoryId: "",
    startDate: "",
    endDate: "",
    q: "",
  });

  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchPagination, setSearchPagination] = useState(null);

  const handleSearch = async (page = 1) => {
    try {
      setSearchLoading(true);

      const params = {};
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });

      params.page = page;
      params.limit = 10;

      const { data } = await api.get("/tickets/search", { params });
      setSearchResults(data.data);
      setSearchPagination({
        page: data.currentPage,
        totalPages: data.totalPages,
      });
      setSearchPage(page);
    } catch (error) {
      console.error("Error searching tickets:", error);
      setSearchResults([]);
      setSearchPagination(null);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/reports/summary", {
          params: { period: selectedPeriod },
        });
        setReport({
          totalTickets: data.total,
          slaCompliance: data.slaPercentage,
          procurementDelays: data.awaitingPurchase,
          averageResolution: data.averageResolutionTimeHours,
          satisfaction: data.averageSatisfactionRating,
          technicians: data.technicianWorkload.map((technician) => ({
            name: technician.technician,
            tickets: technician.count,
          })),
          categories: data.requestsByCategory.map((category) => ({
            name: category.category,
            count: category.count,
          })),
          ratings: data.ratingDistribution,
        });
      } catch (error) {
        console.error("Error fetching report:", error);
        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [selectedPeriod]);

  const currentPeriodLabel =
    periods.find((period) => period.value === selectedPeriod)?.label ||
    "monthly";

  const exportCSV = () => {
    if (!report) return;

    const rows = [
      { Metric: "Period", Value: t(`reports.${currentPeriodLabel}`) },
      { Metric: t("reports.totalTickets"), Value: report.totalTickets },
      { Metric: t("reports.slaCompliance"), Value: `${report.slaCompliance}%` },
      { Metric: t("reports.procurementDelays"), Value: report.procurementDelays },
      {
        Metric: t("reports.averageResolutionTime"),
        Value: `${report.averageResolution} hours`,
      },
      {
        Metric: t("reports.customerSatisfaction"),
        Value: `${report.satisfaction}/5`,
      },
    ];

    report.categories.forEach((category) => {
      rows.push({
        Metric: `${t("reports.issueCategories")} - ${category.name}`,
        Value: category.count,
      });
    });

    report.technicians.forEach((technician) => {
      rows.push({
        Metric: `${t("reports.technicianWorkload")} - ${technician.name}`,
        Value: technician.tickets,
      });
    });

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `civicdesk-report-${selectedPeriod}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("CivicDesk Periodic Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Period: ${t(`reports.${currentPeriodLabel}`)}`, 14, 30);

    autoTable(doc, {
      startY: 40,
      head: [["Metric", "Value"]],
      body: [
        [t("reports.totalTickets"), report.totalTickets],
        [t("reports.slaCompliance"), `${report.slaCompliance}%`],
        [t("reports.procurementDelays"), report.procurementDelays],
        [
          t("reports.averageResolutionTime"),
          `${report.averageResolution} hours`,
        ],
        [t("reports.customerSatisfaction"), `${report.satisfaction}/5`],
      ],
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [[t("reports.issueCategories"), t("reports.tickets")]],
      body: report.categories.map((category) => [
        category.name,
        category.count,
      ]),
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [[t("reports.technicianWorkload"), t("reports.tickets")]],
      body: report.technicians.map((technician) => [
        technician.name,
        technician.tickets,
      ]),
    });

    doc.save(`civicdesk-report-${selectedPeriod}.pdf`);
  };

  const handleFilterChange = (field, value) => {
    setSearchFilters((prev) => ({ ...prev, [field]: value }));
  };

  const resetSearch = () => {
    setSearchFilters({
      employeeId: "",
      technicianId: "",
      officeId: "",
      status: "",
      priority: "",
      categoryId: "",
      startDate: "",
      endDate: "",
      q: "",
    });
    setSearchResults([]);
    setSearchPagination(null);
    setSearchPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            {t("reports.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{t("reports.description")}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={exportCSV}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">{t("common.exportCSV")}</span>
            <span className="sm:hidden">CSV</span>
          </button>
          <button
            onClick={exportPDF}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileText className="h-4 w-4 text-red-500" />
            <span className="hidden sm:inline">{t("common.exportPDF")}</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="rounded-lg border border-gray-200 bg-white p-1">
        <div className="flex gap-1 overflow-x-auto">
          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={`relative flex-1 whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium transition focus:outline-none ${
                selectedPeriod === period.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              {t(`reports.${period.label}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <ReportSkeleton />
      ) : report ? (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard
              title={t("reports.totalTickets")}
              value={report.totalTickets}
              icon={<BarChart3 className="h-4 w-4" />}
              accentColor="blue"
            />
            <MetricCard
              title={t("reports.slaCompliance")}
              value={report.slaCompliance}
              suffix="%"
              icon={<CheckCircle2 className="h-4 w-4" />}
              accentColor="emerald"
            />
            <MetricCard
              title={t("reports.procurementDelays")}
              value={report.procurementDelays}
              icon={<AlertTriangle className="h-4 w-4" />}
              accentColor="amber"
            />
            <MetricCard
              title={t("reports.averageResolution")}
              value={report.averageResolution}
              suffix="hrs"
              icon={<Timer className="h-4 w-4" />}
              accentColor="red"
            />
            <MetricCard
              title={t("reports.customerSatisfaction")}
              value={report.satisfaction}
              suffix="/5"
              icon={<Star className="h-4 w-4" />}
              accentColor="violet"
            />
          </div>

          {/* Detailed Charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* SLA Compliance */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">
                  {t("reports.slaCompliance")}
                </h3>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                {report.slaCompliance}%
              </p>
              <ProgressBar value={report.slaCompliance} />
            </div>

            {/* Customer Satisfaction */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50">
                  <Star className="h-4 w-4 text-violet-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">
                  {t("reports.customerSatisfaction")}
                </h3>
              </div>
              <div className="mt-3">
                <StarRating rating={report.satisfaction} />
              </div>
              <div className="mt-4 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="w-6 text-right text-xs font-medium text-gray-500">
                      {star}
                    </span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-yellow-400"
                        style={{
                          width: `${
                            report.totalTickets > 0
                              ? (report.ratings[star] / report.totalTickets) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs text-gray-400">
                      {report.ratings[star]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technician Workload */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">
                  {t("reports.technicianWorkload")}
                </h3>
              </div>
              <div className="mt-4 space-y-3">
                {report.technicians.map((technician) => (
                  <div key={technician.name}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {technician.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {technician.tickets} {t("reports.tickets")}
                      </span>
                    </div>
                    <ProgressBar
                      value={(technician.tickets / report.totalTickets) * 100}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Issue Categories */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                  <Tags className="h-4 w-4 text-amber-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">
                  {t("reports.issueCategories")}
                </h3>
              </div>
              <div className="mt-4 space-y-2">
                {report.categories.map((category) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2.5"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {category.name}
                    </span>
                    <span className="text-sm font-semibold text-blue-600">
                      {category.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Procurement Analytics */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                <ShoppingCart className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  {t("reports.procurementAnalytics")}
                </h3>
                <p className="text-xs text-gray-500">
                  {t("reports.physicalProcurement")}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <span className="text-4xl font-bold text-red-600">
                {report.procurementDelays}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {t("reports.awaitingPurchase")}
                </p>
                <p className="text-xs text-gray-400">
                  {t("reports.physicalProcurement")}
                </p>
              </div>
            </div>
          </div>

          {/* Inline Search Section */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-gray-800">
                {t("searchFilters.title")}
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                {t("searchFilters.description")}
              </p>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    {t("searchFilters.status")}
                  </label>
                  <select
                    value={searchFilters.status}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                    className={inputClasses}
                  >
                    <option value="">{t("searchFilters.allStatuses")}</option>
                    <option value="PENDING">{t("status.pending")}</option>
                    <option value="ASSIGNED">{t("status.assigned")}</option>
                    <option value="IN_PROGRESS">{t("status.inProgress")}</option>
                    <option value="AWAITING_PURCHASE">{t("status.awaitingPurchase")}</option>
                    <option value="RESOLVED">{t("status.resolved")}</option>
                    <option value="CLOSED">{t("status.closed")}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    {t("searchFilters.priority")}
                  </label>
                  <select
                    value={searchFilters.priority}
                    onChange={(e) => handleFilterChange("priority", e.target.value)}
                    className={inputClasses}
                  >
                    <option value="">{t("searchFilters.allPriorities")}</option>
                    <option value="LOW">{t("priority.low")}</option>
                    <option value="MEDIUM">{t("priority.medium")}</option>
                    <option value="HIGH">{t("priority.high")}</option>
                    <option value="CRITICAL">{t("priority.critical")}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    {t("searchFilters.startDate")}
                  </label>
                  <input
                    type="date"
                    value={searchFilters.startDate}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    {t("searchFilters.endDate")}
                  </label>
                  <input
                    type="date"
                    value={searchFilters.endDate}
                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    {t("searchFilters.freeTextSearch")}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchFilters.q}
                      onChange={(e) => handleFilterChange("q", e.target.value)}
                      placeholder={t("searchFilters.freeTextSearch")}
                      className={`${inputClasses} pl-8`}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleSearch(1)}
                  disabled={searchLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  <Search className="h-3.5 w-3.5" />
                  {searchLoading ? t("common.loading") : t("searchFilters.searchTickets")}
                </button>
                <button
                  onClick={resetSearch}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t("common.reset")}
                </button>
              </div>
            </div>
          </div>

          {/* Search Results */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-gray-800">
                {t("searchFilters.searchResults")}
              </h3>
            </div>

            {searchLoading ? (
              <div className="p-5">
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((item) => (
                    <SkeletonBlock key={item} className="h-12" />
                  ))}
                </div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<Search className="h-5 w-5" />}
                  title={t("searchFilters.noTickets")}
                  description={t("searchFilters.useFilters")}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {t("searchFilters.title")}
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {t("searchFilters.status")}
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {t("searchFilters.priority")}
                      </th>
                      <th className="hidden px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 sm:table-cell">
                        {t("searchFilters.office")}
                      </th>
                      <th className="hidden px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 sm:table-cell">
                        {t("searchFilters.category")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {searchResults.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="transition hover:bg-gray-50/50"
                      >
                        <td className="max-w-[200px] truncate px-5 py-3 font-medium text-gray-800">
                          {ticket.title || ticket.subject || ticket.description || "-"}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="px-5 py-3">
                          <PriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="hidden px-5 py-3 text-gray-600 sm:table-cell">
                          {ticket.office?.nameEn || "-"}
                        </td>
                        <td className="hidden px-5 py-3 text-gray-600 sm:table-cell">
                          {ticket.category?.nameEn || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {searchPagination && searchPagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                <span className="text-xs text-gray-500">
                  {t("common.page")} {searchPagination.page} / {searchPagination.totalPages}
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleSearch(searchPage - 1)}
                    disabled={searchPage === 1 || searchLoading}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t("common.previous") || "Prev"}
                  </button>
                  <button
                    onClick={() => handleSearch(searchPage + 1)}
                    disabled={searchPage === searchPagination.totalPages || searchLoading}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
                  >
                    {t("common.next") || "Next"}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <EmptyState
          icon={<BarChart3 className="h-5 w-5" />}
          title={t("reports.noData") || "No report data available"}
          description={t("reports.tryAnotherPeriod") || "Try selecting a different reporting period."}
        />
      )}
    </div>
  );
}

export default PeriodicReports;
