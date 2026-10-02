import api from "./api";

export const authService = {
  register: (data: { name: string; email: string; phone: string; password: string; role: "CUSTOMER" | "PROVIDER" }) =>
    api.post("/auth/register", data).then((r) => r.data),
  login: (data: { email: string; password: string }) => api.post("/auth/login", data).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
};
