import api from "./api";
export const analyticsService = {
  getSummary:    () => api.get("/analytics/summary"),
  getPredictive: () => api.get("/analytics/predictive"),
  getPower:      (params) => api.get("/analytics/power", { params }),
};
