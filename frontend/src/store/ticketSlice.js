import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import ticketApi from "../api/ticketApi";

export const fetchTickets = createAsyncThunk(
  "tickets/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      return await ticketApi.listTickets(params);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchTicket = createAsyncThunk(
  "tickets/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      return await ticketApi.getTicket(id);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const createTicket = createAsyncThunk(
  "tickets/create",
  async (data, { rejectWithValue }) => {
    try {
      return await ticketApi.createTicket(data);
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

export const assignTicket = createAsyncThunk(
  "tickets/assign",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await ticketApi.assignTicket(id, data);
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

export const requestPurchase = createAsyncThunk(
  "tickets/requestPurchase",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await ticketApi.requestPurchase(id, data);
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

export const resolveTicket = createAsyncThunk(
  "tickets/resolve",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await ticketApi.resolveTicket(id, data);
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

export const verifyTicket = createAsyncThunk(
  "tickets/verify",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await ticketApi.verifyTicket(id, data);
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

export const updateTicketStatus = createAsyncThunk(
  "tickets/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      return await ticketApi.updateStatus(id, status);
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

export const fetchCategories = createAsyncThunk(
  "tickets/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      return await ticketApi.listCategories();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchTechnicians = createAsyncThunk(
  "tickets/fetchTechnicians",
  async (officeId, { rejectWithValue }) => {
    try {
      return await ticketApi.listTechnicians(officeId);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

const ticketSlice = createSlice({
  name: "tickets",
  initialState: {
    tickets: [],
    currentTicket: null,
    categories: [],
    technicians: [],
    totalTickets: 0,
    page: 1,
    totalPages: 1,
    loading: false,
    error: null,
  },
  reducers: {
    clearTicketError(state) {
      state.error = null;
    },
    clearCurrentTicket(state) {
      state.currentTicket = null;
    },
    updateTicketInList(state, { payload }) {
      const idx = state.tickets.findIndex((t) => t.id === payload.id);
      if (idx !== -1) state.tickets[idx] = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.tickets = payload.tickets || [];
        state.totalTickets = payload.totalTickets || 0;
        state.page = payload.page || 1;
        state.totalPages = payload.totalPages || 1;
      })
      .addCase(fetchTickets.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      .addCase(fetchTicket.fulfilled, (state, { payload }) => {
        state.currentTicket = payload.ticket;
      })
      .addCase(fetchCategories.fulfilled, (state, { payload }) => {
        state.categories = payload.categories || payload || [];
      })
      .addCase(fetchTechnicians.fulfilled, (state, { payload }) => {
        state.technicians = payload.users || payload || [];
      })
      .addCase(createTicket.fulfilled, (state, { payload }) => {
        if (payload.ticket) state.tickets.unshift(payload.ticket);
      })
      .addCase(assignTicket.fulfilled, (state, { payload }) => {
        if (payload.ticket) {
          const idx = state.tickets.findIndex((t) => t.id === payload.ticket.id);
          if (idx !== -1) state.tickets[idx] = payload.ticket;
          if (state.currentTicket?.id === payload.ticket.id) {
            state.currentTicket = payload.ticket;
          }
        }
      })
      .addCase(requestPurchase.fulfilled, (state, { payload }) => {
        if (payload.ticket) {
          const idx = state.tickets.findIndex((t) => t.id === payload.ticket.id);
          if (idx !== -1) state.tickets[idx] = payload.ticket;
          if (state.currentTicket?.id === payload.ticket.id) {
            state.currentTicket = payload.ticket;
          }
        }
      })
      .addCase(resolveTicket.fulfilled, (state, { payload }) => {
        if (payload.ticket) {
          const idx = state.tickets.findIndex((t) => t.id === payload.ticket.id);
          if (idx !== -1) state.tickets[idx] = payload.ticket;
          if (state.currentTicket?.id === payload.ticket.id) {
            state.currentTicket = payload.ticket;
          }
        }
      })
      .addCase(verifyTicket.fulfilled, (state, { payload }) => {
        if (payload.ticket) {
          const idx = state.tickets.findIndex((t) => t.id === payload.ticket.id);
          if (idx !== -1) state.tickets[idx] = payload.ticket;
          if (state.currentTicket?.id === payload.ticket.id) {
            state.currentTicket = payload.ticket;
          }
        }
      })
      .addCase(updateTicketStatus.fulfilled, (state, { payload }) => {
        if (payload.ticket) {
          const idx = state.tickets.findIndex((t) => t.id === payload.ticket.id);
          if (idx !== -1) state.tickets[idx] = payload.ticket;
          if (state.currentTicket?.id === payload.ticket.id) {
            state.currentTicket = payload.ticket;
          }
        }
      });
  },
});

export const { clearTicketError, clearCurrentTicket, updateTicketInList } =
  ticketSlice.actions;
export default ticketSlice.reducer;
