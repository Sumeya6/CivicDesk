import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../api/axios";
import SkeletonBlock from "../../components/SkeletonBlock";
import EmptyState from "../../components/EmptyState";
import ConfirmModal from "../../components/ConfirmModal";
import { Megaphone, Plus, Trash2, Clock, AlertCircle } from "lucide-react";

const inputClasses = "civic-input";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/announcements");
      setAnnouncements(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get("/announcements");
        if (!cancelled) setAnnouncements(data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError(
        t("announcements.validationError") ||
          "Please enter both a title and content.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      await api.post("/announcements", {
        title: title.trim(),
        content: content.trim(),
      });
      setTitle("");
      setContent("");
      await fetchAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteModal({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      setError("");
      await api.delete(`/announcements/${deleteModal.id}`);
      await fetchAnnouncements();
      setDeleteModal({ isOpen: false, id: null });
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setDeleteModal({ isOpen: false, id: null });
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="admin-surface workspace-page">
      {/* Header */}
      <header className="workspace-header">
        <div>
          <p className="workspace-eyebrow">
            <Megaphone size={14} /> {t("admin.administration")}
          </p>
          <h1>{t("announcements.title")}</h1>
          <p className="workspace-description">
            {t("announcements.description")}
          </p>
        </div>
        {!loading && announcements.length > 0 && (
          <div className="workspace-actions">
            <span className="role-label">
              {announcements.length}{" "}
              {announcements.length === 1 ? "announcement" : "announcements"}
            </span>
          </div>
        )}
      </header>

      {/* Error */}
      {error && (
        <div className="workspace-alert" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">{t("announcements.error") || "Error"}</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Create Announcement Form */}
      <div className="content-surface">
        <div className="content-surface-header">
          <h3>{t("announcements.create")}</h3>
          <p>{t("announcements.createDescription")}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label className="civic-label">
                {t("announcements.titleLabel")}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("announcements.titlePlaceholder")}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="civic-label">
                {t("announcements.messageLabel")}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("announcements.messagePlaceholder")}
                rows={4}
                className="civic-textarea"
              />
            </div>
          </div>

          <div
            className="mt-4 flex justify-end border-t pt-4"
            style={{ borderColor: "var(--civic-border)" }}
          >
            <button type="submit" disabled={saving} className="button-primary">
              <Plus className="h-4 w-4" />
              {saving
                ? t("announcements.publishing")
                : t("announcements.publish")}
            </button>
          </div>
        </form>
      </div>

      {/* Announcements List */}
      <div className="content-surface">
        <div className="content-surface-header">
          <h3>{t("announcements.recent")}</h3>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-0 p-4">
            {[1, 2].map((item) => (
              <div key={item} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                <SkeletonBlock className="h-8 w-8 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock className="h-4 w-1/3" />
                  <SkeletonBlock className="h-3 w-full" />
                  <SkeletonBlock className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && announcements.length === 0 && (
          <div className="p-4">
            <EmptyState
              icon={<Megaphone className="h-5 w-5" />}
              title={t("announcements.noAnnouncements")}
              description={t("announcements.noAnnouncementsDescription")}
            />
          </div>
        )}

        {/* Announcements */}
        {!loading && announcements.length > 0 && (
          <div
            className="divide-y"
            style={{ borderColor: "var(--civic-border)" }}
          >
            {announcements.map((announcement) => (
              <div key={announcement.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="summary-icon summary-icon-cyan">
                    <Megaphone className="h-3.5 w-3.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        className="text-sm font-semibold"
                        style={{ color: "var(--civic-text)" }}
                      >
                        {announcement.title}
                      </h4>
                      {announcement.isActive && (
                        <span className="civic-badge civic-badge-active">
                          {t("announcements.active")}
                        </span>
                      )}
                    </div>

                    <p
                      className="mt-1 whitespace-pre-wrap text-sm leading-relaxed"
                      style={{ color: "var(--civic-muted)" }}
                    >
                      {announcement.content}
                    </p>

                    <div
                      className="mt-2 flex flex-wrap items-center gap-3 text-xs"
                      style={{ color: "var(--civic-muted)" }}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(announcement.createdAt)}
                      </span>
                      {announcement.updatedAt &&
                        announcement.updatedAt !== announcement.createdAt && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Updated {formatDate(announcement.updatedAt)}
                          </span>
                        )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(announcement.id)}
                    className="table-action table-action-danger"
                    title={t("announcements.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="content-surface">
        <div className="content-surface-header">
          <h3>{t("announcements.recent")}</h3>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-0 p-4">
            {[1, 2].map((item) => (
              <div key={item} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                <SkeletonBlock className="h-8 w-8 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock className="h-4 w-1/3" />
                  <SkeletonBlock className="h-3 w-full" />
                  <SkeletonBlock className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && announcements.length === 0 && (
          <div className="p-4">
            <EmptyState
              icon={<Megaphone className="h-5 w-5" />}
              title={t("announcements.noAnnouncements")}
              description={t("announcements.noAnnouncementsDescription")}
            />
          </div>
        )}

        {/* Announcements */}
        {!loading && announcements.length > 0 && (
          <div
            className="divide-y"
            style={{ borderColor: "var(--civic-border)" }}
          >
            {announcements.map((announcement) => (
              <div key={announcement.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="summary-icon summary-icon-cyan">
                    <Megaphone className="h-3.5 w-3.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        className="text-sm font-semibold"
                        style={{ color: "var(--civic-text)" }}
                      >
                        {announcement.title}
                      </h4>
                      {announcement.isActive && (
                        <span className="civic-badge civic-badge-active">
                          {t("announcements.active")}
                        </span>
                      )}
                    </div>

                    <p
                      className="mt-1 whitespace-pre-wrap text-sm leading-relaxed"
                      style={{ color: "var(--civic-muted)" }}
                    >
                      {announcement.content}
                    </p>

                    <div
                      className="mt-2 flex flex-wrap items-center gap-3 text-xs"
                      style={{ color: "var(--civic-muted)" }}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(announcement.createdAt)}
                      </span>
                      {announcement.updatedAt &&
                        announcement.updatedAt !== announcement.createdAt && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Updated {formatDate(announcement.updatedAt)}
                          </span>
                        )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(announcement.id)}
                    className="table-action table-action-danger"
                    title={t("announcements.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {deleteModal.isOpen && (
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, id: null })}
          onConfirm={handleConfirmDelete}
          variant="danger"
          message={t("confirmModal.deleteMessage")}
          confirmText={t("confirmModal.deleteConfirm")}
          cancelText={t("confirmModal.cancel")}
        />
      )}
    </div>
  );
}
