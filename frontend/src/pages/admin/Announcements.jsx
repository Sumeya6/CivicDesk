import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../api/axios";
import SkeletonBlock from "../../components/SkeletonBlock";
import EmptyState from "../../components/EmptyState";
import {
  Megaphone,
  Plus,
  Trash2,
  Clock,
  AlertCircle,
  Bell,
} from "lucide-react";

const inputClasses =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      setError(t("announcements.validationError") || "Please enter both a title and content.");
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

  const handleDelete = async (id) => {
    const confirmed = window.confirm(t("announcements.confirmDelete"));
    if (!confirmed) return;

    try {
      setError("");
      await api.delete(`/announcements/${id}`);
      await fetchAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
            <Megaphone className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-gray-900">
              {t("announcements.title")}
            </h2>
            <p className="text-sm text-gray-500">
              {t("announcements.description")}
            </p>
          </div>
        </div>
        {!loading && announcements.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
            <Bell className="h-3 w-3" />
            {announcements.length} {announcements.length === 1 ? "announcement" : "announcements"}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">{t("announcements.error") || "Error"}</p>
            <p className="mt-0.5 text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Create Announcement Form */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-800">
            {t("announcements.create")}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {t("announcements.createDescription")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">
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
              <label className="mb-1 block text-sm font-medium text-gray-600">
                {t("announcements.messageLabel")}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("announcements.messagePlaceholder")}
                rows={4}
                className={`${inputClasses} resize-none`}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {saving ? t("announcements.publishing") : t("announcements.publish")}
            </button>
          </div>
        </form>
      </div>

      {/* Announcements List */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-800">
            {t("announcements.recent")}
          </h3>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-0 p-5">
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
          <div className="p-5">
            <EmptyState
              icon={<Megaphone className="h-5 w-5" />}
              title={t("announcements.noAnnouncements")}
              description={t("announcements.noAnnouncementsDescription")}
            />
          </div>
        )}

        {/* Announcements */}
        {!loading && announcements.length > 0 && (
          <div className="divide-y divide-gray-100">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                    <Megaphone className="h-3.5 w-3.5 text-blue-600" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-800">
                        {announcement.title}
                      </h4>
                      {announcement.isActive && (
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          {t("announcements.active")}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                      {announcement.content}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
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
                    className="shrink-0 rounded-md border border-gray-200 p-1.5 text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
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
    </div>
  );
}
