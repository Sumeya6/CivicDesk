import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api/axios";

const initialState = { items: [], status: "idle", error: null };

export const fetchAnnouncements = createAsyncThunk(
  "announcements/fetchAnnouncements",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/announcements");
      return response.data.announcements ?? [];
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Unable to load announcements.",
      );
    }
  },
);

const announcementSlice = createSlice({
  name: "announcements",
  initialState,
  reducers: {
    clearAnnouncementError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnnouncements.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearAnnouncementError } = announcementSlice.actions;
export default announcementSlice.reducer;
