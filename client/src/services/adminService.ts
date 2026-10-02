import api from "./api";
export const adminService = {
  dashboard: () => api.get("/admin/dashboard").then((r) => r.data),
  users: (params?: Record<string, any>) => api.get("/admin/users", { params }).then((r) => r.data),
  suspendUser: (id: string) => api.patch(`/admin/users/${id}/suspend`).then((r) => r.data),
  reactivateUser: (id: string) => api.patch(`/admin/users/${id}/reactivate`).then((r) => r.data),
  providers: (params?: Record<string, any>) => api.get("/admin/providers", { params }).then((r) => r.data),
  verifyProvider: (id: string, status: "VERIFIED" | "REJECTED") => api.patch(`/admin/providers/${id}/verify`, { status }).then((r) => r.data),
  bookings: () => api.get("/admin/bookings").then((r) => r.data),
  payments: () => api.get("/admin/payments").then((r) => r.data),
    complaints: () => api.get("/admin/complaints").then((r) => r.data),
  updateComplaint: (id: string, data: { status: string; adminResponse?: string }) =>
    api.patch(`/admin/complaints/${id}`, data).then((r) => r.data),
};

