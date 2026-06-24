# MoveO — Project Documentation

---

## 1. Project Overview

**MoveO** is a mobile ride-sharing application built for the Indian market. It lets riders book cab rides end-to-end — from searching a destination on a live map, selecting an available driver with estimated fares in INR, paying via Stripe, and chatting with an AI-powered driver persona in real time after booking.

**Problem it solves:** Provides a full-stack, self-contained ride-hailing experience with real-time driver chat backed by a conversational AI (Google Gemini), removing the need for a live driver-side app during development or demo.

**Target users:** Individual riders in India who want to book point-to-point cab rides via a polished mobile app on iOS or Android.

---

## 2. Tech Stack

### Frontend / Mobile
| Technology | Version | Purpose |
|---|---|---|
| React Native | 0.81.5 | Cross-platform mobile framework |
| Expo | ~54.0.33 | Managed workflow, build tooling |
| Expo Router | ~6.0.23 | File-based routing (screens + API routes) |
| NativeWind | ^4.2.3 | Tailwind CSS utility classes for React Native |
| Tailwind CSS | ^3.4.19 | Utility-first CSS (compiled by NativeWind) |
| TypeScript | ~5.9.2 | Static typing |
| React | 19.1.0 | UI library |

### State Management
| Technology | Version | Purpose |
|---|---|---|
| Zustand | ^5.0.12 | Lightweight client state (location, selected driver) |

### Maps & Navigation
| Technology | Version | Purpose |
|---|---|---|
| react-native-maps | 1.20.1 | Interactive map rendering |
| react-native-maps-directions | ^1.9.0 | Route polyline on map |
| react-native-google-places-autocomplete | ^2.6.4 | Address search input |
| Google Maps API | — | Place search, geocoding |
| Google Directions API | — | Route calculation, ETA, distance |

### Authentication
| Technology | Version | Purpose |
|---|---|---|
| @clerk/expo | ^3.1.4 | Email/password auth + Google OAuth |
| expo-secure-store | ~15.0.8 | Persistent token cache |

### Payments
| Technology | Version | Purpose |
|---|---|---|
| @stripe/stripe-react-native | ^0.50.3 | Payment sheet UI |
| stripe (server SDK) | ^21.0.1 | Payment intent creation (server-side) |

### Backend / API
| Technology | Version | Purpose |
|---|---|---|
| Expo Router API routes | ~6.0.23 | Serverless API endpoints (Node.js runtime) |
| @neondatabase/serverless | ^1.0.2 | Neon PostgreSQL client (serverless-compatible) |

### Database & Real-time
| Technology | Version | Purpose |
|---|---|---|
| Neon PostgreSQL | — | Persistent relational data (users, drivers, rides) |
| Firebase Firestore | ^12.11.0 (client) / ^13.10.0 (admin) | Real-time chat rooms and messages |

### AI
| Technology | Version | Purpose |
|---|---|---|
| @google/genai | ^2.7.0 | Google Gemini 2.5 Flash — AI driver chat replies |

### UI Components & Utilities
| Technology | Version | Purpose |
|---|---|---|
| @gorhom/bottom-sheet | ^5.2.8 | Slide-up driver selection panel |
| @expo/vector-icons | ^15.0.3 | Ionicons icon set |
| expo-location | ~19.0.8 | Device GPS + reverse geocoding |
| expo-image | ~3.0.11 | Optimized image component |
| react-native-modal | ^14.0.0-rc.1 | Success/confirmation modals |
| react-native-swiper | ^1.6.0 | Welcome onboarding carousel |
| react-native-reanimated | ~4.1.1 | Animated UI elements (typing dots) |

---

## 3. Project Structure

