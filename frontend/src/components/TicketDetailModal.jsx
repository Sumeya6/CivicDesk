import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Info,
  Users,
  Clock,
  Wrench,
  CheckCircle2,
  AlertCircle,
  FileText,
  Star,
  History,
  ArrowRight,
} from "lucide-react";
import { Modal } from "./Modal";
import AuditTrailModal from "./AuditTrailModal";
import { STATUS_CONFIG, PRIORITY_CONFIG, formatDate } from "./ticketConfig";
import ticketApi from "../api/ticketApi";
import {
  AUDIT_ACTION_KEYS,
  getAuditActorName,
  getAuditValue,
} from "../utils/auditPresentation";

function getSlaDeadline(ticket) {
  const hours = ticket?.category?.expectedResolutionHours;
  if (!ticket?.createdAt || !Number.isFinite(Number(hours))) return null;
  return new Date(new Date(ticket.createdAt).getTime() + Number(hours) * 60 * 60 * 1000);
}

export default function TicketDetailModal({ isOpen, onClose, ticketId }) {
  const { t, i18n } = useTranslation();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAuditModal, setShowAuditModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchTicket() {
      if (!isOpen || !ticketId) {
        if (isMounted) {
          setTicket(null);
          setLoading(false);
          setError(null);
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await ticketApi.getTicket(ticketId);
        if (isMounted) {
          setTicket(data?.data || data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load ticket details");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchTicket();

    return () => {
      isMounted = false;
    };
  }, [isOpen, ticketId]);

  if (!isOpen) return null;

  const categoryName = ticket?.category
    ? i18n.language === "am"
      ? ticket.category.nameAm || ticket.category.nameEn
      : ticket.category.nameEn || ticket.category.nameAm
    : null;

  const statusInfo = STATUS_CONFIG[ticket?.status] || {
    label: ticket?.status,
    className: "civic-badge",
  };
  const priorityInfo = PRIORITY_CONFIG[ticket?.priority] || {
    label: ticket?.priority,
    className: "civic-badge",
  };
  const slaDeadline = getSlaDeadline(ticket);
  const emptyValue = t("ticketDetail.none", "None");
  const auditLogs = ticket?.auditLogs || [];
  const displayLoading = loading || (!ticket && Boolean(isOpen && ticketId));

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--civic-blue-800)]" />
            <span>
              {t("ticketDetail.title", "Ticket Details")}{" "}
              {ticket ? `#${ticket.id.slice(0, 8)}` : ""}
            </span>
          </div>
        }
        maxWidth="max-w-3xl"
      >
        {displayLoading && (
          <div className="flex items-center justify-center py-12 text-[var(--civic-muted)]">
            <Clock className="mr-2 h-5 w-5 animate-spin" />
            <span>{t("common.loading", "Loading...")}</span>
          </div>
        )}

        {error && (
          <div className="civic-alert civic-alert-error my-4" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {!displayLoading && !error && ticket && (
          <div className="space-y-6">
            {/* Header badges and actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--civic-border)] pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={statusInfo.className}>
                  {t(`status.${ticket.status?.toLowerCase()}`, statusInfo.label)}
                </span>
                <span className={priorityInfo.className}>
                  {t(`priority.${ticket.priority?.toLowerCase()}`, priorityInfo.label)}
                </span>
                {categoryName && (
                  <span className="rounded bg-[var(--civic-cyan-50)] px-2.5 py-0.5 text-[12px] font-medium text-[var(--civic-blue-800)]">
                    {categoryName}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowAuditModal(true)}
                className="button-secondary inline-flex items-center gap-1.5 text-[12px]"
              >
                <History className="h-4 w-4" />
                <span>{t("ticketDetail.auditTrail", "View Audit Trail")}</span>
              </button>
            </div>

            {/* Section 1: Overview */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--civic-blue-800)]">
                <Info className="h-4 w-4" />
                <h3>{t("ticketDetail.overview", "Overview")}</h3>
              </div>
              <div className="rounded-lg border border-[var(--civic-border)] bg-slate-50/50 p-4 space-y-3 text-[var(--civic-font-size-base)]">
                <div>
                  <div className="text-[12px] font-medium text-[var(--civic-muted)]">
                    {t("createTicket.titleLabel", "Title")}
                  </div>
                  <div className="font-semibold text-[var(--civic-text)]">{ticket.title}</div>
                </div>
                <div>
                  <div className="text-[12px] font-medium text-[var(--civic-muted)]">
                    {t("createTicket.descriptionLabel", "Description")}
                  </div>
                  <div className="text-[var(--civic-text)] whitespace-pre-wrap">{ticket.description}</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 border-t border-[var(--civic-border)]">
                  <div>
                    <div className="text-[12px] font-medium text-[var(--civic-muted)]">
                      {t("ticketDetail.deviceOrSystem", "Device / System")}
                    </div>
                    <div>{ticket.deviceOrSystem || t("ticketDetail.none", "None")}</div>
                  </div>
                  <div>
                    <div className="text-[12px] font-medium text-[var(--civic-muted)]">
                      {t("ticketDetail.asset", "Linked Asset")}
                    </div>
                    <div>
                      {ticket.asset
                        ? `${ticket.asset.name || ticket.asset.assetTag} (${ticket.asset.assetTag})`
                        : t("ticketDetail.none", "None")}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] font-medium text-[var(--civic-muted)]">
                      {t("ticketTable.created", "Created")}
                    </div>
                    <div>{formatDate(ticket.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-[12px] font-medium text-[var(--civic-muted)]">
                      {t("ticketDetail.updatedAt", "Updated")}
                    </div>
                    <div>{formatDate(ticket.updatedAt)}</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: People & Assignment */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--civic-blue-800)]">
                <Users className="h-4 w-4" />
                <h3>{t("ticketDetail.peopleAndAssignment", "People & Assignment")}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-[var(--civic-border)] bg-slate-50/50 p-3">
                  <div className="text-[12px] font-medium text-[var(--civic-muted)]">
                    {t("ticketDetail.office", "Sub-city Office")}
                  </div>
                  <div className="font-medium text-[var(--civic-text)]">
                    {ticket.office
                      ? i18n.language === "am"
                        ? ticket.office.nameAm || ticket.office.nameEn
                        : ticket.office.nameEn || ticket.office.nameAm
                      : t("ticketDetail.none", "None")}
                  </div>
                  {ticket.office?.code && (
                    <div className="text-[11px] text-[var(--civic-muted)]">
                      Code: {ticket.office.code}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-[var(--civic-border)] bg-slate-50/50 p-3">
                  <div className="text-[12px] font-medium text-[var(--civic-muted)]">
                    {t("ticketDetail.employee", "Requester / Employee")}
                  </div>
                  <div className="font-medium text-[var(--civic-text)]">
                    {ticket.employee?.fullName || t("ticketDetail.systemFallback", "System / Unknown user")}
                  </div>
                  {ticket.employee?.phoneNumber && (
                    <div className="text-[11px] text-[var(--civic-muted)]">
                      {ticket.employee.phoneNumber}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-[var(--civic-border)] bg-slate-50/50 p-3">
                  <div className="text-[12px] font-medium text-[var(--civic-muted)]">
                    {t("ticketDetail.technician", "Assigned Technician")}
                  </div>
                  <div className="font-medium text-[var(--civic-text)]">
                    {ticket.technician?.fullName || (
                      <span className="italic text-[var(--civic-muted)]">
                        {t("ticketDetail.unassigned", "Unassigned")}
                      </span>
                    )}
                  </div>
                  {ticket.technician?.phoneNumber && (
                    <div className="text-[11px] text-[var(--civic-muted)]">
                      {ticket.technician.phoneNumber}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Section 3: SLA & Workflow */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--civic-blue-800)]">
                <Clock className="h-4 w-4" />
                <h3>{t("ticketDetail.slaAndWorkflow", "SLA & Workflow")}</h3>
              </div>
              <div className="rounded-lg border border-[var(--civic-border)] bg-slate-50/50 p-4 space-y-3 text-[var(--civic-font-size-base)]">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="text-[12px] font-medium text-[var(--civic-muted)]">
                      {t("ticketDetail.slaHours", "SLA Target Hours")}
                    </div>
                    <div>
                      {ticket.category?.expectedResolutionHours ?? emptyValue}
                      {ticket.category?.expectedResolutionHours != null ? " hrs" : ""}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] font-medium text-[var(--civic-muted)]">
                      {t("ticketTable.slaDeadline", "SLA Deadline")}
                    </div>
                    <div>{formatDate(slaDeadline)}</div>
                  </div>
                  <div>
                    <div className="text-[12px] font-medium text-[var(--civic-muted)]">
                      {t("ticketDetail.slaExceeded", "SLA Exceeded")}
                    </div>
                    <div>
                      {ticket.slaExceeded ? (
                        <span className="font-semibold text-rose-600">Yes</span>
                      ) : (
                        <span className="text-emerald-700">No</span>
                      )}
                    </div>
                  </div>
                </div>

                {ticket.slaJustification && (
                  <div className="pt-2 border-t border-[var(--civic-border)]">
                    <div className="text-[12px] font-medium text-[var(--civic-muted)]">
                      {t("ticketDetail.slaJustification", "SLA Overdue Justification")}
                    </div>
                    <div className="text-[var(--civic-text)] italic">{ticket.slaJustification}</div>
                  </div>
                )}
              </div>
            </section>

            {/* Section 4: Work & Purchasing */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--civic-blue-800)]">
                <Wrench className="h-4 w-4" />
                <h3>{t("ticketDetail.workAndPurchasing", "Work & Purchasing")}</h3>
              </div>
              <div className="rounded-lg border border-[var(--civic-border)] bg-slate-50/50 p-4 space-y-3 text-[var(--civic-font-size-base)]">
                <div>
                  <div className="text-[12px] font-medium text-[var(--civic-muted)]">
                    {t("ticketDetail.requiresPurchase", "Requires Purchase")}
                  </div>
                  <div>{ticket.requiresPurchase ? "Yes" : "No"}</div>
                </div>

                {ticket.purchaseDetails ? (
                  <div>
                    <div className="text-[12px] font-medium text-[var(--civic-muted)]">
                      {t("ticketDetail.purchaseDetails", "Purchase Request Details")}
                    </div>
                    <div className="text-[var(--civic-text)]">{ticket.purchaseDetails}</div>
                  </div>
                ) : (
                  <div className="text-[12px] text-[var(--civic-muted)] italic">
                    {t("ticketDetail.noPurchaseInformation", "No purchase information recorded.")}
                  </div>
                )}

                {ticket.maintenanceNote ? (
                  <div className="pt-2 border-t border-[var(--civic-border)] space-y-2">
                    <div className="text-[12px] font-semibold text-[var(--civic-text)]">
                      {t("ticketDetail.maintenanceNote", "Technician Maintenance Note")}
                    </div>
                    {ticket.maintenanceNote.diagnosis && (
                      <div>
                        <span className="text-[12px] font-medium text-[var(--civic-muted)]">
                          {t("ticketDetail.diagnosis", "Diagnosis")}: {" "}
                        </span>
                        <span>{ticket.maintenanceNote.diagnosis}</span>
                      </div>
                    )}
                    {ticket.maintenanceNote.workPerformed && (
                      <div>
                        <span className="text-[12px] font-medium text-[var(--civic-muted)]">
                          {t("ticketDetail.workPerformed", "Work performed")}: {" "}
                        </span>
                        <span>{ticket.maintenanceNote.workPerformed}</span>
                      </div>
                    )}
                    {ticket.maintenanceNote.partsReplaced && (
                      <div>
                        <span className="text-[12px] font-medium text-[var(--civic-muted)]">
                          {t("ticketDetail.partsReplaced", "Parts replaced")}: {" "}
                        </span>
                        <span>{ticket.maintenanceNote.partsReplaced}</span>
                      </div>
                    )}
                    {ticket.maintenanceNote.recommendations && (
                      <div>
                        <span className="text-[12px] font-medium text-[var(--civic-muted)]">
                          {t("ticketDetail.recommendations", "Recommendations")}: {" "}
                        </span>
                        <span>{ticket.maintenanceNote.recommendations}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[12px] font-medium text-[var(--civic-muted)]">
                        {t("ticketDetail.purchasedByOffice", "Purchased by office")}: {" "}
                      </span>
                      <span>
                        {ticket.maintenanceNote.purchasedByOffice ? t("common.yes", "Yes") : t("common.no", "No")}
                      </span>
                      </div>
                  </div>
                ) : (
                  <div className="text-[12px] text-[var(--civic-muted)] italic">
                    No maintenance notes logged yet.
                  </div>
                )}
              </div>
            </section>

            {/* Section 5: Activity Timeline */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--civic-blue-800)]">
                <History className="h-4 w-4" />
                <h3>{t("ticketDetail.activityTimeline", "Activity Timeline")}</h3>
              </div>
              {auditLogs.length === 0 ? (
                <p className="text-[12px] italic text-[var(--civic-muted)]">
                  {t("ticketDetail.noActivity", "No activity recorded yet.")}
                </p>
              ) : (
                <div className="relative ml-3 border-l-2 border-[var(--civic-border)] pl-5">
                  {auditLogs.map((log) => {
                    const previousValue = getAuditValue(log, "previous", t);
                    const newValue = getAuditValue(log, "new", t);
                    return (
                      <div key={log.id} className="relative mb-4 last:mb-0">
                        <div className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[var(--civic-blue-800)]" />
                        <div className="rounded-lg border border-[var(--civic-border)] bg-slate-50/50 p-3">
                          <div className="font-medium text-[var(--civic-text)]">
                            {t(
                              `ticketDetail.auditActions.${AUDIT_ACTION_KEYS[log.action] || "unknown"}`,
                              log.action,
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--civic-muted)]">
                            <span>{getAuditActorName(log, t)}{log.actor?.role ? ` (${t(`roles.${log.actor.role}`, log.actor.role)})` : ""}</span>
                            <span>{formatDate(log.createdAt)}</span>
                          </div>
                          {(previousValue || newValue) && (
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                              {previousValue && <span className="rounded bg-[var(--civic-border)] px-1.5 py-0.5">{previousValue}</span>}
                              {previousValue && newValue && <ArrowRight className="h-3 w-3 text-[var(--civic-muted)]" />}
                              {newValue && <span className="rounded bg-[var(--civic-cyan-50)] px-1.5 py-0.5 text-[var(--civic-blue-800)]">{newValue}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Section 6: Closure & Feedback */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--civic-blue-800)]">
                <CheckCircle2 className="h-4 w-4" />
                <h3>{t("ticketDetail.closureAndFeedback", "Closure & Feedback")}</h3>
              </div>
              <div className="rounded-lg border border-[var(--civic-border)] bg-slate-50/50 p-4 space-y-3 text-[var(--civic-font-size-base)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <div className="text-[12px] font-medium text-[var(--civic-muted)]">
                      {t("ticketDetail.isApproved", "Employee Verification")}
                    </div>
                    <div>
                      {ticket.isApproved === true ? (
                        <span className="font-semibold text-emerald-700">
                          {t("ticketDetail.approved", "Approved & Verified")}
                        </span>
                      ) : ticket.isApproved === false ? (
                        <span className="font-semibold text-rose-600">
                          {t("ticketDetail.reopened", "Reopened / Rejected")}
                        </span>
                      ) : (
                        <span className="text-[var(--civic-muted)]">{t("ticketDetail.pendingVerification", "Pending Verification")}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-[12px] font-medium text-[var(--civic-muted)]">
                      {t("ticketDetail.rating", "Satisfaction Rating")}
                    </div>
                    <div className="flex items-center gap-1">
                      {ticket.rating ? (
                        <>
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="font-semibold">{ticket.rating} / 5</span>
                        </>
                      ) : (
                        <span>{t("ticketDetail.none", "None")}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-[12px] font-medium text-[var(--civic-muted)]">
                      {t("ticketDetail.resolvedAt", "Resolved At")}
                    </div>
                    <div>{formatDate(ticket.resolvedAt)}</div>
                  </div>
                  <div>
                    <div className="text-[12px] font-medium text-[var(--civic-muted)]">
                      {t("ticketDetail.closedAt", "Closed At")}
                    </div>
                    <div>{formatDate(ticket.closedAt)}</div>
                  </div>
                </div>

                {ticket.feedback ? (
                  <div className="pt-2 border-t border-[var(--civic-border)]">
                    <div className="text-[12px] font-medium text-[var(--civic-muted)]">
                      {t("ticketDetail.feedback", "Employee Feedback")}
                    </div>
                    <div className="text-[var(--civic-text)]">{ticket.feedback}</div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-[var(--civic-border)] text-[12px] italic text-[var(--civic-muted)]">
                    {t("ticketDetail.noFeedback", "No feedback recorded yet.")}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </Modal>

      {/* Audit Trail Modal */}
      {ticket && (
        <AuditTrailModal
          isOpen={showAuditModal}
          onClose={() => setShowAuditModal(false)}
          ticketId={ticket.id}
        />
      )}
    </>
  );
}
