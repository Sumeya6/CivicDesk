import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { fetchAssets, archiveAsset, clearAssetError } from "../../store/assetSlice";
import { fetchOfficeOptions } from "../../store/officeSlice";
import AssetModal from "../../components/AssetModal";
import ConfirmModal from "../../components/ConfirmModal";
import { Package, Plus, RefreshCw, Eye, Archive, Edit3 } from "lucide-react";
import { Pagination } from "../../components/Pagination";

const STATUS_CLASSES = {
  ACTIVE: "bg-[var(--civic-success-bg)] text-[var(--civic-success)]",
  MAINTENANCE: "bg-yellow-100 text-yellow-800",
  RETIRED: "bg-slate-100 text-[var(--civic-muted)]",
  ARCHIVED: "bg-[var(--civic-error-bg)] text-[var(--civic-error)]",
};

const TYPE_CLASSES = {
  COMPUTER: "bg-blue-100 text-blue-800",
  PRINTER: "bg-purple-100 text-purple-800",
  NETWORK_DEVICE: "bg-cyan-100 text-cyan-800",
  PHONE: "bg-orange-100 text-orange-800",
  FURNITURE: "bg-amber-100 text-amber-800",
  OTHER: "bg-slate-100 text-[var(--civic-muted)]",
};

export default function AssetManagement() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { items: assets, meta, status, error } = useSelector((s) => s.assets);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [page, setPage] = useState(1);
  const [modalAsset, setModalAsset] = useState(undefined);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  useEffect(() => {
    dispatch(fetchAssets({ page, pageSize: 20, search, status: filterStatus, assetType: filterType }));
  }, [dispatch, page, search, filterStatus, filterType]);

  useEffect(() => {
    dispatch(fetchOfficeOptions());
  }, [dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleArchive = async () => {
    if (!deleteModal.id) return;
    try {
      await dispatch(archiveAsset(deleteModal.id)).unwrap();
      setDeleteModal({ isOpen: false, id: null });
      dispatch(fetchAssets({ page, pageSize: 20, search, status: filterStatus, assetType: filterType }));
    } catch {
      dispatch(clearAssetError());
    }
  };

  const activeAssets = assets.filter((a) => a.status === "ACTIVE").length;

  return (
    <section className="admin-surface workspace-page" aria-labelledby="assets-title">
      <header className="workspace-header">
        <div>
          <p className="workspace-eyebrow">
            <Package size={14} /> {t("admin.administration")}
          </p>
          <h1 id="assets-title">{t("assets.title")}</h1>
          <p className="workspace-description">{t("assets.description")}</p>
        </div>
        <div className="workspace-actions">
          <button type="button" onClick={() => dispatch(fetchAssets({ page, pageSize: 20, search, status: filterStatus, assetType: filterType }))} className="button-secondary">
            <RefreshCw size={14} /> {t("admin.refresh")}
          </button>
          <button type="button" onClick={() => setModalAsset(null)} className="button-primary">
            <Plus size={14} /> {t("assets.addAsset")}
          </button>
        </div>
      </header>

      <div className="summary-strip" aria-label="Asset summary">
        <div className="summary-item">
          <span className="summary-icon"><Package size={16} /></span>
          <div>
            <span className="summary-label">{t("assets.totalAssets")}</span>
            <strong>{meta?.total ?? assets.length}</strong>
          </div>
        </div>
        <div className="summary-item">
          <span className="summary-icon summary-icon-success"><Package size={16} /></span>
          <div>
            <span className="summary-label">{t("assets.activeAssets")}</span>
            <strong>{activeAssets}</strong>
          </div>
        </div>
      </div>

      <div className="content-surface">
        <div className="content-surface-header">
          <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
            <label className="block text-xs font-medium text-[var(--civic-muted)]">
              {t("common.search")}
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-[var(--civic-border)] px-3 py-1.5 text-sm"
                placeholder={t("assets.searchPlaceholder")}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </label>
            <label className="block text-xs font-medium text-[var(--civic-muted)]">
              {t("assets.status")}
              <select
                className="mt-1 rounded-lg border border-[var(--civic-border)] px-3 py-1.5 text-sm"
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              >
                <option value="">{t("assets.allStatuses")}</option>
                <option value="ACTIVE">{t("assets.statuses.active")}</option>
                <option value="MAINTENANCE">{t("assets.statuses.maintenance")}</option>
                <option value="RETIRED">{t("assets.statuses.retired")}</option>
                <option value="ARCHIVED">{t("assets.statuses.archived")}</option>
              </select>
            </label>
            <label className="block text-xs font-medium text-[var(--civic-muted)]">
              {t("assets.assetType")}
              <select
                className="mt-1 rounded-lg border border-[var(--civic-border)] px-3 py-1.5 text-sm"
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              >
                <option value="">{t("assets.allTypes")}</option>
                <option value="COMPUTER">{t("assets.types.computer")}</option>
                <option value="PRINTER">{t("assets.types.printer")}</option>
                <option value="NETWORK_DEVICE">{t("assets.types.network_device")}</option>
                <option value="PHONE">{t("assets.types.phone")}</option>
                <option value="FURNITURE">{t("assets.types.furniture")}</option>
                <option value="OTHER">{t("assets.types.other")}</option>
              </select>
            </label>
          </form>
          <span className="record-count">{t("admin.records", { count: meta?.total ?? assets.length })}</span>
        </div>

        {error && <div className="workspace-alert" role="alert">{typeof error === "string" ? error : t("errors.somethingWentWrong")}</div>}

        <div className="table-scroll">
          <table className="workspace-table">
            <caption className="sr-only">{t("assets.directory")}</caption>
            <thead>
              <tr>
                <th>{t("assets.assetTag")}</th>
                <th>{t("assets.name")}</th>
                <th>{t("assets.assetType")}</th>
                <th>{t("assets.office")}</th>
                <th>{t("assets.status")}</th>
                <th className="actions-column">{t("admin.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {status === "loading" && assets.length === 0 ? (
                <tr><td colSpan="6" className="table-state">{t("common.loading")}</td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan="6" className="table-state">{t("assets.noAssets")}</td></tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} data-testid="asset-row">
                    <td><span className="code-label">{asset.assetTag}</span></td>
                    <td>{asset.name}</td>
                    <td><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_CLASSES[asset.assetType] || TYPE_CLASSES.OTHER}`}>{t(`assets.types.${(asset.assetType || "OTHER").toLowerCase()}`)}</span></td>
                    <td>{asset.office?.nameEn || "-"}</td>
                    <td><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[asset.status] || ""}`}>{t(`assets.statuses.${(asset.status || "ACTIVE").toLowerCase()}`)}</span></td>
                    <td className="actions-column">
                      <Link to={`/assets/${asset.id}`} className="table-action inline-flex items-center gap-1">
                        <Eye size={13} /> {t("common.view")}
                      </Link>
                      <button type="button" onClick={() => setModalAsset(asset)} className="table-action">
                        <Edit3 size={13} /> {t("admin.edit")}
                      </button>
                      {asset.status !== "ARCHIVED" && (
                        <button type="button" onClick={() => setDeleteModal({ isOpen: true, id: asset.id })} className="table-action table-action-danger">
                          <Archive size={13} /> {t("assets.archive")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.pageCount > 1 && (
          <Pagination page={page} totalPages={meta.pageCount} onPageChange={setPage} />
        )}
      </div>

      {modalAsset !== undefined && (
        <AssetModal asset={modalAsset} onClose={() => setModalAsset(undefined)} />
      )}
      {deleteModal.isOpen && (
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, id: null })}
          onConfirm={handleArchive}
          variant="danger"
          message={t("assets.confirmArchive")}
          confirmText={t("assets.archive")}
          cancelText={t("common.cancel")}
        />
      )}
    </section>
  );
}
