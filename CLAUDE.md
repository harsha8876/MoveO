# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server (choose iOS/Android/web from the menu)
npm start

# Run on specific platform
npm run ios
npm run android
npm run web

# Lint
npm run lint
```

## Environment Variables

The app requires a `.env` file with:
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk auth (required at startup)
- `EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID` — Google OAuth for iOS
- `EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME` — auto-derived from client ID if omitted
- `DATABASE_URL` — Neon PostgreSQL (server-side only, no `EXPO_PUBLIC_` prefix)
- `EXPO_PUBLIC_GOOGLE_API_KEY` / `EXPO_PUBLIC_DIRECTIONS_API_KEY` — Google Maps & Directions
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe payments
- `EXPO_PUBLIC_FIREBASE_*` — Firebase project config (all 6 keys required)

## Architecture

**MoveO** is an Expo Router (file-based routing) ride-sharing app for React Native.

### Routing structure

```
app/
  _layout.tsx          # Root: ClerkProvider + font loading + LaunchScreen overlay
  index.tsx            # Redirects to auth or home based on auth state
  (auth)/              # Unauthenticated: welcome, sign-in, sign-up
  (root)/              # Authenticated
    (tabs)/            # Bottom tab nav: home, rides, chat, profile
    find-ride.tsx      # Step 1: pick origin/destination
    confirm-ride.tsx   # Step 2: select a driver from map
    book-ride.tsx      # Step 3: payment
  (api)/               # Expo Router API routes (server-side, run on Node)
    user+api.ts        # POST /api/user — create user in Neon DB
    driver+api.ts      # GET /api/driver — list drivers from Neon DB
    (ride)/
      create+api.ts    # POST: create ride record
      [id]+api.ts      # GET: fetch ride by ID
    (stripe)/
      create+api.ts    # POST: create Stripe payment intent
      pay+api.ts       # POST: confirm payment
```

### Data layer

- **Neon PostgreSQL** (via `@neondatabase/serverless`): users, drivers, rides — accessed only in API routes (`app/(api)/`)
- **Firebase Firestore** (`lib/firebase.ts`, `lib/chat.ts`): real-time chat. Chat rooms keyed as `ride-{rideId}`. Collections: `chatRooms`, `chatUsers`.
- **Clerk** (`lib/auth.ts`): authentication + token cache via `expo-secure-store`. OAuth users are synced to Neon via `syncOAuthUser`.

### State management

Zustand (`store/index.ts`) has two stores:
- `useLocationStore` — user location, destination coordinates/address. Setting either location clears any selected driver.
- `useDriverStore` — available drivers (markers), selected driver ID.

### Key utilities

- `lib/fetch.ts` — `fetchAPI` (throw-on-error wrapper) and `useFetch` hook
- `lib/map.ts` — `generateMarkersFromData`, `calculateRegion`, `calculateDriverTimes` (calls Google Directions API, computes INR fare)
- `lib/utils.ts` — `formatCurrency` (INR), `formatRideTime`, `getShortAddress`, `getCoordinate`
- `lib/chat.ts` — all Firestore chat operations (create room, subscribe, send message)

### Styling

NativeWind v4 (Tailwind CSS for React Native). All styling via `className` props. Font family is Plus Jakarta Sans, loaded as `Jakarta-{weight}` variants.

### API route pattern

API routes use Expo Router's `+api.ts` convention. They run server-side and can safely access `DATABASE_URL`. Client code calls them via relative paths like `fetchAPI("/(api)/user", ...)`.
