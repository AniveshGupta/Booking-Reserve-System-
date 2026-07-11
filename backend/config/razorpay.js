import Razorpay from "razorpay";

const hasKeys = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;

if (!hasKeys) {
  console.warn(
    "⚠️  RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set in .env — payment routes will return an error until configured. Get free test keys at https://dashboard.razorpay.com/"
  );
}

// Only construct the real client if keys are present, so a missing key
// doesn't crash the whole server on startup — just the payment feature.
const razorpay = hasKeys
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

export default razorpay;
