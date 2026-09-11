import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const periods = [
  { value: "1m", label: "monthly" },
  { value: "3m", label: "threeMonths" },
  { value: "6m", label: "sixMonths" },
  { value: "9m", label: "nineMonths" },
  { value: "1y", label: "annual" },
];

function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
  );
}

function MetricCard({ title, value, suffix = "" }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-md">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-800">
        {value}
        {suffix}
      </p>
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-200">
      <div
        className="h-full rounded-full bg-blue-600 transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function StarRating({ rating }) {
  const rounded = Math.round(rating);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= rounded ? "text-yellow-400" : "text-gray-300"}
        >
          ★
        </span>
      ))}

      <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
    </div>
  );
}

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
  });

  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchPagination, setSearchPagination] = useState(null);
  const handleSearch = async (page = 1) => {
    try {
      setSearchLoading(true);

      const params = new URLSearchParams();

      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      params.append("page", page);
      params.append("limit", 10);

      const response = await fetch(
        `http://localhost:5000/api/tickets/search?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error("Failed to search tickets");
      }

      const data = await response.json();

      setSearchResults(data.data);
      setSearchPagination(data.pagination);
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

        const response = await fetch(
          `http://localhost:5000/api/reports/summary?period=${selectedPeriod}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch report");
        }

        const data = await response.json();

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
      {
        Metric: "Period",
        Value: t(`reports.${currentPeriodLabel}`),
      },
      {
        Metric: t("reports.totalTickets"),
        Value: report.totalTickets,
      },
      {
        Metric: t("reports.slaCompliance"),
        Value: `${report.slaCompliance}%`,
      },
      {
        Metric: t("reports.procurementDelays"),
        Value: report.procurementDelays,
      },
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
        Metric: `${t("reports.issueCategories")} - ${t(
          `categories.${category.name}`,
        )}`,
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

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

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

    const categoryStartY = doc.lastAutoTable.finalY + 10;

    autoTable(doc, {
      startY: categoryStartY,
      head: [[t("reports.issueCategories"), t("reports.tickets")]],
      body: report.categories.map((category) => [
        t(`categories.${category.name}`),
        category.count,
      ]),
    });

    const technicianStartY = doc.lastAutoTable.finalY + 10;

    autoTable(doc, {
      startY: technicianStartY,
      head: [[t("reports.technicianWorkload"), t("reports.tickets")]],
      body: report.technicians.map((technician) => [
        technician.name,
        technician.tickets,
      ]),
    });

    doc.save(`civicdesk-report-${selectedPeriod}.pdf`);
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {t("reports.title")}
          </h1>

          <p className="mt-1 text-gray-500">{t("reports.description")}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            disabled={loading}
            className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("common.exportCSV")}
          </button>

          <button
            onClick={exportPDF}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("common.exportPDF")}
          </button>
        </div>
      </div>

      <div className="mb-6 overflow-x-auto rounded-xl bg-white p-2 shadow-md">
        <div className="flex min-w-max gap-2">
          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={`rounded-lg px-5 py-3 font-medium transition ${
                selectedPeriod === period.value
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t(`reports.${period.label}`)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} className="h-28" />
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-5">
            <MetricCard
              title={t("reports.totalTickets")}
              value={report.totalTickets}
            />

            <MetricCard
              title={t("reports.slaCompliance")}
              value={report.slaCompliance}
              suffix="%"
            />

            <MetricCard
              title={t("reports.procurementDelays")}
              value={report.procurementDelays}
            />

            <MetricCard
              title={t("reports.averageResolution")}
              value={report.averageResolution}
              suffix=" hrs"
            />

            <MetricCard
              title={t("reports.customerSatisfaction")}
              value={report.satisfaction}
              suffix="/5"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-6 shadow-md">
              <h2 className="text-xl font-bold text-gray-800">
                {t("reports.slaCompliance")}
              </h2>

              <p className="mt-2 text-4xl font-bold text-blue-600">
                {report.slaCompliance}%
              </p>

              <ProgressBar value={report.slaCompliance} />
            </div>

            <div className="rounded-xl bg-white p-6 shadow-md">
              <h2 className="text-xl font-bold text-gray-800">
                {t("reports.customerSatisfaction")}
              </h2>

              <div className="mt-4">
                <StarRating rating={report.satisfaction} />
              </div>

              <div className="mt-5 space-y-3">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="w-8 font-medium">{star} ★</span>

                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-yellow-400"
                        style={{
                          width: `${
                            (report.ratings[star] / report.totalTickets) * 100
                          }%`,
                        }}
                      />
                    </div>

                    <span className="w-10 text-right text-sm text-gray-500">
                      {report.ratings[star]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-md">
              <h2 className="text-xl font-bold text-gray-800">
                {t("reports.technicianWorkload")}
              </h2>

              <div className="mt-5 space-y-4">
                {report.technicians.map((technician) => (
                  <div key={technician.name}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{technician.name}</span>

                      <span className="text-gray-500">
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

            <div className="rounded-xl bg-white p-6 shadow-md">
              <h2 className="text-xl font-bold text-gray-800">
                {t("reports.issueCategories")}
              </h2>

              <div className="mt-5 space-y-4">
                {report.categories.map((category) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
                  >
                    <span className="font-medium text-gray-700">
                      {category.name}
                    </span>

                    <span className="font-bold text-blue-600">
                      {category.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-800">
              {t("reports.procurementAnalytics")}
            </h2>

            <p className="mt-2 text-gray-500">
              {t("reports.physicalProcurement")}
            </p>

            <div className="mt-5 flex items-center gap-5">
              <div className="text-5xl font-bold text-red-600">
                {report.procurementDelays}
              </div>

              <div>
                <p className="font-medium text-gray-700">
                  {t("reports.awaitingPurchase")}
                </p>

                <p className="text-sm text-gray-500">
                  {t("reports.physicalProcurement")}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 rounded-xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-800">
              Advanced Ticket Search
            </h2>

            <p className="mt-1 text-gray-500">
              Search tickets using multiple filters.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Status */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Status
                </label>

                <select
                  value={searchFilters.status}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      status: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="AWAITING_PURCHASE">Awaiting Purchase</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Priority
                </label>

                <select
                  value={searchFilters.priority}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      priority: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Start Date
                </label>

                <input
                  type="date"
                  value={searchFilters.startDate}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      startDate: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  End Date
                </label>

                <input
                  type="date"
                  value={searchFilters.endDate}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      endDate: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => handleSearch(1)}
                disabled={searchLoading}
                className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {searchLoading ? "Searching..." : "Search"}
              </button>

              <button
                onClick={() => {
                  setSearchFilters({
                    employeeId: "",
                    technicianId: "",
                    officeId: "",
                    status: "",
                    priority: "",
                    categoryId: "",
                    startDate: "",
                    endDate: "",
                  });

                  setSearchResults([]);
                  setSearchPagination(null);
                  setSearchPage(1);
                }}
                className="rounded-lg bg-gray-200 px-5 py-2 font-medium text-gray-700 hover:bg-gray-300"
              >
                Reset
              </button>
            </div>

            {/* Search Results */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Search Results
              </h3>

              {searchResults.length === 0 ? (
                <p className="mt-3 text-gray-500">No search results yet.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50 text-left">
                        <th className="p-3">Title</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Office</th>
                        <th className="p-3">Category</th>
                      </tr>
                    </thead>

                    <tbody>
                      {searchResults.map((ticket) => (
                        <tr key={ticket.id} className="border-b">
                          <td className="p-3">
                            {ticket.title ||
                              ticket.subject ||
                              ticket.description ||
                              "-"}
                          </td>

                          <td className="p-3">{ticket.status}</td>

                          <td className="p-3">{ticket.priority}</td>

                          <td className="p-3">
                            {ticket.office?.nameEn || "-"}
                          </td>

                          <td className="p-3">
                            {ticket.category?.nameEn || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {searchPagination && searchPagination.totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Page {searchPagination.page} of {searchPagination.totalPages}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSearch(searchPage - 1)}
                    disabled={searchPage === 1 || searchLoading}
                    className="rounded-lg bg-gray-200 px-4 py-2 disabled:opacity-50"
                  >
                    Previous
                  </button>

                  <button
                    onClick={() => handleSearch(searchPage + 1)}
                    disabled={
                      searchPage === searchPagination.totalPages ||
                      searchLoading
                    }
                    className="rounded-lg bg-gray-200 px-4 py-2 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default PeriodicReports;
