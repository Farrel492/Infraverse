import api from "./api";

export const buildingService = {
  getAll: ()                        => api.get("/buildings"),
  getOne: (id)                      => api.get(`/buildings/${id}`),
  create: (data)                    => api.post("/buildings", data),
  update: (id, data)                => api.post(`/buildings/${id}`, data),
  remove: (id)                      => api.delete(`/buildings/${id}`),

  getFloors: (buildingId)           => api.get(`/buildings/${buildingId}/floors`),
  createFloor: (buildingId, data)   => api.post(`/buildings/${buildingId}/floors`, data),
  updateFloor: (buildingId, floorId, data) =>
    api.post(`/buildings/${buildingId}/floors/${floorId}`, data),
  deleteFloor: (buildingId, floorId) =>
    api.delete(`/buildings/${buildingId}/floors/${floorId}`),

  getRooms: (floorId)               => api.get(`/floors/${floorId}/rooms`),
  createRoom: (floorId, data)       => api.post(`/floors/${floorId}/rooms`, data),
  updateRoom: (floorId, roomId, data) =>
    api.post(`/floors/${floorId}/rooms/${roomId}`, data),
  deleteRoom: (floorId, roomId)     =>
    api.delete(`/floors/${floorId}/rooms/${roomId}`),

  getRacks: (roomId)                => api.get(`/rooms/${roomId}/racks`),
  createRack: (roomId, data)        => api.post(`/rooms/${roomId}/racks`, data),
  updateRack: (roomId, rackId, data) =>
    api.post(`/rooms/${roomId}/racks/${rackId}`, data),
  deleteRack: (roomId, rackId)      =>
    api.delete(`/rooms/${roomId}/racks/${rackId}`),
};
