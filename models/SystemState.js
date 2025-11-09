import mongoose from "mongoose";

const systemStateSchema = new mongoose.Schema({
  stop: { type: Number, default: 0 }, // 0 = running, 1 = stopped
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("SystemState", systemStateSchema);
