import { useState, useEffect } from "react";
import api from "../api/axios";

export default function Admin() {
  const [tab, setTab] = useState("bookings");
  const [bookings, setBookings] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newTable, setNewTable] = useState({ label: "", capacity: 2, location: "indoor" });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [bRes, tRes] = await Promise.all([api.get("/bookings"), api.get("/tables")]);
      setBookings(bRes.data);
      setTables(tRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAddTable = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/tables", newTable);
      setNewTable({ label: "", capacity: 2, location: "indoor" });
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add table");
    }
  };

  const handleRemoveTable = async (id) => {
    try {
      await api.delete(`/tables/${id}`);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove table");
    }
  };

  const handleCancelBooking = async (id) => {
    try {
      await api.patch(`/bookings/${id}/cancel`);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel booking");
    }
  };

  return (
    <div className="container">
      <h2 className="section-title">Admin dashboard</h2>
      <p className="section-sub">Manage tables and keep an eye on every reservation.</p>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
        <button
          className={tab === "bookings" ? "btn btn-primary" : "btn btn-outline"}
          onClick={() => setTab("bookings")}
        >
          All Bookings ({bookings.length})
        </button>
        <button
          className={tab === "tables" ? "btn btn-primary" : "btn btn-outline"}
          onClick={() => setTab("tables")}
        >
          Manage Tables ({tables.length})
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : tab === "bookings" ? (
        <div className="card" style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Table</th>
                <th>Date</th>
                <th>Slot</th>
                <th>Guests</th>
                <th>Status</th>
                <th>Payment</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td>
                    {b.user?.name}
                    <br />
                    <span style={{ opacity: 0.6, fontSize: 12 }}>{b.user?.email}</span>
                    <br />
                    <span style={{ opacity: 0.6, fontSize: 12 }}>
                      Booked for: {b.contactName} · {b.contactPhone}
                    </span>
                  </td>
                  <td>{b.table?.label || "—"}</td>
                  <td>{b.date}</td>
                  <td>{b.timeSlot}</td>
                  <td>{b.guests}</td>
                  <td>
                    <span className={`status-badge status-${b.status}`}>{b.status}</span>
                  </td>
                  <td>
                    ₹{b.depositAmount} —{" "}
                    <span className={`status-badge status-${b.paymentStatus === "paid" ? "confirmed" : "cancelled"}`}>
                      {b.paymentStatus}
                    </span>
                  </td>
                  <td>
                    {b.status === "confirmed" && (
                      <button className="btn btn-danger" onClick={() => handleCancelBooking(b._id)}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && <p style={{ opacity: 0.6, marginTop: 16 }}>No bookings yet.</p>}
        </div>
      ) : (
        <div>
          <form onSubmit={handleAddTable} className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Add a table</h3>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 14, alignItems: "end" }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Label</label>
                <input
                  value={newTable.label}
                  onChange={(e) => setNewTable({ ...newTable, label: e.target.value })}
                  placeholder="e.g. Table 9"
                  required
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Capacity</label>
                <input
                  type="number"
                  min={1}
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Location</label>
                <select
                  value={newTable.location}
                  onChange={(e) => setNewTable({ ...newTable, location: e.target.value })}
                >
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="rooftop">Rooftop</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <button className="btn btn-primary">Add</button>
            </div>
          </form>

          <div className="card" style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Capacity</th>
                  <th>Location</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tables.map((t) => (
                  <tr key={t._id}>
                    <td>{t.label}</td>
                    <td>{t.capacity}</td>
                    <td>{t.location}</td>
                    <td>
                      <button className="btn btn-danger" onClick={() => handleRemoveTable(t._id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tables.length === 0 && <p style={{ opacity: 0.6, marginTop: 16 }}>No tables yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
