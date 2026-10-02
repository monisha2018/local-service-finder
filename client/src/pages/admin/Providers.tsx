import { useEffect, useMemo, useState } from "react";
import { adminService } from "../../services/adminService";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";
import Icon from "../../components/ui/Icon";

const STATUS_META: Record<string, { icon: string; label: string; className: string }> = {
  PENDING: { icon: "hourglass_empty", label: "Pending Review", className: "bg-tertiary-fixed-dim/30 text-tertiary" },
  VERIFIED: { icon: "verified", label: "Verified", className: "bg-[#E6F4EA] text-[#137333]" },
  REJECTED: { icon: "cancel", label: "Rejected", className: "bg-error-container text-error" },
};

export default function AdminProviders() {
  const [providers, setProviders] = useState<any[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    load();
  }, [filter]);

  async function load() {
    setStatus("loading");
    try {
      const res = await adminService.providers(filter ? { verificationStatus: filter } : {});
      setProviders(res.data);
      setStatus("ready");
      if (res.data.length > 0 && !res.data.find((p: any) => p._id === selectedId)) {
        setSelectedId(null);
      }
    } catch {
      setStatus("error");
    }
  }

  async function decide(id: string, decision: "VERIFIED" | "REJECTED") {
    setActing(true);
    try {
      await adminService.verifyProvider(id, decision);
      setSelectedId(null);
      load();
    } finally {
      setActing(false);
    }
  }

  const stats = useMemo(() => {
    const pending = providers.filter((p) => p.verificationStatus === "PENDING").length;
    return { pending };
  }, [providers]);

  const selected = providers.find((p) => p._id === selectedId);

  if (status === "loading") return <LoadingState message="Loading verification queue..." />;
  if (status === "error") return <ErrorState message="Unable to load the verification queue." onRetry={load} />;

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col xl:flex-row gap-lg justify-between items-start xl:items-center">
        <div className="flex flex-col gap-xs">
          <h1 className="font-display-lg text-display-lg text-on-surface">Verification Queue</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Review and approve new service providers to ensure quality and compliance on the platform.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-md w-full xl:w-auto">
          <StatCard label="Pending Review" value={stats.pending} highlight />
          <StatCard label="Verified" value={providers.filter((p) => p.verificationStatus === "VERIFIED").length} />
          <StatCard label="Rejected" value={providers.filter((p) => p.verificationStatus === "REJECTED").length} />
        </div>
      </div>

      <div className="flex gap-sm">
        {["PENDING", "VERIFIED", "REJECTED", ""].map((f) => (
          <button
            key={f || "all"}
            onClick={() => setFilter(f)}
            className={`px-md py-sm rounded-full font-label-lg text-label-lg transition-colors ${
              filter === f ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface hover:bg-surface-dim"
            }`}
          >
            {f || "All"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg relative">
        <div className="lg:col-span-8 bg-surface rounded-xl shadow-sm overflow-hidden">
          {providers.length === 0 ? (
            <div className="p-lg"><EmptyState title="Nothing here" subtitle="No providers match this filter." /></div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-surface-container-low">
                <tr>
                  {["Provider", "Category", "Experience", "Rating", "Status", ""].map((h) => (
                    <th key={h} className="p-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => {
                  const meta = STATUS_META[p.verificationStatus];
                  return (
                    <tr
                      key={p._id}
                      onClick={() => setSelectedId(p._id)}
                      className={`border-t border-outline-variant cursor-pointer transition-colors hover:bg-surface-container-low ${
                        selectedId === p._id ? "bg-surface-variant" : ""
                      }`}
                    >
                      <td className="p-sm">
                        <div className="font-label-lg text-label-lg text-on-surface">{p.userId?.name}</div>
                        <div className="font-label-md text-label-md text-on-surface-variant">{p.userId?.email}</div>
                      </td>
                      <td className="p-sm font-body-md text-body-md text-on-surface-variant">{p.profession}</td>
                      <td className="p-sm font-body-md text-body-md text-on-surface-variant">{p.experienceYears}+ yrs</td>
                      <td className="p-sm font-body-md text-body-md text-on-surface-variant">{p.rating?.toFixed(1) || "—"}</td>
                      <td className="p-sm">
                        <span className={`inline-flex items-center gap-xs px-sm py-1 rounded-full font-label-md text-label-md ${meta.className}`}>
                          <Icon name={meta.icon} className="text-[14px]" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="p-sm">
                        <button className="text-primary font-label-lg text-label-lg hover:underline">Review</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="lg:col-span-4">
          <div className="bg-surface rounded-xl shadow-sm sticky top-20 p-md">
            {!selected ? (
              <div className="flex flex-col items-center text-center py-xl gap-sm">
                <Icon name="contract" className="text-[40px] text-outline-variant" />
                <h3 className="font-headline-md text-headline-md text-on-surface">Select a Provider</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Click on any row in the queue to preview their verification details.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-md">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-headline-md text-headline-md text-on-surface">{selected.userId?.name}</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-xs">
                      <Icon name="work" className="text-[16px]" />
                      {selected.profession}
                    </p>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="text-on-surface-variant hover:text-error">
                    <Icon name="close" />
                  </button>
                </div>

                <div>
                  <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-sm">
                    Submitted Documents ({selected.verificationDocs?.length || 0})
                  </h4>
                  {(!selected.verificationDocs || selected.verificationDocs.length === 0) ? (
                    <p className="font-body-md text-body-md text-on-surface-variant">No documents submitted yet.</p>
                  ) : (
                    <div className="flex flex-col gap-sm">
                      {selected.verificationDocs.map((doc: any, i: number) => (
                        <div key={i} className="flex items-center gap-sm">
                          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                            <Icon name="badge" className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-label-lg text-label-lg text-on-surface truncate">{doc.type}</div>
                            <div className="font-label-md text-label-md text-on-surface-variant">
                              Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-sm">Profile</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant">{selected.bio || "No bio provided."}</p>
                </div>

                {selected.verificationStatus === "PENDING" && (
                  <div className="flex gap-sm pt-sm border-t border-outline-variant">
                    <button
                      disabled={acting}
                      onClick={() => decide(selected._id, "REJECTED")}
                      className="flex-1 bg-surface text-error border border-error/30 font-label-lg text-label-lg py-sm rounded-lg hover:bg-error/5 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      disabled={acting}
                      onClick={() => decide(selected._id, "VERIFIED")}
                      className="flex-1 bg-primary text-on-primary font-label-lg text-label-lg py-sm rounded-lg shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
                    >
                      Approve Provider
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="bg-surface-container rounded-xl p-md flex flex-col gap-xs relative overflow-hidden shadow-sm">
      {highlight && <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />}
      <span className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">{label}</span>
      <span className={`font-display-lg-mobile text-display-lg-mobile ${highlight ? "text-primary" : "text-on-surface"}`}>{value}</span>
    </div>
  );
}
