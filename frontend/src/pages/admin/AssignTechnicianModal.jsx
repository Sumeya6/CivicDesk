import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { assignTicket, fetchTechnicians } from "../../store/ticketSlice";
import { Modal } from "../../components/Modal";
import Alert from "../../components/Alert";
import { toast } from "react-toastify";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function AssignTechnicianModal({ isOpen, onClose, ticket, onSuccess }) {
  const dispatch = useDispatch();
  const technicians = useSelector((s) => s.tickets.technicians);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
  } = useForm({
    defaultValues: {
      technicianId: "",
      priority: "MEDIUM",
    },
  });

  const selectedTechnicianId = watch("technicianId");

  useEffect(() => {
    if (isOpen && ticket) {
      reset({
        technicianId: ticket.technicianId || "",
        priority: ticket.priority || "MEDIUM",
      });
      dispatch(fetchTechnicians(ticket.officeId));
    }
  }, [isOpen, ticket, reset, dispatch]);

  const onSubmit = async (values) => {
    if (!ticket) return;
    setSubmitting(true);
    setApiError(null);
    try {
      const data = {};
      if (values.technicianId) data.technicianId = values.technicianId;
      if (values.priority !== ticket.priority) data.priority = values.priority;
      if (Object.keys(data).length === 0) {
        setApiError("No changes to apply");
        setSubmitting(false);
        return;
      }
      const result = await dispatch(
        assignTicket({ id: ticket.id, data })
      ).unwrap();
      toast.success(result?.message || "Ticket updated successfully");
      reset();
      onSuccess?.(result?.data);
      onClose();
    } catch (err) {
      setApiError(err?.message || "Failed to update ticket assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setApiError(null);
    onClose();
  };

  if (!ticket) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Assign / Update Ticket">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {apiError && <Alert type="error" message={apiError} onClose={() => setApiError(null)} />}

        <div className="rounded-lg border border-[var(--civic-border)] bg-[#f7fafc] p-3 text-[14px]">
          <p className="font-medium text-[var(--civic-text)]">{ticket.title}</p>
          {ticket.description && (
            <p className="mt-1 line-clamp-2 text-[var(--civic-muted)]">{ticket.description}</p>
          )}
        </div>

        <div>
          <label htmlFor="technicianId" className="civic-label">
            Technician
          </label>
          <select
            id="technicianId"
            {...register("technicianId")}
            className="civic-select"
          >
            <option value="">Select technician...</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.fullName}
              </option>
            ))}
          </select>
          {selectedTechnicianId && (
            <p className="mt-1.5 rounded bg-blue-50 p-2 text-xs font-medium text-blue-700 border border-blue-200">
              {ticket.status === "PENDING"
                ? "Saving will assign the technician and move a Pending ticket to Assigned."
                : "Saving will assign the technician."}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="priority" className="civic-label">
            Priority
          </label>
          <select
            id="priority"
            {...register("priority")}
            className="civic-select"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--civic-border)] pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="button-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="button-primary"
          >
            {submitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
