import { useAuth } from "../context/AuthContext";
import { useDispatch } from "react-redux";
import { logout } from "../store/authSlice";
import { useNavigate } from "react-router-dom";
import { LogOut, Bell } from "lucide-react";

export default function Navbar() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
          CD
        </div>
        <h1 className="text-lg font-bold text-gray-900">CivicDesk</h1>
        <span className="hidden rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 sm:inline-block">
          IT Help Desk
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>

        {user && (
          <>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-gray-900">{user.fullName || user.email}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-700">
              {(user.fullName || user.email || "U").charAt(0).toUpperCase()}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
