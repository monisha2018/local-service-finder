/**
 * DEMO SEED DATA — for local development only.
 * Run with: npm run seed
 * Creates: 10 customers, 20 providers (verified), 10 categories, 30 services,
 * ~50 bookings, ~100 reviews, using realistic Chennai-area sample data.
 */
import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { User } from "../models/User";
import { ProviderProfile } from "../models/ProviderProfile";
import { ServiceCategory } from "../models/ServiceCategory";
import { Service } from "../models/Service";
import { Booking } from "../models/Booking";
import { Review } from "../models/Review";
import { PlatformSettings } from "../models/PlatformSettings";

const CHENNAI_AREAS = [
  { area: "T Nagar", lat: 13.0418, lng: 80.2341 },
  { area: "Adyar", lat: 13.0067, lng: 80.2570 },
  { area: "Velachery", lat: 12.9789, lng: 80.2201 },
  { area: "Anna Nagar", lat: 13.0850, lng: 80.2101 },
  { area: "Mylapore", lat: 13.0339, lng: 80.2619 },
  { area: "Nungambakkam", lat: 13.0603, lng: 80.2420 },
  { area: "Porur", lat: 13.0382, lng: 80.1565 },
  { area: "Tambaram", lat: 12.9249, lng: 80.1000 },
  { area: "OMR / Sholinganallur", lat: 12.9010, lng: 80.2279 },
  { area: "Perambur", lat: 13.1141, lng: 80.2329 },
];

const CATEGORIES = [
  { name: "Electrician", slug: "electrician", icon: "bolt" },
  { name: "Plumber", slug: "plumber", icon: "water_drop" },
  { name: "Mechanic", slug: "mechanic", icon: "build" },
  { name: "Tutor", slug: "tutor", icon: "school" },
  { name: "Cleaning", slug: "cleaning", icon: "cleaning_services" },
  { name: "AC Repair", slug: "ac-repair", icon: "ac_unit" },
  { name: "Carpenter", slug: "carpenter", icon: "carpenter" },
  { name: "Painter", slug: "painter", icon: "format_paint" },
  { name: "Computer Repair", slug: "computer-repair", icon: "computer" },
  { name: "Mobile Repair", slug: "mobile-repair", icon: "smartphone" },
];

const FIRST_NAMES = ["Ravi", "Priya", "Karthik", "Divya", "Suresh", "Lakshmi", "Arun", "Meena", "Vijay", "Kavya",
  "Senthil", "Deepa", "Ganesh", "Nithya", "Bala", "Anitha", "Kumar", "Swathi", "Rajesh", "Preethi"];
