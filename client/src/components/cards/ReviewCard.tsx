import RatingStars from "../ui/RatingStars";

export default function ReviewCard({ review }: { review: any }) {
  return (
    <div className="border-b border-border py-4 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <p className="font-semibold text-sm text-text-primary">{review.customerId?.name || "Customer"}</p>
        <span className="text-xs text-text-secondary">{new Date(review.createdAt).toLocaleDateString()}</span>
      </div>
      <RatingStars rating={review.rating} />
      {review.comment && <p className="text-sm text-text-secondary mt-2">{review.comment}</p>}
    </div>
  );
}
