import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <section className="hero">
        <div className="hero-inner">
          <div className="eyebrow">Est. reservations, done right</div>
          <h1>Your table is waiting. Just pick the hour.</h1>
          <p>
            Check live availability across every table in the house — indoor, outdoor,
            rooftop, or private — and lock in your slot in under a minute.
          </p>
          <Link to="/browse" className="btn btn-primary" style={{ textDecoration: "none" }}>
            Browse tables →
          </Link>
        </div>
      </section>

      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
          <div className="card">
            <div className="tag">Step 1</div>
            <h3 style={{ fontFamily: "var(--font-display)", marginTop: 12 }}>Pick a date</h3>
            <p style={{ opacity: 0.7, fontSize: 14 }}>
              Choose the day and party size — we'll filter tables that actually fit you.
            </p>
          </div>
          <div className="card">
            <div className="tag">Step 2</div>
            <h3 style={{ fontFamily: "var(--font-display)", marginTop: 12 }}>Grab a slot</h3>
            <p style={{ opacity: 0.7, fontSize: 14 }}>
              See open and booked hours side by side, no back-and-forth calls needed.
            </p>
          </div>
          <div className="card">
            <div className="tag">Step 3</div>
            <h3 style={{ fontFamily: "var(--font-display)", marginTop: 12 }}>Get your ticket</h3>
            <p style={{ opacity: 0.7, fontSize: 14 }}>
              Your reservation shows up instantly under "My Bookings" — cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
