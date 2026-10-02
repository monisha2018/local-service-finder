import api from "./api";
export const favoriteService = {
  list: () => api.get("/favorites").then((r) => r.data),
  add: (providerId: string) => api.post(`/favorites/${providerId}`).then((r) => r.data),
  remove: (providerId: string) => api.delete(`/favorites/${providerId}`).then((r) => r.data),
};
