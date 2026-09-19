import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  assignTechnicianOffices,
  fetchTechnicianOffices,
} from "../store/userSlice";
import { Modal } from "./Modal";

function TechnicianAssignmentModal({ technician, offices, onClose }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [selectedOfficeIds, setSelectedOfficeIds] = useState(
    technician.officeIds ?? [],
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    dispatch(fetchTechnicianOffices(technician.id))
      .unwrap()
      .then(({ officeIds }) => {
        if (mounted) setSelectedOfficeIds(officeIds);
      })
      .catch((requestError) => {
        if (mounted) setError(requestError);
      })
      .finally(() => {
        if (mounted) setLoadingAssignments(false);
      });
    return () => {
      mounted = false;
    };
  }, [dispatch, technician.id]);

  const toggleOffice = (id) =>
    setSelectedOfficeIds((current) =>
      current.includes(id)
        ? current.filter((officeId) => officeId !== id)
        : [...current, id],
    );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await dispatch(
        assignTechnicianOffices({
          id: technician.id,
          officeIds: selectedOfficeIds,
        }),
      ).unwrap();
      setSuccess(t("admin.assignmentSaved"));
      window.setTimeout(() => onClose(true), 600);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={() => onClose(false)} title={t("admin.officeAssignment")}>
      <div className="px-5 pt-1">
        <p className="text-[12px] text-[var(--civic-muted)]">{technician.fullName}</p>
      </div>
      <form className="p-5" onSubmit={handleSubmit}>
        <p className="mb-2 text-[12px] font-medium text-[var(--civic-text)]">
          {t("admin.selectOffices")}
        </p>
        <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-[var(--civic-border)] p-2">
          {loadingAssignments && (
            <p className="p-3 text-[12px] text-[var(--civic-muted)]">
              {t("admin.loadingAssignments")}
            </p>
          )}
          {!loadingAssignments && offices.length === 0 && (
            <p className="p-3 text-[12px] text-[var(--civic-muted)]">
              {t("admin.noOffices")}
            </p>
          )}
          {offices.map((office) => {
            const selected = selectedOfficeIds.includes(office.id);
            return (
              <button
                key={office.id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleOffice(office.id)}
                className={`flex min-h-[44px] w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${selected ? "bg-[var(--civic-blue-800)] text-white" : "text-[var(--civic-text)] hover:bg-[var(--civic-cyan-50)]"}`}
              >
                <span className="flex flex-col">
                  <span className="font-medium">{office.nameEn}</span>
                  <span
                    className={`text-[12px] ${selected ? "text-slate-300" : "text-[var(--civic-muted)]"}`}
                  >
                    {office.nameAm}
                  </span>
                </span>
                {selected && <Check size={16} className="shrink-0" />}
              </button>
            );
          })}
        </div>
        {error && (
          <div className="civic-alert civic-alert-error mt-2" role="alert">
            <span className="flex-1">{error}</span>
          </div>
        )}
        {success && (
          <div className="civic-alert civic-alert-success mt-2" role="status">
            <span className="flex-1">{success}</span>
          </div>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="button-secondary"
          >
            {t("admin.cancel")}
          </button>
          <button
            type="submit"
            disabled={saving || loadingAssignments}
            className="button-primary"
          >
            {saving ? t("admin.saving") : t("admin.saveAssignments")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default TechnicianAssignmentModal;
