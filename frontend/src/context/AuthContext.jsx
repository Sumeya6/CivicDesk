import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  changeLanguage as changeLanguageAction,
  logout as logoutAction,
  setCredentials,
} from "../store/authSlice";

const AuthContext = createContext(null);

function normalizeUser(user) {
  return {
    ...user,
    preferredLanguage: user?.preferredLanguage ?? "AM",
  };
}

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authState = useSelector((state) => state.auth);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedLanguage = localStorage.getItem("civicdesk_language");

      try {
        const response = await api.get("/auth/me");
        if (!isMounted) {
          return;
        }

        const normalizedUser = normalizeUser(response.data?.user);
        dispatch(
          setCredentials({
            currentUser: normalizedUser,
            role: normalizedUser?.role ?? null,
            preferredLanguage:
              storedLanguage ?? normalizedUser?.preferredLanguage ?? "AM",
          }),
        );
      } catch {
        if (!isMounted) {
          return;
        }
        dispatch(logoutAction());
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  const login = useCallback(
    async ({ phoneNumber, password }) => {
      const response = await api.post("/auth/login", { phoneNumber, password });
      const normalizedUser = normalizeUser(response.data?.user);

      localStorage.setItem(
        "civicdesk_language",
        normalizedUser.preferredLanguage,
      );

      dispatch(
        setCredentials({
          currentUser: normalizedUser,
          role: normalizedUser?.role ?? null,
          preferredLanguage: normalizedUser.preferredLanguage,
        }),
      );

      return normalizedUser;
    },
    [dispatch],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore logout errors and clear local session for a better UX.
    } finally {
      localStorage.removeItem("civicdesk_language");
      dispatch(logoutAction());
      navigate("/login");
    }
  }, [dispatch, navigate]);

  const changeLanguage = useCallback(
    (language) => {
      localStorage.setItem("civicdesk_language", language);
      dispatch(changeLanguageAction(language));
    },
    [dispatch],
  );

  const value = useMemo(
    () => ({
      currentUser: authState.currentUser,
      role: authState.role,
      preferredLanguage: authState.preferredLanguage,
      login,
      logout,
      changeLanguage,
      isAuthenticated: authState.isAuthenticated,
    }),
    [
      authState.currentUser,
      authState.role,
      authState.preferredLanguage,
      authState.isAuthenticated,
      login,
      logout,
      changeLanguage,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

export default { useAuth };
