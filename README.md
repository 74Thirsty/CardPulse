# CardPulse

CardPulse is a cross-platform mobile experience and lightweight API for identifying collectible cards, tracking market value, and enabling a community marketplace with messaging.

## Repository layout

```
backend/   – Node.js API providing identification, valuation, marketplace, forum, and messaging endpoints.
mobile/    – Expo/React Native application that consumes the API and delivers the CardPulse UX.
```

## Features

- 🔍 **Identification** – Submit camera captures or manual descriptions to match cards against a curated catalog.
- 📈 **Valuation** – 30-day pricing history, highs/lows, and trend deltas from sample market data.
- 📊 **Analytics** – Rolling 7-day/30-day trend analysis, volume estimates, and underlying data-source confidence.
- 🛒 **Marketplace** – Create, browse, and manage card listings with pricing insights.
- 💬 **Forum & Messaging** – Category-based discussions plus private negotiation threads for listings.
- 👤 **Profiles** – Persisted auth sessions with ratings, badges, and seller dashboards.

## Getting started

### Backend API

The backend uses Node.js standard libraries only – no external dependencies are required.

```bash
cd backend
npm start
```

This starts the API on `http://localhost:4000`. Available endpoints are documented in `src/router.js` and exercised in `tests/app.test.js`.

To run the automated test suite:

```bash
cd backend
npm test
```

### Mobile app

The mobile client is built with Expo (React Native + TypeScript).

```bash
cd mobile
npm install
npm start
```

Expo will present options to run on iOS, Android, or web. Ensure the backend is running locally so the app can reach `http://localhost:4000`.

### Sample accounts

You can sign in with any registered email, or the pre-seeded demo users:

- `ash@cardpulse.app` / `password123`
- `mia@cardpulse.app` / `password123`

## Development notes

- Authentication is handled by a minimal token service backed by in-memory storage. Replace with a production-grade identity provider (Firebase Auth, Cognito, etc.) before shipping.
- Market valuations now capture multi-source history (up to 120 days) with rolling averages, trend percentages, and volume estimates. Integrate real-world pricing APIs and ML models for production deployments.
- Data persistence is in-memory to keep the demo self-contained. Swap in a managed database (Firestore, PostgreSQL, etc.) to make data durable.
- REST endpoints enforce stricter payload validation, authenticated session introspection (`/api/auth/session`), and logout support. Extend with rate limiting or audit logging as needed.

## Testing

Backend tests cover authentication, identification, valuation, marketplace, forum, and messaging flows using Node's built-in test runner. Additional unit and UI tests can be layered on for broader coverage.
