import { useEffect, useMemo, useState } from "react";
import { adminService } from "../../services/adminService";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import Icon from "../../components/ui/Icon";

const CATEGORY_COLORS = ["#630ed4", "#4b41e1", "#7d3d00", "#ec4899", "#f59e0b", "#0ea5e9"];
const CATEGORY_BG = ["bg-primary", "bg-secondary", "bg-tertiary", "bg-accent-pink", "bg-accent-amber", "bg-sky-500"];

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [chartView, setChartView] = useState<"monthly" | "quarterly">("monthly");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setStatus("loading");
    try {
      const [dashRes, provRes, bookRes, payRes, compRes] = await Promise.all([
        adminService.dashboard(),
        adminService.providers(),
        adminService.bookings(),
        adminService.payments(),
        adminService.complaints(),
      ]);
      setData(dashRes.data);
      setProviders(provRes.data);
      setBookings(bookRes.data);
      setPayments(payRes.data);
      setComplaints(compRes.data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  const activeBookings = useMemo(
    () => bookings.filter((b) => !["COMPLETED", "CANCELLED", "REJECTED", "REFUNDED"].includes(b.status)).length,
    [bookings]
  );

  const verificationPipeline = useMemo(
    () => ({
      pending: providers.filter((p) => p.verificationStatus === "PENDING").length,
      verified: providers.filter((p) => p.verificationStatus === "VERIFIED").length,
      rejected: providers.filter((p) => p.verificationStatus === "REJECTED").length,
    }),
    [providers]
  );

  // Real activity feed sourced from actual recent records — no fabricated events.
  const activity = useMemo(() => {
    const items: { icon: string; iconClass: string; title: string; detail: string; ts: number; action?: { label: string; providerId?: string } }[] = [];
    payments
      .filter((p) => p.status === "SUCCESS")
      .slice(0, 3)
      .forEach((p) =>
        items.push({
          icon: "payments",
          iconClass: "bg-emerald-100 text-emerald-700",
          title: "Payment Confirmed",
          detail: `Booking ${p.bookingId?.bookingNumber || ""} payment of ₹${p.amount.toLocaleString()} confirmed.`,
          ts: new Date(p.createdAt).getTime(),
        })
      );
    providers
      .filter((p) => p.verificationStatus === "PENDING")
      .slice(0, 2)
      .forEach((p) =>
        items.push({
          icon: "person_add",
          iconClass: "bg-primary-container text-on-primary-container",
          title: "New Provider Awaiting Review",
          detail: `${p.userId?.name} (${p.profession}) submitted verification docs.`,
          ts: new Date(p.createdAt).getTime(),
          action: { label: "Review Docs", providerId: p._id },
        })
      );
    complaints.slice(0, 2).forEach((c) =>
      items.push({
        icon: "warning",
        iconClass: "bg-rose-100 text-rose-700",
        title: c.subject,
        detail: `Filed by ${c.customerId?.name || "a customer"} · Priority: ${c.priority}`,
        ts: new Date(c.createdAt).getTime(),
      })
    );
    return items.sort((a, b) => b.ts - a.ts).slice(0, 6);
  }, [payments, providers, complaints]);

  // Client-side quarterly rollup of the real monthly series — no fabricated data, just regrouped.
  const chartData = useMemo(() => {
    if (!data) return [];
    if (chartView === "monthly") {
      return data.monthlyBookings.map((m: any) => {
        const rev = data.monthlyRevenueSeries.find((r: any) => r._id === m._id);
        return { label: m._id.slice(5), bookings: m.count, revenue: rev?.revenue || 0 };
      });
    }
    const quarters: Record<string, { bookings: number; revenue: number }> = {};
    data.monthlyBookings.forEach((m: any) => {
      const [year, month] = m._id.split("-");
      const q = `${year} Q${Math.ceil(Number(month) / 3)}`;
      if (!quarters[q]) quarters[q] = { bookings: 0, revenue: 0 };
      quarters[q].bookings += m.count;
      const rev = data.monthlyRevenueSeries.find((r: any) => r._id === m._id);
      quarters[q].revenue += rev?.revenue || 0;
    });
    return Object.entries(quarters).map(([label, v]) => ({ label, ...v }));
  }, [data, chartView]);

  if (status === "loading") return <LoadingState message="Loading platform analytics..." />;
  if (status === "error" || !data) return <ErrorState message="Unable to load dashboard analytics." onRetry={load} />;

  const maxBookings = Math.max(...chartData.map((d: any) => d.bookings), 1);
  const maxRevenue = Math.max(...chartData.map((d: any) => d.revenue), 1);
  const totalCategoryRequests = data.popularCategories.reduce((sum: number, c: any) => sum + c.count, 0) || 1;

  // Build real SVG donut segments from actual category percentages
  const circumference = 2 * Math.PI * 80;
  let cumulativeOffset = 0;
  const donutSegments = data.popularCategories.slice(0, 6).map((c: any, i: number) => {
    const pct = c.count / totalCategoryRequests;
    const dash = pct * circumference;
    const segment = { color: CATEGORY_COLORS[i % CATEGORY_COLORS.length], dash, offset: -cumulativeOffset, name: c._id, pct };
    cumulativeOffset += dash;
    return segment;
  });

  return (
    <div className="flex flex-col w-full gap-xl relative overflow-hidden">
      <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-primary-container/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] -left-[10%] w-[400px] h-[400px] bg-secondary-container/10 rounded-full blur-[80px] pointer-events-none" />

      <section className="flex flex-col gap-lg z-10">
        <div className="flex items-end justify-between relative flex-wrap gap-md">
          <div className="flex flex-col gap-xs relative pl-4">
            <div className="absolute -left-1 top-2 bottom-2 w-1 bg-primary rounded-full" />
            <h2 className="font-display-lg text-display-lg text-on-surface tracking-tight leading-none">Platform Overview</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">High-level analytics and real-time operational insights.</p>
          </div>
          <span className="font-label-lg text-label-lg text-on-surface-variant flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-full w-max">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Data
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
          <KPICard icon="group" label="Total Users" value={data.totalUsers} />
          <KPICard icon="engineering" label="Total Providers" value={data.totalProviders} />
          <KPICard icon="event_available" label="Active Bookings" value={activeBookings} />
          <KPICard icon="account_balance_wallet" label="Monthly Revenue" value={`₹${data.monthlyRevenue.toLocaleString()}`} highlight />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg z-10">
        <div className="lg:col-span-2 bg-surface rounded-2xl p-md shadow-sm">
          <div className="flex items-center justify-between mb-md flex-wrap gap-sm">
            <div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface">Bookings & Revenue</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Performance over recent {chartView === "monthly" ? "months" : "quarters"}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setChartView("monthly")}
                className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-colors ${chartView === "monthly" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-variant"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setChartView("quarterly")}
                className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-colors ${chartView === "quarterly" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-variant"}`}
              >
                Quarterly
              </button>
            </div>
          </div>
          <div className="flex items-end gap-2 h-56">
            {chartData.map((d: any) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                <span className="font-label-md text-label-md text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.bookings} bookings · ₹{d.revenue.toLocaleString()}
                </span>
                <div className="w-full flex gap-1 items-end h-full">
                  <div className="flex-1 bg-primary rounded-t-md hover:bg-primary-container transition-colors" style={{ height: `${(d.bookings / maxBookings) * 100}%`, minHeight: "4px" }} />
                  <div className="flex-1 bg-secondary/60 rounded-t-md hover:bg-secondary transition-colors" style={{ height: `${(d.revenue / maxRevenue) * 100}%`, minHeight: "4px" }} />
                </div>
                <span className="font-label-md text-label-md text-on-surface-variant">{d.label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-md mt-sm justify-center">
            <span className="flex items-center gap-1 font-label-md text-label-md text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-primary" /> Bookings</span>
            <span className="flex items-center gap-1 font-label-md text-label-md text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-secondary/60" /> Revenue</span>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-md shadow-sm flex flex-col gap-lg">
          <h3 className="font-headline-md text-headline-md text-on-surface">Top Categories</h3>
          <div className="flex-1 flex flex-col justify-center items-center relative">
            <svg className="transform -rotate-90" height="180" viewBox="0 0 200 200" width="180">
              <circle className="text-surface-variant" cx="100" cy="100" fill="none" r="80" stroke="currentColor" strokeWidth="30" />
              {donutSegments.map((seg: any) => (
                <circle
                  key={seg.name}
                  cx="100"
                  cy="100"
                  fill="none"
                  r="80"
                  stroke={seg.color}
                  strokeWidth="30"
                  strokeDasharray={`${seg.dash} ${circumference}`}
                  strokeDashoffset={seg.offset}
                  className="transition-all duration-1000"
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-display-lg-mobile text-display-lg-mobile text-on-surface">{totalCategoryRequests}</span>
              <span className="font-label-md text-label-md text-on-surface-variant">Total Requests</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {data.popularCategories.slice(0, 5).map((c: any, i: number) => (
              <div key={c._id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${CATEGORY_BG[i % CATEGORY_BG.length]}`} />
                  <span className="font-label-md text-label-md text-on-surface">{c._id}</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface-variant">{Math.round((c.count / totalCategoryRequests) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg z-10">
        <div className="bg-surface rounded-2xl p-md shadow-sm">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">Provider Verification</h3>
          <p className="font-body-md text-body-md text-on-surface-variant mb-md">Current pipeline status</p>
          <div className="flex flex-col gap-md">
            <PipelineRow icon="hourglass_empty" bgClass="bg-amber-50" iconClass="text-amber-600" label="Pending Review" sub="Needs document check" value={verificationPipeline.pending} />
            <div className="h-px bg-surface-variant/50 w-full ml-16" />
            <PipelineRow icon="verified" bgClass="bg-emerald-50" iconClass="text-emerald-600" label="Verified" sub="Active on platform" value={verificationPipeline.verified} />
            <div className="h-px bg-surface-variant/50 w-full ml-16" />
            <PipelineRow icon="block" bgClass="bg-rose-50" iconClass="text-rose-600" label="Rejected" sub="Failed compliance" value={verificationPipeline.rejected} />
          </div>
        </div>

        <div className="lg:col-span-2 bg-surface rounded-2xl p-md shadow-sm">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-md">Recent Activity</h3>
          {activity.length === 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant">No recent activity yet.</p>
          ) : (
            <div className="flex flex-col gap-md relative">
              <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-surface-variant z-0" />
              {activity.map((a, i) => (
                <div key={i} className="flex gap-4 relative z-10 group">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 mt-1 border-4 border-surface ${a.iconClass}`}>
                    <Icon name={a.icon} className="text-[18px]" />
                  </div>
                  <div className="flex-1 bg-surface-container-lowest rounded-2xl p-4 shadow-sm group-hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-1 gap-xs">
                      <span className="font-label-lg text-label-lg text-on-surface">{a.title}</span>
                      <span className="font-label-md text-label-md text-on-surface-variant whitespace-nowrap">{timeAgo(new Date(a.ts).toISOString())}</span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant">{a.detail}</p>
                    {a.action && (
                      <div className="mt-3">
                        <a
                          href="/admin/providers"
                          className="inline-block px-3 py-1.5 rounded-lg bg-surface-variant text-on-surface-variant font-label-md text-label-md hover:bg-surface-dim transition-colors"
                        >
                          {a.action.label}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, highlight }: { icon: string; label: string; value: string | number; highlight?: boolean }) {
  return (
    <div
      className={`rounded-2xl p-md flex flex-col gap-md relative group overflow-hidden hover:-translate-y-1 transition-transform duration-300 ${
        highlight ? "bg-primary" : "bg-surface-container"
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center relative z-10 ${highlight ? "bg-on-primary/20" : "bg-surface-container-high"}`}>
        <Icon name={icon} className={`text-2xl ${highlight ? "text-on-primary" : "text-primary"}`} />
      </div>
      <div className="flex flex-col relative z-10">
        <span className={`font-label-md text-label-md uppercase tracking-wider ${highlight ? "text-on-primary/80" : "text-on-surface-variant"}`}>{label}</span>
        <span className={`font-display-lg-mobile text-display-lg-mobile ${highlight ? "text-on-primary" : "text-on-surface"}`}>{value}</span>
      </div>
    </div>
  );
}

function PipelineRow({ icon, bgClass, iconClass, label, sub, value }: { icon: string; bgClass: string; iconClass: string; label: string; sub: string; value: number }) {
  return (
    <div className="flex items-center gap-4 group cursor-pointer">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${bgClass} ${iconClass}`}>
        <Icon name={icon} />
      </div>
      <div className="flex-1 flex flex-col">
        <span className="font-label-lg text-label-lg text-on-surface">{label}</span>
        <span className="font-label-md text-label-md text-on-surface-variant">{sub}</span>
      </div>
      <span className="font-headline-md text-headline-md text-on-surface">{value}</span>
    </div>
  );
}