import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "user" },
  notificationEmail: String,
  failedAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null }
});
export default mongoose.model("User", userSchema);
