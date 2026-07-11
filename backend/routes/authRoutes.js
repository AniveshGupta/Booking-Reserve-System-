import express from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// @route   POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const user = await User.create({ name, email, password, phone });
    const token = generateToken(user._id);

    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

// @route   POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id);
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// @route   POST /api/auth/google
// Verifies the ID token issued by Google Identity Services on the frontend,
// then finds or creates a matching user and issues our own JWT.
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: "Google credential is required" });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: "Google account has no email to sign in with" });
    }

    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        picture,
        authProvider: "google",
      });
    } else if (!user.googleId) {
      // Existing local account with the same email — link Google to it
      user.googleId = googleId;
      user.picture = user.picture || picture;
      await user.save();
    }

    const token = generateToken(user._id);
    res.json({ user, token });
  } catch (err) {
    res.status(401).json({ message: "Google sign-in failed", error: err.message });
  }
});

// @route   GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
