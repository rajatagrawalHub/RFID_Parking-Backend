import express from "express";
import Vehicle from "../models/Vehicle.js";

const router = express.Router();

router.get("/", async (_, res) => {
  const vehicles = await Vehicle.find();
  res.json(vehicles);
});

router.post("/", async (req, res) => {
  const vehicle = await Vehicle.create(req.body);
  res.json(vehicle);
});

router.delete("/:id", async (req, res) => {
  await Vehicle.findByIdAndDelete(req.params.id);
  res.json({ message: "Vehicle deleted" });
});

export default router;
