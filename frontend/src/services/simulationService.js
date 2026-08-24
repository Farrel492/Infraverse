import api from "./api";
export const simulationService = {
  getAll:   ()     => api.get("/simulations"),
  getLogs:  ()     => api.get("/simulations/logs"),
  getOne:   (id)   => api.get(`/simulations/${id}`),
  run:      (id)   => api.post(`/simulations/${id}/run`),
  resolve:  (logId)=> api.post(`/simulation-logs/${logId}/resolve`),
};