const LAST_NAMES = ["Kumar", "Raman", "Subramaniam", "Iyer", "Pillai", "Nair", "Krishnan", "Murthy", "Rao", "Sundaram"];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  await connectDB();
  console.log("[seed] Clearing existing demo collections...");
  await Promise.all([
    User.deleteMany({}), ProviderProfile.deleteMany({}), ServiceCategory.deleteMany({}),
    Service.deleteMany({}), Booking.deleteMany({}), Review.deleteMany({}), PlatformSettings.deleteMany({}),
  ]);

  await PlatformSettings.create({ commissionPercent: 10 });

  console.log("[seed] Creating categories...");
  const categories = await ServiceCategory.insertMany(CATEGORIES);

  console.log("[seed] Creating admin...");
  const adminPass = await bcrypt.hash("Admin@123", 10);
  await User.create({
    name: "Platform Admin", email: "admin@localservicefinder.com", phone: "9800000000",
    passwordHash: adminPass, role: "ADMIN",
  });

  console.log("[seed] Creating 10 customers...");
  const customers = [];
  for (let i = 0; i < 10; i++) {
    const area = rand(CHENNAI_AREAS);
    const passwordHash = await bcrypt.hash("Customer@123", 10);
    const customer = await User.create({
      name: `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`,
      email: `customer${i + 1}@example.com`,
      phone: `98${randInt(10000000, 99999999)}`,
      passwordHash,
      role: "CUSTOMER",
      location: { type: "Point", coordinates: [area.lng, area.lat], city: "Chennai", area: area.area },
    });
    customers.push(customer);
  }

  console.log("[seed] Creating 20 providers with services...");
  const providers = [];
  const services = [];
  for (let i = 0; i < 20; i++) {
    const area = rand(CHENNAI_AREAS);
    const category = rand(categories);
    const passwordHash = await bcrypt.hash("Provider@123", 10);
    const name = `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`;
    const user = await User.create({
      name, email: `provider${i + 1}@example.com`, phone: `97${randInt(10000000, 99999999)}`,
      passwordHash, role: "PROVIDER",
      location: { type: "Point", coordinates: [area.lng, area.lat], city: "Chennai", area: area.area },
    });

    const profile = await ProviderProfile.create({
      userId: user._id,
      profession: `${category.name} Services`,
      bio: `Experienced ${category.name.toLowerCase()} professional serving ${area.area} and nearby areas of Chennai.`,
      experienceYears: randInt(1, 20),
      categories: [category._id],
      serviceArea: area.area,
      location: { type: "Point", coordinates: [area.lng, area.lat] },
      languages: ["English", "Tamil"],
      verificationStatus: i < 16 ? "VERIFIED" : "PENDING", // 16 verified, 4 pending — realistic mix
      rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
      reviewCount: 0,
      workingHours: ["MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => ({
        day, startTime: "09:00", endTime: "18:00", isWorking: true,
      })),
      isAvailable: true,
    });
    providers.push(profile);

    for (let s = 0; s < randInt(1, 2); s++) {
      const svc = await Service.create({
        providerId: profile._id,
        categoryId: category._id,
        name: `${category.name} - ${["Basic Visit", "Full Service", "Emergency Callout"][s % 3]}`,
        description: `Professional ${category.name.toLowerCase()} service, quality guaranteed.`,
        price: randInt(299, 2999),
        durationMinutes: rand([30, 60, 90, 120]),
      });
      services.push(svc);
    }
  }

  console.log("[seed] Creating ~50 bookings...");
  const bookings = [];
  const statuses: any[] = ["PENDING", "ACCEPTED", "CONFIRMED", "COMPLETED", "COMPLETED", "COMPLETED", "CANCELLED"];
  for (let i = 0; i < 50; i++) {
    const customer = rand(customers);
    const service = rand(services);
    const provider = providers.find((p) => String(p._id) === String(service.providerId))!;
    const status = rand(statuses);
    const commission = Math.round(service.price * 0.1);

    const booking = await Booking.create({
      bookingNumber: `LSF-2026-${String(i + 1).padStart(6, "0")}`,
      customerId: customer._id,
      providerId: provider._id,
      serviceId: service._id,
      categoryId: service.categoryId,
      scheduledDate: new Date(Date.now() + randInt(-20, 20) * 86400000),
      scheduledTime: rand(["09:00", "11:00", "14:00", "16:00", "17:30"]),
      address: `${randInt(1, 200)}, ${customer.location?.area} Main Road, Chennai`,
      location: customer.location,
      description: "Booked via demo seed data.",
      amount: service.price,
      commissionAmount: commission,
      providerAmount: service.price - commission,
      status,
      paymentStatus: status === "COMPLETED" || status === "CONFIRMED" ? "SUCCESS" : "PENDING",
    });
    bookings.push(booking);
  }

  console.log("[seed] Creating ~100 reviews for completed bookings...");
  const completed = bookings.filter((b) => b.status === "COMPLETED");
  const comments = [
    "Excellent service, arrived on time and did great work.",
    "Very professional and courteous. Highly recommend.",
    "Good work overall, would book again.",
    "Fixed the issue quickly, fair pricing.",
    "Friendly and knowledgeable. Five stars!",
  ];
  let reviewCount = 0;
  for (const booking of completed) {
    for (let r = 0; r < randInt(1, 3); r++) {
      if (reviewCount >= 100) break;
      try {
        await Review.create({
          bookingId: reviewCount < completed.length ? booking._id : new mongoose.Types.ObjectId(),
          customerId: booking.customerId,
          providerId: booking.providerId,
          rating: randInt(3, 5),
          comment: rand(comments),
        });
        reviewCount++;
      } catch {
        // duplicate bookingId (unique index) — skip, this is demo data
      }
    }
  }

  console.log(`[seed] Done. ${customers.length} customers, ${providers.length} providers, ${services.length} services, ${bookings.length} bookings, ${reviewCount} reviews.`);
  console.log("[seed] Demo login credentials:");
  console.log("  Admin:    admin@localservicefinder.com / Admin@123");
  console.log("  Customer: customer1@example.com / Customer@123");
  console.log("  Provider: provider1@example.com / Provider@123");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
