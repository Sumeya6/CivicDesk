import {
  Edit3,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import TechnicianAssignmentModal from "../../components/TechnicianAssignmentModal";
import UserModal from "../../components/UserModal";
import { fetchOffices } from "../../store/officeSlice";
import {
  deleteUser,
  fetchUsers,
  updateUserStatus,
} from "../../store/userSlice";

const roles = ["ALL", "EMPLOYEE", "TECHNICIAN", "ADMIN"];

function UserManagement() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { items: users, status, error } = useSelector((state) => state.users);
  const offices = useSelector((state) => state.offices.items);
  const [role, setRole] = useState("ALL");
  const [showUserModal, setShowUserModal] = useState(false);
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [technician, setTechnician] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const currentUserId = useSelector((state) => state.auth.currentUser?.id);
  const activeUsers = users.filter((user) => user.isActive).length;
  const technicianCount = users.filter(
    (user) => user.role === "TECHNICIAN",
  ).length;
  const officeName = (officeId) =>
    offices.find((office) => office.id === officeId)?.nameEn ?? "Unassigned";

  useEffect(() => {
    dispatch(fetchOffices());
  }, [dispatch]);
  useEffect(() => {
    dispatch(fetchUsers(role === "ALL" ? {} : { role }));
  }, [dispatch, role]);

  const toggleStatus = async (user) => {
    setUpdatingId(user.id);
    try {
      await dispatch(
        updateUserStatus({ id: user.id, isActive: !user.isActive }),
      ).unwrap();
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    setDeletingId(userToDelete.id);
    setDeleteError("");
    try {
      await dispatch(deleteUser(userToDelete.id)).unwrap();
      setUserToDelete(null);
    } catch (requestError) {
      setDeleteError(requestError);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section
      className="admin-surface workspace-page"
      aria-labelledby="users-title"
    >
      <header className="workspace-header">
        <div>
          <p className="workspace-eyebrow">
            <Users size={14} /> {t("admin.administration")}
          </p>
          <h1 id="users-title">{t("admin.userManagement")}</h1>
          <p className="workspace-description">{t("admin.userDescription")}</p>
        </div>
        <div className="workspace-actions">
          <button
            type="button"
            onClick={() => setShowUserModal(true)}
            className="button-primary"
          >
            <Plus size={14} />
            {t("admin.addUser")}
          </button>
          <button
            type="button"
            onClick={() => setShowTechnicianModal(true)}
            className="button-secondary"
          >
            <Plus size={14} />
            {t("admin.addTechnician")}
          </button>
        </div>
      </header>

      <div className="summary-strip" aria-label="User summary">
        <div className="summary-item">
          <span className="summary-icon">
            <Users size={16} />
          </span>
          <div>
            <span className="summary-label">{t("admin.totalUsers")}</span>
            <strong>{users.length}</strong>
          </div>
        </div>
        <div className="summary-item">
          <span className="summary-icon summary-icon-success">
            <ShieldCheck size={16} />
          </span>
          <div>
            <span className="summary-label">{t("admin.activeAccounts")}</span>
            <strong>{activeUsers}</strong>
          </div>
        </div>
        <div className="summary-item">
          <span className="summary-icon summary-icon-cyan">
            <Wrench size={16} />
          </span>
          <div>
            <span className="summary-label">{t("admin.technicians")}</span>
            <strong>{technicianCount}</strong>
          </div>
        </div>
      </div>

      <div className="directory-toolbar">
        <div>
          <h2>{t("admin.peopleDirectory")}</h2>
          <p>{t("admin.peopleDirectoryDesc")}</p>
        </div>
        <div
          className="role-filters"
          role="group"
          aria-label="Filter users by role"
        >
          {roles.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRole(item)}
              aria-pressed={role === item}
            >
              {item === "ALL" ? t("admin.allUsers") : item}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <div className="workspace-alert" role="alert">
          {error}
        </div>
      )}

      <div className="content-surface">
        <div className="content-surface-header">
          <div>
            <h2>{t("admin.userDirectory")}</h2>
            <p>{t("admin.userDirectoryDesc")}</p>
          </div>
          <span className="record-count">
            {t("admin.records", { count: users.length })}
          </span>
        </div>
        <div className="table-scroll">
          <table className="workspace-table">
            <caption className="sr-only">{t("admin.userDirectory")}</caption>
            <thead>
              <tr>
                <th>{t("admin.user")}</th>
                <th>{t("admin.role")}</th>
                <th>{t("admin.office")}</th>
                <th>{t("admin.status")}</th>
                <th className="actions-column">{t("admin.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {status === "loading" && users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="table-state">
                    {t("admin.loadingUsers")}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} data-testid="user-row">
                    <td>
                      <div className="entity-cell">
                        <span className="entity-icon">
                          <UserRound size={14} />
                        </span>
                        <div>
                          <p className="entity-name">{user.fullName}</p>
                          <p className="entity-secondary">{user.phoneNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="role-label">{user.role}</span>
                    </td>
                    <td className="office-cell">{officeName(user.officeId)}</td>
                    <td>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={user.isActive}
                        aria-label={`Set ${user.fullName} ${user.isActive ? t("admin.inactive") : t("admin.active")}`}
                        disabled={updatingId === user.id}
                        onClick={() => toggleStatus(user)}
                        className={`status-badge ${user.isActive ? "status-active" : "status-inactive"}`}
                      >
                        <span />
                        {user.isActive
                          ? t("admin.active")
                          : t("admin.inactive")}
                      </button>
                    </td>
                    <td className="actions-column">
                      <div className="table-actions">
                        <button
                          type="button"
                          onClick={() => setEditingUser(user)}
                          className="table-action"
                        >
                          <Edit3 size={13} />
                          {t("admin.edit")}
                        </button>
                        {user.role === "TECHNICIAN" && (
                          <button
                            type="button"
                            onClick={() => setTechnician(user)}
                            className="table-action"
                          >
                            <Wrench size={13} />
                            {t("admin.officeAssignment")}
                          </button>
                        )}
                        {user.id !== currentUserId && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError("");
                              setUserToDelete(user);
                            }}
                            className="table-action table-action-danger"
                          >
                            <Trash2 size={13} />
                            {t("admin.delete")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {status !== "loading" && users.length === 0 && (
                <tr>
                  <td colSpan="5" className="table-state">
                    {t("admin.noUsers")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showUserModal && (
        <UserModal offices={offices} onClose={() => setShowUserModal(false)} />
      )}
      {showTechnicianModal && (
        <UserModal
          offices={offices}
          technicianMode
          onClose={() => setShowTechnicianModal(false)}
        />
      )}
      {editingUser && (
        <UserModal
          user={editingUser}
          offices={offices}
          onClose={() => setEditingUser(null)}
        />
      )}
      {technician && (
        <TechnicianAssignmentModal
          technician={technician}
          offices={offices}
          onClose={() => setTechnician(null)}
        />
      )}
      {userToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-[rgb(11_47_107_/_38%)] p-4 max-[640px]:items-start max-[640px]:p-3"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget &&
            deletingId === null &&
            setUserToDelete(null)
          }
        >
          <div
            className="w-[min(100%,28rem)] max-h-[calc(100vh-32px)] min-w-0 overflow-x-hidden overflow-y-auto rounded-xl border border-[var(--civic-border)] bg-white shadow-[0_18px_45px_rgb(11_47_107_/_18%)] max-[640px]:max-h-[calc(100vh-24px)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
          >
            <div className="border-b border-slate-200 px-5 py-4">
              <h2
                id="delete-user-title"
                className="text-base font-semibold text-slate-900"
              >
                {t("admin.deleteUser")}
              </h2>
            </div>
            <div className="grid gap-4 p-5">
              <p className="text-sm text-slate-600">
                {t("admin.confirmDeleteUser")}
              </p>
              {deleteError && (
                <p className="text-xs text-red-600" role="alert">
                  {deleteError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  disabled={deletingId !== null}
                  className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {t("admin.cancel")}
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deletingId !== null}
                  className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {deletingId !== null
                    ? t("admin.deleting")
                    : t("admin.delete")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default UserManagement;
