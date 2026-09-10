import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import ticketReducer from "./ticketSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    tickets: ticketReducer,
  },
});

export default store;
