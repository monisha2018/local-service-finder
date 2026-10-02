import { Link } from "react-router-dom";
import { MapPin, ShieldCheck } from "lucide-react";
import { Provider } from "../../types";
import RatingStars from "../ui/RatingStars";

export default function ProviderCard({ provider, distanceKm }: { provider: Provider; distanceKm?: number }) {
  return (
    <Link
      to={`/providers/${provider._id}`}
      className="card hover:shadow-md transition-shadow flex flex-col gap-3"
    >
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-lg shrink-0 overflow-hidden">
          {provider.userId?.profileImage ? (
            <img src={provider.userId.profileImage} alt={provider.userId.name} className="w-full h-full object-cover" />
          ) : (
            provider.userId?.name?.[0] || "?"
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-text-primary truncate">{provider.userId?.name}</p>
            {provider.verificationStatus === "VERIFIED" && <ShieldCheck size={16} className="text-primary shrink-0" />}
          </div>
          <p className="text-sm text-text-secondary truncate">{provider.profession}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <RatingStars rating={provider.rating} reviewCount={provider.reviewCount} />
        {distanceKm !== undefined && (
          <span className="flex items-center gap-1 text-xs text-text-secondary">
            <MapPin size={12} /> {distanceKm.toFixed(1)} km
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-xs text-text-secondary">{provider.experienceYears}+ yrs experience</span>
        <span className="text-xs font-semibold text-primary">{provider.serviceArea}</span>
      </div>
    </Link>
  );
}
