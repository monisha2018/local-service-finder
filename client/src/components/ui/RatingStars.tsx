import { Star } from "lucide-react";

export default function RatingStars({ rating, reviewCount, size = 14 }: { rating: number; reviewCount?: number; size?: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star size={size} className="fill-accent-amber text-accent-amber" />
      <span className="text-sm font-semibold text-text-primary">{rating.toFixed(1)}</span>
      {reviewCount !== undefined && <span className="text-xs text-text-secondary">({reviewCount})</span>}
    </div>
  );
}