```
moveo/
├── app/                          # All screens and API routes (Expo Router)
│   ├── _layout.tsx               # Root layout: ClerkProvider, font loading, LaunchScreen overlay
│   ├── index.tsx                 # Entry point: redirects to auth or home based on auth state
│   ├── modal.tsx                 # Generic modal screen
│   │
│   ├── (auth)/                   # Unauthenticated screens (no bottom tab bar)
│   │   ├── _layout.tsx           # Auth stack layout
│   │   ├── welcome.tsx           # Onboarding swiper carousel
│   │   ├── sign-in.tsx           # Email/password sign-in + MFA email code verification
│   │   └── sign-up.tsx           # Email/password registration + email verification
│   │
│   ├── (root)/                   # Authenticated screens
│   │   ├── _layout.tsx           # Root stack layout (guards unauthenticated access)
│   │   ├── find-ride.tsx         # Step 1: pick origin/destination via Google Places
│   │   ├── confirm-ride.tsx      # Step 2: choose driver from bottom sheet list
│   │   ├── book-ride.tsx         # Step 3: review fare + Stripe payment
│   │   │
│   │   └── (tabs)/               # Bottom tab navigator
│   │       ├── _layout.tsx       # Tab bar config (Home, Rides, Chat, Profile)
│   │       ├── home.tsx          # Dashboard: map, destination search, ride stats, recent rides
│   │       ├── rides.tsx         # Full ride history with pull-to-refresh
│   │       ├── chat.tsx          # Conversation list + in-app chat view per ride
│   │       └── profile.tsx       # User profile and account info
│   │
│   └── (api)/                    # Server-side API routes (Node.js runtime)
│       ├── user+api.ts           # POST /api/user — create user in Neon DB
│       ├── driver+api.ts         # GET /api/driver — list all drivers
│       ├── (ride)/
│       │   ├── create+api.ts     # POST /api/(ride)/create — insert a new ride record
│       │   └── [id]+api.ts       # GET /api/(ride)/[userId] — fetch rides for a user
│       ├── (stripe)/
│       │   ├── create+api.ts     # POST /api/(stripe)/create — create Stripe PaymentIntent + ephemeral key
│       │   └── pay+api.ts        # POST /api/(stripe)/pay — attach payment method + confirm intent
│       └── (chat)/
│           ├── greet+api.ts      # POST /api/(chat)/greet — Gemini generates driver's first message
│           └── reply+api.ts      # POST /api/(chat)/reply — Gemini responds to rider's latest message
│
├── components/                   # Shared UI components
│   ├── CustomButton.tsx          # Branded button with loading state
│   ├── DriverCard.tsx            # Driver selection card (avatar, rating, price, ETA)
│   ├── GoogleTextInput.tsx       # Google Places autocomplete input wrapper
│   ├── InputFields.tsx           # Labelled text input
│   ├── LaunchScreen.tsx          # Animated splash screen overlay
│   ├── Map.tsx                   # react-native-maps with driver markers + route polyline
│   ├── OAuth.tsx                 # Google OAuth sign-in button
│   ├── Payment.tsx               # Stripe payment sheet orchestration + post-payment actions
│   ├── RideCard.tsx              # Single ride history card
│   ├── RideLayout.tsx            # Shared layout wrapper (map top, content bottom sheet)
│   └── SuccessModal.tsx          # Post-payment confirmation modal
│
├── lib/                          # Utility and service modules
│   ├── auth.ts                   # Clerk token cache (SecureStore) + Google OAuth flow + syncOAuthUser
│   ├── chat.ts                   # Firebase Firestore chat operations (create room, subscribe, send)
│   ├── fetch.ts                  # fetchAPI helper (throw-on-error) + useFetch hook
│   ├── firebase.ts               # Firebase client SDK initialization
│   ├── firebaseAdmin.ts          # Firebase Admin SDK initialization (server-side only)
│   ├── gemini.ts                 # Google Gemini AI client: buildSystemPrompt, generateDriverReply, generateGreeting
│   ├── map.ts                    # Map helpers: generateMarkersFromData, calculateRegion, calculateDriverTimes, fare calculation
│   └── utils.ts                  # formatCurrency (INR), formatRideTime, getShortAddress, getCoordinate
│
├── store/
│   └── index.ts                  # Zustand stores: useLocationStore, useDriverStore
│
├── types/
│   └── type.ts                   # Shared TypeScript types (Driver, MarkerData, PaymentProps, etc.)
│
├── constants/                    # App-wide constants (icons, images)
├── assets/                       # Fonts (Plus Jakarta Sans), images
├── scripts/                      # patch-clerk-expo.js, reset-project.js
├── app.json                      # Expo app config (bundle IDs, scheme, plugins)
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## 4. Architecture

### System Overview

```
┌─────────────────────────────────────────────┐
│              React Native Client            │
│  (Expo Router screens, Zustand, NativeWind) │
└───────────────┬─────────────────┬───────────┘
                │ fetchAPI()      │ Firebase SDK
                │ (HTTP)          │ (real-time)
                ▼                 ▼
┌───────────────────────┐  ┌─────────────────────┐
│  Expo Router API      │  │  Firebase Firestore  │
│  Routes (Node.js)     │  │  chatRooms /         │
│  app/(api)/           │  │    messages          │
└──────┬───────┬────────┘  └─────────────────────┘
       │       │
       ▼       ▼
