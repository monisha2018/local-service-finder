import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["CUSTOMER", "PROVIDER"]).default("CUSTOMER"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const createBookingSchema = z.object({
  providerId: z.string(),
  serviceId: z.string(),
  categoryId: z.string(),
  scheduledDate: z.string(),
  scheduledTime: z.string(),
  address: z.string().min(5),
  latitude: z.number(),
  longitude: z.number(),
  description: z.string().optional(),
});

export const createServiceSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  durationMinutes: z.number().positive().default(60),
});

export const reviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export const complaintSchema = z.object({
  bookingId: z.string(),
  subject: z.string().min(3),
  description: z.string().min(10),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  attachments: z.array(z.string()).optional(),
});
