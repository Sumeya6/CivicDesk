import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  assignTechnicianOffices,
  fetchTechnicianOffices,
} from "../store/userSlice";

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-[rgb(11_47_107_/_38%)] p-4 max-[640px]:items-start max-[640px]:p-3"
      role="presentation"
      onMouseDown={(event) =>
        event.target === event.currentTarget && onClose(false)
      }
    >
      <div
        className="w-[min(100%,32rem)] max-h-[calc(100vh-32px)] min-w-0 overflow-x-hidden overflow-y-auto rounded-xl border border-[var(--civic-border)] bg-white shadow-[0_18px_45px_rgb(11_47_107_/_18%)] max-[640px]:max-h-[calc(100vh-24px)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assignment-modal-title"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <div>
            <h2
              id="assignment-modal-title"
              className="text-base font-semibold text-slate-900"
            >
              {t("admin.officeAssignment")}
            </h2>
            <p className="text-xs text-slate-500">{technician.fullName}</p>
          </div>
          <button
            type="button"
            onClick={() => onClose(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        <form className="p-5" onSubmit={handleSubmit}>
          <p className="mb-2 text-xs font-medium text-slate-600">
            {t("admin.selectOffices")}
          </p>
          <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200 p-2">
            {loadingAssignments && (
              <p className="p-3 text-xs text-slate-500">
                {t("admin.loadingAssignments")}
              </p>
            )}
            {!loadingAssignments && offices.length === 0 && (
              <p className="p-3 text-xs text-slate-500">
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
                  className={`flex min-h-[44px] w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${selected ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  <span className="flex flex-col">
                    <span className="font-medium">{office.nameEn}</span>
                    <span
                      className={`text-xs ${selected ? "text-slate-300" : "text-slate-400"}`}
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
            <p className="mt-2 text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="mt-2 text-xs text-emerald-700" role="status">
              {success}
            </p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {t("admin.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving || loadingAssignments}
              className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? t("admin.saving") : t("admin.saveAssignments")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TechnicianAssignmentModal;
