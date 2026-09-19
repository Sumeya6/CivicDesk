import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { createAsset, updateAsset } from "../store/assetSlice";
import { fetchOfficeOptions } from "../store/officeSlice";
import { Modal } from "./Modal";

const ASSET_TYPES = ["COMPUTER", "PRINTER", "NETWORK_DEVICE", "PHONE", "FURNITURE", "OTHER"];
const ASSET_STATUSES = ["ACTIVE", "MAINTENANCE", "RETIRED", "ARCHIVED"];

export default function AssetModal({ asset, onClose }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const offices = useSelector((s) => s.offices.items);
  const [form, setForm] = useState(() => ({
    assetTag: asset?.assetTag ?? "",
    name: asset?.name ?? "",
    assetType: asset?.assetType ?? "COMPUTER",
    serialNumber: asset?.serialNumber ?? "",
    status: asset?.status ?? "ACTIVE",
    officeId: asset?.officeId ?? "",
    employeeId: asset?.employeeId ?? "",
    purchaseDate: asset?.purchaseDate ? asset.purchaseDate.slice(0, 10) : "",
    warrantyExpiry: asset?.warrantyExpiry ? asset.warrantyExpiry.slice(0, 10) : "",
    notes: asset?.notes ?? "",
  }));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchOfficeOptions());
  }, [dispatch]);

  const handleChange = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.assetTag.trim() || !form.name.trim() || !form.officeId) {
      setError(t("assets.requiredFields"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const action = asset
        ? updateAsset({ id: asset.id, ...form })
        : createAsset(form);
      await dispatch(action).unwrap();
      onClose();
    } catch (requestError) {
      setError(typeof requestError === "string" ? requestError : requestError?.message || "Failed to save asset");
    } finally {
      setSaving(false);
    }
  };

  const modalTitle = asset ? t("assets.editAsset") : t("assets.addAsset");

  return (
    <Modal isOpen={true} onClose={onClose} title={modalTitle} maxWidth="max-w-xl">
      <form className="flex flex-col gap-3.5 p-5" onSubmit={handleSubmit}>
        <label className="civic-label">
          {t("assets.assetTag")} *
          <input
            className="civic-input"
            value={form.assetTag}
            onChange={handleChange("assetTag")}
          />
        </label>
        <label className="civic-label">
          {t("assets.name")} *
          <input
            className="civic-input"
            value={form.name}
            onChange={handleChange("name")}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="civic-label">
            {t("assets.assetType")}
            <select
              className="civic-select"
              value={form.assetType}
              onChange={handleChange("assetType")}
            >
              {ASSET_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`assets.types.${type.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="civic-label">
            {t("assets.status")}
            <select
              className="civic-select"
              value={form.status}
              onChange={handleChange("status")}
            >
              {ASSET_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`assets.statuses.${status.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="civic-label">
          {t("assets.serialNumber")}
          <input
            className="civic-input"
            value={form.serialNumber}
            onChange={handleChange("serialNumber")}
          />
        </label>
        <label className="civic-label">
          {t("assets.office")} *
          <select
            className="civic-select"
            value={form.officeId}
            onChange={handleChange("officeId")}
          >
            <option value="">{t("assets.selectOffice")}</option>
            {offices.map((office) => (
              <option key={office.id} value={office.id}>
                {office.nameEn} ({office.code})
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="civic-label">
            {t("assets.purchaseDate")}
            <input
              type="date"
              className="civic-input"
              value={form.purchaseDate}
              onChange={handleChange("purchaseDate")}
            />
          </label>
          <label className="civic-label">
            {t("assets.warrantyExpiry")}
            <input
              type="date"
              className="civic-input"
              value={form.warrantyExpiry}
              onChange={handleChange("warrantyExpiry")}
            />
          </label>
        </div>
        <label className="civic-label">
          {t("assets.notes")}
          <textarea
            rows={2}
            className="civic-textarea"
            value={form.notes}
            onChange={handleChange("notes")}
          />
        </label>
        {error && (
          <div className="civic-alert civic-alert-error" role="alert">
            <span className="flex-1">{error}</span>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="button-secondary"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="button-primary"
          >
            {saving ? t("admin.saving") : asset ? t("common.saveChanges") : t("assets.addAsset")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
