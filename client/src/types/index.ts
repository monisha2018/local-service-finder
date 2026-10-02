export type UserRole = "CUSTOMER" | "PROVIDER" | "ADMIN";
export type BookingStatus =
  | "PENDING" | "ACCEPTED" | "REJECTED" | "CONFIRMED" | "PROVIDER_ON_THE_WAY"
  | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "REFUNDED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileImage?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface Provider {
  _id: string;
  userId: { _id: string; name: string; profileImage?: string; phone?: string };
  profession: string;
  bio?: string;
  experienceYears: number;
  categories: Category[];
  serviceArea: string;
  rating: number;
  reviewCount: number;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  isAvailable: boolean;
  location?: { coordinates: [number, number] };
}

export interface Service {
  _id: string;
  providerId: string | Provider;
  categoryId: Category;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
}

export interface Booking {
  _id: string;
  bookingNumber: string;
  customerId: any;
  providerId: any;
  serviceId: any;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  amount: number;
  status: BookingStatus;
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  createdAt: string;
}

export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
