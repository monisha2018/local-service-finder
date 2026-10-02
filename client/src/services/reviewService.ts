import api from "./api";
export const reviewService = {
  create: (data: { bookingId: string; rating: number; comment?: string }) => api.post("/reviews", data).then((r) => r.data),
};
