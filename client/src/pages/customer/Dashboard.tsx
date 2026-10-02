import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bookingService } from "../../services/bookingService";
import { useAuth } from "../../context/AuthContext";
import { Booking } from "../../types";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import Icon from "../../components/ui/Icon";

const TIMELINE_STEPS = [
  { key: "BOOKED", label: "Booked", icon: "check", statuses: ["PENDING", "ACCEPTED", "CONFIRMED", "PROVIDER_ON_THE_WAY", "IN_PROGRESS", "COMPLETED"] },
  { key: "ASSIGNED", label: "Provider Assigned", icon: "person", statuses: ["ACCEPTED", "CONFIRMED", "PROVIDER_ON_THE_WAY", "IN_PROGRESS", "COMPLETED"] },
  { key: "ON_WAY", label: "On the Way", icon: "local_shipping", statuses: ["PROVIDER_ON_THE_WAY", "IN_PROGRESS", "COMPLETED"] },
  { key: "IN_PROGRESS", label: "In Progress", icon: "home_repair_service", statuses: ["IN_PROGRESS", "COMPLETED"] },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

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

  const stats = useMemo(() => {
    const upcoming = bookings.filter((b) => ["PENDING", "ACCEPTED", "CONFIRMED"].includes(b.status));
    const active = bookings.filter((b) => ["PROVIDER_ON_THE_WAY", "IN_PROGRESS"].includes(b.status));
    const completed = bookings.filter((b) => b.status === "COMPLETED");
    const totalSpent = bookings
      .filter((b) => b.paymentStatus === "SUCCESS")
      .reduce((sum, b) => sum + b.amount, 0);
    return { upcoming: upcoming.length, active: active.length, completed: completed.length, totalSpent };
  }, [bookings]);

  const nextBooking = useMemo(() => {
    const active = bookings.filter((b) => !["COMPLETED", "CANCELLED", "REJECTED", "REFUNDED"].includes(b.status));
    return [...active].sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0];
  }, [bookings]);

  const recentProviders = useMemo(() => {
    const seen = new Map<string, any>();
    for (const b of bookings) {
      if (b.providerId?._id && !seen.has(b.providerId._id)) seen.set(b.providerId._id, b.providerId);
    }
    return Array.from(seen.values()).slice(0, 4);
  }, [bookings]);

  const activeStepIndex = nextBooking
    ? TIMELINE_STEPS.reduce((acc, step, i) => (step.statuses.includes(nextBooking.status) ? i : acc), 0)
    : -1;

  if (status === "loading") return <LoadingState message="Loading your dashboard..." />;
  if (status === "error") return <ErrorState message="Unable to load your dashboard." onRetry={load} />;

  return (
    <div className="flex flex-col w-full relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none transform translate-x-1/3 -translate-y-1/3" />

      <div className="max-w-container-max mx-auto px-md lg:px-lg w-full flex flex-col gap-lg z-10 py-lg">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md relative">
          <div className="flex flex-col gap-xs z-10">
            <h1 className="font-display-lg text-display-lg text-on-background relative">
              <span className="relative z-10">Welcome back,</span>{" "}
              <span className="text-primary italic relative z-10">{user?.name?.split(" ")[0]}</span>
              <div className="absolute bottom-2 left-0 w-full h-4 bg-primary/20 -z-10 -rotate-1 rounded-sm" />
            </h1>
            <div className="flex items-center gap-base text-on-surface-variant font-body-md text-body-md bg-surface-container w-max px-sm py-xs rounded-full">
              <Icon name="location_on" className="text-[18px] text-primary" />
              <span>Chennai, India</span>
            </div>
          </div>
          <button
            onClick={() => navigate("/search")}
            className="bg-primary text-on-primary font-label-lg text-label-lg px-md py-sm rounded-lg shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-xs group"
          >
            <Icon name="add_circle" className="group-hover:rotate-90 transition-transform" />
            Book New Service
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
          <StatCard icon="event_upcoming" value={stats.upcoming} label="Upcoming Bookings" iconColor="text-primary" />
          <StatCard icon="pending_actions" value={stats.active} label="Active Services" iconColor="text-secondary" />
          <StatCard icon="task_alt" value={stats.completed} label="Completed Services" iconColor="text-primary" />
          <div className="bg-primary rounded-xl p-md shadow-md relative overflow-hidden group">
            <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-on-primary/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
            <div className="flex flex-col gap-sm relative z-10">
              <div className="w-10 h-10 rounded-full bg-on-primary/20 flex items-center justify-center">
                <Icon name="payments" className="text-on-primary" />
              </div>
              <div>
                <div className="font-display-lg-mobile text-display-lg-mobile text-on-primary">₹{stats.totalSpent.toLocaleString()}</div>
                <div className="font-label-lg text-label-lg text-on-primary/80">Total Spent</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          <div className="lg:col-span-2 flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Upcoming Booking</h2>
              <button onClick={() => navigate("/bookings")} className="font-label-lg text-label-lg text-primary hover:text-primary-container transition-colors">
                View All
              </button>
            </div>

            {!nextBooking ? (
              <div className="bg-surface rounded-xl p-lg shadow-sm text-center">
                <Icon name="event_available" className="text-[40px] text-outline-variant mb-sm" />
                <p className="font-body-md text-body-md text-on-surface-variant">No upcoming bookings. Ready to book a service?</p>
              </div>
            ) : (
              <div className="bg-surface rounded-xl p-md shadow-md flex flex-col gap-md">
                <div className="flex items-start justify-between">
                  <div className="flex gap-sm">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                      <Icon name="electrical_services" className="text-[28px] text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-headline-md text-headline-md text-on-surface">{nextBooking.serviceId?.name}</h3>
                      <p className="font-body-md text-body-md text-on-surface-variant">with {nextBooking.providerId?.userId?.name}</p>
                    </div>
                  </div>
                  <div className="bg-[#E6F4EA] text-[#137333] px-sm py-xs rounded-full font-label-md text-label-md flex items-center gap-xs whitespace-nowrap">
                    <Icon name="check_circle" className="text-[14px]" />
                    {nextBooking.status.replace(/_/g, " ")}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-md p-sm bg-surface-container-lowest rounded-lg">
                  <div className="flex items-center gap-xs text-on-surface font-label-lg text-label-lg">
                    <Icon name="calendar_month" className="text-primary text-[20px]" />
                    {new Date(nextBooking.scheduledDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}, {nextBooking.scheduledTime}
                  </div>
                  <div className="hidden sm:block w-[1px] bg-outline-variant/30 h-6" />
                  <div className="flex items-center gap-xs text-on-surface font-label-lg text-label-lg">
                    <Icon name="pin_drop" className="text-primary text-[20px]" />
                    <span className="truncate max-w-[180px]">{nextBooking.address}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-sm">
                  <div className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Tracking Timeline</div>
                  <div className="relative flex items-center justify-between mt-sm">
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-surface-container-high -translate-y-1/2 z-0" />
                    <div
                      className="absolute top-1/2 left-0 h-[2px] bg-primary -translate-y-1/2 z-0 transition-all duration-1000"
                      style={{ width: `${(activeStepIndex / (TIMELINE_STEPS.length - 1)) * 100}%` }}
                    />
                    {TIMELINE_STEPS.map((step, i) => {
                      const reached = i <= activeStepIndex;
                      const isCurrent = i === activeStepIndex;
                      return (
                        <div key={step.key} className="relative z-10 flex flex-col items-center gap-xs">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              reached ? "bg-primary text-on-primary" : "bg-surface-container-high text-outline"
                            } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                          >
                            <Icon name={step.icon} className="text-[14px]" />
                          </div>
                          <span className={`font-label-md text-label-md whitespace-nowrap ${reached ? "text-on-surface" : "text-on-surface-variant"} ${isCurrent ? "font-bold" : ""}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-sm mt-xs">
                  <button
                    onClick={() => navigate(`/bookings/${nextBooking._id}`)}
                    className="flex-1 bg-surface-container text-primary font-label-lg text-label-lg py-sm rounded-lg hover:bg-surface-container-highest transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => navigate(`/messages?provider=${nextBooking.providerId?._id}`)}
                    className="flex-1 bg-primary text-on-primary font-label-lg text-label-lg py-sm rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  >
                    Contact Provider
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-md mt-md">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Recent Providers</h2>
              </div>
              {recentProviders.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">Your booked providers will show up here.</p>
              ) : (
                <div className="flex gap-md overflow-x-auto pb-sm snap-x snap-mandatory -mx-md px-md md:mx-0 md:px-0" style={{ scrollbarWidth: "none" }}>
                  {recentProviders.map((p: any) => (
                    <div key={p._id} className="min-w-[280px] w-[280px] bg-surface rounded-xl p-md shadow-sm hover:shadow-md transition-shadow snap-start flex flex-col gap-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center font-headline-md text-headline-md text-primary shrink-0">
                          {p.userId?.name?.[0] || "?"}
                        </div>
                        <div>
                          <h4 className="font-label-lg text-label-lg text-on-surface">{p.userId?.name}</h4>
                          <p className="font-body-md text-body-md text-on-surface-variant">{p.profession}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/providers/${p._id}`)}
                        className="w-full bg-surface-container text-primary font-label-lg text-label-lg py-xs rounded-lg hover:bg-surface-container-highest transition-colors mt-auto"
                      >
                        Rebook
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-md">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Explore</h2>
            <button
              onClick={() => navigate("/search")}
              className="bg-surface rounded-xl p-md shadow-sm relative overflow-hidden text-left hover:shadow-md transition-shadow"
            >
              <div className="relative z-10 flex items-center gap-md">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center shrink-0">
                  <Icon name="explore" className="text-secondary" />
                </div>
                <div>
                  <h4 className="font-label-lg text-label-lg text-on-surface">Explore more in Chennai</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm">Find top-rated local professionals near you.</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate("/favorites")}
              className="bg-surface rounded-xl p-md shadow-sm relative overflow-hidden text-left hover:shadow-md transition-shadow"
            >
              <div className="relative z-10 flex items-center gap-md">
                <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center shrink-0">
                  <Icon name="favorite" className="text-error" />
                </div>
                <div>
                  <h4 className="font-label-lg text-label-lg text-on-surface">Your Favorites</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm">Quick rebook your saved providers.</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, iconColor }: { icon: string; value: number; label: string; iconColor: string }) {
  return (
    <div className="bg-surface rounded-xl p-md shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
      <div className="flex flex-col gap-sm relative z-10">
        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
          <Icon name={icon} className={iconColor} />
        </div>
        <div>
          <div className="font-display-lg-mobile text-display-lg-mobile text-on-surface">{value}</div>
          <div className="font-label-lg text-label-lg text-on-surface-variant">{label}</div>
        </div>
      </div>
    </div>
  );
}
