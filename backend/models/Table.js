import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // e.g. "Table 4", "Rooftop 2"
    capacity: { type: Number, required: true, min: 1 },
    location: { type: String, enum: ["indoor", "outdoor", "rooftop", "private"], default: "indoor" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Table", tableSchema);
