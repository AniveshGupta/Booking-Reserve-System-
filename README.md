# Mezban — Restaurant Table Reservation System

A full-stack booking/reservation system built with the MERN stack (MongoDB, Express,
React, Node.js). Customers can browse tables, check live slot availability, and book
a reservation. Admins can manage tables and view/cancel any booking.

## Tech Stack

- **Frontend:** React (Vite), React Router, Axios
- **Backend:** Node.js, Express
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (JSON Web Tokens) + bcrypt password hashing

## Features

- User registration & login (JWT-based auth)
- **Sign in with Google** (Google Identity Services) alongside regular email/password
- Browse tables filtered by date and party size
- Live slot availability per table (booked slots are disabled, not just hidden)
- Double-booking prevention enforced at the database level (unique index on
  table + date + time slot for confirmed bookings)
- **Contact details captured per reservation** (name, phone, email, special
  request) — prefilled from your account but editable, useful for booking on
  someone else's behalf
- **Reservation deposit payment via Razorpay** (test mode) — supports cards,
  UPI (Google Pay / PhonePe / Paytm all work through UPI), netbanking, and
  wallets out of the box since these are built into Razorpay's checkout
- Cancel your own bookings
- Admin dashboard: add/remove tables, view all bookings with payment + contact
  info, cancel any booking
- Role-based route protection (customer vs admin)

## Project Structure

```
booking-system/
├── backend/
│   ├── models/          # User, Table, Booking (Mongoose schemas)
│   ├── routes/          # auth, tables, bookings
│   ├── middleware/       # JWT auth + admin guard
│   ├── seed.js           # creates admin user + sample tables
│   └── server.js
└── frontend/
    └── src/
        ├── api/          # axios instance
        ├── context/      # AuthContext (global auth state)
        ├── components/   # Header, ProtectedRoute
        └── pages/        # Home, Login, Register, Browse, MyBookings, Admin
```

## Setup & Run Locally

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally OR a free MongoDB Atlas cluster

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` if needed (default assumes MongoDB running on `localhost:27017`).
If you're using Atlas, paste your connection string into `MONGO_URI`.

**Razorpay setup (for the deposit payment feature):**
1. Sign up free at [dashboard.razorpay.com](https://dashboard.razorpay.com/) — no
   business verification needed to use **Test Mode**.
2. Go to Settings → API Keys → Generate Test Key.
3. Copy the Key ID and Key Secret into `.env` as `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
4. In test mode, use Razorpay's [test card numbers](https://razorpay.com/docs/payments/payments/test-card-upi-details/)
   (e.g. card `4111 1111 1111 1111`, any future expiry, any CVV) or test UPI ID
   `success@razorpay` to simulate a successful payment — no real money moves.

**Google Sign-In setup:**
1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an OAuth 2.0 Client ID of type **Web application**.
3. Under "Authorized JavaScript origins" add `http://localhost:5173` (and your
   deployed frontend URL later).
4. Copy the Client ID into **both**:
   - `backend/.env` as `GOOGLE_CLIENT_ID`
   - `frontend/.env` as `VITE_GOOGLE_CLIENT_ID`
5. No client secret is needed — the frontend flow only needs the ID token,
   which the backend verifies against Google's public keys.

Seed the database with an admin account and sample tables:

```bash
node seed.js
```

This creates:
- Admin login → `admin@restaurant.com` / `admin123`
- 8 sample tables (indoor, outdoor, rooftop, private)

Start the server:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`.

### 2. Frontend

In a new terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173`.

### 3. Try it out

1. Open `http://localhost:5173`
2. Register a new customer account, or log in as admin (`admin@restaurant.com` / `admin123`)
2. Go to **Browse Tables**, pick a date and party size, click an open time slot
3. Fill in (or confirm) the contact details for this reservation — name, phone, email
4. Click "Confirm & pay" — a Razorpay checkout modal opens for the ₹200 deposit;
   use a test card/UPI ID (see above) to simulate payment
5. Check **My Bookings** to see your reservation as a ticket-style card with payment status.
   If you closed the checkout without paying, a "Pay ₹200" button lets you retry anytime
6. Log in as admin and visit **Admin** to see all bookings, including payment and
   contact info, across every customer, or add/remove tables

## How double-booking is prevented

Instead of just checking-then-inserting (which has a race condition), the `Booking`
model has a **partial unique index** on `{ table, date, timeSlot }` scoped to
`status: "confirmed"`. Even if two people click "book" at the exact same millisecond,
MongoDB itself rejects the second insert — the API just catches that error (code `11000`)
and returns a clean "already booked" message instead of crashing.

## How the payment flow works

1. Booking a slot **immediately** reserves the table (this is what blocks double-booking).
2. Right after, the frontend asks the backend to create a Razorpay order for the
   deposit amount, then opens Razorpay's checkout modal.
3. On successful payment, Razorpay returns a signed payload (`order_id`,
   `payment_id`, `signature`). The frontend sends this to `/api/payments/verify`.
4. The backend recomputes the HMAC-SHA256 signature using the Razorpay key secret
   (never trusting the client) and only marks the booking as `paid` if it matches.
5. If the user closes the checkout without paying, the table stays reserved under
   their name, and they can retry payment anytime from **My Bookings**.

This mirrors how real checkout flows work: the reservation and the payment are
separate steps, and payment status is only ever trusted after server-side signature
verification — never from the client directly.

## Things to extend (good for interview talking points / resume bullet ideas)

- Email confirmation on booking (Nodemailer)
- Pagination on the admin bookings table
- Auto-release a table if the deposit isn't paid within N minutes (needs a cron/cleanup job)
- Refunds via Razorpay's refund API when a paid booking is cancelled
- Table-side QR check-in
- Waitlist when a slot is full
