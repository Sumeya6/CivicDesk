import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ClipboardList } from "lucide-react";
import TechnicianQueue from "./TechnicianQueue";
import TicketResolveModal from "./TicketResolveModal";
import RequestPurchaseModal from "./RequestPurchaseModal";
import AuditTrailModal from "../../components/AuditTrailModal";

function AssignedRequests() {
  const { t } = useTranslation();
  const [resolveTicket, setResolveTicket] = useState(null);
  const [purchaseTicket, setPurchaseTicket] = useState(null);
  const [auditTicketId, setAuditTicketId] = useState(null);

  return (
    <section
      className="admin-surface workspace-page"
      aria-labelledby="assigned-requests-title"
    >
      <header className="workspace-header">
        <div>
          <div className="workspace-eyebrow">
            <ClipboardList size={14} />
            {t("dashboard.technicianLabel")}
          </div>
          <h1 id="assigned-requests-title">
            {t("navigation.assignedRequests")}
          </h1>
          <p className="workspace-description">
            {t("dashboard.technicianDescription")}
          </p>
        </div>
      </header>

      <TechnicianQueue
        onRequestPurchase={(ticket) => setPurchaseTicket(ticket)}
        onResolve={(ticket) => setResolveTicket(ticket)}
        onViewAudit={(ticket) => setAuditTicketId(ticket.id)}
      />

      <TicketResolveModal
        isOpen={!!resolveTicket}
        onClose={() => setResolveTicket(null)}
        ticket={resolveTicket}
      />
      <RequestPurchaseModal
        isOpen={!!purchaseTicket}
        onClose={() => setPurchaseTicket(null)}
        ticket={purchaseTicket}
      />
      <AuditTrailModal
        isOpen={!!auditTicketId}
        onClose={() => setAuditTicketId(null)}
        ticketId={auditTicketId}
      />
    </section>
  );
}

export default AssignedRequests;
