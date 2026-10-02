import { Booking } from "../models/Booking";

export async function generateBookingNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await Booking.countDocuments({
    createdAt: { $gte: new Date(`${year}-01-01`) },
  });
  const seq = String(count + 1).padStart(6, "0");
  return `LSF-${year}-${seq}`;
}
