import { useEffect, useReducer, useRef } from "react";
import { Clock, User, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Modal } from "./Modal";
import { formatDate } from "./ticketConfig";
import ticketApi from "../api/ticketApi";
import {
  AUDIT_ACTION_KEYS,
  getAuditActorName,
  getAuditValue,
} from "../utils/auditPresentation";

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
          {state.logs.map((log) => {
            const prevVal = getAuditValue(log, "previous", t);
            const newVal = getAuditValue(log, "new", t);
            const actorName = getAuditActorName(log, t);
            const actorRole = log.actor?.role;

            return (
              <div key={log.id} className="relative mb-6 last:mb-0">
                <div className="absolute -left-[31px] top-0.5 h-3 w-3 rounded-full border-2 border-white bg-[var(--civic-blue-800)]" />
                <div className="rounded-lg border border-[var(--civic-border)] bg-[#f8fafc] p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[var(--civic-font-size-base)] font-medium text-[var(--civic-text)]">
                      {t(
                        `ticketDetail.auditActions.${AUDIT_ACTION_KEYS[log.action] || "unknown"}`,
                        log.action,
                      )}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--civic-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {actorName}{actorRole ? ` (${t(`roles.${actorRole}`, actorRole)})` : ""}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                  {(prevVal || newVal) && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--civic-muted)]">
                      {prevVal && (
                        <span className="rounded bg-[var(--civic-border)] px-1.5 py-0.5 text-[var(--civic-text)]">
                          {prevVal}
                        </span>
                      )}
                      {prevVal && newVal && (
                        <ArrowRight className="h-3 w-3 text-[var(--civic-muted)]" />
                      )}
                      {newVal && (
                        <span className="rounded bg-[var(--civic-cyan-50)] px-1.5 py-0.5 text-[var(--civic-blue-800)]">
                          {newVal}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
