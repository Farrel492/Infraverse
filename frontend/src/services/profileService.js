import api from "./api";
export const profileService = {
  update:         (data) => api.patch("/profile", data),
  changePassword: (data) => api.patch("/profile/password", data),
};
