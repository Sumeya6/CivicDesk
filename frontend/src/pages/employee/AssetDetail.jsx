import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { fetchAsset, clearCurrentAsset } from "../../store/assetSlice";
import { ArrowLeft, Package, Building2, User, Calendar } from "lucide-react";

const STATUS_CLASSES = {
  ACTIVE: "bg-[var(--civic-success-bg)] text-[var(--civic-success)]",
  MAINTENANCE: "bg-yellow-100 text-yellow-800",
  RETIRED: "bg-slate-100 text-[var(--civic-muted)]",
  ARCHIVED: "bg-[var(--civic-error-bg)] text-[var(--civic-error)]",
};

export default function AssetDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const asset = useSelector((s) => s.assets.currentAsset);

  useEffect(() => {
    dispatch(fetchAsset(id));
    return () => dispatch(clearCurrentAsset());
  }, [dispatch, id]);

  if (!asset) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--civic-blue-800)] border-t-transparent" />
      </div>
    );
  }

  return (
    <section className="admin-surface workspace-page" aria-labelledby="asset-detail-title">
      <header className="workspace-header">
        <div>
          <Link to="/assets" className="mb-2 inline-flex items-center gap-1 text-sm text-[var(--civic-muted)] hover:text-[var(--civic-text)]">
            <ArrowLeft size={14} /> {t("assets.backToList")}
          </Link>
          <h1 id="asset-detail-title">{asset.name}</h1>
          <p className="workspace-description">
            <span className="code-label mr-2">{asset.assetTag}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[asset.status] || ""}`}>
              {t(`assets.statuses.${asset.status.toLowerCase()}`)}
            </span>
          </p>
        </div>
      </header>

      <div className="content-surface">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--civic-text)]">{t("assets.details")}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Package size={15} className="text-[var(--civic-muted)]" />
                <span className="text-[var(--civic-muted)]">{t("assets.assetType")}:</span>
                <span>{t(`assets.types.${asset.assetType.toLowerCase()}`)}</span>
              </div>
              {asset.serialNumber && (
                <div className="flex items-center gap-3 text-sm">
                  <Package size={15} className="text-[var(--civic-muted)]" />
                  <span className="text-[var(--civic-muted)]">{t("assets.serialNumber")}:</span>
                  <span>{asset.serialNumber}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Building2 size={15} className="text-[var(--civic-muted)]" />
                <span className="text-[var(--civic-muted)]">{t("assets.office")}:</span>
                <span>{asset.office?.nameEn || "-"}</span>
              </div>
              {asset.employee && (
                <div className="flex items-center gap-3 text-sm">
                  <User size={15} className="text-[var(--civic-muted)]" />
                  <span className="text-[var(--civic-muted)]">{t("assets.assignedTo")}:</span>
                  <span>{asset.employee.fullName}</span>
                </div>
              )}
              {asset.purchaseDate && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={15} className="text-[var(--civic-muted)]" />
                  <span className="text-[var(--civic-muted)]">{t("assets.purchaseDate")}:</span>
                  <span>{new Date(asset.purchaseDate).toLocaleDateString()}</span>
                </div>
              )}
              {asset.warrantyExpiry && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={15} className="text-[var(--civic-muted)]" />
                  <span className="text-[var(--civic-muted)]">{t("assets.warrantyExpiry")}:</span>
                  <span>{new Date(asset.warrantyExpiry).toLocaleDateString()}</span>
                </div>
              )}
              {asset.notes && (
                <div className="text-sm">
                  <span className="text-[var(--civic-muted)]">{t("assets.notes")}:</span>
                  <p className="mt-1 text-[var(--civic-text)]">{asset.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--civic-text)]">{t("assets.ticketHistory")}</h3>
            {asset.tickets && asset.tickets.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {asset.tickets.map((ticket) => (
                  <div key={ticket.id} className="py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link to={`/tickets`} className="text-sm font-medium text-[var(--civic-blue-800)] hover:underline">
                          {ticket.title}
                        </Link>
                        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--civic-muted)]">
                          <span>{ticket.employee?.fullName}</span>
                          <span>&middot;</span>
                          <span>{ticket.technician?.fullName || t("assets.unassigned")}</span>
                        </div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[ticket.status] || ""}`}>
                        {t(`status.${ticket.status.toLowerCase()}`)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--civic-muted)]">{t("assets.noTickets")}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
