import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api/axios";

const initialState = { items: [], meta: null, status: "idle", error: null };

export const fetchOffices = createAsyncThunk(
  "offices/fetchOffices",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/offices", {
        params: { pageSize: 100, ...params },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Unable to load offices.",
      );
    }
  },
);

export const fetchOfficeOptions = createAsyncThunk(
  "offices/fetchOfficeOptions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/offices/options");
      return response.data.offices ?? [];
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Unable to load office options.",
      );
    }
  },
);

export const createOffice = createAsyncThunk(
  "offices/createOffice",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post("/offices", payload);
      return response.data.office;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Unable to create office.",
      );
    }
  },
);

export const updateOffice = createAsyncThunk(
  "offices/updateOffice",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/offices/${id}`, payload);
      return response.data.office;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Unable to update office.",
      );
    }
  },
);

export const updateOfficeStatus = createAsyncThunk(
  "offices/updateOfficeStatus",
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/offices/${id}/status`, { isActive });
      return response.data.office;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Unable to update office status.",
      );
    }
  },
);

export const deleteOffice = createAsyncThunk(
  "offices/deleteOffice",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/offices/${id}`);
      return response.data.office;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Unable to delete office.",
      );
    }
  },
);

const officeSlice = createSlice({
  name: "offices",
  initialState,
  reducers: {
    clearOfficeError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOffices.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchOffices.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.offices ?? [];
        state.meta = action.payload.meta ?? null;
      })
      .addCase(fetchOffices.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchOfficeOptions.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(createOffice.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        if (state.meta) state.meta.total += 1;
      })
      .addCase(updateOffice.fulfilled, (state, action) => {
        state.items = state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item,
        );
      })
      .addCase(updateOfficeStatus.fulfilled, (state, action) => {
        state.items = state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item,
        );
      })
      .addCase(deleteOffice.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (item) => item.id !== action.payload.id,
        );
        if (state.meta) state.meta.total = Math.max(0, state.meta.total - 1);
      })
      .addMatcher(
        (action) =>
          action.type.startsWith("offices/") &&
          action.type.endsWith("/rejected"),
        (state, action) => {
          state.error = action.payload;
        },
      );
  },
});

export const { clearOfficeError } = officeSlice.actions;
export default officeSlice.reducer;
