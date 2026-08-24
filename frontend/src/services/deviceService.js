import api from "./api";

export const deviceService = {
  getAll:    (params)  => api.get("/devices", { params }),
  getOne:    (id)      => api.get(`/devices/${id}`),
  getByRack: (rackId)  => api.get(`/racks/${rackId}/devices`),
  create:    (data)    => api.post("/devices", data, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  update:    (id, data) => api.post(`/devices/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  remove:    (id)      => api.delete(`/devices/${id}`),
};
