import express from "express";
import Booking from "../models/Booking.js";
import Table from "../models/Table.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

export const TIME_SLOTS = [
  "12:00-13:00",
  "13:00-14:00",
  "14:00-15:00",
  "18:00-19:00",
  "19:00-20:00",
  "20:00-21:00",
  "21:00-22:00",
];

// @route   GET /api/bookings/availability?date=YYYY-MM-DD&guests=2
// Returns each table with which slots are already booked for that date
router.get("/availability", async (req, res) => {
  try {
    const { date, guests } = req.query;
    if (!date) return res.status(400).json({ message: "date query param is required" });

    const filter = { isActive: true };
    if (guests) filter.capacity = { $gte: Number(guests) };

    const tables = await Table.find(filter).sort({ capacity: 1 });
    const bookings = await Booking.find({ date, status: "confirmed" });

    const bookedMap = {}; // tableId -> Set of booked slots
    bookings.forEach((b) => {
      const key = b.table.toString();
      if (!bookedMap[key]) bookedMap[key] = new Set();
      bookedMap[key].add(b.timeSlot);
    });

    const result = tables.map((t) => ({
      _id: t._id,
      label: t.label,
      capacity: t.capacity,
      location: t.location,
      availableSlots: TIME_SLOTS.filter((slot) => !bookedMap[t._id.toString()]?.has(slot)),
      bookedSlots: TIME_SLOTS.filter((slot) => bookedMap[t._id.toString()]?.has(slot)),
    }));

    res.json({ date, allSlots: TIME_SLOTS, tables: result });
  } catch (err) {
    res.status(500).json({ message: "Failed to check availability", error: err.message });
  }
});

// @route   POST /api/bookings  (logged-in users only)
router.post("/", protect, async (req, res) => {
  try {
    const { table, date, timeSlot, guests, specialRequest, contactName, contactPhone, contactEmail } = req.body;

    if (!table || !date || !timeSlot || !guests) {
      return res.status(400).json({ message: "table, date, timeSlot and guests are required" });
    }
    if (!contactName || !contactPhone || !contactEmail) {
      return res.status(400).json({ message: "contactName, contactPhone and contactEmail are required" });
    }

    if (!TIME_SLOTS.includes(timeSlot)) {
      return res.status(400).json({ message: "Invalid time slot" });
    }

    const tableDoc = await Table.findById(table);
    if (!tableDoc || !tableDoc.isActive) {
      return res.status(404).json({ message: "Table not found" });
    }
    if (guests > tableDoc.capacity) {
      return res.status(400).json({ message: `This table seats up to ${tableDoc.capacity} guests` });
    }

    // Prevent booking a slot in the past
    const slotStartHour = Number(timeSlot.split(":")[0]);
    const slotDateTime = new Date(`${date}T${String(slotStartHour).padStart(2, "0")}:00:00`);
    if (slotDateTime < new Date()) {
      return res.status(400).json({ message: "Cannot book a time slot in the past" });
    }

    const booking = await Booking.create({
      user: req.user._id,
      table,
      date,
      timeSlot,
      guests,
      specialRequest,
      contactName,
      contactPhone,
      contactEmail,
      depositAmount: Number(process.env.BOOKING_DEPOSIT_INR) || 200,
    });

    const populated = await booking.populate("table", "label capacity location");
    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "This table is already booked for that date and time slot" });
    }
    res.status(500).json({ message: "Failed to create booking", error: err.message });
  }
});

// @route   GET /api/bookings/my  (logged-in user's own bookings)
router.get("/my", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("table", "label capacity location")
      .sort({ date: -1, createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bookings", error: err.message });
  }
});

// @route   PATCH /api/bookings/:id/cancel  (owner or admin)
router.patch("/:id/cancel", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const isOwner = booking.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }

    booking.status = "cancelled";
    await booking.save();
    res.json({ message: "Booking cancelled", booking });
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel booking", error: err.message });
  }
});

// @route   GET /api/bookings  (admin only - view all bookings)
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("table", "label capacity location")
      .populate("user", "name email phone")
      .sort({ date: -1, createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bookings", error: err.message });
  }
});

export default router;
