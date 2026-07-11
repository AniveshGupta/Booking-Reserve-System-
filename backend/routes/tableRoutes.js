import express from "express";
import Table from "../models/Table.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/tables  (public - browse all active tables)
router.get("/", async (req, res) => {
  try {
    const tables = await Table.find({ isActive: true }).sort({ label: 1 });
    res.json(tables);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tables", error: err.message });
  }
});

// @route   POST /api/tables  (admin only)
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { label, capacity, location } = req.body;
    if (!label || !capacity) {
      return res.status(400).json({ message: "Label and capacity are required" });
    }
    const table = await Table.create({ label, capacity, location });
    res.status(201).json(table);
  } catch (err) {
    res.status(500).json({ message: "Failed to create table", error: err.message });
  }
});

// @route   PUT /api/tables/:id  (admin only)
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!table) return res.status(404).json({ message: "Table not found" });
    res.json(table);
  } catch (err) {
    res.status(500).json({ message: "Failed to update table", error: err.message });
  }
});

// @route   DELETE /api/tables/:id  (admin only - soft delete)
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!table) return res.status(404).json({ message: "Table not found" });
    res.json({ message: "Table removed" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete table", error: err.message });
  }
});

export default router;