┌──────────┐ ┌───────────────────────────────────┐
│  Neon    │ │  External APIs                    │
│  Postgres│ │  • Google Directions API (routes) │
│  users   │ │  • Stripe (payments)              │
│  drivers │ │  • Google Gemini 2.5 Flash (AI)   │
│  rides   │ │  • Clerk (auth tokens)            │
└──────────┘ └───────────────────────────────────┘
```

### Data Flow — Booking a Ride

1. **Home screen** requests device GPS via `expo-location` and reverse-geocodes it. User types a destination into the Google Places autocomplete field.
2. Destination coordinates are stored in `useLocationStore` (Zustand). The app navigates to `find-ride` (confirm origin/destination).
3. `find-ride` navigates to `confirm-ride`. The `Map` component calls `GET /api/driver` to load all drivers from Neon, then calls the Google Directions API via `calculateDriverTimes` to compute ETAs and INR fares for each driver marker.
4. User selects a driver (`useDriverStore.setSelectedDriver`), navigates to `book-ride`.
5. `book-ride` wraps the `Payment` component in a `StripeProvider`. On tapping "Confirm Ride":
   a. `POST /api/(stripe)/create` creates a Stripe Customer + PaymentIntent on the server.
   b. `initPaymentSheet` + `presentPaymentSheet` collect card details natively.
   c. On success, `POST /api/(ride)/create` inserts the ride into Neon.
   d. `createRideChatRoom` creates a Firestore document for the ride chat.
   e. `POST /api/(chat)/greet` fires asynchronously — Gemini generates the driver's first greeting message and writes it to Firestore.
6. User is shown a success modal and returned to Home.

### Data Flow — Chat

1. Chat tab fetches the user's ride list from Neon (`GET /api/(ride)/[userId]`).
2. Tapping a ride opens `ChatView`, which subscribes to `chatRooms/ride-{id}/messages` via Firestore `onSnapshot` (real-time).
3. When the rider sends a message, `sendMessage` writes to Firestore, then `POST /api/(chat)/reply` is called. The server fetches the last 15 messages, builds a Gemini chat session with a persona system prompt (Indian cab driver, Hinglish-aware), and writes the AI reply back to Firestore. The real-time subscription surfaces it immediately.

### Design Patterns

- **File-based routing** — Expo Router maps the `app/` directory to both client screens and server-side API routes.
- **Server-only data access** — `DATABASE_URL`, `STRIPE_SECRET_KEY`, `GEMINI_API_KEY`, and Firebase Admin credentials are never exposed to the client; all sensitive operations run in `app/(api)/` routes.
- **Zustand for transient state** — Location and driver selection are ephemeral per booking session; no persistence needed.
- **Firebase real-time + Neon relational** — Structured ride/user data lives in Neon (queryable, relational); fast-changing chat messages live in Firestore (real-time push).

---

## 5. Key Features

| Feature | Description | Implementation |
|---|---|---|
| **Email/Password Auth** | Sign up, sign in, email verification, MFA email code | Clerk `useSignIn` / `useSignUp` hooks; tokens persisted in `expo-secure-store` |
| **Google OAuth** | One-tap Google sign-in | Clerk `useOAuth` + `startOAuthFlow`; new OAuth users synced to Neon via `syncOAuthUser` |
| **Live Map & Location** | Shows user location with nearby driver markers | `expo-location` for GPS; `react-native-maps` for rendering; markers offset randomly around user to simulate nearby drivers |
| **Destination Search** | Google Places autocomplete for origin & destination | `react-native-google-places-autocomplete` wired to `useLocationStore` |
| **Driver Selection** | Browse drivers with ETA and fare per driver | `calculateDriverTimes` calls Google Directions API in parallel for each driver marker; INR fare = base + per-km + per-min formula |
| **INR Fare Calculation** | Dynamic pricing displayed before payment | `calculateEstimatedFareInInr`: ₹55 base + ₹25 pickup + ₹14/km + ₹2/min, minimum ₹99, rounded to nearest ₹10 |
| **Stripe Payments** | Native payment sheet (card, UPI-ready) | Server creates PaymentIntent in INR; client uses `@stripe/stripe-react-native` payment sheet; `POST /api/(stripe)/pay` confirms |
| **Ride History** | Full trip log with fare, route, and driver details | Neon `rides JOIN drivers` query, sorted by `created_at DESC` |
| **Real-time Chat** | Rider ↔ driver messaging per ride | Firestore `chatRooms/{rideId}/messages` with `onSnapshot` subscription; date separators + grouped message bubbles |
| **AI Driver Replies** | Automated driver responses powered by Gemini | `POST /api/(chat)/reply` builds a Gemini 2.5 Flash chat session with an Indian cab-driver persona system prompt; replies written back to Firestore |
| **AI Driver Greeting** | First message auto-sent when ride is booked | `POST /api/(chat)/greet` fires after payment; Gemini generates a contextual greeting with pickup/drop details |
| **Dashboard Stats** | Total rides, amount spent, time on road | Derived from ride history on the client (no extra API calls) |
| **Pull-to-refresh** | Refresh ride list on the Rides tab | `RefreshControl` on `FlatList` re-fetches `GET /api/(ride)/[userId]` |

---

## 6. Environment Variables

Create a `.env` file in the project root with the following variables:

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key — initializes ClerkProvider on startup |
| `EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID` | Yes (iOS) | Google OAuth client ID for iOS; used by Clerk's OAuth flow |
| `EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME` | No | Reverse client ID URL scheme; auto-derived from client ID if omitted |
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string (server-side only, no `EXPO_PUBLIC_` prefix) |
| `EXPO_PUBLIC_GOOGLE_API_KEY` | Yes | Google Maps API key — powers the map tiles and Places autocomplete |
| `EXPO_PUBLIC_DIRECTIONS_API_KEY` | No | Separate Google Directions API key; falls back to `EXPO_PUBLIC_GOOGLE_API_KEY` if omitted |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key — initializes `StripeProvider` in the book-ride screen |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (server-side only) — used to create PaymentIntents and ephemeral keys |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase project API key |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain (e.g. `project-id.firebaseapp.com`) |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Firebase storage bucket |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase Cloud Messaging sender ID |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Yes | Firebase Admin SDK service account JSON (server-side, for Firestore writes in API routes) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key — used server-side by the chat reply and greet endpoints |

---

## 7. Setup & Installation

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- For iOS: Xcode 14+ and a simulator or physical device
- For Android: Android Studio with an emulator or physical device
- Accounts required: Clerk, Neon, Firebase, Stripe, Google Cloud (Maps + Directions + Gemini)

### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd moveo

# 2. Install dependencies (postinstall patches Clerk automatically)
npm install

# 3. Configure environment variables
cp .env.example .env
# Open .env and fill in all required values (see Section 6)

# 4. Set up the Neon database
# Run the following SQL in your Neon console to create the required tables:

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE drivers (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  profile_image_url TEXT,
  car_image_url TEXT,
  car_seats INT,
  rating NUMERIC(3,2),
  driver_id INT UNIQUE
);

CREATE TABLE rides (
  ride_id SERIAL PRIMARY KEY,
  origin_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  origin_latitude NUMERIC(10,7) NOT NULL,
  origin_longitude NUMERIC(10,7) NOT NULL,
  destination_latitude NUMERIC(10,7) NOT NULL,
  destination_longitude NUMERIC(10,7) NOT NULL,
  ride_time INT NOT NULL,
  fare_price BIGINT NOT NULL,
  payment_status VARCHAR(20) NOT NULL,
  driver_id INT REFERENCES drivers(id),
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

# 5. Seed drivers
# Insert at least a few rows into the `drivers` table with real profile/car image URLs

# 6. Start the development server
npm start
# Then press i (iOS), a (Android), or w (web) in the Expo CLI menu

# Alternative: run directly on a platform
npm run ios
npm run android
```

