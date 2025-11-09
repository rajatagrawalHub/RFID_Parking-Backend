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

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil((user.lockedUntil - new Date()) / 60000);
      return res.status(403).json({
        message: `Account locked. Try again after ${remaining} minute(s).`,
      });
    }

    const isMatch = user.password === password;
    if (!isMatch) {
      user.failedAttempts += 1;

      if (user.failedAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 2 * 60 * 1000);
        await user.save();
        return res
          .status(403)
          .json({ message: "Account locked for 2 minutes due to multiple failures." });
      }

      await user.save();
      return res.status(401).json({
        message: `Invalid credentials. Attempts left: ${5 - user.failedAttempts}`,
      });
    }

    user.failedAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
