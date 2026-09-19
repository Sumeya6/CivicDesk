import { useState, useEffect, useReducer } from "react";
import { useDispatch } from "react-redux";
import { verifyTicket } from "../../store/ticketSlice";
import { Modal } from "../../components/Modal";
import Alert from "../../components/Alert";
import { toast } from "react-toastify";
import { Star } from "lucide-react";

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          className="p-0.5 focus:outline-none focus:ring-2 focus:ring-[var(--civic-blue-600)] rounded"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              star <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-[var(--civic-border)]"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

const initialFormState = { rating: 0, feedback: "", submitting: false, apiError: null, mode: null };

function formReducer(state, action) {
  switch (action.type) {
    case "RESET":
      return initialFormState;
    case "SET_RATING":
      return { ...state, rating: action.value };
    case "SET_FEEDBACK":
      return { ...state, feedback: action.value };
    case "SET_MODE":
      return { ...state, mode: action.value };
    case "SUBMIT_START":
      return { ...state, submitting: true, apiError: null };
    case "SUBMIT_OK":
      return { ...state, submitting: false };
    case "SUBMIT_ERR":
      return { ...state, submitting: false, apiError: action.error };
    case "CLEAR_ERROR":
      return { ...state, apiError: null };
    default:
      return state;
  }
}

export default function VerifyTicketModal({ isOpen, onClose, ticket }) {
  const dispatch = useDispatch();
  const [form, formDispatch] = useReducer(formReducer, initialFormState);

  useEffect(() => {
    if (isOpen) formDispatch({ type: "RESET" });
  }, [isOpen]);

  const handleApprove = async () => {
    if (!form.rating || form.rating < 1 || form.rating > 5) return;
    formDispatch({ type: "SUBMIT_START" });
    try {
      const result = await dispatch(
        verifyTicket({ id: ticket.id, data: { isApproved: true, rating: form.rating, feedback: form.feedback.trim() || undefined } })
      ).unwrap();
      toast.success(result?.message || "Ticket approved and closed");
      formDispatch({ type: "RESET" });
      onClose();
    } catch (err) {
      formDispatch({ type: "SUBMIT_ERR", error: err?.message || "Failed to verify ticket" });
    }
  };

  const handleReject = async () => {
    formDispatch({ type: "SUBMIT_START" });
    try {
      const result = await dispatch(
        verifyTicket({ id: ticket.id, data: { isApproved: false, feedback: form.feedback.trim() || undefined } })
      ).unwrap();
      toast.success(result?.message || "Ticket reopened for technician");
      formDispatch({ type: "RESET" });
      onClose();
    } catch (err) {
      formDispatch({ type: "SUBMIT_ERR", error: err?.message || "Failed to verify ticket" });
    }
  };

  if (!ticket) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Verify Resolution">
      <div className="space-y-4">
        {form.apiError && <Alert type="error" message={form.apiError} onClose={() => formDispatch({ type: "CLEAR_ERROR" })} />}

        <div className="rounded-lg border border-[var(--civic-border)] bg-[#f7fafc] p-3 text-[14px]">
          <p className="font-medium text-[var(--civic-text)]">{ticket.title}</p>
          {ticket.description && (
            <p className="mt-1 line-clamp-2 text-[var(--civic-muted)]">{ticket.description}</p>
          )}
        </div>

        {!form.mode && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => formDispatch({ type: "SET_MODE", value: "approve" })}
              className="flex-1 rounded-lg border border-[var(--civic-success-border)] bg-[var(--civic-success-bg)] py-2.5 text-sm font-medium text-[var(--civic-success)] hover:bg-[var(--civic-success-bg)] hover:opacity-80"
            >
              Approve Resolution
            </button>
            <button
              type="button"
              onClick={() => formDispatch({ type: "SET_MODE", value: "reject" })}
              className="flex-1 rounded-lg border border-[var(--civic-error-border)] bg-[var(--civic-error-bg)] py-2.5 text-sm font-medium text-[var(--civic-error)] hover:bg-[var(--civic-error-bg)] hover:opacity-80"
            >
              Reject Resolution
            </button>
          </div>
        )}

        {form.mode === "approve" && (
          <div className="space-y-4">
            <div>
              <label className="civic-label">
                Rating <span className="text-[var(--civic-error)]">*</span>
              </label>
              <StarRating
                value={form.rating}
                onChange={(v) => formDispatch({ type: "SET_RATING", value: v })}
              />
              {form.rating === 0 && form.submitting && (
                <p className="mt-1 text-xs text-[var(--civic-error)]">Please select a rating</p>
              )}
            </div>

            <div>
              <label htmlFor="feedback-approve" className="civic-label">
                Feedback (optional)
              </label>
              <textarea
                id="feedback-approve"
                rows={3}
                value={form.feedback}
                onChange={(e) => formDispatch({ type: "SET_FEEDBACK", value: e.target.value })}
                className="civic-textarea"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-[var(--civic-border)] pt-4">
              <button
                type="button"
                onClick={() => formDispatch({ type: "SET_MODE", value: null })}
                className="button-secondary"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={form.submitting || form.rating < 1 || form.rating > 5}
                className="button-primary"
              >
                {form.submitting ? "Submitting…" : "Approve & Close"}
              </button>
            </div>
          </div>
        )}

        {form.mode === "reject" && (
          <div className="space-y-4">
            <div>
              <label htmlFor="feedback-reject" className="civic-label">
                Feedback (optional)
              </label>
              <textarea
                id="feedback-reject"
                rows={3}
                value={form.feedback}
                onChange={(e) => formDispatch({ type: "SET_FEEDBACK", value: e.target.value })}
                className="civic-textarea"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-[var(--civic-border)] pt-4">
              <button
                type="button"
                onClick={() => formDispatch({ type: "SET_MODE", value: null })}
                className="button-secondary"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={form.submitting}
                className="button-primary"
              >
                {form.submitting ? "Submitting…" : "Reject & Reopen"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
