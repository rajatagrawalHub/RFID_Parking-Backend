import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

export default async function sendMail(to, text) {
//   try {
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to,
//       subject: "Parking Notification",
//       text,
//     });
//     console.log(`Mail Sent to ${to}`);
//   } catch (err) {
//     console.error("Email error:", err.message);
//   }
}
