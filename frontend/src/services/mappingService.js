import api from "./api";
export const mappingService = {
  getTopology: () => api.get("/mapping/topology"),
  addConnection: (data) => api.post("/mapping/connections", data),
  deleteConnection: (id) => api.delete(`/mapping/connections/${id}`),
};
