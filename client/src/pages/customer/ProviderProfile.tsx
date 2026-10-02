import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { providerService } from "../../services/providerService";
import { favoriteService } from "../../services/favoriteService";
import { useAuth } from "../../context/AuthContext";
import { Provider, Service } from "../../types";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import Icon from "../../components/ui/Icon";

const BANNER_FALLBACK =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBFJURLlXUor4i6PhFq0zVc1djCLO1gUUlvOaVhNjEy1VtImKf5_dK6gG9mGLZDFNOo9tt9ZPlbKuJdp4geZHxHIeF_ON7-h3XAA1Zo--W36zR_KefiknQH2ym8FXbfw5PXWRAqKgcZN822ImWyddlie5YQh6yauTZJe2e8yl8c9zIN1JFdM_41Ar3ndtsGEdbrpXA7k-SNDGulAZTkCZ2GxkH5fWZ4QtLs6ma-CtOltLjM2-Z2-DswJw";
const AVATAR_FALLBACK =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAwrQJr1sQMnM82kIz8GFGawQ-a8Jc-k-TShefPvYRY9wu5Tuv6GwAUZWeGFdYFNF_ZLaaHT8TlhkRb2dU8uxwZkx4iV8vg6PKp8JHLLpIeC6ODTTrV50sdWmiE251OdmW7SeM3P1vuJshRCretJfsoQNgXycAX2_yuXMHygd49XSAEAgElOLJNv744GShu9f1yh_lIkLutRsNyflszIhU3olwRusWU2-B0bDrrpu-dpEQP1EIR5Y7Bcg";

