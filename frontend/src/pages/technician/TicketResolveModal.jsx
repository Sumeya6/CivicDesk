import { useEffect, useReducer } from "react";
import { useDispatch } from "react-redux";
import { useForm, Controller } from "react-hook-form";
import { resolveTicket } from "../../store/ticketSlice";
import { Modal } from "../../components/Pagination";
import Alert from "../../components/Alert";
import { toast } from "react-toastify";
import { AlertTriangle } from "lucide-react";

const initialUiState = { slaJustText: "", submitting: false, apiError: null };

function uiReducer(state, action) {
  switch (action.type) {
    case "RESET":
      return initialUiState;
    case "SET_SLA_TEXT":
      return { ...state, slaJustText: action.value };
    case "SUBMIT_START":
      return { ...state, submitting: true, apiError: null };
    case "SUBMIT_ERR":
      return { ...state, submitting: false, apiError: action.error };
    case "CLEAR_ERROR":
      return { ...state, apiError: null };
    default:
      return state;
  }
}

export default function TicketResolveModal({ isOpen, onClose, ticket }) {
  const dispatch = useDispatch();
  const [ui, uiDispatch] = useReducer(uiReducer, initialUiState);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      diagnosis: "",
      workPerformed: "",
      partsReplaced: "",
      recommendations: "",
      purchasedByOffice: false,
    },
  });

  const slaJustificationValid =
    !ticket?.slaExceeded || ui.slaJustText.trim().length > 0;

  useEffect(() => {
    if (isOpen) {
      reset();
      uiDispatch({ type: "RESET" });
    }
  }, [isOpen, reset]);

  const onSubmit = async (values) => {
    if (!ticket) return;
    uiDispatch({ type: "SUBMIT_START" });
    try {
      const payload = {
        diagnosis: values.diagnosis.trim(),
        workPerformed: values.workPerformed.trim(),
        partsReplaced: values.partsReplaced.trim() || undefined,
        recommendations: values.recommendations.trim() || undefined,
        purchasedByOffice: values.purchasedByOffice,
      };
      if (ticket.slaExceeded && ui.slaJustText.trim()) {
        payload.slaJustification = ui.slaJustText.trim();
      }
      const result = await dispatch(
        resolveTicket({ id: ticket.id, data: payload })
      ).unwrap();
      toast.success(result?.message || "Ticket resolved successfully");
      reset();
      uiDispatch({ type: "RESET" });
      onClose();
    } catch (err) {
      uiDispatch({ type: "SUBMIT_ERR", error: err?.message || "Failed to resolve ticket" });
    }
  };

  const handleClose = () => {
    reset();
    uiDispatch({ type: "RESET" });
    onClose();
  };

  if (!ticket) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Resolve Ticket">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {ui.apiError && <Alert type="error" message={ui.apiError} onClose={() => uiDispatch({ type: "CLEAR_ERROR" })} />}

        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
          <p className="font-medium text-gray-900">{ticket.title}</p>
          {ticket.description && (
            <p className="mt-1 text-gray-600 line-clamp-2">{ticket.description}</p>
          )}
        </div>

        {ticket.slaExceeded && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>This ticket has exceeded the expected resolution time. An SLA justification is required.</span>
          </div>
        )}

        <div>
          <label htmlFor="diagnosis" className="mb-1 block text-sm font-medium text-gray-700">
            Diagnosis <span className="text-red-500">*</span>
          </label>
          <textarea
            id="diagnosis"
            rows={3}
            {...register("diagnosis", { required: "Diagnosis is required" })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.diagnosis && <p className="mt-1 text-xs text-red-600">{errors.diagnosis.message}</p>}
        </div>

        <div>
          <label htmlFor="workPerformed" className="mb-1 block text-sm font-medium text-gray-700">
            Work Performed <span className="text-red-500">*</span>
          </label>
          <textarea
            id="workPerformed"
            rows={3}
            {...register("workPerformed", { required: "Work performed is required" })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.workPerformed && <p className="mt-1 text-xs text-red-600">{errors.workPerformed.message}</p>}
        </div>

        <div>
          <label htmlFor="partsReplaced" className="mb-1 block text-sm font-medium text-gray-700">
            Parts Replaced
          </label>
          <input
            id="partsReplaced"
            type="text"
            {...register("partsReplaced")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="recommendations" className="mb-1 block text-sm font-medium text-gray-700">
            Recommendations
          </label>
          <textarea
            id="recommendations"
            rows={2}
            {...register("recommendations")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Controller
            name="purchasedByOffice"
            control={control}
            render={({ field }) => (
              <input
                id="purchasedByOffice"
                type="checkbox"
                checked={field.value}
                onChange={field.onChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            )}
          />
          <label htmlFor="purchasedByOffice" className="text-sm text-gray-700">
            Parts were purchased by office
          </label>
        </div>

        {ticket.slaExceeded && (
          <div>
            <label htmlFor="slaJustification" className="mb-1 block text-sm font-medium text-gray-700">
              SLA Justification <span className="text-red-500">*</span>
            </label>
            <textarea
              id="slaJustification"
              rows={2}
              value={ui.slaJustText}
              onChange={(e) => uiDispatch({ type: "SET_SLA_TEXT", value: e.target.value })}
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                ui.slaJustText.trim().length > 0 || !ticket.slaExceeded
                  ? "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  : "border-red-300 focus:border-red-500 focus:ring-red-500"
              }`}
              placeholder="Explain why this ticket exceeded the SLA window"
            />
            {ticket.slaExceeded && ui.slaJustText.trim().length === 0 && (
              <p className="mt-1 text-xs text-red-600">SLA justification is required for overdue tickets</p>
            )}
          </div>
        )}

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
            disabled={ui.submitting || !slaJustificationValid}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ui.submitting ? "Resolving…" : "Resolve Ticket"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
