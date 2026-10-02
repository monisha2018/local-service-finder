import { useEffect, useState } from "react";
import { bookingService } from "../../services/bookingService";
import { Booking } from "../../types";
import BookingCard from "../../components/cards/BookingCard";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";

const TABS = ["All", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

export default function BookingsList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState("All");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    load();
  }, [tab]);

  async function load() {
    setStatus("loading");
    try {
      const res = await bookingService.list(tab === "All" ? {} : { status: tab });
      setBookings(res.data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-10">
      <h1 className="text-2xl font-bold text-text-primary mb-6">My Bookings</h1>

      <div className="flex gap-2 mb-8 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border whitespace-nowrap ${
              tab === t ? "bg-primary text-white border-primary" : "border-border text-text-secondary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {status === "loading" && <LoadingState message="Loading your bookings..." />}
      {status === "error" && <ErrorState message="Unable to load your bookings." onRetry={load} />}
      {status === "ready" && bookings.length === 0 && (
        <EmptyState title="No bookings here yet" subtitle="Once you book a service, it'll show up here." />
      )}
      {status === "ready" && bookings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((b) => (
            <BookingCard key={b._id} booking={b} viewerRole="CUSTOMER" />
          ))}
        </div>
      )}
    </div>
  );
}
