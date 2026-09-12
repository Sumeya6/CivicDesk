import api from "./axios";

const ticketApi = {
  listTickets({ status, page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("page", String(page));
    params.append("limit", String(limit));
    return api.get(`/tickets?${params.toString()}`).then((r) => r.data);
  },

  getTicket(id) {
    return api.get(`/tickets/${id}`).then((r) => r.data);
  },

  createTicket(data) {
    return api.post("/tickets", data).then((r) => r.data);
  },

  assignTicket(id, data) {
    return api.patch(`/tickets/${id}/assign`, data).then((r) => r.data);
  },

  requestPurchase(id, data) {
    return api.patch(`/tickets/${id}/request-purchase`, data).then((r) => r.data);
  },

  resolveTicket(id, data) {
    return api.put(`/tickets/${id}/resolve`, data).then((r) => r.data);
  },

  verifyTicket(id, data) {
    return api.patch(`/tickets/${id}/verify`, data).then((r) => r.data);
  },

  updateStatus(id, status) {
    return api.put(`/tickets/${id}/status`, { status }).then((r) => r.data);
  },

  listCategories() {
    return api.get("/categories").then((r) => r.data);
  },

  listTechnicians(officeId) {
    const params = officeId ? `?officeId=${officeId}` : "";
    return api.get(`/users${params}`).then((r) => r.data);
  },
};

export default ticketApi;
