import { useState } from "react";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { requestPurchase } from "../../store/ticketSlice";
import { Modal } from "../../components/Modal";
import Alert from "../../components/Alert";
import { toast } from "react-toastify";

export default function RequestPurchaseModal({ isOpen, onClose, ticket }) {
  const dispatch = useDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { purchaseDetails: "" },
  });

  const onSubmit = async (values) => {
    if (!ticket) return;
    setSubmitting(true);
    setApiError(null);
    try {
      const result = await dispatch(
        requestPurchase({ id: ticket.id, data: { purchaseDetails: values.purchaseDetails.trim() } })
      ).unwrap();
      toast.success(result?.message || "Purchase request submitted");
      reset();
      onClose();
    } catch (err) {
      setApiError(err?.message || "Failed to submit purchase request");
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Request Purchase">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {apiError && <Alert type="error" message={apiError} onClose={() => setApiError(null)} />}

        <div className="rounded-lg border border-[var(--civic-border)] bg-[#f7fafc] p-3 text-[14px]">
          <p className="font-medium text-[var(--civic-text)]">{ticket.title}</p>
          {ticket.description && (
            <p className="mt-1 line-clamp-2 text-[var(--civic-muted)]">{ticket.description}</p>
          )}
        </div>

        <div>
          <label htmlFor="purchaseDetails" className="civic-label">
            Purchase Details <span className="text-[var(--civic-error)]">*</span>
          </label>
          <p className="mb-2 text-[12px] text-[var(--civic-muted)]">
            Describe the hardware, parts, or materials required.
          </p>
          <textarea
            id="purchaseDetails"
            rows={4}
            {...register("purchaseDetails", {
              required: "Purchase details are required",
              validate: (v) => v.trim().length > 0 || "Purchase details cannot be empty",
            })}
            className="civic-textarea"
            placeholder="e.g. Replacement toner cartridge for HP LaserJet Pro"
          />
          {errors.purchaseDetails && (
            <p className="mt-1 text-xs text-[var(--civic-error)]">{errors.purchaseDetails.message}</p>
          )}
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
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
