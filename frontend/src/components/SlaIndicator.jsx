import { useTranslation } from "react-i18next";
import { Clock, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { getTicketSlaInfo } from "../utils/sla";

const slaConfig = {
  "on-track": {
    icon: Clock,
    className: "civic-badge civic-badge-low",
    labelKey: "sla.onTrack",
  },
  "at-risk": {
    icon: AlertTriangle,
    className: "civic-badge civic-badge-medium",
    labelKey: "sla.atRisk",
  },
  overdue: {
    icon: AlertCircle,
    className: "civic-badge civic-badge-critical",
    labelKey: "sla.overdue",
  },
  resolved: {
    icon: CheckCircle,
    className: "civic-badge civic-badge-resolved",
    labelKey: "sla.resolved",
  },
};

export default function SlaIndicator({ ticket, showCountdown = true }) {
  const { t } = useTranslation();
  const info = getTicketSlaInfo(ticket);
  const config = slaConfig[info.status] || slaConfig["on-track"];
  const Icon = config.icon;

  return (
    <div className="flex flex-col gap-0.5">
      <span className={config.className} role="status" aria-label={t(config.labelKey)}>
        <Icon size={12} aria-hidden="true" />
        {t(config.labelKey)}
      </span>
      {showCountdown && info.countdown && (
        <span className="text-xs text-[var(--civic-muted)]">{info.countdown}</span>
      )}
    </div>
  );
}
