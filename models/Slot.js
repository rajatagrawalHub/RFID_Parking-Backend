import mongoose from "mongoose";
const slotSchema = new mongoose.Schema({
  slotNumber: Number,
  occupied: Boolean,
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  entryTime: Date,
});
export default mongoose.model("Slot", slotSchema);
