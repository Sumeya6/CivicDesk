import { useEffect, useReducer, useRef } from "react";
import { Clock, User, ArrowRight } from "lucide-react";
import { Modal } from "./Pagination";
import { formatDate } from "./ticketConfig";
import ticketApi from "../api/ticketApi";

const ACTION_LABELS = {
  CREATED: "Ticket Created",
  AUTO_ASSIGNED: "Auto Assigned",
  MANUAL_ASSIGNED: "Manually Assigned",
  PRIORITY_CHANGED: "Priority Changed",
  AWAITING_PURCHASE: "Purchase Requested",
  STATUS_CHANGED: "Status Changed",
  RESOLVED: "Ticket Resolved",
  VERIFIED: "Ticket Verified",
  REOPENED: "Ticket Reopened",
};

const initialState = { logs: [], loading: false, error: null };

function auditReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { logs: [], loading: true, error: null };
    case "FETCH_OK":
      return { logs: action.logs, loading: false, error: null };
    case "FETCH_ERR":
      return { logs: [], loading: false, error: action.error };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export default function AuditTrailModal({ isOpen, onClose, ticketId }) {
  const [state, dispatch] = useReducer(auditReducer, initialState);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    if (!isOpen || !ticketId) return;
    const thisFetch = ++fetchIdRef.current;
    dispatch({ type: "FETCH_START" });
    ticketApi
      .getTicket(ticketId)
      .then((data) => {
        if (thisFetch === fetchIdRef.current) {
          dispatch({ type: "FETCH_OK", logs: data.ticket?.auditLogs || [] });
        }
      })
      .catch((err) => {
        if (thisFetch === fetchIdRef.current) {
          dispatch({ type: "FETCH_ERR", error: err.message || "Failed to load audit trail" });
        }
      });
  }, [isOpen, ticketId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Audit Trail" maxWidth="max-w-xl">
      {state.loading && (
        <div className="flex items-center justify-center py-8 text-gray-500">
          <Clock className="mr-2 h-4 w-4 animate-spin" />
          Loading audit history…
        </div>
      )}
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {!state.loading && !state.error && state.logs.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-500">No audit records found.</p>
      )}
      {!state.loading && !state.error && state.logs.length > 0 && (
        <div className="relative ml-3 border-l-2 border-gray-200 pl-6">
          {state.logs.map((log) => (
            <div key={log.id} className="relative mb-6 last:mb-0">
              <div className="absolute -left-[31px] top-0.5 h-3 w-3 rounded-full border-2 border-white bg-blue-500" />
              <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {log.actor?.fullName || log.actorId}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(log.createdAt)}
                  </span>
                </div>
                {(log.previousValue || log.newValue) && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                    {log.previousValue && <span className="rounded bg-gray-200 px-1.5 py-0.5">{log.previousValue}</span>}
                    {log.previousValue && log.newValue && <ArrowRight className="h-3 w-3 text-gray-400" />}
                    {log.newValue && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700">{log.newValue}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
