import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import userReducer from "./userSlice";
import officeReducer from "./officeSlice";
import announcementReducer from "./announcementSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    offices: officeReducer,
    announcements: announcementReducer,
  },
});
