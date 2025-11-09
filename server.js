import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/users.js";
import vehicleRoutes from "./routes/vehicles.js";
import rfidRoutes from "./routes/rfid.js";
import notificationRoutes from "./routes/notifications.js";
import Slot from "./models/Slot.js";
import User from "./models/User.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("MongoDB Connected")
        const count = await Slot.countDocuments();
        if (count === 0) {
            const slots = [
                { slotNumber: 1, occupied: false },
                { slotNumber: 2, occupied: false },
                { slotNumber: 3, occupied: false },
            ];
            await Slot.insertMany(slots);
            console.log("Seeded 3 parking slots successfully");
        } else {
            console.log(`${count} parking slots already exist`);
        }
        const countU = await User.countDocuments();
        if (countU === 0) {
            const users = [
                { name: "Rajat Agrawal",email:"rajatagrawal300@gmail.com",password:"123",role:"admin",notificationEmail:"rajatagrawal300@gmail.com"},
                { name: "Amrit Sundarka",email:"pandtechofficial@gmail.com",password:"123",role:"user",notificationEmail:"pandtechofficial@gmail.com"},
            ];
            await User.insertMany(users);
            console.log("Seeded 2 Users successfully");
        } else {
            console.log(`${countU} Users already exist`);
        }

    })
    .catch(err => console.error("MongoDB Error:", err));

app.use("/api/users", userRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/rfid", rfidRoutes);
app.use("/api/notifications", notificationRoutes);
import systemRoutes from "./routes/system.js";
app.use("/api/system", systemRoutes);

app.get("/", (req, res) => res.send("Parking System API is running"));

app.listen(process.env.PORT, () =>
    console.log(`Server running on port ${process.env.PORT}`)
);
