import api from "./api";

export const paymentService = {
  createOrder: (bookingId: string) => api.post("/payments/create-order", { bookingId }).then((r) => r.data),
  verify: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    api.post("/payments/verify", data).then((r) => r.data),
};
