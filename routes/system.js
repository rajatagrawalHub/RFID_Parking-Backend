import express from "express";
import SystemState from "../models/SystemState.js";

const router = express.Router();

router.get("/stop", async (req, res) => {
  let state = await SystemState.findOne();
  if (!state) {
    state = await SystemState.create({ stop: 0 });
  }
  res.json({ stop: state.stop });
});

router.post("/stop", async (req, res) => {
  const { stop } = req.body;
  if (![0, 1].includes(stop)) {
    return res.status(400).json({ message: "Invalid stop value" });
  }

  let state = await SystemState.findOne();
  if (!state) {
    state = await SystemState.create({ stop });
  } else {
    state.stop = stop;
    state.updatedAt = new Date();
    await state.save();
  }

  res.json({ stop: state.stop, message: `Stop flag updated to ${stop}` });
});

export default router;
