import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { payForBooking } from "../utils/payment";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function Browse() {
  const [date, setDate] = useState(todayISO());
  const [guests, setGuests] = useState(2);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selection, setSelection] = useState({}); // tableId -> slot
  const [bookingId, setBookingId] = useState(null); // table currently being submitted
  const [contact, setContact] = useState({ name: "", phone: "", email: "", specialRequest: "" });
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchAvailability = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/bookings/availability", { params: { date, guests } });
      setTables(res.data.tables);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, guests]);

  // Prefill contact details from the logged-in user's profile
  useEffect(() => {
    if (user) {
      setContact((c) => ({ ...c, name: user.name || "", phone: user.phone || "", email: user.email || "" }));
    }
  }, [user]);

  const selectSlot = (tableId, slot) => {
    // Only one table's contact form is open at a time — selecting a slot
    // on a different table clears the previous selection.
    setSelection({ [tableId]: slot });
  };

  const handleBook = async (table) => {
    if (!user) {
      navigate("/login");
      return;
    }
    const slot = selection[table._id];
    if (!slot) return;

    if (!contact.name || !contact.phone || !contact.email) {
      setError("Please fill in name, phone and email for this reservation.");
      return;
    }

    setBookingId(table._id);
    setError("");
    setSuccess("");
    try {
      const res = await api.post("/bookings", {
        table: table._id,
        date,
        timeSlot: slot,
        guests,
        contactName: contact.name,
        contactPhone: contact.phone,
        contactEmail: contact.email,
        specialRequest: contact.specialRequest,
      });
      const booking = res.data;
      fetchAvailability();
      setSelection({});

      // Slot is held the moment the booking is created; now collect the deposit.
      payForBooking({
        booking,
        user,
        onSuccess: () => {
          setSuccess(`Payment received — ${table.label} confirmed for ${date}, ${slot}.`);
        },
        onError: (msg) => {
          setError(`Table reserved, but payment failed: ${msg}. You can retry payment from My Bookings.`);
        },
        onDismiss: () => {
          setError(
            `Table reserved but deposit not yet paid. Complete payment anytime from My Bookings to secure it.`
          );
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Booking failed. Please try another slot.");
    } finally {
      setBookingId(null);
    }
  };

  return (
    <div className="container">
      <h2 className="section-title">Browse tables</h2>
      <p className="section-sub">Pick a date and party size to see what's open.</p>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div className="filters-bar">
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Date</label>
          <input type="date" value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Guests</label>
          <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading availability...</p>
      ) : tables.length === 0 ? (
        <div className="empty-state">
          <h3>No tables match this party size</h3>
          <p>Try a smaller group or check a different date.</p>
        </div>
      ) : (
        <div className="table-grid">
          {tables.map((t) => {
            const isOpenForContact = !!selection[t._id];
            return (
              <div className="table-card" key={t._id}>
                <div className="table-card-head">
                  <div>
                    <h3>{t.label}</h3>
                    <span>Seats up to {t.capacity}</span>
                  </div>
                  <span className="tag">{t.location}</span>
                </div>

                <div className="slot-grid">
                  {t.availableSlots.length === 0 && t.bookedSlots.length === 0 && (
                    <span style={{ fontSize: 13, opacity: 0.6 }}>No slots configured</span>
                  )}
                  {[...t.availableSlots, ...t.bookedSlots]
                    .sort()
                    .map((slot) => {
                      const isBooked = t.bookedSlots.includes(slot);
                      const isSelected = selection[t._id] === slot;
                      return (
                        <button
                          key={slot}
                          disabled={isBooked}
                          className={`slot-btn ${isBooked ? "booked" : ""} ${isSelected ? "selected" : ""}`}
                          onClick={() => selectSlot(t._id, slot)}
                        >
                          {slot}
                        </button>
                      );
                    })}
                </div>

                {isOpenForContact && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                    <div className="field">
                      <label>Reservation name</label>
                      <input
                        value={contact.name}
                        onChange={(e) => setContact({ ...contact, name: e.target.value })}
                        placeholder="Full name for this booking"
                      />
                    </div>
                    <div className="field">
                      <label>Phone number</label>
                      <input
                        value={contact.phone}
                        onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                        placeholder="For confirmation & updates"
                      />
                    </div>
                    <div className="field">
                      <label>Email</label>
                      <input
                        type="email"
                        value={contact.email}
                        onChange={(e) => setContact({ ...contact, email: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label>Special request (optional)</label>
                      <textarea
                        rows={2}
                        value={contact.specialRequest}
                        onChange={(e) => setContact({ ...contact, specialRequest: e.target.value })}
                        placeholder="Window seat, birthday cake, allergies..."
                      />
                    </div>
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: 12 }}
                  disabled={!selection[t._id] || bookingId === t._id}
                  onClick={() => handleBook(t)}
                >
                  {bookingId === t._id
                    ? "Booking..."
                    : selection[t._id]
                    ? `Confirm & pay — ${t.label} at ${selection[t._id]}`
                    : "Select a time slot"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
