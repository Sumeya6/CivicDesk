import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const API_URL = "http://localhost:5000/api/announcements";

// Temporary author ID because CivicDesk does not have login yet
const AUTHOR_ID = "98a0835f-5beb-43d7-b07f-31a2ee40c39e";

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

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to load announcements");
      }

      const data = await response.json();
      setAnnouncements(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError("Please enter both a title and content.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          authorId: AUTHOR_ID,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create announcement");
      }

      setTitle("");
      setContent("");

      await fetchAnnouncements();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this announcement?",
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete announcement");
      }

      await fetchAnnouncements();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString();
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-md md:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 border-b pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
              📢
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {t("announcements.title")}
              </h2>

              <p className="text-sm text-gray-500">
                {t("announcements.description")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
          ● Announcement Board
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span className="text-lg">⚠️</span>

          <div>
            <p className="font-semibold">Something went wrong</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Create announcement */}
      <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 md:p-6">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-gray-800">
            {t("announcements.create")}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {t("announcements.createDescription")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              {t("announcements.titleLabel")}
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter announcement title"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Content */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              {t("announcements.messageLabel")}
            </label>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement here..."
              rows={5}
              className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Publishing..." : "📢 Publish Announcement"}
            </button>
          </div>
        </form>
      </div>

      {/* Announcement list */}
      <div>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Recent Announcements
            </h3>

            <p className="text-sm text-gray-500">
              {announcements.length} announcement
              {announcements.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-gray-200 p-6"
              >
                <div className="mb-4 h-5 w-1/3 rounded bg-gray-200" />
                <div className="mb-2 h-4 w-full rounded bg-gray-200" />
                <div className="h-4 w-2/3 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && announcements.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-10 text-center">
            <div className="mb-3 text-4xl">📭</div>

            <h4 className="font-semibold text-gray-700">
              No announcements yet
            </h4>

            <p className="mt-1 text-sm text-gray-500">
              Create the first announcement using the form above.
            </p>
          </div>
        )}

        {/* Announcements */}
        {!loading && announcements.length > 0 && (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md md:p-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xl">
                      📢
                    </div>

                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-bold text-gray-800">
                          {announcement.title}
                        </h4>

                        {announcement.isActive && (
                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                            Active
                          </span>
                        )}
                      </div>

                      <p className="whitespace-pre-wrap leading-7 text-gray-600">
                        {announcement.content}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <span>📅 {formatDate(announcement.createdAt)}</span>

                        {announcement.updatedAt &&
                          announcement.updatedAt !== announcement.createdAt && (
                            <span>
                              • Updated {formatDate(announcement.updatedAt)}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(announcement.id)}
                    className="self-start rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
