import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    timeSlot: { type: String, required: true }, // e.g. "19:00-20:00"
    guests: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
    specialRequest: { type: String, trim: true, default: "" },

    // Contact details for this specific reservation (may differ from the
    // account holder — e.g. booking on behalf of someone else)
    contactName: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    contactEmail: { type: String, required: true, trim: true, lowercase: true },

    // Reservation deposit payment (Razorpay)
    depositAmount: { type: Number, required: true }, // in INR
    paymentStatus: { type: String, enum: ["pending", "paid", "refunded"], default: "pending" },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
  },
  { timestamps: true }
);

// Prevent double-booking the same table for the same date + slot while confirmed
bookingSchema.index(
  { table: 1, date: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "confirmed" },
  }
);

export default mongoose.model("Booking", bookingSchema);
