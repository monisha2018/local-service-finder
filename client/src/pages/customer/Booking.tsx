import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { providerService } from "../../services/providerService";
import { bookingService } from "../../services/bookingService";
import { paymentService } from "../../services/paymentService";
import { favoriteService } from "../../services/favoriteService";
import { Provider, Service } from "../../types";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import Icon from "../../components/ui/Icon";

const TIME_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Booking() {
  const { providerId, serviceId } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [step, setStep] = useState<"details" | "review" | "success">("details");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bookingNumber, setBookingNumber] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  useEffect(() => {
    load();
  }, [providerId]);

  useEffect(() => {
    if (providerId && date) {
      providerService.getBookedSlots(providerId, date).then((r) => setBookedSlots(r.data)).catch(() => setBookedSlots([]));
    }
  }, [date]);

  async function load() {
    if (!providerId) return;
    setStatus("loading");
    try {
      const res = await providerService.getById(providerId);
      setProvider(res.data.provider);
      const svc = res.data.services.find((s: Service) => s._id === serviceId);
      setService(svc || res.data.services[0]);
      setStatus("ready");

      try {
        const favRes = await favoriteService.list();
        setIsFavorited(favRes.data.some((f: any) => f.providerId?._id === providerId));
      } catch {
        // non-critical — favorite status just won't be pre-checked
      }
    } catch {
      setStatus("error");
    }
  }

  async function toggleFavorite() {
    if (!provider) return;
    setFavBusy(true);
    try {
      if (isFavorited) {
        await favoriteService.remove(provider._id);
        setIsFavorited(false);
      } else {
        await favoriteService.add(provider._id);
        setIsFavorited(true);
      }
    } catch {
      // request failed — leave state as it was, button remains clickable to retry
    } finally {
      setFavBusy(false);
    }
  }

  async function handleConfirmAndPay() {
    if (!provider || !service) return;
    setSubmitting(true);
    setError("");
    try {
      const bookingRes = await bookingService.create({
        providerId: provider._id,
        serviceId: service._id,
        categoryId: (service.categoryId as any)._id || service.categoryId,
        scheduledDate: date,
        scheduledTime: time,
        address,
        latitude: provider.location?.coordinates?.[1] || 13.0827,
        longitude: provider.location?.coordinates?.[0] || 80.2707,
        description,
      });
      const booking = bookingRes.data;

      const orderRes = await paymentService.createOrder(booking._id);
      const { orderId, amount, currency, keyId } = orderRes.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: "Local Service Finder",
        description: service.name,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            await paymentService.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setBookingNumber(booking.bookingNumber);
            setBookingId(booking._id);
            setStep("success");
          } catch {
            setError("Payment verification failed. Please contact support with your booking number: " + booking.bookingNumber);
          }
        },
        theme: { color: "#630ED4" },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setError("Payment gateway failed to load. Please check your connection and try again.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to create booking. Please try a different time slot.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") return <LoadingState message="Loading booking details..." />;
  if (status === "error" || !provider || !service) return <ErrorState message="Unable to load booking details." onRetry={load} />;

  if (step === "success") {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 text-success flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Booking Confirmed!</h1>
        <p className="text-text-secondary mb-1">Your booking number is</p>
        <p className="font-mono font-bold text-primary text-lg mb-6">{bookingNumber}</p>
        <div className="flex flex-col gap-3 items-center">
          <Button onClick={() => navigate(`/bookings/${bookingId}`)}>View Booking Details</Button>
          <Button variant="secondary" onClick={() => navigate("/dashboard")}>View My Bookings</Button>
          <button
            onClick={toggleFavorite}
            disabled={favBusy}
            className={`flex items-center gap-1.5 text-sm font-semibold mt-2 transition-colors disabled:opacity-60 ${
              isFavorited ? "text-success" : "text-primary hover:underline"
            }`}
          >
            <Icon name="favorite" filled={isFavorited} className="text-[18px]" />
            {favBusy ? "Saving..." : isFavorited ? `Added ${provider.userId?.name} to Favorites` : `Add ${provider.userId?.name} to Favorites`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-text-primary mb-1">Book {service.name}</h1>
      <div className="flex items-center gap-3 mb-6">
        <p className="text-text-secondary">with {provider.userId?.name} · ₹{service.price}</p>
        <button
          onClick={toggleFavorite}
          disabled={favBusy}
          title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
          className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors disabled:opacity-60 ${
            isFavorited ? "bg-primary text-white" : "bg-surface-container text-primary hover:bg-surface-container-high"
          }`}
        >
          <Icon name="favorite" filled={isFavorited} className="text-[16px]" />
        </button>
      </div>

      {error && <p className="text-error text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {step === "details" && (
        <div className="card space-y-4">
          <Input label="Date" type="date" min={new Date().toISOString().split("T")[0]} value={date} onChange={(e) => setDate(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Time</label>
            <div className="grid grid-cols-4 gap-2">
              {TIME_SLOTS.map((slot) => {
                const taken = bookedSlots.includes(slot);
                return (
                  <button
                    key={slot}
                    disabled={taken}
                    onClick={() => setTime(slot)}
                    className={`py-2 rounded-lg text-sm font-semibold border ${
                      taken
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed line-through"
                        : time === slot
                        ? "bg-primary text-white border-primary"
                        : "border-border text-text-secondary hover:border-primary"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>
          <Input label="Service Address" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House no, street, area, Chennai" />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Describe the issue or any special instructions..."
            />
          </div>
          <Button className="w-full" disabled={!date || !time || !address} onClick={() => setStep("review")}>
            Review Booking
          </Button>
        </div>
      )}

      {step === "review" && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-lg">Review your booking</h2>
          <div className="space-y-2 text-sm">
            <Row label="Service" value={service.name} />
            <Row label="Provider" value={provider.userId?.name} />
            <Row label="Date" value={date} />
            <Row label="Time" value={time} />
            <Row label="Address" value={address} />
            <div className="flex justify-between pt-3 border-t border-border font-bold text-primary text-lg">
              <span>Total</span><span>₹{service.price}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setStep("details")}>Back</Button>
            <Button className="flex-1" onClick={handleConfirmAndPay} disabled={submitting}>
              {submitting ? "Processing..." : "Confirm & Pay"}
            </Button>
          </div>
          <p className="text-xs text-text-secondary text-center">Secure payment via Razorpay (test mode)</p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  );
}