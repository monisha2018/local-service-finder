import { useEffect, useState } from "react";
import { favoriteService } from "../../services/favoriteService";
import ProviderCard from "../../components/cards/ProviderCard";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";

export default function Favorites() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setStatus("loading");
    try {
      const res = await favoriteService.list();
      setFavorites(res.data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  if (status === "loading") return <LoadingState message="Loading favorites..." />;
  if (status === "error") return <ErrorState message="Unable to load favorites." onRetry={load} />;

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-10">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Favorites</h1>
      {favorites.length === 0 ? (
        <EmptyState title="No favorites yet" subtitle="Tap the heart on a provider's profile to save them here." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((f) => (
            <ProviderCard key={f._id} provider={f.providerId} />
          ))}
        </div>
      )}
    </div>
  );
}
