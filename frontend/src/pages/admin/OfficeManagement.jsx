import {
  Building2,
  CheckCircle2,
  Edit3,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import OfficeModal from "../../components/OfficeModal";
import {
  deleteOffice,
  fetchOffices,
  updateOfficeStatus,
} from "../../store/officeSlice";

function OfficeManagement() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const {
    items: offices,
    status,
    error,
  } = useSelector((state) => state.offices);
  const [modalOffice, setModalOffice] = useState(undefined);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [officeToDelete, setOfficeToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const activeOffices = offices.filter((office) => office.isActive).length;

  useEffect(() => {
    dispatch(fetchOffices());
  }, [dispatch]);

  const toggleStatus = async (office) => {
    setUpdatingId(office.id);
    try {
      await dispatch(
        updateOfficeStatus({ id: office.id, isActive: !office.isActive }),
      ).unwrap();
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!officeToDelete) return;

    setDeletingId(officeToDelete.id);
    setDeleteError("");
    try {
      await dispatch(deleteOffice(officeToDelete.id)).unwrap();
      setOfficeToDelete(null);
    } catch (requestError) {
      setDeleteError(requestError);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section
      className="admin-surface workspace-page"
      aria-labelledby="offices-title"
    >
      <header className="workspace-header">
        <div>
          <p className="workspace-eyebrow">
            <Building2 size={14} /> {t("admin.administration")}
          </p>
          <h1 id="offices-title">{t("admin.officeManagement")}</h1>
          <p className="workspace-description">
            {t("admin.officeDescription")}
          </p>
        </div>
        <div className="workspace-actions">
          <button
            type="button"
            onClick={() => dispatch(fetchOffices())}
            className="button-secondary"
          >
            <RefreshCw size={14} />
            {t("admin.refresh")}
          </button>
          <button
            type="button"
            onClick={() => setModalOffice(null)}
            className="button-primary"
          >
            <Plus size={14} />
            {t("admin.addOffice")}
          </button>
        </div>
      </header>

      <div className="summary-strip" aria-label="Office summary">
        <div className="summary-item">
          <span className="summary-icon">
            <Building2 size={16} />
          </span>
          <div>
            <span className="summary-label">{t("admin.totalOffices")}</span>
            <strong>{offices.length}</strong>
          </div>
        </div>
        <div className="summary-item">
          <span className="summary-icon summary-icon-success">
            <CheckCircle2 size={16} />
          </span>
          <div>
            <span className="summary-label">{t("admin.activeOffices")}</span>
            <strong>{activeOffices}</strong>
          </div>
        </div>
        <div className="summary-context">
          <span>{t("admin.aradaDirectory")}</span>
          <span>{t("admin.lastView")}</span>
        </div>
      </div>

      {error && (
        <div className="workspace-alert" role="alert">
          {error}
        </div>
      )}

      <div className="content-surface">
        <div className="content-surface-header">
          <div>
            <h2>{t("admin.officeDirectory")}</h2>
            <p>{t("admin.officeDirectoryDesc")}</p>
          </div>
          <span className="record-count">
            {t("admin.records", { count: offices.length })}
          </span>
        </div>
        <div className="table-scroll">
          <table className="workspace-table">
            <caption className="sr-only">{t("admin.officeDirectory")}</caption>
            <thead>
              <tr>
                <th>{t("admin.office")}</th>
                <th>{t("admin.officeCode")}</th>
                <th>{t("admin.status")}</th>
                <th className="actions-column">{t("admin.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {status === "loading" && offices.length === 0 ? (
                <tr>
                  <td colSpan="4" className="table-state">
                    {t("admin.loadingOffices")}
                  </td>
                </tr>
              ) : (
                offices.map((office) => (
                  <tr key={office.id} data-testid="office-row">
                    <td>
                      <div className="entity-cell">
                        <span className="entity-icon">
                          <Building2 size={15} />
                        </span>
                        <div>
                          <p className="entity-name">{office.nameEn}</p>
                          <p className="entity-secondary">{office.nameAm}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="code-label">{office.code}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={office.isActive}
                        aria-label={`Set ${office.nameEn} ${office.isActive ? t("admin.inactive") : t("admin.active")}`}
                        disabled={updatingId === office.id}
                        onClick={() => toggleStatus(office)}
                        className={`status-badge ${office.isActive ? "status-active" : "status-inactive"}`}
                      >
                        <span />
                        {office.isActive
                          ? t("admin.active")
                          : t("admin.inactive")}
                      </button>
                    </td>
                    <td className="actions-column">
                      <button
                        type="button"
                        onClick={() => setModalOffice(office)}
                        className="table-action"
                      >
                        <Edit3 size={13} />
                        {t("admin.edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError("");
                          setOfficeToDelete(office);
                        }}
                        className="table-action table-action-danger"
                      >
                        <Trash2 size={13} />
                        {t("admin.delete")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {status !== "loading" && offices.length === 0 && (
                <tr>
                  <td colSpan="4" className="table-state">
                    {t("admin.noOffices")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {modalOffice !== undefined && (
        <OfficeModal
          office={modalOffice}
          onClose={() => setModalOffice(undefined)}
        />
      )}
      {officeToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-[rgb(11_47_107_/_38%)] p-4 max-[640px]:items-start max-[640px]:p-3"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget &&
            deletingId === null &&
            setOfficeToDelete(null)
          }
        >
          <div
            className="w-[min(100%,28rem)] max-h-[calc(100vh-32px)] min-w-0 overflow-x-hidden overflow-y-auto rounded-xl border border-[var(--civic-border)] bg-white shadow-[0_18px_45px_rgb(11_47_107_/_18%)] max-[640px]:max-h-[calc(100vh-24px)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-office-title"
          >
            <div className="border-b border-slate-200 px-5 py-4">
              <h2
                id="delete-office-title"
                className="text-base font-semibold text-slate-900"
              >
                {t("admin.deleteOffice")}
              </h2>
            </div>
            <div className="grid gap-4 p-5">
              <p className="text-sm text-slate-600">
                {t("admin.confirmDeleteOffice")}
              </p>
              {deleteError && (
                <p className="text-xs text-red-600" role="alert">
                  {deleteError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOfficeToDelete(null)}
                  disabled={deletingId !== null}
                  className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {t("admin.cancel")}
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deletingId !== null}
                  className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {deletingId !== null
                    ? t("admin.deleting")
                    : t("admin.delete")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default OfficeManagement;
