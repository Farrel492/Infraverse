import api from "./api";
export const maintenanceService = {
  getAll:  (params) => api.get("/maintenances", { params }),
  create:  (data)   => api.post("/maintenances", data),
  update:  (id, data) => api.patch(`/maintenances/${id}`, data),
  remove:  (id)     => api.delete(`/maintenances/${id}`),
};
