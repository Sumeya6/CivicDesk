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
    blue: { bg: "#eef5fb", fg: "var(--civic-blue-800)" },
    emerald: { bg: "#edf9f3", fg: "#16734e" },
    amber: { bg: "#fef9ec", fg: "#92610a" },
    red: { bg: "#fff1f0", fg: "#b42318" },
    violet: { bg: "#f1effc", fg: "#5c4ca3" },
  };

  const c = colorMap[accentColor] || colorMap.blue;

  return (
    <div className="civic-card" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--civic-muted)" }}>{title}</p>
        {icon && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: c.bg, color: c.fg, flexShrink: 0 }}>
            {icon}
          </div>
        )}
      </div>
      <p style={{ margin: "8px 0 0", fontSize: 24, fontWeight: 700, color: "var(--civic-text)", letterSpacing: "-0.02em" }}>
        {value}
        {suffix && <span style={{ fontSize: 16, fontWeight: 600, color: "var(--civic-muted)" }}>{suffix}</span>}
      </p>
    </div>
  );
}

function ProgressBar({ value, color = "blue" }) {
  const colorMap = {
    blue: "var(--civic-blue-800)",
    yellow: "#facc15",
    red: "#ef4444",
  };

  return (
    <div style={{ marginTop: 8, height: 8, width: "100%", overflow: "hidden", borderRadius: 9999, background: "#e7eef5" }}>
      <div
        style={{ height: "100%", borderRadius: 9999, transition: "width 500ms", background: colorMap[color] || colorMap.blue, width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function StarRating({ rating }) {
  const rounded = Math.round(rating);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          style={{ width: 16, height: 16, fill: star <= rounded ? "#facc15" : "#e7eef5", color: star <= rounded ? "#facc15" : "#e7eef5" }}
        />
      ))}
      <span style={{ marginLeft: 6, fontSize: 13, fontWeight: 500, color: "var(--civic-muted)" }}>{rating}/5</span>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="summary-strip" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {[1, 2, 3, 4, 5].map((item) => (
          <SkeletonBlock key={item} style={{ height: 96 }} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <SkeletonBlock style={{ height: 224 }} />
        <SkeletonBlock style={{ height: 224 }} />
        <SkeletonBlock style={{ height: 224 }} />
        <SkeletonBlock style={{ height: 224 }} />
      </div>
    </div>
  );
}

const inputClasses = "civic-input";

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
    <div className="admin-surface workspace-page">
      {/* Page Header */}
      <header className="workspace-header">
        <div>
          <p className="workspace-eyebrow"><BarChart3 size={14} /> {t("admin.administration")}</p>
          <h1>{t("reports.title")}</h1>
          <p className="workspace-description">{t("reports.description")}</p>
        </div>
        <div className="workspace-actions">
          <button
            onClick={exportCSV}
            disabled={loading}
            className="button-secondary"
          >
            <FileSpreadsheet style={{ width: 16, height: 16, color: "#16734e" }} />
            <span style={{ display: "none" }}>{t("common.exportCSV")}</span>
            <span>CSV</span>
          </button>
          <button
            onClick={exportPDF}
            disabled={loading}
            className="button-secondary"
          >
            <FileText style={{ width: 16, height: 16, color: "#ef4444" }} />
            <span style={{ display: "none" }}>{t("common.exportPDF")}</span>
            <span>PDF</span>
          </button>
        </div>
      </header>

      {/* Period Selector */}
      <div className="civic-tabs">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => setSelectedPeriod(period.value)}
            className={`civic-tab ${selectedPeriod === period.value ? "civic-tab-active" : ""}`}
          >
            {t(`reports.${period.label}`)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <ReportSkeleton />
      ) : report ? (
        <>
          {/* Metric Cards */}
          <div className="summary-strip" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <MetricCard
              title={t("reports.totalTickets")}
              value={report.totalTickets}
              icon={<BarChart3 style={{ width: 16, height: 16 }} />}
              accentColor="blue"
            />
            <MetricCard
              title={t("reports.slaCompliance")}
              value={report.slaCompliance}
              suffix="%"
              icon={<CheckCircle2 style={{ width: 16, height: 16 }} />}
              accentColor="emerald"
            />
            <MetricCard
              title={t("reports.procurementDelays")}
              value={report.procurementDelays}
              icon={<AlertTriangle style={{ width: 16, height: 16 }} />}
              accentColor="amber"
            />
            <MetricCard
              title={t("reports.averageResolution")}
              value={report.averageResolution}
              suffix="hrs"
              icon={<Timer style={{ width: 16, height: 16 }} />}
              accentColor="red"
            />
            <MetricCard
              title={t("reports.customerSatisfaction")}
              value={report.satisfaction}
              suffix="/5"
              icon={<Star style={{ width: 16, height: 16 }} />}
              accentColor="violet"
            />
          </div>

          {/* Detailed Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            {/* SLA Compliance */}
            <div className="civic-card" style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="summary-icon summary-icon-success">
                  <TrendingUp style={{ width: 16, height: 16 }} />
                </div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--civic-text)" }}>
                  {t("reports.slaCompliance")}
                </h3>
              </div>
              <p style={{ margin: "12px 0 0", fontSize: 30, fontWeight: 700, color: "var(--civic-text)", letterSpacing: "-0.02em" }}>
                {report.slaCompliance}%
              </p>
              <ProgressBar value={report.slaCompliance} />
            </div>

            {/* Customer Satisfaction */}
            <div className="civic-card" style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="summary-icon summary-icon-purple">
                  <Star style={{ width: 16, height: 16 }} />
                </div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--civic-text)" }}>
                  {t("reports.customerSatisfaction")}
                </h3>
              </div>
              <div style={{ marginTop: 12 }}>
                <StarRating rating={report.satisfaction} />
              </div>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 24, textAlign: "right", fontSize: 12, fontWeight: 500, color: "var(--civic-muted)" }}>
                      {star}
                    </span>
                    <Star style={{ width: 12, height: 12, fill: "#facc15", color: "#facc15" }} />
                    <div style={{ height: 6, flex: 1, overflow: "hidden", borderRadius: 9999, background: "#e7eef5" }}>
                      <div
                        style={{ height: "100%", borderRadius: 9999, background: "#facc15", width: `${report.totalTickets > 0 ? (report.ratings[star] / report.totalTickets) * 100 : 0}%` }}
                      />
                    </div>
                    <span style={{ width: 32, textAlign: "right", fontSize: 12, color: "var(--civic-muted)" }}>
                      {report.ratings[star]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technician Workload */}
            <div className="civic-card" style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="summary-icon summary-icon-cyan">
                  <Users style={{ width: 16, height: 16 }} />
                </div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--civic-text)" }}>
                  {t("reports.technicianWorkload")}
                </h3>
              </div>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {report.technicians.map((technician) => (
                  <div key={technician.name}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--civic-text)" }}>
                        {technician.name}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--civic-muted)" }}>
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
            <div className="civic-card" style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="summary-icon summary-icon-amber">
                  <Tags style={{ width: 16, height: 16 }} />
                </div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--civic-text)" }}>
                  {t("reports.issueCategories")}
                </h3>
              </div>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {report.categories.map((category) => (
                  <div
                    key={category.name}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 7, background: "#f7fafc", padding: "10px 12px" }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--civic-text)" }}>
                      {category.name}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--civic-blue-800)" }}>
                      {category.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Procurement Analytics */}
          <div className="civic-card" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="summary-icon" style={{ background: "#fff1f0", color: "#b42318" }}>
                <ShoppingCart style={{ width: 16, height: 16 }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--civic-text)" }}>
                  {t("reports.procurementAnalytics")}
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--civic-muted)" }}>
                  {t("reports.physicalProcurement")}
                </p>
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 40, fontWeight: 700, color: "#b42318" }}>
                {report.procurementDelays}
              </span>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--civic-text)" }}>
                  {t("reports.awaitingPurchase")}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--civic-muted)" }}>
                  {t("reports.physicalProcurement")}
                </p>
              </div>
            </div>
          </div>

          {/* Inline Search Section */}
          <div className="civic-card">
            <div className="civic-card-header">
              <h3>{t("searchFilters.title")}</h3>
              <p>{t("searchFilters.description")}</p>
            </div>

            <div className="civic-card-body">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                <div>
                  <label className="civic-label">
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
                  <label className="civic-label">
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
                  <label className="civic-label">
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
                  <label className="civic-label">
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
                  <label className="civic-label">
                    {t("searchFilters.freeTextSearch")}
                  </label>
                  <div style={{ position: "relative" }}>
                    <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--civic-muted)" }} />
                    <input
                      type="text"
                      value={searchFilters.q}
                      onChange={(e) => handleFilterChange("q", e.target.value)}
                      placeholder={t("searchFilters.freeTextSearch")}
                      className={inputClasses}
                      style={{ paddingLeft: 32 }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleSearch(1)}
                  disabled={searchLoading}
                  className="button-primary"
                >
                  <Search style={{ width: 16, height: 16 }} />
                  {searchLoading ? t("common.loading") : t("searchFilters.searchTickets")}
                </button>
                <button
                  onClick={resetSearch}
                  className="button-secondary"
                >
                  <RotateCcw style={{ width: 16, height: 16 }} />
                  {t("common.reset")}
                </button>
              </div>
            </div>
          </div>

          {/* Search Results */}
          <div className="civic-card">
            <div className="civic-card-header">
              <h3>{t("searchFilters.searchResults")}</h3>
            </div>

            {searchLoading ? (
              <div className="civic-card-body">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[1, 2, 3, 4].map((item) => (
                    <SkeletonBlock key={item} style={{ height: 40 }} />
                  ))}
                </div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="civic-card-body">
                <EmptyState
                  icon={<Search style={{ width: 20, height: 20 }} />}
                  title={t("searchFilters.noTickets")}
                  description={t("searchFilters.useFilters")}
                />
              </div>
            ) : (
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
                    {searchResults.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>
                          <div className="entity-name" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {ticket.title || ticket.subject || ticket.description || "-"}
                          </div>
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
            )}

            {/* Pagination */}
            {searchPagination && searchPagination.totalPages > 1 && (
              <div className="civic-pagination">
                <span style={{ fontSize: 12, color: "var(--civic-muted)" }}>
                  {t("common.page")} {searchPagination.page} / {searchPagination.totalPages}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => handleSearch(searchPage - 1)}
                    disabled={searchPage === 1 || searchLoading}
                    className="civic-pagination-btn"
                  >
                    <ChevronLeft style={{ width: 14, height: 14 }} />
                    {t("common.previous") || "Prev"}
                  </button>
                  <button
                    onClick={() => handleSearch(searchPage + 1)}
                    disabled={searchPage === searchPagination.totalPages || searchLoading}
                    className="civic-pagination-btn"
                  >
                    {t("common.next") || "Next"}
                    <ChevronRight style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <EmptyState
          icon={<BarChart3 style={{ width: 20, height: 20 }} />}
          title={t("reports.noData") || "No report data available"}
          description={t("reports.tryAnotherPeriod") || "Try selecting a different reporting period."}
        />
      )}
    </div>
  );
}

export default PeriodicReports;
