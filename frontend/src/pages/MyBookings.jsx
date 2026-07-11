import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { payForBooking } from "../utils/payment";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function DateStub({ date }) {
  const d = new Date(date + "T00:00:00");
  return (
    <div className="ticket-stub">
      <div className="day">{d.getDate()}</div>
      <div className="month">{MONTHS[d.getMonth()]}</div>
    </div>
  );
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const { user } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/bookings/my");
      setBookings(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (id) => {
    setCancellingId(id);
    try {
      await api.patch(`/bookings/${id}/cancel`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancellingId(null);
    }
  };

  const handlePayNow = (booking) => {
    setPayingId(booking._id);
    setError("");
    setSuccess("");
    payForBooking({
      booking,
      user,
      onSuccess: () => {
        setSuccess("Payment received — reservation confirmed.");
        setPayingId(null);
        load();
      },
      onError: (msg) => {
        setError(msg);
        setPayingId(null);
      },
      onDismiss: () => {
        setPayingId(null);
      },
    });
  };

  return (
    <div className="container">
      <h2 className="section-title">My bookings</h2>
      <p className="section-sub">Every reservation you've made, past and upcoming.</p>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <h3>No reservations yet</h3>
          <p>Head to Browse Tables to book your first slot.</p>
        </div>
      ) : (
        bookings.map((b) => (
          <div className="ticket" key={b._id}>
            <DateStub date={b.date} />
            <div className="ticket-main">
              <div className="ticket-row">
                <div>
                  <h4>{b.table?.label || "Table removed"}</h4>
                  <span className={`status-badge status-${b.status}`}>{b.status}</span>{" "}
                  <span className={`status-badge status-${b.paymentStatus === "paid" ? "confirmed" : "cancelled"}`}>
                    {b.paymentStatus === "paid" ? "deposit paid" : "deposit pending"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {b.status === "confirmed" && b.paymentStatus !== "paid" && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handlePayNow(b)}
                      disabled={payingId === b._id}
                    >
                      {payingId === b._id ? "Opening..." : `Pay ₹${b.depositAmount}`}
                    </button>
                  )}
                  {b.status === "confirmed" && (
                    <button
                      className="btn btn-danger"
                      onClick={() => handleCancel(b._id)}
                      disabled={cancellingId === b._id}
                    >
                      {cancellingId === b._id ? "Cancelling..." : "Cancel"}
                    </button>
                  )}
                </div>
              </div>
              <div className="ticket-meta">
                <span>🕐 {b.timeSlot}</span>
                <span>👥 {b.guests} guests</span>
                <span>📍 {b.table?.location}</span>
                <span>💳 ₹{b.depositAmount} deposit</span>
              </div>
              <div className="ticket-meta" style={{ marginTop: 4 }}>
                <span>👤 {b.contactName}</span>
                <span>📞 {b.contactPhone}</span>
                <span>✉️ {b.contactEmail}</span>
              </div>
              {b.specialRequest && (
                <p style={{ fontSize: 13, opacity: 0.7, marginTop: 10, marginBottom: 0 }}>
                  Note: {b.specialRequest}
                </p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
