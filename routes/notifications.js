import express from "express";
import sendMail from "../utils/sendMail.js";
const router = express.Router();

router.post("/", async (req, res) => {
  const { to, message } = req.body;
  await sendMail(to, message);
  res.json({ message: "Sent" });
});

export default router;
