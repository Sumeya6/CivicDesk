import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api/axios";

const initialState = {
  items: [],
  meta: null,
  status: "idle",
  error: null,
};

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/users", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Unable to load users.",
      );
    }
  },
);

export const createUser = createAsyncThunk(
  "users/createUser",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post("/users", payload);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Unable to create user.",
      );
    }
  },
);

export const createTechnician = createAsyncThunk(
  "users/createTechnician",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post("/users/technicians", payload);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Unable to create technician.",
      );
    }
  },
);

export const updateUserStatus = createAsyncThunk(
  "users/updateUserStatus",
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/users/${id}/status`, { isActive });
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Unable to update user status.",
      );
    }
  },
);

export const updateUser = createAsyncThunk(
  "users/updateUser",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/users/${id}`, payload);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Unable to update user.",
      );
    }
  },
);

export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Unable to delete user.",
      );
    }
  },
);

export const assignTechnicianOffices = createAsyncThunk(
  "users/assignTechnicianOffices",
  async ({ id, officeIds }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/users/technicians/${id}/offices`, {
        officeIds,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Unable to update technician assignments.",
      );
    }
  },
);

export const fetchTechnicianOffices = createAsyncThunk(
  "users/fetchTechnicianOffices",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/${id}/offices`);
      return { id, officeIds: response.data.officeIds ?? [] };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Unable to load technician assignments.",
      );
    }
  },
);

export const fetchMyTechnicianOffices = createAsyncThunk(
  "users/fetchMyTechnicianOffices",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/users/me/offices");
      return response.data.officeIds ?? [];
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Unable to load assigned offices.",
      );
    }
  },
);

const replaceItem = (items, updated) =>
  items.map((item) => (item.id === updated.id ? updated : item));

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.users ?? [];
        state.meta = action.payload.meta ?? null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        if (state.meta) state.meta.total += 1;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(createTechnician.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        if (state.meta) state.meta.total += 1;
      })
      .addCase(createTechnician.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        state.items = replaceItem(state.items, action.payload);
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.items = replaceItem(state.items, action.payload);
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (item) => item.id !== action.payload.id,
        );
        if (state.meta) state.meta.total = Math.max(0, state.meta.total - 1);
      })
      .addMatcher(
        (action) =>
          action.type.startsWith("users/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.error = action.payload;
        },
      );
  },
});

export const { clearUserError } = userSlice.actions;
export default userSlice.reducer;
