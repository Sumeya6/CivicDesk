import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { assignTicket, fetchTechnicians } from "../../store/ticketSlice";
import { Modal } from "../../components/Pagination";
import Alert from "../../components/Alert";
import { toast } from "react-toastify";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function AssignTechnicianModal({ isOpen, onClose, ticket }) {
  const dispatch = useDispatch();
  const technicians = useSelector((s) => s.tickets.technicians);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: {
      technicianId: "",
      priority: "MEDIUM",
    },
  });

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

        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
          <p className="font-medium text-gray-900">{ticket.title}</p>
          {ticket.description && (
            <p className="mt-1 text-gray-600 line-clamp-2">{ticket.description}</p>
          )}
        </div>

        <div>
          <label htmlFor="technicianId" className="mb-1 block text-sm font-medium text-gray-700">
            Technician
          </label>
          <select
            id="technicianId"
            {...register("technicianId")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Keep current assignment</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.fullName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="mb-1 block text-sm font-medium text-gray-700">
            Priority
          </label>
          <select
            id="priority"
            {...register("priority")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
