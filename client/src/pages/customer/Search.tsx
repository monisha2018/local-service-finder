import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { serviceService } from "../../services/serviceService";
import { providerService } from "../../services/providerService";
import { Category, Provider } from "../../types";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import Icon from "../../components/ui/Icon";  
import ProviderMap from "../../components/map/ProviderMap";

const SORT_OPTIONS = [
  { value: "rating", label: "Highest Rated" },
  { value: "experience", label: "Most Experienced" },
  { value: "newest", label: "Newest" },
];

const AVATAR_FALLBACK =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBhT6p8X8nBmqr6M7YjzPFAcR2oFT70CoBKQ4nan-on2siXKp6HH7Dtypss1oYRwGcMzqmmlmbwRyEWFbo6U1kP-VJEeVmpGLokQAtv1pGPKmAB50NkTaKKh0lx9Fg1F9ssJwLvGopQxPib0fY5HhzERXJjNKu2PjFKVlPpctXhpx1CrdjYJKoPpB9X7lZV-Ich18HBzr9M7AOgqQr2udOU3QflDbEYABhOMUQPb5__a-FHiyp5pBv_Ig";

export default function Search() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "";
  const q = params.get("q") || "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [sort, setSort] = useState("rating");
  const [sortOpen, setSortOpen] = useState(false);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [radiusKm, setRadiusKm] = useState(10);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    serviceService.categories().then((r) => setCategories(r.data)).catch(() => {});
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords(null)
      );
    }
  }, []);

  useEffect(() => {
    load();
  }, [category, sort, minRating, verifiedOnly, radiusKm, coords]);

  async function load() {
    setStatus("loading");
    try {
      let res;
      if (coords) {
        res = await providerService.nearby({ lat: coords.lat, lng: coords.lng, radiusKm, category: category || undefined });
      } else {
        res = await providerService.list({
          category: category || undefined,
          sort,
          minRating: minRating || undefined,
          verifiedOnly: verifiedOnly ? "true" : undefined,
          limit: 24,
        });
      }
      setProviders(res.data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  const activeCategory = categories.find((c) => c._id === category);
  const heading = activeCategory ? `${activeCategory.name}s near Chennai` : q ? `Results for "${q}"` : "Service Providers near Chennai";
  const activeSortLabel = SORT_OPTIONS.find((s) => s.value === sort)?.label || "Nearest";

  return (
    <div className="max-w-container-max mx-auto px-md lg:px-lg py-lg w-full">
      <div className="flex items-center justify-between mb-md flex-wrap gap-sm">
        <div>
          <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-xs">{heading}</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            {status === "ready" ? `Showing ${providers.length} results` : "Loading results..."}
            {coords && ` within ${radiusKm}km`}
          </p>
        </div>
        <div className="relative group">
          <button
            onClick={() => setSortOpen((s) => !s)}
            className="flex items-center gap-xs px-sm py-xs bg-surface-container rounded-full text-on-surface hover:bg-surface-container-high transition-colors shadow-sm"
          >
            <span className="font-label-lg text-label-lg">Sort by: {activeSortLabel}</span>
            <Icon name="keyboard_arrow_down" className="text-[18px]" />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.08)] z-10">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSort(opt.value);
                    setSortOpen(false);
                  }}
                  className={`w-full text-left px-sm py-xs font-label-lg text-label-lg transition-colors first:rounded-t-xl last:rounded-b-xl ${
                    sort === opt.value ? "text-primary bg-primary-fixed/30" : "text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg relative">
        {/* Filters Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-[104px] h-[calc(100vh-140px)] overflow-y-auto pb-lg pr-sm">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Filters</h2>
          <div className="space-y-lg">
            <div className="space-y-sm">
              <h3 className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider text-outline">Distance</h3>
              <input
                type="range"
                min={1}
                max={20}
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between font-label-md text-label-md text-on-surface-variant">
                <span>1km</span>
                <span className="text-primary font-bold">{radiusKm}km</span>
                <span>20km</span>
              </div>
              {!coords && <p className="text-label-md text-on-surface-variant">Enable location access to filter by distance.</p>}
            </div>

            <div className="space-y-sm">
              <h3 className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider text-outline">Minimum Rating</h3>
              <div className="flex gap-xs">
                {[3, 4, 5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setMinRating(minRating === r ? null : r)}
                    className={`w-10 h-10 rounded-full font-label-lg text-label-lg flex items-center justify-center transition-colors ${
                      minRating === r
                        ? "bg-primary text-on-primary shadow-[0_8px_24px_rgba(124,58,237,0.12)]"
                        : "bg-surface-container text-on-surface-variant hover:bg-primary hover:text-on-primary"
                    }`}
                  >
                    {r === 5 ? "5.0" : `${r}+`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-sm">
              <div className="flex items-center justify-between p-sm bg-surface-container-low rounded-xl">
                <span className="font-label-lg text-label-lg text-on-surface flex items-center gap-xs">
                  <Icon name="verified" filled className="text-[18px] text-primary" />
                  Verified Only
                </span>
                <button
                  onClick={() => setVerifiedOnly((v) => !v)}
                  className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${verifiedOnly ? "bg-primary" : "bg-outline-variant"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-on-primary rounded-full shadow-sm transition-transform ${verifiedOnly ? "translate-x-5" : "translate-x-1"}`} />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Results List */}
        <div className="col-span-1 lg:col-span-5 flex flex-col gap-md">
          {status === "loading" && <LoadingState message="Loading providers..." />}
          {status === "error" && <ErrorState message="Unable to load providers." onRetry={load} />}
          {status === "ready" && providers.length === 0 && (
            <EmptyState title="No providers found" subtitle="Try widening your distance filter or a different category." />
          )}
          {status === "ready" &&
            providers.map((p) => (
              <div
                key={p._id}
                className="bg-surface rounded-xl p-sm flex flex-col gap-sm shadow-[0_4px_12px_rgba(124,58,237,0.05)] hover:shadow-[0_8px_24px_rgba(124,58,237,0.12)] transition-shadow duration-300 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                <div className="flex gap-md">
                  <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden shadow-sm">
                    <img className="w-full h-full object-cover" src={p.userId?.profileImage || AVATAR_FALLBACK} alt={p.userId?.name} />
                    {p.verificationStatus === "VERIFIED" && (
                      <div className="absolute bottom-0 inset-x-0 bg-primary text-on-primary text-center py-base">
                        <span className="font-label-md text-label-md uppercase tracking-widest">Verified</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-xs">
                      <div>
                        <h3 className="font-headline-md text-headline-md text-on-surface truncate">{p.userId?.name}</h3>
                        <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-xs">
                          <Icon name="location_on" className="text-[16px]" />
                          {p.serviceArea} · {p.profession}
                        </p>
                      </div>
                      <button className="text-outline hover:text-error transition-colors">
                        <Icon name="favorite_border" />
                      </button>
                    </div>
                    <div className="flex items-center gap-sm mb-xs">
                      <div className="flex items-center gap-base text-tertiary-container bg-tertiary-fixed-dim/20 px-xs py-base rounded-md">
                        <Icon name="star" filled className="text-[14px]" />
                        <span className="font-label-lg text-label-lg">{p.rating.toFixed(1)}</span>
                      </div>
                      <span className="font-body-md text-body-md text-on-surface-variant">({p.reviewCount} reviews)</span>
                    </div>
                    <div className="font-label-lg text-label-lg text-on-surface">{p.experienceYears}+ years experience</div>
                  </div>
                </div>
                <div className="flex gap-sm mt-xs">
                  <button
                    onClick={() => navigate(`/providers/${p._id}`)}
                    className="flex-1 bg-surface border-[1.5px] border-primary text-primary font-label-lg text-label-lg py-sm rounded-xl hover:bg-surface-container-low transition-colors text-center shadow-sm"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => navigate(`/providers/${p._id}`)}
                    className="flex-1 bg-primary text-on-primary font-label-lg text-label-lg py-sm rounded-xl hover:bg-primary-container transition-colors shadow-[0_8px_24px_rgba(124,58,237,0.12)] text-center"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Real map — OpenStreetMap via Leaflet, no API key required */}
        <div className="hidden lg:block lg:col-span-4 rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(124,58,237,0.12)] sticky top-[104px] h-[calc(100vh-140px)]">
          <ProviderMap providers={providers} userLocation={coords} />
        </div>
      </div>
    </div>
  );
}
