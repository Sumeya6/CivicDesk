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

        <div style={{ border: "1px solid var(--civic-border)", background: "#f7fafc", borderRadius: 8, padding: 12, fontSize: 14 }}>
          <p className="font-medium" style={{ color: "var(--civic-text)" }}>{ticket.title}</p>
          {ticket.description && (
            <p className="mt-1 line-clamp-2" style={{ color: "var(--civic-muted)" }}>{ticket.description}</p>
          )}
        </div>

        {ticket.slaExceeded && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>This ticket has exceeded the expected resolution time. An SLA justification is required.</span>
          </div>
        )}

        <div>
          <label htmlFor="diagnosis" className="civic-label">
            Diagnosis <span className="text-red-500">*</span>
          </label>
          <textarea
            id="diagnosis"
            rows={3}
            {...register("diagnosis", { required: "Diagnosis is required" })}
            className="civic-textarea"
          />
          {errors.diagnosis && <p className="mt-1 text-xs text-red-600">{errors.diagnosis.message}</p>}
        </div>

        <div>
          <label htmlFor="workPerformed" className="civic-label">
            Work Performed <span className="text-red-500">*</span>
          </label>
          <textarea
            id="workPerformed"
            rows={3}
            {...register("workPerformed", { required: "Work performed is required" })}
            className="civic-textarea"
          />
          {errors.workPerformed && <p className="mt-1 text-xs text-red-600">{errors.workPerformed.message}</p>}
        </div>

        <div>
          <label htmlFor="partsReplaced" className="civic-label">
            Parts Replaced
          </label>
          <input
            id="partsReplaced"
            type="text"
            {...register("partsReplaced")}
            className="civic-input"
          />
        </div>

        <div>
          <label htmlFor="recommendations" className="civic-label">
            Recommendations
          </label>
          <textarea
            id="recommendations"
            rows={2}
            {...register("recommendations")}
            className="civic-textarea"
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
          <label htmlFor="purchasedByOffice" className="text-sm" style={{ color: "var(--civic-text)" }}>
            Parts were purchased by office
          </label>
        </div>

        {ticket.slaExceeded && (
          <div>
            <label htmlFor="slaJustification" className="civic-label">
              SLA Justification <span className="text-red-500">*</span>
            </label>
            <textarea
              id="slaJustification"
              rows={2}
              value={ui.slaJustText}
              onChange={(e) => uiDispatch({ type: "SET_SLA_TEXT", value: e.target.value })}
              className={`civic-textarea ${
                ui.slaJustText.trim().length > 0 || !ticket.slaExceeded
                  ? ""
                  : "border-red-300 focus:border-red-500 focus:ring-red-500"
              }`}
              placeholder="Explain why this ticket exceeded the SLA window"
            />
            {ticket.slaExceeded && ui.slaJustText.trim().length === 0 && (
              <p className="mt-1 text-xs text-red-600">SLA justification is required for overdue tickets</p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t pt-4" style={{ borderColor: "var(--civic-border)" }}>
          <button
            type="button"
            onClick={handleClose}
            className="button-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={ui.submitting || !slaJustificationValid}
            className="button-primary"
          >
            {ui.submitting ? "Resolving…" : "Resolve Ticket"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
