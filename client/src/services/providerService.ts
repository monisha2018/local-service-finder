import api from "./api";

export const providerService = {
  me: () => api.get("/providers/me").then((r) => r.data),
  list: (params?: Record<string, any>) => api.get("/providers", { params }).then((r) => r.data),
  nearby: (params: { lat: number; lng: number; radiusKm?: number; category?: string }) =>
    api.get("/providers/nearby", { params }).then((r) => r.data),
  getById: (id: string) => api.get(`/providers/${id}`).then((r) => r.data),
  getReviews: (id: string) => api.get(`/providers/${id}/reviews`).then((r) => r.data),
  getBookedSlots: (id: string, date: string) => api.get(`/providers/${id}/booked-slots`, { params: { date } }).then((r) => r.data),
    updateProfile: (data: any) => api.post("/providers/profile", data).then((r) => r.data),
  uploadVerificationDoc: (file: File, type: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    return api.post("/providers/verification-docs", formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
  },
  setAvailability: (data: any) => api.put("/providers/availability", data).then((r) => r.data),
};
