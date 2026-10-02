import api from "./api";

export const bookingService = {
  create: (data: any) => api.post("/bookings", data).then((r) => r.data),
  list: (params?: Record<string, any>) => api.get("/bookings", { params }).then((r) => r.data),
  getById: (id: string) => api.get(`/bookings/${id}`).then((r) => r.data),
  updateStatus: (id: string, status: string) => api.patch(`/bookings/${id}/status`, { status }).then((r) => r.data),
  cancel: (id: string, reason?: string) => api.patch(`/bookings/${id}/cancel`, { reason }).then((r) => r.data),
};
