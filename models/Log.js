import mongoose from "mongoose";

const LogSchema = new mongoose.Schema({
  rfid: String,
  vehicleName: String,
  action: String,
  slot: Number,
  duration: String,
  timestamp: { type: Date, default: Date.now },
  originalMessage: String,
  encryptedMessage: String,
  receivedMessage: String,
  decryptedMessage: String,
});

export default mongoose.model("Log", LogSchema);
