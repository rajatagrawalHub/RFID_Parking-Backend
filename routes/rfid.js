import express from "express";
import Log from "../models/Log.js";
import Vehicle from "../models/Vehicle.js";
import Slot from "../models/Slot.js";
import User from "../models/User.js";
import sendMail from "../utils/sendMail.js";
import mongoose from "mongoose";
import { simonEncrypt, simonDecrypt, textToBlocks, blocksToText } from "../utils/simon.js";

const router = express.Router();

router.get("/logs", async (_, res) => {
  const logs = await Log.find().sort({ timestamp: -1 });
  res.json(logs);
});

router.post("/scan", async (req, res) => {
  try {
    const { rfid } = req.body;
    if (!rfid) return res.status(400).json({ message: "RFID required" });

    const originalMessage = `RFID ${rfid} scanned`;
    const keyWords = [0x19181110, 0x09080100, 0x11109800, 0x01020304];

    const blocks = textToBlocks(originalMessage);
    const encryptedBlocks = blocks.map(b => simonEncrypt(b, keyWords));
    const decryptedBlocks = encryptedBlocks.map(b => simonDecrypt(b, keyWords));
    const encryptedMessage = blocksToText(encryptedBlocks);
    const decryptedMessage = blocksToText(decryptedBlocks);

    const deviceIP = req.ip;
    const deviceID = req.headers["x-device-id"] || "unknown";
    const vehicle = await Vehicle.findOne({ rfid });
    if (!vehicle) {
      await sendMail("jalan261115@gmail.com", `Unregistered Vehicle detected: ${rfid}`);
      const log = await Log.create({
        rfid,
        vehicleName: null,
        action: "Unauthorized",
        originalMessage,
        encryptedMessage,
        decryptedMessage,
        deviceID,
        deviceIP
      });
      return res.status(404).json({ message: "Unregistered Vehicle", log });
    }

    const existingSlot = await Slot.findOne({
      vehicleId: vehicle._id,
      occupied: true,
    });

    if (existingSlot) {
      const log = await Log.create({
        rfid,
        vehicleName: vehicle.name,
        action: "Duplicate Park Request",
        slot: existingSlot.slotNumber,
        originalMessage,
        encryptedMessage,
        decryptedMessage,
        deviceID,
        deviceIP
      });

      return res.status(200).json({
        message: `Car parked in ${existingSlot.slotNumber}`,
        slot: existingSlot.slotNumber,
        log,
      });
    }

    const freeSlot = await Slot.findOne({ occupied: false });
    if (!freeSlot)
      return res.status(400).json({ message: "No free slot available" });

    await Slot.updateOne(
      { _id: freeSlot._id },
      { occupied: true, vehicleId: vehicle._id, entryTime: new Date() }
    );

    const log = await Log.create({
      rfid,
      vehicleName: vehicle.name,
      action: "entry",
      slot: freeSlot.slotNumber,
      originalMessage,
      encryptedMessage,
      decryptedMessage,
    });

    await sendMail(
      vehicle.notificationEmail,
      `${vehicle.name} entered slot ${freeSlot.slotNumber}`
    );

    return res.json({
      message: "Entry success",
      slot: freeSlot.slotNumber,
      log,
    });
  } catch (err) {
    console.error("Error in /scan:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/free", async (req, res) => {
  try {
    const { slot } = req.query;

    let freedSlot;

    if (slot) {
      freedSlot = await Slot.findOneAndUpdate(
        { slotNumber: parseInt(slot) },
        { occupied: false, vehicleId: null, entryTime: null },
        { new: true }
      );
    }

    if (!freedSlot)
      return res.status(404).json({ message: "No occupied slot to free" });
    const deviceIP = req.ip;
    const deviceID = req.headers["x-device-id"] || "unknown";
    const log = await Log.create({
      rfid,
      vehicleName: vehicle.name,
      action: "exit",
      slot: freeSlot.slotNumber,
      originalMessage,
      encryptedMessage,
      decryptedMessage,
      deviceID,
      deviceIP
    });

    return res.json({
      message: `Slot ${freedSlot.slotNumber} freed`,
      slot: freedSlot.slotNumber,
    });
  } catch (err) {
    console.error("Error in /free:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/logs/:id", async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.id);
    const vehicles = await Vehicle.find({ userId });
    const vehicleNames = vehicles.map(v => v.name);
    const logs = await Log.find({ vehicleName: { $in: vehicleNames } }).sort({
      timestamp: -1,
    });
    res.json(logs);
  } catch (err) {
    console.error("Error fetching user logs:", err);
    res.status(500).json({ message: "Error fetching logs" });
  }
});

export default router;
