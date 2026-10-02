import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { bookingService } from "../../services/bookingService";
import { paymentService } from "../../services/paymentService";
import { reviewService } from "../../services/reviewService";
import { complaintService } from "../../services/complaintService";
import { Booking } from "../../types";
import StatusBadge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PRIORITIES: { value: "LOW" | "MEDIUM" | "HIGH"; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

export default function BookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintSubject, setComplaintSubject] = useState("");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [complaintPriority, setComplaintPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [complaintError, setComplaintError] = useState("");
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    if (!id) return;
    setStatus("loading");
    try {
      const res = await bookingService.getById(id);
      setBooking(res.data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  async function handleCancel() {
    if (!id) return;
    setCancelling(true);
    try {
      await bookingService.cancel(id, "Cancelled by customer");
      load();
    } finally {
      setCancelling(false);
    }
  }

  async function handleContinuePayment() {
    if (!id || !booking) return;
    setPaying(true);
    setPayError("");
    try {
      const orderRes = await paymentService.createOrder(id);
      const { orderId, amount, currency, keyId } = orderRes.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: "Local Service Finder",
        description: booking.serviceId?.name,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            await paymentService.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            load();
          } catch {
            setPayError("Payment verification failed. Please try again or contact support.");
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
        theme: { color: "#630ED4" },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setPayError("Payment gateway failed to load. Please check your connection and try again.");
        setPaying(false);
      }
    } catch (err: any) {
      setPayError(err.response?.data?.message || "Unable to start payment. Please try again.");
      setPaying(false);
    }
  }

  async function submitReview() {
    if (!id) return;
    await reviewService.create({ bookingId: id, rating, comment });
    setReviewSubmitted(true);
  }

  async function submitComplaint(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setComplaintError("");
    setComplaintSubmitting(true);
    try {
      await complaintService.createComplaint({
        bookingId: id,
        subject: complaintSubject,
        description: complaintDescription,
        priority: complaintPriority,
      });
      setComplaintSubmitted(true);
      setShowComplaintForm(false);
    } catch (err: any) {
      setComplaintError(err.response?.data?.message || "Unable to submit your complaint. Please try again.");
    } finally {
      setComplaintSubmitting(false);
    }
  }

  if (status === "loading") return <LoadingState message="Loading booking..." />;
  if (status === "error" || !booking) return <ErrorState message="Unable to load this booking." onRetry={load} />;

  const canCancel = ["PENDING", "ACCEPTED", "CONFIRMED", "PROVIDER_ON_THE_WAY", "IN_PROGRESS"].includes(booking.status);
  const canPay = canCancel && booking.paymentStatus !== "SUCCESS";

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-text-secondary">{booking.bookingNumber}</span>
          <StatusBadge status={booking.status} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">{booking.serviceId?.name}</h1>
          <p className="text-text-secondary">with {booking.providerId?.userId?.name}</p>
        </div>
        <div className="space-y-2 text-sm border-t border-border pt-4">
          <div className="flex justify-between"><span className="text-text-secondary">Date</span><span>{new Date(booking.scheduledDate).toLocaleDateString()}</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">Time</span><span>{booking.scheduledTime}</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">Address</span><span className="text-right max-w-[60%]">{booking.address}</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">Payment</span><StatusBadge status={booking.paymentStatus} /></div>
          <div className="flex justify-between font-bold text-primary text-lg pt-2 border-t border-border">
            <span>Amount</span><span>₹{booking.amount}</span>
          </div>
        </div>

        {payError && <p className="text-error text-sm bg-red-50 px-3 py-2 rounded-lg">{payError}</p>}

        {canPay && (
          <p className="text-xs text-text-secondary bg-amber-50 px-3 py-2 rounded-lg">
            This booking hasn't been paid for yet. Complete payment to confirm it, or cancel if you no longer need it.
          </p>
        )}

        {(canPay || canCancel) && (
          <div className="flex gap-3">
            {canCancel && (
              <Button variant="danger" className="flex-1" onClick={handleCancel} disabled={cancelling || paying}>
                {cancelling ? "Cancelling..." : "Cancel Booking"}
              </Button>
            )}
            {canPay && (
              <Button className="flex-1" onClick={handleContinuePayment} disabled={paying || cancelling}>
                {paying ? "Processing..." : "Continue to Payment"}
              </Button>
            )}
          </div>
        )}
      </div>

      {booking.status === "COMPLETED" && !reviewSubmitted && (
        <div className="card mt-6">
          <h2 className="font-semibold mb-3">Leave a review</h2>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} className={`text-2xl ${n <= rating ? "text-accent-amber" : "text-gray-200"}`}>★</button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="input-field mb-3" rows={3} placeholder="How was your experience?" />
          <Button onClick={submitReview}>Submit Review</Button>
        </div>
      )}
      {reviewSubmitted && <p className="text-success text-sm mt-4 text-center">Thanks for your review!</p>}

      {/* Complaint — available on any booking, not just completed ones, since a problem can happen mid-service too */}
      <div className="card mt-6">
        {complaintSubmitted ? (
          <p className="text-success text-sm text-center">Your complaint has been submitted. Our team will review it and respond soon.</p>
        ) : !showComplaintForm ? (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-text-primary">Having an issue with this booking?</h2>
              <p className="text-sm text-text-secondary">File a complaint and our team will look into it.</p>
            </div>
            <Button variant="secondary" onClick={() => setShowComplaintForm(true)}>File a Complaint</Button>
          </div>
        ) : (
          <form onSubmit={submitComplaint} className="space-y-3">
            <h2 className="font-semibold text-text-primary mb-1">File a Complaint</h2>
            {complaintError && <p className="text-error text-sm bg-red-50 px-3 py-2 rounded-lg">{complaintError}</p>}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Subject</label>
              <input
                required
                minLength={3}
                value={complaintSubject}
                onChange={(e) => setComplaintSubject(e.target.value)}
                className="input-field"
                placeholder="Brief summary of the issue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Description</label>
              <textarea
                required
                minLength={10}
                value={complaintDescription}
                onChange={(e) => setComplaintDescription(e.target.value)}
                className="input-field"
                rows={4}
                placeholder="Describe what went wrong, in as much detail as you can"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Priority</label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setComplaintPriority(p.value)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                      complaintPriority === p.value ? "bg-primary text-white border-primary" : "border-border text-text-secondary"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" type="button" className="flex-1" onClick={() => setShowComplaintForm(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={complaintSubmitting}>
                {complaintSubmitting ? "Submitting..." : "Submit Complaint"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}