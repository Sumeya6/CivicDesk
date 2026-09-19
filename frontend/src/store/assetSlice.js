import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import assetApi from "../api/assetApi";

export const fetchAssets = createAsyncThunk(
  "assets/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      return await assetApi.listAssets(params);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchAsset = createAsyncThunk(
  "assets/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      return await assetApi.getAsset(id);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const createAsset = createAsyncThunk(
  "assets/create",
  async (data, { rejectWithValue }) => {
    try {
      return await assetApi.createAsset(data);
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

export const updateAsset = createAsyncThunk(
  "assets/update",
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      return await assetApi.updateAsset(id, data);
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

export const archiveAsset = createAsyncThunk(
  "assets/archive",
  async (id, { rejectWithValue }) => {
    try {
      return await assetApi.archiveAsset(id);
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

export const fetchMyAssets = createAsyncThunk(
  "assets/fetchMy",
  async (_, { rejectWithValue }) => {
    try {
      return await assetApi.listMyAssets();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchTechnicianAssets = createAsyncThunk(
  "assets/fetchTechnician",
  async (_, { rejectWithValue }) => {
    try {
      return await assetApi.listTechnicianAssets();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

const assetSlice = createSlice({
  name: "assets",
  initialState: {
    items: [],
    currentAsset: null,
    myAssets: [],
    meta: null,
    status: "idle",
    error: null,
  },
  reducers: {
    clearAssetError(state) {
      state.error = null;
    },
    clearCurrentAsset(state) {
      state.currentAsset = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssets.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAssets.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.items = payload.data ?? [];
        state.meta = payload.meta ?? null;
      })
      .addCase(fetchAssets.rejected, (state, { payload }) => {
        state.status = "failed";
        state.error = payload;
      })
      .addCase(fetchAsset.fulfilled, (state, { payload }) => {
        state.currentAsset = payload.data;
      })
      .addCase(createAsset.fulfilled, (state, { payload }) => {
        if (payload.data) state.items.unshift(payload.data);
        if (state.meta) state.meta.total = (state.meta.total || 0) + 1;
      })
      .addCase(updateAsset.fulfilled, (state, { payload }) => {
        if (payload.data) {
          state.items = state.items.map((item) =>
            item.id === payload.data.id ? payload.data : item,
          );
          if (state.currentAsset?.id === payload.data.id) {
            state.currentAsset = payload.data;
          }
        }
      })
      .addCase(archiveAsset.fulfilled, (state, { payload }) => {
        if (payload.data) {
          state.items = state.items.map((item) =>
            item.id === payload.data.id ? payload.data : item,
          );
          if (state.currentAsset?.id === payload.data.id) {
            state.currentAsset = payload.data;
          }
        }
      })
      .addCase(fetchMyAssets.fulfilled, (state, { payload }) => {
        state.myAssets = payload.data ?? [];
      })
      .addCase(fetchTechnicianAssets.fulfilled, (state, { payload }) => {
        state.myAssets = payload.data ?? [];
      })
      .addMatcher(
        (action) => action.type.startsWith("assets/") && action.type.endsWith("/rejected"),
        (state, { payload }) => {
          state.error = payload;
        },
      );
  },
});

export const { clearAssetError, clearCurrentAsset } = assetSlice.actions;
export default assetSlice.reducer;
