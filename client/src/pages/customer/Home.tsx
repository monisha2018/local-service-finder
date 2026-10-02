import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { serviceService } from "../../services/serviceService";
import { Category } from "../../types";
import CategoryCard from "../../components/cards/CategoryCard";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import Icon from "../../components/ui/Icon";

const POPULAR_SEARCHES = ["Plumber", "Electrician", "House Cleaning"];

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDfPtcysSBrDHyGUuvPvfnK4PXdGAkjyBh7Sbm8mqzT0FesqmCZFJlrxI1tTcSzxMtOhbzKCxVnXcBpIUJJCSKUO9A9J89lqP3s3rwugRFPW9k6l2J-BZa7Yi8wlW9N6HszWbaojzBoV7q8YIIYm09DpbZJmGszTeIuG_UzRV1DtVsQhbIx6XPTtStGOfpVixSjsTELmBpirXfIbXbUoeyRISxBE6eajANJOx9RC-CranpW7ezZd2pW-A";
const PROVIDER_CTA_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDr1Xpgv7t8Vu1OJd-KM4ejM8LCbNKYKJylQMMHMiNuSQMEgXvNu-lkequzzKh64CcGI8L5AhW-JVdjvkqzxhYbl-WWGsc5G1E4XtuUp9BKZQJF_cIW9p09oD1-SN3Vg49yjSUPuBv3oUK41VBfcWuQM9D_Q9QmSY0zRb-hU1Eq0JEADIIzmo7hDSN8-lNIR99xqsbEI_vM7QvXigkQxCDgcdMkVoVABVj0LFf6H2JU6OpwMZ1g9PKzVA";

export default function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setStatus("loading");
    try {
      const res = await serviceService.categories();
      setCategories(res.data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(what)}&where=${encodeURIComponent(where)}`);
  }

  if (status === "loading") return <LoadingState message="Loading Local Service Finder..." />;
  if (status === "error") return <ErrorState message="Unable to load the home page right now." onRetry={load} />;

  return (
    <div className="w-full bg-background min-h-screen">
      <div className="flex flex-col w-full">
        {/* Hero */}
        <section className="relative w-full h-[600px] overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${HERO_IMAGE}')` }} />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="relative z-10 max-w-container-max mx-auto px-md lg:px-lg w-full flex flex-col md:flex-row items-center gap-lg">
            <div className="w-full md:w-3/5 flex flex-col gap-md">
              <div className="inline-flex items-center gap-xs bg-surface-container-low px-sm py-xs rounded-full shadow-sm w-max">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  Over 10,000 verified professionals
                </span>
              </div>
              <h1 className="font-display-lg text-display-lg text-on-surface">Find Trusted Local Professionals Near You</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                Book reliable electricians, plumbers, mechanics, tutors and more — all in one place. Fast, easy, and guaranteed.
              </p>
              <form onSubmit={handleSearch} className="bg-surface p-sm rounded-xl shadow-xl flex flex-col md:flex-row gap-xs mt-sm w-full max-w-3xl">
                <div className="flex-1 relative">
                  <Icon name="search" className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    value={what}
                    onChange={(e) => setWhat(e.target.value)}
                    className="w-full h-14 pl-12 pr-sm rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-[inset_0_0_0_1px_#E5E7EB] transition-shadow"
                    placeholder="What service do you need?"
                    type="text"
                  />
                </div>
                <div className="w-full md:w-[240px] relative hidden md:block">
                  <Icon name="location_on" className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    value={where}
                    onChange={(e) => setWhere(e.target.value)}
                    className="w-full h-14 pl-12 pr-sm rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-[inset_0_0_0_1px_#E5E7EB] transition-shadow"
                    placeholder="Zip code or City"
                    type="text"
                  />
                </div>
                <button
                  type="submit"
                  className="h-14 px-lg bg-primary text-on-primary font-label-lg text-label-lg rounded-lg shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all w-full md:w-auto"
                >
                  Search
                </button>
              </form>
              <div className="flex items-center gap-sm mt-sm flex-wrap">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => navigate(`/search?q=${encodeURIComponent(term)}`)}
                    className="px-sm py-xs bg-surface-container-lowest text-primary font-label-md text-label-md rounded-full shadow-sm hover:bg-surface-container-low transition-colors inline-flex items-center gap-xs"
                  >
                    Popular: {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Popular categories */}
        <section className="max-w-container-max mx-auto px-md lg:px-lg py-xl w-full">
          <div className="flex flex-col md:flex-row justify-between items-end mb-lg gap-md">
            <div className="flex flex-col gap-xs">
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Popular Categories</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Browse top-rated services requested by your neighbors.</p>
            </div>
            <button
              onClick={() => navigate("/search")}
              className="text-primary font-label-lg text-label-lg hover:text-primary-container transition-colors inline-flex items-center gap-xs group"
            >
              View all categories
              <Icon name="arrow_forward" className="text-[20px] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-sm md:gap-md">
            {categories.map((c) => (
              <CategoryCard key={c._id} category={c} />
            ))}
          </div>
        </section>

        {/* Provider CTA */}
        <section className="w-full bg-surface-container py-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-fixed rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-fixed rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-y-1/2 -translate-x-1/3 pointer-events-none" />
          <div className="max-w-container-max mx-auto px-md lg:px-lg relative z-10 flex flex-col md:flex-row items-center justify-between gap-xl">
            <div className="w-full md:w-1/2 flex flex-col gap-md">
              <h2 className="font-display-lg text-display-lg text-on-surface">Are you a professional?</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Join thousands of service providers who are growing their business with Local Service Finder. Get access to
                verified leads, manage bookings easily, and build your reputation in your community.
              </p>
              <ul className="flex flex-col gap-sm mt-sm">
                {["Zero sign-up fees", "Reach thousands of local customers", "Secure, hassle-free payments"].map((item) => (
                  <li key={item} className="flex items-start gap-sm">
                    <Icon name="check_circle" className="text-primary" />
                    <span className="font-body-md text-body-md text-on-surface">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-md flex gap-md">
                <button
                  onClick={() => navigate("/register")}
                  className="px-lg py-sm bg-primary text-on-primary font-label-lg text-label-lg rounded-lg shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  Become a Provider
                </button>
                <button className="px-lg py-sm bg-transparent text-primary font-label-lg text-label-lg rounded-lg hover:bg-primary/5 transition-colors">
                  Learn More
                </button>
              </div>
            </div>
            <div className="w-full md:w-1/2 relative h-[400px]">
              <div className="absolute inset-0 bg-cover bg-center rounded-2xl shadow-xl z-10" style={{ backgroundImage: `url('${PROVIDER_CTA_IMAGE}')` }} />
              <div className="absolute -bottom-6 -left-6 bg-surface-container-lowest p-sm rounded-xl shadow-lg z-20 flex items-center gap-sm">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <Icon name="star" className="text-on-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg text-on-surface">4.9/5 Average Rating</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">From 50k+ reviews</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
