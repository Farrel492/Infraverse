import api from "./api";
export const digitalTwinService = {
  getScene:        (buildingId = 1) => api.get(`/digital-twin/scene?building_id=${buildingId}`),
  updateStatus:    (deviceId, status) => api.patch(`/digital-twin/devices/${deviceId}/status`, { status }),
};
