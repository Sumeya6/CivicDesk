import api from "./axios";

const assetApi = {
  listAssets({ page = 1, pageSize = 20, search, status, officeId, employeeId, assetType } = {}) {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("pageSize", String(pageSize));
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (officeId) params.append("officeId", officeId);
    if (employeeId) params.append("employeeId", employeeId);
    if (assetType) params.append("assetType", assetType);
    return api.get(`/assets?${params.toString()}`).then((r) => r.data);
  },

  getAsset(id) {
    return api.get(`/assets/${id}`).then((r) => r.data);
  },

  createAsset(data) {
    return api.post("/assets", data).then((r) => r.data);
  },

  updateAsset(id, data) {
    return api.put(`/assets/${id}`, data).then((r) => r.data);
  },

  archiveAsset(id) {
    return api.patch(`/assets/${id}/archive`).then((r) => r.data);
  },

  listMyAssets() {
    return api.get("/assets/my").then((r) => r.data);
  },

  listTechnicianAssets() {
    return api.get("/assets/technician").then((r) => r.data);
  },
};

export default assetApi;
