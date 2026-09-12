import { useState } from "react";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { requestPurchase } from "../../store/ticketSlice";
import { Modal } from "../../components/Pagination";
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

        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
          <p className="font-medium text-gray-900">{ticket.title}</p>
          {ticket.description && (
            <p className="mt-1 text-gray-600 line-clamp-2">{ticket.description}</p>
          )}
        </div>

        <div>
          <label htmlFor="purchaseDetails" className="mb-1 block text-sm font-medium text-gray-700">
            Purchase Details <span className="text-red-500">*</span>
          </label>
          <p className="mb-2 text-xs text-gray-500">
            Describe the hardware, parts, or materials required.
          </p>
          <textarea
            id="purchaseDetails"
            rows={4}
            {...register("purchaseDetails", {
              required: "Purchase details are required",
              validate: (v) => v.trim().length > 0 || "Purchase details cannot be empty",
            })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. Replacement toner cartridge for HP LaserJet Pro"
          />
          {errors.purchaseDetails && (
            <p className="mt-1 text-xs text-red-600">{errors.purchaseDetails.message}</p>
          )}
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
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
