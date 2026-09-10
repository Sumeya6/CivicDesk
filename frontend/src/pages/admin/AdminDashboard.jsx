import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTickets } from "../../store/ticketSlice";
import { Pagination, StatusBadge, PriorityBadge } from "../../components/Pagination";
import { formatDate } from "../../components/ticketConfig";
import AssignTechnicianModal from "./AssignTechnicianModal";
import AuditTrailModal from "../../components/AuditTrailModal";
import { RefreshCw, UserCog } from "lucide-react";

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { tickets, loading, error, page, totalPages } = useSelector((s) => s.tickets);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [assignTicket, setAssignTicket] = useState(null);
  const [auditTicketId, setAuditTicketId] = useState(null);

  const load = useCallback(() => {
    dispatch(fetchTickets({ status: statusFilter || undefined, page: currentPage, limit: 20 }));
  }, [dispatch, statusFilter, currentPage]);

  useEffect(() => {
    load();
  }, [load]);

  const STATUSES = ["PENDING", "ASSIGNED", "IN_PROGRESS", "AWAITING_PURCHASE", "RESOLVED", "CLOSED"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Manage all support tickets and assign technicians.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Loading tickets…
        </div>
      )}

      {!loading && tickets.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-500">No tickets found.</div>
      )}

      {!loading && tickets.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Device/System</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                    {ticket.description && (
                      <div className="mt-0.5 text-xs text-gray-500 line-clamp-1">{ticket.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {ticket.category?.nameEn || ticket.categoryId}
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {ticket.deviceOrSystem || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(ticket.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setAssignTicket(ticket)}
                        className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                      >
                        <UserCog className="h-3 w-3" />
                        Assign
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuditTicketId(ticket.id)}
                        className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        Audit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setCurrentPage} />

      <AssignTechnicianModal
        isOpen={!!assignTicket}
        onClose={() => setAssignTicket(null)}
        ticket={assignTicket}
      />
      <AuditTrailModal
        isOpen={!!auditTicketId}
        onClose={() => setAuditTicketId(null)}
        ticketId={auditTicketId}
      />
    </div>
  );
}