### Notes

- The `postinstall` script (`scripts/patch-clerk-expo.js`) patches a Clerk compatibility issue automatically — do not skip `npm install`.
- Firebase Firestore must have a collection `chatRooms` writable by authenticated users. Adjust Firestore security rules accordingly.
- The Google Directions API must be enabled in Google Cloud Console and the billing account must be active.

---

## 8. Database Schema

All relational data is stored in **Neon PostgreSQL**. Real-time chat data is in **Firebase Firestore** (documented separately below).

### `users`

| Column | Type | Description |
|---|---|---|
| `id` | SERIAL (PK) | Auto-incrementing internal ID |
| `name` | VARCHAR(100) | Display name |
| `email` | VARCHAR(255) UNIQUE | User email address |
| `clerk_id` | VARCHAR(255) UNIQUE | Clerk user ID — foreign key to Clerk's auth system |
| `created_at` | TIMESTAMP | Row creation timestamp |

### `drivers`

| Column | Type | Description |
|---|---|---|
| `id` | SERIAL (PK) | Auto-incrementing internal ID |
| `first_name` | VARCHAR(50) | Driver first name |
| `last_name` | VARCHAR(50) | Driver last name |
| `profile_image_url` | TEXT | URL to driver profile photo |
| `car_image_url` | TEXT | URL to car photo |
| `car_seats` | INT | Number of available seats |
| `rating` | NUMERIC(3,2) | Driver rating (e.g. 4.85) |
| `driver_id` | INT UNIQUE | External driver identifier used in Firestore chat rooms |

