import { useState, useEffect, useReducer } from "react";
import { useDispatch } from "react-redux";
import { verifyTicket } from "../../store/ticketSlice";
import { Modal } from "../../components/Pagination";
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
          className="p-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              star <= (hovered || value) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
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

        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
          <p className="font-medium text-gray-900">{ticket.title}</p>
          {ticket.description && (
            <p className="mt-1 text-gray-600 line-clamp-2">{ticket.description}</p>
          )}
        </div>

        {!form.mode && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => formDispatch({ type: "SET_MODE", value: "approve" })}
              className="flex-1 rounded-md border border-green-300 bg-green-50 py-2.5 text-sm font-medium text-green-700 hover:bg-green-100"
            >
              Approve Resolution
            </button>
            <button
              type="button"
              onClick={() => formDispatch({ type: "SET_MODE", value: "reject" })}
              className="flex-1 rounded-md border border-red-300 bg-red-50 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Reject Resolution
            </button>
          </div>
        )}

        {form.mode === "approve" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Rating <span className="text-red-500">*</span>
              </label>
              <StarRating
                value={form.rating}
                onChange={(v) => formDispatch({ type: "SET_RATING", value: v })}
              />
              {form.rating === 0 && form.submitting && (
                <p className="mt-1 text-xs text-red-600">Please select a rating</p>
              )}
            </div>

            <div>
              <label htmlFor="feedback-approve" className="mb-1 block text-sm font-medium text-gray-700">
                Feedback (optional)
              </label>
              <textarea
                id="feedback-approve"
                rows={3}
                value={form.feedback}
                onChange={(e) => formDispatch({ type: "SET_FEEDBACK", value: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => formDispatch({ type: "SET_MODE", value: null })}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={form.submitting || form.rating < 1 || form.rating > 5}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {form.submitting ? "Submitting…" : "Approve & Close"}
              </button>
            </div>
          </div>
        )}

        {form.mode === "reject" && (
          <div className="space-y-4">
            <div>
              <label htmlFor="feedback-reject" className="mb-1 block text-sm font-medium text-gray-700">
                Feedback (optional)
              </label>
              <textarea
                id="feedback-reject"
                rows={3}
                value={form.feedback}
                onChange={(e) => formDispatch({ type: "SET_FEEDBACK", value: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => formDispatch({ type: "SET_MODE", value: null })}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={form.submitting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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
