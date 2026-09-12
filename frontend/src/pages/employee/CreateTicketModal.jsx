import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { createTicket, fetchCategories } from "../../store/ticketSlice";
import { Modal } from "../../components/Pagination";
import Alert from "../../components/Alert";
import { useState } from "react";
import { toast } from "react-toastify";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function CreateTicketModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const categories = useSelector((s) => s.tickets.categories);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      deviceOrSystem: "",
      priority: "MEDIUM",
    },
  });

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchCategories());
    }
  }, [isOpen, dispatch]);

  const onSubmit = async (values) => {
    setSubmitting(true);
    setApiError(null);
    try {
      const result = await dispatch(createTicket(values)).unwrap();
      toast.success(result?.message || "Ticket created successfully");
      reset();
      onClose();
    } catch (err) {
      setApiError(err?.message || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setApiError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Ticket">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {apiError && <Alert type="error" message={apiError} onClose={() => setApiError(null)} />}

        <div>
          <label htmlFor="title" className="civic-label">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            {...register("title", { required: "Title is required" })}
            className="civic-input"
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="civic-label">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            rows={3}
            {...register("description", { required: "Description is required" })}
            className="civic-textarea"
          />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
        </div>

        <div>
          <label htmlFor="categoryId" className="civic-label">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="categoryId"
            {...register("categoryId", { required: "Category is required" })}
            className="civic-select"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nameEn}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId.message}</p>}
        </div>

        <div>
          <label htmlFor="deviceOrSystem" className="civic-label">
            Device / System
          </label>
          <input
            id="deviceOrSystem"
            type="text"
            {...register("deviceOrSystem")}
            className="civic-input"
          />
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
            disabled={submitting}
            className="button-primary"
          >
            {submitting ? "Submitting…" : "Create Ticket"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
