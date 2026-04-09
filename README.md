# ServiceBuddy

ServiceBuddy is a full-stack local services marketplace inspired by Urban Company. Users can book trusted local services, providers can manage listings and bookings, and admins can approve providers and track marketplace analytics.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: JWT + cookies
- Real-time: Socket.io

## Features

- Register/login for user, provider, and admin roles
- Browse services with category and location filters
- Book services with preferred date and time
- Track booking flow: `pending -> accepted/rejected -> in-progress -> completed`
- Provider dashboard for services, bookings, earnings, and profile status
- Admin dashboard for provider approvals, user management, bookings, and analytics
- Reviews and ratings
- Real-time booking status and chat scaffolding via Socket.io
- Location-based provider metadata
- Razorpay-ready payment model placeholder

## Run locally

1. Install dependencies:

```bash
npm run install:all
```

2. Copy env files:

- `server/.env.example` -> `server/.env`
- `client/.env.example` -> `client/.env`

3. Start MongoDB, then optionally seed demo data:

```bash
npm run seed
```

4. Start both apps:

```bash
npm run dev
```
