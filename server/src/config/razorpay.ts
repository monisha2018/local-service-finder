import Razorpay from "razorpay";
import { env } from "./env";

// Lazily constructed: if Razorpay test keys aren't set yet, the rest of the API
// (auth, providers, bookings, etc.) should still start up fine. Only payment
// endpoints will fail until real keys are added to .env.
let razorpayInstance: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env to accept payments."
    );
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: env.razorpayKeyId,
      key_secret: env.razorpayKeySecret,
    });
  }
  return razorpayInstance;
}
