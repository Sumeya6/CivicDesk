import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentUser: null,
  role: null,
  preferredLanguage: "AM",
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { currentUser, role, preferredLanguage } = action.payload;
      state.currentUser = currentUser;
      state.role = role;
      state.preferredLanguage =
        preferredLanguage ?? currentUser?.preferredLanguage ?? "AM";
      state.isAuthenticated = Boolean(currentUser);
    },
    logout: (state) => {
      state.currentUser = null;
      state.role = null;
      state.preferredLanguage = "AM";
      state.isAuthenticated = false;
    },
    changeLanguage: (state, action) => {
      state.preferredLanguage = action.payload;
      if (state.currentUser) {
        state.currentUser.preferredLanguage = action.payload;
      }
    },
  },
});

export const { setCredentials, logout, changeLanguage } = authSlice.actions;
export default authSlice.reducer;
