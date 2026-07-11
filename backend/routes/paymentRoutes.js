import express from "express";
import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import Booking from "../models/Booking.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/payments/create-order
// Creates a Razorpay order for an existing booking's deposit amount.
router.post("/create-order", protect, async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        message: "Payments are not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env.",
      });
    }

    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ message: "bookingId is required" });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized for this booking" });
    }
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({ message: "This booking is already paid for" });
    }

    const order = await razorpay.orders.create({
      amount: booking.depositAmount * 100, // paise
      currency: "INR",
      receipt: `booking_${booking._id}`,
      notes: { bookingId: booking._id.toString() },
    });

    booking.razorpayOrderId = order.id;
    await booking.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to create payment order", error: err.message });
  }
});

// @route   POST /api/payments/verify
// Verifies the Razorpay payment signature and marks the booking as paid.
router.post("/verify", protect, async (req, res) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification fields" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ message: "Order mismatch for this booking" });
    }

    // Verify signature: HMAC-SHA256 of "order_id|payment_id" using the key secret
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed — signature mismatch" });
    }

    booking.paymentStatus = "paid";
    booking.razorpayPaymentId = razorpay_payment_id;
    await booking.save();

    res.json({ message: "Payment verified", booking });
  } catch (err) {
    res.status(500).json({ message: "Payment verification failed", error: err.message });
  }
});

export default router;
