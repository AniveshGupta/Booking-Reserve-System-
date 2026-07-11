import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Not required: users who sign in with Google never set a local password
    password: { type: String, minlength: 6 },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    phone: { type: String, trim: true },

    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, default: null, unique: true, sparse: true },
    picture: { type: String, default: "" },
  },
  { timestamps: true }
);

// Hash password before saving (only relevant for local accounts)
userSchema.pre("save", async function (next) {
  if (!this.password || !this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // Google-only account, no local password set
  return bcrypt.compare(candidatePassword, this.password);
};

// Never send password back in responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model("User", userSchema);