### `rides`

| Column | Type | Description |
|---|---|---|
| `ride_id` | SERIAL (PK) | Auto-incrementing ride ID; used as Firestore chat room key |
| `origin_address` | TEXT | Human-readable pickup address |
| `destination_address` | TEXT | Human-readable drop-off address |
| `origin_latitude` | NUMERIC(10,7) | Pickup latitude |
| `origin_longitude` | NUMERIC(10,7) | Pickup longitude |
| `destination_latitude` | NUMERIC(10,7) | Drop-off latitude |
| `destination_longitude` | NUMERIC(10,7) | Drop-off longitude |
| `ride_time` | INT | Estimated total ride duration in minutes |
| `fare_price` | BIGINT | Fare in smallest currency unit (paise); divide by 100 for INR display |
| `payment_status` | VARCHAR(20) | `"paid"` or `"unpaid"` |
| `driver_id` | INT (FK → drivers.id) | Assigned driver |
| `user_id` | VARCHAR(255) | Clerk user ID of the rider |
| `created_at` | TIMESTAMP | Booking timestamp |

### Relationships

```
users (clerk_id) ←—— rides.user_id
drivers (id)     ←—— rides.driver_id
```

### Firebase Firestore — `chatRooms`

**Collection:** `chatRooms`
**Document ID:** `ride-{ride_id}`

| Field | Type | Description |
|---|---|---|
| `rideId` | number | Matches Neon `ride_id` |
| `participants` | string[] | `[userId, "driver-{driverId}"]` |
| `rider` | map | `{ id, name, email }` |
| `driverId` | number | Neon `drivers.id` |
| `driverName` | string | Full driver name |
| `driverAvatar` | string \| null | Driver profile image URL |
| `originAddress` | string | Pickup address |
| `destinationAddress` | string | Drop-off address |
| `createdAt` | Timestamp | Server timestamp of room creation |
| `lastMessage` | string | Text of the most recent message |
| `lastMessageAt` | Timestamp \| null | Timestamp of last message |
| `driverTyping` | boolean | Typing indicator flag |

**Subcollection:** `chatRooms/{roomId}/messages`

| Field | Type | Description |
|---|---|---|
| `senderId` | string | Clerk user ID for rider; `"driver-{driverId}"` for driver |
| `text` | string | Message content |
| `createdAt` | Timestamp | Server timestamp |
| `isAI` | boolean | `true` for Gemini-generated messages |

---

## 9. API Routes / Endpoints

All routes are served by Expo Router's `+api.ts` convention and run server-side in a Node.js environment. Client code calls them via relative paths (e.g. `fetchAPI("/(api)/user", ...)`).

| Method | Path | Purpose | Auth Required |
|---|---|---|---|
| `POST` | `/(api)/user` | Create a new user record in Neon. Body: `{ name, email, clerkId }` | No (called during sign-up) |
| `GET` | `/(api)/driver` | Return all driver rows from Neon. No query params. | No |
| `POST` | `/(api)/(ride)/create` | Insert a new ride into Neon. Body: full ride object with addresses, coordinates, `ride_time`, `fare_price`, `payment_status`, `driver_id`, `user_id`. Returns the created ride row. | Implicit (client must be authenticated) |
| `GET` | `/(api)/(ride)/[id]` | Fetch all rides for a given Clerk user ID, joined with driver details, ordered by `created_at DESC`. Path param `:id` = Clerk user ID. | Implicit |
| `POST` | `/(api)/(stripe)/create` | Create (or retrieve) a Stripe Customer, generate an ephemeral key and PaymentIntent in INR. Body: `{ name, email, amount }`. Returns `{ paymentIntent, ephemeralKey, customer }`. | No (Stripe handles auth) |
| `POST` | `/(api)/(stripe)/pay` | Attach a payment method to a customer and confirm the PaymentIntent. Body: `{ payment_method_id, payment_intent_id, customer_id }`. | No |
| `POST` | `/(api)/(chat)/greet` | Trigger Gemini to generate the driver's opening greeting and write it to Firestore. Body: `{ rideId, driverId, driverName, riderName, originAddress, destinationAddress }`. | No |
| `POST` | `/(api)/(chat)/reply` | Read the last 15 messages from a chat room, call Gemini with the driver persona, and write the AI reply to Firestore. Body: `{ rideId }`. Skips if the last message is already from the driver. | No |
