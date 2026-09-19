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
      className="announcement-board rounded-xl border border-[var(--civic-border)] bg-white"
      aria-labelledby="announcements-title"
    >
      <div className="flex items-center justify-between border-b border-[var(--civic-border)] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="rounded-lg bg-[var(--civic-cyan-50)] p-1.5 text-[var(--civic-blue-800)]">
            <Bell size={15} />
          </span>
          <div>
            <h2
              id="announcements-title"
              className="text-[var(--civic-font-size-base)] font-semibold text-[var(--civic-blue-950)]"
            >
              {t("announcements.title")}
            </h2>
            <p className="text-[12px] text-[var(--civic-muted)]">
              {t("announcements.subtitle")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => dispatch(fetchAnnouncements())}
          className="rounded-lg p-1.5 text-[var(--civic-muted)] transition hover:bg-[var(--civic-cyan-50)] hover:text-[var(--civic-blue-800)]"
          aria-label={t("announcements.refresh")}
        >
          <RefreshCw size={14} />
        </button>
      </div>
      <div className="divide-y divide-[var(--civic-border)]">
        {status === "loading" && items.length === 0 && (
          <p className="px-4 py-6 text-[12px] text-[var(--civic-muted)]">
            {t("announcements.loading")}
          </p>
        )}
        {error && (
          <p className="px-4 py-3 text-[12px] text-[var(--civic-error)]" role="alert">
            {error}
          </p>
        )}
        {status !== "loading" && !error && items.length === 0 && (
          <p className="px-4 py-6 text-[12px] text-[var(--civic-muted)]">
            {t("announcements.empty")}
          </p>
        )}
        {items.map((announcement) => (
          <article key={announcement.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[var(--civic-font-size-base)] font-medium text-[var(--civic-text)]">
                {getTitle(announcement)}
              </h3>
              <time
                className="shrink-0 text-[11px] text-[var(--civic-muted)]"
                dateTime={announcement.createdAt}
              >
                {new Date(announcement.createdAt).toLocaleDateString()}
              </time>
            </div>
            <p className="mt-1 text-[12px] leading-5 text-[var(--civic-muted)]">
              {getContent(announcement)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AnnouncementBoard;
