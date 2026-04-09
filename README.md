# ServiceBuddy

ServiceBuddy is a full-stack local services marketplace where users can discover trusted professionals, book home services, track requests, chat with providers, and complete payments through a role-based workflow.

It is designed as an Urban Company style platform with three major roles:
- `User` for booking and tracking services
- `Provider` for managing jobs and service listings
- `Admin` for approvals, monitoring, and marketplace control

## Highlights

- Multi-role authentication for `user`, `provider`, and `admin`
- Provider onboarding with ID proof upload and admin approval flow
- Service discovery by category and location
- Booking lifecycle with status tracking
- Provider timing updates and user confirmation flow
- Real-time chat with unread notification badges
- Provider work-proof upload with completion location
- Role-based dashboards for user, provider, and admin
- Reviews and ratings after completed jobs
- Booking receipt generation for completed services
- Provider history and admin-side operational visibility
- Mobile-friendly navigation and responsive layout

## Tech Stack

- Frontend: `React`, `Vite`, `Tailwind CSS`
- Backend: `Node.js`, `Express`
- Database: `MongoDB`, `Mongoose`
- Authentication: `JWT`, `cookies`
- Realtime: `Socket.io`
- File uploads: `Multer`
- Email flow: `Nodemailer`
- Payments: `Razorpay-ready backend structure`

## Core Modules

### User Side
- Register and login
- Browse categories and provider profiles
- Book services with date, time, address, and problem details
- Track booking progress
- Confirm provider timing updates
- Chat after approval
- Leave ratings and reviews
- Download booking receipt
- Delete finished booking history

### Provider Side
- Register as provider
- Upload profile photo and legal proof
- Wait for admin approval
- Add and manage services
- Accept or reject requests
- Share updated visit time
- Start work and submit work proof
- Collect payment through platform flow
- Track earnings and booking progress

### Admin Side
- Review provider applications
- Approve or revoke provider access
- Manage users and roles
- View marketplace activity
- Review completed work proof and cancellation records
- Monitor admin action history

## Booking Flow

ServiceBuddy supports a role-based booking lifecycle:

`Requested -> Provider reviewing -> Approved/Rejected -> Time confirmed -> In progress -> Payment pending -> Completed`

Additional flows supported:
- provider timing change request
- user cancellation with reason
- provider rejection with reason
- provider work-proof submission
- admin visibility into completed proof and cancellations

## Project Structure

```text
Service-Marketplace/
|-- client/                  # React frontend
|   |-- src/
|   |   |-- components/
|   |   |-- context/
|   |   |-- data/
|   |   |-- hooks/
|   |   |-- layouts/
|   |   |-- pages/
|   |   `-- styles/
|-- server/                  # Express backend
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- seed/
|   |   `-- utils/
|   `-- uploads/
|-- package.json
`-- README.md
```

## Local Setup

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment files

Copy these example files:

- `server/.env.example` -> `server/.env`
- `client/.env.example` -> `client/.env`

### 3. Start MongoDB

Make sure MongoDB is running locally before starting the backend.

### 4. Seed demo data (optional)

```bash
npm run seed
```

### 5. Run the project

Start both frontend and backend together:

```bash
npm run dev
```

Or run them separately:

Backend:

```bash
npm run dev:server
```

Frontend:

```bash
npm run dev:client
```

## Available Scripts

### Root

```bash
npm run install:all
npm run dev
npm run dev:server
npm run dev:client
npm run build
npm run seed
```

### Client

```bash
npm run dev --prefix client
npm run build --prefix client
npm run preview --prefix client
```

### Server

```bash
npm run dev --prefix server
npm run start --prefix server
npm run seed --prefix server
```

## Environment Notes

Common backend values include:
- `PORT`
- `MONGO_URI`
- `CLIENT_URL`
- `JWT_SECRET`
- `COOKIE_NAME`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- SMTP settings for forgot-password email flow

Common frontend values include:
- `VITE_API_URL`
- `VITE_SOCKET_URL`

## Deployment

Recommended production setup:

- Frontend: `Vercel`
- Backend API: `Render`
- Database: `MongoDB Atlas`

### Backend deployment (Render)

Create a new Render Web Service using the `server` folder.

Suggested settings:

- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`

Backend environment variables:

```env
PORT=5000
MONGO_URI=your-mongodb-atlas-uri
CLIENT_URL=https://your-frontend-domain.vercel.app
NODE_ENV=production
JWT_SECRET=your-strong-secret
JWT_EXPIRES_IN=7d
COOKIE_NAME=service_marketplace_token
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=ServiceBuddy <your-email@gmail.com>
```

### Frontend deployment (Vercel)

Create a Vercel project using the `client` folder as the root directory.

Frontend environment variables:

```env
VITE_API_URL=https://your-backend-service.onrender.com/api
VITE_SOCKET_URL=https://your-backend-service.onrender.com
```

Notes:

- `client/vercel.json` is included for SPA route fallback
- Production cookies are configured for cross-origin deployment
- Backend CORS supports configured client origins from `CLIENT_URL`

## Current Product Direction

This project focuses on:
- real-world local service booking use cases
- trust and verification through admin approval
- operational visibility for admins
- practical provider workflow handling
- interview-friendly system design depth

## Best Use Cases

- college major project
- portfolio full-stack project
- MERN stack interview showcase
- role-based dashboard demonstration
- system design discussion starter

## Notes

- Example environment files are safe to commit, but real `.env` files should never be pushed
- Uploaded media should be reviewed before public deployment
- Payment support is structured for platform flow and can be extended with full production verification

## License

This project is currently for personal, educational, and portfolio use.
