import api from "./api";

export const userService = {
  getAll: (params) => api.get("/users", { params }),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => {
    if (data instanceof FormData) {
      return api.post("/users", data, { headers: { "Content-Type": "multipart/form-data" } });
    }
    return api.post("/users", data);
  },
  update: (id, data) => {
    if (data instanceof FormData) {
      return api.post(`/users/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } });
    }
    return api.patch(`/users/${id}`, data);
  },
  remove: (id) => api.delete(`/users/${id}`),
  resetPassword: (id, data) => api.post(`/users/${id}/reset-password`, data),
};