const DAY_LABELS: Record<string, string> = {
  MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday", SUN: "Sunday",
};
const DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function ProviderProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [isFavorited, setIsFavorited] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    if (!id) return;
    setStatus("loading");
    try {
      const [profRes, reviewRes] = await Promise.all([providerService.getById(id), providerService.getReviews(id)]);
      setProvider(profRes.data.provider);
      setServices(profRes.data.services);
      setReviews(reviewRes.data.reviews);
      setStatus("ready");

      if (user?.role === "CUSTOMER") {
        try {
          const favRes = await favoriteService.list();
          setIsFavorited(favRes.data.some((f: any) => f.providerId?._id === id));
        } catch {
          // non-critical — favorite status just won't be pre-checked
        }
      }
    } catch {
      setStatus("error");
    }
  }

  async function toggleFavorite() {
    if (!user) return navigate("/login");
    if (user.role !== "CUSTOMER" || !id) return;
    setFavBusy(true);
    try {
      if (isFavorited) {
        await favoriteService.remove(id);
        setIsFavorited(false);
      } else {
        await favoriteService.add(id);
        setIsFavorited(true);
      }
    } catch {
      // request failed — leave state as it was, button remains clickable to retry
    } finally {
      setFavBusy(false);
    }
  }

  if (status === "loading") return <LoadingState message="Loading provider profile..." />;
  if (status === "error" || !provider) return <ErrorState message="Unable to load this provider's profile." onRetry={load} />;

  const sortedHours = [...(provider as any).workingHours || []].sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
  );

  return (
    <div className="w-full">
      {/* Banner + avatar */}
      <div
        className="relative w-full h-[320px] bg-cover bg-center rounded-b-xl shadow-md mb-xl"
        style={{ backgroundImage: `url('${BANNER_FALLBACK}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent rounded-b-xl" />
        <div className="absolute bottom-0 left-0 w-full px-md lg:px-lg max-w-container-max mx-auto translate-y-1/2 flex flex-col md:flex-row items-end md:items-center gap-md">
          <div className="relative w-32 h-32 md:w-40 md:h-40 shrink-0">
            <div
              className="w-full h-full rounded-full bg-cover bg-center shadow-xl z-10 relative"
              style={{ backgroundImage: `url('${provider.userId?.profileImage || AVATAR_FALLBACK}')` }}
            />
            {provider.verificationStatus === "VERIFIED" && (
              <div className="absolute -bottom-2 -right-2 bg-surface p-1 rounded-full shadow-md z-20">
                <div className="w-8 h-8 bg-[#E6F4EA] rounded-full flex items-center justify-center">
                  <Icon name="verified" filled className="text-[#137333] text-[20px]" />
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 pb-4 md:pb-0 z-10 w-full">
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-background mb-xs">{provider.userId?.name}</h1>
            <div className="flex flex-wrap items-center gap-sm">
              <span className="font-headline-md text-headline-md text-primary">{provider.profession}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
              <div className="flex items-center gap-base">
                <Icon name="star" filled className="text-[#F9AB00] text-[20px]" />
                <span className="font-label-lg text-label-lg text-on-surface">{provider.rating.toFixed(1)}</span>
                <span className="font-body-md text-body-md text-on-surface-variant">({provider.reviewCount} reviews)</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
              <div className="flex items-center gap-base text-on-surface-variant font-body-md text-body-md">
                <Icon name="work_history" className="text-[20px]" />
                {provider.experienceYears}+ Years Exp.
              </div>
            </div>
          </div>
          <div className="z-10 pb-4 md:pb-0 shrink-0 w-full md:w-auto">
            <button
              onClick={() => services[0] && navigate(`/book/${provider._id}/${services[0]._id}`)}
              disabled={services.length === 0}
              className="w-full md:w-auto bg-primary text-on-primary font-label-lg text-label-lg px-md py-sm rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-xs disabled:opacity-50"
            >
              <Icon name="calendar_month" className="text-[20px]" />
              Book Appointment
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-container-max mx-auto px-md lg:px-lg mt-16 md:mt-24 mb-xl w-full grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <div className="lg:col-span-2 flex flex-col gap-xl">
          {/* About */}
          <section className="bg-surface-container rounded-xl p-md md:p-lg shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm relative z-10">About {provider.userId?.name?.split(" ")[0]}</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-md relative z-10">
              {provider.bio || "This provider hasn't added a bio yet."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md relative z-10">
              <div className="flex flex-col gap-xs">
                <span className="font-label-md text-label-md text-outline uppercase tracking-wider">Service Area</span>
                <div className="flex items-center gap-xs font-body-md text-body-md text-on-surface">
                  <Icon name="location_on" className="text-primary" />
                  {provider.serviceArea || "Not specified"}
                </div>
              </div>
              <div className="flex flex-col gap-xs">
                <span className="font-label-md text-label-md text-outline uppercase tracking-wider">Languages</span>
                <div className="flex items-center gap-xs font-body-md text-body-md text-on-surface">
                  <Icon name="translate" className="text-primary" />
                  {(provider as any).languages?.join(", ") || "Not specified"}
                </div>
              </div>
            </div>
          </section>

          {/* Services */}
          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-md">Services & Pricing</h2>
            <div className="bg-surface rounded-xl shadow-sm overflow-hidden flex flex-col">
              {services.length === 0 && (
                <p className="p-md font-body-md text-body-md text-on-surface-variant">No services listed yet.</p>
              )}
              {services.map((s) => (
                <div
                  key={s._id}
                  className="p-md hover:bg-surface-container-low transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md border-b border-surface-variant last:border-b-0 group"
                >
                  <div className="flex-1">
                    <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">{s.name}</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant">{s.description}</p>
                  </div>
                  <div className="flex items-center gap-md sm:gap-lg w-full sm:w-auto justify-between sm:justify-end">
                    <span className="font-headline-md text-headline-md text-on-surface font-semibold">₹{s.price}</span>
                    <button
                      onClick={() => navigate(`/book/${provider._id}/${s._id}`)}
                      className="bg-surface text-primary border-[1.5px] border-primary font-label-lg text-label-lg px-sm py-xs rounded-lg shadow-sm hover:shadow-md transition-all group-hover:bg-primary group-hover:text-on-primary"
                    >
                      Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Reviews */}
          <section>
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Client Reviews</h2>
            </div>
            {reviews.length === 0 ? (
              <p className="font-body-md text-body-md text-on-surface-variant">No reviews yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-md">
                {reviews.slice(0, 6).map((r) => (
                  <div key={r._id} className="bg-surface-container rounded-xl p-md shadow-sm flex flex-col gap-sm">
                    <div className="flex items-center gap-sm">
                      <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center font-headline-md text-headline-md text-primary">
                        {r.customerId?.name?.[0] || "?"}
                      </div>
                      <div>
                        <div className="font-label-lg text-label-lg text-on-surface">{r.customerId?.name || "Customer"}</div>
                        <div className="text-body-md font-body-md text-on-surface-variant text-sm">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex text-[#F9AB00]">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Icon key={n} name="star" filled={n <= r.rating} className="text-[16px]" />
                      ))}
                    </div>
                    {r.comment && <p className="font-body-md text-body-md text-on-surface-variant">"{r.comment}"</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-lg">
          <div className="bg-surface p-md rounded-xl shadow-sm sticky top-24">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-md flex items-center gap-xs">
              <Icon name="schedule" className="text-primary" />
              Working Hours
            </h3>
            <ul className="flex flex-col gap-xs font-body-md text-body-md">
              {DAY_ORDER.map((day, i) => {
                const entry = sortedHours.find((h: any) => h.day === day);
                return (
                  <li key={day} className={`flex justify-between items-center text-on-surface py-xs ${i > 0 ? "border-t border-surface-variant" : ""}`}>
                    <span>{DAY_LABELS[day]}</span>
                    <span>{entry?.isWorking ? `${entry.startTime} – ${entry.endTime}` : "Closed"}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-md pt-md border-t border-surface-variant">
              <div className="flex flex-col gap-sm">
                <div className="flex items-center gap-md">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                    <Icon name="verified_user" className="text-primary" />
                  </div>
                  <div>
                    <div className="font-label-lg text-label-lg text-on-surface">Background Checked</div>
                    <div className="font-body-md text-body-md text-on-surface-variant text-sm">
                      {provider.verificationStatus === "VERIFIED" ? "Identity verified" : "Pending verification"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-md">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                    <Icon name="workspace_premium" className="text-primary" />
                  </div>
                  <div>
                    <div className="font-label-lg text-label-lg text-on-surface">Licensed Professional</div>
                    <div className="font-body-md text-body-md text-on-surface-variant text-sm">TN Govt Certified</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={toggleFavorite}
            disabled={favBusy}
            className={`p-md rounded-xl shadow-sm flex items-center justify-center gap-xs font-label-lg text-label-lg transition-colors disabled:opacity-60 ${
              isFavorited ? "bg-primary text-on-primary hover:bg-primary-container" : "bg-surface text-primary hover:bg-surface-container-low"
            }`}
          >
            <Icon name="favorite" filled={isFavorited} />
            {favBusy ? "Saving..." : isFavorited ? "Added to Favorites" : "Add to Favorites"}
          </button>
          <button
            onClick={() => navigate(`/messages?provider=${provider._id}`)}
            className="bg-surface p-md rounded-xl shadow-sm flex items-center justify-center gap-xs font-label-lg text-label-lg text-primary hover:bg-surface-container-low transition-colors"
          >
            <Icon name="chat" />
            Message
          </button>
        </div>
      </div>
    </div>
  );
}