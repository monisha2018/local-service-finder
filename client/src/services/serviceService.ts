import api from "./api";

export const serviceService = {
  categories: () => api.get("/services/categories").then((r) => r.data),
  list: (params?: Record<string, any>) => api.get("/services", { params }).then((r) => r.data),
  create: (data: any) => api.post("/services", data).then((r) => r.data),
  update: (id: string, data: any) => api.put(`/services/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/services/${id}`).then((r) => r.data),
};
