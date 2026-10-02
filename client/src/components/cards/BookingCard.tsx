import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Booking } from "../../types";
import StatusBadge from "../ui/Badge";

export default function BookingCard({ booking, viewerRole }: { booking: Booking; viewerRole: "CUSTOMER" | "PROVIDER" | "ADMIN" }) {
  const counterpart = viewerRole === "CUSTOMER" ? booking.providerId?.userId?.name : booking.customerId?.name;
  return (
    <Link to={`/bookings/${booking._id}`} className="card flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-text-secondary">{booking.bookingNumber}</span>
        <StatusBadge status={booking.status} />
      </div>
      <div>
        <p className="font-semibold text-text-primary">{booking.serviceId?.name}</p>
        <p className="text-sm text-text-secondary">with {counterpart}</p>
      </div>
      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(booking.scheduledDate).toLocaleDateString()}</span>
        <span className="flex items-center gap-1"><Clock size={12} /> {booking.scheduledTime}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-text-secondary truncate">
        <MapPin size={12} className="shrink-0" /> {booking.address}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-xs text-text-secondary">Amount</span>
        <span className="font-bold text-primary">₹{booking.amount}</span>
      </div>
    </Link>
  );
}
