import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.get("/", async (_, res) => {
  const users = await User.find();
  res.json(users);
});

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.findOne({ email })) return res.status(400).json({ message: "User exists" });
  const user = await User.create({ name, email, password, notificationEmail: email });
  res.json(user);
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });
  res.json(user);
});

export default router;
