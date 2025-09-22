# CardPulse
![Sheen Banner](https://raw.githubusercontent.com/74Thirsty/74Thirsty/main/assets/cardpulse.svg)


CardPulse is a cross-platform mobile experience and lightweight API for identifying collectible cards, tracking market value, and enabling a community marketplace with messaging.

## Repository layout

```
backend/   – Node.js API providing identification, valuation, marketplace, forum, and messaging endpoints.
mobile/    – Expo/React Native application that consumes the API and delivers the CardPulse UX.
```

## Features

- 🔍 **Identification** – Submit camera captures or manual descriptions to match cards against a curated catalog.
- 📈 **Valuation** – 30-day pricing history, highs/lows, and trend deltas from sample market data.
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

## Development notes

- Authentication is handled by a minimal token service backed by in-memory storage. Replace with a production-grade identity provider (Firebase Auth, Cognito, etc.) before shipping.
- Market valuations and card recognition currently rely on curated sample data to illustrate end-to-end flows. Integrate real-world pricing APIs and ML models for production.
- Data persistence is in-memory to keep the demo self-contained. Swap in a managed database (Firestore, PostgreSQL, etc.) to make data durable.

## Testing

Backend tests cover authentication, identification, valuation, marketplace, forum, and messaging flows using Node's built-in test runner. Additional unit and UI tests can be layered on for broader coverage.
