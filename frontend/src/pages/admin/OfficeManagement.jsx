import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import OfficeModal from "../../components/OfficeModal";
import ConfirmModal from "../../components/ConfirmModal";
import {
  deleteOffice,
  fetchOffices,
  updateOfficeStatus,
} from "../../store/officeSlice";
import {
  Building2,
  CheckCircle2,
  Edit3,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

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
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
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

  const handleDelete = (id) => {
    setDeleteModal({ isOpen: true, id });
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      setDeleteError("");
      await dispatch(deleteOffice(deleteModal.id)).unwrap();
      setDeleteModal({ isOpen: false, id: null });
    } catch (requestError) {
      setDeleteError(requestError);
      setDeleteModal({ isOpen: false, id: null });
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
                        onClick={() => handleDelete(office.id)}
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
{deleteModal.isOpen && (
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, id: null })}
          onConfirm={handleConfirmDelete}
          variant="danger"
          message={t("confirmModal.deleteOfficeMessage")}
          confirmText={t("confirmModal.deleteConfirm")}
          cancelText={t("confirmModal.cancel")}
        />
      )}
      </section>
    );
  }

export default OfficeManagement;