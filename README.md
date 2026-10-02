# Local Service Finder

A full-stack marketplace connecting customers with local service professionals (electricians, plumbers,
mechanics, tutors, cleaners, AC technicians, carpenters, painters, and more) in Chennai and beyond.
Three roles: **Customer**, **Service Provider**, **Admin**.

Built to match the Figma design (`kIBCPShnfwjG3DIQstE5J1`) and, for 7 of the 11 screens, a pixel-accurate
Google Stitch export — purple/indigo/lavender/pink/amber theme, Material Design 3 tokens, Material Symbols
icon font.

## Design fidelity notes

7 screens were rebuilt against exact Stitch markup/tokens: **Home, Search (Find Electricians), Provider
Profile, Customer Dashboard, Provider Booking Requests, Admin Provider Verification, Admin Analytics.**
These use exact Material Design 3 color/type tokens (`bg-surface-container`, `text-on-surface-variant`,
`font-headline-lg`, etc. — see `tailwind.config.js`) and the Material Symbols icon font instead of Lucide.

3 screens from the same Stitch export (`main_dashboard`, `usage_history`, `automations`) turned out to be
from an unrelated app ("EcoSync", a home energy monitor) and were **not** used — the corresponding pages
(Provider Dashboard, Provider Automations/Settings, and the customer's full bookings list) still use the
original hand-built styling from the Figma-only pass, not Stitch markup.

Wherever a mockup showed data with no real backing data (week-over-week trend percentages, invented "risk
scores", fabricated activity-log entries), that specific decorative element was **left out** rather than
faked — every number and list on every page is computed from real API/database data. See inline comments
in `admin/Dashboard.tsx` and `admin/Providers.tsx` for specifics.

An 8th screen — the real **Provider Dashboard** ("Good Morning, [Name]" with Today's Bookings, Pending
Requests, Total Earnings, Avg Rating, Active Jobs, and Earnings Overview) — was added afterward once the
correct mockup was found (the "main_dashboard" folder in the original zip export was, confusingly, screens
from an unrelated app and was never the real design for this page). All four stat cards and the "vs
yesterday" / "this week" deltas shown on it are computed from real booking and payment timestamps — never
fabricated percentages.

---

## 1. Tech Stack

**Frontend:** React 18, Vite, TypeScript, Tailwind CSS, React Router, Axios, Lucide Icons, Socket.IO client
**Backend:** Node.js, Express, TypeScript, Mongoose
**Database:** MongoDB (with 2dsphere geospatial indexes for nearby search)
**Auth:** JWT + bcrypt
**Payments:** Razorpay (test mode)
**Real-time:** Socket.IO (chat + booking status updates)

---

## 2. Folder Structure

```
local-service-finder/
├── server/                  # Express + TypeScript API
│   ├── src/
│   │   ├── config/          # db, env, razorpay
│   │   ├── models/          # 14 Mongoose models
│   │   ├── controllers/     # business logic per resource
│   │   ├── routes/          # Express routers
│   │   ├── middleware/      # auth, validation, error handling
│   │   ├── sockets/         # Socket.IO server
│   │   ├── seed/            # demo data seed script
│   │   └── server.ts        # entry point
│   ├── .env.example
│   └── package.json
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # ui/, cards/, layout/, common/
│   │   ├── pages/           # customer/, provider/, admin/, auth/, shared/
│   │   ├── layouts/         # CustomerLayout, DashboardLayout, AuthLayout
│   │   ├── context/         # AuthContext, NotificationContext
│   │   ├── services/        # Axios API layer, one file per resource
│   │   ├── types/           # shared TypeScript types
│   │   └── App.tsx          # routing
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## 3. Database Schema (MongoDB / Mongoose)

| Model | Purpose |
|---|---|
| `User` | All accounts (CUSTOMER / PROVIDER / ADMIN), geolocation, status |
| `ProviderProfile` | Provider details, 2dsphere location, verification, rating, working hours |
| `ServiceCategory` | Electrician, Plumber, Mechanic, Tutor, etc. |
| `Service` | A specific offering by a provider (name, price, duration) |
| `Booking` | Full booking lifecycle, state machine, commission split |
| `Payment` | Razorpay order/payment tracking, verified server-side only |
| `Review` | 1 review per completed booking, drives provider rating |
| `Favorite` | Customer ↔ Provider saved list |
| `Notification` | In-app notifications, read/unread |
| `Conversation` / `Message` | Chat between customer and provider |
| `Complaint` | Customer complaints tied to a booking, admin-managed |
| `ProviderAvailability` | Slot-blocking table — prevents double-booking at the DB level |
| `PlatformSettings` | Commission %, support contact info |

**Geospatial:** `User.location` and `ProviderProfile.location` are GeoJSON Points with `2dsphere` indexes,
used by `GET /api/providers/nearby?lat=&lng=&radiusKm=`.

**Double-booking prevention:** `POST /api/bookings` runs inside a MongoDB transaction that atomically
inserts a row into `ProviderAvailability` with a unique compound index on `(providerId, date, time)`. A
second concurrent request for the same slot fails with a `409` — this is enforced at the database level,
not just in the UI.

---

## 4. API Documentation

Base URL: `/api`

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| POST | `/auth/logout` | Public |
| GET | `/auth/me` | Authenticated |

### Providers
| Method | Endpoint | Access |
|---|---|---|
| GET | `/providers?category=&minRating=&sort=&page=` | Public |
| GET | `/providers/nearby?lat=&lng=&radiusKm=&category=` | Public |
| GET | `/providers/:id` | Public |
| GET | `/providers/:id/reviews` | Public |
| GET | `/providers/:id/booked-slots?date=` | Public |
| POST / PUT | `/providers/profile` | Provider |
| PUT | `/providers/availability` | Provider |

### Services
| Method | Endpoint | Access |
|---|---|---|
| GET | `/services/categories` | Public |
| GET | `/services?category=&q=&providerId=` | Public |
| POST | `/services` | Provider |
| PUT / DELETE | `/services/:id` | Provider (owner only) |

### Bookings
| Method | Endpoint | Access |
|---|---|---|
| POST | `/bookings` | Customer |
| GET | `/bookings` | Authenticated (role-scoped) |
| GET | `/bookings/:id` | Owner / Admin |
| PATCH | `/bookings/:id/status` | Provider / Admin — enforces state machine |
| PATCH | `/bookings/:id/cancel` | Owner |

**Booking state machine:**
`PENDING → ACCEPTED → CONFIRMED → PROVIDER_ON_THE_WAY → IN_PROGRESS → COMPLETED`
with `CANCELLED` / `REJECTED` / `REFUNDED` branches. Invalid transitions return `400`.

### Payments (Razorpay, INR, test mode)
| Method | Endpoint | Access |
|---|---|---|
| POST | `/payments/create-order` | Customer |
| POST | `/payments/verify` | Customer — **only place a payment can be marked SUCCESS**, verifies HMAC signature server-side |
| POST | `/payments/refund` | Admin |

### Reviews / Favorites / Notifications / Complaints / Chat
Standard CRUD, all protected — see `src/routes/*.ts` for exact paths.

### Admin (`/admin/*`, all require ADMIN role)
`/dashboard`, `/users`, `/users/:id/suspend`, `/providers`, `/providers/:id/verify`,
`/bookings`, `/payments`, `/reviews`, `/complaints`, `/categories`, `/settings`.

---

## 5. Environment Variables

**server/.env**
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/local-service-finder
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=replace_with_razorpay_test_secret
CLIENT_URL=http://localhost:5173
PLATFORM_COMMISSION_PERCENT=10
```

**client/.env**
```
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
VITE_MAP_API_KEY=your_google_maps_api_key
```

Never commit real `.env` files — only `.env.example` is checked in.

---

## 6. Setup & Run

```bash
# 1. Backend
cd server
cp .env.example .env        # fill in your MongoDB URI + Razorpay test keys
npm install
npm run dev                 # http://localhost:5000

# 2. Seed demo data (in a second terminal)
npm run seed                # 10 customers, 20 providers, 10 categories, 30 services, 50 bookings, ~100 reviews

# 3. Frontend (in a third terminal)
cd ../client
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

### Demo credentials (after seeding)
| Role | Email | Password |
|---|---|---|
| Admin | admin@localservicefinder.com | Admin@123 |
| Customer | customer1@example.com (through customer10) | Customer@123 |
| Provider | provider1@example.com (through provider20) | Provider@123 |

---

## 7. Test Commands

```bash
cd server && npx tsc --noEmit    # backend type-check (already verified clean)
cd client && npx tsc -b --noEmit # frontend type-check (already verified clean)
cd client && npm run build       # production build (already verified passes)
```

No automated test suite is included yet — see "Known Limitations" below. Manually verify:
- Customer cannot access `/admin/*` or another customer's booking (403)
- Provider cannot modify another provider's booking (403)
- Duplicate review on the same booking → 409
- Booking the same provider/date/time slot twice → 409 (transaction-enforced)
- Payment only marks `SUCCESS` after server-side Razorpay signature verification

---

## 8. Deployment

**Frontend (Vercel/Netlify):** deploy `client/`, set `VITE_API_URL` to your deployed backend's `/api` URL.
**Backend (Render/Railway):** deploy `server/`, run `npm run build && npm start`, set all env vars from
`.env.example`, set `CLIENT_URL` to your deployed frontend's URL.
**Database:** MongoDB Atlas — whitelist your backend host's IP, run `npm run seed` once against the
Atlas connection string to populate demo data (optional).

---

## 9. Known Limitations

- No automated test suite (Jest/Vitest) — flagged above as an area to add next.
- File uploads (profile images, verification documents) are stubbed in the UI (`Verification.tsx`) but
  the backend doesn't yet have a Multer/S3 upload endpoint wired in — `verificationDocs` exists on the
  model and is ready for one.
- Map view (Google Maps / distance visualization) is not implemented — `/providers/nearby` returns
  geospatially sorted data, but the frontend doesn't render a map, only a list.
- Not every one of the 11 Figma frames was pulled with pixel-level `get_design_context` fidelity — the
  extracted design tokens (colors, type, radii, shadows) were applied consistently, and each page's
  structure was built from the frame names/content already surfaced, rather than a per-pixel recreation
  of all 11 screens.
- Refunds call the Razorpay refund API but there's no webhook handler for asynchronous refund status
  updates — it assumes the synchronous response.
- Rate limiting is a single blanket limiter on `/api`; production would want per-route limits (e.g.
  stricter on `/auth/login`).

## 10. Future Improvements

- Add Jest/Vitest + Supertest test suite for the backend, React Testing Library for the frontend.
- Wire up real file uploads (Multer → S3/Cloudinary) for profile images and verification docs.
- Add a Google Maps view to the search/nearby results and booking address picker.
- Move from JWT-in-localStorage to httpOnly cookies for stronger XSS protection.
- Add Razorpay webhook handling for refunds and payment failures.
- Code-split the frontend bundle (currently one ~1MB chunk — Vite already flags this).
