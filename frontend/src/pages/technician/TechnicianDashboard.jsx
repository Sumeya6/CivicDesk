import { ClipboardList, MapPin, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import AnnouncementBoard from "../../components/AnnouncementBoard";
import { fetchOfficeOptions } from "../../store/officeSlice";
import { fetchMyTechnicianOffices } from "../../store/userSlice";

function TechnicianDashboard() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { currentUser } = useAuth();
  const offices = useSelector((state) => state.offices.items);
  const [assignedOfficeIds, setAssignedOfficeIds] = useState([]);
  const assignedOffices = offices.filter((office) =>
    assignedOfficeIds.includes(office.id),
  );

  useEffect(() => {
    if (offices.length === 0) dispatch(fetchOfficeOptions());
  }, [dispatch, offices.length]);

  useEffect(() => {
    dispatch(fetchMyTechnicianOffices())
      .unwrap()
      .then(setAssignedOfficeIds)
      .catch(() =>
        setAssignedOfficeIds(
          currentUser?.officeId ? [currentUser.officeId] : [],
        ),
      );
  }, [dispatch, currentUser?.officeId]);

  return (
    <section
      className="dashboard-page"
      aria-labelledby="technician-dashboard-title"
    >
      <header className="dashboard-welcome">
        <div>
          <p className="dashboard-eyebrow">{t("dashboard.technicianLabel")}</p>
          <h1 id="technician-dashboard-title">
            {t("dashboard.welcome")}, {currentUser?.fullName ?? "User"}
          </h1>
          <p>{t("dashboard.technicianDescription")}</p>
        </div>
        <div className="dashboard-context-chip">
          <Wrench size={16} />
          {t("dashboard.serviceDesk")}
        </div>
      </header>
      <div className="dashboard-stat-grid">
        <div className="dashboard-stat">
          <span className="dashboard-stat-icon">
            <ClipboardList size={18} />
          </span>
          <div>
            <span>{t("dashboard.assignedRequests")}</span>
            <strong>0</strong>
          </div>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-icon dashboard-stat-icon-cyan">
            <Wrench size={18} />
          </span>
          <div>
            <span>{t("dashboard.inProgress")}</span>
            <strong>0</strong>
          </div>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-icon dashboard-stat-icon-green">
            <MapPin size={18} />
          </span>
          <div>
            <span>{t("dashboard.assignedOffices")}</span>
            <strong>{assignedOffices.length}</strong>
          </div>
        </div>
      </div>
      <div className="dashboard-grid dashboard-grid-two">
        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <h2>{t("dashboard.assignedOffices")}</h2>
            <MapPin size={18} />
          </div>
          <div className="dashboard-list-empty">
            {assignedOffices.length > 0 ? (
              assignedOffices.map((office) => (
                <p key={office.id}>
                  {office.nameEn}
                  <span>{office.nameAm}</span>
                </p>
              ))
            ) : (
              <p>{t("dashboard.noAssignedOffices")}</p>
            )}
          </div>
        </section>
        <AnnouncementBoard />
      </div>
      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <h2>{t("dashboard.recentRequests")}</h2>
          <ClipboardList size={18} />
        </div>
        <div className="dashboard-empty">
          <p>{t("dashboard.requestsUnavailable")}</p>
        </div>
      </section>
    </section>
  );
}

export default TechnicianDashboard;
