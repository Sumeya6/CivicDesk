import { useState } from "react";
import TechnicianQueue from "./TechnicianQueue";
import TicketResolveModal from "./TicketResolveModal";
import RequestPurchaseModal from "./RequestPurchaseModal";
import AuditTrailModal from "../../components/AuditTrailModal";

export default function TechnicianDashboard() {
  const [resolveTicket, setResolveTicket] = useState(null);
  const [purchaseTicket, setPurchaseTicket] = useState(null);
  const [auditTicketId, setAuditTicketId] = useState(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Technician Dashboard</h1>
        <p className="text-sm text-gray-500">Manage assigned tickets and track your work.</p>
      </div>

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
    </div>
  );
}
