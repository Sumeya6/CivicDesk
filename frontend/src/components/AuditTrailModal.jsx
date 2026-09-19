import { useEffect, useReducer, useRef } from "react";
import { Clock, User, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Modal } from "./Modal";
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
  const { t } = useTranslation();
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
          dispatch({ type: "FETCH_OK", logs: data.data?.auditLogs || [] });
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
        <div className="flex items-center justify-center py-8 text-[var(--civic-muted)]">
          <Clock className="mr-2 h-4 w-4 animate-spin" />
          {t("common.loading")}
        </div>
      )}
      {state.error && (
        <div className="civic-alert civic-alert-error mx-5 mt-3" role="alert">
          <span className="flex-1">{state.error}</span>
        </div>
      )}
      {!state.loading && !state.error && state.logs.length === 0 && (
        <p className="py-8 text-center text-[var(--civic-font-size-base)] text-[var(--civic-muted)]">
          No audit records found.
        </p>
      )}
      {!state.loading && !state.error && state.logs.length > 0 && (
        <div className="relative ml-3 border-l-2 border-[var(--civic-border)] pl-6 pb-5">
          {state.logs.map((log) => (
            <div key={log.id} className="relative mb-6 last:mb-0">
              <div className="absolute -left-[31px] top-0.5 h-3 w-3 rounded-full border-2 border-white bg-[var(--civic-blue-800)]" />
              <div className="rounded-lg border border-[var(--civic-border)] bg-[#f8fafc] p-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[var(--civic-font-size-base)] font-medium text-[var(--civic-text)]">
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--civic-muted)]">
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
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--civic-muted)]">
                    {log.previousValue && (
                      <span className="rounded bg-[var(--civic-border)] px-1.5 py-0.5 text-[var(--civic-text)]">
                        {log.previousValue}
                      </span>
                    )}
                    {log.previousValue && log.newValue && (
                      <ArrowRight className="h-3 w-3 text-[var(--civic-muted)]" />
                    )}
                    {log.newValue && (
                      <span className="rounded bg-[var(--civic-cyan-50)] px-1.5 py-0.5 text-[var(--civic-blue-800)]">
                        {log.newValue}
                      </span>
                    )}
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
