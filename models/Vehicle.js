import mongoose from "mongoose";
const vehicleSchema = new mongoose.Schema({
  name: String,
  color: String,
  rfid: { type: String, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  notificationEmail: String,
});
export default mongoose.model("Vehicle", vehicleSchema);
