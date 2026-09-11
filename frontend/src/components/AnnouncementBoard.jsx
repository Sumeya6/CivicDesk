import { Bell, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { fetchAnnouncements } from "../store/announcementSlice";

function AnnouncementBoard() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { preferredLanguage } = useAuth();
  const { items, status, error } = useSelector(
    (state) => state.announcements,
  );
  const isEnglish = preferredLanguage === "EN";

  useEffect(() => {
    if (status === "idle") dispatch(fetchAnnouncements());
  }, [dispatch, status]);

  const getTitle = (announcement) =>
    isEnglish
      ? announcement.titleEn ?? announcement.title
      : announcement.titleAm ?? announcement.title;
  const getContent = (announcement) =>
    isEnglish
      ? announcement.contentEn ?? announcement.content
      : announcement.contentAm ?? announcement.content;

  return (
    <section
      className="announcement-board rounded-xl border border-slate-200 bg-white"
      aria-labelledby="announcements-title"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
            <Bell size={15} />
          </span>
          <div>
            <h2
              id="announcements-title"
              className="text-sm font-semibold text-slate-900"
            >
              {t("announcements.title")}
            </h2>
            <p className="text-xs text-slate-500">
              {t("announcements.subtitle")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => dispatch(fetchAnnouncements())}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-50 hover:text-slate-600"
          aria-label="Refresh announcements"
        >
          <RefreshCw size={14} />
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {status === "loading" && items.length === 0 && (
          <p className="px-4 py-6 text-xs text-slate-500">
            {t("announcements.loading")}
          </p>
        )}
        {error && (
          <p className="px-4 py-3 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
        {status !== "loading" && !error && items.length === 0 && (
          <p className="px-4 py-6 text-xs text-slate-500">
            {t("announcements.empty")}
          </p>
        )}
        {items.map((announcement) => (
          <article key={announcement.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-medium text-slate-900">
                {getTitle(announcement)}
              </h3>
              <time
                className="shrink-0 text-[11px] text-slate-400"
                dateTime={announcement.createdAt}
              >
                {new Date(announcement.createdAt).toLocaleDateString()}
              </time>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              {getContent(announcement)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AnnouncementBoard;
