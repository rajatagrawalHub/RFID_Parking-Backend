import express from "express";
import Log from "../models/Log.js";
import Vehicle from "../models/Vehicle.js";
import Slot from "../models/Slot.js";
import User from "../models/User.js";
import sendMail from "../utils/sendMail.js";
import mongoose from "mongoose";

const router = express.Router();

// Endpoint hit by ESP32
import { simonEncrypt, simonDecrypt, textToBlocks, blocksToText } from "../utils/simon.js";




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
        const receivedMessage = encryptedMessage;
        const decryptedMessage = blocksToText(decryptedBlocks);

        // 🔍 Step 2. Normal logic
        const vehicle = await Vehicle.findOne({ rfid });
        if (!vehicle) {
            await sendMail(
                "jalan261115@gmail.com",
                `Unregistered Vehicle detected: ${rfid}`
            );
            const log = await Log.create({
                rfid,
                vehicleName: null,
                action: "Unauthorized",
                originalMessage,
                encryptedMessage,
                receivedMessage,
                decryptedMessage,
            });
            return res
                .status(404)
                .json({ message: "Unregistered Vehicle", log });
        }

        // Check if vehicle already in a slot
        const existingSlot = await Slot.findOne({
            vehicleId: vehicle._id,
            occupied: true,
        });

        if (existingSlot) {
            // 🚗 Exit logic
            const duration =
                Math.round((Date.now() - existingSlot.entryTime) / 60000) + " min";
            await Slot.updateOne(
                { _id: existingSlot._id },
                { occupied: false, vehicleId: null, entryTime: null }
            );

            const log = await Log.create({
                rfid,
                vehicleName: vehicle.name,
                action: "exit",
                slot: existingSlot.slotNumber,
                duration,
                originalMessage,
                encryptedMessage,
                receivedMessage,
                decryptedMessage,
            });

            await sendMail(
                vehicle.notificationEmail,
                `${vehicle.name} exited slot ${existingSlot.slotNumber}`
            );

            return res.json({ message: "Exit success", log });
        } else {
            // 🅿️ Entry logic
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
                receivedMessage,
                decryptedMessage,
            });

            await sendMail(
                vehicle.notificationEmail,
                `${vehicle.name} entered slot ${freeSlot.slotNumber}`
            );

            return res.json({ message: "Entry success", log });
        }
    } catch (err) {
        console.error("Error in /scan:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.get("/logs/:id", async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.id);

        const vehicles = await Vehicle.find({ userId });

        const vehicleNames = vehicles.map(v => v.name);

        const logs = await Log.find({ vehicleName: { $in: vehicleNames } })
            .sort({ timestamp: -1 });

        res.json(logs);
    } catch (err) {
        console.error("Error fetching user logs:", err);
        res.status(500).json({ message: "Error fetching logs" });
    }
});

export default router;
