import { useEffect, useMemo, useState } from "react";
import { bookingService } from "../../services/bookingService";
import { Booking } from "../../types";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import Icon from "../../components/ui/Icon";

const NEXT_ACTION: Record<string, { label: string; next: string; primary: boolean }[]> = {
  PENDING: [
    { label: "Reject", next: "REJECTED", primary: false },
    { label: "Accept Request", next: "ACCEPTED", primary: true },
  ],
  ACCEPTED: [{ label: "Confirm", next: "CONFIRMED", primary: true }],
  CONFIRMED: [{ label: "On the way", next: "PROVIDER_ON_THE_WAY", primary: true }],
  PROVIDER_ON_THE_WAY: [{ label: "Start Service", next: "IN_PROGRESS", primary: true }],
  IN_PROGRESS: [{ label: "Mark Completed", next: "COMPLETED", primary: true }],
};

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default function BookingRequests() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [actingId, setActingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [filter, setFilter] = useState<"PENDING" | "ALL">("PENDING");
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setStatus("loading");
    try {
      const res = await bookingService.list();
      setBookings(res.data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  async function act(bookingId: string, next: string) {
    setActingId(bookingId);
    setActionError("");
    try {
      await bookingService.updateStatus(bookingId, next);
      load();
    } catch (err: any) {
      setActionError(err.response?.data?.message || "Unable to update this booking. Please try again.");
    } finally {
      setActingId(null);
    }
  }

  const visibleBookings = useMemo(
    () => bookings.filter((b) => (filter === "PENDING" ? b.status === "PENDING" : !["CANCELLED", "REJECTED", "COMPLETED"].includes(b.status))),
    [bookings, filter]
  );

  const viewMonth = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset, 1);
    return d;
  }, [monthOffset]);

  const bookedDates = useMemo(() => {
    const set = new Set<string>();
    bookings.forEach((b) => {
      if (!["CANCELLED", "REJECTED"].includes(b.status)) set.add(new Date(b.scheduledDate).toDateString());
    });
    return set;
  }, [bookings]);

  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [viewMonth]);

  const todaysSlots = useMemo(() => {
    const todayStr = new Date().toDateString();
    return bookings
      .filter((b) => new Date(b.scheduledDate).toDateString() === todayStr && !["CANCELLED", "REJECTED"].includes(b.status))
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [bookings]);

  if (status === "loading") return <LoadingState message="Loading booking requests..." />;
  if (status === "error") return <ErrorState message="Unable to load booking requests." onRetry={load} />;

  return (
    <div>
      {actionError && (
        <div className="bg-red-50 text-error text-sm px-4 py-3 rounded-lg mb-md flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError("")} className="font-bold ml-3">✕</button>
        </div>
      )}
      <div className="flex items-end justify-between mb-lg flex-wrap gap-sm">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-background mb-xs">Booking Requests</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Review and manage your incoming service appointments.</p>
        </div>
        <div className="flex gap-sm">
          <button
            onClick={() => setFilter("PENDING")}
            className={`px-md py-sm rounded-full font-label-lg text-label-lg transition-colors flex items-center gap-xs ${
              filter === "PENDING" ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface hover:bg-surface-dim"
            }`}
          >
            <Icon name="filter_list" className="text-[18px]" />
            Pending
          </button>
          <button
            onClick={() => setFilter("ALL")}
            className={`px-md py-sm rounded-full font-label-lg text-label-lg transition-colors ${
              filter === "ALL" ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface hover:bg-surface-dim"
            }`}
          >
            All Active
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-lg">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-md">
          {visibleBookings.length === 0 && (
            <EmptyState title="Nothing here" subtitle={filter === "PENDING" ? "No pending requests right now." : "No active bookings right now."} />
          )}
          {visibleBookings.map((b) => (
            <div
              key={b._id}
              className="bg-surface-container rounded-xl p-md shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
              <div className="flex flex-col sm:flex-row items-start justify-between gap-md relative z-10">
                <div className="flex items-start gap-md">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-surface-dim shrink-0 flex items-center justify-center font-headline-md text-headline-md text-primary">
                    {b.customerId?.name?.[0] || "?"}
                  </div>
                  <div>
                    <div className="flex items-center gap-xs mb-1 flex-wrap">
                      <h3 className="font-headline-md text-headline-md text-on-surface">{b.customerId?.name}</h3>
                      <span className="px-2 py-1 bg-tertiary-container/10 text-tertiary-container rounded font-label-md text-label-md">
                        {b.bookingNumber}
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-primary font-medium mb-xs">{b.serviceId?.name}</p>
                    <div className="flex flex-wrap gap-md mt-sm">
                      <div className="flex items-center gap-2 text-on-surface-variant font-body-md text-body-md">
                        <Icon name="calendar_month" className="text-[18px]" />
                        {new Date(b.scheduledDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                      <div className="flex items-center gap-2 text-on-surface-variant font-body-md text-body-md">
                        <Icon name="schedule" className="text-[18px]" />
                        {b.scheduledTime}
                      </div>
                      <div className="flex items-center gap-2 text-on-surface-variant font-body-md text-body-md">
                        <Icon name="location_on" className="text-[18px]" />
                        <span className="truncate max-w-[220px]">{b.address}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 w-full sm:w-auto">
                  <div className="font-display-lg-mobile text-display-lg-mobile text-on-surface">₹{b.amount}</div>
                  <div className="font-label-md text-label-md text-on-surface-variant mb-sm">Estimated Total</div>
                  <div className="flex gap-xs justify-end">
                    {(NEXT_ACTION[b.status] || []).map((action) => (
                      <button
                        key={action.next}
                        disabled={actingId === b._id}
                        onClick={() => act(b._id, action.next)}
                        className={`px-sm py-xs rounded-lg font-label-lg text-label-lg transition-colors disabled:opacity-50 ${
                          action.primary ? "bg-primary text-on-primary shadow-sm hover:shadow-md" : "bg-surface text-error border border-error/30 hover:bg-error/5"
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="bg-surface rounded-xl p-md shadow-sm sticky top-20">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-md">Your Schedule</h2>
            <div className="flex items-center justify-between mb-sm">
              <button onClick={() => setMonthOffset((m) => m - 1)} className="text-on-surface-variant hover:text-primary">
                <Icon name="chevron_left" />
              </button>
              <span className="font-label-lg text-label-lg text-on-surface">
                {viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </span>
              <button onClick={() => setMonthOffset((m) => m + 1)} className="text-on-surface-variant hover:text-primary">
                <Icon name="chevron_right" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-xs">
              {WEEKDAY_LABELS.map((d, i) => (
                <span key={i} className="font-label-md text-label-md text-on-surface-variant">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((d, i) => (
                <div
                  key={i}
                  className={`aspect-square flex items-center justify-center rounded-full text-label-md font-label-md ${
                    !d
                      ? ""
                      : d.toDateString() === new Date().toDateString()
                      ? "bg-primary text-on-primary"
                      : bookedDates.has(d.toDateString())
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-on-surface"
                  }`}
                >
                  {d?.getDate()}
                </div>
              ))}
            </div>

            <div className="mt-md pt-md border-t border-outline-variant">
              <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-sm">Today's Slots</h3>
              {todaysSlots.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">Nothing booked for today.</p>
              ) : (
                <div className="flex flex-col gap-xs">
                  {todaysSlots.map((s) => (
                    <div key={s._id} className="flex items-center justify-between text-body-md font-body-md">
                      <span className="text-on-surface">{s.scheduledTime}</span>
                      <span className="text-on-surface-variant">{s.status.replace(/_/g, " ")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}