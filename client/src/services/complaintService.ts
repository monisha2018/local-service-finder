import api from "./api";

export const complaintService = {
  // Create a new complaint
  createComplaint: (data: {
    bookingId: string;
    subject: string;
    description: string;
    priority?: "LOW" | "MEDIUM" | "HIGH";
  }) => {
    return api.post("/complaints", data).then((res) => res.data);
  },

  // Get logged-in customer's complaints
  getMyComplaints: () => {
    return api.get("/complaints/my").then((res) => res.data);
  },

  // Get a single complaint
  getComplaintById: (id: string) => {
    return api.get(`/complaints/${id}`).then((res) => res.data);
  },
};