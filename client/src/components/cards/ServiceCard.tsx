import { Service } from "../../types";

export default function ServiceCard({ service, onBook }: { service: Service; onBook?: () => void }) {
  return (
    <div className="card flex items-center justify-between gap-4">
      <div>
        <p className="font-semibold text-text-primary">{service.name}</p>
        {service.description && <p className="text-sm text-text-secondary mt-0.5">{service.description}</p>}
        <p className="text-xs text-text-secondary mt-1">{service.durationMinutes} min</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold text-primary text-lg">₹{service.price}</p>
        {onBook && (
          <button onClick={onBook} className="text-xs font-semibold text-primary hover:underline mt-1">
            Book Now
          </button>
        )}
      </div>
    </div>
  );
}
