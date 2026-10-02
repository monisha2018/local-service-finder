import express, { Application } from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/errorHandler";

import authRoutes from "./routes/authRoutes";
import providerRoutes from "./routes/providerRoutes";
import serviceRoutes from "./routes/serviceRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import favoriteRoutes from "./routes/favoriteRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import complaintRoutes from "./routes/complaintRoutes";
import chatRoutes from "./routes/chatRoutes";
import adminRoutes from "./routes/adminRoutes";

export function createApp(): Application {
  const app = express();

  app.use(helmet());
    const allowedOrigins = [
    env.clientUrl,
    "capacitor://localhost", // Android/iOS app via Capacitor
    "http://localhost",
    "https://localhost",
  ];
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman) and anything in our allowlist
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    })
  );
  
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));
  if (env.nodeEnv !== "test") app.use(morgan("dev"));

  const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
  app.use("/api", apiLimiter);

  app.get("/api/health", (_req, res) => res.json({ success: true, message: "OK" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/providers", providerRoutes);
  app.use("/api/services", serviceRoutes); // includes GET /api/services/categories
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/favorites", favoriteRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/complaints", complaintRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
