import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { createTicket, fetchCategories } from "../../store/ticketSlice";
import { fetchMyAssets } from "../../store/assetSlice";
import { Modal } from "../../components/Modal";
import Alert from "../../components/Alert";
import { toast } from "react-toastify";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function CreateTicketModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const categories = useSelector((s) => s.tickets.categories);
  const myAssets = useSelector((s) => s.assets.myAssets);
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
      assetId: "",
      priority: "MEDIUM",
    },
  });

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchCategories());
      dispatch(fetchMyAssets());
    }
  }, [isOpen, dispatch]);

  const onSubmit = async (values) => {
    setSubmitting(true);
    setApiError(null);
    try {
      const payload = { ...values };
      if (!payload.assetId) delete payload.assetId;
      const result = await dispatch(createTicket(payload)).unwrap();
      toast.success(result?.message || t("createTicket.success"));
      reset();
      onClose();
    } catch (err) {
      setApiError(err?.message || t("createTicket.failed"));
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
    <Modal isOpen={isOpen} onClose={handleClose} title={t("createTicket.title")}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {apiError && <Alert type="error" message={apiError} onClose={() => setApiError(null)} />}

        <div>
          <label htmlFor="title" className="civic-label">
            {t("createTicket.titleLabel")} <span className="text-[var(--civic-error)]">*</span>
          </label>
          <input
            id="title"
            type="text"
            placeholder={t("createTicket.titlePlaceholder")}
            {...register("title", { required: t("createTicket.titleRequired") })}
            className="civic-input"
          />
          {errors.title && <p className="mt-1 text-xs text-[var(--civic-error)]">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="civic-label">
            {t("createTicket.descriptionLabel")} <span className="text-[var(--civic-error)]">*</span>
          </label>
          <textarea
            id="description"
            rows={3}
            placeholder={t("createTicket.descriptionPlaceholder")}
            {...register("description", { required: t("createTicket.descriptionRequired") })}
            className="civic-textarea"
          />
          {errors.description && <p className="mt-1 text-xs text-[var(--civic-error)]">{errors.description.message}</p>}
        </div>

        <div>
          <label htmlFor="categoryId" className="civic-label">
            {t("createTicket.categoryLabel")} <span className="text-[var(--civic-error)]">*</span>
          </label>
          <select
            id="categoryId"
            {...register("categoryId", { required: t("createTicket.categoryRequired") })}
            className="civic-select"
          >
            <option value="">{t("createTicket.categoryPlaceholder")}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nameEn}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="mt-1 text-xs text-[var(--civic-error)]">{errors.categoryId.message}</p>}
        </div>

        <div>
          <label htmlFor="deviceOrSystem" className="civic-label">
            {t("createTicket.deviceLabel")}
          </label>
          <input
            id="deviceOrSystem"
            type="text"
            placeholder={t("createTicket.devicePlaceholder")}
            {...register("deviceOrSystem")}
            className="civic-input"
          />
        </div>

        <div>
          <label htmlFor="assetId" className="civic-label">
            {t("createTicket.assetLabel")}
          </label>
          <select
            id="assetId"
            {...register("assetId")}
            className="civic-select"
          >
            <option value="">{t("createTicket.assetPlaceholder")}</option>
            {myAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.assetTag} - {asset.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="civic-label">
            {t("createTicket.priorityLabel")}
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
            {t("createTicket.cancel")}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="button-primary"
          >
            {submitting ? t("createTicket.submitting") : t("createTicket.submit")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
