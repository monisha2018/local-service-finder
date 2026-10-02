import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bookingService } from "../../services/bookingService";
import { providerService } from "../../services/providerService";
import { useAuth } from "../../context/AuthContext";
import { Booking } from "../../types";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import Icon from "../../components/ui/Icon";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "New Request",
  ACCEPTED: "Accepted",
  CONFIRMED: "Scheduled",
  PROVIDER_ON_THE_WAY: "On Route",
  IN_PROGRESS: "In Progress",
};
const STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-surface-variant text-on-surface-variant",
  ACCEPTED: "bg-primary-container text-on-primary-container",
  CONFIRMED: "bg-surface-variant text-on-surface-variant",
  PROVIDER_ON_THE_WAY: "bg-primary-container text-on-primary-container",
  IN_PROGRESS: "bg-primary-container text-on-primary-container",
};
const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tmw";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Monday-start week containing `date`
function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // shift Sunday(0) to -6
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function ProviderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setStatus("loading");
    try {
      const [bookingsRes, profileRes] = await Promise.all([bookingService.list(), providerService.me()]);
      setBookings(bookingsRes.data);
      setProfile(profileRes.data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const activeBookings = bookings.filter((b) => !["CANCELLED", "REJECTED"].includes(b.status));
    const todaysBookings = activeBookings.filter((b) => new Date(b.scheduledDate).toDateString() === todayStr).length;
    const yesterdaysBookings = activeBookings.filter((b) => new Date(b.scheduledDate).toDateString() === yesterdayStr).length;
    const bookingsDelta = todaysBookings - yesterdaysBookings;

    const pendingRequests = bookings.filter((b) => b.status === "PENDING").length;

    const paidBookings = bookings.filter((b) => b.paymentStatus === "SUCCESS");
    const totalEarnings = paidBookings.reduce((sum, b) => sum + b.amount * 0.9, 0);

    const weekStart = startOfWeek(now);
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(weekStart.getDate() - 7);

    const dailyEarnings = Array(7).fill(0);
    paidBookings.forEach((b) => {
      const created = new Date(b.createdAt);
      if (created >= weekStart) {
        const dayIdx = Math.floor((created.getTime() - weekStart.getTime()) / 86400000);
        if (dayIdx >= 0 && dayIdx < 7) dailyEarnings[dayIdx] += b.amount * 0.9;
      }
    });
    const thisWeekEarnings = dailyEarnings.reduce((a, b) => a + b, 0);
    const lastWeekEarnings = paidBookings
      .filter((b) => new Date(b.createdAt) >= lastWeekStart && new Date(b.createdAt) < weekStart)
      .reduce((sum, b) => sum + b.amount * 0.9, 0);
    const weekDeltaPct = lastWeekEarnings > 0 ? Math.round(((thisWeekEarnings - lastWeekEarnings) / lastWeekEarnings) * 100) : null;

    return { todaysBookings, bookingsDelta, pendingRequests, totalEarnings, thisWeekEarnings, dailyEarnings, weekDeltaPct };
  }, [bookings]);

  const activeJobs = useMemo(
    () =>
      bookings
        .filter((b) => ["CONFIRMED", "PROVIDER_ON_THE_WAY", "IN_PROGRESS", "PENDING", "ACCEPTED"].includes(b.status))
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
        .slice(0, 5),
    [bookings]
  );

  if (status === "loading") return <LoadingState message="Loading your dashboard..." />;
  if (status === "error") return <ErrorState message="Unable to load your dashboard." onRetry={load} />;

    const rating = profile?.rating || 0;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const maxDaily = Math.max(...stats.dailyEarnings, 1);
  const profileIncomplete = profile?.profession === "Not specified" || !profile?.serviceArea;

  return (
    <div className="flex flex-col w-full h-full">
      {profileIncomplete && (
        <div className="bg-primary-container text-on-primary-container rounded-xl p-md mb-lg flex items-center justify-between gap-md flex-wrap">
          <div className="flex items-center gap-sm">
            <Icon name="info" className="text-[24px]" />
            <div>
              <p className="font-label-lg text-label-lg">Your profile is incomplete</p>
              <p className="font-body-md text-body-md opacity-90">Add your profession, experience, and service area so customers can find you.</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/provider/onboarding")}
            className="px-md py-sm bg-on-primary-container text-primary-container font-label-lg text-label-lg rounded-lg hover:bg-surface-container-lowest transition-colors shrink-0"
          >
            Complete Profile
          </button>
        </div>
      )}
      <div className="flex items-center justify-between mb-lg flex-wrap gap-md">
        <div className="flex items-center gap-md">
          <div className="w-16 h-16 rounded-full shadow-md overflow-hidden relative bg-primary-fixed flex items-center justify-center font-headline-md text-headline-md text-primary shrink-0">
            {profile?.userId?.profileImage ? (
              <img alt="Provider Profile" className="w-full h-full object-cover" src={profile.userId.profileImage} />
            ) : (
              user?.name?.[0]
            )}
            <div className="absolute inset-0 ring-1 ring-inset ring-outline-variant rounded-full" />
          </div>
          <div>
            <h1 className="font-display-lg text-display-lg text-on-background tracking-tight">
              {greeting()}, {user?.name?.split(" ")[0]}
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">Here is what's happening with your services today.</p>
          </div>
        </div>
        <div className="flex gap-sm">
          <button
            onClick={() => navigate("/provider/automations")}
            className="h-12 px-md rounded-xl bg-surface-container-high text-primary font-label-lg text-label-lg shadow-sm hover:shadow-md transition-shadow flex items-center gap-xs"
          >
            <Icon name="calendar_month" className="text-[20px]" />
            Update Availability
          </button>
          <button
            onClick={() => navigate("/provider/services")}
            className="h-12 px-md rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:shadow-md transition-shadow flex items-center gap-xs"
          >
            <Icon name="add_circle" className="text-[20px]" />
            Add New Service
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg">
        <div className="bg-surface-container-low p-md rounded-[24px] shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 p-md opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-all duration-500 text-primary">
            <Icon name="assignment" filled className="text-[64px]" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Today's Bookings</p>
              <h3 className="font-display-lg text-display-lg text-on-background mt-sm">{stats.todaysBookings}</h3>
            </div>
            {stats.bookingsDelta !== 0 && (
              <div className={`mt-xl flex items-center gap-xs ${stats.bookingsDelta > 0 ? "text-secondary" : "text-error"}`}>
                <Icon name={stats.bookingsDelta > 0 ? "arrow_upward" : "arrow_downward"} className="text-[16px]" />
                <span className="font-label-md text-label-md">
                  {Math.abs(stats.bookingsDelta)} {stats.bookingsDelta > 0 ? "more" : "fewer"} than yesterday
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-primary-container p-md rounded-[24px] shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 text-on-primary-container">
          <div className="absolute top-0 right-0 p-md opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-all duration-500">
            <Icon name="pending_actions" filled className="text-[64px]" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="font-label-lg text-label-lg uppercase tracking-wider opacity-90">Pending Requests</p>
              <h3 className="font-display-lg text-display-lg mt-sm">{stats.pendingRequests}</h3>
            </div>
            <div className="mt-xl">
              <button
                onClick={() => navigate("/provider/bookings")}
                className="font-label-md text-label-md bg-on-primary-container text-primary-container px-sm py-xs rounded-full inline-flex items-center gap-xs hover:bg-surface-container-lowest transition-colors"
              >
                Review Now
                <Icon name="chevron_right" className="text-[14px]" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low p-md rounded-[24px] shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 p-md opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-all duration-500 text-tertiary">
            <Icon name="payments" filled className="text-[64px]" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Total Earnings</p>
              <h3 className="font-display-lg text-display-lg text-on-background mt-sm">
                ₹{stats.totalEarnings >= 1000 ? `${(stats.totalEarnings / 1000).toFixed(1)}k` : stats.totalEarnings.toFixed(0)}
              </h3>
            </div>
            {stats.weekDeltaPct !== null && (
              <div className={`mt-xl flex items-center gap-xs ${stats.weekDeltaPct >= 0 ? "text-secondary" : "text-error"}`}>
                <Icon name={stats.weekDeltaPct >= 0 ? "arrow_upward" : "arrow_downward"} className="text-[16px]" />
                <span className="font-label-md text-label-md">{stats.weekDeltaPct >= 0 ? "+" : ""}{stats.weekDeltaPct}% this week</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface-container-highest p-md rounded-[24px] shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 p-md opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-all duration-500 text-secondary-container">
            <Icon name="star" filled className="text-[64px]" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Avg Rating</p>
              <div className="flex items-end gap-xs mt-sm">
                <h3 className="font-display-lg text-display-lg text-on-background">{rating.toFixed(1)}</h3>
                <span className="font-body-md text-body-md text-on-surface-variant mb-[8px]">/ 5.0</span>
              </div>
            </div>
            <div className="mt-xl flex items-center gap-xs">
              <div className="flex gap-[2px] text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon
                    key={i}
                    name={i < fullStars ? "star" : i === fullStars && hasHalfStar ? "star_half" : "star"}
                    filled={i < fullStars}
                    className="text-[16px]"
                  />
                ))}
              </div>
              <span className="font-label-md text-label-md text-on-surface-variant ml-xs">({profile?.reviewCount || 0} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        <div className="lg:col-span-7 flex flex-col gap-md">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-lg text-headline-lg text-on-background">Active Jobs</h2>
            <button
              onClick={() => navigate("/provider/bookings")}
              className="font-label-lg text-label-lg text-primary hover:text-primary-fixed-variant transition-colors flex items-center gap-xs"
            >
              View All <Icon name="arrow_forward" className="text-[18px]" />
            </button>
          </div>

          {activeJobs.length === 0 ? (
            <div className="bg-surface-container-low rounded-xl p-lg shadow-sm text-center">
              <Icon name="work_off" className="text-[36px] text-outline-variant mb-sm" />
              <p className="font-body-md text-body-md text-on-surface-variant">No active jobs right now.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-sm">
              {activeJobs.map((b) => {
                const label = dayLabel(b.scheduledDate);
                const isFuture = label !== "Today";
                const [hourStr] = b.scheduledTime.split(":");
                const meridiem = Number(hourStr) >= 12 ? "PM" : "AM";
                return (
                  <div
                    key={b._id}
                    onClick={() => navigate("/provider/bookings/" )}
                    className="bg-surface-container-low rounded-xl p-md shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer flex gap-md"
                  >
                    <div className={`w-[60px] flex flex-col items-center justify-center shrink-0 border-r border-outline-variant pr-md ${isFuture ? "opacity-50" : ""}`}>
                      <span className="font-label-lg text-label-lg text-on-surface-variant uppercase">{label}</span>
                      <span className={`font-headline-md text-headline-md mt-xs ${isFuture ? "text-on-surface-variant" : "text-primary"}`}>{hourStr}</span>
                      <span className="font-label-md text-label-md text-on-surface-variant">{meridiem}</span>
                    </div>
                    <div className={`flex-1 flex flex-col justify-center ${isFuture ? "opacity-70 group-hover:opacity-100 transition-opacity" : ""}`}>
                      <div className="flex items-center justify-between flex-wrap gap-xs">
                        <h4 className="font-headline-md text-headline-md text-on-background">{b.serviceId?.name}</h4>
                        <span className={`px-xs py-[2px] rounded font-label-md text-label-md ${STATUS_CLASS[b.status] || "bg-surface-variant text-on-surface-variant"}`}>
                          {STATUS_LABEL[b.status] || b.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-md mt-sm text-on-surface-variant font-body-md text-body-md flex-wrap">
                        <div className="flex items-center gap-xs"><Icon name="person" className="text-[18px]" /> {b.customerId?.name}</div>
                        <div className="flex items-center gap-xs truncate"><Icon name="location_on" className="text-[18px]" /> {b.address}</div>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pl-md border-l border-outline-variant">
                      <Icon name="chevron_right" className="text-[24px] text-primary" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 flex flex-col gap-md">
          <h2 className="font-headline-lg text-headline-lg text-on-background">Earnings Overview</h2>
          <div className="bg-surface-container-low p-md rounded-xl shadow-sm flex flex-col h-full min-h-[320px] relative">
            <div className="flex items-center justify-between mb-lg">
              <span className="font-body-md text-body-md text-on-surface-variant">This Week</span>
              <h3 className="font-headline-md text-headline-md text-primary">₹{stats.thisWeekEarnings.toLocaleString()}</h3>
            </div>
            <div className="flex-1 flex items-end justify-between gap-xs relative mt-md h-[180px]">
              <div className="absolute inset-x-0 bottom-[20%] border-t border-dashed border-outline-variant opacity-50 z-0" />
              <div className="absolute inset-x-0 bottom-[60%] border-t border-dashed border-outline-variant opacity-50 z-0" />
              <div className="absolute inset-x-0 top-0 border-t border-dashed border-outline-variant opacity-50 z-0" />
              {stats.dailyEarnings.map((amount, i) => {
                const heightPct = Math.max((amount / maxDaily) * 100, amount > 0 ? 5 : 3);
                const isPeak = amount === maxDaily && amount > 0;
                return (
                  <div key={i} className="flex flex-col items-center gap-xs w-full z-10 group cursor-pointer">
                    <div
                      className={`w-full rounded-t-sm relative transition-colors ${isPeak ? "bg-primary shadow-sm" : "bg-surface-variant group-hover:bg-primary/20"} ${amount === 0 ? "opacity-50" : ""}`}
                      style={{ height: `${heightPct}%` }}
                    >
                      {amount > 0 && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-inverse-surface text-inverse-on-surface font-label-md text-label-md px-xs py-[2px] rounded whitespace-nowrap shadow-md pointer-events-none">
                          ₹{amount.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <span className={`font-label-md text-label-md ${isPeak ? "text-primary font-bold" : amount === 0 ? "text-on-surface-variant opacity-50" : "text-on-surface-variant"}`}>
                      {WEEK_LABELS[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}